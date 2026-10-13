// src/types/edhr.ts

export type EDHRReleaseStatus =
  | 'draft'
  | 'in_compilation'
  | 'pending_qa_review'
  | 'released'
  | 'quarantined'
  | 'rejected';

export type SignatureIntent =
  | 'performed_by'
  | 'verified_by'
  | 'quality_approved'
  | 'released_for_distribution';

export type DeviationSeverity = 'minor' | 'major' | 'critical';

export interface CompiledMaterialItem {
  id: string;
  partNumber: string;
  description: string;
  lotNumber: string;
  supplierName: string;
  heatNumber?: string;
  mtrNumber?: string;
  coaNumber?: string;
  requiredQty: number;
  consumedQty: number;
  unit: string;
  expiryDate?: string;
  inspectionStatus: 'passed' | 'pending' | 'conditional';
  verifiedBy: string;
  verifiedAt: string;
}

export interface CompiledOperationStep {
  stepId: string;
  sequence: number;
  operationName: string;
  workCenterName: string;
  machineId: string;
  machineName: string;
  operatorName: string;
  operatorBadge: string;
  startedAt: string;
  completedAt: string;
  actualDurationMinutes: number;
  standardDurationMinutes: number;
  varianceMinutes: number;
  stepStatus: 'completed' | 'in_progress' | 'bypassed' | 'rework';
  workInstructionsRev?: string;
  operatorSignOffHash?: string;
}

export interface CompiledQualityInspection {
  id: string;
  operationSequence: number;
  inspectionType: 'dimensional' | 'metallurgical' | 'visual' | 'functional' | 'ndt';
  parameterName: string;
  specification: string;
  nominalValue?: string;
  lowerLimit?: string;
  upperLimit?: string;
  measuredValue: string;
  unit: string;
  result: 'pass' | 'fail' | 'marginal';
  gaugeCalibrationId?: string;
  inspectorName: string;
  inspectorBadge: string;
  timestamp: string;
  certificateRef?: string;
}

export interface EDHRDeviation {
  id: string;
  deviationNumber: string; // e.g. "NCR-2026-0042"
  operationSequence?: number;
  severity: DeviationSeverity;
  description: string;
  rootCauseAnalysis?: string;
  immediateAction: string;
  disposition: 'use_as_is' | 'rework' | 'scrap' | 'return_to_vendor';
  isResolved: boolean;
  loggedBy: string;
  loggedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  capaReference?: string;
}

export interface ElectronicSignature {
  id: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signerUserId: string;
  intent: SignatureIntent;
  intentLabel: string;
  signedAt: string;
  ipAddress: string;
  cryptographicSignature: string; // SHA-256 string
  reasonStatement: string;
}

export interface EDHRAuditTrailEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  eventType: 
    | 'dhr_created'
    | 'auto_compiled'
    | 'material_verified'
    | 'operation_completed'
    | 'qc_recorded'
    | 'deviation_logged'
    | 'deviation_resolved'
    | 'electronic_signature'
    | 'status_changed'
    | 'pdf_exported';
  description: string;
  previousValue?: string;
  newValue?: string;
  justification?: string;
  eventHash: string;
}

export interface EDHRRecord {
  id: string;
  tenantId: string;
  dhrNumber: string;               // e.g. "DHR-2026-WO001-01"
  batchNumber: string;             // e.g. "BATCH-2026-LOT-0042" or "SN-2026-ENG-0891"
  trackingMode: 'serialized_unit' | 'production_batch';
  batchQuantity: number;
  unitOfMeasure: string;

  // Linking Order Details
  workOrderId: string;
  workOrderNumber: string;         // e.g. "WO-2026-001"
  salesOrderId?: string;
  salesOrderNumber?: string;       // e.g. "SO-2026-0012"
  customerName: string;            // e.g. "Bajaj Auto Ltd. — Chakan Plant"
  customerPoNumber?: string;
  partNumber: string;              // e.g. "CRK-8802"
  partName: string;                // e.g. "Forged Crankshaft — 4-Cylinder Turbo"
  drawingNumber: string;
  revision: string;
  regulatoryStandard: 'FDA_21CFR_PART_820' | 'ISO_13485' | 'AS9100D' | 'IATF_16949';

  // Life Cycle & Disposition
  releaseStatus: EDHRReleaseStatus;
  manufacturingStartDate: string;
  manufacturingCompletionDate?: string;
  releaseDate?: string;
  releasedBy?: string;
  quarantineReason?: string;

  // Auto-Compiled Core Sections
  materials: CompiledMaterialItem[];
  operations: CompiledOperationStep[];
  qualityInspections: CompiledQualityInspection[];
  deviations: EDHRDeviation[];
  signatures: ElectronicSignature[];
  auditTrail: EDHRAuditTrailEvent[];

  // Meta & Security
  compiledAt: string;
  compiledBy: string;
  dhrChecksum: string;             // Master SHA-256 seal
  qrVerificationUrl?: string;
  notes?: string;
}

export interface EDHRFilterOptions {
  status: EDHRReleaseStatus | 'all';
  trackingMode?: 'all' | 'serialized_unit' | 'production_batch';
  searchQuery?: string;
  regulatoryStandard?: string;
}
