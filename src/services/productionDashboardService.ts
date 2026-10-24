// src/services/productionDashboardService.ts

import { 
  ProductionPlanSummary, 
  HourlyProductionPoint, 
  WipOperationStage, 
  BottleneckAlert, 
  MachineOeeCardData 
} from '../types/productionDashboard';
import { oeeService } from './oeeService';

export const SEED_HOURLY_PRODUCTION: HourlyProductionPoint[] = [
  { hour: '08:00 - 09:00', plannedUnits: 150, actualUnits: 142, scrapUnits: 2 },
  { hour: '09:00 - 10:00', plannedUnits: 150, actualUnits: 148, scrapUnits: 1 },
  { hour: '10:00 - 11:00', plannedUnits: 150, actualUnits: 152, scrapUnits: 3 },
  { hour: '11:00 - 12:00', plannedUnits: 150, actualUnits: 138, scrapUnits: 2 },
  { hour: '12:00 - 13:00', plannedUnits: 150, actualUnits: 144, scrapUnits: 1 },
  { hour: '13:00 - 14:00', plannedUnits: 150, actualUnits: 149, scrapUnits: 2 },
  { hour: '14:00 - 15:00', plannedUnits: 150, actualUnits: 125, scrapUnits: 4 }, // temporary tooling setup
  { hour: '15:00 - 16:00', plannedUnits: 150, actualUnits: 122, scrapUnits: 1 }  // current hour in progress
];

export const SEED_WIP_STAGES: WipOperationStage[] = [
  {
    id: 'wip-stg-10',
    stageName: 'Cutting & Raw Stock Sizing',
    operationCode: 'OP-10',
    sequence: 10,
    workCenterName: 'Bandsaw Cutting Station BS-01',
    totalPieces: 420,
    batchCount: 3,
    wipValue: 320000,
    avgCycleMinutes: 4.2,
    isBottleneck: false,
    status: 'smooth'
  },
  {
    id: 'wip-stg-20',
    stageName: 'CNC Heavy Rough Machining',
    operationCode: 'OP-20',
    sequence: 20,
    workCenterName: 'Doosan Puma CNC Lathe WC-CNC-02',
    totalPieces: 680,
    batchCount: 6,
    wipValue: 780000,
    avgCycleMinutes: 14.5,
    isBottleneck: true,
    status: 'choked'
  },
  {
    id: 'wip-stg-30',
    stageName: 'Induction Heat Treatment & Annealing',
    operationCode: 'OP-30',
    sequence: 30,
    workCenterName: 'Aichelin Furnace HT-01',
    totalPieces: 340,
    batchCount: 2,
    wipValue: 410000,
    avgCycleMinutes: 12.0,
    isBottleneck: false,
    status: 'smooth'
  },
  {
    id: 'wip-stg-40',
    stageName: 'Precision Finish Grinding & Turning',
    operationCode: 'OP-40',
    sequence: 40,
    workCenterName: 'Haas VF-4 VMC Machining Center #01',
    totalPieces: 510,
    batchCount: 4,
    wipValue: 640000,
    avgCycleMinutes: 8.6,
    isBottleneck: false,
    status: 'accumulating'
  },
  {
    id: 'wip-stg-50',
    stageName: 'Surface Treatment & Black Oxide',
    operationCode: 'OP-50',
    sequence: 50,
    workCenterName: 'Subcontract Coating Line (Vendor Plant)',
    totalPieces: 180,
    batchCount: 2,
    wipValue: 150000,
    avgCycleMinutes: 24.0,
    isBottleneck: false,
    status: 'smooth'
  },
  {
    id: 'wip-stg-60',
    stageName: 'Final Quality Gate (FQC Inspection)',
    operationCode: 'OP-60',
    sequence: 60,
    workCenterName: 'CMM Metrology Inspection Bay',
    totalPieces: 140,
    batchCount: 2,
    wipValue: 180000,
    avgCycleMinutes: 2.8,
    isBottleneck: false,
    status: 'smooth'
  }
];

export const PRIMARY_BOTTLENECK: BottleneckAlert = {
  id: 'btn-alert-1',
  workCenterCode: 'WC-CNC-02',
  workCenterName: 'Doosan Puma CNC Lathe #02 (Heavy Turning Cell)',
  operationName: 'Op 20: CNC Heavy Rough Machining',
  severity: 'critical',
  utilizationPct: 95.8,
  queuedPieces: 680,
  estimatedClearingHours: 5.4,
  cycleTimeVariancePct: 18.2,
  rootCause: 'Heavy stock allowance on incoming forgings (Lot #HEAT-9941) requiring 3 passes instead of 2. Queue accumulation is constraining downstream heat treatment.',
  impactedWorkOrdersCount: 4,
  suggestedActions: [
    {
      id: 'act-1',
      label: '⚡ Offload 240 pcs to Standby Lathe WC-CNC-04',
      description: 'Re-assign WO-2026-0075 routing operation to identical CNC-04 spindle to cut queue by 35%.',
      type: 'reroute'
    },
    {
      id: 'act-2',
      label: '🔄 Authorize 2-Hour Operator Overtime (Shift B)',
      description: 'Extend shift operation from 16:30 to 18:30 to recover 85 pieces before night heat treat batch.',
      type: 'overtime'
    },
    {
      id: 'act-3',
      label: '📦 Split WO-2026-0072 into 2 Sub-Batches (200 + 200)',
      description: 'Push 200 finished rough pieces immediately to Heat Treat furnace to prevent stage starvation.',
      type: 'split_order'
    },
    {
      id: 'act-4',
      label: '🔧 Index Carbide Insert Tool Tips at 16:00 Break',
      description: 'Flank wear on insert T02 causing 12% cycle time elongation. Quick 8-minute index restores nominal feedrate.',
      type: 'maintenance'
    }
  ]
};

class ProductionDashboardService {
  /**
   * Retrieves live Shift Plan summary
   */
  public getProductionPlanSummary(): ProductionPlanSummary {
    const plannedUnits = 1200;
    const actualUnits = 1120;
    const scrapUnits = 16;
    const goodUnits = actualUnits - scrapUnits;

    return {
      shiftName: 'General Shift A (08:00 - 16:30)',
      plannedUnits,
      actualUnits,
      scrapUnits,
      planAttainmentPct: Number(((actualUnits / plannedUnits) * 100).toFixed(1)), // 93.3%
      firstPassYieldPct: Number(((goodUnits / actualUnits) * 100).toFixed(1)),   // 98.6%
      runRateUnitsPerHour: 140,
      targetUnitsPerHour: 150,
      shiftHoursRemaining: 1.5,
      shiftStatus: 'on_track'
    };
  }

  /**
   * Retrieves hourly production progression
   */
  public getHourlyProduction(): HourlyProductionPoint[] {
    return SEED_HOURLY_PRODUCTION;
  }

  /**
   * Retrieves WIP by operation stage
   */
  public getWipStages(): WipOperationStage[] {
    return SEED_WIP_STAGES;
  }

  /**
   * Retrieves identified primary bottleneck
   */
  public getBottleneckAlert(): BottleneckAlert {
    return PRIMARY_BOTTLENECK;
  }

  /**
   * Retrieves machine OEE fleet cards from oeeService or seed telemetry
   */
  public getMachineFleet(): MachineOeeCardData[] {
    const liveMachines = oeeService.getMachines();
    if (liveMachines && liveMachines.length > 0) {
      return liveMachines.map(m => ({
        machineId: m.machineId,
        machineCode: m.machineCode,
        machineName: m.machineName,
        department: m.department || 'Machining',
        state: m.state === 'running' || m.state === 'idle' || m.state === 'faulted' || m.state === 'setup' ? m.state : 'running',
        oeePct: m.oeePercent,
        availabilityPct: m.availabilityPercent,
        performancePct: m.performancePercent,
        qualityPct: m.qualityPercent,
        activeWorkOrder: m.activeWorkOrderNumber || 'WO-2026-0041',
        activePart: m.activePartName || 'Steering Knuckle Shaft',
        currentRpm: m.telemetry?.spindleRpm || 1450,
        targetPiecesShift: 240,
        actualPiecesShift: m.goodPieces || 218,
        downtimeMinutesToday: m.unplannedDowntimeMinutes || 18
      }));
    }

    // High fidelity fallback fleet
    return [
      {
        machineId: 'm-1',
        machineCode: 'WC-CNC-01',
        machineName: 'Haas VF-4 VMC Machining Center #01',
        department: 'Precision Milling',
        state: 'running',
        oeePct: 86.4,
        availabilityPct: 91.2,
        performancePct: 96.0,
        qualityPct: 98.7,
        activeWorkOrder: 'WO-2026-0041',
        activePart: 'CNC Gear Ring Flange',
        currentRpm: 4200,
        targetPiecesShift: 200,
        actualPiecesShift: 188,
        downtimeMinutesToday: 12
      },
      {
        machineId: 'm-2',
        machineCode: 'WC-CNC-02',
        machineName: 'Doosan Puma CNC Lathe #02 (Heavy Turning)',
        department: 'Heavy Turning',
        state: 'running',
        oeePct: 76.8,
        availabilityPct: 95.8,
        performancePct: 81.4,
        qualityPct: 98.5,
        activeWorkOrder: 'WO-2026-0072',
        activePart: 'Forged Spur Blank 450mm',
        currentRpm: 1200,
        targetPiecesShift: 180,
        actualPiecesShift: 142,
        downtimeMinutesToday: 35
      },
      {
        machineId: 'm-3',
        machineCode: 'WC-FP-500',
        machineName: '500-Tonne Hydraulic Hot Forging Press',
        department: 'Foundry & Forging',
        state: 'running',
        oeePct: 88.2,
        availabilityPct: 92.0,
        performancePct: 97.2,
        qualityPct: 98.7,
        activeWorkOrder: 'WO-2026-0081',
        activePart: 'Knuckle Forging Blank',
        currentRpm: 0,
        targetPiecesShift: 350,
        actualPiecesShift: 334,
        downtimeMinutesToday: 15
      },
      {
        machineId: 'm-4',
        machineCode: 'WC-WLD-01',
        machineName: 'OTC Daihen 6-Axis Robotic Welding Cell',
        department: 'Fabrication',
        state: 'running',
        oeePct: 84.1,
        availabilityPct: 89.5,
        performancePct: 94.6,
        qualityPct: 99.3,
        activeWorkOrder: 'WO-2026-0063',
        activePart: 'Cross-Member Bracket',
        currentRpm: 0,
        targetPiecesShift: 160,
        actualPiecesShift: 146,
        downtimeMinutesToday: 22
      },
      {
        machineId: 'm-5',
        machineCode: 'WC-GRD-01',
        machineName: 'Okamoto ACC-DX Surface & Creep Feed Grinder',
        department: 'Grinding Bay',
        state: 'idle',
        oeePct: 72.4,
        availabilityPct: 78.0,
        performancePct: 94.0,
        qualityPct: 98.8,
        activeWorkOrder: 'WO-2026-0065',
        activePart: 'Precision Bearing Spacer',
        currentRpm: 0,
        targetPiecesShift: 140,
        actualPiecesShift: 98,
        downtimeMinutesToday: 48
      },
      {
        machineId: 'm-6',
        machineCode: 'WC-HT-01',
        machineName: 'Aichelin Multi-Purpose Annealing Furnace',
        department: 'Heat Treatment',
        state: 'running',
        oeePct: 89.6,
        availabilityPct: 94.2,
        performancePct: 95.8,
        qualityPct: 99.4,
        activeWorkOrder: 'WO-2026-0068',
        activePart: 'EN19 Hardened Pinions',
        currentRpm: 0,
        targetPiecesShift: 280,
        actualPiecesShift: 268,
        downtimeMinutesToday: 10
      }
    ];
  }
}

export const productionDashboardService = new ProductionDashboardService();
