// src/types/iqc.ts

export type CharacteristicType =
  | 'dimensional'
  | 'visual'
  | 'hardness'
  | 'chemical_mtr'
  | 'surface_roughness'
  | 'coating_thickness'
  | 'thread_pitch'
  | 'functional';

export type ToleranceType =
  | 'two_sided'   // Nominal ± Tol (Min to Max)
  | 'min_only'    // >= Min
  | 'max_only'    // <= Max
  | 'pass_fail';  // Qualitative / Visual

export type InspectionCriticality = 'critical' | 'major' | 'minor';

export type DispositionType =
  | 'pending'
  | 'accepted'        // Pass - Inward to general inventory bin
  | 'rejected'        // Fail - Quarantine & Return to Vendor (RTV)
  | 'rework'          // Conditional - Shop rework or supplier sort
  | 'mrb_review';     // Material Review Board concession

export type InspectionOrderStatus =
  | 'pending_inspection'
  | 'in_progress'
  | 'completed'
  | 'quarantined'
  | 'cancelled';

export type SamplingStandard =
  | 'ISO_2859_1_NORMAL'
  | 'ISO_2859_1_TIGHTENED'
  | 'ISO_2859_1_REDUCED'
  | 'FIXED_SAMPLES'
  | '100_PERCENT';

export interface InspectionPlanParameter {
  id: string;
  parameterName: string;
  description?: string;
  characteristicType: CharacteristicType;
  toleranceType: ToleranceType;
  unit: string;                     // e.g. "mm", "HRC", "Ra (µm)", "µm", "N/mm²"
  nominalValue?: number;
  lowerTolerance?: number;          // Min spec
  upperTolerance?: number;          // Max spec
  gaugeOrInstrument: string;        // e.g. "Digital Vernier Caliper (0.01mm)", "Rockwell Hardness Tester", "Surface Profilometer"
  calibrationCode?: string;         // e.g. "CAL-VC-04"
  criticality: InspectionCriticality;
  defaultSampleSize: number;        // e.g. 5, 8, 13
  notes?: string;
}

export interface InspectionPlan {
  id: string;
  planCode: string;                 // e.g. "IP-STEEL-EN8", "IP-BOLT-M12", "IP-SHEET-CRCA"
  title: string;
  supplierId?: string;              // Specific supplier or "*" for all suppliers
  supplierName?: string;
  partSku: string;                  // e.g. "RAW-STEEL-EN8-45", "FAST-M12-8.8"
  partName: string;
  category: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  parameters: InspectionPlanParameter[];
  aqlLevel: '0.40' | '0.65' | '1.0' | '1.5' | '2.5' | '4.0';
  samplingStandard: SamplingStandard;
  samplingMethodNotes?: string;
  preparedBy: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SampleMeasurement {
  sampleNumber: number;             // 1, 2, 3...
  measuredValue: number | null;
  isVisualPass?: boolean;           // For pass/fail attributes
  remarks?: string;
  isOutOfSpec: boolean;
  deviationFromNominal?: number;
}

export interface InspectionOrderParameterResult {
  parameterId: string;
  parameterName: string;
  characteristicType: CharacteristicType;
  toleranceType: ToleranceType;
  unit: string;
  nominalValue?: number;
  minSpec?: number;
  maxSpec?: number;
  gaugeOrInstrument: string;
  criticality: InspectionCriticality;
  requiredSampleSize: number;
  samples: SampleMeasurement[];
  parameterStatus: 'pass' | 'fail' | 'pending';
  meanValue?: number;
  rangeValue?: number;
  stdDev?: number;
  cpk?: number;
  outOfSpecCount: number;
}

export interface DefectPhoto {
  id: string;
  timestamp: string;
  url: string;                      // Data URL or asset URL
  caption: string;
  defectCategory:
    | 'surface_crack'
    | 'rust_oxidation'
    | 'porosity_voids'
    | 'thread_damage'
    | 'dimensional_variance'
    | 'dents_scratches'
    | 'burrs_flashing'
    | 'packaging_damage'
    | 'wrong_marking'
    | 'other';
  severity: InspectionCriticality;
  sampleNumber?: number;
}

export interface IqcDispositionDetails {
  disposition: DispositionType;
  decidedBy: string;
  decidedByName: string;
  decidedAt: string;
  acceptedQty: number;
  rejectedQty: number;
  reworkQty: number;
  quarantineReason?: string;
  rtvDocNumber?: string;            // e.g. "RTV-2026-0012"
  reworkInstructions?: string;
  mrbApprovalNotes?: string;
  targetBinId?: string;
  targetBinCode?: string;
  digitalSignature?: {
    signerName: string;
    badgeId: string;
    role: string;
    timestamp: string;
    statement: string;
  };
}

export interface IqcOrder {
  id: string;
  orderNumber: string;              // e.g. "IQC-2026-0041"
  poNumber: string;                 // e.g. "PO-2026-001"
  poItemId?: string;
  grnNumber: string;                // e.g. "GRN-2026-0182"
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  partSku: string;
  partName: string;
  category: string;
  receivedQty: number;
  unit: string;
  sampleSize: number;
  heatLotNumber: string;            // e.g. "HT-98421-B"
  mtrNumber?: string;               // Mill Test Report #
  receiptDate: string;
  inspectorId?: string;
  inspectorName?: string;
  status: InspectionOrderStatus;
  inspectionPlanId: string;
  inspectionPlanCode: string;
  parameters: InspectionOrderParameterResult[];
  overallResult: 'pass' | 'fail' | 'pending';
  defectPhotos: DefectPhoto[];
  disposition: IqcDispositionDetails;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface IqcFilterOptions {
  status: 'all' | InspectionOrderStatus;
  disposition: 'all' | DispositionType;
  supplierId?: string;
  searchQuery: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month';
}

export interface IqcKpis {
  totalOrders: number;
  pendingInspection: number;
  inProgress: number;
  dispositionedLots: number;
  acceptedLots: number;
  rejectedLots: number;
  reworkLots: number;
  acceptanceRatePct: number;
  avgInspectionMinutes: number;
  activePlansCount: number;
  quarantinedRtvCount: number;
}
