// src/types/scrapRework.ts

export type ShiftType = 'shift_a' | 'shift_b' | 'shift_c';

export type ScrapStatus = 'confirmed' | 'pending_review' | 'salvaged';

export type ReworkStatus = 'pending_rework' | 'in_progress' | 'rework_passed' | 'rework_failed_scrapped';

export type RootCauseCategory = 
  | 'Tooling & Cutters'
  | 'Machining & CNC Programming'
  | 'Raw Material Defect'
  | 'Operator Technique & Setup'
  | 'Thermal & Heat Treatment'
  | 'Handling & Contamination'
  | 'Fixture & Clamping';

export interface ScrapReasonCodeDefinition {
  code: string;
  name: string;
  category: RootCauseCategory;
  description: string;
  typicalCorrectiveAction: string;
}

export interface ReworkReasonCodeDefinition {
  code: string;
  name: string;
  description: string;
  defaultSecondaryStation: string;
  estimatedHoursTypical: number;
}

export interface ScrapRecord {
  id: string;
  scrapNumber: string;               // e.g. "SCR-2026-0042"
  workOrderId: string;
  workOrderNumber: string;
  salesOrderNumber?: string;
  customerName: string;
  partCode: string;
  partName: string;
  
  // Operation point where scrap occurred
  operationCode: string;
  operationName: string;
  operationSequence: number;
  
  // Traceability & Attribution
  machineId: string;
  machineName: string;
  shift: ShiftType;
  shiftLabel: string;
  operatorId: string;
  operatorName: string;
  
  // Quantity
  quantityScrapped: number;
  unit: string;                      // PCS, KG, MTR
  
  // Reason & Root Cause
  reasonCode: string;
  reasonName: string;
  rootCauseCategory: RootCauseCategory;
  description: string;
  
  // Financial Cost Breakdown
  materialUnitCost: number;          // Base raw stock cost per unit
  cumulativeOpCostPerUnit: number;   // Machining + labor invested up to this op
  grossScrapCost: number;            // quantityScrapped * (materialUnitCost + cumulativeOpCostPerUnit)
  salvageRecoveryUnitValue: number;  // Scrap metal bin buyback per unit
  totalSalvageCredit: number;        // quantityScrapped * salvageRecoveryUnitValue
  netScrapCost: number;              // grossScrapCost - totalSalvageCredit
  
  // Production Context
  lotNumber: string;
  heatNumber?: string;
  recordedBy: string;
  recordedAt: string;
  plantId: string;
  plantName: string;
  status: ScrapStatus;
  notes?: string;
}

export interface ReworkRecord {
  id: string;
  reworkNumber: string;              // e.g. "RWK-2026-0019"
  workOrderId: string;
  workOrderNumber: string;
  salesOrderNumber?: string;
  customerName: string;
  partCode: string;
  partName: string;
  
  // Operation & Station
  originalOperationCode: string;
  originalOperationName: string;
  reworkStationCode: string;
  reworkStationName: string;
  
  // Machine & Operator attribution
  machineId: string;
  machineName: string;
  shift: ShiftType;
  shiftLabel: string;
  operatorId: string;
  operatorName: string;
  
  // Quantity & Reason
  reworkQuantity: number;
  unit: string;
  reasonCode: string;
  reasonName: string;
  reworkInstructions: string;
  
  // Cost Impact Elements
  reworkLaborHours: number;
  reworkLaborHourlyRate: number;     // $/hr or ₹/hr
  reworkMachineHours: number;
  reworkMachineHourlyRate: number;   // $/hr or ₹/hr
  consumablesCost: number;           // tooling skim, grinding paste, inserts
  secondaryVendorCost: number;       // e.g. re-plating, stripping
  totalReworkCost: number;           // (Labor hrs * rate) + (Machine hrs * rate) + consumables + secondary
  
  // Recovery Economics
  potentialScrapCostAvoided: number; // Cost avoided by saving parts instead of scrapping
  netCostBenefit: number;            // potentialScrapCostAvoided - totalReworkCost
  
  // Lifecycle
  status: ReworkStatus;
  recordedAt: string;
  completedAt?: string;
  turnaroundHours?: number;
  verifiedByQualityInspector?: string;
  technicianNotes?: string;
}

export interface CopqSummaryMetrics {
  totalScrapEvents: number;
  totalScrappedUnits: number;
  grossScrapCost: number;
  totalSalvageRecovery: number;
  netScrapCost: number;
  
  totalReworkEvents: number;
  totalReworkedUnits: number;
  totalReworkLaborHours: number;
  totalReworkMachineHours: number;
  totalReworkCost: number;
  
  totalCopq: number;                 // netScrapCost + totalReworkCost
  baselineProductionValue: number;
  copqPercentageOfProduction: number;// (totalCopq / baselineProductionValue) * 100
  
  totalCostSavedViaRework: number;   // potentialScrapCostAvoided - totalReworkCost
  reworkSuccessRatePct: number;      // % of rework jobs passed vs failed
  
  vitalFewOffendersCount: number;    // Count of machines/reasons causing 80% COPQ
}

export type ParetoDimension = 'machine' | 'shift' | 'operator' | 'reason';

export interface ParetoBarItem {
  id: string;
  key: string;
  label: string;
  subLabel?: string;
  scrapCost: number;
  reworkCost: number;
  totalCost: number;
  scrapUnits: number;
  reworkUnits: number;
  totalEvents: number;
  percentage: number;
  cumulativePercentage: number;
  isVitalFew: boolean;               // <= 80% cumulative threshold
  topReasonOrMachine: string;
  primaryActionRecommendation?: string;
}

export interface ParetoAnalysisResult {
  dimension: ParetoDimension;
  items: ParetoBarItem[];
  totalCopq: number;
  totalEvents: number;
  vitalFewCount: number;
  vitalFewPercentage: number;
}

export interface ScrapReworkFilters {
  searchQuery?: string;
  machineId?: string;
  operatorId?: string;
  shift?: ShiftType | 'all';
  rootCauseCategory?: RootCauseCategory | 'all';
  workOrderId?: string;
  status?: string;
  timeRange?: 'all' | 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days';
}
