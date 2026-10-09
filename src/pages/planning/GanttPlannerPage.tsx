// src/pages/planning/GanttPlannerPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Cpu,
  Layers,
  AlertTriangle,
  Play,
  Wrench,
  Users,
  Sparkles,
  Download,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowRight,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFiniteScheduling } from '../../hooks/useFiniteScheduling';
import { GanttTimelineSchedule } from '../../components/scheduling/GanttTimelineSchedule';
import { MachineCalendarModal } from '../../components/scheduling/MachineCalendarModal';
import { ShiftPatternManagerModal } from '../../components/scheduling/ShiftPatternManagerModal';
import { BottleneckAlertsDrawer } from '../../components/scheduling/BottleneckAlertsDrawer';
import { RescheduleOperationModal } from '../../components/scheduling/RescheduleOperationModal';
import { WhatIfSimulationModal } from '../../components/scheduling/WhatIfSimulationModal';
import { ScheduledOperation } from '../../types/scheduling';
import { convertToCsv, downloadCsvFile } from '../../utils/csvExport';

export const GanttPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    shifts,
    workCenters,
    downtimes,
    operators,
    scheduledOperations,
    capacitySummaries,
    filteredSummaries,
    bottleneckAlerts,
    kpis,
    loading,
    departments,
    startDate,
    setStartDate,
    timeWindowDays,
    setTimeWindowDays,
    simulationActive,
    simulationParams,
    setSimulationParams,
    handleToggleSimulation,
    handleRescheduleOperation,
    validateGanttMove,
    handleExecuteGanttReschedule,
    handleSaveDowntime,
    handleDeleteDowntime,
    handleSaveShift,
    handleSaveOperator,
    handleAutoScheduleAll,
    handleResetSchedule,
    handleAddOvertimeMitigation
  } = useFiniteScheduling();

  // Modals
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);
  const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState<boolean>(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [rescheduleModalOp, setRescheduleModalOp] = useState<ScheduledOperation | null>(null);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  // Export CSV
  const handleExportScheduleCsv = () => {
    if (scheduledOperations.length === 0) return;

    const rows = scheduledOperations.map(op => ({
      'Work Order': op.orderNumber,
      'Customer': op.customerName,
      'Part Name': op.partName,
      'Priority': op.priority,
      'Op Sequence': op.operationSequence,
      'Operation Name': op.operationName,
      'Machine Code': op.workCenterCode,
      'Machine Name': op.workCenterName,
      'Batch Qty': op.batchQuantity,
      'Setup Mins': op.setupTimeMinutes,
      'Cycle Mins': op.cycleTimeMinutes,
      'Total Required Hours': op.totalRequiredHours,
      'Scheduled Date': op.scheduledDate,
      'Customer Due Date': op.dueDate,
      'Assigned Operator': op.assignedOperatorName || 'Unassigned',
      'Status': op.status
    }));

    const csvData = convertToCsv(rows);
    downloadCsvFile(csvData, `FlowOps_Gantt_Planner_${startDate}.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/40">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Gantt-Based Production Planner
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Interactive Planner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag-and-drop Gantt planner across machines, shifts, and dates with real-time conflict detection and sequence validation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Guide Button */}
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Step-by-Step Guide
            {guideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Bottlenecks Button */}
          <button
            onClick={() => setAlertsDrawerOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
              bottleneckAlerts.length > 0 
                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Bottlenecks ({bottleneckAlerts.length})
          </button>

          {/* Machine Downtime Calendar */}
          <button
            onClick={() => setCalendarModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            Maintenance
          </button>

          {/* Shift Patterns */}
          <button
            onClick={() => setShiftModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Shifts
          </button>

          {/* Auto-Schedule Orders */}
          <button
            onClick={handleAutoScheduleAll}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Auto-Schedule
          </button>

          {/* Capacity Overview Switch */}
          <button
            onClick={() => navigate('/scheduling')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Capacity Load View
          </button>
        </div>
      </div>

      {/* ── Step-by-Step Guide Accordion ─────────────────────────── */}
      {guideOpen && (
        <div className="bg-slate-900/90 border border-indigo-900/70 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">
                How to Use the Gantt-Based Production Planner
              </h3>
            </div>
            <button
              onClick={() => setGuideOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Close Guide ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center text-[11px]">1</span>
                <span>Visual Gantt Canvas</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Work centers are structured as horizontal machine lanes with their standard hourly rates and daily capacities. Color-coded blocks represent scheduled operations.
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center text-[11px]">2</span>
                <span>Drag &amp; Drop Re-plan</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Click and drag any operation block across dates, machines, or shifts. You can also drag unassigned jobs from the top <strong className="text-amber-300">Backlog</strong> tray into any open lane.
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center text-[11px]">3</span>
                <span>Real-Time Conflict Engine</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Moving an operation instantly checks for machine overcapacity, maintenance collisions, customer delivery breaches, and sequence precedence. Use <strong className="text-indigo-300">Auto-Cascade</strong> to push successors forward automatically!
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center text-[11px]">4</span>
                <span>Zoom (Day / Week / Month)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Switch between detailed <strong className="text-indigo-300">Day View</strong> (shift-by-shift breakdown), <strong className="text-indigo-300">Week View</strong> (7-day dispatch grid), or <strong className="text-indigo-300">Month Macro</strong> (30-day capacity trends).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Scheduled Work Centers</span>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {kpis.totalWorkCenters} Machines
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Work Orders</span>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {kpis.activeWorkOrdersScheduled} Orders
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Factory Load vs Cap</span>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{kpis.averageFactoryUtilization}%</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                kpis.averageFactoryUtilization > 85 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
              }`}>
                {kpis.averageFactoryUtilization > 85 ? 'Heavy' : 'Balanced'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">At-Risk Bottlenecks</span>
            <div className="text-xl font-bold font-mono mt-0.5 flex items-center gap-1.5">
              <span className={kpis.activeBottleneckAlertsCount > 0 ? 'text-rose-400' : 'text-slate-100'}>
                {kpis.activeBottleneckAlertsCount} Alerts
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Flame className={`w-5 h-5 ${kpis.activeBottleneckAlertsCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* ── Main Gantt Schedule Component ────────────────────────── */}
      <GanttTimelineSchedule
        workCenters={workCenters}
        scheduledOperations={scheduledOperations}
        downtimes={downtimes}
        shifts={shifts}
        operators={operators}
        startDate={startDate}
        timeWindowDays={timeWindowDays}
        onStartDateChange={setStartDate}
        onTimeWindowDaysChange={setTimeWindowDays}
        onRescheduleOperation={(op) => setRescheduleModalOp(op)}
        onExecuteReschedule={handleExecuteGanttReschedule}
        onValidateMove={validateGanttMove}
      />

      {/* ── Modals & Drawers ─────────────────────────────────────── */}
      <MachineCalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        workCenters={workCenters}
        downtimes={downtimes}
        onSaveDowntime={handleSaveDowntime}
        onDeleteDowntime={handleDeleteDowntime}
      />

      <ShiftPatternManagerModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        shifts={shifts}
        operators={operators}
        workCenters={workCenters}
        onSaveShift={handleSaveShift}
        onSaveOperator={handleSaveOperator}
      />

      <BottleneckAlertsDrawer
        isOpen={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        alerts={bottleneckAlerts}
        onAddOvertime={handleAddOvertimeMitigation}
        onOpenRescheduleModal={(orderNum) => {
          setAlertsDrawerOpen(false);
          const match = scheduledOperations.find(o => o.orderNumber === orderNum);
          if (match) setRescheduleModalOp(match);
        }}
      />

      {rescheduleModalOp && (
        <RescheduleOperationModal
          isOpen={!!rescheduleModalOp}
          onClose={() => setRescheduleModalOp(null)}
          operation={rescheduleModalOp}
          workCenters={workCenters}
          shifts={shifts}
          onReschedule={async (opId, newDate, newWcId, newShiftId) => {
            await handleRescheduleOperation(opId, newDate, newWcId, newShiftId);
            setRescheduleModalOp(null);
          }}
        />
      )}
    </div>
  );
};
