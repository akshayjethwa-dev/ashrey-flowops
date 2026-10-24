// src/types/costVariance.ts

import { MaterialConsumptionRecord, LaborCostRecord, MachineCostRecord, SubcontractCostRecord, OverheadAllocationConfig } from './costRollup';

export type JobProfitabilityStatus = 'made_money' | 'lost_money' | 'breakeven';

export type VarianceSeverityLevel = 
  | 'favorable_saving'    // Actual cost is significantly lower than quoted (positive saving)
  | 'on_target'           // Within acceptable tolerance (e.g. within ±threshold %)
  | 'minor_overrun'       // Slightly above quoted (between 0% and threshold %)
  | 'alert_overrun'       // Above threshold % (flagged for accountant review)
  | 'critical_loss';      // Cost overrun has pushed job into negative margin (loss making)

export type PrimaryVarianceDriver = 'Material' | 'Labor' | 'Machine' | 'Overhead' | 'Subcontract' | 'None';

export interface VarianceComponentDetail {
  plannedCost: number;
  actualCost: number;
  varianceCost: number;         // actual - planned
  variancePercent: number;      // ((actual - planned) / planned) * 100
  isUnfavorable: boolean;       // true if actual > planned (overrun)
  isExceedingThreshold: boolean;// true if Math.abs(variancePercent) > thresholdPercent
}

export interface VarianceReportRow {
  workOrderId: string;
  workOrderNumber: string;
  salesOrderNumber: string;
  quoteNumber?: string;
  customerPoNumber?: string;
  customerName: string;
  partCode: string;
  partName: string;
  quantity: number;
  orderStatus: string;
  dueDate: string;
  plantName?: string;

  // Commercials
  contractPricePerUnit: number;
  totalRevenue: number;

  // Cost Components (Planned vs Actual)
  material: VarianceComponentDetail;
  labor: VarianceComponentDetail;
  machine: VarianceComponentDetail;
  overhead: VarianceComponentDetail;
  subcontract: VarianceComponentDetail;

  // Total Job Cost Variance
  totalPlannedCost: number;
  totalActualCost: number;
  totalVarianceCost: number;       // totalActualCost - totalPlannedCost
  totalVariancePercent: number;    // ((totalActualCost - totalPlannedCost) / totalPlannedCost) * 100
  totalUnitCostPlanned: number;
  totalUnitCostActual: number;

  // Profitability Analysis
  plannedGrossProfit: number;
  actualGrossProfit: number;
  profitVarianceCost: number;      // actualGrossProfit - plannedGrossProfit
  plannedGrossMarginPercent: number;
  actualGrossMarginPercent: number;
  marginErosionPercent: number;    // plannedGrossMarginPercent - actualGrossMarginPercent

  // Classifications & Flags
  profitabilityStatus: JobProfitabilityStatus;
  severityLevel: VarianceSeverityLevel;
  primaryDriver: PrimaryVarianceDriver;
  isThresholdAlert: boolean;       // Flags jobs where total cost variance % > configured threshold
  hasMaterialOverrunAlert: boolean;
  hasLaborOverrunAlert: boolean;
  hasOverheadOverrunAlert: boolean;

  // Underlying Source Transactions for Drill-down
  materialTransactions: MaterialConsumptionRecord[];
  laborTransactions: LaborCostRecord[];
  machineTransactions: MachineCostRecord[];
  subcontractTransactions: SubcontractCostRecord[];
  overheadConfig: OverheadAllocationConfig;

  // Audit notes
  accountantNotes?: string;
  rootCauseCategory?: 'Scrap / Defect' | 'Machine Breakdown' | 'Rate Hike' | 'Rework' | 'Overtime' | 'Setup Delay' | 'Normal';
}

export interface VarianceThresholdSettings {
  costOverrunThresholdPct: number;    // Default e.g. 10 (%)
  materialThresholdPct: number;       // Default e.g. 8 (%)
  laborThresholdPct: number;          // Default e.g. 10 (%)
  overheadThresholdPct: number;       // Default e.g. 12 (%)
  flagLossMakingJobs: boolean;
  highlightFavorableSavings: boolean;
}

export interface VarianceSummaryMetrics {
  totalJobsAnalyzed: number;
  totalRevenue: number;
  totalPlannedCost: number;
  totalActualCost: number;
  netCostVariance: number;            // Total Actual - Total Planned
  netCostVariancePercent: number;
  isNetUnfavorable: boolean;

  // Profitability Count & Totals
  jobsMadeMoneyCount: number;
  jobsLostMoneyCount: number;
  totalProfitFromWinners: number;
  totalLossFromLosers: number;
  netRealizedProfit: number;
  blendedActualMarginPercent: number;
  blendedPlannedMarginPercent: number;

  // Threshold Alerts
  alertThresholdExceededCount: number;
  criticalLossJobsCount: number;

  // Category Variances
  totalMaterialVariance: number;
  totalMaterialVariancePct: number;
  totalLaborVariance: number;
  totalLaborVariancePct: number;
  totalMachineVariance: number;
  totalMachineVariancePct: number;
  totalOverheadVariance: number;
  totalOverheadVariancePct: number;
}

export interface VarianceFilterOptions {
  searchQuery: string;
  profitabilityFilter: 'all' | 'made_money' | 'lost_money';
  alertFilter: 'all' | 'exceeding_threshold' | 'critical_loss' | 'favorable_savings';
  driverFilter: 'all' | 'Material' | 'Labor' | 'Machine' | 'Overhead';
  sortBy: 'totalVarianceCost' | 'totalVariancePercent' | 'actualProfit' | 'revenue' | 'orderNumber';
  sortOrder: 'asc' | 'desc';
}
