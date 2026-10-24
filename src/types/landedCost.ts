import { StockCategory } from '../types';

export type LandedCostComponentType =
  | 'ocean_freight'       // Ocean / Sea Freight Container Shipping
  | 'air_freight'         // Air Freight Cargo / Express
  | 'road_freight'        // Road Transportation & Haulage
  | 'customs_duty'        // Customs Duty, BCD, SWS & Import Tariffs
  | 'port_handling'       // Port, CFS & Terminal Handling Charges (THC)
  | 'cargo_insurance'     // Marine & Transit Cargo Insurance
  | 'demurrage_storage'   // Port Demurrage, Detention & Bonded Storage
  | 'unloading_cartage'   // Plant Unloading, Crane Hire & Local Cartage
  | 'other';              // Other Incurred Landed Costs

export type LandedCostAllocationRule =
  | 'by_weight'     // Pro-rata by net weight (kg/MT)
  | 'by_value'      // Pro-rata by base purchase invoice value (INR)
  | 'by_quantity'   // Pro-rata by physical receipt quantity (Pcs/Units)
  | 'manual';       // Custom user-defined percentage distribution

export type LandedCostVoucherStatus = 'draft' | 'posted' | 'reversed';

export interface LandedCostCharge {
  id: string;
  componentType: LandedCostComponentType;
  description: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
}

export interface LandedCostLotLine {
  id: string;
  lotNumber: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: StockCategory | string;
  grnNumber?: string;
  poNumber?: string;
  vendorName?: string;
  quantity: number;
  uom: string;
  weightKg: number;
  baseUnitCost: number;       // Base purchase cost from PO/Invoice
  baseTotalValue: number;     // quantity * baseUnitCost
  allocatedChargeAmount: number; // Allocated landed cost amount
  allocatedCostPerUnit: number;  // allocatedChargeAmount / quantity
  trueLandedCostPerUnit: number; // baseUnitCost + allocatedCostPerUnit
  landedMarkupPercent: number;   // (allocatedCostPerUnit / baseUnitCost) * 100
  customWeightPercent?: number;  // For manual allocation rule
}

export interface LandedCostVoucher {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  title: string;
  status: LandedCostVoucherStatus;
  shipmentRef?: string;        // Bill of Lading (B/L), Air Waybill (AWB), Lorry Receipt (LR)
  originLocation: string;      // Port of Loading / Country of Origin
  destinationPlant: string;    // Receiving Facility / Plant
  carrierName?: string;        // Shipping line, airline, transporter
  customsDocRef?: string;      // Bill of Entry (BoE) number
  defaultAllocationRule: LandedCostAllocationRule;
  charges: LandedCostCharge[];
  lotLines: LandedCostLotLine[];
  totalBaseValue: number;
  totalLandedCharges: number;
  totalLandedValue: number;
  effectiveMarkupPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  postedBy?: string;
}

export interface LandedCostSummaryKpis {
  totalLandedCostsAbsorbed: number;
  postedVouchersCount: number;
  draftVouchersCount: number;
  affectedLotsCount: number;
  averageMarkupPercent: number;
  totalLandedInventoryValue: number;
  byComponent: Record<LandedCostComponentType, number>;
}

export interface LandedCostRuleComparisonResult {
  rule: LandedCostAllocationRule;
  ruleName: string;
  ruleDescription: string;
  recommendedFor: string;
  allocations: {
    lotLineId: string;
    lotNumber: string;
    itemCode: string;
    itemName: string;
    baseUnitCost: number;
    allocatedAmount: number;
    allocatedUnitCost: number;
    trueLandedCost: number;
    markupPercent: number;
    varianceFromDefault?: number;
  }[];
}

export interface LotAllocationRecord {
  lotNumber: string;
  voucherNumber: string;
  voucherDate: string;
  allocatedCostPerUnit: number;
  markupPercent: number;
  baseUnitCost: number;
  trueLandedCostPerUnit: number;
  postedAt: string;
}
