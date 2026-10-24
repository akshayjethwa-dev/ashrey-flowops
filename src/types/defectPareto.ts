// src/types/defectPareto.ts

export type DefectClassification = 
  | 'dimension_out_of_spec'     // Bore, diameter, thickness, runout
  | 'surface_scratch_burr'      // Tool chatter, burrs, scratch marks
  | 'porosity_void'             // Gas porosity, shrinkage cavity, casting voids
  | 'weld_defect_crack'         // Micro-cracks, incomplete fusion, undercut
  | 'thread_damage'             // Cross-threading, stripped pitch, tap breakage
  | 'plating_coating_flaw'      // Blistering, uneven thickness, bare spots
  | 'leak_pressure_drop'        // Seal leak, gasket failure, porosity leak
  | 'assembly_misalignment'     // Offset fit, missing dowel pin, wrong torque
  | 'hardness_variance'         // Under/over hardness after heat treatment
  | 'contamination_foreign_mat';// Foreign particles, oil residue, chips in gallery

export type DefectSeverityLevel = 'critical' | 'major' | 'minor';

export type ShiftType = 'shift_a' | 'shift_b' | 'shift_c'; // Morning, Afternoon, Night

export interface PartZone {
  id: string;
  name: string;
  description: string;
  xPct: number; // 0 to 100 on 2D view
  yPct: number; // 0 to 100 on 2D view
  radiusPct: number;
  zCoordinate?: number; // 3D depth relative to origin
}

export interface PartDefinition {
  sku: string;
  name: string;
  category: 'Machined Shaft' | 'Turbomachinery' | 'Pressure Vessel' | 'Structural Stamping' | 'Electronics & Controls';
  material: string;
  nominalDimensions: string;
  zones: PartZone[];
  schematicSvgType: 'camshaft' | 'impeller' | 'valve_body' | 'bracket' | 'pcb_controller';
  defaultTolerances: string;
}

export interface DefectSpatialPoint {
  x: number;       // 0 to 100 normalized coordinate on part face
  y: number;       // 0 to 100 normalized coordinate on part face
  z?: number;      // -50 to 50 normalized depth for 3D model
  viewAngle: 'top' | 'front' | 'side' | 'isometric' | '3d';
  zoneId: string;
  zoneName: string;
}

export interface DefectRecord {
  id: string;
  defectNumber: string;             // e.g. "DEF-2026-0812"
  title: string;
  partSku: string;
  partName: string;
  batchNumber: string;
  workOrderNumber: string;
  
  // Categorization
  defectClassification: DefectClassification;
  defectCategoryLabel: string;
  severity: DefectSeverityLevel;
  
  // Drill-down attributes
  machineId: string;
  machineName: string;
  operatorId: string;
  operatorName: string;
  shift: ShiftType;
  shiftLabel: string;
  
  // Spatial location on the part
  spatialLocation: DefectSpatialPoint;
  
  // Impact & Measurements
  measuredValue?: string;
  toleranceSpec?: string;
  variance?: string;
  scrapCost: number;
  reworkCost: number;
  defectiveUnitsCount: number;
  
  // Context & Metadata
  detectionStage: 'IQC' | 'IPQC' | 'FQC' | 'Machining_Run' | 'Final_Metrology';
  timestamp: string;
  notes: string;
  linkedNcrNumber?: string;
  linkedCapaNumber?: string;
  macroPhotoUrl?: string;
  status: 'active' | 'contained' | 'resolved';
}

export interface ParetoItem {
  id: string;
  categoryKey: string;
  categoryName: string;
  frequencyCount: number;
  defectiveUnits: number;
  totalCostCopq: number;
  percentage: number;            // Individual % of total defects
  cumulativePercentage: number;  // 0 to 100%
  isVitalFew: boolean;           // Within the 80% cumulative threshold
  topMachines: string[];
  topOperators: string[];
  severityBreakdown: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface ParetoAnalysisResult {
  items: ParetoItem[];
  totalDefectCount: number;
  totalDefectiveUnits: number;
  totalCostCopq: number;
  vitalFewCount: number;
  vitalFewPercentage: number;
  cutoffIndex: number;
}

export interface MachineBreakdownItem {
  machineId: string;
  machineName: string;
  type: string;
  defectCount: number;
  defectiveUnits: number;
  totalCost: number;
  topDefectCategory: string;
  defectPpmEstimate: number;
  shiftDistribution: {
    shift_a: number;
    shift_b: number;
    shift_c: number;
  };
  operatorsLogged: string[];
}

export interface OperatorBreakdownItem {
  operatorId: string;
  operatorName: string;
  role: string;
  defectCount: number;
  topDefect: string;
  shift: ShiftType;
  machinesOperated: string[];
  firstPassYieldPct: number;
  scrapCostIncurred: number;
}

export interface ShiftBreakdownItem {
  shift: ShiftType;
  shiftLabel: string;
  timeRange: string;
  defectCount: number;
  defectiveUnits: number;
  criticalDefects: number;
  totalCost: number;
  topDefect: string;
  peakDefectHour: string;
}

export interface HeatmapZoneAggregation {
  zoneId: string;
  zoneName: string;
  defectCount: number;
  defectTypes: { [type: string]: number };
  criticalCount: number;
  xPct: number;
  yPct: number;
  radiusPct: number;
  heatIntensity: number; // 0 to 1 normalized
}

export interface DefectFilterOptions {
  searchQuery?: string;
  partSku?: string;
  machineId?: string;
  operatorId?: string;
  shift?: 'all' | ShiftType;
  severity?: 'all' | DefectSeverityLevel;
  defectClassification?: 'all' | DefectClassification;
  timeRange?: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all';
  viewAngle?: 'top' | 'front' | 'side' | 'isometric' | '3d';
}

export type ParetoMetricType = 'frequency' | 'cost_copq' | 'defective_units';
