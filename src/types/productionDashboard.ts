// src/types/productionDashboard.ts

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'full_day';

export interface ProductionPlanSummary {
  shiftName: string;
  plannedUnits: number;
  actualUnits: number;
  scrapUnits: number;
  planAttainmentPct: number; // actual / planned * 100
  firstPassYieldPct: number; // (actual - scrap) / actual * 100
  runRateUnitsPerHour: number;
  targetUnitsPerHour: number;
  shiftHoursRemaining: number;
  shiftStatus: 'ahead' | 'on_track' | 'behind';
}

export interface HourlyProductionPoint {
  hour: string; // '08:00', '09:00', '10:00', etc.
  plannedUnits: number;
  actualUnits: number;
  scrapUnits: number;
}

export interface WipOperationStage {
  id: string;
  stageName: string;
  operationCode: string;
  sequence: number; // 10, 20, 30...
  workCenterName: string;
  totalPieces: number;
  batchCount: number;
  wipValue: number;
  avgCycleMinutes: number;
  isBottleneck: boolean;
  status: 'smooth' | 'accumulating' | 'choked';
}

export interface BottleneckAlert {
  id: string;
  workCenterCode: string;
  workCenterName: string;
  operationName: string;
  severity: 'critical' | 'warning' | 'advisory';
  utilizationPct: number;
  queuedPieces: number;
  estimatedClearingHours: number;
  cycleTimeVariancePct: number;
  rootCause: string;
  impactedWorkOrdersCount: number;
  suggestedActions: Array<{
    id: string;
    label: string;
    description: string;
    type: 'reroute' | 'overtime' | 'split_order' | 'maintenance';
  }>;
}

export interface MachineOeeCardData {
  machineId: string;
  machineCode: string;
  machineName: string;
  department: string;
  state: 'running' | 'idle' | 'faulted' | 'setup';
  oeePct: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  activeWorkOrder?: string;
  activePart?: string;
  currentRpm?: number;
  targetPiecesShift: number;
  actualPiecesShift: number;
  downtimeMinutesToday: number;
}
