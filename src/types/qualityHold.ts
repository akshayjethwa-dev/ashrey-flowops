// src/types/qualityHold.ts

export type QualityHoldTargetType = 'work_order' | 'batch' | 'lot' | 'sales_order';

export type QualityHoldStatus = 
  | 'active_hold'       // Currently blocked from dispatch & movement
  | 'released'          // Officially released by Quality Authority
  | 'quarantined'       // Moved to physical MRB quarantine vault
  | 'scrapped';         // Scrapped and disposed

export type QualityHoldSeverity = 'critical' | 'major' | 'moderate' | 'minor';

export type QualityHoldReasonCategory =
  | 'inspection_failure'       // IQC, IPQC, or FQC failure
  | 'dimensional_deviation'   // CMM / Vernier out of tolerance
  | 'visual_defect'           // Scratches, flash, porosity
  | 'surface_finish'          // Ra roughness or plating defect
  | 'material_chemistry'      // Hardness, tensile, heat treatment fail
  | 'expired_gage_calibration' // Measuring instrument out of calibration
  | 'open_ncr_capa'           // Critical open NCR pending resolution
  | 'process_parameter_drift' // CNC temperature, feed, pressure anomaly
  | 'customer_hold'           // Customer notice or engineering revision hold
  | 'containment_investigation'; // Suspect lot quarantined during investigation

export type QualityReleaseDisposition =
  | 're_inspected_passed'      // Re-inspected with certified gage, 100% conforming
  | 'concession_approved'      // Customer or MRB signed concession / deviation
  | 'rework_verified'          // Rework completed, re-machined and accepted
  | 'deviation_authorized'     // Engineering deviation permit signed off
  | 'use_as_is_approved'       // Material Review Board (MRB) approved Use-As-Is
  | 'scrapped_disposed';       // Rejected for salvage or metal scrap

export interface QualityHoldVerificationChecklist {
  reInspectionDone: boolean;
  rootCauseIdentified: boolean;
  quarantineTagRemoved: boolean;
  customerConcessionAttached: boolean;
  documentationUpdated: boolean;
}

export interface QualityHoldReleaseWorkflow {
  releasedBy: string;
  releasedByRole: string;
  releasedAt: string;
  authorityCredentials: string; // e.g., "QA-DIR-EMP-0914" or "ISO/IATF Lead Quality Signatory"
  releaseDisposition: QualityReleaseDisposition;
  releaseJustification: string;
  verificationChecklist: QualityHoldVerificationChecklist;
  electronicSignature: string; // Cryptographic verification token e.g. "SIG-AUTH-2026-X88"
  notes?: string;
}

export interface QualityHoldHistoryEvent {
  id: string;
  timestamp: string;
  action: 'placed' | 'updated' | 'inspection_logged' | 'released' | 'quarantined' | 'scrapped';
  actorName: string;
  actorRole: string;
  notes: string;
}

export interface QualityHoldRecord {
  id: string; // e.g., "HLD-2026-0041"
  targetType: QualityHoldTargetType;
  targetId: string;
  targetNumber: string; // e.g. "WO-2026-0001" or "BATCH-GB-04" or "SO-2026-0012"
  salesOrderId?: string;
  salesOrderNumber?: string;
  workOrderNumber?: string;
  batchNumber?: string;
  partName: string;
  partCode?: string;
  customerName: string;
  customerPoNumber?: string;
  quantity: number;
  unit: string;
  status: QualityHoldStatus;
  severity: QualityHoldSeverity;
  holdReasonCategory: QualityHoldReasonCategory;
  holdReason: string; // Short summary
  holdDescription: string; // Detailed technical reason
  location: string; // Physical storage / containment location
  placedBy: string;
  placedByRole: string;
  placedAt: string;
  preventDispatch: boolean; // Flag to block dispatch release gate
  preventProductionProgression: boolean; // Flag to freeze further machine ops
  ncrId?: string; // Associated Non-Conformance Report
  inspectionRef?: string; // e.g. "FQC-2026-088" or "IPQC-OP20-FAIL"
  releaseWorkflow?: QualityHoldReleaseWorkflow;
  history: QualityHoldHistoryEvent[];
}

export interface QualityHoldFilterOptions {
  search?: string;
  status?: 'all' | QualityHoldStatus;
  targetType?: 'all' | QualityHoldTargetType;
  severity?: 'all' | QualityHoldSeverity;
  reasonCategory?: string;
}

export interface QualityHoldKpis {
  totalHolds: number;
  activeHolds: number;
  releasedHolds: number;
  quarantinedHolds: number;
  avgAgingHours: number;
  criticalActiveCount: number;
}

export interface DispatchHoldCheck {
  isBlocked: boolean;
  blockingHolds: QualityHoldRecord[];
  blockReason: string;
}
