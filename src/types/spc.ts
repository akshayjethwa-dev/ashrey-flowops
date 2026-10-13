// src/types/spc.ts

export type VariableChartType = 'XBar_R' | 'XBar_S' | 'I_MR';
export type AttributeChartType = 'p_chart' | 'np_chart' | 'c_chart' | 'u_chart';
export type SpcChartType = VariableChartType | AttributeChartType;

export type WesternElectricRuleId =
  | 'WE_RULE_1' // 1 point outside 3-sigma control limits
  | 'WE_RULE_2' // 2 out of 3 consecutive points in Zone A or beyond (>2-sigma on same side)
  | 'WE_RULE_3' // 4 out of 5 consecutive points in Zone B or beyond (>1-sigma on same side)
  | 'WE_RULE_4' // 8 (or 9) consecutive points on same side of center line
  | 'NELSON_5'  // 6 consecutive points steadily increasing or decreasing (trend)
  | 'NELSON_6'  // 14 consecutive points alternating up and down (systematic variation)
  | 'NELSON_7'  // 15 consecutive points in Zone C (<1-sigma, stratification)
  | 'NELSON_8'; // 8 consecutive points outside Zone C (mixture)

export type AlertSeverity = 'critical' | 'warning' | 'advisory';

export interface RuleViolation {
  ruleId: WesternElectricRuleId;
  ruleName: string;
  description: string;
  severity: AlertSeverity;
  zone?: 'Beyond 3σ' | 'Zone A' | 'Zone B' | 'Zone C' | 'Centerline Run' | 'Trend';
  pointIndex: number;
  subgroupNumber: number;
  value: number;
  limitBreached?: number;
}

export interface SubgroupSample {
  id: string;
  subgroupNumber: number;
  timestamp: string;
  batchOrLotNumber: string;
  operatorName: string;
  machineId: string;
  // Variable data
  measurements: number[]; // individual sample measurements x1, x2, ..., xn
  sampleSize: number;     // n
  mean: number;           // X-bar
  range: number;          // R (max - min)
  stdDev: number;         // S (sample standard deviation)
  movingRange?: number;   // MR (for I-MR chart)
  // Attribute data
  defectivesCount?: number; // for p / np
  totalInspected?: number;  // for p / u
  defectsCount?: number;    // for c / u
  fractionDefective?: number; // p = defectives / total
  defectsPerUnit?: number;    // u = defects / total
  // Violations detected on this sample point
  violations: RuleViolation[];
  notes?: string;
}

export interface ControlLimits {
  chartType: SpcChartType;
  subgroupSize: number;
  // Primary Chart Limits (X-bar, I, p, c, u)
  centerLine: number; // CL (X-double-bar, I-bar, p-bar, etc.)
  ucl: number;        // Upper Control Limit (+3 sigma)
  lcl: number;        // Lower Control Limit (-3 sigma)
  plus2Sigma: number; // Zone A upper boundary
  plus1Sigma: number; // Zone B upper boundary
  minus1Sigma: number;// Zone B lower boundary
  minus2Sigma: number;// Zone A lower boundary
  sigma: number;      // Process standard deviation estimate (R-bar / d2 or S-bar / c4)
  // Secondary Chart Limits (Range R, Moving Range MR, or S)
  secondaryCenterLine?: number; // R-bar or S-bar or MR-bar
  secondaryUcl?: number;
  secondaryLcl?: number;
}

export interface ProcessCapabilityIndices {
  sampleCount: number;
  totalMeasurements: number;
  mean: number;
  sigmaWithin: number;  // R-bar / d2 (short-term)
  sigmaOverall: number; // sample std dev (long-term)
  usl: number;
  lsl: number;
  nominal?: number;
  // Capability (Within)
  cp: number;
  cpk: number;
  cpu: number;
  cpl: number;
  // Performance (Overall)
  pp: number;
  ppk: number;
  ppu: number;
  ppl: number;
  // Centering & Sigma Quality
  centeringK: number;     // Process drift index (0 to 1)
  sigmaLevel: number;     // e.g. 4.5 Sigma
  ppmDefectiveEst: number;// Expected ppm defective outside spec
  status: 'six_sigma' | 'capable' | 'marginally_capable' | 'incapable';
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  actualCount: number;
  expectedCount: number; // Theoretical normal distribution count
}

export interface HistogramDistribution {
  bins: HistogramBin[];
  minVal: number;
  maxVal: number;
  binWidth: number;
  normalCurvePoints: { x: number; y: number }[]; // For smooth Gaussian overlay
}

export interface SpcOocAlert {
  id: string;
  studyId: string;
  studyName: string;
  characteristicName: string;
  timestamp: string;
  subgroupNumber: number;
  ruleId: WesternElectricRuleId;
  ruleName: string;
  description: string;
  observedValue: number;
  severity: AlertSeverity;
  status: 'active' | 'investigating' | 'resolved';
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  rootCause?: string;
  correctiveAction?: string;
}

export interface SpcStudy {
  id: string;
  studyName: string;
  partNumber: string;
  partName: string;
  operationCode: string;
  operationName: string;
  characteristicName: string;
  unit: string;
  chartType: SpcChartType;
  subgroupSize: number; // e.g. 5 for XBar-R, 1 for I-MR, 100 for p-chart
  nominalValue: number;
  usl: number;
  lsl: number;
  subgroups: SubgroupSample[];
  activeRules: WesternElectricRuleId[];
  isLockedForBaseline?: boolean;
  baselineSubgroupsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpcKpiSummary {
  totalStudies: number;
  inControlStudiesCount: number;
  averageCpk: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  totalSubgroupsLogged: number;
}
