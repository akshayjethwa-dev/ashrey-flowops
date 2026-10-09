// src/types/scheduling.ts

import { SkillLevel, OperationType } from './routing';
import { WorkOrderPriority, WorkOrderStatus } from './workOrder';

export type ShiftType = 'morning' | 'evening' | 'night' | 'general';

export interface ShiftDefinition {
  id: string;
  name: string; // e.g., "Shift A (Morning)"
  code: string; // e.g. "SH-A"
  shiftType: ShiftType;
  startTime: string; // "06:00"
  endTime: string; // "14:00"
  grossHours: number; // 8.0
  breakMinutes: number; // 30
  netHours: number; // 7.5
  efficiencyFactor: number; // e.g. 0.85 (85% standard OEE / machine availability)
  workingDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat. Default: [1,2,3,4,5,6] (Mon-Sat)
  color: string;
}

export interface OperatorStaffing {
  id: string;
  name: string;
  employeeCode: string;
  shiftId: string;
  primarySkill: SkillLevel;
  secondarySkills?: SkillLevel[];
  assignedWorkCenterIds?: string[];
  isAvailable: boolean;
  notes?: string;
}

export interface MachineDowntime {
  id: string;
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  downtimeHours: number;
  reason: 'preventive_maintenance' | 'breakdown' | 'tooling_change' | 'calibration' | 'holiday';
  description: string;
  impactOnCapacity: 'full_shutdown' | 'partial_50_percent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ScheduledOperation {
  id: string; // Unique schedule assignment ID
  workOrderId: string;
  orderNumber: string; // "WO-2026-0001"
  customerName: string;
  partName: string;
  partCode?: string;
  priority: WorkOrderPriority;
  operationId: string;
  operationSequence: number; // 10, 20, 30...
  operationName: string;
  operationType: OperationType;
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  batchQuantity: number;
  setupTimeMinutes: number;
  cycleTimeMinutes: number;
  totalRequiredHours: number; // (setupTimeMinutes + cycleTimeMinutes * batchQuantity) / 60
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledShiftId?: string;
  scheduledStartTime: string; // e.g. "2026-10-12T06:00:00"
  scheduledEndTime: string; // e.g. "2026-10-12T14:30:00"
  durationHours: number;
  requiredSkill: SkillLevel;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  dueDate: string; // Work order target completion date
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  isBottlenecked?: boolean;
  isOverdue?: boolean;
  predecessorOperationId?: string | null;
  predecessorFinishDate?: string | null;
}

export interface DayWorkCenterCapacity {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: string; // "Mon", "Tue"...
  isWorkingDay: boolean;
  shiftIds: string[];
  grossCapacityHours: number; // Total machine open hours
  effectiveCapacityHours: number; // gross * efficiency
  downtimeHours: number; // Scheduled maintenance
  finiteAvailableHours: number; // effectiveCapacity - downtime
  scheduledLoadHours: number; // Sum of scheduled operations
  utilizationPercent: number; // (scheduledLoad / finiteAvailable) * 100
  isOverloaded: boolean; // utilization > 100%
  scheduledOperationsCount: number;
}

export interface WorkCenterCapacitySummary {
  workCenterId: string;
  code: string;
  name: string;
  department: string;
  activeShiftsCount: number;
  dailyEffectiveCapacityHours: number;
  weeklyEffectiveCapacityHours: number;
  weeklyScheduledLoadHours: number;
  weeklyUtilizationPercent: number;
  isBottleneck: boolean;
  days: DayWorkCenterCapacity[];
  status: 'active' | 'maintenance' | 'inactive';
}

export type BottleneckSeverity = 'critical' | 'high' | 'medium' | 'low';

export type BottleneckType = 
  | 'capacity_overload' 
  | 'due_date_violation' 
  | 'skill_shortage' 
  | 'sequence_precedence_delay'
  | 'downtime_conflict';

export interface BottleneckAlert {
  id: string;
  type: BottleneckType;
  severity: BottleneckSeverity;
  workCenterId?: string;
  workCenterCode?: string;
  workCenterName?: string;
  workOrderId?: string;
  orderNumber?: string;
  operationId?: string;
  operationName?: string;
  date?: string;
  title: string;
  message: string;
  capacityHours?: number;
  loadHours?: number;
  overloadPercent?: number;
  daysLate?: number;
  missingSkill?: SkillLevel;
  suggestedAction: string;
  actionPayload?: {
    actionType: 'add_overtime' | 'reassign_workcenter' | 'split_batch' | 'expedite' | 'adjust_shift';
    workCenterId?: string;
    workOrderId?: string;
    recommendedWorkCenterId?: string;
    overtimeHours?: number;
  };
}

export interface SchedulingSimulationParams {
  includeOvertimeShift: boolean; // Add a 3rd shift or Saturday overtime (+4h)
  simulatedEfficiencyFactor?: number; // e.g. 0.95 instead of 0.85
  simulatedDowntimeMachineId?: string; // Machine forced into maintenance
  simulatedDowntimeDays?: number;
  rushWorkOrderId?: string; // Rush order inserted at top priority
  targetWorkCenterId?: string;
}

export interface SchedulingKPIs {
  totalWorkCenters: number;
  bottleneckWorkCentersCount: number;
  totalWeeklyCapacityHours: number;
  totalWeeklyScheduledLoadHours: number;
  averageFactoryUtilization: number;
  activeWorkOrdersScheduled: number;
  atRiskWorkOrdersCount: number;
  activeBottleneckAlertsCount: number;
}

export type GanttZoomLevel = 'day' | 'week' | 'month';

export type GanttConflictType = 
  | 'capacity_overload' 
  | 'maintenance_collision' 
  | 'predecessor_violation' 
  | 'successor_violation' 
  | 'due_date_violation' 
  | 'skill_mismatch';

export interface GanttConflict {
  id: string;
  type: GanttConflictType;
  severity: 'critical' | 'warning' | 'info';
  operationId: string;
  orderNumber: string;
  operationName: string;
  workCenterId: string;
  workCenterName: string;
  date: string;
  title: string;
  description: string;
  suggestedAction?: string;
  details?: {
    availableHours?: number;
    projectedLoadHours?: number;
    downtimeDescription?: string;
    predecessorDate?: string;
    predecessorOpSequence?: number;
    predecessorOpName?: string;
    successorDate?: string;
    successorOpSequence?: number;
    successorOpName?: string;
    dueDate?: string;
    daysOverdue?: number;
    requiredSkill?: SkillLevel;
  };
}

export interface GanttDragItem {
  operation: ScheduledOperation;
  sourceWorkCenterId: string;
  sourceDate: string;
}

export interface GanttRescheduleProposal {
  operation: ScheduledOperation;
  targetWorkCenterId: string;
  targetDate: string;
  targetShiftId?: string;
  conflicts: GanttConflict[];
  cascadedSuccessors?: ScheduledOperation[];
}
