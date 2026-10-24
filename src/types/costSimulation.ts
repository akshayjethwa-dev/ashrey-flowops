// src/types/costSimulation.ts

export interface MaterialPriceLevers {
  globalMaterialPercent: number;          // e.g. +15% across all materials
  steelForgingPercent: number;            // e.g. +20% for alloy/case hardening steel
  aluminumAlloyPercent: number;           // e.g. +12% for Al6061/7075
  exoticSuperalloyPercent: number;        // e.g. +35% for Inconel/Titanium
  hardwareFastenersPercent: number;       // e.g. -2% bulk discount
  scrapWasteRateMultiplier: number;       // e.g. 1.25 = +25% scrap rate
}

export interface LaborRateLevers {
  globalLaborRatePercent: number;         // e.g. +12% annual wage revision
  overtimeHourMultiplier: number;         // e.g. 1.5x -> 2.0x OT premium
  skilledSpecialistPercent: number;       // e.g. +18% specialist premium
  setupLaborEfficiencyPercent: number;    // e.g. -15% setup time (faster setup)
}

export interface RoutingMachineLevers {
  cycleTimeEfficiencyPercent: number;     // e.g. -20% cycle time reduction via high-feed tooling
  machineHourRatePercent: number;         // e.g. +10% power tariff & maintenance
  facilityPowerTariffPercent: number;     // e.g. +18% electricity tariff hike
  subcontractRatePercent: number;         // e.g. +10% outsourced vendor hike
  insourceSubcontractOperations: boolean; // Shift subcontracted heat treatment/plating in-house
}

export interface CommercialPolicyLevers {
  customerPricePassThroughPercent: number;// % of net cost increase passed to customer (0% = absorb all, 100% = full pass-through)
  targetPortfolioMarginPercent?: number;  // Target margin goal e.g. 25%
}

export interface CostSimulationScenario {
  id: string;
  name: string;
  description: string;
  category: 'inflation' | 'efficiency' | 'stress_test' | 'custom' | 'wage_revision';
  isPreset: boolean;
  createdAt: string;
  updatedAt: string;
  author?: string;

  // Levers
  materials: MaterialPriceLevers;
  labor: LaborRateLevers;
  routing: RoutingMachineLevers;
  commercials: CommercialPolicyLevers;
}

export interface ProductSimulationResult {
  workOrderId: string;
  workOrderNumber: string;
  partCode: string;
  partName: string;
  customerName: string;
  quantity: number;

  // Baseline
  baselineSellingPrice: number;
  baselineRevenue: number;
  baselineMaterialCost: number;
  baselineLaborCost: number;
  baselineMachineCost: number;
  baselineSubcontractCost: number;
  baselineOverheadCost: number;
  baselineTotalCost: number;
  baselineUnitCost: number;
  baselineGrossProfit: number;
  baselineGrossMarginPercent: number;

  // Simulated
  simulatedSellingPrice: number;
  simulatedRevenue: number;
  simulatedMaterialCost: number;
  simulatedLaborCost: number;
  simulatedMachineCost: number;
  simulatedSubcontractCost: number;
  simulatedOverheadCost: number;
  simulatedTotalCost: number;
  simulatedUnitCost: number;
  simulatedGrossProfit: number;
  simulatedGrossMarginPercent: number;

  // Deltas
  costDeltaAmount: number;             // simulatedTotalCost - baselineTotalCost
  costDeltaPercent: number;            // (costDeltaAmount / baselineTotalCost) * 100
  profitDeltaAmount: number;           // simulatedGrossProfit - baselineGrossProfit
  marginDeltaPercent: number;          // simulatedGrossMarginPercent - baselineGrossMarginPercent
  suggestedBreakevenPrice: number;     // Selling price needed to preserve baseline gross profit

  // Health
  isMarginEroded: boolean;             // Margin dropped by >= 3%
  isLossMaking: boolean;               // Margin dropped below 0%
  isBenefiting: boolean;               // Margin improved (e.g. from lean cycle time reduction)
}

export interface PortfolioSimulationSummary {
  scenarioId: string;
  scenarioName: string;

  totalJobsCount: number;
  totalRevenueBaseline: number;
  totalRevenueSimulated: number;

  totalCostBaseline: number;
  totalCostSimulated: number;
  netCostDeltaAmount: number;
  netCostDeltaPercent: number;

  grossProfitBaseline: number;
  grossProfitSimulated: number;
  netProfitDeltaAmount: number;
  blendedMarginBaselinePercent: number;
  blendedMarginSimulatedPercent: number;
  marginDeltaPoints: number;

  // Driver breakdown of net delta
  materialCostImpact: number;
  laborCostImpact: number;
  machineCostImpact: number;
  overheadCostImpact: number;
  subcontractCostImpact: number;
  revenuePassThroughImpact: number;

  // Outcome Counts
  jobsProfitableCount: number;
  jobsLossMakingCount: number;
  jobsFlippedToLossCount: number;      // Jobs that were profitable in baseline but turned negative in scenario
  jobsMarginErodedCount: number;
  jobsMarginImprovedCount: number;
}

export interface MultiScenarioComparisonData {
  baselineSummary: PortfolioSimulationSummary;
  scenarioSummaries: PortfolioSimulationSummary[];
  productComparisons: {
    workOrderId: string;
    workOrderNumber: string;
    partCode: string;
    partName: string;
    customerName: string;
    baselineMargin: number;
    baselineProfit: number;
    scenarioResults: Record<string, {
      simulatedMargin: number;
      simulatedProfit: number;
      marginDelta: number;
      profitDelta: number;
      isLossMaking: boolean;
    }>;
  }[];
}
