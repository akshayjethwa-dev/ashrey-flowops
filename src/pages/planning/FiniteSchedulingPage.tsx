// src/pages/planning/FiniteSchedulingPage.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowRight
} from 'lucide-react';
import { useFiniteScheduling } from '../../hooks/useFiniteScheduling';
import { CapacityLoadDashboard } from '../../components/scheduling/CapacityLoadDashboard';
import { GanttTimelineSchedule } from '../../components/scheduling/GanttTimelineSchedule';
import { MachineCalendarModal } from '../../components/scheduling/MachineCalendarModal';
import { ShiftPatternManagerModal } from '../../components/scheduling/ShiftPatternManagerModal';
import { BottleneckAlertsDrawer } from '../../components/scheduling/BottleneckAlertsDrawer';
import { RescheduleOperationModal } from '../../components/scheduling/RescheduleOperationModal';
import { WhatIfSimulationModal } from '../../components/scheduling/WhatIfSimulationModal';
import { ScheduledOperation } from '../../types/scheduling';
import { convertToCsv, downloadCsvFile } from '../../utils/csvExport';

export const FiniteSchedulingPage: React.FC = () => {
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
    departmentFilter,
    setDepartmentFilter,
    selectedWorkCenterId,
    setSelectedWorkCenterId,
    bottleneckOnly,
    setBottleneckOnly,
    searchQuery,
    setSearchQuery,
    simulationActive,
    simulationParams,
    setSimulationParams,
    handleToggleSimulation,
    handleRescheduleOperation,
    handleSaveDowntime,
    handleDeleteDowntime,
    handleSaveShift,
    handleSaveOperator,
    handleAutoScheduleAll,
    handleResetSchedule,
    handleAddOvertimeMitigation,
    validateGanttMove,
    handleExecuteGanttReschedule
  } = useFiniteScheduling();

  const [searchParams] = useSearchParams();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'machines' | 'shifts'>('overview');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'timeline' || tabParam === 'gantt') {
      setActiveTab('timeline');
    } else if (tabParam === 'machines' || tabParam === 'shifts' || tabParam === 'overview') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Modal open states
  const [calendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);
  const [shiftModalOpen, setShiftModalOpen] = useState<boolean>(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState<boolean>(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [rescheduleModalOp, setRescheduleModalOp] = useState<ScheduledOperation | null>(null);

  // Export CSV
  const handleExportScheduleCsv = () => {
    if (scheduledOperations.length === 0) return;

    const rows = scheduledOperations.map(op => ({
      'Work Order': op.orderNumber,
      'Customer': op.customerName,
      'Part Name': op.partName,
      'Part Code': op.partCode || '',
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
      'Required Skill': op.requiredSkill,
      'Status': op.status
    }));

    const csvData = convertToCsv(rows);
    downloadCsvFile(csvData, `Finite_Capacity_Schedule_${startDate}.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Finite-Capacity Scheduling
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Schedule work orders against actual machine capacity, shift calendars, and operator availability to prevent shop floor bottlenecks.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bottleneck Alerts Button */}
          <button
            onClick={() => setAlertsDrawerOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
              bottleneckAlerts.length > 0 
                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700 animate-pulse' 
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
            Machine Calendar &amp; Downtime
          </button>

          {/* Shift Patterns & Staffing */}
          <button
            onClick={() => setShiftModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Shift Patterns
          </button>

          {/* What-If Simulation Sandbox */}
          <button
            onClick={() => setSimulationModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
              simulationActive 
                ? 'bg-teal-950 text-teal-200 border-teal-600' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            {simulationActive ? 'Simulation Active' : 'What-If Simulation'}
          </button>

          {/* Auto-Schedule Dispatch Button */}
          <button
            onClick={handleAutoScheduleAll}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Auto-Schedule Orders
          </button>

          {/* Export Schedule CSV */}
          <button
            onClick={handleExportScheduleCsv}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Export Schedule CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleResetSchedule}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Reset to default baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Active Simulation Banner ────────────────────────────── */}
      {simulationActive && (
        <div className="bg-teal-950/70 border border-teal-700/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-teal-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="font-bold">What-If Simulation Active:</span> Showing calculated capacity impact
              {simulationParams.includeOvertimeShift && ' with +4h Daily Overtime Shift'}
              {simulationParams.simulatedDowntimeMachineId && ' with simulated machine breakdown'}
              {simulationParams.simulatedEfficiencyFactor && ` with ${Math.round(simulationParams.simulatedEfficiencyFactor * 100)}% OEE`}.
            </div>
          </div>
          <button
            onClick={() => handleToggleSimulation(false)}
            className="px-3 py-1 bg-teal-900/80 hover:bg-teal-800 text-teal-100 rounded-lg font-semibold border border-teal-700 transition"
          >
            Exit Simulation
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Capacity vs. Load Overview
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Visual Dispatch Timeline (Gantt)
        </button>

        <button
          onClick={() => setActiveTab('machines')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'machines'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Machine Calendars &amp; Downtime ({downtimes.length})
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'shifts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Shift Patterns &amp; Staffing ({shifts.length})
        </button>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Query */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search work center or part..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Work Center Filter */}
          <select
            value={selectedWorkCenterId}
            onChange={e => setSelectedWorkCenterId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Work Centers ({workCenters.length})</option>
            {workCenters.map(wc => (
              <option key={wc.id} value={wc.id}>{wc.code} — {wc.name}</option>
            ))}
          </select>

          {/* Bottleneck Only Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium select-none ml-1">
            <input
              type="checkbox"
              checked={bottleneckOnly}
              onChange={e => setBottleneckOnly(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded"
            />
            <span className={bottleneckOnly ? 'text-rose-400 font-bold' : ''}>
              Bottlenecks Only
            </span>
          </label>
        </div>

        {/* Time Window & Date Picker */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Start:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono"
          />

          <span className="text-slate-400 font-medium ml-1">Window:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setTimeWindowDays(7)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                timeWindowDays === 7 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeWindowDays(14)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                timeWindowDays === 14 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeWindowDays(30)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                timeWindowDays === 30 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Tab Contents ───────────────────────────────────── */}
      {activeTab === 'overview' && (
        <CapacityLoadDashboard
          kpis={kpis}
          summaries={filteredSummaries}
          scheduledOperations={scheduledOperations}
          timeWindowDays={timeWindowDays}
          onSelectWorkCenter={(id) => setSelectedWorkCenterId(id)}
          onOpenRescheduleModal={(op) => setRescheduleModalOp(op)}
          onOpenAlerts={() => setAlertsDrawerOpen(true)}
        />
      )}

      {activeTab === 'timeline' && (
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
      )}

      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                Work Center Machines &amp; Planned Outages
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of machine standard daily capacities and registered maintenance windows
              </p>
            </div>
            <button
              onClick={() => setCalendarModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              Schedule Maintenance Window
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Machine Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Std Day Hours</th>
                  <th className="py-3 px-4">Rates (Mach / Labor)</th>
                  <th className="py-3 px-4">Maintenance Events</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {workCenters.map(wc => {
                  const wcDowntimes = downtimes.filter(d => d.workCenterId === wc.id && d.status !== 'cancelled');
                  return (
                    <tr key={wc.id} className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">{wc.code}</td>
                      <td className="py-3 px-4 text-slate-100 font-medium">{wc.name}</td>
                      <td className="py-3 px-4 text-slate-400">{wc.department}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-300">{wc.capacityHoursPerDay} hrs/day</td>
                      <td className="py-3 px-4 font-mono text-slate-400">₹{wc.hourlyMachineRate}/h / ₹{wc.hourlyLaborRate}/h</td>
                      <td className="py-3 px-4">
                        {wcDowntimes.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold">
                            {wcDowntimes.length} Scheduled ({wcDowntimes.reduce((s, d) => s + d.downtimeHours, 0)}h)
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Shift Structures &amp; Operator Roster
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active working shifts and staff qualification matrix
              </p>
            </div>
            <button
              onClick={() => setShiftModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Shifts &amp; Staff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {shifts.map(s => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-sm">{s.name}</h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {s.code}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Hours: <strong className="text-slate-200">{s.startTime} - {s.endTime}</strong> ({s.netHours}h net)
                </div>
                <div className="text-xs text-slate-400">
                  Target OEE: <strong className="text-emerald-400">{Math.round(s.efficiencyFactor * 100)}%</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Staffed: <strong className="text-indigo-300">{operators.filter(o => o.shiftId === s.id).length} operators</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals & Drawers ────────────────────────────────────── */}
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

      <RescheduleOperationModal
        isOpen={!!rescheduleModalOp}
        onClose={() => setRescheduleModalOp(null)}
        operation={rescheduleModalOp}
        workCenters={workCenters}
        shifts={shifts}
        onReschedule={handleRescheduleOperation}
      />

      <WhatIfSimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
        workCenters={workCenters}
        simulationActive={simulationActive}
        simulationParams={simulationParams}
        onToggleSimulation={handleToggleSimulation}
        onUpdateParams={setSimulationParams}
      />
    </div>
  );
};
