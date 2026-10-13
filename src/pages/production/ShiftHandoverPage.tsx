// src/pages/production/ShiftHandoverPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  Building2,
  User,
  ShieldAlert,
  Flame,
  Gauge,
  Tablet,
  GitBranch,
  FileCheck2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useShiftHandover } from '../../hooks/useShiftHandover';
import { ShiftHandoverRecord, ShiftType, ShiftHandoverStatus } from '../../types/shiftHandover';
import { CreateShiftHandoverModal } from '../../components/handover/CreateShiftHandoverModal';
import { AcknowledgeHandoverModal } from '../../components/handover/AcknowledgeHandoverModal';
import { ShiftHandoverPrintModal } from '../../components/handover/ShiftHandoverPrintModal';

export const ShiftHandoverPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    records,
    selectedHandover,
    setSelectedHandover,
    filter,
    setFilter,
    loading,
    refresh,
    createHandover,
    acknowledgeHandover,
    toggleTask,
    exportCsv
  } = useShiftHandover();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Stats
  const totalHandovers = records.length;
  const pendingAckCount = records.filter(r => r.status === 'submitted_pending_ack').length;
  const acknowledgedCount = records.filter(r => r.status === 'acknowledged').length;
  const totalOpenTasks = records.reduce((acc, r) => acc + r.pendingTasks.filter(t => !t.isCompleted).length, 0);

  const getStatusBadge = (status: ShiftHandoverStatus) => {
    switch (status) {
      case 'acknowledged':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Acknowledged</span>
          </span>
        );
      case 'submitted_pending_ack':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending Ack</span>
          </span>
        );
      case 'flagged_issues':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Issues Flagged</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedHandover) return;
    const csvContent = exportCsv(selectedHandover);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Shift_Handover_${selectedHandover.outgoingShift}_${selectedHandover.handoverDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header & Global Actions ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-100">
                  Shift Handover Module
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Dual Supervisor Handshake
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Digital shift handover notes with open issues, live machine status, open WOs, and receiving shift acknowledgment.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/work-orders')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            <span>Work Orders</span>
          </button>

          <button
            onClick={() => navigate('/time-capture')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 text-xs font-mono transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Time Kiosk</span>
          </button>

          <button
            onClick={() => navigate('/oee')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-800/60 text-xs font-mono transition cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Machine OEE</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Shift Handover</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Logged Handovers</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">{totalHandovers} reports</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Dual signoff logs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Acknowledgment</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{pendingAckCount} awaiting ack</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Incoming shift handshake</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Handshakes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{acknowledgedCount} acknowledged</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Verified walk-throughs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{totalOpenTasks} open items</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Transferred action items</div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by supervisor name, work order, machine code, or notes..."
            value={filter.searchQuery || ''}
            onChange={e => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filter.shiftType}
            onChange={e => setFilter(prev => ({ ...prev, shiftType: e.target.value as ShiftType | 'all' }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="all">All Shifts</option>
            <option value="shift_a">Shift A (Morning)</option>
            <option value="shift_b">Shift B (Afternoon)</option>
            <option value="shift_c">Shift C (Night)</option>
          </select>

          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value as ShiftHandoverStatus | 'all' }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="all">All Handshake Statuses</option>
            <option value="submitted_pending_ack">Pending Acknowledgment</option>
            <option value="acknowledged">Acknowledged</option>
          </select>

          <button
            onClick={() => refresh()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Handovers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Active Handover Selector Chips Carousel ─────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-mono text-[11px] uppercase shrink-0">Selected Report:</span>
        {records.map(r => {
          const isSelected = selectedHandover?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedHandover(r)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{r.outgoingShift.toUpperCase().replace('_', ' ')} &rarr; {r.incomingShift.toUpperCase().replace('_', ' ')}</span>
              <span className="text-[10px] text-slate-500 font-sans">({r.handoverDate})</span>
              <span className={`w-2 h-2 rounded-full ${
                r.status === 'acknowledged' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`} />
            </button>
          );
        })}
      </div>

      {/* ── Selected Handover Dossier Display ───────────────────────── */}
      {selectedHandover ? (
        <div className="space-y-6">
          {/* Main Handover Status Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-100">
                    {selectedHandover.outgoingShiftLabel}
                  </h2>
                  <span className="text-slate-500">&rarr;</span>
                  <h2 className="text-xl font-bold text-slate-300">
                    {selectedHandover.incomingShiftLabel}
                  </h2>
                  {getStatusBadge(selectedHandover.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Plant: {selectedHandover.plantName} &bull; Date: {selectedHandover.handoverDate}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedHandover.status === 'submitted_pending_ack' && (
                  <button
                    onClick={() => setIsAckModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Acknowledge Receiving Shift</span>
                  </button>
                )}

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Print Handover</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Supervisor Status Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Outgoing Supervisor */}
              <div className="p-3.5 rounded-xl border border-indigo-700/40 bg-indigo-950/20 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="text-[10px] text-indigo-400 uppercase font-bold">Outgoing Shift Lead</div>
                  <div className="text-sm font-bold text-slate-100">{selectedHandover.outgoingSupervisorName}</div>
                  <div className="text-slate-400 text-[11px]">Badge: {selectedHandover.outgoingSupervisorBadge}</div>
                  <div className="text-slate-500 text-[10px] pt-1">
                    Submitted: {new Date(selectedHandover.outgoingSubmittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Incoming Supervisor */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                selectedHandover.status === 'acknowledged'
                  ? 'border-teal-700/40 bg-teal-950/20'
                  : 'border-amber-700/40 bg-amber-950/20'
              }`}>
                <div className={`p-2 rounded-lg ${
                  selectedHandover.status === 'acknowledged'
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                    : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className={`text-[10px] uppercase font-bold ${
                    selectedHandover.status === 'acknowledged' ? 'text-teal-400' : 'text-amber-400'
                  }`}>
                    Incoming Shift Lead
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {selectedHandover.incomingSupervisorName || 'Awaiting Receiving Acknowledgment'}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Badge: {selectedHandover.incomingSupervisorBadge || '—'}
                  </div>
                  <div className="text-slate-500 text-[10px] pt-1">
                    {selectedHandover.incomingAcknowledgedAt
                      ? `Acknowledged: ${new Date(selectedHandover.incomingAcknowledgedAt).toLocaleString()}`
                      : 'Pending physical walk-through and signature.'}
                  </div>
                </div>
              </div>
            </div>

            {/* General Handover Notes */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-1">
                Supervisor Shift Directives &amp; Operational Notes
              </span>
              <p className="text-slate-200 leading-relaxed font-sans text-sm">
                &ldquo;{selectedHandover.generalSummaryNotes}&rdquo;
              </p>
            </div>
          </div>

          {/* Safety & Quality Alerts Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Safety &amp; Quality Status</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zero-Harm &bull; Zero-Defect Protocol</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Safety Incidents</span>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedHandover.safetyAndQuality.safetyIncidentsCount} Incidents</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{selectedHandover.safetyAndQuality.safetyObservations || 'All safety guards active.'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Quality Alerts &amp; NCRs</span>
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{selectedHandover.safetyAndQuality.activeNcrCount} Active NCR</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{selectedHandover.safetyAndQuality.qualityAlerts || 'Zero active NCR holds.'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Tooling &amp; Cutters</span>
                <div className="text-amber-400 font-bold">Tool Crib Status</div>
                <div className="text-[11px] text-slate-400 mt-1">{selectedHandover.safetyAndQuality.toolingAlerts || 'Normal wear.'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Material Staging</span>
                <div className="text-cyan-400 font-bold">WIP Staging</div>
                <div className="text-[11px] text-slate-400 mt-1">{selectedHandover.safetyAndQuality.rawMaterialShortages || 'Staged at cells.'}</div>
              </div>
            </div>
          </div>

          {/* Machine Status Summary Grid */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span>Machine Status Summary ({selectedHandover.machinesSummary.length} Stations)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live state, assigned operators, running work orders, and maintenance remarks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedHandover.machinesSummary.map(m => (
                <div
                  key={m.machineId}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                    m.state === 'running' ? 'bg-slate-950/60 border-slate-800' :
                    m.state === 'faulted' ? 'bg-rose-950/30 border-rose-600/50' :
                    m.state === 'setup' ? 'bg-amber-950/20 border-amber-600/40' :
                    'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-cyan-300 text-xs">{m.machineCode}</div>
                      <div className="font-semibold text-slate-200 text-xs truncate max-w-[180px]">{m.machineName}</div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      m.state === 'running' ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40' :
                      m.state === 'faulted' ? 'bg-rose-950 text-rose-300 border-rose-600/40 font-bold' :
                      m.state === 'setup' ? 'bg-amber-950 text-amber-300 border-amber-600/40' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {m.state}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Cell: <span className="text-slate-300">{m.workCenterName}</span></div>
                    <div>Active Job: <span className="text-indigo-300">{m.currentJob || 'None'}</span></div>
                    {m.operatorOnStation && (
                      <div>Operator: <span className="text-slate-300">{m.operatorOnStation}</span></div>
                    )}
                  </div>

                  {m.maintenanceNote && (
                    <div className="text-[11px] p-2 rounded bg-slate-900 border border-slate-800/80 text-slate-300 italic">
                      {m.maintenanceNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Open Work Orders List */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Open Work Orders Transferred to Next Shift ({selectedHandover.openWorkOrders.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track production completion, current active sequence, and supervisor handoff directives.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Work Order #</th>
                    <th className="py-2.5 px-3">Part Description</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Current Operation Station</th>
                    <th className="py-2.5 px-3 text-right">Completion Qty</th>
                    <th className="py-2.5 px-3">Handover Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedHandover.openWorkOrders.map(wo => (
                    <tr key={wo.workOrderId} className="hover:bg-slate-850/40">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                        {wo.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{wo.partName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{wo.partNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          wo.priority === 'urgent' ? 'bg-rose-950 text-rose-300 border-rose-600/40 font-bold' :
                          wo.priority === 'high' ? 'bg-amber-950 text-amber-300 border-amber-600/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        Op {wo.currentOperationSequence}: {wo.currentOperationName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-slate-100">{wo.completedQuantity} / {wo.targetQuantity}</div>
                        <div className="text-[10px] text-slate-400">{wo.progressPercent}% progress</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 italic max-w-xs">
                        {wo.handoverNote || 'Standard run schedule.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Tasks & Action Items */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-teal-400" />
                  <span>Pending Action Items for Incoming Shift ({selectedHandover.pendingTasks.length} Tasks)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on any task checkbox to record live completion by the incoming shift.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {selectedHandover.pendingTasks.map((task, idx) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(selectedHandover.id, task.id, 'Shift Supervisor')}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                    task.isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-teal-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-teal-400 hover:text-teal-300 transition">
                      {task.isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-teal-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <div className={`text-xs font-semibold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.taskDescription}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Station: {task.stationOrCell} &bull; Assigned: {task.assignedRoleOrPerson || 'Incoming Team'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded border uppercase ${
                      task.priority === 'urgent' ? 'bg-rose-950 text-rose-300 border-rose-600/40' :
                      task.priority === 'high' ? 'bg-amber-950 text-amber-300 border-amber-600/40' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.priority}
                    </span>
                    {task.isCompleted && task.completedAt && (
                      <div className="text-teal-400 mt-1">
                        Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receiving Shift Acknowledgment Card */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            selectedHandover.status === 'acknowledged'
              ? 'bg-teal-950/15 border-teal-700/40'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Receiving Shift Dual Signoff Handshake
                </h3>
              </div>
              {getStatusBadge(selectedHandover.status)}
            </div>

            {selectedHandover.status === 'acknowledged' && selectedHandover.receivingChecklist ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950/70 border border-teal-700/30 text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Safety Briefing Confirmed</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/70 border border-teal-700/30 text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Floor Walk-Through Done</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/70 border border-teal-700/30 text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>WIP Staging Verified</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/70 border border-teal-700/30 text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Pending Tasks Accepted</span>
                  </div>
                </div>

                {selectedHandover.receivingChecklist.receivingComments && (
                  <p className="text-xs text-slate-300 italic p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    &ldquo;{selectedHandover.receivingChecklist.receivingComments}&rdquo;
                  </p>
                )}

                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  CRYPTOGRAPHIC HANDSHAKE HASH: {selectedHandover.incomingDigitalSignatureHash}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <p className="text-xs text-slate-200 font-semibold">
                    Incoming shift has not acknowledged this handover yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Execute physical floor walk-through with the outgoing supervisor and confirm acceptance.
                  </p>
                </div>
                <button
                  onClick={() => setIsAckModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition cursor-pointer shrink-0"
                >
                  Acknowledge &amp; Accept Shift Handover
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No shift handovers found.</p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <CreateShiftHandoverModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createHandover(payload);
        }}
      />

      <AcknowledgeHandoverModal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        handover={selectedHandover}
        onAcknowledge={async (params) => {
          if (selectedHandover) {
            await acknowledgeHandover({
              handoverId: selectedHandover.id,
              ...params
            });
          }
        }}
      />

      <ShiftHandoverPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        handover={selectedHandover}
      />
    </div>
  );
};
