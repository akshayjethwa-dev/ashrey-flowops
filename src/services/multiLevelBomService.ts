// src/services/multiLevelBomService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {
  MultiLevelBom,
  BomRevision,
  MultiLevelBomNode,
  EngineeringChangeOrder,
  WhereUsedResult,
  WhereUsedItem,
  BomRevisionDiff,
  BomRevisionDiffItem,
  BomRevisionStatus,
  EcoStatus
} from '../types/multiLevelBom';
import { logActivityEvent } from '../utils/activityLogger';

// ── Recursive Calculations ──────────────────────────────────────

/**
 * Calculates rolled-up cost of any node:
 * If node has children, rolledUpCost = sum of (child.rolledUpCost * child.quantityPerParent) + direct node unitCost.
 * If leaf node, rolledUpCost = unitCost.
 */
export function calculateRollUpCost(node: MultiLevelBomNode): number {
  if (!node.children || node.children.length === 0) {
    const directCost = Number(node.unitCost) || 0;
    const scrapMultiplier = 1 + ((node.scrapFactorPercent || 0) / 100);
    const leafCost = Math.round(directCost * scrapMultiplier * 100) / 100;
    node.extendedCost = Math.round(leafCost * node.quantityPerParent * 100) / 100;
    node.rolledUpCost = leafCost;
    return leafCost;
  }

  let childTotal = 0;
  for (const child of node.children) {
    const childUnitRolled = calculateRollUpCost(child);
    childTotal += childUnitRolled * child.quantityPerParent;
  }

  const directProcessingCost = Number(node.unitCost) || 0;
  const totalNodeUnitCost = childTotal + directProcessingCost;
  node.extendedCost = Math.round(totalNodeUnitCost * node.quantityPerParent * 100) / 100;
  node.rolledUpCost = Math.round(totalNodeUnitCost * 100) / 100;
  return node.rolledUpCost;
}

/**
 * Counts all descendant components under this node
 */
export function countComponents(node: MultiLevelBomNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + node.children.reduce((acc, c) => acc + countComponents(c), 0);
}

/**
 * Computes maximum hierarchical nesting depth
 */
export function getMaxDepth(node: MultiLevelBomNode, currentDepth = 0): number {
  if (!node.children || node.children.length === 0) return currentDepth;
  return Math.max(...node.children.map(c => getMaxDepth(c, currentDepth + 1)));
}

/**
 * Flattens N-level tree into an indented tabular sequence
 */
export function flattenBomTree(
  node: MultiLevelBomNode,
  parentPath: string[] = []
): (MultiLevelBomNode & { path: string[]; depth: number })[] {
  const currentPath = [...parentPath, node.partNumber];
  const list: (MultiLevelBomNode & { path: string[]; depth: number })[] = [
    { ...node, path: currentPath, depth: node.level }
  ];

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      list.push(...flattenBomTree(child, currentPath));
    }
  }

  return list;
}

/**
 * Time-travel Effectivity Filter:
 * Returns a cloned tree containing only nodes active as of the provided date.
 */
export function filterBomByAsOfDate(
  node: MultiLevelBomNode,
  asOfDate: string
): MultiLevelBomNode | null {
  const targetTime = new Date(asOfDate).getTime();

  // Check node self effectivity
  if (node.effectiveFrom && new Date(node.effectiveFrom).getTime() > targetTime) {
    return null; // Not yet effective
  }
  if (node.effectiveTo && new Date(node.effectiveTo).getTime() < targetTime) {
    return null; // Expired / superseded
  }

  const clonedNode: MultiLevelBomNode = { ...node };

  if (node.children && node.children.length > 0) {
    clonedNode.children = node.children
      .map(child => filterBomByAsOfDate(child, asOfDate))
      .filter((c): c is MultiLevelBomNode => c !== null);
  }

  return clonedNode;
}

/**
 * Revision Diff Comparison:
 * Compares two BOM revisions and identifies added, removed, modified, and unchanged items.
 */
export function diffBomRevisions(
  oldRev: BomRevision,
  newRev: BomRevision
): BomRevisionDiff {
  const oldFlat = flattenBomTree(oldRev.rootNode);
  const newFlat = flattenBomTree(newRev.rootNode);

  const oldMap = new Map(oldFlat.map(item => [item.partNumber, item]));
  const newMap = new Map(newFlat.map(item => [item.partNumber, item]));

  const diffItems: BomRevisionDiffItem[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  // Check items in new revision
  for (const [partNo, newItem] of newMap.entries()) {
    const oldItem = oldMap.get(partNo);

    if (!oldItem) {
      addedCount++;
      diffItems.push({
        id: `diff_${partNo}_add`,
        partNumber: newItem.partNumber,
        partName: newItem.partName,
        level: newItem.level,
        changeType: 'added',
        newQty: newItem.quantityPerParent,
        newCost: newItem.unitCost,
        newMaterial: newItem.materialGrade,
        notes: `Component introduced in ${newRev.revision}`
      });
    } else {
      const isQtyChanged = oldItem.quantityPerParent !== newItem.quantityPerParent;
      const isCostChanged = oldItem.unitCost !== newItem.unitCost;
      const isMatChanged = oldItem.materialGrade !== newItem.materialGrade;

      if (isQtyChanged || isCostChanged || isMatChanged) {
        modifiedCount++;
        const changes: string[] = [];
        if (isQtyChanged) changes.push(`Qty: ${oldItem.quantityPerParent} → ${newItem.quantityPerParent}`);
        if (isCostChanged) changes.push(`Cost: ₹${oldItem.unitCost} → ₹${newItem.unitCost}`);
        if (isMatChanged) changes.push(`Mat: ${oldItem.materialGrade || '—'} → ${newItem.materialGrade}`);

        diffItems.push({
          id: `diff_${partNo}_mod`,
          partNumber: newItem.partNumber,
          partName: newItem.partName,
          level: newItem.level,
          changeType: 'modified',
          oldQty: oldItem.quantityPerParent,
          newQty: newItem.quantityPerParent,
          oldCost: oldItem.unitCost,
          newCost: newItem.unitCost,
          oldMaterial: oldItem.materialGrade,
          newMaterial: newItem.materialGrade,
          notes: changes.join(' | ')
        });
      } else {
        diffItems.push({
          id: `diff_${partNo}_unc`,
          partNumber: newItem.partNumber,
          partName: newItem.partName,
          level: newItem.level,
          changeType: 'unchanged',
          oldQty: oldItem.quantityPerParent,
          newQty: newItem.quantityPerParent,
          oldCost: oldItem.unitCost,
          newCost: newItem.unitCost
        });
      }
    }
  }

  // Check removed items
  for (const [partNo, oldItem] of oldMap.entries()) {
    if (!newMap.has(partNo)) {
      removedCount++;
      diffItems.push({
        id: `diff_${partNo}_rem`,
        partNumber: oldItem.partNumber,
        partName: oldItem.partName,
        level: oldItem.level,
        changeType: 'removed',
        oldQty: oldItem.quantityPerParent,
        oldCost: oldItem.unitCost,
        oldMaterial: oldItem.materialGrade,
        notes: `Discontinued in ${newRev.revision}`
      });
    }
  }

  const costDelta = (newRev.rolledUpCost || 0) - (oldRev.rolledUpCost || 0);

  return {
    oldRevision: oldRev.revision,
    newRevision: newRev.revision,
    diffItems,
    costDifference: Math.round(costDelta * 100) / 100,
    componentsAddedCount: addedCount,
    componentsRemovedCount: removedCount,
    componentsModifiedCount: modifiedCount
  };
}

/**
 * Where-Used Lookup Engine:
 * Searches across all BOMs and revisions to find where a component/raw material is used.
 */
export function findWhereUsed(
  boms: MultiLevelBom[],
  queryPartNumber: string
): WhereUsedResult {
  const qClean = queryPartNumber.trim().toLowerCase();
  const usages: WhereUsedItem[] = [];
  const topAssembliesSet = new Set<string>();

  const nowTime = Date.now();

  for (const bom of boms) {
    for (const rev of bom.revisions) {
      function traverse(node: MultiLevelBomNode, parentNode: MultiLevelBomNode | null) {
        const isMatch =
          node.partNumber.toLowerCase() === qClean ||
          node.partNumber.toLowerCase().includes(qClean) ||
          node.partName.toLowerCase().includes(qClean) ||
          (node.materialGrade && node.materialGrade.toLowerCase().includes(qClean));

        if (isMatch && parentNode) {
          topAssembliesSet.add(bom.assemblyPartNumber);

          const isEffectiveFromOk = !rev.effectiveFrom || new Date(rev.effectiveFrom).getTime() <= nowTime;
          const isEffectiveToOk = !rev.effectiveTo || new Date(rev.effectiveTo).getTime() >= nowTime;
          const isActiveNow = rev.status === 'released' && isEffectiveFromOk && isEffectiveToOk;

          usages.push({
            bomId: bom.id,
            topAssemblyPartNumber: bom.assemblyPartNumber,
            topAssemblyName: bom.assemblyName,
            parentPartNumber: parentNode.partNumber,
            parentPartName: parentNode.partName,
            level: node.level,
            quantityUsed: node.quantityPerParent,
            unit: node.unit,
            revision: rev.revision,
            revisionStatus: rev.status,
            isDirectParent: parentNode.level === 0,
            effectiveFrom: rev.effectiveFrom,
            effectiveTo: rev.effectiveTo,
            isActiveNow
          });
        }

        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            traverse(child, node);
          }
        }
      }

      traverse(rev.rootNode, null);
    }
  }

  return {
    searchedPartNumber: queryPartNumber,
    totalUsages: usages.length,
    topAssembliesCount: topAssembliesSet.size,
    usages
  };
}

// ── Realistic SME Master Seed Data ──────────────────────────────

export function getSeedMultiLevelBoms(tenantId: string): MultiLevelBom[] {
  // 1. Industrial Planetary Gearbox ASM-GBX-500
  const rootGbxRevA: MultiLevelBomNode = {
    id: 'node_gbx_revA_0',
    partNumber: 'ASM-GBX-500',
    partName: 'Planetary Gearbox Assembly 500Nm (Ratio 1:16)',
    description: 'High torque planetary gear reducer for automated conveyor and crane drives',
    level: 0,
    itemType: 'assembly',
    quantityPerParent: 1,
    unit: 'set',
    unitCost: 1500, // Assembly labor
    workCenterOrSupplier: 'Main Mechanical Assembly Line Cell 01',
    drawingNumber: 'DWG-GBX-500-001',
    drawingRevision: 'A.0',
    children: [
      {
        id: 'node_gbx_A_1',
        partNumber: 'SA-GBX-SUN-01',
        partName: 'Sun & Planet Gear Cartridge Module',
        description: 'Hardened planetary cluster with high-precision ground teeth',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 850,
        workCenterOrSupplier: 'Gear Sub-Assembly Bay',
        children: [
          {
            id: 'node_gbx_A_1_1',
            partNumber: 'PRT-SUN-18T',
            partName: 'Sun Gear Shaft 18T (Module 2.5)',
            description: 'Case hardened central sun gear shaft with spline drive input',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'EN353 / 20MnCr5 Alloy Steel',
            scrapFactorPercent: 2,
            unitCost: 1850,
            leadTimeDays: 7,
            workCenterOrSupplier: 'CNC Gear Hobbing & Induction Hardening Cell',
            isSubcontracted: true,
            subcontractorName: 'Pragati Heat Treaters (Pvt) Ltd'
          },
          {
            id: 'node_gbx_A_1_2',
            partNumber: 'PRT-PLN-36T',
            partName: 'Planet Gears 36T (Module 2.5)',
            description: 'Precision shaved and ground planet gear (3x per gearbox)',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 3,
            unit: 'pcs',
            materialGrade: '20MnCr5 Forged Round Billet',
            scrapFactorPercent: 3,
            unitCost: 1200,
            leadTimeDays: 6,
            workCenterOrSupplier: 'CNC Turning & 4-Axis Milling Bay',
            children: [
              {
                id: 'node_gbx_A_1_2_1',
                partNumber: 'STD-BRG-HK1816',
                partName: 'Drawn Cup Needle Roller Bearings HK 1816',
                description: 'Needle roller cage bearings for planet pin journals',
                level: 3,
                itemType: 'bought_out',
                quantityPerParent: 2, // 2 per gear = 6 total
                unit: 'pcs',
                unitCost: 145,
                leadTimeDays: 2,
                workCenterOrSupplier: 'SKF / INA Authorized Distributor'
              },
              {
                id: 'node_gbx_A_1_2_2',
                partNumber: 'STD-PIN-D12X45',
                partName: 'Hardened Ground Planet Dowel Pin Ø12x45mm',
                description: 'DIN 6325 hardened steel dowel pins (m6 tolerance)',
                level: 3,
                itemType: 'hardware',
                quantityPerParent: 1,
                unit: 'pcs',
                materialGrade: '100Cr6 Hardened Tool Steel (60 HRC)',
                unitCost: 65,
                leadTimeDays: 1,
                workCenterOrSupplier: 'Fastener Stores'
              }
            ]
          },
          {
            id: 'node_gbx_A_1_3',
            partNumber: 'PRT-CAR-FLG-01',
            partName: 'Triple-Slot Planet Carrier Flange',
            description: 'Machined ductile iron carrier with broached spline hub',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'SG Iron 600/3 Graded Casting Blank',
            scrapFactorPercent: 2,
            unitCost: 2400,
            leadTimeDays: 8,
            workCenterOrSupplier: 'Doosan Puma CNC Lathe Cell'
          }
        ]
      },
      {
        id: 'node_gbx_A_2',
        partNumber: 'SA-GBX-RNG-02',
        partName: 'Ring Gear & Outer Shell Housing Module',
        description: 'Internal helical gear casing and mounting flanges',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 1100,
        workCenterOrSupplier: 'Heavy Machining & Broaching Bay',
        children: [
          {
            id: 'node_gbx_A_2_1',
            partNumber: 'PRT-RNG-72T',
            partName: 'Internal Ring Gear Ring 72T (Module 2.5)',
            description: 'Deep internal gear shaped and nitrided casing liner',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: '42CrMo4 / EN19 Annealed Ring Forging',
            unitCost: 4800,
            leadTimeDays: 10,
            workCenterOrSupplier: 'Lorenz CNC Internal Gear Shaper #01'
          },
          {
            id: 'node_gbx_A_2_2',
            partNumber: 'PRT-HOU-MN-01',
            partName: 'Main Gearbox Outer Shell Body',
            description: 'Finned heavy duty cast iron enclosure with oil ports',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'FG 260 Gray Cast Iron',
            scrapFactorPercent: 1.5,
            unitCost: 3200,
            leadTimeDays: 9,
            workCenterOrSupplier: 'Mazak 4-Axis Horizontal Machining Center'
          }
        ]
      },
      {
        id: 'node_gbx_A_3',
        partNumber: 'SA-GBX-SFT-03',
        partName: 'Output Drive Shaft & Bearing Cartridge',
        description: 'Heavy duty keyed output shaft with dual preloaded bearings',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 650,
        workCenterOrSupplier: 'Shaft Turning Cell',
        children: [
          {
            id: 'node_gbx_A_3_1',
            partNumber: 'PRT-SFT-OUT-45',
            partName: 'Drive Output Shaft Ø45mm x 280mm Keyed',
            description: 'Turned and induction hardened bearing journals with DIN 6885 keyway',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'EN19 Normalized / AISI 4140 Bright Round Bar',
            scrapFactorPercent: 2,
            unitCost: 2650,
            leadTimeDays: 5,
            workCenterOrSupplier: 'Jones & Shipman Cylindrical Grinding Cell'
          },
          {
            id: 'node_gbx_A_3_2',
            partNumber: 'STD-BRG-6209ZZ',
            partName: 'Deep Groove Ball Bearings 6209-2RS (Ø45x85x19)',
            description: 'Rubber sealed high-speed radial ball bearings',
            level: 2,
            itemType: 'bought_out',
            quantityPerParent: 2,
            unit: 'pcs',
            unitCost: 420,
            leadTimeDays: 2,
            workCenterOrSupplier: 'FAG / Schaeffler Bearings'
          },
          {
            id: 'node_gbx_A_3_3',
            partNumber: 'STD-SEAL-TC45X65',
            partName: 'Rotary Shaft Oil Seal 45 x 65 x 8mm',
            description: 'Double-lip Viton / NBR 70 rotary shaft oil seal with garter spring',
            level: 2,
            itemType: 'hardware',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'Viton FKM / Spring Steel',
            unitCost: 185,
            leadTimeDays: 1,
            workCenterOrSupplier: 'Parker / Freudenberg Oil Seals'
          }
        ]
      },
      {
        id: 'node_gbx_A_4',
        partNumber: 'SA-GBX-HDW-04',
        partName: 'Fasteners, Oil Seals & Shim Hardware Pack',
        description: 'Casing bolts, magnetic drain plugs, sight glasses, and copper washers',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 200,
        workCenterOrSupplier: 'Kitting Bay',
        children: [
          {
            id: 'node_gbx_A_4_1',
            partNumber: 'STD-FST-M10X45-10.9',
            partName: 'Hex Socket Head Cap Screws M10 x 45mm (Gr 10.9)',
            description: 'Black oxide high-tensile casing assembly bolts',
            level: 2,
            itemType: 'hardware',
            quantityPerParent: 12,
            unit: 'pcs',
            materialGrade: 'High Tensile Alloy Steel Gr 10.9',
            unitCost: 24,
            leadTimeDays: 1,
            workCenterOrSupplier: 'Unbrako / TVS Fasteners'
          },
          {
            id: 'node_gbx_A_4_2',
            partNumber: 'STD-PLG-M14X1.5',
            partName: 'Magnetic Oil Drain Plug M14 x 1.5 with Neodymium Magnet',
            description: 'Catches metallic swarf during planetary break-in period',
            level: 2,
            itemType: 'hardware',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'Brass with Neodymium Insert',
            unitCost: 95,
            leadTimeDays: 2,
            workCenterOrSupplier: 'Hydraulic Fittings'
          },
          {
            id: 'node_gbx_A_4_3',
            partNumber: 'PRT-GSK-0.2MM',
            partName: 'Precision Pre-Cut Casing Flange Shim Gasket 0.2mm',
            description: 'Impervious cellulose fiber gasket for oil retention',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 2,
            unit: 'pcs',
            materialGrade: 'Klingersil C-4400 Non-Asbestos Sheet',
            unitCost: 55,
            leadTimeDays: 2,
            workCenterOrSupplier: 'Laser Gasket Cell'
          }
        ]
      }
    ]
  };

  calculateRollUpCost(rootGbxRevA);

  // Rev B (Current Released Revision - Enhanced Planet Gears & Cost optimized)
  const rootGbxRevB: MultiLevelBomNode = JSON.parse(JSON.stringify(rootGbxRevA));
  rootGbxRevB.drawingRevision = 'B.0';
  // Optimization: Carrier flange weight reduced from 2400 to 2150 INR via web pocketing
  const carrierNode = rootGbxRevB.children?.[0].children?.find(c => c.partNumber === 'PRT-CAR-FLG-01');
  if (carrierNode) {
    carrierNode.unitCost = 2150;
    carrierNode.description = 'Weight-optimized ductile iron carrier with CNC scalloped pockets';
    carrierNode.notes = 'ECO-2026-0031 implemented: 10.4% mass reduction';
  }
  calculateRollUpCost(rootGbxRevB);

  // Rev C (Draft - in review with Ceramic Bearings)
  const rootGbxRevC: MultiLevelBomNode = JSON.parse(JSON.stringify(rootGbxRevB));
  rootGbxRevC.drawingRevision = 'C.0';
  const sealNode = rootGbxRevC.children?.[2].children?.find(c => c.partNumber === 'STD-SEAL-TC45X65');
  if (sealNode) {
    sealNode.partNumber = 'STD-SEAL-TC45X65-PTFE';
    sealNode.partName = 'Heavy-Duty PTFE Labyrinth Rotary Seal 45x65';
    sealNode.unitCost = 280;
    sealNode.description = 'Low friction PTFE lip seal for extended MTBF (>20,000 hrs)';
  }
  calculateRollUpCost(rootGbxRevC);

  const bomGbx: MultiLevelBom = {
    id: `mlbom_gbx_500_${tenantId}`,
    tenantId,
    assemblyPartNumber: 'ASM-GBX-500',
    assemblyName: 'Industrial Planetary Speed Reducer 500Nm (1:16)',
    description: 'Heavy duty 4-tier planetary speed reducer engineered for steel mill conveyors and slewing drives',
    category: 'Power Transmission & Gearboxes',
    currentRevisionId: 'rev_gbx_B',
    activeRevisionCode: 'Rev B.0',
    status: 'released',
    tags: ['ISO 6336', 'Planetary', 'AGMA 12', 'Heavy Duty'],
    revisions: [
      {
        id: 'rev_gbx_A',
        bomId: `mlbom_gbx_500_${tenantId}`,
        revision: 'Rev A.0',
        status: 'superseded',
        effectiveFrom: '2025-01-01',
        effectiveTo: '2026-04-30',
        changeReason: 'Initial baseline production release for commercial series production',
        rootNode: rootGbxRevA,
        rolledUpCost: rootGbxRevA.rolledUpCost || 22450,
        totalComponentCount: countComponents(rootGbxRevA),
        maxLevelDepth: getMaxDepth(rootGbxRevA),
        createdAt: '2025-01-01T08:00:00Z',
        createdBy: 'eng_usr_01',
        createdByName: 'Arun Varma (Lead PLM Architect)',
        approvedAt: '2025-01-05T12:00:00Z',
        approvedByName: 'Rajesh Sharma (Head of Engineering)',
        releaseNotes: 'Initial production baseline verified against AGMA 2001-D04 rating criteria.'
      },
      {
        id: 'rev_gbx_B',
        bomId: `mlbom_gbx_500_${tenantId}`,
        revision: 'Rev B.0',
        status: 'released',
        effectiveFrom: '2026-05-01',
        effectiveTo: undefined, // Currently active
        changeReason: 'Weight reduction of planet carrier and transition to domestic forging supplier (ECO-2026-0031)',
        ecoNumber: 'ECO-2026-0031',
        ecoId: 'eco_gbx_0031',
        rootNode: rootGbxRevB,
        rolledUpCost: rootGbxRevB.rolledUpCost || 21850,
        totalComponentCount: countComponents(rootGbxRevB),
        maxLevelDepth: getMaxDepth(rootGbxRevB),
        createdAt: '2026-04-15T09:30:00Z',
        createdBy: 'eng_usr_02',
        createdByName: 'Sneha Kulkarni (Senior Mechanical Designer)',
        approvedAt: '2026-04-28T16:00:00Z',
        approvedByName: 'Rajesh Sharma (Head of Engineering)',
        releaseNotes: 'Reduced carrier casting weight by 10.4%, shaving ₹250/unit while maintaining safety factor SF > 2.2.'
      },
      {
        id: 'rev_gbx_C',
        bomId: `mlbom_gbx_500_${tenantId}`,
        revision: 'Rev C.0',
        status: 'in_review',
        effectiveFrom: '2026-11-01',
        changeReason: 'Upgrade to PTFE rotary seals and needle bearing lubrication grooves for high temperature duty',
        ecoNumber: 'ECO-2026-0042',
        ecoId: 'eco_gbx_0042',
        rootNode: rootGbxRevC,
        rolledUpCost: rootGbxRevC.rolledUpCost || 22100,
        totalComponentCount: countComponents(rootGbxRevC),
        maxLevelDepth: getMaxDepth(rootGbxRevC),
        createdAt: '2026-09-10T11:00:00Z',
        createdBy: 'eng_usr_02',
        createdByName: 'Sneha Kulkarni (Senior Mechanical Designer)',
        releaseNotes: 'Pending final sign-off from QA and Production Shop Floor lead.'
      }
    ],
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'eng_usr_01',
    createdByName: 'Arun Varma (Lead PLM Architect)'
  };

  // 2. High-Pressure Centrifugal Slurry Pump ASM-PMP-200
  const rootPmpRevA: MultiLevelBomNode = {
    id: 'node_pmp_0',
    partNumber: 'ASM-PMP-200',
    partName: 'High-Pressure Centrifugal Slurry Pump 200m³/h',
    description: 'Abrasion-resistant centrifugal slurry pump with high-chrome wet end for mining tailings',
    level: 0,
    itemType: 'assembly',
    quantityPerParent: 1,
    unit: 'set',
    unitCost: 3500, // Assembly and hydrostatic pressure testing
    workCenterOrSupplier: 'Pump Test Rig & Assembly Bay #01',
    drawingNumber: 'DWG-PMP-200-001',
    drawingRevision: 'A.0',
    children: [
      {
        id: 'node_pmp_1',
        partNumber: 'SA-PMP-WET-01',
        partName: 'High-Chrome Wet End Fluid Module',
        description: '27% High-Chrome iron impeller, throatbush and volute liner casing',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 2200,
        workCenterOrSupplier: 'Heavy CNC Boring & Grinding Bay',
        children: [
          {
            id: 'node_pmp_1_1',
            partNumber: 'PRT-IMP-5V-270',
            partName: 'Closed 5-Vane Slurry Impeller Ø270mm',
            description: 'Dynamically balanced high-chrome casting with back pump-out vanes',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'High-Chrome White Cast Iron (ASTM A532 Class III Type A - 62 HRC)',
            scrapFactorPercent: 3,
            unitCost: 14500,
            leadTimeDays: 14,
            workCenterOrSupplier: 'Doosan Puma 700 Lathe & Dynamic Balancing Rig'
          },
          {
            id: 'node_pmp_1_2',
            partNumber: 'PRT-VOL-CSG-01',
            partName: 'Volute Outer Casing Split Shell Half',
            description: 'Ductile iron outer armor casing reinforced for 25 bar operating pressure',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 2,
            unit: 'pcs',
            materialGrade: 'SG Iron 500/7 Graded Casting Blank',
            scrapFactorPercent: 2,
            unitCost: 11200,
            leadTimeDays: 12,
            workCenterOrSupplier: 'Mazak 5-Axis Heavy Machining Center'
          },
          {
            id: 'node_pmp_1_3',
            partNumber: 'PRT-THB-RNG-01',
            partName: 'Throatbush & Front Suction Wear Ring',
            description: 'Adjustable axial clearance high chrome suction wear plate',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'High-Chrome White Cast Iron 27% Cr',
            unitCost: 5600,
            leadTimeDays: 8,
            workCenterOrSupplier: 'CNC Turning Cell'
          }
        ]
      },
      {
        id: 'node_pmp_2',
        partNumber: 'SA-PMP-SEAL-02',
        partName: 'Cartridge Mechanical Seal Sub-Assembly',
        description: 'Single cartridge slurry mechanical seal with flush ports',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 800,
        workCenterOrSupplier: 'Clean Room Seal Assembly Cell',
        children: [
          {
            id: 'node_pmp_2_1',
            partNumber: 'STD-SEAL-SIC-50',
            partName: 'Silicon Carbide (SiC vs SiC) Lapped Seal Faces Ø50mm',
            description: 'Diamond ground optical flatness seal rings',
            level: 2,
            itemType: 'bought_out',
            quantityPerParent: 1,
            unit: 'set',
            unitCost: 6800,
            leadTimeDays: 5,
            workCenterOrSupplier: 'EagleBurgmann / John Crane'
          },
          {
            id: 'node_pmp_2_2',
            partNumber: 'STD-SPR-HAST-C',
            partName: 'Hastelloy C-276 Multi-Springs Set (8x)',
            description: 'Corrosion-proof wave spring compression pack',
            level: 2,
            itemType: 'hardware',
            quantityPerParent: 1,
            unit: 'set',
            materialGrade: 'Hastelloy C-276 / N10276',
            unitCost: 1400,
            leadTimeDays: 3,
            workCenterOrSupplier: 'Specialty Spring Alloys'
          }
        ]
      },
      {
        id: 'node_pmp_3',
        partNumber: 'SA-PMP-BRG-03',
        partName: 'Rigid Heavy-Duty Bearing Frame Pedestal',
        description: 'Oil lubricated cast iron bearing pedestal with dual lip seals',
        level: 1,
        itemType: 'sub_assembly',
        quantityPerParent: 1,
        unit: 'set',
        unitCost: 1800,
        workCenterOrSupplier: 'Bearing Pedestal Assembly Cell',
        children: [
          {
            id: 'node_pmp_3_1',
            partNumber: 'PRT-PED-CSG-01',
            partName: 'Bearing Pedestal Bracket Frame Housing',
            description: 'Rigid cast base with precision inline bored bearing seats',
            level: 2,
            itemType: 'manufactured',
            quantityPerParent: 1,
            unit: 'pcs',
            materialGrade: 'FG 260 Gray Cast Iron',
            unitCost: 8900,
            leadTimeDays: 7,
            workCenterOrSupplier: 'Precision Line Boring Bay'
          },
          {
            id: 'node_pmp_3_2',
            partNumber: 'STD-BRG-22212E',
            partName: 'Spherical Roller Bearings 22212E (Ø60x110x28mm)',
            description: 'High dynamic capacity double-row self-aligning bearings',
            level: 2,
            itemType: 'bought_out',
            quantityPerParent: 2,
            unit: 'pcs',
            unitCost: 1850,
            leadTimeDays: 2,
            workCenterOrSupplier: 'SKF Heavy Industrial Bearings'
          }
        ]
      }
    ]
  };

  calculateRollUpCost(rootPmpRevA);

  const bomPmp: MultiLevelBom = {
    id: `mlbom_pmp_200_${tenantId}`,
    tenantId,
    assemblyPartNumber: 'ASM-PMP-200',
    assemblyName: 'High-Pressure Centrifugal Slurry Pump 200m³/h',
    description: 'Heavy duty slurry pump built for abrasive coal and iron ore washeries',
    category: 'Pumps & Fluid Handling',
    currentRevisionId: 'rev_pmp_A',
    activeRevisionCode: 'Rev A.0',
    status: 'released',
    tags: ['Mining', 'Slurry', 'High-Chrome', 'ISO 9001'],
    revisions: [
      {
        id: 'rev_pmp_A',
        bomId: `mlbom_pmp_200_${tenantId}`,
        revision: 'Rev A.0',
        status: 'released',
        effectiveFrom: '2025-06-01',
        effectiveTo: undefined,
        changeReason: 'Initial series production release',
        rootNode: rootPmpRevA,
        rolledUpCost: rootPmpRevA.rolledUpCost || 68500,
        totalComponentCount: countComponents(rootPmpRevA),
        maxLevelDepth: getMaxDepth(rootPmpRevA),
        createdAt: '2025-06-01T09:00:00Z',
        createdBy: 'eng_usr_01',
        createdByName: 'Arun Varma (Lead PLM Architect)',
        approvedAt: '2025-06-10T11:00:00Z',
        approvedByName: 'Rajesh Sharma (Head of Engineering)',
        releaseNotes: 'Hydrostatic pressure tested to 35 bar burst rating.'
      }
    ],
    createdAt: '2025-06-01T09:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'eng_usr_01',
    createdByName: 'Arun Varma (Lead PLM Architect)'
  };

  return [bomGbx, bomPmp];
}

export function getSeedEcos(tenantId: string): EngineeringChangeOrder[] {
  return [
    {
      id: 'eco_gbx_0031',
      tenantId,
      ecoNumber: 'ECO-2026-0031',
      title: 'Planet Carrier Flange Scallop Weight Optimization',
      description: 'Remove dead weight from ductile iron casting through CNC web pockets to reduce inertia and raw material cost by 10.4%.',
      reason: 'cost_reduction',
      severity: 'medium',
      bomId: `mlbom_gbx_500_${tenantId}`,
      assemblyPartNumber: 'ASM-GBX-500',
      assemblyName: 'Planetary Gearbox Assembly 500Nm',
      currentRevision: 'Rev A.0',
      targetRevision: 'Rev B.0',
      proposedEffectiveDate: '2026-05-01',
      status: 'implemented',
      reviewers: [
        {
          userId: 'usr_eng_mgr',
          name: 'Rajesh Sharma',
          role: 'Engineering Manager',
          status: 'approved',
          comments: 'FEA stress analysis confirms safety factor SF=2.25 remains well above 1.8 requirement.',
          reviewedAt: '2026-04-20T11:30:00Z'
        },
        {
          userId: 'usr_qa_head',
          name: 'Pooja Iyer',
          role: 'Quality Assurance Head',
          status: 'approved',
          comments: 'Coordinate Measuring Machine (CMM) inspection protocol updated for new pocket depths.',
          reviewedAt: '2026-04-22T14:15:00Z'
        },
        {
          userId: 'usr_prod_lead',
          name: 'Dinesh Patel',
          role: 'Production Floor Lead',
          status: 'approved',
          comments: 'Tool path verified on Doosan CNC lathe without cycle time penalty.',
          reviewedAt: '2026-04-25T16:00:00Z'
        }
      ],
      impactSummary: {
        costDelta: -250, // Saved ₹250 per assembly
        partsAdded: 0,
        partsRemoved: 0,
        partsModified: 1,
        scrapRiskNotes: 'Zero scrap risk: old castings cleared from stock prior to switchover date.',
        leadTimeImpactDays: 0,
        affectedAssemblies: ['ASM-GBX-500']
      },
      requestedBy: 'eng_usr_02',
      requestedByName: 'Sneha Kulkarni',
      createdAt: '2026-04-10T10:00:00Z',
      updatedAt: '2026-04-28T16:00:00Z',
      approvedAt: '2026-04-28T16:00:00Z',
      approvedByName: 'Rajesh Sharma',
      implementationNotes: 'Released into shopfloor production traveler as Rev B.0 on May 1, 2026.'
    },
    {
      id: 'eco_gbx_0042',
      tenantId,
      ecoNumber: 'ECO-2026-0042',
      title: 'Upgrade Output Shaft Rotary Seal to PTFE Labyrinth (Rev C.0)',
      description: 'Replace standard NBR/Viton TC rubber lip oil seal with heavy duty PTFE labyrinth seal to handle elevated desert ambient temperatures (+55°C) and extend MTBF to 20,000 hrs.',
      reason: 'quality_improvement',
      severity: 'high',
      bomId: `mlbom_gbx_500_${tenantId}`,
      assemblyPartNumber: 'ASM-GBX-500',
      assemblyName: 'Planetary Gearbox Assembly 500Nm',
      currentRevision: 'Rev B.0',
      targetRevision: 'Rev C.0',
      proposedEffectiveDate: '2026-11-01',
      status: 'pending_approval',
      reviewers: [
        {
          userId: 'usr_eng_mgr',
          name: 'Rajesh Sharma',
          role: 'Engineering Manager',
          status: 'approved',
          comments: 'Bench endurance rig test passed 500-hour continuous run at 110°C oil sump temperature.',
          reviewedAt: '2026-09-28T10:00:00Z'
        },
        {
          userId: 'usr_qa_head',
          name: 'Pooja Iyer',
          role: 'Quality Assurance Head',
          status: 'pending'
        },
        {
          userId: 'usr_prod_lead',
          name: 'Dinesh Patel',
          role: 'Production Floor Lead',
          status: 'pending'
        }
      ],
      impactSummary: {
        costDelta: 95, // +₹95 unit cost increase
        partsAdded: 1,
        partsRemoved: 1,
        partsModified: 0,
        scrapRiskNotes: 'Use up existing 80 pcs of STD-SEAL-TC45X65 in legacy service orders before Nov 1.',
        leadTimeImpactDays: 2,
        affectedAssemblies: ['ASM-GBX-500']
      },
      requestedBy: 'eng_usr_02',
      requestedByName: 'Sneha Kulkarni',
      createdAt: '2026-09-10T11:00:00Z',
      updatedAt: '2026-09-28T10:00:00Z'
    }
  ];
}

// ── Persistence Service ─────────────────────────────────────────

export async function fetchMultiLevelBoms(
  tenantId: string,
  isSandboxMode: boolean = false
): Promise<MultiLevelBom[]> {
  const cacheKey = `flowops_multilevel_boms_${tenantId}`;

  if (isSandboxMode || !db) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      const seeded = getSeedMultiLevelBoms(tenantId);
      localStorage.setItem(cacheKey, JSON.stringify(seeded));
      return seeded;
    } catch (e) {
      console.warn('Error reading cached multi-level BOMs:', e);
      return getSeedMultiLevelBoms(tenantId);
    }
  }

  try {
    const colRef = collection(db, 'tenants', tenantId, 'multiLevelBoms');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MultiLevelBom));
    }
    // Seed to firestore if empty
    const seeded = getSeedMultiLevelBoms(tenantId);
    for (const b of seeded) {
      await setDoc(doc(db, 'tenants', tenantId, 'multiLevelBoms', b.id), b);
    }
    return seeded;
  } catch (e) {
    console.warn('Firestore fetch failed for multiLevelBoms, fallback to local:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : getSeedMultiLevelBoms(tenantId);
  }
}

export async function fetchEngineeringChangeOrders(
  tenantId: string,
  isSandboxMode: boolean = false
): Promise<EngineeringChangeOrder[]> {
  const cacheKey = `flowops_ecos_${tenantId}`;

  if (isSandboxMode || !db) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      const seeded = getSeedEcos(tenantId);
      localStorage.setItem(cacheKey, JSON.stringify(seeded));
      return seeded;
    } catch (e) {
      console.warn('Error reading cached ECOs:', e);
      return getSeedEcos(tenantId);
    }
  }

  try {
    const colRef = collection(db, 'tenants', tenantId, 'engineeringChangeOrders');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as EngineeringChangeOrder));
    }
    const seeded = getSeedEcos(tenantId);
    for (const eco of seeded) {
      await setDoc(doc(db, 'tenants', tenantId, 'engineeringChangeOrders', eco.id), eco);
    }
    return seeded;
  } catch (e) {
    console.warn('Firestore fetch failed for ECOs, fallback to local:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : getSeedEcos(tenantId);
  }
}

export async function saveMultiLevelBom(
  tenantId: string,
  bom: MultiLevelBom,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_multilevel_boms_${tenantId}`;

  // Always update local cache
  try {
    const cached = localStorage.getItem(cacheKey);
    const list: MultiLevelBom[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(b => b.id === bom.id);
    if (idx >= 0) {
      list[idx] = bom;
    } else {
      list.unshift(bom);
    }
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Local cache save failed:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'multiLevelBoms', bom.id), bom);
    } catch (e) {
      console.error('Firestore save failed for BOM:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:multilevel_boms_updated'));
  }
}

export async function saveEngineeringChangeOrder(
  tenantId: string,
  eco: EngineeringChangeOrder,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_ecos_${tenantId}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    const list: EngineeringChangeOrder[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(e => e.id === eco.id);
    if (idx >= 0) {
      list[idx] = eco;
    } else {
      list.unshift(eco);
    }
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Local cache save failed for ECO:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'engineeringChangeOrders', eco.id), eco);
    } catch (e) {
      console.error('Firestore save failed for ECO:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:ecos_updated'));
  }
}

/**
 * Creates a new draft revision branch from an existing revision
 */
export async function branchNewBomRevision(
  tenantId: string,
  bomId: string,
  baseRevisionId: string,
  newRevisionCode: string,
  changeReason: string,
  actor: { userId: string; name: string },
  isSandboxMode: boolean = false
): Promise<{ updatedBom: MultiLevelBom; newRevision: BomRevision }> {
  const allBoms = await fetchMultiLevelBoms(tenantId, isSandboxMode);
  const targetBom = allBoms.find(b => b.id === bomId);
  if (!targetBom) {
    throw new Error(`BOM with ID ${bomId} not found.`);
  }

  const baseRev = targetBom.revisions.find(r => r.id === baseRevisionId);
  if (!baseRev) {
    throw new Error(`Base revision ${baseRevisionId} not found.`);
  }

  // Deep clone root node
  const clonedRoot: MultiLevelBomNode = JSON.parse(JSON.stringify(baseRev.rootNode));
  clonedRoot.drawingRevision = newRevisionCode;

  const newRevId = `rev_${bomId}_${Date.now()}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  const newRevision: BomRevision = {
    id: newRevId,
    bomId: targetBom.id,
    revision: newRevisionCode,
    status: 'draft',
    effectiveFrom: todayIso,
    changeReason,
    rootNode: clonedRoot,
    rolledUpCost: baseRev.rolledUpCost,
    totalComponentCount: baseRev.totalComponentCount,
    maxLevelDepth: baseRev.maxLevelDepth,
    createdAt: new Date().toISOString(),
    createdBy: actor.userId,
    createdByName: actor.name,
    releaseNotes: `Draft revision branched from ${baseRev.revision}.`
  };

  const updatedBom: MultiLevelBom = {
    ...targetBom,
    revisions: [...targetBom.revisions, newRevision],
    updatedAt: new Date().toISOString()
  };

  await saveMultiLevelBom(tenantId, updatedBom, isSandboxMode);

  logActivityEvent({
    tenantId,
    actionType: 'create',
    entityType: 'rfq',
    entityId: bomId,
    actor: {
      userId: actor.userId,
      displayName: actor.name
    },
    description: `Branched new draft revision ${newRevisionCode} for ${targetBom.assemblyPartNumber} (${targetBom.assemblyName}). Reason: ${changeReason}`
  });

  return { updatedBom, newRevision };
}

/**
 * Approve & Release an ECO:
 * Transitions target revision to 'released', updates effectivity dates,
 * supersedes previous active revision, and marks ECO as 'implemented'.
 */
export async function releaseEcoAndImplementBom(
  tenantId: string,
  ecoId: string,
  actor: { userId: string; name: string },
  comments?: string,
  isSandboxMode: boolean = false
): Promise<{ updatedEco: EngineeringChangeOrder; updatedBom: MultiLevelBom }> {
  const allEcos = await fetchEngineeringChangeOrders(tenantId, isSandboxMode);
  const eco = allEcos.find(e => e.id === ecoId);
  if (!eco) {
    throw new Error(`ECO ${ecoId} not found.`);
  }

  const allBoms = await fetchMultiLevelBoms(tenantId, isSandboxMode);
  const targetBom = allBoms.find(b => b.id === eco.bomId);
  if (!targetBom) {
    throw new Error(`BOM ${eco.bomId} associated with ECO not found.`);
  }

  const nowIso = new Date().toISOString();
  const effectiveDate = eco.proposedEffectiveDate || nowIso.slice(0, 10);

  // Update BOM Revisions
  const updatedRevisions = targetBom.revisions.map(rev => {
    if (rev.revision === eco.targetRevision) {
      return {
        ...rev,
        status: 'released' as BomRevisionStatus,
        effectiveFrom: effectiveDate,
        approvedAt: nowIso,
        approvedBy: actor.userId,
        approvedByName: actor.name,
        ecoNumber: eco.ecoNumber,
        ecoId: eco.id,
        releaseNotes: comments || `Implemented per Engineering Change Order #${eco.ecoNumber}.`
      };
    }
    // Supersede previously active released revision
    if (rev.status === 'released' && rev.revision === eco.currentRevision) {
      return {
        ...rev,
        status: 'superseded' as BomRevisionStatus,
        effectiveTo: effectiveDate
      };
    }
    return rev;
  });

  const updatedBom: MultiLevelBom = {
    ...targetBom,
    activeRevisionCode: eco.targetRevision,
    status: 'released',
    revisions: updatedRevisions,
    updatedAt: nowIso
  };

  const updatedEco: EngineeringChangeOrder = {
    ...eco,
    status: 'implemented',
    approvedAt: nowIso,
    approvedByName: actor.name,
    implementationNotes: comments || `Approved and implemented into production baseline as ${eco.targetRevision}.`,
    updatedAt: nowIso
  };

  await saveMultiLevelBom(tenantId, updatedBom, isSandboxMode);
  await saveEngineeringChangeOrder(tenantId, updatedEco, isSandboxMode);

  logActivityEvent({
    tenantId,
    actionType: 'status_change',
    entityType: 'rfq',
    entityId: eco.id,
    actor: {
      userId: actor.userId,
      displayName: actor.name
    },
    description: `Approved & released ECO #${eco.ecoNumber} for ${targetBom.assemblyPartNumber}. Activated ${eco.targetRevision} with effective date ${effectiveDate}.`
  });

  return { updatedEco, updatedBom };
}
