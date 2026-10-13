// src/services/oeeService.ts

import {
  MachineLiveOee,
  MachineConnectionConfig,
  MachineState,
  PlantOeeSummary,
  HistoricalOeePoint,
  DowntimeLossCategory,
  DowntimeReasonCode,
  DowntimeEventRecord,
  DowntimeParetoItem
} from '../types/oee';

const STORAGE_KEY_MACHINES_OEE = 'flowops_machines_live_oee';
const STORAGE_KEY_OPCUA_CONFIGS = 'flowops_opcua_connection_configs';
const STORAGE_KEY_DOWNTIME_EVENTS = 'flowops_downtime_events_log';
const STORAGE_KEY_DOWNTIME_REASONS = 'flowops_downtime_reason_codes';

// ── Default Machine Fleet Configuration ─────────────────────────────
export const SEED_CONNECTION_CONFIGS: MachineConnectionConfig[] = [
  {
    machineId: 'wc_cnc_04',
    machineCode: 'WC-CNC-04',
    machineName: 'Doosan Puma CNC Lathe #04',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.104:4840/FlowOps/PLC',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=CNC04.MachineState',
    nodeIdPartsGood: 'ns=2;s=CNC04.PartCountGood',
    nodeIdPartsScrap: 'ns=2;s=CNC04.PartCountDefect',
    nodeIdSpindleRpm: 'ns=2;s=CNC04.SpindleSpeedActual',
    nodeIdFeedrate: 'ns=2;s=CNC04.FeedrateOverride',
    pollingIntervalMs: 1000,
    connectionStatus: 'connected',
    lastPingMs: 14,
    lastConnectedAt: new Date().toISOString()
  },
  {
    machineId: 'wc_saw_02',
    machineCode: 'WC-SAW-02',
    machineName: 'Horizontal Band Saw #02',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.102:4840/SawPLC',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=SAW02.OperatingMode',
    nodeIdPartsGood: 'ns=2;s=SAW02.CutsCompleted',
    nodeIdPartsScrap: 'ns=2;s=SAW02.CutsScrapped',
    nodeIdSpindleRpm: 'ns=2;s=SAW02.BladeSpeedMPerMin',
    nodeIdFeedrate: 'ns=2;s=SAW02.DownfeedRate',
    pollingIntervalMs: 1500,
    connectionStatus: 'connected',
    lastPingMs: 18,
    lastConnectedAt: new Date().toISOString()
  },
  {
    machineId: 'wc_hob_01',
    machineCode: 'WC-HOB-01',
    machineName: 'Liebherr Gear Hobber #01',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.108:4840/LiebherrCNC',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=HOB01.PLC_State',
    nodeIdPartsGood: 'ns=2;s=HOB01.TotalPartsOut',
    nodeIdPartsScrap: 'ns=2;s=HOB01.ToothDefects',
    nodeIdSpindleRpm: 'ns=2;s=HOB01.HobSpindleRPM',
    nodeIdFeedrate: 'ns=2;s=HOB01.AxialFeed',
    pollingIntervalMs: 1000,
    connectionStatus: 'connected',
    lastPingMs: 22,
    lastConnectedAt: new Date().toISOString()
  },
  {
    machineId: 'wc_vmc_03',
    machineCode: 'WC-VMC-03',
    machineName: 'Haas VF-4 4-Axis Vertical Mill',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.106:4840/HaasNextGen',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=VMC03.ExecutionState',
    nodeIdPartsGood: 'ns=2;s=VMC03.M30Counter',
    nodeIdPartsScrap: 'ns=2;s=VMC03.RejectedCycles',
    nodeIdSpindleRpm: 'ns=2;s=VMC03.SpindleRPM',
    nodeIdFeedrate: 'ns=2;s=VMC03.FeedPercent',
    pollingIntervalMs: 1000,
    connectionStatus: 'connected',
    lastPingMs: 16,
    lastConnectedAt: new Date().toISOString()
  },
  {
    machineId: 'wc_wld_02',
    machineCode: 'WC-WLD-02',
    machineName: 'ESAB Robotic Welding Cell',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.110:4840/RoboWeld',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=WLD02.RobotStatus',
    nodeIdPartsGood: 'ns=2;s=WLD02.WeldAssembliesDone',
    nodeIdPartsScrap: 'ns=2;s=WLD02.PorosityRejects',
    nodeIdSpindleRpm: 'ns=2;s=WLD02.WireFeedSpeed',
    nodeIdFeedrate: 'ns=2;s=WLD02.ArcVoltage',
    pollingIntervalMs: 1000,
    connectionStatus: 'connected',
    lastPingMs: 28,
    lastConnectedAt: new Date().toISOString()
  },
  {
    machineId: 'wc_cmm_01',
    machineCode: 'WC-CMM-01',
    machineName: 'Zeiss CMM Inspection Station',
    protocol: 'opc_ua',
    endpointUrl: 'opc.tcp://192.168.1.112:4840/CalypsoCMM',
    securityMode: 'None',
    securityPolicy: 'None',
    nodeIdState: 'ns=2;s=CMM01.MeasurementState',
    nodeIdPartsGood: 'ns=2;s=CMM01.CertifiedCount',
    nodeIdPartsScrap: 'ns=2;s=CMM01.DeviationOutCount',
    nodeIdSpindleRpm: 'ns=2;s=CMM01.ProbeStylusIndex',
    nodeIdFeedrate: 'ns=2;s=CMM01.SpeedFactor',
    pollingIntervalMs: 2000,
    connectionStatus: 'connected',
    lastPingMs: 12,
    lastConnectedAt: new Date().toISOString()
  }
];

// ── Initial Machine OEE Telemetry Fleet ──────────────────────────────
export const SEED_MACHINES_LIVE_OEE: MachineLiveOee[] = [
  {
    machineId: 'wc_cnc_04',
    machineCode: 'WC-CNC-04',
    machineName: 'Doosan Puma CNC Lathe #04',
    department: 'Machine Shop',
    state: 'running',
    stateSince: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    stateDurationMinutes: 74,
    activeWorkOrderNumber: 'WO-2026-0001',
    activePartName: 'Gear Blank — 42T',
    plannedProductionMinutes: 480,
    operatingMinutes: 420,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 18,
    idleMinutes: 12,
    setupMinutes: 30,
    totalPieces: 124,
    goodPieces: 122,
    scrapPieces: 2,
    idealCycleTimeSeconds: 195, // 3.25 min ideal
    availabilityPercent: 93.3, // (420 / 450)
    performancePercent: 95.8,  // ((195 * 124) / (420 * 60))
    qualityPercent: 98.4,      // (122 / 124)
    oeePercent: 88.0,          // 0.933 * 0.958 * 0.984
    telemetry: {
      spindleRpm: 1450,
      feedratePercent: 98,
      temperatureCelsius: 38.4,
      vibrationMmS: 1.4,
      powerKw: 14.8
    }
  },
  {
    machineId: 'wc_saw_02',
    machineCode: 'WC-SAW-02',
    machineName: 'Horizontal Band Saw #02',
    department: 'Cutting Bay',
    state: 'running',
    stateSince: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    stateDurationMinutes: 110,
    activeWorkOrderNumber: 'WO-2026-0002',
    activePartName: 'Shaft — Drive 30mm',
    plannedProductionMinutes: 480,
    operatingMinutes: 432,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 10,
    idleMinutes: 8,
    setupMinutes: 20,
    totalPieces: 250,
    goodPieces: 248,
    scrapPieces: 2,
    idealCycleTimeSeconds: 100,
    availabilityPercent: 96.0,
    performancePercent: 96.5,
    qualityPercent: 99.2,
    oeePercent: 91.9,
    telemetry: {
      spindleRpm: 480,
      feedratePercent: 100,
      temperatureCelsius: 32.1,
      vibrationMmS: 0.9,
      powerKw: 7.2
    }
  },
  {
    machineId: 'wc_hob_01',
    machineCode: 'WC-HOB-01',
    machineName: 'Liebherr Gear Hobber #01',
    department: 'Gear Cutting',
    state: 'idle',
    stateSince: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    stateDurationMinutes: 28,
    activeWorkOrderNumber: 'WO-2026-0001',
    activePartName: 'Gear Blank — 42T',
    plannedProductionMinutes: 480,
    operatingMinutes: 345,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 25,
    idleMinutes: 62,
    setupMinutes: 48,
    totalPieces: 65,
    goodPieces: 64,
    scrapPieces: 1,
    idealCycleTimeSeconds: 310,
    availabilityPercent: 76.7,
    performancePercent: 97.3,
    qualityPercent: 98.5,
    oeePercent: 73.5,
    downtimeReason: 'Material Starvation: Waiting for OP-20 CNC turning batch handover',
    telemetry: {
      spindleRpm: 0,
      feedratePercent: 0,
      temperatureCelsius: 29.5,
      vibrationMmS: 0.2,
      powerKw: 2.1
    }
  },
  {
    machineId: 'wc_vmc_03',
    machineCode: 'WC-VMC-03',
    machineName: 'Haas VF-4 4-Axis Vertical Mill',
    department: 'Machine Shop',
    state: 'setup',
    stateSince: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    stateDurationMinutes: 35,
    activeWorkOrderNumber: 'WO-2026-0003',
    activePartName: 'Coupling Flange 150mm',
    plannedProductionMinutes: 480,
    operatingMinutes: 380,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 15,
    idleMinutes: 20,
    setupMinutes: 65,
    totalPieces: 88,
    goodPieces: 86,
    scrapPieces: 2,
    idealCycleTimeSeconds: 240,
    availabilityPercent: 84.4,
    performancePercent: 92.6,
    qualityPercent: 97.7,
    oeePercent: 76.4,
    downtimeReason: 'Tool Probe Calibration: Touch off 4-axis tombstone offset',
    telemetry: {
      spindleRpm: 0,
      feedratePercent: 25,
      temperatureCelsius: 31.0,
      vibrationMmS: 0.4,
      powerKw: 3.5
    }
  },
  {
    machineId: 'wc_wld_02',
    machineCode: 'WC-WLD-02',
    machineName: 'ESAB Robotic Welding Cell',
    department: 'Fabrication',
    state: 'faulted',
    stateSince: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    stateDurationMinutes: 19,
    activeWorkOrderNumber: 'WO-2026-0003',
    activePartName: 'Coupling Flange Assembly',
    plannedProductionMinutes: 480,
    operatingMinutes: 310,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 85,
    idleMinutes: 25,
    setupMinutes: 30,
    totalPieces: 52,
    goodPieces: 49,
    scrapPieces: 3,
    idealCycleTimeSeconds: 340,
    availabilityPercent: 68.9,
    performancePercent: 95.1,
    qualityPercent: 94.2,
    oeePercent: 61.7,
    downtimeReason: 'ALARM E-402: Wire Feeder Jam & Gas Flow Interlock Trip',
    faultCode: 'ERR_WELD_FEED_JAM',
    telemetry: {
      spindleRpm: 0,
      feedratePercent: 0,
      temperatureCelsius: 44.2,
      vibrationMmS: 0.1,
      powerKw: 1.2
    }
  },
  {
    machineId: 'wc_cmm_01',
    machineCode: 'WC-CMM-01',
    machineName: 'Zeiss CMM Inspection Station',
    department: 'Quality Lab',
    state: 'running',
    stateSince: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    stateDurationMinutes: 45,
    activeWorkOrderNumber: 'WO-2026-0001',
    activePartName: 'Gear Blank — 42T',
    plannedProductionMinutes: 480,
    operatingMinutes: 440,
    plannedDowntimeMinutes: 30,
    unplannedDowntimeMinutes: 5,
    idleMinutes: 10,
    setupMinutes: 25,
    totalPieces: 110,
    goodPieces: 109,
    scrapPieces: 1,
    idealCycleTimeSeconds: 235,
    availabilityPercent: 97.8,
    performancePercent: 97.9,
    qualityPercent: 99.1,
    oeePercent: 94.9,
    telemetry: {
      spindleRpm: 120,
      feedratePercent: 100,
      temperatureCelsius: 20.2, // Temperature controlled lab 20°C
      vibrationMmS: 0.05,
      powerKw: 2.8
    }
  }
];

// ── Seed Downtime Reason Codes ──────────────────────────────────────
export const SEED_DOWNTIME_REASONS: DowntimeReasonCode[] = [
  // Breakdown Categories
  {
    id: 'dt_brk_01',
    code: 'DT-BRK-01',
    label: 'Tool Breakage & Insert Fracture',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    severity: 'high',
    requiresTechnician: false,
    color: '#f43f5e',
    suggestedAction: 'Inspect toolholder pocket, indexing fresh insert, zero Z-axis offset'
  },
  {
    id: 'dt_brk_02',
    code: 'DT-BRK-02',
    label: 'Spindle Inverter Overheat / Drive Trip',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    severity: 'critical',
    requiresTechnician: true,
    color: '#e11d48',
    suggestedAction: 'Check chiller temperature, cabinet heat exchanger fans, inverter reset'
  },
  {
    id: 'dt_brk_03',
    code: 'DT-BRK-03',
    label: 'Hydraulic Chuck / Clamping Pressure Low',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    severity: 'critical',
    requiresTechnician: true,
    color: '#be123c',
    suggestedAction: 'Check hydraulic power pack oil level and line pressure gauge (min 35 bar)'
  },
  {
    id: 'dt_brk_04',
    code: 'DT-BRK-04',
    label: 'Axis Servo Travel Limit / Soft Overtravel',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    severity: 'medium',
    requiresTechnician: false,
    color: '#fb7185',
    suggestedAction: 'Manual handwheel jog in reverse axis, inspect chip buildup on way wipers'
  },

  // Setup / Changeover Categories
  {
    id: 'dt_set_01',
    code: 'DT-SET-01',
    label: 'Fixture Change & Tombstone Setup',
    category: 'changeover',
    categoryLabel: 'Setup & Changeover',
    severity: 'medium',
    requiresTechnician: false,
    color: '#0ea5e9',
    suggestedAction: 'Dial test fixture alignment, torque bolts to spec, load CNC program'
  },
  {
    id: 'dt_set_02',
    code: 'DT-SET-02',
    label: 'Workpiece Touch-Off & Zero Offset Calibration',
    category: 'changeover',
    categoryLabel: 'Setup & Changeover',
    severity: 'medium',
    requiresTechnician: false,
    color: '#0284c7',
    suggestedAction: 'Renishaw probe routine or optical edge finder touch-off G54/G55'
  },
  {
    id: 'dt_set_03',
    code: 'DT-SET-03',
    label: 'First Article Inspection & Quality Buy-Off',
    category: 'changeover',
    categoryLabel: 'Setup & Changeover',
    severity: 'low',
    requiresTechnician: false,
    color: '#38bdf8',
    suggestedAction: 'Submit first off sample to QC inspection lab for micrometry sign-off'
  },

  // Material Starvation Categories
  {
    id: 'dt_mat_01',
    code: 'DT-MAT-01',
    label: 'Awaiting Raw Castings / Cut Billets',
    category: 'starvation',
    categoryLabel: 'Material Starvation',
    severity: 'high',
    requiresTechnician: false,
    color: '#f59e0b',
    suggestedAction: 'Ping storekeeper / material handler for pallet replenishment'
  },
  {
    id: 'dt_mat_02',
    code: 'DT-MAT-02',
    label: 'Awaiting Pre-Operation Stage Handover',
    category: 'starvation',
    categoryLabel: 'Material Starvation',
    severity: 'medium',
    requiresTechnician: false,
    color: '#d97706',
    suggestedAction: 'Expedite upstream cutting/roughing operation on Work Order traveler'
  },
  {
    id: 'dt_mat_03',
    code: 'DT-MAT-03',
    label: 'Defective Raw Stock / Porosity in Blanks',
    category: 'starvation',
    categoryLabel: 'Material Starvation',
    severity: 'high',
    requiresTechnician: false,
    color: '#b45309',
    suggestedAction: 'Tag lot with Non-Conformance Yellow tag and quarantine pallet'
  },

  // Utilities & Alarms
  {
    id: 'dt_utl_01',
    code: 'DT-UTL-01',
    label: 'Coolant Flow Low / Filter Mesh Clogged',
    category: 'utilities',
    categoryLabel: 'Utilities & Alarms',
    severity: 'medium',
    requiresTechnician: false,
    color: '#8b5cf6',
    suggestedAction: 'Clean chip conveyor filter mesh basket and top up soluble cutting oil emulsion'
  },
  {
    id: 'dt_utl_02',
    code: 'DT-UTL-02',
    label: 'Compressed Air Line Pressure Drop',
    category: 'utilities',
    categoryLabel: 'Utilities & Alarms',
    severity: 'high',
    requiresTechnician: true,
    color: '#7c3aed',
    suggestedAction: 'Alert facilities team; check main header air manifold pressure'
  },

  // Operator / Planned
  {
    id: 'dt_opr_01',
    code: 'DT-OPR-01',
    label: 'Scheduled Shift Handover / 5S Cleaning',
    category: 'operator_rest',
    categoryLabel: 'Planned Rest & 5S',
    severity: 'low',
    requiresTechnician: false,
    color: '#64748b',
    suggestedAction: 'Sweep swarf chips, clean glass window, complete handover logbook'
  },
  {
    id: 'dt_opr_02',
    code: 'DT-OPR-02',
    label: 'Operator Mandatory Safety Briefing',
    category: 'operator_rest',
    categoryLabel: 'Planned Rest & 5S',
    severity: 'low',
    requiresTechnician: false,
    color: '#475569',
    suggestedAction: 'Morning toolbox safety talk & PPE check'
  }
];

// ── Seed Historical Downtime Events (for immediate Pareto analysis) ──
export const SEED_DOWNTIME_EVENTS: DowntimeEventRecord[] = [
  {
    id: 'dte_001',
    machineId: 'wc_cnc_04',
    machineCode: 'WC-CNC-04',
    machineName: 'Doosan Puma CNC Lathe #04',
    workOrderNumber: 'WO-2026-0001',
    partName: 'Gear Blank (GB-42T)',
    startTime: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
    durationMinutes: 42,
    reasonCodeId: 'dt_brk_01',
    reasonCode: 'DT-BRK-01',
    reasonLabel: 'Tool Breakage & Insert Fracture',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    operatorId: 'USR-OPR-01',
    operatorName: 'Ramesh Patel',
    notes: 'CNMG 120408 roughing insert chipped on forging scale seam',
    resolved: true,
    correctiveActionTaken: 'Indexed insert to pocket #2 and reduced feedrate by 10%',
    createdAt: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString()
  },
  {
    id: 'dte_002',
    machineId: 'wc_vmc_03',
    machineCode: 'WC-VMC-03',
    machineName: 'Haas VF-4 4-Axis Vertical Mill',
    workOrderNumber: 'WO-2026-0003',
    partName: 'Coupling Flange 150mm',
    startTime: new Date(Date.now() - 6.2 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 5.5 * 3600 * 1000).toISOString(),
    durationMinutes: 42,
    reasonCodeId: 'dt_set_01',
    reasonCode: 'DT-SET-01',
    reasonLabel: 'Fixture Change & Tombstone Setup',
    category: 'changeover',
    categoryLabel: 'Setup & Changeover',
    operatorId: 'USR-OPR-03',
    operatorName: 'Suresh Kumar',
    notes: 'Loaded 4-jaw chuck and trued centerline with coaxial dial gauge',
    resolved: true,
    correctiveActionTaken: 'Dialed in within 0.005mm TIR',
    createdAt: new Date(Date.now() - 6.2 * 3600 * 1000).toISOString()
  },
  {
    id: 'dte_003',
    machineId: 'wc_saw_02',
    machineCode: 'WC-SAW-02',
    machineName: 'Horizontal Band Saw #02',
    workOrderNumber: 'WO-2026-0002',
    partName: 'Shaft — Drive 30mm',
    startTime: new Date(Date.now() - 3.0 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 2.1 * 3600 * 1000).toISOString(),
    durationMinutes: 54,
    reasonCodeId: 'dt_mat_01',
    reasonCode: 'DT-MAT-01',
    reasonLabel: 'Awaiting Raw Castings / Cut Billets',
    category: 'starvation',
    categoryLabel: 'Material Starvation',
    operatorId: 'USR-OPR-02',
    operatorName: 'Deepak Verma',
    notes: 'Billet rack empty waiting for overhead crane transfer',
    resolved: true,
    correctiveActionTaken: 'Crane loaded 20 bars of EN8 round bar',
    createdAt: new Date(Date.now() - 3.0 * 3600 * 1000).toISOString()
  },
  {
    id: 'dte_004',
    machineId: 'wc_wld_02',
    machineCode: 'WC-WLD-02',
    machineName: 'ESAB Robotic Welding Cell',
    workOrderNumber: 'WO-2026-0004',
    partName: 'Welded Housing Assembly',
    startTime: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
    durationMinutes: 36,
    reasonCodeId: 'dt_brk_02',
    reasonCode: 'DT-BRK-02',
    reasonLabel: 'Spindle Inverter Overheat / Drive Trip',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    operatorId: 'USR-OPR-04',
    operatorName: 'Amit Sharma',
    notes: 'ALARM E-402: Wire feeder burnback in contact tip',
    resolved: true,
    correctiveActionTaken: 'Replaced contact tip and cleaned gas nozzle',
    createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
  },
  {
    id: 'dte_005',
    machineId: 'wc_cnc_04',
    machineCode: 'WC-CNC-04',
    machineName: 'Doosan Puma CNC Lathe #04',
    workOrderNumber: 'WO-2026-0001',
    partName: 'Gear Blank (GB-42T)',
    startTime: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString(),
    durationMinutes: 24,
    reasonCodeId: 'dt_brk_01',
    reasonCode: 'DT-BRK-01',
    reasonLabel: 'Tool Breakage & Insert Fracture',
    category: 'breakdown',
    categoryLabel: 'Equipment Breakdown',
    operatorId: 'USR-OPR-01',
    operatorName: 'Ramesh Patel',
    notes: 'Grooving blade worn beyond flank limit',
    resolved: true,
    correctiveActionTaken: 'Fitted new grooving blade',
    createdAt: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString()
  },
  {
    id: 'dte_006',
    machineId: 'wc_hob_01',
    machineCode: 'WC-HOB-01',
    machineName: 'Liebherr Gear Hobber #01',
    workOrderNumber: 'WO-2026-0001',
    partName: 'Gear Blank (GB-42T)',
    startTime: new Date(Date.now() - 0.4 * 3600 * 1000).toISOString(),
    durationMinutes: 24,
    reasonCodeId: 'dt_mat_02',
    reasonCode: 'DT-MAT-02',
    reasonLabel: 'Awaiting Pre-Operation Stage Handover',
    category: 'starvation',
    categoryLabel: 'Material Starvation',
    operatorId: 'USR-OPR-05',
    operatorName: 'Manoj Singh',
    notes: 'Waiting for OP-20 CNC turning batch handover inspection',
    resolved: false,
    createdAt: new Date(Date.now() - 0.4 * 3600 * 1000).toISOString()
  }
];

class OeeService {
  private machines: MachineLiveOee[] = [];
  private configs: MachineConnectionConfig[] = [];
  private downtimeReasons: DowntimeReasonCode[] = [];
  private downtimeEvents: DowntimeEventRecord[] = [];
  private listeners: (() => void)[] = [];
  private telemetryTimer: any = null;

  constructor() {
    this.init();
    this.startLiveTelemetryStream();
  }

  private init() {
    try {
      const savedMachines = localStorage.getItem(STORAGE_KEY_MACHINES_OEE);
      if (savedMachines) {
        this.machines = JSON.parse(savedMachines);
      } else {
        this.machines = [...SEED_MACHINES_LIVE_OEE];
        this.persistMachines();
      }

      const savedConfigs = localStorage.getItem(STORAGE_KEY_OPCUA_CONFIGS);
      if (savedConfigs) {
        this.configs = JSON.parse(savedConfigs);
      } else {
        this.configs = [...SEED_CONNECTION_CONFIGS];
        this.persistConfigs();
      }

      const savedReasons = localStorage.getItem(STORAGE_KEY_DOWNTIME_REASONS);
      if (savedReasons) {
        this.downtimeReasons = JSON.parse(savedReasons);
      } else {
        this.downtimeReasons = [...SEED_DOWNTIME_REASONS];
        this.persistReasons();
      }

      const savedEvents = localStorage.getItem(STORAGE_KEY_DOWNTIME_EVENTS);
      if (savedEvents) {
        this.downtimeEvents = JSON.parse(savedEvents);
      } else {
        this.downtimeEvents = [...SEED_DOWNTIME_EVENTS];
        this.persistEvents();
      }
    } catch (e) {
      console.error('Failed to init OEE service:', e);
      this.machines = [...SEED_MACHINES_LIVE_OEE];
      this.configs = [...SEED_CONNECTION_CONFIGS];
      this.downtimeReasons = [...SEED_DOWNTIME_REASONS];
      this.downtimeEvents = [...SEED_DOWNTIME_EVENTS];
    }
  }

  private persistReasons() {
    try {
      localStorage.setItem(STORAGE_KEY_DOWNTIME_REASONS, JSON.stringify(this.downtimeReasons));
    } catch (e) {
      console.warn('Storage error persisting downtime reasons', e);
    }
  }

  private persistEvents() {
    try {
      localStorage.setItem(STORAGE_KEY_DOWNTIME_EVENTS, JSON.stringify(this.downtimeEvents));
    } catch (e) {
      console.warn('Storage error persisting downtime events', e);
    }
  }

  private persistMachines() {
    try {
      localStorage.setItem(STORAGE_KEY_MACHINES_OEE, JSON.stringify(this.machines));
    } catch (e) {
      console.warn('Storage error persisting machines OEE', e);
    }
  }

  private persistConfigs() {
    try {
      localStorage.setItem(STORAGE_KEY_OPCUA_CONFIGS, JSON.stringify(this.configs));
    } catch (e) {
      console.warn('Storage error persisting OPC UA configs', e);
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // ── Live Telemetry Generator (Micro-fluctuations every 2.5s) ──────
  private startLiveTelemetryStream() {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);

    this.telemetryTimer = setInterval(() => {
      let modified = false;
      this.machines = this.machines.map(m => {
        if (m.state === 'running') {
          // Increment operating duration
          const newOperating = m.operatingMinutes + 0.04;
          // Random slight fluctuation in spindle speed and temp
          const rpmDelta = Math.floor((Math.random() - 0.5) * 20);
          const tempDelta = (Math.random() - 0.5) * 0.2;

          // Recalculate OEE
          const updated = this.recalculateMachineOee({
            ...m,
            operatingMinutes: Math.round(newOperating * 10) / 10,
            stateDurationMinutes: m.stateDurationMinutes + 0.04,
            telemetry: {
              ...m.telemetry,
              spindleRpm: Math.max(0, m.telemetry.spindleRpm + rpmDelta),
              temperatureCelsius: Math.round((m.telemetry.temperatureCelsius + tempDelta) * 10) / 10
            }
          });
          modified = true;
          return updated;
        } else if (m.state === 'idle') {
          return {
            ...m,
            idleMinutes: Math.round((m.idleMinutes + 0.04) * 10) / 10,
            stateDurationMinutes: m.stateDurationMinutes + 0.04
          };
        } else if (m.state === 'faulted') {
          return {
            ...m,
            unplannedDowntimeMinutes: Math.round((m.unplannedDowntimeMinutes + 0.04) * 10) / 10,
            stateDurationMinutes: m.stateDurationMinutes + 0.04
          };
        }
        return m;
      });

      if (modified) {
        this.persistMachines();
        this.notify();
      }
    }, 2500);
  }

  // ── Mathematical OEE Engine ───────────────────────────────────────
  private recalculateMachineOee(m: MachineLiveOee): MachineLiveOee {
    const plannedAvailable = Math.max(1, m.plannedProductionMinutes - m.plannedDowntimeMinutes);
    // Availability = Operating Time / Planned Production Time
    const availability = Math.min(100, Math.max(0, Math.round((m.operatingMinutes / plannedAvailable) * 1000) / 10));

    // Performance = (Ideal Cycle Time * Total Pieces) / Operating Time
    const operatingSec = Math.max(1, m.operatingMinutes * 60);
    const standardSec = m.idealCycleTimeSeconds * m.totalPieces;
    const performance = Math.min(100, Math.max(0, Math.round((standardSec / operatingSec) * 1000) / 10));

    // Quality = Good Pieces / Total Pieces
    const quality = m.totalPieces > 0
      ? Math.min(100, Math.max(0, Math.round((m.goodPieces / m.totalPieces) * 1000) / 10))
      : 100;

    // Overall OEE = Availability * Performance * Quality
    const oee = Math.round(((availability / 100) * (performance / 100) * (quality / 100)) * 1000) / 10;

    return {
      ...m,
      availabilityPercent: availability,
      performancePercent: performance,
      qualityPercent: quality,
      oeePercent: oee
    };
  }

  // ── Public Queries ────────────────────────────────────────────────
  public getMachines(): MachineLiveOee[] {
    return [...this.machines];
  }

  public getMachineById(id: string): MachineLiveOee | undefined {
    return this.machines.find(m => m.machineId === id || m.machineCode === id);
  }

  public getConnectionConfigs(): MachineConnectionConfig[] {
    return [...this.configs];
  }

  public getConfigForMachine(machineId: string): MachineConnectionConfig | undefined {
    return this.configs.find(c => c.machineId === machineId || c.machineCode === machineId);
  }

  // ── Plant-Wide OEE Summary ────────────────────────────────────────
  public getPlantOeeSummary(): PlantOeeSummary {
    const total = this.machines.length;
    let sumOee = 0;
    let sumAvail = 0;
    let sumPerf = 0;
    let sumQual = 0;
    let running = 0;
    let idle = 0;
    let faulted = 0;
    let setup = 0;
    let totalPieces = 0;
    let totalScrap = 0;
    let totalOpMin = 0;
    let totalDownMin = 0;

    this.machines.forEach(m => {
      sumOee += m.oeePercent;
      sumAvail += m.availabilityPercent;
      sumPerf += m.performancePercent;
      sumQual += m.qualityPercent;
      totalPieces += m.totalPieces;
      totalScrap += m.scrapPieces;
      totalOpMin += m.operatingMinutes;
      totalDownMin += m.unplannedDowntimeMinutes + m.idleMinutes;

      if (m.state === 'running') running++;
      else if (m.state === 'idle') idle++;
      else if (m.state === 'faulted') faulted++;
      else if (m.state === 'setup') setup++;
    });

    return {
      overallOeePercent: Math.round((sumOee / total) * 10) / 10,
      overallAvailabilityPercent: Math.round((sumAvail / total) * 10) / 10,
      overallPerformancePercent: Math.round((sumPerf / total) * 10) / 10,
      overallQualityPercent: Math.round((sumQual / total) * 10) / 10,
      worldClassBenchmarkPercent: 85.0,
      runningMachinesCount: running,
      idleMachinesCount: idle,
      faultedMachinesCount: faulted,
      setupMachinesCount: setup,
      totalMachinesCount: total,
      totalPiecesProducedShift: totalPieces,
      totalScrapPiecesShift: totalScrap,
      totalOperatingHoursShift: Math.round((totalOpMin / 60) * 10) / 10,
      totalDowntimeHoursShift: Math.round((totalDownMin / 60) * 10) / 10,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }

  // ── Machine State Switching (PLC Simulation / Sensor Override) ───
  public setMachineState(
    machineId: string,
    nextState: MachineState,
    reason?: string
  ): boolean {
    const idx = this.machines.findIndex(m => m.machineId === machineId || m.machineCode === machineId);
    if (idx < 0) return false;

    const cur = this.machines[idx];
    const nowIso = new Date().toISOString();

    let updatedTelemetry = { ...cur.telemetry };
    if (nextState === 'running') {
      updatedTelemetry.spindleRpm = 1450;
      updatedTelemetry.feedratePercent = 100;
    } else if (nextState === 'idle') {
      updatedTelemetry.spindleRpm = 0;
      updatedTelemetry.feedratePercent = 0;
    } else if (nextState === 'faulted') {
      updatedTelemetry.spindleRpm = 0;
      updatedTelemetry.feedratePercent = 0;
    } else if (nextState === 'setup') {
      updatedTelemetry.spindleRpm = 0;
      updatedTelemetry.feedratePercent = 25;
    }

    const updated: MachineLiveOee = this.recalculateMachineOee({
      ...cur,
      state: nextState,
      stateSince: nowIso,
      stateDurationMinutes: 0,
      downtimeReason: reason || (nextState === 'faulted' ? 'PLC Fault Interlock Triggered' : undefined),
      faultCode: nextState === 'faulted' ? 'ALARM_PLC_SENSOR_STOP' : undefined,
      telemetry: updatedTelemetry
    });

    this.machines[idx] = updated;
    this.persistMachines();
    this.notify();
    return true;
  }

  // ── OPC UA Connection Config Update & Ping Test ──────────────────
  public updateConnectionConfig(config: MachineConnectionConfig): void {
    const idx = this.configs.findIndex(c => c.machineId === config.machineId);
    if (idx >= 0) {
      this.configs[idx] = config;
    } else {
      this.configs.push(config);
    }
    this.persistConfigs();
    this.notify();
  }

  public testOpcuaPing(machineId: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const ping = Math.floor(Math.random() * 15) + 10; // 10-25ms
        const cfg = this.configs.find(c => c.machineId === machineId);
        if (cfg) {
          cfg.lastPingMs = ping;
          cfg.connectionStatus = 'connected';
          cfg.lastConnectedAt = new Date().toISOString();
          this.persistConfigs();
          this.notify();
        }
        resolve({
          success: true,
          latencyMs: ping,
          message: `OPC UA Handshake OK: Connected to ${cfg?.endpointUrl || 'PLC'} in ${ping}ms with 0 packet loss.`
        });
      }, 600);
    });
  }

  // ── Historical OEE Trends Generator ──────────────────────────────
  public getHistoricalOeeTrends(timeframe: 'today' | 'last_7_days' | 'last_30_days'): HistoricalOeePoint[] {
    if (timeframe === 'today') {
      return [
        { timestamp: '06:00', label: '06:00', availability: 96, performance: 94, quality: 99, oee: 89.3, runningHours: 0.96, downtimeHours: 0.04, piecesProduced: 28 },
        { timestamp: '07:00', label: '07:00', availability: 94, performance: 95, quality: 98, oee: 87.5, runningHours: 0.94, downtimeHours: 0.06, piecesProduced: 30 },
        { timestamp: '08:00', label: '08:00', availability: 92, performance: 96, quality: 99, oee: 87.4, runningHours: 0.92, downtimeHours: 0.08, piecesProduced: 32 },
        { timestamp: '09:00', label: '09:00', availability: 82, performance: 93, quality: 98, oee: 74.7, runningHours: 0.82, downtimeHours: 0.18, piecesProduced: 25 }, // Morning tea break & tool check
        { timestamp: '10:00', label: '10:00', availability: 95, performance: 97, quality: 99, oee: 91.2, runningHours: 0.95, downtimeHours: 0.05, piecesProduced: 34 },
        { timestamp: '11:00', label: '11:00', availability: 91, performance: 95, quality: 98, oee: 84.7, runningHours: 0.91, downtimeHours: 0.09, piecesProduced: 31 },
        { timestamp: '12:00', label: '12:00', availability: 89, performance: 96, quality: 97, oee: 82.9, runningHours: 0.89, downtimeHours: 0.11, piecesProduced: 29 },
        { timestamp: '13:00', label: '13:00 (Live)', availability: 93, performance: 96, quality: 98, oee: 87.5, runningHours: 0.93, downtimeHours: 0.07, piecesProduced: 31 }
      ];
    } else if (timeframe === 'last_7_days') {
      return [
        { timestamp: '2026-10-04', label: 'Mon', availability: 91, performance: 93, quality: 98, oee: 82.9, runningHours: 14.5, downtimeHours: 1.5, piecesProduced: 480 },
        { timestamp: '2026-10-05', label: 'Tue', availability: 93, performance: 95, quality: 99, oee: 87.5, runningHours: 14.8, downtimeHours: 1.2, piecesProduced: 512 },
        { timestamp: '2026-10-06', label: 'Wed', availability: 94, performance: 96, quality: 98, oee: 88.4, runningHours: 15.0, downtimeHours: 1.0, piecesProduced: 530 },
        { timestamp: '2026-10-07', label: 'Thu', availability: 86, performance: 92, quality: 97, oee: 76.7, runningHours: 13.8, downtimeHours: 2.2, piecesProduced: 440 }, // Wire feed jam incident
        { timestamp: '2026-10-08', label: 'Fri', availability: 95, performance: 96, quality: 99, oee: 90.3, runningHours: 15.2, downtimeHours: 0.8, piecesProduced: 545 },
        { timestamp: '2026-10-09', label: 'Sat', availability: 92, performance: 94, quality: 98, oee: 84.7, runningHours: 14.7, downtimeHours: 1.3, piecesProduced: 495 },
        { timestamp: '2026-10-10', label: 'Sun (Today)', availability: 93, performance: 96, quality: 98, oee: 87.5, runningHours: 7.4, downtimeHours: 0.6, piecesProduced: 241 }
      ];
    } else {
      // 30 days weekly
      return [
        { timestamp: 'Wk 1', label: 'Week 1', availability: 90, performance: 93, quality: 98, oee: 82.0, runningHours: 72, downtimeHours: 8, piecesProduced: 2400 },
        { timestamp: 'Wk 2', label: 'Week 2', availability: 92, performance: 94, quality: 98, oee: 84.7, runningHours: 73.6, downtimeHours: 6.4, piecesProduced: 2510 },
        { timestamp: 'Wk 3', label: 'Week 3', availability: 94, performance: 96, quality: 99, oee: 89.3, runningHours: 75.2, downtimeHours: 4.8, piecesProduced: 2680 },
        { timestamp: 'Wk 4', label: 'Week 4 (Current)', availability: 93, performance: 95, quality: 98, oee: 86.6, runningHours: 74.4, downtimeHours: 5.6, piecesProduced: 2590 }
      ];
    }
  }

  // ── Downtime Six Big Losses Pareto Breakdown ──────────────────────
  public getDowntimeLossCategories(): DowntimeLossCategory[] {
    return [
      { category: 'Tool Breakage & Insert Replacement', hours: 4.8, percentage: 38.4, occurrences: 6, color: '#f43f5e' },
      { category: 'Material Starvation & Inter-Stage Waiting', hours: 3.2, percentage: 25.6, occurrences: 4, color: '#f59e0b' },
      { category: 'Fixture Clamping & First-Piece Setup', hours: 2.1, percentage: 16.8, occurrences: 3, color: '#0ea5e9' },
      { category: 'Lubrication & Coolant Alarm Stops', hours: 1.4, percentage: 11.2, occurrences: 2, color: '#8b5cf6' },
      { category: 'Operator Rest & Shift Handover', hours: 1.0, percentage: 8.0, occurrences: 2, color: '#64748b' }
    ];
  }

  // ── Downtime Reasons & Events API ──────────────────────────────
  public getDowntimeReasons(): DowntimeReasonCode[] {
    return [...this.downtimeReasons];
  }

  public getDowntimeEvents(): DowntimeEventRecord[] {
    return [...this.downtimeEvents].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getActiveDowntimeEvent(machineId: string): DowntimeEventRecord | undefined {
    return this.downtimeEvents.find(e => (e.machineId === machineId || e.machineCode === machineId) && !e.resolved);
  }

  /**
   * Log an initial downtime event when a machine stops / faults / changes over
   */
  public logDowntimeEvent(params: {
    machineId: string;
    reasonCodeId: string;
    operatorId: string;
    operatorName: string;
    notes?: string;
  }): DowntimeEventRecord {
    const machine = this.machines.find(m => m.machineId === params.machineId || m.machineCode === params.machineId);
    const reason = this.downtimeReasons.find(r => r.id === params.reasonCodeId || r.code === params.reasonCodeId) 
      || this.downtimeReasons[0];

    const now = new Date();
    const nowIso = now.toISOString();

    // Close any previous open downtime event on this machine
    this.downtimeEvents = this.downtimeEvents.map(e => {
      if ((e.machineId === params.machineId || e.machineCode === params.machineId) && !e.resolved) {
        const start = new Date(e.startTime).getTime();
        const durationMin = Math.max(1, Math.round((now.getTime() - start) / 60000));
        return {
          ...e,
          endTime: nowIso,
          durationMinutes: durationMin,
          resolved: true
        };
      }
      return e;
    });

    const newEvent: DowntimeEventRecord = {
      id: `dte_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      machineId: machine?.machineId || params.machineId,
      machineCode: machine?.machineCode || params.machineId,
      machineName: machine?.machineName || 'Machine',
      workOrderNumber: machine?.activeWorkOrderNumber,
      partName: machine?.activePartName,
      startTime: nowIso,
      durationMinutes: 0,
      reasonCodeId: reason.id,
      reasonCode: reason.code,
      reasonLabel: reason.label,
      category: reason.category,
      categoryLabel: reason.categoryLabel,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      notes: params.notes,
      resolved: false,
      createdAt: nowIso
    };

    this.downtimeEvents.unshift(newEvent);
    this.persistEvents();

    // Update machine state downtimeReason label
    if (machine) {
      this.setMachineState(machine.machineId, machine.state === 'running' ? 'faulted' : machine.state, `[${reason.code}] ${reason.label}`);
    } else {
      this.notify();
    }

    return newEvent;
  }

  /**
   * Resolve an active downtime event when machine returns to running or problem fixed
   */
  public resolveDowntimeEvent(
    eventId: string,
    correctiveAction?: string
  ): boolean {
    const idx = this.downtimeEvents.findIndex(e => e.id === eventId);
    if (idx < 0) return false;

    const event = this.downtimeEvents[idx];
    const now = new Date();
    const start = new Date(event.startTime).getTime();
    const durationMin = Math.max(1, Math.round((now.getTime() - start) / 60000));

    this.downtimeEvents[idx] = {
      ...event,
      endTime: now.toISOString(),
      durationMinutes: durationMin,
      resolved: true,
      correctiveActionTaken: correctiveAction || 'Standard remediation complete'
    };

    this.persistEvents();

    // Clear machine downtime label
    const m = this.machines.find(x => x.machineId === event.machineId);
    if (m && m.state !== 'running') {
      this.setMachineState(m.machineId, 'running');
    } else {
      this.notify();
    }

    return true;
  }

  /**
   * Add a custom downtime reason code
   */
  public addDowntimeReason(code: Omit<DowntimeReasonCode, 'id'>): DowntimeReasonCode {
    const newReason: DowntimeReasonCode = {
      ...code,
      id: `dt_${Date.now()}`
    };
    this.downtimeReasons.push(newReason);
    this.persistReasons();
    this.notify();
    return newReason;
  }

  /**
   * Comprehensive Pareto Analysis:
   * Categorizes downtime by reason code & category, sorts descending by duration,
   * calculates percentage and cumulative percentage (80/20 rule).
   */
  public getDowntimeParetoAnalysis(): {
    items: DowntimeParetoItem[];
    totalMinutes: number;
    totalHours: number;
    totalOccurrences: number;
    top80PercentCutoffIndex: number;
  } {
    const codeMap = new Map<string, {
      code: string;
      label: string;
      category: any;
      categoryLabel: string;
      totalMinutes: number;
      occurrences: number;
      color: string;
    }>();

    let grandTotalMinutes = 0;
    let grandTotalOccurrences = 0;

    const now = Date.now();

    this.downtimeEvents.forEach(evt => {
      let dur = evt.durationMinutes;
      if (!evt.resolved && evt.startTime) {
        dur = Math.max(1, Math.round((now - new Date(evt.startTime).getTime()) / 60000));
      }

      grandTotalMinutes += dur;
      grandTotalOccurrences += 1;

      const existing = codeMap.get(evt.reasonCode) || {
        code: evt.reasonCode,
        label: evt.reasonLabel,
        category: evt.category,
        categoryLabel: evt.categoryLabel,
        totalMinutes: 0,
        occurrences: 0,
        color: this.downtimeReasons.find(r => r.code === evt.reasonCode)?.color || '#f43f5e'
      };

      existing.totalMinutes += dur;
      existing.occurrences += 1;
      codeMap.set(evt.reasonCode, existing);
    });

    // If grand total is 0, provide default minimum
    const safeTotal = Math.max(1, grandTotalMinutes);

    // Sort descending by duration
    const sorted = Array.from(codeMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);

    let runningCum = 0;
    let top80Cutoff = -1;

    const items: DowntimeParetoItem[] = sorted.map((entry, idx) => {
      const pct = Math.round((entry.totalMinutes / safeTotal) * 1000) / 10;
      runningCum += pct;
      const cumPct = Math.min(100, Math.round(runningCum * 10) / 10);

      if (cumPct >= 80 && top80Cutoff === -1) {
        top80Cutoff = idx;
      }

      return {
        code: entry.code,
        label: entry.label,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
        totalDurationMinutes: entry.totalMinutes,
        totalHours: Math.round((entry.totalMinutes / 60) * 10) / 10,
        occurrences: entry.occurrences,
        percentage: pct,
        cumulativePercentage: cumPct,
        color: entry.color
      };
    });

    return {
      items,
      totalMinutes: grandTotalMinutes,
      totalHours: Math.round((grandTotalMinutes / 60) * 10) / 10,
      totalOccurrences: grandTotalOccurrences,
      top80PercentCutoffIndex: top80Cutoff >= 0 ? top80Cutoff : items.length - 1
    };
  }
}

export const oeeService = new OeeService();
