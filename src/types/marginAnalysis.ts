// src/types/marginAnalysis.ts

export type TimePeriodOption = 'today' | 'last_7_days' | 'mtd' | 'qtd' | 'ytd' | 'all_time';

export type MarginHealthStatus = 'high_margin' | 'healthy' | 'at_risk' | 'loss_making';

export interface ProductMarginSummary {
  partCode: string;
  partName: string;
  category: string;
  unitsCount: number;
  avgSellingPrice: number;
  avgUnitCost: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  quotedMarginPct: number;
  marginVariancePct: number; // actual - quoted (negative means dilution)
  health: MarginHealthStatus;
  materialCost: number;
  laborCost: number;
  machineCost: number;
  subcontractCost: number;
  overheadCost: number;
  copqCost: number; // scrap & rework
  orderCount: number;
  topCustomer: string;
  primaryCostDriver: 'material' | 'labor' | 'machine' | 'overhead' | 'quality_scrap';
}

export interface CustomerMarginSummary {
  customerId: string;
  customerName: string;
  tier: 'Key Account' | 'Tier 1 Strategic' | 'Standard Commercial' | 'Contract Spot';
  orderCount: number;
  totalUnits: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  quotedMarginPct: number;
  marginContributionPct: number; // share of total gross profit
  health: MarginHealthStatus;
  topProduct: string;
  recentOrderDate: string;
}

export interface OrderMarginSummary {
  workOrderId: string;
  workOrderNumber: string;
  salesOrderNumber: string;
  quoteNumber: string;
  customerPoNumber: string;
  customerName: string;
  partCode: string;
  partName: string;
  quantity: number;
  quantityCompleted: number;
  contractPricePerUnit: number;
  totalRevenue: number;
  standardTotalCost: number;
  actualTotalCost: number;
  standardGrossProfit: number;
  grossProfit: number;
  standardGrossMarginPercent: number;
  actualGrossMarginPercent: number;
  marginDilutionPercent: number; // quoted - actual
  health: MarginHealthStatus;
  status: string;
  dueDate: string;
  completedAt?: string;
  materialCost: number;
  laborCost: number;
  machineCost: number;
  subcontractCost: number;
  overheadCost: number;
  scrapCost: number;
  reworkCost: number;
}

export interface PeriodPnLRecord {
  periodId: string;
  periodLabel: string;
  dateKey: string;
  revenue: number;
  materialCost: number;
  laborCost: number;
  machineCost: number;
  subcontractCost: number;
  overheadCost: number;
  copqLosses: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  orderCount: number;
  unitsCount: number;
}

export interface LivePnLSummary {
  totalRevenue: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalMachineCost: number;
  totalSubcontractCost: number;
  totalFactoryOverheadCost: number;
  totalSgaCost: number;
  totalCogs: number;
  grossProfitBeforeCopq: number;
  manufacturingGrossMarginPct: number;
  totalCopqLosses: number; // Scrap + Rework debits
  netRealizedProfit: number;
  netRealizedMarginPct: number;
  targetMarginPct: number; // benchmark e.g. 25%
  marginSpreadPct: number; // netRealizedMarginPct - targetMarginPct
  totalOrdersCount: number;
  totalUnitsProduced: number;
  highMarginCount: number;
  healthyCount: number;
  atRiskCount: number;
  lossMakingCount: number;
}

export interface TopBottomPerformers {
  topProducts: ProductMarginSummary[];
  bottomProducts: ProductMarginSummary[];
  topCustomers: CustomerMarginSummary[];
  bottomCustomers: CustomerMarginSummary[];
  topOrders: OrderMarginSummary[];
  bottomOrders: OrderMarginSummary[];
}

export interface MarginFilterParams {
  timePeriod: TimePeriodOption;
  customer: string;
  product: string;
  health: string;
  searchQuery: string;
  targetMarginPct: number;
}
