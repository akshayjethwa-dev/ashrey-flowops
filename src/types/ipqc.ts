// src/types/ipqc.ts

export type QcpTriggerType =
  | 'first_piece'           // First Article / First Piece Inspection (FAI)
  | 'periodic_interval'     // Hourly or every N parts (e.g. 1 sample / 15 pcs)
  | 'final_operation_gate'  // 100% Gate check before leaving operation
  | 'tool_change'           // Triggered after cutter / insert replacement
  | 'setup_verification';   // Machine & fixture setup sign-off

export type QcpGateType =
  | 'mandatory_hold'        // Production blocked until inspector approves
  | 'warning_alert'         // Alerts shopfloor lead, non-blocking
  | 'sampling_audit';       // Background quality monitoring

export type IpqcTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'hold';

export type PartModelType =
  | 'flange_valve'
  | 'gear_shaft'
  | 'machined_housing'
  | 'bearing_sleeve';

export type ViewPerspective = 'isometric' | 'front' | 'top' | 'cross_section';

export interface Part3DMarker {
  id: string;
  label: string;                  // e.g. "Pt 1: Bore ID", "Pt 2: Flange Thickness"
  x: number;                      // 0 to 100% position on 3D canvas
  y: number;                      // 0 to 100% position on 3D canvas
  z: number;                      // depth layer / elevation
  viewPerspective: ViewPerspective;
  featureDescription: string;
  nominalValue?: number;
  toleranceMin?: number;
  toleranceMax?: number;
  unit?: string;
  status: 'pending' | 'in_spec' | 'out_of_spec' | 'defect_flagged';
  measuredValue?: number | null;
  photoUrl?: string;
  notes?: string;
}

export interface QcpParameter {
  id: string;
  parameterName: string;          // e.g. "Bore Diameter", "Surface Roughness Ra", "Total Runout"
  characteristicType:
    | 'dimensional'
    | 'surface_roughness'
    | 'runout'
    | 'hardness'
    | 'visual'
    | 'thread'
    | 'torque';
  toleranceType: 'two_sided' | 'min_only' | 'max_only' | 'pass_fail';
  unit: string;                   // "mm", "µm", "HRC", "Pass/Fail"
  nominalValue?: number;
  lowerTolerance?: number;        // Min limit
  upperTolerance?: number;        // Max limit
  gaugeOrInstrument: string;      // e.g. "Mitutoyo Bore Micrometer 50-75mm #CAL-BM-04"
  criticality: 'critical' | 'major' | 'minor';
  sampleFrequency: string;        // e.g. "1st Pc + 1 every 10 pcs"
  requiredSamples: number;        // e.g. 3 or 5 samples
  markerId?: string;              // Linked 3D marker ID
  notes?: string;
}

export interface QualityControlPointConfig {
  id: string;
  operationCode: string;          // e.g. "OP-CNC-01", "OP 20"
  operationName: string;          // e.g. "CNC Turning & Facing"
  sequenceNumber: number;         // 10, 20, 30...
  routingNumber?: string;         // e.g. "RT-GBX-500-01"
  partNumber: string;             // e.g. "PART-FLG-750"
  partName: string;               // e.g. "Precision Valve Flange Dia 180mm"
  triggerType: QcpTriggerType;
  gateType: QcpGateType;
  mandatoryHoldPoint: boolean;    // Blocks operation progression if failed
  partModelType: PartModelType;
  parameters: QcpParameter[];
  markers: Part3DMarker[];
  instructions: string;
  mandatorySignOffRole: 'quality_inspector' | 'operator' | 'lead_technician';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IpqcTaskSampleReading {
  sampleNumber: number;
  measuredValue: number | null;
  isPass?: boolean;               // For attributive check
  isOutOfSpec: boolean;
  deviation?: number;
  remarks?: string;
  markerId?: string;
}

export interface IpqcTaskParameterResult {
  parameterId: string;
  parameterName: string;
  characteristicType: string;
  toleranceType: string;
  nominalValue?: number;
  minSpec?: number;
  maxSpec?: number;
  unit: string;
  gaugeOrInstrument: string;
  criticality: 'critical' | 'major' | 'minor';
  markerId?: string;
  samples: IpqcTaskSampleReading[];
  parameterStatus: 'pass' | 'fail' | 'pending';
  meanValue?: number;
  rangeValue?: number;
  cpk?: number;
  outOfSpecCount: number;
}

export interface IpqcPartPhoto {
  id: string;
  timestamp: string;
  url: string;
  caption: string;
  markerId?: string;
  markerLabel?: string;
  defectType?:
    | 'tool_chatter'
    | 'surface_burr'
    | 'dimensional_overcut'
    | 'dimensional_undercut'
    | 'heat_discoloration'
    | 'acceptable_finish'
    | 'other';
  severity: 'critical' | 'major' | 'minor';
}

export interface IpqcTask {
  id: string;
  taskNumber: string;             // e.g. "IPQC-2026-0081"
  workOrderId: string;            // e.g. "wo-001"
  workOrderNumber: string;        // e.g. "WO-2026-001"
  partNumber: string;             // e.g. "PART-FLG-750"
  partName: string;               // e.g. "Precision Valve Flange Dia 180mm"
  operationSequence: number;      // 20
  operationCode: string;          // e.g. "OP-CNC-02"
  operationName: string;          // e.g. "CNC Turning & Finish Facing"
  workCenterId: string;           // "wc-cnc-01"
  workCenterName: string;         // "Mazak Quick Turn 250MSY"
  machineCode: string;            // "CNC-04"
  qcpId: string;
  triggerType: QcpTriggerType;
  gateType: QcpGateType;
  status: IpqcTaskStatus;
  overallResult: 'pass' | 'fail' | 'hold' | 'pending';
  partModelType: PartModelType;
  markers: Part3DMarker[];
  parameters: IpqcTaskParameterResult[];
  photos: IpqcPartPhoto[];
  inspectorId?: string;
  inspectorName?: string;
  badgeId?: string;
  notes?: string;
  holdReason?: string;
  signOffStatement?: string;
  createdAt: string;
  completedAt?: string;
}

export interface IpqcFilterOptions {
  status: 'all' | IpqcTaskStatus;
  triggerType: 'all' | QcpTriggerType;
  workOrderNumber?: string;
  machineCode?: string;
  searchQuery: string;
}

export interface IpqcKpis {
  totalTasks: number;
  pendingInspection: number;
  inProgress: number;
  passedTasks: number;
  failedHoldTasks: number;
  passRatePct: number;
  activeQcpPoints: number;
  avgResolutionMinutes: number;
}
