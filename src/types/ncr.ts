// src/types/ncr.ts

export type NcrSource = 
  | 'iqc'                 // Incoming Quality Control inspection rejection
  | 'ipqc'                // In-Process QCP checkpoint failure
  | 'spc'                 // Statistical Process Control out-of-control alert
  | 'fqc'                 // Final Quality Control pre-dispatch gate rejection
  | 'shopfloor'           // Operator / supervisor logged defect
  | 'customer_complaint'; // Post-delivery RMA / warranty claim

export type NcrSeverity = 'critical' | 'major' | 'minor';

export type NcrStatus = 
  | 'draft'
  | 'containment_active'   // Quarantined, awaiting MRB disposition
  | 'dispositioned'        // Disposition decided (rework/scrap/concession)
  | 'capa_in_progress'     // Linked to open CAPA
  | 'closed';              // Verification completed, fully resolved

export type NcrDispositionType = 
  | 'rework'               // Route back to specific operation for rework
  | 'scrap'                // Condemn and scrap material
  | 'use_as_is'            // Accept under engineering deviation / concession
  | 'return_to_vendor'     // RTV for incoming raw materials / parts
  | 'sort_segregate'       // 100% sort conforming vs non-conforming
  | 'pending';             // Awaiting MRB review

export type DefectCategory = 
  | 'dimension'            // Out of tolerance, runout, bore oversize
  | 'visual'               // Burrs, scratches, flash, bare spots
  | 'surface_finish'       // Roughness Ra exceedance, chatter marks
  | 'hardness_heat_treat'  // Hardness out of range, case depth failure
  | 'assembly'             // Missing component, misaligned, stripped thread
  | 'functional_leak'      // Pressure decay leak, electrical short, torque slip
  | 'packaging_label'      // Wrong barcode, damaged VCI wrap, missing CoA
  | 'material_chemical';   // Wrong alloy grade, porosity, inclusions

export interface NcrDispositionDetails {
  dispositionType: NcrDispositionType;
  dispositionedBy: string;
  role: string;
  dispositionedAt: string;
  reason: string;
  reworkInstructions?: string;
  reworkOperationCode?: string;
  scrapCostEstimate?: number;
  concessionNumber?: string;
  rtvDebitNoteNumber?: string;
  authorizedSignature: string;
}

export interface NcrRecord {
  id: string;
  ncrNumber: string;                 // e.g. "NCR-2026-0042"
  title: string;
  source: NcrSource;
  sourceReferenceId?: string;        // e.g. "FQC-2026-0044", "IQC-ORD-901", "WO-4418"
  partSku: string;
  partName: string;
  lotNumber: string;
  workOrderId?: string;
  workOrderNumber?: string;
  supplierName?: string;
  customerName?: string;
  reportedBy: string;
  reportedAt: string;
  defectCategory: DefectCategory;
  severity: NcrSeverity;
  affectedQuantity: number;          // Total units in batch/lot
  defectiveQuantity: number;         // Defective count
  defectDescription: string;
  immediateContainment: string;      // e.g. "Quarantined 25 units in Bin MRB-01, red tagged"
  quarantineLocation: string;        // e.g. "MRB Cage Shelf A-02"
  photos: string[];
  status: NcrStatus;
  disposition: NcrDispositionDetails;
  capaRequired: boolean;
  linkedCapaId?: string;
  linkedCapaNumber?: string;
  agingDays: number;
  isOverdue: boolean;                // Overdue if > 7 days without disposition or > 30 days open
  financialImpactCopq: number;       // Estimated Cost of Poor Quality (Scrap + Rework)
  createdAt: string;
  updatedAt: string;
}

export type CapaPhase = 
  | 'containment'           // D3: Immediate containment & risk evaluation
  | 'root_cause'            // D4: 5-Whys & Ishikawa investigation
  | 'corrective_action'     // D5/D6: Permanent corrective actions implementation
  | 'preventive_action'     // D7: Systemic preventive actions & SOP revision
  | 'verification'          // D8: Effectiveness verification audit
  | 'closed';

export type CapaStatus = 
  | 'open'
  | 'investigation'
  | 'actions_pending'
  | 'actions_implemented'
  | 'under_verification'
  | 'closed'
  | 'overdue';

export interface CapaActionItem {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: string;
  evidenceNotes?: string;
}

export interface CapaVerificationDetails {
  verifiedBy: string;
  verifiedAt: string;
  effectivenessMet: boolean;
  verificationMethod: string;        // e.g. "Zero defects across 3 consecutive production batches"
  auditFindings: string;
  closureAuthorized: boolean;
}

export interface CapaRecord {
  id: string;
  capaNumber: string;                // e.g. "CAPA-2026-0018"
  title: string;
  linkedNcrIds: string[];
  linkedNcrNumbers: string[];
  partSku: string;
  partName: string;
  problemStatement: string;          // 5W2H Problem statement
  ownerName: string;
  ownerEmail?: string;
  targetClosureDate: string;
  actualClosureDate?: string;
  phase: CapaPhase;
  status: CapaStatus;
  fiveWhys: string[];                // Array of 5 why questions & answers
  ishikawaCategory: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'environment';
  rootCauseSummary: string;
  correctiveActions: CapaActionItem[];
  preventiveActions: CapaActionItem[];
  verificationDetails?: CapaVerificationDetails;
  agingDays: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NcrAgingSummary {
  totalOpen: number;
  bracketUnder7: number;             // < 7 days (fresh)
  bracket8to14: number;              // 8-14 days (approaching limit)
  bracket15to30: number;             // 15-30 days (escalated)
  bracketOver30: number;             // > 30 days (critical overdue)
  avgDispositionDays: number;
  avgCapaClosureDays: number;
  totalEstimatedCopq: number;
}

export interface NcrKpiSummary {
  totalNcrs: number;
  openNcrs: number;
  dispositionPendingCount: number;
  activeCapas: number;
  overdueCount: number;
  firstTimeResolutionRatePct: number;
  totalScrapCost: number;
  totalReworkCost: number;
}

export interface NcrFilterOptions {
  searchQuery?: string;
  status?: 'all' | NcrStatus;
  severity?: 'all' | NcrSeverity;
  source?: 'all' | NcrSource;
  dispositionType?: 'all' | NcrDispositionType;
  agingBracket?: 'all' | 'under_7' | '8_to_14' | '15_to_30' | 'over_30';
}
