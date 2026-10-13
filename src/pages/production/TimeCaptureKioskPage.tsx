// src/pages/production/TimeCaptureKioskPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock,
  ScanLine,
  PlayCircle,
  StopCircle,
  Pause,
  Play,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Percent,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Gauge,
  AlertOctagon,
  Tablet,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { useTimeCapture } from '../../hooks/useTimeCapture';
import { LiveClockStopwatch } from '../../components/time-capture/LiveClockStopwatch';
import { ClockOutConfirmationModal } from '../../components/time-capture/ClockOutConfirmationModal';
import { ScanClockInOutModal } from '../../components/time-capture/ScanClockInOutModal';
import { OperatorBadgePickerModal } from '../../components/time-capture/OperatorBadgePickerModal';
import { OperationTimeLog, TimeLogStatus } from '../../types/timeCapture';
import { exportToCSV } from '../../utils/exportUtils';

export const TimeCaptureKioskPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wall clock time
  const [currentWallTime, setCurrentWallTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWallTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TimeLogStatus | 'all'>('all');

  const {
    logs,
    activeClockings,
    operators,
    currentOperator,
    stats,
    clockIn,
    clockOut,
    pauseClock,
    resumeClock,
    switchOperator
  } = useTimeCapture({
    searchQuery,
    status: statusFilter
  });

  // Modal states
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [stoppingLog, setStoppingLog] = useState<OperationTimeLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStartClockIn = (params: Parameters<typeof clockIn>[0]) => {
    const res = clockIn({
      ...params,
      operatorBadgeNumber: currentOperator.badgeNumber,
      operatorName: currentOperator.name
    });
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleConfirmClockOut = (params: {
    unitsProduced: number;
    unitsScrapped: number;
    scrapReason?: string;
    notes?: string;
  }) => {
    if (!stoppingLog) return;
    const res = clockOut(stoppingLog.id, params);
    if (res.success) {
      showToast(res.message);
    }
    setStoppingLog(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Work Order',
      'Part',
      'Sequence',
      'Operation',
      'Work Center',
      'Operator',
      'Status',
      'Started At',
      'Stopped At',
      'Standard Time (min)',
      'Actual Time (min)',
      'Variance (min)',
      'Efficiency (%)',
      'Good Units',
      'Scrap Units',
      'Clock Method'
    ];

    const rows = logs.map(l => [
      l.id,
      l.workOrderNumber,
      `${l.partName} (${l.partNumber})`,
      l.operationSequence,
      l.operationName,
      `${l.workCenterName} (${l.workCenterCode})`,
      `${l.operatorName} (${l.operatorBadgeNumber})`,
      l.status.toUpperCase(),
      l.startedAt,
      l.stoppedAt || 'Running',
      l.standardTimeMinutes,
      l.actualTimeMinutes || 'Running',
      l.varianceMinutes !== undefined ? l.varianceMinutes : '—',
      l.efficiencyPercent ? `${l.efficiencyPercent}%` : '—',
      l.unitsProduced || 0,
      l.unitsScrapped || 0,
      l.clockInMethod
    ]);

    exportToCSV(headers, rows, `Operator_Time_Capture_Logs_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 space-y-6 font-sans select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/80 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Kiosk Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wider uppercase font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded">
              Shopfloor Kiosk Terminal
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">
              Live Factory Clock: <strong className="text-white font-mono text-sm">{currentWallTime}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Clock className="text-cyan-400" />
            <span>Operator Start/Stop Time Capture</span>
          </h1>
        </div>

        {/* Operator Identification Badge (Acceptance Criteria #4) */}
        <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700/80 rounded-2xl p-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
            {currentOperator.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{currentOperator.name}</span>
              <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                {currentOperator.badgeNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{currentOperator.role}</div>
          </div>
          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="ml-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg transition"
            title="Switch operator profile or scan another employee badge"
          >
            Switch Badge
          </button>
          <button
            onClick={() => navigate('/production-genealogy')}
            className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 text-indigo-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            title="Inspect Unit & Batch Production Genealogy"
          >
            <GitBranch size={14} className="text-indigo-400" />
            <span>Genealogy</span>
          </button>
        </div>
      </header>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clocked In */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Running Operations</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {stats.activeClockedInCount}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            Live stopwatches currently ticking
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Completed Operations</span>
            <CheckCircle2 size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">
            {stats.completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.totalActualMinutes} min actual cycle logged
          </div>
        </div>

        {/* Overall Shop Efficiency */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Cycle Efficiency</span>
            <Gauge size={14} className="text-amber-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-mono font-black ${
            stats.overallEfficiencyPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {stats.overallEfficiencyPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard vs actual benchmark ratio
          </div>
        </div>

        {/* Net Time Variance */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Net Time Variance</span>
            {stats.netVarianceMinutes <= 0 ? (
              <TrendingDown size={14} className="text-emerald-400" />
            ) : (
              <TrendingUp size={14} className="text-rose-400" />
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-mono font-black ${
            stats.netVarianceMinutes <= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {stats.netVarianceMinutes <= 0 ? `-${Math.abs(stats.netVarianceMinutes)}m` : `+${stats.netVarianceMinutes}m`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.netVarianceMinutes <= 0 ? 'Total cycle time saved ahead of std' : 'Total cycle time overrun'}
          </div>
        </div>
      </div>

      {/* Prominent Scan & Clock Actions Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Big Scan Button */}
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-xl flex items-center gap-2.5 shadow-lg transition"
          >
            <ScanLine size={20} />
            <span>Scan WO + Operation to Start / Stop</span>
          </button>

          {/* Quick Touchscreen Clock In */}
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-4 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <Tablet size={16} />
            <span>Touchscreen Clock-In</span>
          </button>
        </div>

        {/* Shortcuts */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate('/work-instructions')}
            className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1.5"
          >
            <span>Open Digital SOP</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/oee')}
            className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg transition flex items-center gap-1.5 font-bold"
            title="Log Machine Stop or View Downtime Pareto Analysis"
          >
            <AlertOctagon size={14} className="text-rose-400" />
            <span>Machine Downtime & OEE</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Logs CSV</span>
          </button>
        </div>
      </div>

      {/* Section 1: Active Running Operations (Live Stopwatches) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              Live Active Clockings ({activeClockings.length})
            </h2>
            <span className="text-xs text-slate-400">· Real-time stopwatch cycle timers</span>
          </div>
        </div>

        {activeClockings.length === 0 ? (
          <div className="p-8 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl text-center space-y-2">
            <Clock size={28} className="text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">
              No operations currently clocked in
            </div>
            <p className="text-xs text-slate-500">
              Click &quot;Scan WO + Operation&quot; to clock in and capture cycle time automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClockings.map(log => (
              <LiveClockStopwatch
                key={log.id}
                log={log}
                onClockOut={l => setStoppingLog(l)}
                onPause={l => pauseClock(l.id, 'Operator pause')}
                onResume={l => resumeClock(l.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Completed Operations Audit Log (Actual vs Standard History) */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Time Capture Audit History</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                {logs.length} Total Logs
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Actual vs Standard duration comparison, variance minutes, and operator attribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-xs">
              {(['all', 'completed', 'running', 'paused'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md capitalize transition ${
                    statusFilter === st
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search WO, op, operator..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">WO Number</th>
                <th className="py-3 px-3">Operation Stage</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Work Center</th>
                <th className="py-3 px-3 text-right">Standard</th>
                <th className="py-3 px-3 text-right">Actual</th>
                <th className="py-3 px-3 text-right">Variance</th>
                <th className="py-3 px-3 text-right">Efficiency</th>
                <th className="py-3 px-3 text-center">Output</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-sans">
              {logs.map(log => {
                const isCompleted = log.status === 'completed';
                const variance = log.varianceMinutes;
                const isAhead = variance !== undefined && variance <= 0;

                return (
                  <tr key={log.id} className="hover:bg-slate-750 transition-colors">
                    {/* WO */}
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                      {log.workOrderNumber}
                    </td>

                    {/* Operation */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{log.operationName}</div>
                      <div className="text-[11px] text-slate-400">{log.partName}</div>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{log.operatorName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{log.operatorBadgeNumber}</div>
                    </td>

                    {/* Work Center */}
                    <td className="py-3 px-3 text-slate-300">
                      <div>{log.workCenterCode}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{log.workCenterName}</div>
                    </td>

                    {/* Standard Time */}
                    <td className="py-3 px-3 text-right font-mono text-slate-400 font-medium">
                      {log.standardTimeMinutes}m
                    </td>

                    {/* Actual Time */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {log.actualTimeMinutes !== undefined ? `${log.actualTimeMinutes}m` : 'In progress'}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-3 text-right font-mono">
                      {variance !== undefined ? (
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          isAhead ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isAhead ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          <span>{isAhead ? `-${Math.abs(variance)}m` : `+${variance}m`}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Efficiency % */}
                    <td className="py-3 px-3 text-right font-mono">
                      {log.efficiencyPercent ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.efficiencyPercent >= 100
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {log.efficiencyPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Output */}
                    <td className="py-3 px-3 text-center font-mono">
                      {isCompleted ? (
                        <div className="text-[11px]">
                          <span className="text-emerald-400 font-bold">{log.unitsProduced || 0} good</span>
                          {log.unitsScrapped ? (
                            <span className="text-rose-400 ml-1">({log.unitsScrapped} scrap)</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Active</span>
                      )}
                    </td>

                    {/* Status / Action */}
                    <td className="py-3 px-3">
                      {log.status === 'running' ? (
                        <button
                          onClick={() => setStoppingLog(log)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <StopCircle size={12} />
                          <span>Stop</span>
                        </button>
                      ) : log.status === 'paused' ? (
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          PAUSED
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          COMPLETED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Scan to Start / Stop */}
      <ScanClockInOutModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        activeOperator={currentOperator}
        onClockInSubmit={handleStartClockIn}
        onClockOutTrigger={log => setStoppingLog(log)}
      />

      {/* Modal: Clock Out Confirmation & Actual vs Standard Analysis */}
      {stoppingLog && (
        <ClockOutConfirmationModal
          log={stoppingLog}
          onConfirm={handleConfirmClockOut}
          onCancel={() => setStoppingLog(null)}
        />
      )}

      {/* Modal: Operator Badge Switcher */}
      <OperatorBadgePickerModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        operators={operators}
        currentOperator={currentOperator}
        onSelectOperator={op => {
          switchOperator(op);
          showToast(`Active operator switched to ${op.name} (${op.badgeNumber})`);
        }}
      />
    </div>
  );
};
