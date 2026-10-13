// src/types/workInstruction.ts

export type InstructionMediaType = 'image' | 'drawing' | 'video';

export interface CadDimensionDetail {
  parameter: string; // e.g. "Outer Diameter ØA"
  nominal: number;   // e.g. 75.000
  toleranceUpper: number; // e.g. +0.020
  toleranceLower: number; // e.g. -0.000
  unit: string;      // e.g. "mm"
  datumRef?: string; // e.g. "Datum A"
  criticalToQuality?: boolean;
}

export interface InstructionMedia {
  id: string;
  type: InstructionMediaType;
  title: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  drawingNumber?: string;
  sheetNumber?: string;
  cadDetails?: CadDimensionDetail[];
  videoDurationSeconds?: number;
  isVideoSimulated?: boolean;
}

export type SignOffType = 
  | 'confirmation'       // Checkbox: "I verified setup & clamping"
  | 'measurement'        // Numeric gauge reading with upper/lower tolerance validation
  | 'checklist'          // Multiple mandatory sub-checks
  | 'supervisor_approval'; // Quality inspector / shopfloor lead counter-signature

export interface StepMeasurementConfig {
  parameterName: string;      // e.g. "Bore Diameter Ø", "Surface Finish Ra"
  nominalValue: number;       // e.g. 50.000
  upperTolerance: number;      // e.g. +0.025
  lowerTolerance: number;      // e.g. -0.000
  unit: string;                // e.g. "mm", "µm", "bar", "Nm"
  gaugeToolRequired: string;   // e.g. "Three-Point Bore Micrometer (Calibrated)"
  warningThresholdPercent?: number; // 80% towards tolerance limit
}

export interface StepChecklistItem {
  id: string;
  label: string;
  mandatory: boolean;
  checked?: boolean;
}

export interface WorkInstructionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  keyPoints: string[];
  safetyWarnings?: string[];
  toolingRequired?: string[];
  media: InstructionMedia[];
  signOffRequired: boolean;
  signOffType: SignOffType;
  measurementConfig?: StepMeasurementConfig;
  checklistItems?: StepChecklistItem[];
  qualityCheckpointNote?: string;
  isCompleted?: boolean;
}

export interface StepSignOffRecord {
  id: string;
  stepId: string;
  stepNumber: number;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  operatorId: string;
  operatorName: string;
  operatorBadgeNumber: string;
  signedAt: string;
  status: 'passed' | 'failed' | 'override_approved';
  signOffType: SignOffType;
  measuredValue?: number;
  isWithinTolerance?: boolean;
  checklistCompleted?: Record<string, boolean>;
  notes?: string;
  signatureSvg?: string; // digital canvas drawing
  supervisorName?: string;
  supervisorBadgeNumber?: string;
  supervisorApprovedAt?: string;
  synced: boolean;
  offlineCreated: boolean;
  offlineTimestamp?: string;
}

export interface WorkInstructionDocument {
  id: string;
  tenantId: string;
  routingOperationId?: string;
  operationCode: string; // e.g. "OP-10", "OP-20", "OP-CUT-01"
  operationName: string; // e.g. "CNC Turning & OD/ID Roughing"
  partNumber: string;    // e.g. "GB-42T"
  partName: string;      // e.g. "Gear Blank — 42T"
  revision: string;      // e.g. "Rev 3.0"
  effectiveDate: string;
  author: string;
  approvedBy: string;
  workCenterName: string;
  workCenterCode: string;
  estimatedCycleTimeMinutes: number;
  safetyPpeRequired: string[];
  toolingFixtures: string[];
  requiredCertifications: string[];
  standardNotes: string;
  steps: WorkInstructionStep[];
  status: 'active' | 'draft' | 'archived';
  cachedOfflineAt?: string;
}

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingQueueCount: number;
  cachedWorkOrdersCount: number;
  lastSyncTimestamp: string | null;
  storageUsageKb: number;
}
