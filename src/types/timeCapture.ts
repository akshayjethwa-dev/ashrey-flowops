// src/types/timeCapture.ts

export type TimeLogStatus = 'running' | 'paused' | 'completed' | 'cancelled';

export interface OperationTimeLog {
  id: string;
  tenantId: string;
  plantId?: string;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationSequence: number; // e.g. 10, 20, 30
  operationName: string;
  partNumber: string;
  partName: string;
  workCenterName: string;
  workCenterCode: string;
  operatorId: string;
  operatorName: string;
  operatorBadgeNumber: string;
  operatorDepartment?: string;
  startedAt: string;          // ISO timestamp
  stoppedAt?: string;          // ISO timestamp
  pausedAt?: string;           // ISO timestamp if paused
  totalPauseMinutes?: number;
  status: TimeLogStatus;
  standardTimeMinutes: number; // Scheduled standard duration
  actualTimeMinutes?: number;  // Measured elapsed active time
  varianceMinutes?: number;    // actualTimeMinutes - standardTimeMinutes (neg = ahead, pos = overrun)
  efficiencyPercent?: number;  // (standardTimeMinutes / actualTimeMinutes) * 100
  unitsProduced?: number;      // Good completed pieces
  unitsScrapped?: number;      // Defective pieces
  scrapReason?: string;
  pauseReason?: string;
  shiftName?: string;          // 'Shift A (06:00-14:00)' | 'Shift B (14:00-22:00)'
  clockInMethod: 'barcode_scan' | 'touchscreen' | 'rfid_badge';
  clockOutMethod?: 'barcode_scan' | 'touchscreen' | 'rfid_badge';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorProfile {
  id: string;
  badgeNumber: string; // e.g. "EMP-7041"
  name: string;        // e.g. "Ramesh K."
  role: string;        // "CNC Turning Operator"
  department: string;  // "Machine Shop"
  primaryStation: string; // "WC-CNC-04"
  status: 'available' | 'clocked_in' | 'on_break';
  activeTimeLogId?: string;
  shift: string;
}

export interface TimeCaptureFilterParams {
  searchQuery?: string;
  status?: TimeLogStatus | 'all';
  operatorBadge?: string | 'all';
  workCenter?: string | 'all';
  dateRange?: 'today' | 'this_week' | 'all';
}

export interface TimeCaptureStats {
  activeClockedInCount: number;
  completedCount: number;
  totalStandardMinutes: number;
  totalActualMinutes: number;
  overallEfficiencyPercent: number;
  netVarianceMinutes: number; // negative means saved time
}
