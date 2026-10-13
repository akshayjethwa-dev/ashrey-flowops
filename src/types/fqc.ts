// src/types/fqc.ts

export type FqcItemCategory = 
  | 'visual'
  | 'dimension'
  | 'functional'
  | 'packaging'
  | 'documentation'
  | 'cleanliness';

export type FqcCriticalLevel = 'critical' | 'major' | 'minor';

export type FqcItemResult = 'pending' | 'pass' | 'fail' | 'na';

export type FqcOrderStatus = 
  | 'pending'
  | 'in_progress'
  | 'passed'
  | 'rejected'
  | 'quarantined'
  | 'conditional_release';

export type FqcHoldStatus = 
  | 'on_hold'      // Auto-hold active! Dispatch blocked
  | 'released'     // Cleared for dispatch with CoC
  | 'quarantined'; // Hard quarantine, non-conforming

export interface FqcChecklistItem {
  id: string;
  title: string;
  criteria: string;
  category: FqcItemCategory;
  criticalLevel: FqcCriticalLevel;
  inspectionMethod: string; // e.g. "Vernier Caliper", "Visual 100%", "Torque Bench", "Optical Comparator", "Barcode Scanner"
  isMeasurement: boolean;
  targetNominal?: number;
  upperTolerance?: number;
  lowerTolerance?: number;
  unit?: string;
  result: FqcItemResult;
  measuredValue?: number;
  gageAssetTag?: string; // Integrated with Gage Calibration Master
  notes?: string;
  photoUrl?: string;
}

export interface FqcChecklistTemplate {
  id: string;
  partSku: string;
  partName: string;
  productFamily: string;
  version: string;
  sampleSizeRule: '100%_inspection' | 'ansi_asq_z1.4_level_ii' | 'sampling_c0' | 'custom';
  aqlLevel: string; // e.g. "0.65 Critical / 1.5 Major"
  standardReference: string; // e.g. "ISO 9001:2015, IATF 16949 Section 8.6"
  items: FqcChecklistItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityAuthoritySignOff {
  signedBy: string;
  role: string; // e.g. "Quality Assurance Manager", "Lead Quality Authority"
  badgeId?: string;
  signedAt: string; // ISO timestamp
  remarks: string;
  disposition: 'passed' | 'rejected' | 'conditional_release';
  signaturePinOrHash: string;
  cocNumber: string; // Certificate of Conformance number e.g. "COC-2026-0042"
}

export interface FqcInspectionOrder {
  id: string;
  fqcNumber: string; // e.g. "FQC-2026-0042"
  orderId: string;
  orderNumber: string;
  workOrderId?: string;
  workOrderNumber?: string;
  customerName: string;
  customerId?: string;
  partSku: string;
  partName: string;
  lotNumber: string;
  batchQuantity: number;
  sampleSize: number;
  inspectionDate: string;
  inspectorName: string;
  inspectorId: string;
  status: FqcOrderStatus;
  holdStatus: FqcHoldStatus;
  items: FqcChecklistItem[];
  overallResult: 'pass' | 'fail' | 'pending';
  defectSummary: {
    critical: number;
    major: number;
    minor: number;
  };
  qualityAuthoritySignOff?: QualityAuthoritySignOff;
  failureReason?: string;
  reworkNotes?: string;
  packagingSealed: boolean;
  barcodeVerified: boolean;
  cocGenerated: boolean;
  photos: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FqcKpiSummary {
  totalOrders: number;
  releasedCount: number;
  onHoldCount: number;
  rejectedCount: number;
  firstPassYieldPct: number;
  avgInspectionMinutes: number;
}

export interface FqcFilterOptions {
  searchQuery?: string;
  status?: 'all' | FqcOrderStatus;
  holdStatus?: 'all' | FqcHoldStatus;
  partSku?: 'all' | string;
  customer?: 'all' | string;
}

export interface DispatchReleaseCheck {
  isEligible: boolean;
  fqcOrder?: FqcInspectionOrder;
  status: FqcHoldStatus | 'not_initiated';
  cocNumber?: string;
  message: string;
  holdReason?: string;
  signedBy?: string;
  signedAt?: string;
}
