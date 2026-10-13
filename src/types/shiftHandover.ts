// src/types/shiftHandover.ts

export type ShiftType = 
  | 'shift_a'   // Morning: 06:00 - 14:00
  | 'shift_b'   // Afternoon: 14:00 - 22:00
  | 'shift_c'   // Night: 22:00 - 06:00
  | 'general';  // General Day: 09:00 - 18:00

export type ShiftHandoverStatus = 
  | 'draft'
  | 'submitted_pending_ack'
  | 'acknowledged'
  | 'flagged_issues';

export interface ShiftMachineSummary {
  machineId: string;
  machineCode: string;
  machineName: string;
  workCenterName: string;
  state: 'running' | 'idle' | 'faulted' | 'setup';
  currentJob?: string;
  operatorOnStation?: string;
  maintenanceNote?: string;
  criticalIssue?: boolean;
}

export interface ShiftWorkOrderSummary {
  workOrderId: string;
  orderNumber: string;
  partName: string;
  partNumber: string;
  targetQuantity: number;
  completedQuantity: number;
  currentOperationSequence: number;
  currentOperationName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progressPercent: number;
  handoverNote?: string;
  isBottleneck?: boolean;
}

export interface ShiftPendingTask {
  id: string;
  taskDescription: string;
  stationOrCell: string;
  priority: 'urgent' | 'high' | 'normal';
  assignedRoleOrPerson?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedByName?: string;
}

export interface ShiftSafetyQualityNote {
  safetyIncidentsCount: number;
  safetyObservations?: string;
  activeNcrCount: number;
  qualityAlerts?: string;
  toolingAlerts?: string;
  rawMaterialShortages?: string;
}

export interface ReceivingSupervisorChecklist {
  safetyBriefingCompleted: boolean;
  machineWalkthroughCompleted: boolean;
  wipCountVerified: boolean;
  urgentTasksUnderstood: boolean;
  receivingComments?: string;
}

export interface ShiftHandoverRecord {
  id: string;
  tenantId: string;
  plantId: string;
  plantName: string;
  handoverDate: string; // YYYY-MM-DD
  
  // Shift Times & Identification
  outgoingShift: ShiftType;
  outgoingShiftLabel: string;
  incomingShift: ShiftType;
  incomingShiftLabel: string;

  // Outgoing Supervisor Signoff
  outgoingSupervisorId: string;
  outgoingSupervisorName: string;
  outgoingSupervisorBadge: string;
  outgoingSubmittedAt: string; // ISO
  outgoingDigitalSignatureHash: string;

  // Incoming Supervisor Acknowledgment
  incomingSupervisorId?: string;
  incomingSupervisorName?: string;
  incomingSupervisorBadge?: string;
  incomingAcknowledgedAt?: string; // ISO
  incomingDigitalSignatureHash?: string;
  receivingChecklist?: ReceivingSupervisorChecklist;

  // Core Sections
  status: ShiftHandoverStatus;
  generalSummaryNotes: string;
  safetyAndQuality: ShiftSafetyQualityNote;
  machinesSummary: ShiftMachineSummary[];
  openWorkOrders: ShiftWorkOrderSummary[];
  pendingTasks: ShiftPendingTask[];

  // Production Metrics during Outgoing Shift
  shiftMetrics?: {
    totalUnitsProduced: number;
    totalScrapUnits: number;
    averageOeePercent: number;
    unplannedDowntimeMinutes: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface ShiftHandoverFilterOptions {
  shiftType?: ShiftType | 'all';
  status?: ShiftHandoverStatus | 'all';
  dateRange?: string; // 'today' | 'yesterday' | 'all'
  searchQuery?: string;
}
