// src/services/costSimulationService.ts

import {
  CostSimulationScenario,
  ProductSimulationResult,
  PortfolioSimulationSummary,
  MultiScenarioComparisonData
} from '../types/costSimulation';
import { costRollupService } from './costRollupService';
import { WorkOrderCostRollup } from '../types/costRollup';

const STORAGE_KEY_SIMULATION_SCENARIOS = 'flowops_cost_simulation_scenarios';

export const BASELINE_SCENARIO: CostSimulationScenario = {
  id: 'scenario-baseline',
  name: 'Baseline (Current Actuals & Rates)',
  description: 'Unadjusted baseline actuals calculated from current shop floor and inventory data.',
  category: 'custom',
  isPreset: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  author: 'System Baseline',
  materials: {
    globalMaterialPercent: 0,
    steelForgingPercent: 0,
    aluminumAlloyPercent: 0,
    exoticSuperalloyPercent: 0,
    hardwareFastenersPercent: 0,
    scrapWasteRateMultiplier: 1.0
  },
  labor: {
    globalLaborRatePercent: 0,
    overtimeHourMultiplier: 1.5,
    skilledSpecialistPercent: 0,
    setupLaborEfficiencyPercent: 0
  },
  routing: {
    cycleTimeEfficiencyPercent: 0,
    machineHourRatePercent: 0,
    facilityPowerTariffPercent: 0,
    subcontractRatePercent: 0,
    insourceSubcontractOperations: false
  },
  commercials: {
    customerPricePassThroughPercent: 0
  }
};

export const PRESET_SCENARIOS: CostSimulationScenario[] = [
  BASELINE_SCENARIO,
  {
    id: 'scenario-mat-inflation',
    name: 'Raw Material Inflation (+20% Steel & Alloy Surcharge)',
    description: 'Simulates a 20% surge in raw steel and alloy ingot costs with zero customer price pass-through.',
    category: 'inflation',
    isPreset: true,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-02-15T00:00:00Z',
    author: 'Strategic Sourcing',
    materials: {
      globalMaterialPercent: 20,
      steelForgingPercent: 22,
      aluminumAlloyPercent: 18,
      exoticSuperalloyPercent: 25,
      hardwareFastenersPercent: 5,
      scrapWasteRateMultiplier: 1.05
    },
    labor: {
      globalLaborRatePercent: 0,
      overtimeHourMultiplier: 1.5,
      skilledSpecialistPercent: 0,
      setupLaborEfficiencyPercent: 0
    },
    routing: {
      cycleTimeEfficiencyPercent: 0,
      machineHourRatePercent: 0,
      facilityPowerTariffPercent: 0,
      subcontractRatePercent: 8,
      insourceSubcontractOperations: false
    },
    commercials: {
      customerPricePassThroughPercent: 0
    }
  },
  {
    id: 'scenario-wage-revision',
    name: 'Annual Shop Floor Wage Revision (+12% Direct Labor)',
    description: 'Models union contract wage settlement increasing machinist hourly wages by 12% and overtime to 2.0x.',
    category: 'wage_revision',
    isPreset: true,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    author: 'HR & Operations',
    materials: {
      globalMaterialPercent: 0,
      steelForgingPercent: 0,
      aluminumAlloyPercent: 0,
      exoticSuperalloyPercent: 0,
      hardwareFastenersPercent: 0,
      scrapWasteRateMultiplier: 1.0
    },
    labor: {
      globalLaborRatePercent: 12,
      overtimeHourMultiplier: 2.0,
      skilledSpecialistPercent: 15,
      setupLaborEfficiencyPercent: 0
    },
    routing: {
      cycleTimeEfficiencyPercent: 0,
      machineHourRatePercent: 5,
      facilityPowerTariffPercent: 0,
      subcontractRatePercent: 0,
      insourceSubcontractOperations: false
    },
    commercials: {
      customerPricePassThroughPercent: 0
    }
  },
  {
    id: 'scenario-lean-machining',
    name: 'High-Speed 5-Axis Routing Optimization (-20% Cycle Time)',
    description: 'Implements high-feed ceramic inserts and CAM toolpath optimization reducing spindle cycle time by 20% and setup by 30%.',
    category: 'efficiency',
    isPreset: true,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    author: 'Manufacturing Engineering',
    materials: {
      globalMaterialPercent: 0,
      steelForgingPercent: 0,
      aluminumAlloyPercent: 0,
      exoticSuperalloyPercent: 0,
      hardwareFastenersPercent: 0,
      scrapWasteRateMultiplier: 0.85 // 15% reduction in scrap waste
    },
    labor: {
      globalLaborRatePercent: 0,
      overtimeHourMultiplier: 1.5,
      skilledSpecialistPercent: 0,
      setupLaborEfficiencyPercent: -30 // 30% faster setup via SMED
    },
    routing: {
      cycleTimeEfficiencyPercent: -20, // 20% faster run cycle
      machineHourRatePercent: 5,       // +5% higher tooling allowance
      facilityPowerTariffPercent: 0,
      subcontractRatePercent: 0,
      insourceSubcontractOperations: false
    },
    commercials: {
      customerPricePassThroughPercent: 0
    }
  },
  {
    id: 'scenario-stagflation-stress',
    name: 'Severe Supply Shock Stress Test (+30% Raw Material, +15% Power)',
    description: 'Worst-case industrial stress test combining raw material hyper-inflation and facility power tariff spikes.',
    category: 'stress_test',
    isPreset: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    author: 'Chief Financial Officer',
    materials: {
      globalMaterialPercent: 30,
      steelForgingPercent: 32,
      aluminumAlloyPercent: 28,
      exoticSuperalloyPercent: 40,
      hardwareFastenersPercent: 10,
      scrapWasteRateMultiplier: 1.15
    },
    labor: {
      globalLaborRatePercent: 10,
      overtimeHourMultiplier: 1.8,
      skilledSpecialistPercent: 12,
      setupLaborEfficiencyPercent: 0
    },
    routing: {
      cycleTimeEfficiencyPercent: 0,
      machineHourRatePercent: 18,
      facilityPowerTariffPercent: 20,
      subcontractRatePercent: 15,
      insourceSubcontractOperations: false
    },
    commercials: {
      customerPricePassThroughPercent: 0
    }
  },
  {
    id: 'scenario-passthrough-mitigation',
    name: 'Material Surcharge with 70% Customer Pass-Through',
    description: 'Models +25% material inflation coupled with contract renegotiation to pass through 70% of cost increases.',
    category: 'inflation',
    isPreset: true,
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
    author: 'Commercial & Sales',
    materials: {
      globalMaterialPercent: 25,
      steelForgingPercent: 25,
      aluminumAlloyPercent: 22,
      exoticSuperalloyPercent: 30,
      hardwareFastenersPercent: 5,
      scrapWasteRateMultiplier: 1.0
    },
    labor: {
      globalLaborRatePercent: 5,
      overtimeHourMultiplier: 1.5,
      skilledSpecialistPercent: 5,
      setupLaborEfficiencyPercent: 0
    },
    routing: {
      cycleTimeEfficiencyPercent: 0,
      machineHourRatePercent: 5,
      facilityPowerTariffPercent: 0,
      subcontractRatePercent: 10,
      insourceSubcontractOperations: false
    },
    commercials: {
      customerPricePassThroughPercent: 70
    }
  }
];

class CostSimulationService {
  // ── Scenario Management (Save / Load / CRUD) ────────────────────
  getScenarios(): CostSimulationScenario[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SIMULATION_SCENARIOS);
      if (stored) {
        const parsed = JSON.parse(stored) as CostSimulationScenario[];
        // Combine presets with user saved scenarios
        const presetIds = new Set(PRESET_SCENARIOS.map(p => p.id));
        const userCustoms = parsed.filter(s => !presetIds.has(s.id));
        return [...PRESET_SCENARIOS, ...userCustoms];
      }
    } catch (e) {
      console.warn('Failed to parse simulation scenarios from storage:', e);
    }
    return PRESET_SCENARIOS;
  }

  saveScenario(scenario: CostSimulationScenario): CostSimulationScenario {
    const scenarios = this.getScenarios();
    const index = scenarios.findIndex(s => s.id === scenario.id);
    const updated = {
      ...scenario,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      scenarios[index] = updated;
    } else {
      scenarios.push(updated);
    }

    localStorage.setItem(STORAGE_KEY_SIMULATION_SCENARIOS, JSON.stringify(scenarios));
    return updated;
  }

  deleteScenario(id: string): boolean {
    if (id.startsWith('scenario-baseline') || PRESET_SCENARIOS.some(p => p.id === id && p.isPreset)) {
      return false; // Cannot delete core system presets
    }
    const scenarios = this.getScenarios().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SIMULATION_SCENARIOS, JSON.stringify(scenarios));
    return true;
  }

  duplicateScenario(id: string): CostSimulationScenario | null {
    const source = this.getScenarios().find(s => s.id === id);
    if (!source) return null;

    const copy: CostSimulationScenario = {
      ...source,
      id: `scenario-custom-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isPreset: false,
      category: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'User'
    };

    return this.saveScenario(copy);
  }

  resetToDefaults(): CostSimulationScenario[] {
    localStorage.removeItem(STORAGE_KEY_SIMULATION_SCENARIOS);
    return PRESET_SCENARIOS;
  }

  // ── Single Product Simulation Calculation ──────────────────────
  simulateProduct(
    rollup: WorkOrderCostRollup,
    scenario: CostSimulationScenario
  ): ProductSimulationResult {
    const qty = rollup.quantity || 1;

    // 1. Baseline Values
    const baselineRevenue = rollup.totalRevenue;
    const baselineSellingPrice = rollup.contractPricePerUnit;
    const baselineMaterialCost = rollup.actualMaterialCost;
    const baselineLaborCost = rollup.actualLaborCost;
    const baselineMachineCost = rollup.actualMachineCost;
    const baselineSubcontractCost = rollup.actualSubcontractCost;
    const baselineOverheadCost = rollup.totalOverheadCost;
    const baselineTotalCost = rollup.actualTotalCost;
    const baselineUnitCost = Number((baselineTotalCost / qty).toFixed(2));
    const baselineGrossProfit = rollup.actualGrossProfit;
    const baselineGrossMarginPercent = Number(rollup.actualGrossMarginPercent.toFixed(1));

    // 2. Simulated Material Cost
    // Determine material category modifier based on part code / material descriptions
    let materialMultiplier = 1 + (scenario.materials.globalMaterialPercent / 100);
    const partCodeUpper = rollup.partCode.toUpperCase();
    if (partCodeUpper.includes('INC') || partCodeUpper.includes('TI') || partCodeUpper.includes('TSR')) {
      materialMultiplier = 1 + (scenario.materials.exoticSuperalloyPercent / 100);
    } else if (partCodeUpper.includes('AL') || partCodeUpper.includes('HMB')) {
      materialMultiplier = 1 + (scenario.materials.aluminumAlloyPercent / 100);
    } else if (partCodeUpper.includes('GB') || partCodeUpper.includes('DS') || partCodeUpper.includes('SKA')) {
      materialMultiplier = 1 + (scenario.materials.steelForgingPercent / 100);
    }

    const scrapMultiplier = scenario.materials.scrapWasteRateMultiplier || 1.0;
    const simulatedMaterialCost = Math.round(baselineMaterialCost * materialMultiplier * scrapMultiplier);

    // 3. Simulated Labor Cost
    const laborMultiplier = 1 + (scenario.labor.globalLaborRatePercent / 100);
    const setupEfficiencyMultiplier = 1 + (scenario.labor.setupLaborEfficiencyPercent / 100);
    // Weighted combination of run labor and setup labor
    const simulatedLaborCost = Math.round(baselineLaborCost * laborMultiplier * Math.max(0.4, setupEfficiencyMultiplier));

    // 4. Simulated Machine Cost (Cycle time reduction & MHR adjustment)
    const cycleTimeMultiplier = 1 + (scenario.routing.cycleTimeEfficiencyPercent / 100);
    const mhrMultiplier = 1 + (scenario.routing.machineHourRatePercent / 100) + (scenario.routing.facilityPowerTariffPercent / 200);
    const simulatedMachineCost = Math.round(baselineMachineCost * Math.max(0.3, cycleTimeMultiplier) * mhrMultiplier);

    // 5. Simulated Subcontract Cost
    let simulatedSubcontractCost = baselineSubcontractCost;
    if (scenario.routing.insourceSubcontractOperations) {
      // In-sourcing reduces subcontracting to near zero but absorbs modest in-house machine time
      simulatedSubcontractCost = Math.round(baselineSubcontractCost * 0.2);
    } else {
      simulatedSubcontractCost = Math.round(baselineSubcontractCost * (1 + (scenario.routing.subcontractRatePercent / 100)));
    }

    // 6. Simulated Overhead Cost
    // Overhead absorbs direct labor and machine shifts
    const overheadMethod = rollup.overheadConfigApplied.method;
    let simulatedOverheadCost = baselineOverheadCost;

    if (overheadMethod === 'percent_direct_labor') {
      simulatedOverheadCost = Math.round(simulatedLaborCost * (rollup.overheadConfigApplied.laborOverheadPercent / 100));
    } else if (overheadMethod === 'hybrid_industrial') {
      const laborPortion = simulatedLaborCost * (rollup.overheadConfigApplied.laborOverheadPercent / 100);
      const machinePortion = simulatedMachineCost * 0.35;
      simulatedOverheadCost = Math.round(laborPortion + machinePortion + (qty * rollup.overheadConfigApplied.factoryFixedRatePerUnit));
    } else {
      // General scaling with prime cost
      const baselinePrime = baselineMaterialCost + baselineLaborCost + baselineMachineCost;
      const simPrime = simulatedMaterialCost + simulatedLaborCost + simulatedMachineCost;
      const primeRatio = baselinePrime > 0 ? simPrime / baselinePrime : 1;
      simulatedOverheadCost = Math.round(baselineOverheadCost * primeRatio);
    }

    // 7. Simulated Total Cost & Deltas
    const simulatedTotalCost = simulatedMaterialCost + simulatedLaborCost + simulatedMachineCost + simulatedSubcontractCost + simulatedOverheadCost;
    const simulatedUnitCost = Number((simulatedTotalCost / qty).toFixed(2));
    const costDeltaAmount = simulatedTotalCost - baselineTotalCost;
    const costDeltaPercent = baselineTotalCost > 0 ? Number(((costDeltaAmount / baselineTotalCost) * 100).toFixed(1)) : 0;

    // 8. Commercial Pass-Through & Revenue
    const passThroughPct = scenario.commercials.customerPricePassThroughPercent || 0;
    let simulatedRevenue = baselineRevenue;
    let simulatedSellingPrice = baselineSellingPrice;

    if (costDeltaAmount > 0 && passThroughPct > 0) {
      // Pass portion of cost increase to selling price
      const passedCostIncrease = costDeltaAmount * (passThroughPct / 100);
      simulatedRevenue = Math.round(baselineRevenue + passedCostIncrease);
      simulatedSellingPrice = Number((simulatedRevenue / qty).toFixed(2));
    }

    const simulatedGrossProfit = simulatedRevenue - simulatedTotalCost;
    const simulatedGrossMarginPercent = simulatedRevenue > 0
      ? Number(((simulatedGrossProfit / simulatedRevenue) * 100).toFixed(1))
      : 0;

    const profitDeltaAmount = simulatedGrossProfit - baselineGrossProfit;
    const marginDeltaPercent = Number((simulatedGrossMarginPercent - baselineGrossMarginPercent).toFixed(1));

    // Suggested Breakeven Price: Selling price needed to maintain exact baseline gross profit
    const suggestedBreakevenPrice = Number(((simulatedTotalCost + baselineGrossProfit) / qty).toFixed(2));

    const isMarginEroded = marginDeltaPercent <= -3.0;
    const isLossMaking = simulatedGrossProfit < 0;
    const isBenefiting = marginDeltaPercent >= 1.5;

    return {
      workOrderId: rollup.workOrderId,
      workOrderNumber: rollup.workOrderNumber,
      partCode: rollup.partCode,
      partName: rollup.partName,
      customerName: rollup.customerName,
      quantity: qty,

      baselineSellingPrice,
      baselineRevenue,
      baselineMaterialCost,
      baselineLaborCost,
      baselineMachineCost,
      baselineSubcontractCost,
      baselineOverheadCost,
      baselineTotalCost,
      baselineUnitCost,
      baselineGrossProfit,
      baselineGrossMarginPercent,

      simulatedSellingPrice,
      simulatedRevenue,
      simulatedMaterialCost,
      simulatedLaborCost,
      simulatedMachineCost,
      simulatedSubcontractCost,
      simulatedOverheadCost,
      simulatedTotalCost,
      simulatedUnitCost,
      simulatedGrossProfit,
      simulatedGrossMarginPercent,

      costDeltaAmount,
      costDeltaPercent,
      profitDeltaAmount,
      marginDeltaPercent,
      suggestedBreakevenPrice,

      isMarginEroded,
      isLossMaking,
      isBenefiting
    };
  }

  // ── Portfolio Simulation Calculation ───────────────────────────
  simulatePortfolio(
    scenario: CostSimulationScenario,
    workOrders?: WorkOrderCostRollup[]
  ): {
    summary: PortfolioSimulationSummary;
    products: ProductSimulationResult[];
  } {
    const rollups = workOrders || costRollupService.getAllWorkOrderCostRollups();
    const products = rollups.map(r => this.simulateProduct(r, scenario));

    let totalRevenueBaseline = 0;
    let totalRevenueSimulated = 0;
    let totalCostBaseline = 0;
    let totalCostSimulated = 0;
    let grossProfitBaseline = 0;
    let grossProfitSimulated = 0;

    let materialCostImpact = 0;
    let laborCostImpact = 0;
    let machineCostImpact = 0;
    let overheadCostImpact = 0;
    let subcontractCostImpact = 0;
    let revenuePassThroughImpact = 0;

    let jobsProfitableCount = 0;
    let jobsLossMakingCount = 0;
    let jobsFlippedToLossCount = 0;
    let jobsMarginErodedCount = 0;
    let jobsMarginImprovedCount = 0;

    products.forEach(p => {
      totalRevenueBaseline += p.baselineRevenue;
      totalRevenueSimulated += p.simulatedRevenue;
      totalCostBaseline += p.baselineTotalCost;
      totalCostSimulated += p.simulatedTotalCost;
      grossProfitBaseline += p.baselineGrossProfit;
      grossProfitSimulated += p.simulatedGrossProfit;

      materialCostImpact += (p.simulatedMaterialCost - p.baselineMaterialCost);
      laborCostImpact += (p.simulatedLaborCost - p.baselineLaborCost);
      machineCostImpact += (p.simulatedMachineCost - p.baselineMachineCost);
      overheadCostImpact += (p.simulatedOverheadCost - p.baselineOverheadCost);
      subcontractCostImpact += (p.simulatedSubcontractCost - p.baselineSubcontractCost);
      revenuePassThroughImpact += (p.simulatedRevenue - p.baselineRevenue);

      if (p.simulatedGrossProfit >= 0) {
        jobsProfitableCount++;
      } else {
        jobsLossMakingCount++;
      }

      if (p.baselineGrossProfit >= 0 && p.simulatedGrossProfit < 0) {
        jobsFlippedToLossCount++;
      }

      if (p.isMarginEroded) jobsMarginErodedCount++;
      if (p.isBenefiting) jobsMarginImprovedCount++;
    });

    const netCostDeltaAmount = totalCostSimulated - totalCostBaseline;
    const netCostDeltaPercent = totalCostBaseline > 0
      ? Number(((netCostDeltaAmount / totalCostBaseline) * 100).toFixed(1))
      : 0;

    const netProfitDeltaAmount = grossProfitSimulated - grossProfitBaseline;
    const blendedMarginBaselinePercent = totalRevenueBaseline > 0
      ? Number(((grossProfitBaseline / totalRevenueBaseline) * 100).toFixed(1))
      : 0;
    const blendedMarginSimulatedPercent = totalRevenueSimulated > 0
      ? Number(((grossProfitSimulated / totalRevenueSimulated) * 100).toFixed(1))
      : 0;
    const marginDeltaPoints = Number((blendedMarginSimulatedPercent - blendedMarginBaselinePercent).toFixed(1));

    const summary: PortfolioSimulationSummary = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      totalJobsCount: products.length,
      totalRevenueBaseline,
      totalRevenueSimulated,
      totalCostBaseline,
      totalCostSimulated,
      netCostDeltaAmount,
      netCostDeltaPercent,
      grossProfitBaseline,
      grossProfitSimulated,
      netProfitDeltaAmount,
      blendedMarginBaselinePercent,
      blendedMarginSimulatedPercent,
      marginDeltaPoints,

      materialCostImpact,
      laborCostImpact,
      machineCostImpact,
      overheadCostImpact,
      subcontractCostImpact,
      revenuePassThroughImpact,

      jobsProfitableCount,
      jobsLossMakingCount,
      jobsFlippedToLossCount,
      jobsMarginErodedCount,
      jobsMarginImprovedCount
    };

    return { summary, products };
  }

  // ── Multi-Scenario Comparison ─────────────────────────────────
  compareMultipleScenarios(
    scenarioIds: string[]
  ): MultiScenarioComparisonData {
    const allScenarios = this.getScenarios();
    const rollups = costRollupService.getAllWorkOrderCostRollups();

    // Baseline
    const baselineScenario = allScenarios.find(s => s.id === 'scenario-baseline') || BASELINE_SCENARIO;
    const { summary: baselineSummary, products: baselineProducts } = this.simulatePortfolio(baselineScenario, rollups);

    // Filter target scenarios
    const selectedScenarios = allScenarios.filter(s => 
      scenarioIds.includes(s.id) && s.id !== 'scenario-baseline'
    );

    const scenarioSummaries: PortfolioSimulationSummary[] = [];
    const scenarioProductMaps: Record<string, ProductSimulationResult[]> = {};

    selectedScenarios.forEach(sc => {
      const { summary, products } = this.simulatePortfolio(sc, rollups);
      scenarioSummaries.push(summary);
      scenarioProductMaps[sc.id] = products;
    });

    // Map each product across selected scenarios
    const productComparisons = baselineProducts.map(bp => {
      const scenarioResults: Record<string, any> = {};

      selectedScenarios.forEach(sc => {
        const simProduct = scenarioProductMaps[sc.id]?.find(p => p.workOrderId === bp.workOrderId);
        if (simProduct) {
          scenarioResults[sc.id] = {
            simulatedMargin: simProduct.simulatedGrossMarginPercent,
            simulatedProfit: simProduct.simulatedGrossProfit,
            marginDelta: simProduct.marginDeltaPercent,
            profitDelta: simProduct.profitDeltaAmount,
            isLossMaking: simProduct.isLossMaking
          };
        }
      });

      return {
        workOrderId: bp.workOrderId,
        workOrderNumber: bp.workOrderNumber,
        partCode: bp.partCode,
        partName: bp.partName,
        customerName: bp.customerName,
        baselineMargin: bp.baselineGrossMarginPercent,
        baselineProfit: bp.baselineGrossProfit,
        scenarioResults
      };
    });

    return {
      baselineSummary,
      scenarioSummaries,
      productComparisons
    };
  }

  // ── Export Multi-Scenario Comparison CSV ──────────────────────
  exportComparisonCsv(data: MultiScenarioComparisonData): string {
    const scenarioHeaders = data.scenarioSummaries.map(s => `"${s.scenarioName} (Margin %)"`).join(',');
    const scenarioProfitHeaders = data.scenarioSummaries.map(s => `"${s.scenarioName} (Profit INR)"`).join(',');

    const headers = [
      'Work Order #',
      'Part Code',
      'Part Name',
      'Customer',
      'Baseline Margin %',
      'Baseline Profit (INR)',
      scenarioHeaders,
      scenarioProfitHeaders
    ].join(',');

    const lines = data.productComparisons.map(p => {
      const marginVals = data.scenarioSummaries.map(s => `${p.scenarioResults[s.scenarioId]?.simulatedMargin ?? ''}%`).join(',');
      const profitVals = data.scenarioSummaries.map(s => `${p.scenarioResults[s.scenarioId]?.simulatedProfit ?? ''}`).join(',');

      return [
        p.workOrderNumber,
        p.partCode,
        `"${p.partName.replace(/"/g, '""')}"`,
        `"${p.customerName.replace(/"/g, '""')}"`,
        `${p.baselineMargin}%`,
        p.baselineProfit,
        marginVals,
        profitVals
      ].join(',');
    });

    return [headers, ...lines].join('\n');
  }
}

export const costSimulationService = new CostSimulationService();
