// src/types/procurementDashboard.ts

export interface ProcurementKpis {
  openPoCount: number;               // e.g. 14 open POs
  openPoTotalValue: number;          // e.g. ₹ 64,80,000
  supplierOtdPct: number;            // e.g. 91.8%
  supplierOtdTargetPct: number;      // e.g. 95.0%
  criticalStockoutsCount: number;    // e.g. 3 materials at 0 or below safety stock
  atRiskPartsCount: number;          // e.g. 5 materials with < 3 days coverage
  totalInventoryValuation: number;   // e.g. ₹ 88,50,000
  deadStockValuation: number;        // e.g. ₹ 11,20,000 in >90 days
  avgSupplierLeadTimeDays: number;   // e.g. 8.4 days
  poPendingApprovalCount: number;    // e.g. 4 POs awaiting WhatsApp sign-off
}

export type PoRiskTag = 'on_track' | 'approaching_due' | 'critical_delayed';

export interface OpenPurchaseOrderItem {
  id: string;
  poNumber: string;                  // e.g. "PO-2026-0814"
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  totalValueInr: number;
  currency: string;
  orderDate: string;
  promisedDeliveryDate: string;
  daysRemainingOrOverdue: number;    // negative if overdue
  riskTag: PoRiskTag;
  lineItemsCount: number;
  keyItemSummary: string;            // e.g. "Alloy Steel Billets EN-19 (12.5 MT)"
  status: 'draft' | 'pending_approval' | 'dispatched_to_vendor' | 'acknowledged' | 'partially_received';
  whatsappSent: boolean;
  linkedWorkOrders: string[];
}

export interface SupplierPerformanceItem {
  id: string;
  supplierName: string;
  category: string;                  // e.g. "Raw Materials & Billets"
  tier: 'tier_1' | 'tier_2' | 'tier_3';
  activePoCount: number;
  totalSpendYtdInr: number;
  otdPct: number;                    // e.g. 96.5%
  qualityAcceptancePct: number;      // e.g. 99.1%
  leadTimeVarianceDays: number;      // e.g. +0.5 days
  status: 'preferred' | 'approved' | 'on_probation';
  riskScore: 'low' | 'moderate' | 'high';
  primaryContact: string;
  phone: string;
}

export interface StockoutAlertItem {
  id: string;
  sku: string;                       // e.g. "MAT-STL-EN19"
  name: string;                      // e.g. "Forged EN-19 Alloy Rounds 65mm"
  category: string;
  currentStock: number;
  uom: string;
  safetyStock: number;
  reorderLevel: number;
  dailyBurnRate: number;             // e.g. 15 kg/day
  daysCoverageRemaining: number;     // e.g. 0.8 days
  stockoutSeverity: 'out_of_stock' | 'critical_buffer' | 'low_warning';
  activeImpactedJobs: string[];      // e.g. ["WO-4410", "WO-4412"]
  preferredSupplierName: string;
  supplierPhone: string;
  unitPriceEstimateInr: number;
  suggestedReorderQty: number;
}

export interface InventoryAgingBucketData {
  bucketKey: '0_30' | '31_60' | '61_90' | '90_plus';
  label: string;                     // e.g. "0 - 30 Days (Active)"
  itemCount: number;
  capitalValueInr: number;
  percentageOfTotal: number;
  riskDescription: string;
  liquidationAction: string;
}

export interface InventoryAgingSummary {
  buckets: InventoryAgingBucketData[];
  totalHoldingCapitalInr: number;
  excessCapitalAtRiskInr: number;
  carryingCostMonthlyInr: number;
}
