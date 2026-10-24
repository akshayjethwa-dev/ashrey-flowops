// src/types/costRollup.ts

export type MarginHealthStatus = 
  | 'high_margin'   // > 25% gross margin
  | 'healthy'       // 15% - 25% gross margin
  | 'at_risk'       // 0% - 14.9% gross margin (eroded)
  | 'loss_making';  // < 0% (negative margin)

export type OverheadAllocationMethod = 
  | 'percent_direct_labor'    // Allocated as % of Direct Labor cost
  | 'per_machine_hour'        // Allocated as fixed rate per actual machine hour
  | 'percent_prime_cost'      // % of Prime Cost (Direct Material + Direct Labor + Machine)
  | 'fixed_per_unit'          // Fixed overhead amount per unit manufactured
  | 'hybrid_industrial';      // Standard industrial: % direct labor + machine hour charge

export interface OverheadAllocationConfig {
  id: string;
  name: string;
  isDefault: boolean;
  method: OverheadAllocationMethod;
  laborOverheadPercent: number;        // e.g. 110% of direct labor
  machineHourOverheadRate: number;     // e.g. ₹180 / machine hour
  primeCostOverheadPercent: number;    // e.g. 14% of prime cost
  factoryFixedRatePerUnit: number;     // e.g. ₹45 / unit
  generalAdminSgaPercent: number;      // e.g. 7.5% SG&A overhead
  facilityPowerTariffPerKwh: number;   // e.g. ₹8.80 / kWh
  notes?: string;
  updatedAt: string;
}

export interface MaterialConsumptionRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  bomItemId: string;
  materialCode: string;
  materialName: string;
  materialGrade?: string;
  lotNumber: string;
  heatNumber?: string;
  storeLocation: string;
  binCode: string;
  standardRequiredQty: number;
  actualIssuedQty: number;
  unit: string;
  standardUnitCost: number;       // ₹ per unit (from quote/standard BOM)
  actualUnitCost: number;         // ₹ per unit (from inventory lot FIFO/WAC)
  standardTotalCost: number;      // standardRequiredQty * standardUnitCost
  actualTotalCost: number;        // actualIssuedQty * actualUnitCost
  varianceCost: number;           // actualTotalCost - standardTotalCost
  variancePercent: number;        // (varianceCost / standardTotalCost) * 100
  scrapWasteQty: number;
  issuedAt: string;
  issuedByOperator: string;
  grnNumber?: string;
  isDirectIssue: boolean;
  notes?: string;
}

export interface LaborCostRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  operationSequence: number;
  operatorId: string;
  operatorName: string;
  operatorBadgeNumber: string;
  role: string;
  skillLevel: 'unskilled' | 'semi_skilled' | 'skilled' | 'specialist';
  hourlyRate: number;              // ₹/hour base
  overtimeHourlyRate: number;      // ₹/hour OT
  standardMinutes: number;
  actualSetupMinutes: number;
  actualRunMinutes: number;
  totalActualMinutes: number;
  isLiveRunning: boolean;          // True if currently running in Time Capture Kiosk
  regularLaborCost: number;
  overtimeLaborCost: number;
  totalLaborCost: number;          // regular + overtime
  standardLaborCost: number;
  varianceCost: number;            // totalLaborCost - standardLaborCost
  variancePercent: number;
  timeLogId?: string;
  startedAt: string;
  endedAt?: string;
}

export interface MachineCostRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  operationSequence: number;
  machineCode: string;
  machineName: string;
  hourlyRate: number;              // ₹/hour
  setupHourlyRate: number;         // ₹/hour setup
  powerRatingKw: number;
  depreciationPerHr: number;
  toolingAllowancePerHr: number;
  standardMachineMinutes: number;
  actualSetupMinutes: number;
  actualRunMinutes: number;
  totalMachineMinutes: number;
  totalMachineHours: number;
  isLiveRunning: boolean;
  setupCost: number;
  machiningCost: number;
  toolingCost: number;
  totalMachineCost: number;        // setup + machining + tooling
  standardMachineCost: number;
  varianceCost: number;            // totalMachineCost - standardMachineCost
  variancePercent: number;
}

export interface SubcontractCostRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  operationSequence: number;
  processName: string;
  vendorName: string;
  poNumber?: string;
  grnNumber?: string;
  quantityProcessed: number;
  unit: string;
  contractUnitCost: number;
  actualUnitCost: number;
  handlingMarkupPercent: number;
  totalActualCost: number;
  standardCost: number;
  varianceCost: number;
  status: 'pending' | 'in_transit' | 'received_approved';
}

export interface WorkOrderCostRollup {
  workOrderId: string;
  workOrderNumber: string;
  plantId?: string;
  plantName?: string;
  salesOrderNumber: string;
  quoteNumber?: string;
  customerPoNumber?: string;
  customerName: string;
  partCode: string;
  partName: string;
  quantity: number;
  quantityCompleted: number;
  quantityScrapped: number;
  orderStatus: string;
  priority: string;
  dueDate: string;

  // Commercial / Selling Value
  contractPricePerUnit: number;    // Invoiced or Quoted selling price ₹/unit
  totalRevenue: number;            // quantity * contractPricePerUnit

  // 1. Direct Material
  standardMaterialCost: number;
  actualMaterialCost: number;
  materialVarianceCost: number;
  materialVariancePercent: number;
  materialItems: MaterialConsumptionRecord[];

  // 2. Direct Labor
  standardLaborCost: number;
  actualLaborCost: number;
  laborVarianceCost: number;
  laborVariancePercent: number;
  laborLogs: LaborCostRecord[];
  activeOperatorCount: number;

  // 3. Machine Hours
  standardMachineCost: number;
  actualMachineCost: number;
  machineVarianceCost: number;
  machineVariancePercent: number;
  machineLogs: MachineCostRecord[];
  activeMachineCount: number;

  // 4. Subcontracting
  standardSubcontractCost: number;
  actualSubcontractCost: number;
  subcontractVarianceCost: number;
  subcontractItems: SubcontractCostRecord[];

  // Prime Cost (Materials + Labor + Machine + Subcontract)
  standardPrimeCost: number;
  actualPrimeCost: number;

  // 5. Overhead Allocation
  overheadConfigApplied: OverheadAllocationConfig;
  appliedAllocationMethod: OverheadAllocationMethod;
  allocatedFactoryOverheadCost: number;
  allocatedSgaOverheadCost: number;
  totalOverheadCost: number;
  standardOverheadCost: number;
  overheadVarianceCost: number;

  // 6. Total Manufacturing Cost & Unit Economics
  standardTotalCost: number;
  actualTotalCost: number;
  totalCostVariance: number;        // actual - standard
  totalCostVariancePercent: number;

  standardUnitCost: number;         // standardTotalCost / quantity
  actualUnitCost: number;           // actualTotalCost / quantity

  // 7. Gross Margin & Profitability
  standardGrossProfit: number;      // totalRevenue - standardTotalCost
  actualGrossProfit: number;        // totalRevenue - actualTotalCost
  standardGrossMarginPercent: number;
  actualGrossMarginPercent: number;
  marginVariancePercent: number;    // actualGrossMargin - standardGrossMargin

  // Real-time Health
  marginHealth: MarginHealthStatus;
  isLiveRunning: boolean;           // Active clock running right now on shop floor
  hasMaterialOverrun: boolean;
  hasLaborOverrun: boolean;
  lastCalculatedAt: string;
}

export interface CostRollupSummaryKPIs {
  totalJobsCount: number;
  activeJobsCount: number;
  completedJobsCount: number;
  totalRevenue: number;
  totalActualCost: number;
  totalStandardCost: number;
  totalCostVariance: number;
  totalGrossProfit: number;
  blendedGrossMarginPercent: number;
  highMarginCount: number;
  healthyCount: number;
  atRiskCount: number;
  lossMakingCount: number;
  liveShopFloorJobsCount: number;
  topOverrunWorkOrder?: {
    orderNumber: string;
    partName: string;
    varianceCost: number;
    variancePercent: number;
    primaryDriver: 'Material' | 'Labor' | 'Machine' | 'Overhead';
  };
}

export interface CostRollupFilterParams {
  searchQuery: string;
  status: 'all' | 'in_progress' | 'ready' | 'completed' | 'paused';
  marginHealth: 'all' | MarginHealthStatus;
  plantId: string;
  sortBy: 'orderNumber' | 'revenue' | 'actualCost' | 'actualMarginPercent' | 'varianceCost' | 'dueDate';
  sortOrder: 'asc' | 'desc';
  liveOnly: boolean;
}

export interface MaterialIssueInput {
  workOrderId: string;
  bomItemId: string;
  materialCode: string;
  materialName: string;
  lotNumber: string;
  storeLocation: string;
  binCode: string;
  qtyToIssue: number;
  unit: string;
  unitCost: number;
  operatorName: string;
  grnNumber?: string;
  notes?: string;
}
