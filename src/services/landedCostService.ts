// src/services/landedCostService.ts

import {
  LandedCostVoucher,
  LandedCostCharge,
  LandedCostLotLine,
  LandedCostComponentType,
  LandedCostAllocationRule,
  LandedCostSummaryKpis,
  LandedCostRuleComparisonResult
} from '../types/landedCost';

export interface PostedAllocationEntry {
  lotNumber: string;
  voucherNumber: string;
  voucherDate: string;
  baseUnitPrice: number;
  allocatedCostPerUnit: number;
  trueLandedCostPerUnit: number;
  markupPercentage: number;
  ruleUsed: LandedCostAllocationRule;
  postedAt: string;
}

const STORAGE_KEY_PREFIX = 'flowops_landed_cost_vouchers_';

export const COMPONENT_LABELS: Record<LandedCostComponentType, { label: string; category: string; description: string }> = {
  ocean_freight: {
    label: 'Ocean / Sea Freight',
    category: 'Freight & Logistics',
    description: 'International container shipping and ocean transit lines'
  },
  air_freight: {
    label: 'Air Freight Cargo',
    category: 'Freight & Logistics',
    description: 'Express and cargo air charter consignments'
  },
  road_freight: {
    label: 'Inland Road Haulage',
    category: 'Freight & Logistics',
    description: 'Interstate trucking, trailer freight and container haulage'
  },
  customs_duty: {
    label: 'Customs Duty & Tariffs',
    category: 'Duties & Taxes',
    description: 'Basic Customs Duty (BCD), Social Welfare Surcharge (SWS), and IGST'
  },
  port_handling: {
    label: 'Port & Terminal Handling (THC)',
    category: 'Handling & Stevedoring',
    description: 'Container freight station (CFS), port stevedoring, and dock dues'
  },
  cargo_insurance: {
    label: 'Marine & Cargo Insurance',
    category: 'Risk & Insurance',
    description: 'Transit all-risk marine insurance covering voyage hazards'
  },
  demurrage_storage: {
    label: 'Demurrage & Bonded Storage',
    category: 'Handling & Stevedoring',
    description: 'Port ground rent, container detention and bonded warehousing'
  },
  unloading_cartage: {
    label: 'Plant Unloading & Crane Hire',
    category: 'Handling & Stevedoring',
    description: 'Heavy crane deployment and internal yard handling'
  },
  other: {
    label: 'Other Landed Surcharges',
    category: 'Miscellaneous',
    description: 'Surveyor inspections, fumigation, document attestation fees'
  }
};

export const ALLOCATION_RULES_METADATA: Record<LandedCostAllocationRule, {
  name: string;
  description: string;
  bestFor: string;
  gaapNote: string;
}> = {
  by_weight: {
    name: 'By Weight (MT / kg)',
    description: 'Allocates charges proportionally according to physical weight share.',
    bestFor: 'Freight, stevedoring, fuel surcharges, container haulage where mass drives logistics cost.',
    gaapNote: 'Compliant with Ind AS 2 / IAS 2 for weight-variable transport and ocean consignments.'
  },
  by_value: {
    name: 'By Value (Base PO Amount)',
    description: 'Allocates charges proportionally according to base invoice commercial value.',
    bestFor: 'Customs duty (ad-valorem BCD), transit marine insurance, clearing agent commission.',
    gaapNote: 'Directly reflects ad-valorem duties where fiscal obligation scales with item valuation.'
  },
  by_quantity: {
    name: 'By Quantity (Units / Pcs)',
    description: 'Allocates charges equally per received unit regardless of unit price or weight.',
    bestFor: 'Customs documentation fees, inspection stamps, flat container clearance charges.',
    gaapNote: 'Best suited when handling uniform batches or homogeneous packaged items.'
  },
  manual: {
    name: 'Custom / Specific Allocation',
    description: 'Allows finance managers to specify custom percentage distribution across lots.',
    bestFor: 'Special mixed consignments with contractually assigned surcharge schedules.',
    gaapNote: 'Requires audit memorandum and documentary justification for audit trail compliance.'
  }
};

// Seed Vouchers with realistic industrial data reflecting true manufacturing costs
const getSeedVouchers = (tenantId: string): LandedCostVoucher[] => [
  {
    id: `lcv-001-${tenantId}`,
    voucherNumber: 'LCV-2026-001',
    voucherDate: '2026-02-18',
    title: 'Rotterdam Sea Freight & BCD Duty - High-Tensile Alloy Wire Rods',
    status: 'posted',
    shipmentRef: 'BL-MAEU-9812401',
    originLocation: 'Rotterdam Port, Netherlands',
    destinationPlant: 'Main Automotive Forging Plant (Unit 1)',
    carrierName: 'Maersk Sealand Logistics',
    customsDocRef: 'BOE-JNPT-2026-8812',
    defaultAllocationRule: 'by_weight',
    totalBaseValue: 1219250,
    totalLandedCharges: 185000,
    totalLandedValue: 1404250,
    effectiveMarkupPercent: 15.17,
    notes: 'Imported batch of 12.5mm cold heading quality wire rods for steering knuckle forgings.',
    createdAt: '2026-02-18T10:30:00Z',
    updatedAt: '2026-02-20T14:15:00Z',
    postedAt: '2026-02-20T14:15:00Z',
    postedBy: 'Sunil Mehta (Finance Controller)',
    charges: [
      {
        id: 'chg-101',
        componentType: 'ocean_freight',
        description: '40ft High Cube Container Freight Rotterdam to Nhava Sheva (JNPT)',
        vendorName: 'Maersk Sealand India Ltd',
        invoiceNumber: 'MSK-IN-98210',
        invoiceDate: '2026-02-10',
        currency: 'INR',
        amount: 88000,
        taxAmount: 15840,
        totalAmount: 88000,
        notes: 'Net of recoverable GST input credit'
      },
      {
        id: 'chg-102',
        componentType: 'customs_duty',
        description: 'Basic Customs Duty (7.5%) & SWS on Steel Consignment',
        vendorName: 'Central Board of Indirect Taxes & Customs',
        invoiceNumber: 'CBIC-E-CHALLAN-44102',
        invoiceDate: '2026-02-14',
        currency: 'INR',
        amount: 62000,
        taxAmount: 0,
        totalAmount: 62000,
        notes: 'Non-creditable basic duty capitalized as per Ind AS 2'
      },
      {
        id: 'chg-103',
        componentType: 'port_handling',
        description: 'CFS Terminal Handling Charges & Destuffing Survey',
        vendorName: 'Gateway Distriparks CFS Nhava Sheva',
        invoiceNumber: 'GDL-CFS-8821',
        invoiceDate: '2026-02-16',
        currency: 'INR',
        amount: 19500,
        taxAmount: 3510,
        totalAmount: 19500
      },
      {
        id: 'chg-104',
        componentType: 'cargo_insurance',
        description: 'Marine Transit Cargo All-Risk Voyage Insurance',
        vendorName: 'New India Assurance Co',
        invoiceNumber: 'NIA-MAR-77218',
        invoiceDate: '2026-02-08',
        currency: 'INR',
        amount: 15500,
        taxAmount: 0,
        totalAmount: 15500
      }
    ],
    lotLines: [
      {
        id: 'line-001',
        lotNumber: 'LOT-2026-RM-0412',
        itemId: 'ITEM-RM-001',
        itemCode: 'RM-1018-001',
        itemName: 'Steel Wire Rod 12.5mm SAE 1018',
        category: 'raw_material',
        grnNumber: 'GRN-2026-0412',
        poNumber: 'PO-2026-0891',
        vendorName: 'ArcelorMittal Europe Long Products',
        quantity: 10, // Tonnes
        uom: 'Tonnes',
        weightKg: 10000,
        baseUnitCost: 68500,
        baseTotalValue: 685000,
        allocatedChargeAmount: 104225, // 10 / 17.8 * 185000
        allocatedCostPerUnit: 10422.5,
        trueLandedCostPerUnit: 78922.5,
        landedMarkupPercent: 15.22
      },
      {
        id: 'line-002',
        lotNumber: 'LOT-2026-RM-0365',
        itemId: 'ITEM-RM-001',
        itemCode: 'RM-1018-001',
        itemName: 'Steel Wire Rod 12.5mm SAE 1018',
        category: 'raw_material',
        grnNumber: 'GRN-2026-0365',
        poNumber: 'PO-2026-0891',
        vendorName: 'ArcelorMittal Europe Long Products',
        quantity: 5.8, // Tonnes
        uom: 'Tonnes',
        weightKg: 5800,
        baseUnitCost: 68500,
        baseTotalValue: 397300,
        allocatedChargeAmount: 60450, // 5.8 / 17.8 * 185000
        allocatedCostPerUnit: 10422.5,
        trueLandedCostPerUnit: 78922.5,
        landedMarkupPercent: 15.22
      },
      {
        id: 'line-003',
        lotNumber: 'LOT-2026-RM-0301',
        itemId: 'ITEM-RM-001',
        itemCode: 'RM-1018-001',
        itemName: 'Steel Wire Rod 12.5mm SAE 1018',
        category: 'raw_material',
        grnNumber: 'GRN-2026-0301',
        poNumber: 'PO-2026-0810',
        vendorName: 'ArcelorMittal Europe Long Products',
        quantity: 2.0, // Tonnes
        uom: 'Tonnes',
        weightKg: 2000,
        baseUnitCost: 68475,
        baseTotalValue: 136950,
        allocatedChargeAmount: 20325, // 2.0 / 17.8 * 185000
        allocatedCostPerUnit: 10162.5,
        trueLandedCostPerUnit: 78637.5,
        landedMarkupPercent: 14.84
      }
    ]
  },
  {
    id: `lcv-002-${tenantId}`,
    voucherNumber: 'LCV-2026-002',
    voucherDate: '2026-02-25',
    title: 'Air Cargo Express & Clearance - Imported Tooling Die Blocks',
    status: 'posted',
    shipmentRef: 'AWB-LH-0294109',
    originLocation: 'Frankfurt Airport, Germany',
    destinationPlant: 'Toolroom & Die Maintenance Division',
    carrierName: 'Lufthansa Cargo / DHL Global Forwarding',
    customsDocRef: 'BOE-ACC-BOM-1904',
    defaultAllocationRule: 'by_value',
    totalBaseValue: 384000,
    totalLandedCharges: 78000,
    totalLandedValue: 462000,
    effectiveMarkupPercent: 20.31,
    notes: 'Urgent air shipment for CNC Die Inserts & Hardened Tooling Tool Blocks.',
    createdAt: '2026-02-25T11:00:00Z',
    updatedAt: '2026-02-26T16:40:00Z',
    postedAt: '2026-02-26T16:40:00Z',
    postedBy: 'Sunil Mehta (Finance Controller)',
    charges: [
      {
        id: 'chg-201',
        componentType: 'air_freight',
        description: 'Priority Air Cargo Freight Frankfurt to Mumbai Air Cargo Complex',
        vendorName: 'DHL Global Forwarding India',
        invoiceNumber: 'DHL-AIR-5541',
        invoiceDate: '2026-02-22',
        currency: 'INR',
        amount: 45000,
        totalAmount: 45000
      },
      {
        id: 'chg-202',
        componentType: 'customs_duty',
        description: 'Customs Duty on Precision Tooling Inserts',
        vendorName: 'Customs Air Cargo Mumbai',
        invoiceNumber: 'ACC-MUM-8921',
        invoiceDate: '2026-02-24',
        currency: 'INR',
        amount: 22000,
        totalAmount: 22000
      },
      {
        id: 'chg-203',
        componentType: 'port_handling',
        description: 'Airport Ground Handling & Customs Brokerage Fee',
        vendorName: 'Jeena & Company Customs Brokers',
        invoiceNumber: 'JNA-CB-9081',
        invoiceDate: '2026-02-25',
        currency: 'INR',
        amount: 11000,
        totalAmount: 11000
      }
    ],
    lotLines: [
      {
        id: 'line-201',
        lotNumber: 'LOT-2025-SP-0012',
        itemId: 'ITEM-SPR-001',
        itemCode: 'SPR-DIE-001',
        itemName: 'Cold Forging Die Block Hardened D2',
        category: 'spare',
        grnNumber: 'GRN-2026-0511',
        poNumber: 'PO-2026-0940',
        vendorName: 'Bohler Bleche GmbH',
        quantity: 8,
        uom: 'Pcs',
        weightKg: 240,
        baseUnitCost: 28000,
        baseTotalValue: 224000,
        allocatedChargeAmount: 45500, // 224000 / 384000 * 78000
        allocatedCostPerUnit: 5687.5,
        trueLandedCostPerUnit: 33687.5,
        landedMarkupPercent: 20.31
      },
      {
        id: 'line-202',
        lotNumber: 'LOT-2026-SP-0025',
        itemId: 'ITEM-SPR-002',
        itemCode: 'SPR-INS-044',
        itemName: 'Carbide Chamfer Inserts TiAlN Coated',
        category: 'spare',
        grnNumber: 'GRN-2026-0520',
        poNumber: 'PO-2026-0940',
        vendorName: 'Bohler Bleche GmbH',
        quantity: 40,
        uom: 'Pcs',
        weightKg: 20,
        baseUnitCost: 4000,
        baseTotalValue: 160000,
        allocatedChargeAmount: 32500, // 160000 / 384000 * 78000
        allocatedCostPerUnit: 812.5,
        trueLandedCostPerUnit: 4812.5,
        landedMarkupPercent: 20.31
      }
    ]
  },
  {
    id: `lcv-003-${tenantId}`,
    voucherNumber: 'LCV-2026-003',
    voucherDate: '2026-03-02',
    title: 'Interstate Road Haulage & Transit Insurance - Heavy EN8 Carbon Billets',
    status: 'draft',
    shipmentRef: 'LR-VRL-2026-44910',
    originLocation: 'Jamshedpur Steel Works, Jharkhand',
    destinationPlant: 'Main Automotive Forging Plant (Unit 1)',
    carrierName: 'VRL Logistics Heavy Haulage',
    defaultAllocationRule: 'by_weight',
    totalBaseValue: 840000,
    totalLandedCharges: 52000,
    totalLandedValue: 892000,
    effectiveMarkupPercent: 6.19,
    notes: 'Primary freight from integrated steel mill. Pending final weighbridge verification slip.',
    createdAt: '2026-03-02T09:15:00Z',
    updatedAt: '2026-03-02T11:45:00Z',
    charges: [
      {
        id: 'chg-301',
        componentType: 'road_freight',
        description: 'Multi-Axle Trailer Freight Jamshedpur to Pune Plant',
        vendorName: 'VRL Logistics Ltd',
        invoiceNumber: 'VRL-INV-99021',
        invoiceDate: '2026-03-01',
        currency: 'INR',
        amount: 42000,
        totalAmount: 42000
      },
      {
        id: 'chg-302',
        componentType: 'cargo_insurance',
        description: 'Inland Highway Cargo Transit Insurance',
        vendorName: 'ICICI Lombard General Insurance',
        invoiceNumber: 'ICICI-TR-1029',
        invoiceDate: '2026-02-28',
        currency: 'INR',
        amount: 4500,
        totalAmount: 4500
      },
      {
        id: 'chg-303',
        componentType: 'unloading_cartage',
        description: 'Forklift & Gantry Crane Yard Offloading Charges',
        vendorName: 'Jai Bharat Crane Services',
        invoiceNumber: 'JBC-CRN-201',
        invoiceDate: '2026-03-02',
        currency: 'INR',
        amount: 5500,
        totalAmount: 5500
      }
    ],
    lotLines: [
      {
        id: 'line-301',
        lotNumber: 'LOT-2026-RM-0480',
        itemId: 'ITEM-RM-004',
        itemCode: 'RM-EN8-040',
        itemName: 'Forging Quality Round Bar EN8 40mm',
        category: 'raw_material',
        grnNumber: 'GRN-2026-0601',
        poNumber: 'PO-2026-1020',
        vendorName: 'Tata Steel Long Products',
        quantity: 12.0, // Tonnes
        uom: 'Tonnes',
        weightKg: 12000,
        baseUnitCost: 52000,
        baseTotalValue: 624000,
        allocatedChargeAmount: 39000,
        allocatedCostPerUnit: 3250,
        trueLandedCostPerUnit: 55250,
        landedMarkupPercent: 6.25
      },
      {
        id: 'line-302',
        lotNumber: 'LOT-2026-RM-0481',
        itemId: 'ITEM-RM-005',
        itemCode: 'RM-20MN-050',
        itemName: 'Case Hardening Steel 20MnCr5 50mm',
        category: 'raw_material',
        grnNumber: 'GRN-2026-0602',
        poNumber: 'PO-2026-1020',
        vendorName: 'Tata Steel Long Products',
        quantity: 4.0, // Tonnes
        uom: 'Tonnes',
        weightKg: 4000,
        baseUnitCost: 54000,
        baseTotalValue: 216000,
        allocatedChargeAmount: 13000,
        allocatedCostPerUnit: 3250,
        trueLandedCostPerUnit: 57250,
        landedMarkupPercent: 6.02
      }
    ]
  }
];

class LandedCostService {
  private getStorageKey(tenantId: string): string {
    return `${STORAGE_KEY_PREFIX}${tenantId}`;
  }

  public getVouchers(tenantId: string = 'default'): LandedCostVoucher[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(tenantId));
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse landed cost vouchers from localStorage:', e);
    }
    const seeds = getSeedVouchers(tenantId);
    this.saveVouchers(seeds, tenantId);
    return seeds;
  }

  public saveVouchers(vouchers: LandedCostVoucher[], tenantId: string = 'default'): void {
    try {
      localStorage.setItem(this.getStorageKey(tenantId), JSON.stringify(vouchers));
      // Dispatch event so inventory valuation and other views update automatically
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flowops_landed_cost_updated', { detail: { tenantId } }));
      }
    } catch (e) {
      console.error('Failed to save landed cost vouchers:', e);
    }
  }

  public getVoucherById(id: string, tenantId: string = 'default'): LandedCostVoucher | undefined {
    return this.getVouchers(tenantId).find((v) => v.id === id);
  }

  /**
   * Core Landed Cost Allocation Engine
   * Calculates allocated charges per line using chosen allocation rule:
   * - by_weight: Proportional to physical mass (kg/MT)
   * - by_value: Proportional to base purchase invoice amount
   * - by_quantity: Uniform share per unit/piece
   * - manual: Proportional to custom percentage set by user
   */
  public calculateAllocations(
    charges: LandedCostCharge[],
    lotLines: LandedCostLotLine[],
    rule: LandedCostAllocationRule
  ): LandedCostLotLine[] {
    const totalCharges = charges.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    if (lotLines.length === 0 || totalCharges === 0) {
      return lotLines.map((line) => ({
        ...line,
        allocatedChargeAmount: 0,
        allocatedCostPerUnit: 0,
        trueLandedCostPerUnit: line.baseUnitCost,
        landedMarkupPercent: 0
      }));
    }

    if (rule === 'by_weight') {
      const totalWeight = lotLines.reduce((sum, l) => sum + (Number(l.weightKg) || (Number(l.quantity) * 1)), 0);
      return lotLines.map((line) => {
        const lineWeight = Number(line.weightKg) || (Number(line.quantity) * 1);
        const weightShare = totalWeight > 0 ? lineWeight / totalWeight : 1 / lotLines.length;
        const allocatedAmount = Math.round(totalCharges * weightShare * 100) / 100;
        const qty = Number(line.quantity) || 1;
        const allocatedPerUnit = Math.round((allocatedAmount / qty) * 100) / 100;
        const trueLandedCost = Math.round((line.baseUnitCost + allocatedPerUnit) * 100) / 100;
        const markup = line.baseUnitCost > 0 ? Math.round(((allocatedPerUnit / line.baseUnitCost) * 100) * 100) / 100 : 0;

        return {
          ...line,
          baseTotalValue: Math.round(line.baseUnitCost * qty * 100) / 100,
          allocatedChargeAmount: allocatedAmount,
          allocatedCostPerUnit: allocatedPerUnit,
          trueLandedCostPerUnit: trueLandedCost,
          landedMarkupPercent: markup
        };
      });
    }

    if (rule === 'by_value') {
      const totalBaseValue = lotLines.reduce((sum, l) => sum + ((Number(l.quantity) || 0) * (Number(l.baseUnitCost) || 0)), 0);
      return lotLines.map((line) => {
        const lineValue = (Number(line.quantity) || 0) * (Number(line.baseUnitCost) || 0);
        const valueShare = totalBaseValue > 0 ? lineValue / totalBaseValue : 1 / lotLines.length;
        const allocatedAmount = Math.round(totalCharges * valueShare * 100) / 100;
        const qty = Number(line.quantity) || 1;
        const allocatedPerUnit = Math.round((allocatedAmount / qty) * 100) / 100;
        const trueLandedCost = Math.round((line.baseUnitCost + allocatedPerUnit) * 100) / 100;
        const markup = line.baseUnitCost > 0 ? Math.round(((allocatedPerUnit / line.baseUnitCost) * 100) * 100) / 100 : 0;

        return {
          ...line,
          baseTotalValue: Math.round(lineValue * 100) / 100,
          allocatedChargeAmount: allocatedAmount,
          allocatedCostPerUnit: allocatedPerUnit,
          trueLandedCostPerUnit: trueLandedCost,
          landedMarkupPercent: markup
        };
      });
    }

    if (rule === 'by_quantity') {
      const totalQty = lotLines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      return lotLines.map((line) => {
        const qty = Number(line.quantity) || 1;
        const qtyShare = totalQty > 0 ? qty / totalQty : 1 / lotLines.length;
        const allocatedAmount = Math.round(totalCharges * qtyShare * 100) / 100;
        const allocatedPerUnit = Math.round((allocatedAmount / qty) * 100) / 100;
        const trueLandedCost = Math.round((line.baseUnitCost + allocatedPerUnit) * 100) / 100;
        const markup = line.baseUnitCost > 0 ? Math.round(((allocatedPerUnit / line.baseUnitCost) * 100) * 100) / 100 : 0;

        return {
          ...line,
          baseTotalValue: Math.round(line.baseUnitCost * qty * 100) / 100,
          allocatedChargeAmount: allocatedAmount,
          allocatedCostPerUnit: allocatedPerUnit,
          trueLandedCostPerUnit: trueLandedCost,
          landedMarkupPercent: markup
        };
      });
    }

    // Manual rule
    const totalCustomWeight = lotLines.reduce((sum, l) => sum + (Number(l.customWeightPercent) || 0), 0);
    return lotLines.map((line) => {
      const customPct = Number(line.customWeightPercent) || 0;
      const share = totalCustomWeight > 0 ? customPct / totalCustomWeight : 1 / lotLines.length;
      const allocatedAmount = Math.round(totalCharges * share * 100) / 100;
      const qty = Number(line.quantity) || 1;
      const allocatedPerUnit = Math.round((allocatedAmount / qty) * 100) / 100;
      const trueLandedCost = Math.round((line.baseUnitCost + allocatedPerUnit) * 100) / 100;
      const markup = line.baseUnitCost > 0 ? Math.round(((allocatedPerUnit / line.baseUnitCost) * 100) * 100) / 100 : 0;

      return {
        ...line,
        baseTotalValue: Math.round(line.baseUnitCost * qty * 100) / 100,
        allocatedChargeAmount: allocatedAmount,
        allocatedCostPerUnit: allocatedPerUnit,
        trueLandedCostPerUnit: trueLandedCost,
        landedMarkupPercent: markup
      };
    });
  }

  /**
   * Compares all standard allocation rules side-by-side
   * Demonstrates the cost variance and margin impact under different accounting approaches
   */
  public compareAllocationRules(
    charges: LandedCostCharge[],
    lotLines: LandedCostLotLine[]
  ): LandedCostRuleComparisonResult[] {
    const rules: LandedCostAllocationRule[] = ['by_weight', 'by_value', 'by_quantity'];

    return rules.map((r) => {
      const meta = ALLOCATION_RULES_METADATA[r];
      const recalculated = this.calculateAllocations(charges, lotLines, r);

      return {
        rule: r,
        ruleName: meta.name,
        ruleDescription: meta.description,
        recommendedFor: meta.bestFor,
        allocations: recalculated.map((line) => ({
          lotLineId: line.id,
          lotNumber: line.lotNumber,
          itemCode: line.itemCode,
          itemName: line.itemName,
          baseUnitCost: line.baseUnitCost,
          allocatedAmount: line.allocatedChargeAmount,
          allocatedUnitCost: line.allocatedCostPerUnit,
          trueLandedCost: line.trueLandedCostPerUnit,
          markupPercent: line.landedMarkupPercent
        }))
      };
    });
  }

  /**
   * Returns a Map of posted allocations keyed by uppercase lotNumber
   * Consumed directly by stockAgingValuationService to capitalize true landed costs
   */
  public getPostedLandedCostAllocations(tenantId: string = 'default'): Map<string, {
    baseUnitPrice: number;
    trueLandedCostPerUnit: number;
    allocatedCostPerUnit: number;
    voucherNumber: string;
    markupPercentage: number;
    voucherDate: string;
  }> {
    const vouchers = this.getVouchers(tenantId).filter((v) => v.status === 'posted');
    const allocationMap = new Map<string, {
      baseUnitPrice: number;
      trueLandedCostPerUnit: number;
      allocatedCostPerUnit: number;
      voucherNumber: string;
      markupPercentage: number;
      voucherDate: string;
    }>();

    for (const voucher of vouchers) {
      for (const line of voucher.lotLines) {
        if (!line.lotNumber) continue;
        const key = line.lotNumber.toUpperCase().trim();
        allocationMap.set(key, {
          baseUnitPrice: line.baseUnitCost,
          trueLandedCostPerUnit: line.trueLandedCostPerUnit,
          allocatedCostPerUnit: line.allocatedCostPerUnit,
          voucherNumber: voucher.voucherNumber,
          markupPercentage: line.landedMarkupPercent,
          voucherDate: voucher.voucherDate
        });
      }
    }

    return allocationMap;
  }

  /**
   * Post voucher to inventory valuation
   */
  public postVoucher(id: string, postedBy: string = 'Authorized Finance Manager', tenantId: string = 'default'): LandedCostVoucher {
    const vouchers = this.getVouchers(tenantId);
    const index = vouchers.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Voucher ${id} not found`);
    }

    const current = vouchers[index];
    const updatedLotLines = this.calculateAllocations(current.charges, current.lotLines, current.defaultAllocationRule);
    const totalCharges = current.charges.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    const totalBase = updatedLotLines.reduce((sum, l) => sum + (l.baseTotalValue || 0), 0);

    const updated: LandedCostVoucher = {
      ...current,
      status: 'posted',
      charges: current.charges,
      lotLines: updatedLotLines,
      totalBaseValue: totalBase,
      totalLandedCharges: totalCharges,
      totalLandedValue: totalBase + totalCharges,
      effectiveMarkupPercent: totalBase > 0 ? Math.round(((totalCharges / totalBase) * 100) * 100) / 100 : 0,
      postedAt: new Date().toISOString(),
      postedBy,
      updatedAt: new Date().toISOString()
    };

    vouchers[index] = updated;
    this.saveVouchers(vouchers, tenantId);
    return updated;
  }

  /**
   * Reverse a posted voucher back to draft/reversed state
   */
  public reverseVoucher(id: string, tenantId: string = 'default'): LandedCostVoucher {
    const vouchers = this.getVouchers(tenantId);
    const index = vouchers.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Voucher ${id} not found`);
    }

    const updated: LandedCostVoucher = {
      ...vouchers[index],
      status: 'reversed',
      postedAt: undefined,
      postedBy: undefined,
      updatedAt: new Date().toISOString()
    };

    vouchers[index] = updated;
    this.saveVouchers(vouchers, tenantId);
    return updated;
  }

  /**
   * Create or update voucher
   */
  public saveVoucher(voucher: Partial<LandedCostVoucher>, tenantId: string = 'default'): LandedCostVoucher {
    const vouchers = this.getVouchers(tenantId);
    const now = new Date().toISOString();

    const charges = voucher.charges || [];
    const lotLines = voucher.lotLines || [];
    const rule = voucher.defaultAllocationRule || 'by_weight';

    const calculatedLines = this.calculateAllocations(charges, lotLines, rule);
    const totalCharges = charges.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    const totalBase = calculatedLines.reduce((sum, l) => sum + (l.baseTotalValue || 0), 0);
    const markup = totalBase > 0 ? Math.round(((totalCharges / totalBase) * 100) * 100) / 100 : 0;

    if (voucher.id) {
      const index = vouchers.findIndex((v) => v.id === voucher.id);
      if (index !== -1) {
        const updated: LandedCostVoucher = {
          ...vouchers[index],
          ...voucher,
          charges,
          lotLines: calculatedLines,
          defaultAllocationRule: rule,
          totalBaseValue: totalBase,
          totalLandedCharges: totalCharges,
          totalLandedValue: totalBase + totalCharges,
          effectiveMarkupPercent: markup,
          updatedAt: now
        } as LandedCostVoucher;
        vouchers[index] = updated;
        this.saveVouchers(vouchers, tenantId);
        return updated;
      }
    }

    // New voucher
    const nextSeq = vouchers.length + 1;
    const vNum = voucher.voucherNumber || `LCV-2026-${String(nextSeq).padStart(3, '0')}`;
    const newVoucher: LandedCostVoucher = {
      id: `lcv-${Date.now()}-${tenantId}`,
      voucherNumber: vNum,
      voucherDate: voucher.voucherDate || new Date().toISOString().split('T')[0],
      title: voucher.title || `Landed Cost Allocation - ${vNum}`,
      status: voucher.status || 'draft',
      shipmentRef: voucher.shipmentRef || '',
      originLocation: voucher.originLocation || 'Port of Origin',
      destinationPlant: voucher.destinationPlant || 'Main Automotive Forging Plant (Unit 1)',
      carrierName: voucher.carrierName || '',
      customsDocRef: voucher.customsDocRef || '',
      defaultAllocationRule: rule,
      charges,
      lotLines: calculatedLines,
      totalBaseValue: totalBase,
      totalLandedCharges: totalCharges,
      totalLandedValue: totalBase + totalCharges,
      effectiveMarkupPercent: markup,
      notes: voucher.notes || '',
      createdAt: now,
      updatedAt: now
    };

    vouchers.unshift(newVoucher);
    this.saveVouchers(vouchers, tenantId);
    return newVoucher;
  }

  public deleteVoucher(id: string, tenantId: string = 'default'): void {
    const vouchers = this.getVouchers(tenantId).filter((v) => v.id !== id);
    this.saveVouchers(vouchers, tenantId);
  }

  /**
   * Aggregate KPI summary for executive financial dashboards
   */
  public getSummaryKpis(tenantId: string = 'default'): LandedCostSummaryKpis {
    const vouchers = this.getVouchers(tenantId);
    const posted = vouchers.filter((v) => v.status === 'posted');
    const drafts = vouchers.filter((v) => v.status === 'draft');

    let totalLandedCostsAbsorbed = 0;
    let totalLandedInventoryValue = 0;
    let totalBaseVal = 0;
    const affectedLotsSet = new Set<string>();

    const byComponent: Record<LandedCostComponentType, number> = {
      ocean_freight: 0,
      air_freight: 0,
      road_freight: 0,
      customs_duty: 0,
      port_handling: 0,
      cargo_insurance: 0,
      demurrage_storage: 0,
      unloading_cartage: 0,
      other: 0
    };

    for (const v of posted) {
      totalLandedCostsAbsorbed += v.totalLandedCharges;
      totalLandedInventoryValue += v.totalLandedValue;
      totalBaseVal += v.totalBaseValue;

      for (const c of v.charges) {
        byComponent[c.componentType] = (byComponent[c.componentType] || 0) + (c.totalAmount || 0);
      }

      for (const line of v.lotLines) {
        if (line.lotNumber) affectedLotsSet.add(line.lotNumber);
      }
    }

    const avgMarkup = totalBaseVal > 0 ? (totalLandedCostsAbsorbed / totalBaseVal) * 100 : 0;

    return {
      totalLandedCostsAbsorbed,
      postedVouchersCount: posted.length,
      draftVouchersCount: drafts.length,
      affectedLotsCount: affectedLotsSet.size,
      averageMarkupPercent: Math.round(avgMarkup * 100) / 100,
      totalLandedInventoryValue,
      byComponent
    };
  }

  /**
   * Generates formatted CSV for financial audits
   */
  public exportAuditCsv(tenantId: string = 'default'): string {
    const vouchers = this.getVouchers(tenantId);
    const rows: string[] = [
      [
        'Voucher Number',
        'Voucher Date',
        'Status',
        'Origin',
        'Destination',
        'Shipment Ref',
        'Customs BoE',
        'Carrier',
        'Allocation Rule',
        'Lot Number',
        'Item Code',
        'Item Description',
        'Quantity',
        'UOM',
        'Weight (kg)',
        'Base Unit Cost (INR)',
        'Base Total Value (INR)',
        'Allocated Landed Cost (INR)',
        'Allocated Unit Cost (INR)',
        'True Landed Cost (INR)',
        'Markup %',
        'Posted By',
        'Posted Date'
      ].join(',')
    ];

    for (const v of vouchers) {
      for (const line of v.lotLines) {
        rows.push([
          `"${v.voucherNumber}"`,
          `"${v.voucherDate}"`,
          `"${v.status.toUpperCase()}"`,
          `"${v.originLocation}"`,
          `"${v.destinationPlant}"`,
          `"${v.shipmentRef || ''}"`,
          `"${v.customsDocRef || ''}"`,
          `"${v.carrierName || ''}"`,
          `"${v.defaultAllocationRule}"`,
          `"${line.lotNumber}"`,
          `"${line.itemCode}"`,
          `"${line.itemName.replace(/"/g, '""')}"`,
          line.quantity,
          `"${line.uom}"`,
          line.weightKg,
          line.baseUnitCost,
          line.baseTotalValue,
          line.allocatedChargeAmount,
          line.allocatedCostPerUnit,
          line.trueLandedCostPerUnit,
          `${line.landedMarkupPercent.toFixed(2)}%`,
          `"${v.postedBy || ''}"`,
          `"${v.postedAt || ''}"`
        ].join(','));
      }
    }

    return rows.join('\n');
  }
}

export const landedCostService = new LandedCostService();
