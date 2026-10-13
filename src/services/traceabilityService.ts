// src/services/traceabilityService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import {
  LotRecord,
  LotType,
  LotStatus,
  InspectionStatus,
  CreateMaterialReceiptLotInput,
  QualityInspectionRecord,
  TraceabilityGraph,
  TraceabilityNode,
  TraceDirection,
  RecallReport,
  RecallSeverity,
  RecallDefectType,
  WorkOrderConsumptionLink,
  CustomerDispatchRecord,
  AffectedLocationInventory,
  AffectedWorkOrderSummary,
  AffectedCustomerShipment
} from '../types/traceability';

export const SEED_LOTS = (tenantId: string): LotRecord[] => [
  {
    id: 'lot-rm-412',
    tenantId,
    lotNumber: 'LOT-2026-RM-0412',
    barcode: 'LOT2026RM0412',
    lotType: 'raw_material',
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    materialGrade: 'EN8D (AISI 1045)',
    heatNumber: 'HT-TATA-9942',
    supplierId: 'sup-tata',
    supplierName: 'Tata Prime Steel Ltd.',
    poNumber: 'PO-2026-902',
    grnNumber: 'GRN-2026-0182',
    vendorChallanNo: 'CH-88219',
    vendorLotNumber: 'TAT-COIL-993-B',
    initialQty: 15.0,
    currentQty: 9.0,
    reservedQty: 3.0,
    consumedQty: 6.0,
    quarantinedQty: 0.0,
    unit: 'tonnes',
    unitCost: 68500,
    totalValue: 9.0 * 68500,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-01',
    binCode: 'BIN-RM-A01',
    status: 'released',
    inspectionStatus: 'passed',
    inspectionRecord: {
      id: 'qc-412',
      inspectionNumber: 'QC-2026-0819',
      inspectorId: 'usr-qc-01',
      inspectorName: 'Anand Deshmukh (Lead Met. Inspector)',
      inspectionDate: '2026-04-10T11:30:00Z',
      parameters: [
        { name: 'Tensile Strength (UTS)', specification: '650 - 750 MPa', measuredValue: '715 MPa', status: 'pass' },
        { name: 'Yield Strength (YS)', specification: '≥ 420 MPa', measuredValue: '455 MPa', status: 'pass' },
        { name: 'Carbon Content (C%)', specification: '0.40 - 0.45%', measuredValue: '0.42%', status: 'pass' },
        { name: 'Manganese (Mn%)', specification: '0.70 - 0.90%', measuredValue: '0.78%', status: 'pass' },
        { name: 'Diameter Tolerance', specification: '8.00 ± 0.08 mm', measuredValue: '8.04 mm', status: 'pass' }
      ],
      visualCheckPassed: true,
      mtrNumber: 'MTR-TATA-2026-9942A',
      mtrAttachmentName: 'Tata_Prime_Steel_Mill_Test_Cert_9942.pdf',
      disposition: 'accept',
      notes: 'Clean surface finish with uniform spheroidized pearlite microstructure.',
      certifiedBy: 'Dr. V. Raghavan, Chief Metallurgist'
    },
    manufactureDate: '2026-03-28T00:00:00Z',
    expiryDate: '2027-03-28T00:00:00Z',
    receivedAt: '2026-04-10T09:45:00Z',
    receivedBy: 'usr-store',
    receivedByName: 'Prakash Kunte (Store Keeper)',
    childLotNumbers: ['LOT-2026-FG-0089'],
    workOrderLinks: [
      {
        id: 'wolk-1',
        workOrderId: 'wo-001',
        workOrderNumber: 'WO-2026-001',
        partName: 'Steering Column Shaft — Spec B3',
        operationSequence: 10,
        operationName: 'Induction Billet Heating & Forging',
        workCenterName: 'Forging Cell 1 (1600T Press)',
        consumedQty: 6.0,
        unit: 'tonnes',
        consumedAt: '2026-04-12T08:30:00Z',
        consumedByOperator: 'Ramesh Jadhav',
        resultingFgLotNumber: 'LOT-2026-FG-0089',
        scrapQty: 0.12,
        notes: 'Cold sheared and induction heated to 1150°C. Batch yielded 450 finished forgings.'
      }
    ],
    notes: 'Primary coil shipment received in good condition with shrink wrap intact.',
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-fg-089',
    tenantId,
    lotNumber: 'LOT-2026-FG-0089',
    barcode: 'LOT2026FG0089',
    lotType: 'finished_goods',
    stockItemId: 'stock-fg-steering',
    stockItemCode: 'FG-SCS-003',
    stockItemName: 'Steering Column Shaft — Spec B3 (Forged & Ground)',
    category: 'finished_goods',
    materialGrade: 'EN8D (Hardened & Tempered)',
    initialQty: 450,
    currentQty: 150,
    reservedQty: 0,
    consumedQty: 300,
    quarantinedQty: 0,
    unit: 'units',
    unitCost: 1420,
    totalValue: 150 * 1420,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-fg',
    storeName: 'Finished Goods Dispatch Store',
    binId: 'bin-pune-fg-02',
    binCode: 'RACK-FG-B02',
    status: 'released',
    inspectionStatus: 'passed',
    inspectionRecord: {
      id: 'qc-fg-089',
      inspectionNumber: 'QC-2026-0834',
      inspectorId: 'usr-qc-02',
      inspectorName: 'Sanjay Shinde (Final QC Inspector)',
      inspectionDate: '2026-04-13T16:00:00Z',
      parameters: [
        { name: 'Spline Pitch Runout', specification: '≤ 0.015 mm', measuredValue: '0.009 mm', status: 'pass' },
        { name: 'Core Hardness', specification: '28 - 32 HRC', measuredValue: '30 HRC', status: 'pass' },
        { name: 'Induction Case Depth', specification: '1.8 - 2.2 mm', measuredValue: '2.0 mm', status: 'pass' },
        { name: 'Magnetic Particle Test (MPI)', specification: 'Zero surface cracks', measuredValue: '100% Clear', status: 'pass' }
      ],
      visualCheckPassed: true,
      mtrNumber: 'COC-FLOWOPS-2026-089',
      disposition: 'accept',
      notes: '100% dimensional CMM check verified. Certified for Tier-1 OEM delivery.'
    },
    manufactureDate: '2026-04-13T14:00:00Z',
    receivedAt: '2026-04-13T16:30:00Z',
    receivedBy: 'usr-operator-01',
    receivedByName: 'Suresh Patil (Production Supervisor)',
    producedFromWorkOrderId: 'wo-001',
    producedFromOrderNumber: 'WO-2026-001',
    parentLotNumbers: ['LOT-2026-RM-0412'],
    dispatchedToCustomers: [
      {
        id: 'dsp-01',
        salesOrderNumber: 'SO-2026-0042',
        customerName: 'Bajaj Auto Ltd. — Chakan Assembly Line 2',
        invoiceNumber: 'INV-2026-118',
        dispatchDate: '2026-04-14T10:00:00Z',
        dispatchedQty: 300,
        unit: 'units',
        trackingNumber: 'LR-TCI-882194',
        destinationCity: 'Pune'
      }
    ],
    notes: 'High-precision automotive steering shaft. 300 units dispatched to Bajaj Auto assembly line; 150 units held in rack B02 for safety stock buffer.',
    createdAt: '2026-04-13T17:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-rm-390',
    tenantId,
    lotNumber: 'LOT-2026-RM-0390',
    barcode: 'LOT2026RM0390',
    lotType: 'raw_material',
    stockItemId: 'stock-2',
    stockItemCode: 'DB-2040',
    stockItemName: 'Die Steel Round Bar — EN24 High Nickel',
    category: 'raw_material',
    materialGrade: 'EN24 (AISI 4340)',
    heatNumber: 'HT-JSP-8821',
    supplierId: 'sup-jindal',
    supplierName: 'Jindal Steel & Power Ltd.',
    poNumber: 'PO-2026-880',
    grnNumber: 'GRN-2026-0144',
    vendorChallanNo: 'CH-49102',
    vendorLotNumber: 'JSP-EN24-901',
    initialQty: 10.0,
    currentQty: 5.5,
    reservedQty: 2.0,
    consumedQty: 4.5,
    quarantinedQty: 0.0,
    unit: 'tonnes',
    unitCost: 89000,
    totalValue: 5.5 * 89000,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-02',
    binCode: 'BIN-RM-A02',
    status: 'released',
    inspectionStatus: 'passed',
    inspectionRecord: {
      id: 'qc-390',
      inspectionNumber: 'QC-2026-0771',
      inspectorId: 'usr-qc-01',
      inspectorName: 'Anand Deshmukh',
      inspectionDate: '2026-04-02T14:00:00Z',
      parameters: [
        { name: 'Nickel Content (Ni%)', specification: '1.30 - 1.80%', measuredValue: '1.58%', status: 'pass' },
        { name: 'Chromium (Cr%)', specification: '0.90 - 1.40%', measuredValue: '1.18%', status: 'pass' },
        { name: 'Molybdenum (Mo%)', specification: '0.20 - 0.35%', measuredValue: '0.28%', status: 'pass' },
        { name: 'Ultrasonic Flaw Detection', specification: 'Class 1 Defect Free', measuredValue: 'Zero Inclusions', status: 'pass' }
      ],
      visualCheckPassed: true,
      mtrNumber: 'MTR-JSP-2026-8821',
      disposition: 'accept'
    },
    manufactureDate: '2026-03-15T00:00:00Z',
    expiryDate: '2028-03-15T00:00:00Z',
    receivedAt: '2026-04-02T10:00:00Z',
    receivedBy: 'usr-store',
    receivedByName: 'Prakash Kunte',
    childLotNumbers: ['LOT-2026-FG-0074'],
    workOrderLinks: [
      {
        id: 'wolk-2',
        workOrderId: 'wo-002',
        workOrderNumber: 'WO-2026-002',
        partName: 'Transmission Gear Pinion — 18T',
        operationSequence: 20,
        operationName: 'Hobbing & Spline Broaching',
        workCenterName: 'Gear Hobbing Center 3',
        consumedQty: 4.5,
        unit: 'tonnes',
        consumedAt: '2026-04-05T09:00:00Z',
        consumedByOperator: 'Deepak More',
        resultingFgLotNumber: 'LOT-2026-FG-0074',
        scrapQty: 0.18
      }
    ],
    notes: 'Heavy alloy steel round bar for high-torque transmissions.',
    createdAt: '2026-04-02T11:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-fg-074',
    tenantId,
    lotNumber: 'LOT-2026-FG-0074',
    barcode: 'LOT2026FG0074',
    lotType: 'finished_goods',
    stockItemId: 'stock-fg-gear',
    stockItemCode: 'FG-TGP-018',
    stockItemName: 'Transmission Gear Pinion — 18T Ground',
    category: 'finished_goods',
    materialGrade: 'EN24 Carburized',
    initialQty: 220,
    currentQty: 40,
    reservedQty: 0,
    consumedQty: 180,
    quarantinedQty: 0,
    unit: 'units',
    unitCost: 2850,
    totalValue: 40 * 2850,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-fg',
    storeName: 'Finished Goods Dispatch Store',
    binId: 'bin-pune-fg-01',
    binCode: 'RACK-FG-B01',
    status: 'released',
    inspectionStatus: 'passed',
    manufactureDate: '2026-04-07T12:00:00Z',
    receivedAt: '2026-04-07T15:00:00Z',
    receivedBy: 'usr-super',
    receivedByName: 'Production Shift Incharge',
    producedFromWorkOrderId: 'wo-002',
    producedFromOrderNumber: 'WO-2026-002',
    parentLotNumbers: ['LOT-2026-RM-0390'],
    dispatchedToCustomers: [
      {
        id: 'dsp-02',
        salesOrderNumber: 'SO-2026-0038',
        customerName: 'Mahindra & Mahindra Ltd. — Powertrain Division',
        invoiceNumber: 'INV-2026-094',
        dispatchDate: '2026-04-08T11:30:00Z',
        dispatchedQty: 180,
        unit: 'units',
        trackingNumber: 'LR-VRL-77192',
        destinationCity: 'Nashik'
      }
    ],
    notes: 'Dispatched 180 units to M&M Nashik plant for EV drive units.',
    createdAt: '2026-04-07T16:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-rm-428',
    tenantId,
    lotNumber: 'LOT-2026-RM-0428',
    barcode: 'LOT2026RM0428',
    lotType: 'raw_material',
    stockItemId: 'stock-3',
    stockItemCode: 'DS-H13-01',
    stockItemName: 'Die Steel Block H13 — ESR Vacuum Degassed',
    category: 'raw_material',
    materialGrade: 'AISI H13 (ESR)',
    heatNumber: 'HT-BFT-1049',
    supplierId: 'sup-bharat',
    supplierName: 'Bharat Forge Specialty Tooling',
    poNumber: 'PO-2026-915',
    grnNumber: 'GRN-2026-0199',
    vendorChallanNo: 'CH-BF-7712',
    vendorLotNumber: 'BFT-ESR-402',
    initialQty: 4.0,
    currentQty: 4.0,
    reservedQty: 0.0,
    consumedQty: 0.0,
    quarantinedQty: 4.0,
    unit: 'tonnes',
    unitCost: 145000,
    totalValue: 4.0 * 145000,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-quarantine',
    storeName: 'Quarantine Holding Bay',
    binId: 'bin-pune-q-01',
    binCode: 'BAY-QUAR-01',
    status: 'quarantine',
    inspectionStatus: 'pending',
    inspectionRecord: {
      id: 'qc-428',
      inspectionNumber: 'QC-2026-0849',
      inspectorId: 'usr-qc-01',
      inspectorName: 'Anand Deshmukh',
      inspectionDate: '2026-04-14T14:00:00Z',
      parameters: [
        { name: 'Vanadium (V%)', specification: '0.80 - 1.20%', measuredValue: 'Awaiting Lab Result', status: 'marginal' },
        { name: 'Charpy V-Notch Impact', specification: '≥ 15 Joules', measuredValue: 'Testing in progress', status: 'marginal' }
      ],
      visualCheckPassed: true,
      mtrNumber: 'MTR-BF-1049-PND',
      disposition: 'rework',
      notes: 'Sample coupons sent to external NABL accredited metallurgy lab for micro-cleanness verification.'
    },
    manufactureDate: '2026-04-08T00:00:00Z',
    expiryDate: '2028-04-08T00:00:00Z',
    receivedAt: '2026-04-14T11:00:00Z',
    receivedBy: 'usr-store',
    receivedByName: 'Prakash Kunte',
    notes: 'Placed under mandatory quarantine holding until external impact toughness cert is validated.',
    createdAt: '2026-04-14T12:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lot-bo-112',
    tenantId,
    lotNumber: 'LOT-2026-BO-0112',
    barcode: 'LOT2026BO0112',
    lotType: 'bought_out',
    stockItemId: 'stock-4',
    stockItemCode: 'FAST-M12-01',
    stockItemName: 'High-Tensile Socket Head Cap Screws M12x45',
    category: 'spare',
    materialGrade: 'Grade 12.9 High Tensile',
    supplierId: 'sup-fasteners',
    supplierName: 'Unbrako Precision Fasteners Ltd.',
    poNumber: 'PO-2026-895',
    grnNumber: 'GRN-2026-0175',
    vendorChallanNo: 'CH-UNB-3310',
    initialQty: 2500,
    currentQty: 2500,
    reservedQty: 400,
    consumedQty: 0,
    quarantinedQty: 0,
    unit: 'units',
    unitCost: 48,
    totalValue: 2500 * 48,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-spares',
    storeName: 'Hardware & Consumables Store',
    binId: 'bin-pune-sp-01',
    binCode: 'SHELF-HW-04',
    status: 'released',
    inspectionStatus: 'passed',
    manufactureDate: '2026-03-20T00:00:00Z',
    receivedAt: '2026-04-06T10:00:00Z',
    receivedBy: 'usr-store',
    receivedByName: 'Prakash Kunte',
    notes: 'Pre-treated black oxide socket screws. RoHS compliant batch.',
    createdAt: '2026-04-06T11:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

export const SEED_RECALLS = (tenantId: string): RecallReport[] => [
  {
    id: 'rcl-seed-01',
    tenantId,
    recallNumber: 'RCL-2026-001',
    title: 'Audit Containment: Micro-Inclusion Defect in Wire Rod Heat HT-TATA-9942',
    suspectLotNumber: 'LOT-2026-RM-0412',
    suspectItemName: 'Wire Rod — High Tensile Steel 8mm',
    suspectItemCode: 'WR-1002',
    heatNumber: 'HT-TATA-9942',
    supplierName: 'Tata Prime Steel Ltd.',
    poNumber: 'PO-2026-902',
    grnNumber: 'GRN-2026-0182',
    defectCategory: 'surface_crack_inclusion',
    severity: 'critical',
    rootCauseFindings: 'Supplier secondary metallurgy ladle degasser failure created micro-silicate stringer inclusions in billet billet tail section. Downstream forging under 1600T hydraulic press created micro-fissures in high-stress spline area.',
    correctiveActionPlan: '1. Immediate quarantine of 9.0 tonnes raw coil at BIN-RM-A01.\n2. Stop production on Work Order WO-2026-001.\n3. Quarantine 150 finished steering shafts in RACK-FG-B02.\n4. Issue formal OEM Customer Alert bulletin to Bajaj Auto Ltd. for 300 in-transit/delivered units on Invoice INV-2026-118.\n5. Issue 8D Non-Conformance Report (NCR-TAT-2026-04) to Tata Prime Steel requiring spectrometer recast validation.',
    initiatedBy: 'usr-qc-lead',
    initiatedByName: 'Anand Deshmukh (Lead Quality Manager)',
    initiatedAt: '2026-04-14T08:00:00Z',
    quarantineHoldApplied: true,
    exposure: {
      warehouseOnHandQty: 9.0,
      warehouseValue: 9.0 * 68500,
      wipConsumedQty: 6.0,
      wipWorkOrderCount: 1,
      finishedGoodsProducedQty: 450,
      dispatchedToCustomerQty: 300,
      affectedCustomersCount: 1,
      totalFinancialExposure: (9.0 * 68500) + (450 * 1420)
    },
    affectedLocations: [
      {
        plantName: 'Pune Heavy Forge Facility',
        storeName: 'Main Raw Materials Store',
        binCode: 'BIN-RM-A01',
        lotNumber: 'LOT-2026-RM-0412',
        onHandQty: 9.0,
        unit: 'tonnes',
        status: 'quarantined',
        unitCost: 68500
      },
      {
        plantName: 'Pune Heavy Forge Facility',
        storeName: 'Finished Goods Dispatch Store',
        binCode: 'RACK-FG-B02',
        lotNumber: 'LOT-2026-FG-0089',
        onHandQty: 150,
        unit: 'units',
        status: 'quarantined',
        unitCost: 1420
      }
    ],
    affectedWorkOrders: [
      {
        orderNumber: 'WO-2026-001',
        partName: 'Steering Column Shaft — Spec B3',
        customerName: 'Bajaj Auto Ltd.',
        status: 'in_progress',
        consumedQty: 6.0,
        unit: 'tonnes',
        productionHoldApplied: true
      }
    ],
    affectedFinishedLots: [
      {
        lotNumber: 'LOT-2026-FG-0089',
        partName: 'Steering Column Shaft — Spec B3 (Forged & Ground)',
        producedQty: 450,
        unit: 'units',
        status: 'recalled'
      }
    ],
    affectedDispatches: [
      {
        customerName: 'Bajaj Auto Ltd. — Chakan Assembly Line 2',
        salesOrderNumber: 'SO-2026-0042',
        invoiceNumber: 'INV-2026-118',
        dispatchedQty: 300,
        unit: 'units',
        dispatchDate: '2026-04-14T10:00:00Z',
        contactPerson: 'Mr. Hemant Korde (QA Head - Bajaj)',
        contactPhone: '+91 98220 44910',
        notificationStatus: 'quarantined_at_client'
      }
    ],
    status: 'active_quarantine',
    qualityManagerSignOff: 'Digitally Verified & Signed: Anand Deshmukh, CQE / ASQ Certified Lead Auditor',
    regulatoryNotified: true,
    notes: 'Containment executed within 45 minutes of receipt of ultrasonic scan variance report. Zero defective parts assembled into customer final vehicle chassis.',
    createdAt: '2026-04-14T08:15:00Z',
    updatedAt: new Date().toISOString()
  }
];

class TraceabilityService {
  private getLotsKey(tenantId: string): string {
    return `flowops_traceability_lots_${tenantId}`;
  }

  private getRecallsKey(tenantId: string): string {
    return `flowops_traceability_recalls_${tenantId}`;
  }

  // ── 1. Fetch All Lots ───────────────────────────────────────────
  async getLots(tenantId: string): Promise<LotRecord[]> {
    const key = this.getLotsKey(tenantId);
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached lots', e);
      }
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'traceability_lots');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: LotRecord[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as LotRecord));
          list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
          localStorage.setItem(key, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getLots fallback to seeds', err);
      }
    }

    const seeds = SEED_LOTS(tenantId);
    localStorage.setItem(key, JSON.stringify(seeds));
    return seeds;
  }

  // ── 2. Save Lot ────────────────────────────────────────────────
  async saveLot(tenantId: string, lot: LotRecord): Promise<LotRecord> {
    const list = await this.getLots(tenantId);
    const idx = list.findIndex(l => l.id === lot.id || l.lotNumber === lot.lotNumber);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...lot, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...lot, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(this.getLotsKey(tenantId), JSON.stringify(list));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'traceability_lots', lot.id);
        await setDoc(docRef, lot, { merge: true });
      } catch (err) {
        console.warn('Firestore saveLot sync error', err);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:traceability_updated', { detail: { lotNumber: lot.lotNumber } }));
    return lot;
  }

  // ── 3. Find Lot by Number / Barcode / Heat # ───────────────────
  async findLot(tenantId: string, searchKey: string): Promise<LotRecord | null> {
    const list = await this.getLots(tenantId);
    const clean = searchKey.trim().toLowerCase();
    const found = list.find(
      l =>
        l.lotNumber.toLowerCase() === clean ||
        l.barcode.toLowerCase() === clean ||
        (l.heatNumber && l.heatNumber.toLowerCase() === clean) ||
        (l.grnNumber && l.grnNumber.toLowerCase() === clean)
    );
    return found || null;
  }

  // ── 4. Generate Next Lot Number ────────────────────────────────
  async generateNextLotNumber(tenantId: string, type: LotType, customPrefix?: string): Promise<string> {
    const list = await this.getLots(tenantId);
    const year = new Date().getFullYear();
    const typeCodeMap: Record<LotType, string> = {
      raw_material: 'RM',
      sub_assembly: 'SA',
      finished_goods: 'FG',
      bought_out: 'BO',
      consumable: 'CS'
    };
    const code = typeCodeMap[type] || 'LT';
    const prefix = customPrefix || `LOT-${year}-${code}-`;

    const matching = list.filter(l => l.lotNumber.startsWith(prefix));
    let nextNum = 1;
    if (matching.length > 0) {
      matching.forEach(l => {
        const numPart = parseInt(l.lotNumber.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart >= nextNum) {
          nextNum = numPart + 1;
        }
      });
    } else {
      nextNum = type === 'raw_material' ? 413 : type === 'finished_goods' ? 90 : 101;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  // ── 5. Generate Next GRN Number ────────────────────────────────
  async generateNextGrnNumber(tenantId: string): Promise<string> {
    const list = await this.getLots(tenantId);
    const year = new Date().getFullYear();
    const prefix = `GRN-${year}-`;
    const grnList = list.filter(l => l.grnNumber && l.grnNumber.startsWith(prefix));
    let nextNum = 183;
    grnList.forEach(l => {
      if (l.grnNumber) {
        const n = parseInt(l.grnNumber.replace(prefix, ''), 10);
        if (!isNaN(n) && n >= nextNum) nextNum = n + 1;
      }
    });
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  // ── 6. Create Material Receipt Lot (Auto-Generation at Receipt) ──
  async createMaterialReceiptLot(tenantId: string, input: CreateMaterialReceiptLotInput): Promise<LotRecord> {
    const lotNumber = await this.generateNextLotNumber(tenantId, input.lotType);
    const grnNumber = await this.generateNextGrnNumber(tenantId);
    const barcode = lotNumber.replace(/[^A-Za-z0-9]/g, '');

    const inspectionStatus: InspectionStatus = input.inspectionPassed ? 'passed' : 'pending';
    const lotStatus: LotStatus = input.inspectionPassed ? 'released' : 'quarantine';

    const inspectionRecord: QualityInspectionRecord | undefined = input.inspectionPassed
      ? {
          id: `qc-${Date.now()}`,
          inspectionNumber: `QC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          inspectorId: input.receivedBy,
          inspectorName: input.receivedByName,
          inspectionDate: new Date().toISOString(),
          parameters: input.testParameters || [
            { name: 'Receiving Dock Visual & Dimension Check', specification: 'Clean, no transit damage', measuredValue: 'Verified ok', status: 'pass' }
          ],
          visualCheckPassed: true,
          mtrNumber: input.mtrNumber,
          disposition: 'accept',
          notes: 'Auto-verified upon material receipt & inward inspection.'
        }
      : undefined;

    const newLot: LotRecord = {
      id: `lot-${Date.now()}`,
      tenantId,
      lotNumber,
      barcode,
      lotType: input.lotType,
      stockItemId: input.stockItemId,
      stockItemCode: input.stockItemCode,
      stockItemName: input.stockItemName,
      category: input.category,
      materialGrade: input.materialGrade,
      heatNumber: input.heatNumber,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      poNumber: input.poNumber,
      grnNumber,
      vendorChallanNo: input.vendorChallanNo,
      vendorLotNumber: input.vendorLotNumber,
      initialQty: input.receivedQty,
      currentQty: input.receivedQty,
      reservedQty: 0,
      consumedQty: 0,
      quarantinedQty: input.inspectionPassed ? 0 : input.receivedQty,
      unit: input.unit,
      unitCost: input.unitCost,
      totalValue: input.receivedQty * input.unitCost,
      plantId: input.plantId,
      plantName: input.plantName,
      storeId: input.storeId,
      storeName: input.storeName,
      binId: input.binId,
      binCode: input.binCode,
      status: lotStatus,
      inspectionStatus,
      inspectionRecord,
      manufactureDate: input.manufactureDate,
      expiryDate: input.expiryDate,
      receivedAt: new Date().toISOString(),
      receivedBy: input.receivedBy,
      receivedByName: input.receivedByName,
      notes: input.notes,
      workOrderLinks: [],
      childLotNumbers: [],
      dispatchedToCustomers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.saveLot(tenantId, newLot);
  }

  // ── 7. Link Lot to Work Order (Issuance into Production) ────────
  async linkLotToWorkOrder(
    tenantId: string,
    lotNumber: string,
    params: {
      workOrderId: string;
      workOrderNumber: string;
      partName: string;
      consumedQty: number;
      unit: string;
      operatorName: string;
      operationSequence?: number;
      operationName?: string;
      workCenterName?: string;
      scrapQty?: number;
      notes?: string;
    }
  ): Promise<LotRecord> {
    const lot = await this.findLot(tenantId, lotNumber);
    if (!lot) throw new Error(`Lot ${lotNumber} not found.`);

    if (lot.currentQty < params.consumedQty) {
      throw new Error(`Insufficient quantity in Lot ${lotNumber}. Available: ${lot.currentQty} ${lot.unit}, Requested: ${params.consumedQty}`);
    }

    const newCurrentQty = Math.max(0, lot.currentQty - params.consumedQty);
    const newConsumedQty = lot.consumedQty + params.consumedQty;
    const newStatus: LotStatus = newCurrentQty === 0 ? 'consumed' : lot.status;

    const link: WorkOrderConsumptionLink = {
      id: `wolk-${Date.now()}`,
      workOrderId: params.workOrderId,
      workOrderNumber: params.workOrderNumber,
      partName: params.partName,
      operationSequence: params.operationSequence || 10,
      operationName: params.operationName || 'Material Issuance & Production',
      workCenterName: params.workCenterName,
      consumedQty: params.consumedQty,
      unit: params.unit,
      consumedAt: new Date().toISOString(),
      consumedByOperator: params.operatorName,
      scrapQty: params.scrapQty || 0,
      notes: params.notes
    };

    const updatedLot: LotRecord = {
      ...lot,
      currentQty: newCurrentQty,
      consumedQty: newConsumedQty,
      totalValue: newCurrentQty * lot.unitCost,
      status: newStatus,
      workOrderLinks: [link, ...(lot.workOrderLinks || [])],
      updatedAt: new Date().toISOString()
    };

    return await this.saveLot(tenantId, updatedLot);
  }

  // ── 8. Generate Finished Goods Lot Linked to Parent RM Lots ────
  async generateFinishedGoodsLotFromWorkOrder(
    tenantId: string,
    params: {
      workOrderId: string;
      workOrderNumber: string;
      stockItemId: string;
      stockItemCode: string;
      stockItemName: string;
      producedQty: number;
      unit: string;
      unitCost: number;
      plantId: string;
      plantName: string;
      storeId: string;
      storeName: string;
      binId: string;
      binCode: string;
      parentLotNumbers: string[];
      operatorName: string;
      materialGrade?: string;
      notes?: string;
    }
  ): Promise<LotRecord> {
    const lotNumber = await this.generateNextLotNumber(tenantId, 'finished_goods');
    const barcode = lotNumber.replace(/[^A-Za-z0-9]/g, '');

    const newFgLot: LotRecord = {
      id: `lot-${Date.now()}`,
      tenantId,
      lotNumber,
      barcode,
      lotType: 'finished_goods',
      stockItemId: params.stockItemId,
      stockItemCode: params.stockItemCode,
      stockItemName: params.stockItemName,
      category: 'finished_goods',
      materialGrade: params.materialGrade,
      initialQty: params.producedQty,
      currentQty: params.producedQty,
      reservedQty: 0,
      consumedQty: 0,
      quarantinedQty: 0,
      unit: params.unit,
      unitCost: params.unitCost,
      totalValue: params.producedQty * params.unitCost,
      plantId: params.plantId,
      plantName: params.plantName,
      storeId: params.storeId,
      storeName: params.storeName,
      binId: params.binId,
      binCode: params.binCode,
      status: 'released',
      inspectionStatus: 'passed',
      inspectionRecord: {
        id: `qc-${Date.now()}`,
        inspectionNumber: `QC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        inspectorId: 'usr-qc',
        inspectorName: params.operatorName,
        inspectionDate: new Date().toISOString(),
        parameters: [
          { name: 'Final Inspection & Serial Sign-Off', specification: 'Standard production tolerance', measuredValue: 'Pass 100%', status: 'pass' }
        ],
        visualCheckPassed: true,
        disposition: 'accept',
        notes: `Produced against Work Order ${params.workOrderNumber}`
      },
      manufactureDate: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      receivedBy: 'usr-production',
      receivedByName: params.operatorName,
      producedFromWorkOrderId: params.workOrderId,
      producedFromOrderNumber: params.workOrderNumber,
      parentLotNumbers: params.parentLotNumbers,
      workOrderLinks: [],
      childLotNumbers: [],
      dispatchedToCustomers: [],
      notes: params.notes || `Finished Goods Lot spawned from Work Order ${params.workOrderNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save FG lot
    await this.saveLot(tenantId, newFgLot);

    // Update parent lots so they know about their child FG lot
    const lots = await this.getLots(tenantId);
    for (const parentLotNo of params.parentLotNumbers) {
      const parent = lots.find(l => l.lotNumber === parentLotNo);
      if (parent) {
        const existingChildren = parent.childLotNumbers || [];
        if (!existingChildren.includes(lotNumber)) {
          parent.childLotNumbers = [...existingChildren, lotNumber];
          await this.saveLot(tenantId, parent);
        }
      }
    }

    return newFgLot;
  }

  // ── 9. Record Customer Dispatch for FG Lot ─────────────────────
  async recordCustomerDispatch(
    tenantId: string,
    fgLotNumber: string,
    dispatch: {
      salesOrderNumber: string;
      customerName: string;
      invoiceNumber: string;
      dispatchedQty: number;
      unit: string;
      trackingNumber?: string;
      destinationCity?: string;
    }
  ): Promise<LotRecord> {
    const lot = await this.findLot(tenantId, fgLotNumber);
    if (!lot) throw new Error(`Lot ${fgLotNumber} not found.`);

    const newCurrent = Math.max(0, lot.currentQty - dispatch.dispatchedQty);
    const newConsumed = lot.consumedQty + dispatch.dispatchedQty;

    const record: CustomerDispatchRecord = {
      id: `dsp-${Date.now()}`,
      salesOrderNumber: dispatch.salesOrderNumber,
      customerName: dispatch.customerName,
      invoiceNumber: dispatch.invoiceNumber,
      dispatchDate: new Date().toISOString(),
      dispatchedQty: dispatch.dispatchedQty,
      unit: dispatch.unit,
      trackingNumber: dispatch.trackingNumber,
      destinationCity: dispatch.destinationCity
    };

    const updated: LotRecord = {
      ...lot,
      currentQty: newCurrent,
      consumedQty: newConsumed,
      totalValue: newCurrent * lot.unitCost,
      status: newCurrent === 0 ? 'consumed' : lot.status,
      dispatchedToCustomers: [record, ...(lot.dispatchedToCustomers || [])],
      updatedAt: new Date().toISOString()
    };

    return await this.saveLot(tenantId, updated);
  }

  // ── 10. Backward Traceability (Root-Cause Discovery) ────────────
  // Starting from FG Lot (or WO) -> traces backward to WO -> Raw Lots -> PO -> Supplier
  async getBackwardTrace(tenantId: string, targetLotOrWo: string): Promise<TraceabilityGraph> {
    const lots = await this.getLots(tenantId);
    const clean = targetLotOrWo.trim();

    // Check if target is a lot
    let rootLot = lots.find(l => l.lotNumber.toLowerCase() === clean.toLowerCase());

    // If not found, check if it's a Work Order Number
    if (!rootLot) {
      rootLot = lots.find(
        l =>
          l.producedFromOrderNumber?.toLowerCase() === clean.toLowerCase() ||
          l.workOrderLinks?.some(w => w.workOrderNumber.toLowerCase() === clean.toLowerCase())
      );
    }

    // Default to the first FG lot if still not matched
    if (!rootLot) {
      rootLot = lots.find(l => l.lotType === 'finished_goods') || lots[0];
    }

    const nodes: TraceabilityNode[] = [];
    let rawLotsCount = 0;
    let workOrdersCount = 0;
    let finishedLotsCount = 0;
    let customersAffected = 0;
    let totalUnitsExposed = rootLot.currentQty;
    let totalValueExposed = rootLot.totalValue;

    // Root FG Node
    const fgNode: TraceabilityNode = {
      id: `node-fg-${rootLot.id}`,
      type: 'fg_lot',
      code: rootLot.lotNumber,
      label: rootLot.stockItemName,
      subLabel: `Qty: ${rootLot.currentQty} ${rootLot.unit} on-hand (${rootLot.initialQty} produced) | Grade: ${rootLot.materialGrade || 'N/A'}`,
      date: rootLot.manufactureDate,
      status: rootLot.status.toUpperCase(),
      severity: rootLot.isRecalled ? 'critical' : rootLot.status === 'released' ? 'success' : 'warning',
      location: rootLot.binCode,
      metrics: {
        'On-Hand': `${rootLot.currentQty} ${rootLot.unit}`,
        'Unit Cost': `₹${rootLot.unitCost.toLocaleString()}`,
        'QC Status': rootLot.inspectionStatus
      },
      children: []
    };
    finishedLotsCount++;

    // Find Work Order that produced this FG lot
    const woNumber = rootLot.producedFromOrderNumber;
    if (woNumber) {
      workOrdersCount++;
      const woNode: TraceabilityNode = {
        id: `node-wo-${woNumber}`,
        type: 'work_order',
        code: woNumber,
        label: `Production Work Order ${woNumber}`,
        subLabel: `Part: ${rootLot.stockItemName} | Plant: ${rootLot.plantName}`,
        date: rootLot.receivedAt,
        status: 'COMPLETED',
        severity: 'normal',
        location: rootLot.plantName,
        metrics: {
          'Produced Qty': `${rootLot.initialQty} ${rootLot.unit}`,
          'Produced By': rootLot.receivedByName
        },
        children: []
      };

      // Find Parent Raw Material Lots
      const parentLotNos = rootLot.parentLotNumbers || [];
      const parentLots = lots.filter(l => parentLotNos.includes(l.lotNumber));

      parentLots.forEach(rmLot => {
        rawLotsCount++;
        const rmNode: TraceabilityNode = {
          id: `node-rm-${rmLot.id}`,
          type: 'raw_lot',
          code: rmLot.lotNumber,
          label: rmLot.stockItemName,
          subLabel: `Heat/Cast #: ${rmLot.heatNumber || 'N/A'} | Mill Grade: ${rmLot.materialGrade || 'N/A'} | GRN: ${rmLot.grnNumber || 'N/A'}`,
          date: rmLot.receivedAt,
          status: rmLot.status.toUpperCase(),
          severity: rmLot.isRecalled ? 'critical' : rmLot.status === 'released' ? 'success' : 'warning',
          location: rmLot.binCode,
          metrics: {
            'Initial Inward': `${rmLot.initialQty} ${rmLot.unit}`,
            'Remaining': `${rmLot.currentQty} ${rmLot.unit}`,
            'MTR / Cert': rmLot.inspectionRecord?.mtrNumber || 'Validated'
          },
          children: []
        };

        // Purchase Order Node
        if (rmLot.poNumber) {
          const poNode: TraceabilityNode = {
            id: `node-po-${rmLot.poNumber}`,
            type: 'purchase_order',
            code: rmLot.poNumber,
            label: `Purchase Order ${rmLot.poNumber}`,
            subLabel: `Supplier: ${rmLot.supplierName || 'Primary Mill'} | Challan: ${rmLot.vendorChallanNo || 'N/A'}`,
            date: rmLot.receivedAt,
            status: 'RECEIVED & INWARDED',
            severity: 'normal',
            children: []
          };

          // Supplier Node
          if (rmLot.supplierName) {
            const supNode: TraceabilityNode = {
              id: `node-sup-${rmLot.supplierId || 'sup'}`,
              type: 'supplier',
              code: rmLot.supplierName,
              label: rmLot.supplierName,
              subLabel: `Certified Mill / Approved Vendor | Tier 1`,
              status: 'APPROVED VENDOR',
              severity: 'success'
            };
            poNode.children = [supNode];
          }

          rmNode.children = [poNode];
        }

        woNode.children?.push(rmNode);
      });

      fgNode.children?.push(woNode);
    }

    // Check Customer Dispatches from this FG lot
    if (rootLot.dispatchedToCustomers && rootLot.dispatchedToCustomers.length > 0) {
      customersAffected += rootLot.dispatchedToCustomers.length;
      rootLot.dispatchedToCustomers.forEach(dsp => {
        totalUnitsExposed += dsp.dispatchedQty;
        fgNode.children?.push({
          id: `node-dsp-${dsp.id}`,
          type: 'customer_dispatch',
          code: dsp.invoiceNumber,
          label: dsp.customerName,
          subLabel: `Invoice: ${dsp.invoiceNumber} | Dispatched: ${dsp.dispatchedQty} ${dsp.unit} | Date: ${dsp.dispatchDate.split('T')[0]}`,
          date: dsp.dispatchDate,
          status: 'DISPATCHED',
          severity: 'normal',
          metrics: {
            'Dispatched Qty': `${dsp.dispatchedQty} ${dsp.unit}`,
            'Tracking / LR': dsp.trackingNumber || 'N/A',
            'SO #': dsp.salesOrderNumber
          }
        });
      });
    }

    nodes.push(fgNode);

    return {
      rootLotNumber: rootLot.lotNumber,
      direction: 'backward',
      generatedAt: new Date().toISOString(),
      nodes,
      summary: {
        totalRawLotsCount: rawLotsCount,
        totalWorkOrdersCount: workOrdersCount,
        totalFinishedLotsCount: finishedLotsCount,
        totalCustomersAffected: customersAffected,
        totalUnitsExposed,
        totalValueExposed
      }
    };
  }

  // ── 11. Forward Traceability (Containment / Impact Analysis) ────
  // Starting from Raw Material Lot (or Heat #) -> traces forward to Work Orders -> FG Lots -> Customers
  async getForwardTrace(tenantId: string, suspectLotOrHeat: string): Promise<TraceabilityGraph> {
    const lots = await this.getLots(tenantId);
    const clean = suspectLotOrHeat.trim().toLowerCase();

    let rootLot = lots.find(
      l =>
        l.lotNumber.toLowerCase() === clean ||
        l.barcode.toLowerCase() === clean ||
        (l.heatNumber && l.heatNumber.toLowerCase() === clean)
    );

    if (!rootLot) {
      rootLot = lots.find(l => l.lotType === 'raw_material') || lots[0];
    }

    const nodes: TraceabilityNode[] = [];
    let rawLotsCount = 1;
    let workOrdersCount = 0;
    let finishedLotsCount = 0;
    let customersAffected = 0;
    let totalUnitsExposed = rootLot.currentQty;
    let totalValueExposed = rootLot.totalValue;

    // Root RM Node
    const rmNode: TraceabilityNode = {
      id: `node-rm-${rootLot.id}`,
      type: 'raw_lot',
      code: rootLot.lotNumber,
      label: rootLot.stockItemName,
      subLabel: `Heat/Cast #: ${rootLot.heatNumber || 'N/A'} | Supplier: ${rootLot.supplierName || 'N/A'} | PO: ${rootLot.poNumber || 'N/A'}`,
      date: rootLot.receivedAt,
      status: rootLot.status.toUpperCase(),
      severity: rootLot.isRecalled ? 'critical' : rootLot.status === 'released' ? 'success' : 'warning',
      location: rootLot.binCode,
      metrics: {
        'Current Warehouse Qty': `${rootLot.currentQty} ${rootLot.unit}`,
        'Consumed in WIP': `${rootLot.consumedQty} ${rootLot.unit}`,
        'Unit Cost': `₹${rootLot.unitCost.toLocaleString()}`
      },
      children: []
    };

    // Inventory Bin Node (Remaining unconsumed warehouse stock)
    if (rootLot.currentQty > 0) {
      rmNode.children?.push({
        id: `node-bin-${rootLot.binId}`,
        type: 'inventory_bin',
        code: rootLot.binCode,
        label: `Warehouse Bin: ${rootLot.binCode} (${rootLot.storeName})`,
        subLabel: `Available for immediate quarantine hold: ${rootLot.currentQty} ${rootLot.unit}`,
        status: rootLot.isRecalled ? 'QUARANTINE LOCKED' : 'ON-HAND INVENTORY',
        severity: rootLot.isRecalled ? 'critical' : 'warning',
        location: rootLot.binCode
      });
    }

    // Work Orders that consumed this RM Lot
    const woLinks = rootLot.workOrderLinks || [];
    const processedWoNumbers = new Set<string>();

    woLinks.forEach(link => {
      if (!processedWoNumbers.has(link.workOrderNumber)) {
        processedWoNumbers.add(link.workOrderNumber);
        workOrdersCount++;

        const woNode: TraceabilityNode = {
          id: `node-wo-${link.workOrderNumber}`,
          type: 'work_order',
          code: link.workOrderNumber,
          label: `Work Order ${link.workOrderNumber}`,
          subLabel: `Component: ${link.partName} | Consumed: ${link.consumedQty} ${link.unit} on ${link.workCenterName || 'Line'}`,
          date: link.consumedAt,
          status: 'PROCESSED IN SHOPFLOOR',
          severity: 'warning',
          metrics: {
            'Consumed Qty': `${link.consumedQty} ${link.unit}`,
            'Scrap': `${link.scrapQty || 0} ${link.unit}`,
            'Operator': link.consumedByOperator
          },
          children: []
        };

        // Find Finished Goods Lots spawned from this WO or this RM lot
        const childFgLots = lots.filter(
          l =>
            l.lotType === 'finished_goods' &&
            (l.producedFromOrderNumber === link.workOrderNumber ||
              l.parentLotNumbers?.includes(rootLot.lotNumber) ||
              rootLot.childLotNumbers?.includes(l.lotNumber))
        );

        childFgLots.forEach(fgLot => {
          finishedLotsCount++;
          totalUnitsExposed += fgLot.initialQty;
          totalValueExposed += fgLot.initialQty * fgLot.unitCost;

          const fgNode: TraceabilityNode = {
            id: `node-fg-${fgLot.id}`,
            type: 'fg_lot',
            code: fgLot.lotNumber,
            label: fgLot.stockItemName,
            subLabel: `Produced: ${fgLot.initialQty} ${fgLot.unit} | In-Stock: ${fgLot.currentQty} ${fgLot.unit} (${fgLot.binCode})`,
            date: fgLot.manufactureDate,
            status: fgLot.status.toUpperCase(),
            severity: fgLot.isRecalled ? 'critical' : 'warning',
            location: fgLot.binCode,
            metrics: {
              'Produced Qty': `${fgLot.initialQty} ${fgLot.unit}`,
              'Warehouse Hold': `${fgLot.currentQty} ${fgLot.unit}`,
              'Value Exposure': `₹${(fgLot.initialQty * fgLot.unitCost).toLocaleString()}`
            },
            children: []
          };

          // Find Customer Dispatches
          if (fgLot.dispatchedToCustomers && fgLot.dispatchedToCustomers.length > 0) {
            customersAffected += fgLot.dispatchedToCustomers.length;
            fgLot.dispatchedToCustomers.forEach(dsp => {
              fgNode.children?.push({
                id: `node-dsp-${dsp.id}`,
                type: 'customer_dispatch',
                code: dsp.invoiceNumber,
                label: dsp.customerName,
                subLabel: `Invoice: ${dsp.invoiceNumber} | Dispatched: ${dsp.dispatchedQty} ${dsp.unit} on ${dsp.dispatchDate.split('T')[0]}`,
                date: dsp.dispatchDate,
                status: 'DELIVERED TO CUSTOMER (RECALL EXPOSED)',
                severity: 'critical',
                metrics: {
                  'Delivered Qty': `${dsp.dispatchedQty} ${dsp.unit}`,
                  'Tracking LR': dsp.trackingNumber || 'N/A',
                  'Destination': dsp.destinationCity || 'Assembly Plant'
                }
              });
            });
          }

          woNode.children?.push(fgNode);
        });

        rmNode.children?.push(woNode);
      }
    });

    nodes.push(rmNode);

    return {
      rootLotNumber: rootLot.lotNumber,
      direction: 'forward',
      generatedAt: new Date().toISOString(),
      nodes,
      summary: {
        totalRawLotsCount: rawLotsCount,
        totalWorkOrdersCount: workOrdersCount,
        totalFinishedLotsCount: finishedLotsCount,
        totalCustomersAffected: customersAffected,
        totalUnitsExposed,
        totalValueExposed
      }
    };
  }

  // ── 12. Fetch Recall Reports ───────────────────────────────────
  async getRecalls(tenantId: string): Promise<RecallReport[]> {
    const key = this.getRecallsKey(tenantId);
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached recalls', e);
      }
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'traceability_recalls');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: RecallReport[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as RecallReport));
          list.sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
          localStorage.setItem(key, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getRecalls fallback to seeds', err);
      }
    }

    const seeds = SEED_RECALLS(tenantId);
    localStorage.setItem(key, JSON.stringify(seeds));
    return seeds;
  }

  // ── 13. Initiate Precision Recall & Quarantine Containment ─────
  async initiateRecall(
    tenantId: string,
    params: {
      suspectLotNumber: string;
      title: string;
      defectCategory: RecallDefectType;
      severity: RecallSeverity;
      rootCauseFindings: string;
      correctiveActionPlan: string;
      initiatedBy: string;
      initiatedByName: string;
      qualityManagerSignOff: string;
      notes?: string;
    }
  ): Promise<RecallReport> {
    const lots = await this.getLots(tenantId);
    const suspectLot = lots.find(l => l.lotNumber === params.suspectLotNumber);
    if (!suspectLot) {
      throw new Error(`Suspect Lot ${params.suspectLotNumber} does not exist in master register.`);
    }

    // Run forward trace to calculate all affected items
    const forwardTrace = await this.getForwardTrace(tenantId, params.suspectLotNumber);

    const year = new Date().getFullYear();
    const existingRecalls = await this.getRecalls(tenantId);
    const recallNumber = `RCL-${year}-${String(existingRecalls.length + 1).padStart(3, '0')}`;

    // Quarantine the suspect lot
    suspectLot.status = 'recalled';
    suspectLot.isRecalled = true;
    suspectLot.recalledAt = new Date().toISOString();
    suspectLot.recalledReason = params.title;
    suspectLot.recallId = recallNumber;
    suspectLot.quarantinedQty = suspectLot.currentQty;
    await this.saveLot(tenantId, suspectLot);

    // Identify affected locations
    const affectedLocations: AffectedLocationInventory[] = [];
    if (suspectLot.currentQty > 0) {
      affectedLocations.push({
        plantName: suspectLot.plantName,
        storeName: suspectLot.storeName,
        binCode: suspectLot.binCode,
        lotNumber: suspectLot.lotNumber,
        onHandQty: suspectLot.currentQty,
        unit: suspectLot.unit,
        status: 'quarantined',
        unitCost: suspectLot.unitCost
      });
    }

    // Identify affected Work Orders
    const affectedWorkOrders: AffectedWorkOrderSummary[] = [];
    const woLinks = suspectLot.workOrderLinks || [];
    woLinks.forEach(lk => {
      affectedWorkOrders.push({
        orderNumber: lk.workOrderNumber,
        partName: lk.partName,
        customerName: 'Commercial Automotive Client',
        status: 'production_hold',
        consumedQty: lk.consumedQty,
        unit: lk.unit,
        productionHoldApplied: true
      });
    });

    // Identify affected Finished Goods Lots and quarantine them
    const affectedFinishedLots: Array<{
      lotNumber: string;
      partName: string;
      producedQty: number;
      unit: string;
      status: LotStatus;
    }> = [];

    const affectedDispatches: AffectedCustomerShipment[] = [];

    for (const lot of lots) {
      if (
        lot.lotType === 'finished_goods' &&
        (lot.parentLotNumbers?.includes(suspectLot.lotNumber) ||
          suspectLot.childLotNumbers?.includes(lot.lotNumber) ||
          woLinks.some(w => w.workOrderNumber === lot.producedFromOrderNumber))
      ) {
        lot.status = 'recalled';
        lot.isRecalled = true;
        lot.recalledAt = new Date().toISOString();
        lot.recalledReason = params.title;
        lot.recallId = recallNumber;
        lot.quarantinedQty = lot.currentQty;
        await this.saveLot(tenantId, lot);

        affectedFinishedLots.push({
          lotNumber: lot.lotNumber,
          partName: lot.stockItemName,
          producedQty: lot.initialQty,
          unit: lot.unit,
          status: 'recalled'
        });

        if (lot.currentQty > 0) {
          affectedLocations.push({
            plantName: lot.plantName,
            storeName: lot.storeName,
            binCode: lot.binCode,
            lotNumber: lot.lotNumber,
            onHandQty: lot.currentQty,
            unit: lot.unit,
            status: 'quarantined',
            unitCost: lot.unitCost
          });
        }

        if (lot.dispatchedToCustomers) {
          lot.dispatchedToCustomers.forEach(dsp => {
            affectedDispatches.push({
              customerName: dsp.customerName,
              salesOrderNumber: dsp.salesOrderNumber,
              invoiceNumber: dsp.invoiceNumber,
              dispatchedQty: dsp.dispatchedQty,
              unit: dsp.unit,
              dispatchDate: dsp.dispatchDate,
              contactPerson: 'Quality Assurance Head',
              notificationStatus: 'notified'
            });
          });
        }
      }
    }

    const totalWarehouseValue = affectedLocations.reduce((sum, loc) => sum + loc.onHandQty * loc.unitCost, 0);
    const totalDispatchedQty = affectedDispatches.reduce((sum, d) => sum + d.dispatchedQty, 0);
    const totalWipQty = affectedWorkOrders.reduce((sum, w) => sum + w.consumedQty, 0);

    const recallReport: RecallReport = {
      id: `rcl-${Date.now()}`,
      tenantId,
      recallNumber,
      title: params.title,
      suspectLotNumber: suspectLot.lotNumber,
      suspectItemName: suspectLot.stockItemName,
      suspectItemCode: suspectLot.stockItemCode,
      heatNumber: suspectLot.heatNumber,
      supplierName: suspectLot.supplierName,
      poNumber: suspectLot.poNumber,
      grnNumber: suspectLot.grnNumber,
      defectCategory: params.defectCategory,
      severity: params.severity,
      rootCauseFindings: params.rootCauseFindings,
      correctiveActionPlan: params.correctiveActionPlan,
      initiatedBy: params.initiatedBy,
      initiatedByName: params.initiatedByName,
      initiatedAt: new Date().toISOString(),
      quarantineHoldApplied: true,
      exposure: {
        warehouseOnHandQty: suspectLot.currentQty,
        warehouseValue: totalWarehouseValue,
        wipConsumedQty: totalWipQty,
        wipWorkOrderCount: affectedWorkOrders.length,
        finishedGoodsProducedQty: affectedFinishedLots.reduce((s, f) => s + f.producedQty, 0),
        dispatchedToCustomerQty: totalDispatchedQty,
        affectedCustomersCount: new Set(affectedDispatches.map(d => d.customerName)).size,
        totalFinancialExposure: totalWarehouseValue + (totalDispatchedQty * 1420)
      },
      affectedLocations,
      affectedWorkOrders,
      affectedFinishedLots,
      affectedDispatches,
      status: 'active_quarantine',
      qualityManagerSignOff: params.qualityManagerSignOff,
      regulatoryNotified: params.severity === 'critical',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const recallList = [recallReport, ...(await this.getRecalls(tenantId))];
    localStorage.setItem(this.getRecallsKey(tenantId), JSON.stringify(recallList));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'traceability_recalls', recallReport.id);
        await setDoc(docRef, recallReport, { merge: true });
      } catch (err) {
        console.warn('Firestore initiateRecall sync error', err);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:recall_created', { detail: { recallNumber } }));
    window.dispatchEvent(new CustomEvent('flowops:traceability_updated', { detail: { lotNumber: suspectLot.lotNumber } }));

    return recallReport;
  }

  // ── 14. Update Recall Status ────────────────────────────────────
  async updateRecallStatus(
    tenantId: string,
    recallId: string,
    status: RecallReport['status'],
    notes?: string
  ): Promise<RecallReport> {
    const list = await this.getRecalls(tenantId);
    const r = list.find(x => x.id === recallId || x.recallNumber === recallId);
    if (!r) throw new Error(`Recall ${recallId} not found`);

    r.status = status;
    r.updatedAt = new Date().toISOString();
    if (notes) r.notes = (r.notes ? `${r.notes}\n` : '') + notes;
    if (status === 'contained_and_closed') {
      r.closedAt = new Date().toISOString();
      r.closedBy = 'Quality Manager';
    }

    localStorage.setItem(this.getRecallsKey(tenantId), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('flowops:recall_updated', { detail: { recallId: r.recallNumber } }));
    return r;
  }
}

export const traceabilityService = new TraceabilityService();
