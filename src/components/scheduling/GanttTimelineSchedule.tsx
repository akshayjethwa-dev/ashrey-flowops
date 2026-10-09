// src/components/scheduling/GanttTimelineSchedule.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  User,
  Zap,
  Info,
  ArrowRight,
  Filter,
  Search,
  FastForward,
  Download,
  Move,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import {
  ScheduledOperation,
  WorkCenterCapacitySummary,
  MachineDowntime,
  ShiftDefinition,
  OperatorStaffing,
  GanttZoomLevel,
  GanttConflict
} from '../../types/scheduling';
import { WorkCenter } from '../../types/routing';
import { GanttConflictModal } from './GanttConflictModal';
import { convertToCsv, downloadCsvFile } from '../../utils/csvExport';

interface GanttTimelineScheduleProps {
  workCenters: WorkCenter[];
  scheduledOperations: ScheduledOperation[];
  downtimes: MachineDowntime[];
  shifts?: ShiftDefinition[];
  operators?: OperatorStaffing[];
  startDate: string;
  timeWindowDays: number;
  onStartDateChange?: (date: string) => void;
  onTimeWindowDaysChange?: (days: number) => void;
  onRescheduleOperation: (op: ScheduledOperation) => void;
  onExecuteReschedule?: (
    operationId: string,
    targetWorkCenterId: string,
    targetDate: string,
    cascadeSuccessors?: boolean,
    targetShiftId?: string
  ) => Promise<void>;
  onValidateMove?: (
    operationId: string,
    targetWorkCenterId: string,
    targetDate: string
  ) => {
    conflicts: GanttConflict[];
    hasErrors: boolean;
    hasWarnings: boolean;
    cascadedSuccessors: ScheduledOperation[];
  };
}

interface DragOverState {
  workCenterId: string;
  dateStr: string;
  shiftId?: string;
  hasConflict?: boolean;
  conflictTitle?: string;
}

export const GanttTimelineSchedule: React.FC<GanttTimelineScheduleProps> = ({
  workCenters,
  scheduledOperations,
  downtimes,
  shifts = [],
  operators = [],
  startDate,
  timeWindowDays,
  onStartDateChange,
  onTimeWindowDaysChange,
  onRescheduleOperation,
  onExecuteReschedule,
  onValidateMove
}) => {
  // Zoom level: 'day' | 'week' | 'month'
  const [zoomLevel, setZoomLevel] = useState<GanttZoomLevel>('week');
  
  // Inspection Modal
  const [selectedOperation, setSelectedOperation] = useState<ScheduledOperation | null>(null);
  
  // Highlighted Work Order (when hovering or selecting)
  const [highlightedWorkOrderId, setHighlightedWorkOrderId] = useState<string | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);
  const [showBacklogTray, setShowBacklogTray] = useState<boolean>(false);

  // Drag and drop state
  const [draggingOp, setDraggingOp] = useState<ScheduledOperation | null>(null);
  const [dragOverCell, setDragOverCell] = useState<DragOverState | null>(null);

  // Conflict Resolution Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [pendingMove, setPendingMove] = useState<{
    operation: ScheduledOperation;
    targetWorkCenter: WorkCenter;
    targetDate: string;
    targetShiftId?: string;
    conflicts: GanttConflict[];
    cascadedSuccessors: ScheduledOperation[];
  } | null>(null);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Determine effective number of columns based on zoom
  const effectiveWindowDays = useMemo(() => {
    if (zoomLevel === 'day') return 1;
    if (zoomLevel === 'month') return 30;
    return timeWindowDays; // default week: 7 or 14
  }, [zoomLevel, timeWindowDays]);

  // Generate day columns array
  const dayColumns = useMemo(() => {
    const list: { dateStr: string; dayOfWeek: string; formatted: string; isToday: boolean; isWeekend: boolean }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < effectiveWindowDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayIndex = d.getDay();
      const dayOfWeek = dayNames[dayIndex];
      const formatted = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const isToday = dateStr === todayStr;
      const isWeekend = dayIndex === 0; // Sunday

      list.push({ dateStr, dayOfWeek, formatted, isToday, isWeekend });
    }
    return list;
  }, [startDate, effectiveWindowDays]);

  // Available shifts for Day zoom
  const dayShifts = useMemo(() => {
    if (shifts.length > 0) return shifts;
    return [
      { id: 'sh_morning', name: 'Shift A (Morning 06:00-14:00)', code: 'SH-A', color: '#0284c7' },
      { id: 'sh_evening', name: 'Shift B (Evening 14:00-22:00)', code: 'SH-B', color: '#7c3aed' },
      { id: 'sh_night', name: 'Shift C (Night 22:00-06:00)', code: 'SH-C', color: '#334155' }
    ];
  }, [shifts]);

  // Navigation handlers (Step backward or forward)
  const handleStepDate = (direction: -1 | 1) => {
    const step = zoomLevel === 'day' ? 1 : zoomLevel === 'month' ? 30 : 7;
    const d = new Date(startDate);
    d.setDate(d.getDate() + direction * step);
    const newStr = d.toISOString().slice(0, 10);
    if (onStartDateChange) {
      onStartDateChange(newStr);
    }
  };

  const handleJumpToToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (onStartDateChange) {
      onStartDateChange(todayStr);
    }
  };

  // Color mappings for priority
  const getPriorityStyle = (priority: string, isLate?: boolean) => {
    if (isLate) {
      return 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-950/50';
    }
    switch (priority) {
      case 'urgent':
        return 'bg-rose-950/80 border-rose-600 text-rose-200 hover:bg-rose-900/90 shadow-rose-950/40';
      case 'high':
        return 'bg-amber-950/80 border-amber-600 text-amber-200 hover:bg-amber-900/90 shadow-amber-950/40';
      case 'medium':
        return 'bg-indigo-950/80 border-indigo-600 text-indigo-200 hover:bg-indigo-900/90 shadow-indigo-950/40';
      default:
        return 'bg-emerald-950/80 border-emerald-600 text-emerald-200 hover:bg-emerald-900/90 shadow-emerald-950/40';
    }
  };

  // Filtered work centers
  const filteredWorkCenters = useMemo(() => {
    return workCenters.filter(wc => {
      if (departmentFilter !== 'all' && wc.department !== departmentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = wc.name.toLowerCase().includes(q);
        const matchesCode = wc.code.toLowerCase().includes(q);
        const matchesDept = wc.department.toLowerCase().includes(q);
        // Also check if any scheduled operation inside matches
        const opsInside = scheduledOperations.filter(
          o => o.workCenterId === wc.id && (
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.partName.toLowerCase().includes(q)
          )
        );
        return matchesName || matchesCode || matchesDept || opsInside.length > 0;
      }
      return true;
    });
  }, [workCenters, departmentFilter, searchQuery, scheduledOperations]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(workCenters.map(w => w.department));
    return Array.from(set).sort();
  }, [workCenters]);

  // Unscheduled / Pending Backlog operations
  const backlogOperations = useMemo(() => {
    return scheduledOperations.filter(op => op.status === 'delayed' || !op.scheduledDate);
  }, [scheduledOperations]);

  // ── Drag & Drop Handlers ──────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, op: ScheduledOperation) => {
    e.dataTransfer.setData('text/plain', op.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingOp(op);
    setHighlightedWorkOrderId(op.workOrderId);
  };

  const handleDragEnd = () => {
    setDraggingOp(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, workCenterId: string, dateStr: string, shiftId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (
      dragOverCell?.workCenterId !== workCenterId ||
      dragOverCell?.dateStr !== dateStr ||
      dragOverCell?.shiftId !== shiftId
    ) {
      let hasConflict = false;
      let conflictTitle = '';

      if (draggingOp && onValidateMove) {
        const validation = onValidateMove(draggingOp.id, workCenterId, dateStr);
        if (validation.conflicts.length > 0) {
          hasConflict = true;
          conflictTitle = validation.conflicts[0].title;
        }
      }

      setDragOverCell({
        workCenterId,
        dateStr,
        shiftId,
        hasConflict,
        conflictTitle
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving current cell area
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverCell(null);
    }
  };

  const handleDrop = async (workCenterId: string, dateStr: string, shiftId?: string) => {
    if (!draggingOp) return;

    const opToMove = draggingOp;
    setDraggingOp(null);
    setDragOverCell(null);

    // If dropped in identical location, do nothing
    if (opToMove.workCenterId === workCenterId && opToMove.scheduledDate === dateStr && (!shiftId || opToMove.scheduledShiftId === shiftId)) {
      return;
    }

    const targetWc = workCenters.find(w => w.id === workCenterId) || workCenters[0];

    // Run real-time conflict validation
    if (onValidateMove) {
      const validation = onValidateMove(opToMove.id, workCenterId, dateStr);

      if (validation.conflicts.length > 0) {
        // Open conflict diagnostic modal with auto-cascade choice!
        setPendingMove({
          operation: opToMove,
          targetWorkCenter: targetWc,
          targetDate: dateStr,
          targetShiftId: shiftId,
          conflicts: validation.conflicts,
          cascadedSuccessors: validation.cascadedSuccessors
        });
        setConflictModalOpen(true);
        return;
      }
    }

    // Clean drop — apply immediately
    if (onExecuteReschedule) {
      await onExecuteReschedule(opToMove.id, workCenterId, dateStr, false, shiftId);
      showToast(`Rescheduled ${opToMove.orderNumber} (Op ${opToMove.operationSequence}) to ${targetWc.code} on ${dateStr}`);
    }
  };

  // Confirm resolution from Conflict Modal
  const handleConfirmConflictMove = async (cascadeSuccessors: boolean) => {
    if (!pendingMove) return;

    if (onExecuteReschedule) {
      await onExecuteReschedule(
        pendingMove.operation.id,
        pendingMove.targetWorkCenter.id,
        pendingMove.targetDate,
        cascadeSuccessors,
        pendingMove.targetShiftId
      );

      const msg = cascadeSuccessors
        ? `Rescheduled ${pendingMove.operation.orderNumber} with ${pendingMove.cascadedSuccessors.length} downstream operation(s) cascaded!`
        : `Rescheduled ${pendingMove.operation.orderNumber} to ${pendingMove.targetWorkCenter.code} on ${pendingMove.targetDate}`;
      showToast(msg);
    }

    setConflictModalOpen(false);
    setPendingMove(null);
  };

  // Export visible Gantt to CSV
  const handleExportGantt = () => {
    if (scheduledOperations.length === 0) return;
    const rows = scheduledOperations.map(op => ({
      'Order Number': op.orderNumber,
      'Customer': op.customerName,
      'Part': op.partName,
      'Op Sequence': op.operationSequence,
      'Operation Name': op.operationName,
      'Machine': op.workCenterName,
      'Machine Code': op.workCenterCode,
      'Duration (Hours)': op.totalRequiredHours,
      'Scheduled Date': op.scheduledDate,
      'Shift': op.scheduledShiftId || 'Standard',
      'Due Date': op.dueDate,
      'Status': op.status,
      'Priority': op.priority
    }));
    const csv = convertToCsv(rows);
    downloadCsvFile(csv, `FlowOps_Gantt_Plan_${startDate}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* ── Toast Notification ───────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Planner Control & Zoom Toolbar ──────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        {/* Left: Zoom Controls & Period Step */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 shadow-inner">
            <button
              onClick={() => {
                setZoomLevel('day');
                if (onTimeWindowDaysChange) onTimeWindowDaysChange(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                zoomLevel === 'day'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Day View
            </button>
            <button
              onClick={() => {
                setZoomLevel('week');
                if (onTimeWindowDaysChange) onTimeWindowDaysChange(7);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                zoomLevel === 'week'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Week View (7d)
            </button>
            <button
              onClick={() => {
                setZoomLevel('month');
                if (onTimeWindowDaysChange) onTimeWindowDaysChange(30);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                zoomLevel === 'month'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Month Macro (30d)
            </button>
          </div>

          {/* Date Step Controls */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => handleStepDate(-1)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Previous Period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition"
            >
              Today
            </button>
            <button
              onClick={() => handleStepDate(1)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Next Period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Date Display */}
          <div className="font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">{dayColumns[0]?.formatted}</span>
            {dayColumns.length > 1 && (
              <>
                <span className="text-slate-500">→</span>
                <span className="font-semibold">{dayColumns[dayColumns.length - 1]?.formatted}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Search, Filter, Backlog Dock, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative min-w-[160px]">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter order, machine..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Backlog Tray Toggle */}
          <button
            onClick={() => setShowBacklogTray(!showBacklogTray)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
              showBacklogTray
                ? 'bg-amber-950 text-amber-200 border-amber-700'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Toggle Unscheduled &amp; Delayed Jobs Tray"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Backlog ({backlogOperations.length})
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportGantt}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition"
            title="Export Visible Gantt Plan to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Backlog & Unscheduled Operations Drawer ──────────────── */}
      {showBacklogTray && (
        <div className="bg-slate-950/90 border border-amber-900/60 rounded-xl p-3.5 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Unscheduled &amp; Delayed Operations Backlog ({backlogOperations.length})
              </h4>
              <span className="text-[11px] text-slate-400 ml-2">
                Drag any job directly into a machine schedule lane below to dispatch
              </span>
            </div>
            <button
              onClick={() => setShowBacklogTray(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕ Hide
            </button>
          </div>

          {backlogOperations.length === 0 ? (
            <div className="text-slate-500 text-xs py-2 text-center">
              All operations are actively scheduled. No pending backlog items.
            </div>
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {backlogOperations.map(op => (
                <div
                  key={op.id}
                  draggable
                  onDragStart={e => handleDragStart(e, op)}
                  onDragEnd={handleDragEnd}
                  className={`min-w-[200px] max-w-[240px] p-2 rounded-lg border text-xs cursor-grab active:cursor-grabbing transition shadow-sm ${getPriorityStyle(op.priority)}`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold">{op.orderNumber}</span>
                    <span className="opacity-80">{op.totalRequiredHours}h</span>
                  </div>
                  <div className="font-semibold text-slate-100 truncate mt-0.5">
                    Op {op.operationSequence}: {op.operationName}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">{op.customerName}</div>
                  <div className="text-[9px] text-amber-300 mt-1 flex items-center gap-1">
                    <Move className="w-2.5 h-2.5" /> Drag onto machine lane
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Legend & Conflict Indicator Strip ────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Priority:</span>
          <span className="flex items-center gap-1.5 text-rose-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" /> Urgent
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block" /> High
          </span>
          <span className="flex items-center gap-1.5 text-indigo-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" /> Medium
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> Normal
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-3 h-2.5 bg-amber-900/60 border border-dashed border-amber-500 rounded inline-block" />
            Maintenance Window
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Move className="w-3 h-3" />
            Drag &amp; Drop to Reschedule with Conflict Validation
          </span>
        </div>
      </div>

      {/* ── Main Gantt Schedule Canvas ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Header: Date / Shift Columns */}
            <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-300">
              {/* Left Column Header: Work Center Info */}
              <div className="col-span-3 p-3 border-r border-slate-800 flex items-center justify-between">
                <span className="uppercase tracking-wider text-slate-400 text-[11px]">Work Center / Machine</span>
                <span className="text-[10px] text-slate-500 font-mono">Finite Capacity</span>
              </div>

              {/* Day / Shift Column Headers */}
              {zoomLevel === 'day' ? (
                // Day Zoom: Breakdown by Shifts
                <div className="col-span-9 grid" style={{ gridTemplateColumns: `repeat(${dayShifts.length}, minmax(0, 1fr))` }}>
                  {dayShifts.map(sh => (
                    <div
                      key={sh.id}
                      className="p-2.5 border-r border-slate-800 last:border-r-0 text-center flex flex-col items-center justify-center bg-slate-950"
                    >
                      <span className="text-indigo-400 text-[10px] font-mono font-bold uppercase">{sh.code}</span>
                      <span className="text-slate-200 font-semibold text-xs mt-0.5">{sh.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Week / Month Zoom: Day columns
                <div className="col-span-9 grid" style={{ gridTemplateColumns: `repeat(${dayColumns.length}, minmax(0, 1fr))` }}>
                  {dayColumns.map(col => (
                    <div
                      key={col.dateStr}
                      className={`p-2 border-r border-slate-800 last:border-r-0 text-center flex flex-col items-center justify-center ${
                        col.isToday ? 'bg-indigo-950/40 text-indigo-300 font-bold' : ''
                      } ${col.isWeekend ? 'bg-slate-950/80 text-slate-500' : ''}`}
                    >
                      <span className="text-[10px] uppercase font-mono tracking-tight">{col.dayOfWeek}</span>
                      <span className="text-slate-200 font-semibold text-[11px] mt-0.5">{col.formatted}</span>
                      {col.isToday && (
                        <span className="text-[9px] text-indigo-400 font-bold tracking-tight">TODAY</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Machine Rows */}
            <div className="divide-y divide-slate-800">
              {filteredWorkCenters.map(wc => {
                return (
                  <div key={wc.id} className="grid grid-cols-12 min-h-[96px] hover:bg-slate-850/30 transition">
                    {/* Left Column: Work Center Badge & Specs */}
                    <div className="col-span-3 p-3 border-r border-slate-800 flex flex-col justify-between bg-slate-900/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            {wc.code}
                          </span>
                          <h4 className="font-medium text-slate-200 text-xs leading-tight line-clamp-1" title={wc.name}>
                            {wc.name}
                          </h4>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>{wc.department}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">₹{wc.hourlyMachineRate}/h</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1">
                        <span>Std: {wc.capacityHoursPerDay}h/day</span>
                        <span className="text-emerald-400">Available</span>
                      </div>
                    </div>

                    {/* Columns: Grid Slots */}
                    {zoomLevel === 'day' ? (
                      // Day Zoom: Shifts per machine
                      <div className="col-span-9 grid" style={{ gridTemplateColumns: `repeat(${dayShifts.length}, minmax(0, 1fr))` }}>
                        {dayShifts.map(sh => {
                          const targetDate = dayColumns[0]?.dateStr || startDate;
                          const opsThisShift = scheduledOperations.filter(
                            o => o.workCenterId === wc.id && o.scheduledDate === targetDate && (o.scheduledShiftId === sh.id || !o.scheduledShiftId)
                          );

                          const isOver = dragOverCell?.workCenterId === wc.id && dragOverCell?.dateStr === targetDate && dragOverCell?.shiftId === sh.id;

                          return (
                            <div
                              key={sh.id}
                              onDragOver={e => handleDragOver(e, wc.id, targetDate, sh.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={() => handleDrop(wc.id, targetDate, sh.id)}
                              className={`p-2 border-r border-slate-800 last:border-r-0 flex flex-col gap-1.5 min-h-[96px] transition ${
                                isOver
                                  ? dragOverCell?.hasConflict
                                    ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-inset'
                                    : 'bg-indigo-950/60 ring-2 ring-indigo-500 ring-inset'
                                  : 'bg-slate-900/20'
                              }`}
                            >
                              {isOver && (
                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate ${
                                  dragOverCell?.hasConflict ? 'bg-rose-900 text-rose-200' : 'bg-indigo-900 text-indigo-200'
                                }`}>
                                  {dragOverCell?.hasConflict ? `⚠️ ${dragOverCell.conflictTitle || 'Conflict'}` : 'Drop here'}
                                </div>
                              )}

                              {opsThisShift.map(op => renderOperationCard(op))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Week / Month Zoom: Day slots per machine
                      <div
                        className="col-span-9 grid"
                        style={{ gridTemplateColumns: `repeat(${dayColumns.length}, minmax(0, 1fr))` }}
                      >
                        {dayColumns.map(col => {
                          const opsThisDay = scheduledOperations.filter(
                            o => o.workCenterId === wc.id && o.scheduledDate === col.dateStr
                          );

                          const dtThisDay = downtimes.filter(
                            d => d.workCenterId === wc.id && d.date === col.dateStr && d.status !== 'cancelled'
                          );

                          const totalLoadHours = opsThisDay.reduce((sum, o) => sum + o.totalRequiredHours, 0);
                          const isOver = dragOverCell?.workCenterId === wc.id && dragOverCell?.dateStr === col.dateStr;

                          return (
                            <div
                              key={col.dateStr}
                              onDragOver={e => handleDragOver(e, wc.id, col.dateStr)}
                              onDragLeave={handleDragLeave}
                              onDrop={() => handleDrop(wc.id, col.dateStr)}
                              className={`p-1.5 border-r border-slate-800 last:border-r-0 flex flex-col gap-1.5 min-h-[96px] transition relative ${
                                isOver
                                  ? dragOverCell?.hasConflict
                                    ? 'bg-rose-950/60 ring-2 ring-rose-500 ring-inset'
                                    : 'bg-indigo-950/60 ring-2 ring-indigo-500 ring-inset'
                                  : col.isWeekend
                                  ? 'bg-slate-950/40'
                                  : 'bg-slate-900/20'
                              }`}
                            >
                              {/* Drag-over indicator pill */}
                              {isOver && (
                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate z-10 ${
                                  dragOverCell?.hasConflict ? 'bg-rose-900 text-rose-200' : 'bg-indigo-900 text-indigo-200'
                                }`}>
                                  {dragOverCell?.hasConflict ? `⚠️ ${dragOverCell.conflictTitle || 'Conflict'}` : '✓ Drop to schedule'}
                                </div>
                              )}

                              {/* Maintenance Windows */}
                              {dtThisDay.map(dt => (
                                <div
                                  key={dt.id}
                                  title={`${dt.description} (${dt.downtimeHours}h)`}
                                  className="p-1 rounded bg-amber-950/70 border border-dashed border-amber-600/80 text-amber-200 text-[10px] flex items-center gap-1 shadow-sm select-none"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="font-semibold truncate">Maint: {dt.downtimeHours}h</span>
                                </div>
                              ))}

                              {/* Scheduled Operation Cards */}
                              {opsThisDay.map(op => renderOperationCard(op))}

                              {/* Day Slot Load Summary */}
                              {opsThisDay.length > 0 && (
                                <div className="text-[9px] font-mono text-slate-500 text-right mt-auto pr-0.5">
                                  Σ {parseFloat(totalLoadHours.toFixed(1))}h
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Operation Inspection Modal ──────────────────────────── */}
      {selectedOperation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                    selectedOperation.priority === 'urgent' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                    selectedOperation.priority === 'high' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {selectedOperation.priority}
                  </span>
                  <h3 className="font-mono text-base font-bold text-slate-100">
                    {selectedOperation.orderNumber}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedOperation.customerName}
                </p>
              </div>

              <button
                onClick={() => setSelectedOperation(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Operation Details */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Operation Sequence:</span>
                <span className="font-semibold text-indigo-300 font-mono">
                  Op {selectedOperation.operationSequence} • {selectedOperation.operationName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Part Name:</span>
                <span className="font-medium text-slate-200 text-right">
                  {selectedOperation.partName} ({selectedOperation.partCode || 'N/A'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Batch Quantity:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {selectedOperation.batchQuantity} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Scheduled Work Center:</span>
                <span className="font-semibold text-slate-200">
                  {selectedOperation.workCenterCode} ({selectedOperation.workCenterName})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Run Time Calculation:</span>
                <span className="font-mono text-slate-300">
                  {selectedOperation.setupTimeMinutes}m setup + ({selectedOperation.batchQuantity} × {selectedOperation.cycleTimeMinutes}m) = <strong className="text-indigo-300">{selectedOperation.totalRequiredHours}h</strong>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {selectedOperation.scheduledDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer Due Date:</span>
                <span className={`font-mono font-semibold ${
                  selectedOperation.dueDate && selectedOperation.scheduledDate > selectedOperation.dueDate 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  {selectedOperation.dueDate || 'None specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Operator:</span>
                <span className="font-medium text-slate-200">
                  {selectedOperation.assignedOperatorName || 'Unassigned'} ({selectedOperation.requiredSkill})
                </span>
              </div>
            </div>

            {/* Predecessor Info */}
            {selectedOperation.predecessorFinishDate && (
              <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="text-indigo-200">
                  Prior operation finished on <strong className="font-mono">{selectedOperation.predecessorFinishDate}</strong>.
                  Sequenced according to routing rules.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedOperation(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const op = selectedOperation;
                  setSelectedOperation(null);
                  onRescheduleOperation(op);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Manual Reschedule Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conflict Diagnostic & Cascade Resolution Modal ─────── */}
      {pendingMove && (
        <GanttConflictModal
          isOpen={conflictModalOpen}
          operation={pendingMove.operation}
          targetWorkCenter={pendingMove.targetWorkCenter}
          targetDate={pendingMove.targetDate}
          conflicts={pendingMove.conflicts}
          cascadedSuccessors={pendingMove.cascadedSuccessors}
          onConfirm={handleConfirmConflictMove}
          onCancel={() => {
            setConflictModalOpen(false);
            setPendingMove(null);
          }}
        />
      )}
    </div>
  );

  // Helper to render an operation card block
  function renderOperationCard(op: ScheduledOperation) {
    const isLate = op.dueDate ? op.scheduledDate > op.dueDate : false;
    const isHighlighted = highlightedWorkOrderId === op.workOrderId;

    return (
      <div
        key={op.id}
        draggable
        onDragStart={e => handleDragStart(e, op)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setHighlightedWorkOrderId(op.workOrderId)}
        onMouseLeave={() => setHighlightedWorkOrderId(null)}
        onClick={() => setSelectedOperation(op)}
        className={`p-1.5 rounded-lg border text-[11px] cursor-grab active:cursor-grabbing transition-all duration-150 shadow select-none ${getPriorityStyle(op.priority, isLate)} ${
          isHighlighted ? 'ring-2 ring-indigo-400 scale-[1.02]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-mono font-bold text-[10px]">
            {op.orderNumber}
          </span>
          <span className="font-mono text-[10px] opacity-90">
            {op.totalRequiredHours}h
          </span>
        </div>
        <div className="text-[10px] font-medium leading-tight truncate">
          Op {op.operationSequence}: {op.operationName}
        </div>
        <div className="text-[9px] opacity-80 truncate mt-0.5">
          {op.customerName}
        </div>

        {isLate && (
          <div className="text-[9px] font-bold text-rose-300 mt-0.5 flex items-center gap-0.5">
            ⚠️ Late by {op.dueDate}
          </div>
        )}
      </div>
    );
  }
};
