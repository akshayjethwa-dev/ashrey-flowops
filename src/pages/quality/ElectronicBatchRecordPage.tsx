// src/pages/quality/ElectronicBatchRecordPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  Search,
  Filter,
  Download,
  Plus,
  Printer,
  Sparkles,
  Lock,
  GitBranch,
  QrCode,
  Calendar,
  Building2,
  User,
  Hash,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { useEDHR } from '../../hooks/useEDHR';
import { EDHRRecord, EDHRReleaseStatus } from '../../types/edhr';
import { SignEDHRModal } from '../../components/edhr/SignEDHRModal';
import { AutoCompileEDHRModal } from '../../components/edhr/AutoCompileEDHRModal';
import { LogDeviationModal } from '../../components/edhr/LogDeviationModal';
import { EDHRPrintExportModal } from '../../components/edhr/EDHRPrintExportModal';

export const ElectronicBatchRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    records,
    selectedDhr,
    setSelectedDhr,
    filter,
    setFilter,
    loading,
    refresh,
    autoCompile,
    signRecord,
    logDeviation,
    resolveDeviation,
    exportCsv,
    exportAuditTrailCsv,
    exportJson
  } = useEDHR();

  // Tab State
  const [activeTab, setActiveTab] = useState<'registry' | 'dossier' | 'audit_trail'>('registry');

  // Modal States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Stats
  const totalCount = records.length;
  const releasedCount = records.filter(r => r.releaseStatus === 'released').length;
  const pendingQaCount = records.filter(r => r.releaseStatus === 'pending_qa_review').length;
  const quarantinedCount = records.filter(r => r.releaseStatus === 'quarantined').length;
  const totalDeviations = records.reduce((acc, r) => acc + r.deviations.length, 0);

  const getStatusBadge = (status: EDHRReleaseStatus) => {
    switch (status) {
      case 'released':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Released</span>
          </span>
        );
      case 'pending_qa_review':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending QA</span>
          </span>
        );
      case 'quarantined':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Quarantined</span>
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

  const handleDownloadAllAuditCsv = () => {
    if (!selectedDhr) return;
    const csvContent = exportAuditTrailCsv(selectedDhr);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FDA_Part11_Audit_Trail_${selectedDhr.dhrNumber}.csv`);
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
            <div className="p-3 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-100">
                  Electronic Batch Record (eDHR / eBR)
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700/50">
                  FDA 21 CFR Part 11 &amp; ISO 13485
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete digital history of every batch automatically compiled: materials, operations, quality checks, electronic signatures, and audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/production-genealogy')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800/60 text-xs font-mono transition cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Genealogy Tree</span>
          </button>

          <button
            onClick={() => navigate('/traceability')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Lot Traceability</span>
          </button>

          <button
            onClick={() => setIsCompileModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Auto-Compile eDHR</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Compiled eDHRs</span>
            <FileCheck2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">{totalCount} dossiers</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Zero paper records</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Released Batches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{releasedCount} released</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Fully e-signed &amp; sealed</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending QA Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{pendingQaCount} in review</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Awaiting QA signoff</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Quarantined / NCR</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1">{quarantinedCount} on hold</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{totalDeviations} tracked deviations</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>21 CFR Part 11 Integrity</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">100% Intact</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">SHA-256 sealed logs</div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by DHR #, Batch #, Work Order, Part, or Customer..."
            value={filter.searchQuery || ''}
            onChange={e => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value as EDHRReleaseStatus | 'all' }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
          >
            <option value="all">All Release Statuses</option>
            <option value="released">Released for Distribution</option>
            <option value="pending_qa_review">Pending QA Review</option>
            <option value="quarantined">Quarantined / Hold</option>
          </select>

          <button
            onClick={() => refresh()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Active DHR Chips Carousel ───────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-mono text-[11px] uppercase shrink-0">Selected Dossier:</span>
        {records.map(r => {
          const isSelected = selectedDhr?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedDhr(r)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition cursor-pointer ${
                isSelected
                  ? 'bg-teal-600/20 border-teal-500 text-teal-200 ring-1 ring-teal-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{r.dhrNumber}</span>
              <span className="text-[10px] text-slate-500 font-sans">({r.batchNumber})</span>
              <span className={`w-2 h-2 rounded-full ${
                r.releaseStatus === 'released' ? 'bg-emerald-400' :
                r.releaseStatus === 'quarantined' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
              }`} />
            </button>
          );
        })}
      </div>

      {/* ── View Switcher Tabs ──────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'registry'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>eDHR Batch Registry ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dossier')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'dossier'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Compiled Dossier Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'audit_trail'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>FDA 21 CFR Part 11 Audit Trail Ledger</span>
        </button>
      </div>

      {/* ── Tab Content Views ───────────────────────────────────────── */}
      {selectedDhr ? (
        <>
          {/* TAB 1: eDHR Batch Registry View */}
          {activeTab === 'registry' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Regulated Electronic Device History Records Registry
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auto-compiled compliance packages with materials, operations, quality checks, and 21 CFR Part 11 signatures.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-mono transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dossier</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">DHR Number</th>
                      <th className="py-2.5 px-3">Batch / Serial</th>
                      <th className="py-2.5 px-3">Work Order</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3 text-center">Pillars Verified</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {records.map(r => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedDhr(r)}
                        className={`hover:bg-slate-850/50 cursor-pointer transition ${
                          selectedDhr?.id === r.id ? 'bg-teal-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-teal-300">
                          {r.dhrNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-cyan-300">
                          {r.batchNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {r.workOrderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-100">{r.partName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.partNumber} ({r.revision})</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {r.regulatoryStandard}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <div className="flex items-center justify-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300" title="Materials">
                              {r.materials.length} Mat
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300" title="Operations">
                              {r.operations.length} Ops
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300" title="QC">
                              {r.qualityInspections.length} QC
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300" title="Signatures">
                              {r.signatures.length} Sig
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(r.releaseStatus)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDhr(r);
                                setIsSignModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-teal-400 transition"
                              title="Sign eDHR (21 CFR Part 11)"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDhr(r);
                                setIsPrintModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
                              title="Print Dossier"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Compiled Dossier Explorer View */}
          {activeTab === 'dossier' && (
            <div className="space-y-6">
              {/* Dossier Action Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-100 font-mono">
                      {selectedDhr.dhrNumber} Dossier Details
                    </h3>
                    {getStatusBadge(selectedDhr.releaseStatus)}
                    <span className="text-xs font-mono text-slate-400">
                      Standard: <strong className="text-slate-200">{selectedDhr.regulatoryStandard}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Part: {selectedDhr.partName} ({selectedDhr.partNumber}) &bull; Batch: {selectedDhr.batchNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsDeviationModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/60 text-xs font-medium transition cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Log NCR Deviation</span>
                  </button>

                  <button
                    onClick={() => setIsSignModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Apply 21 CFR Part 11 Signature</span>
                  </button>

                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pillar 1: Materials BOM & Chemical Heat */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                        1. Bill of Materials &amp; Chemical Heat Trace ({selectedDhr.materials.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">100% MTR Verified</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDhr.materials.map(m => (
                      <div key={m.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>{m.description}</span>
                          <span className="text-emerald-400">{m.consumedQty} {m.unit}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Lot: {m.lotNumber}</span>
                          <span>Heat: {m.heatNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-800/60">
                          <span>Supplier: {m.supplierName}</span>
                          <span className="text-cyan-400">MTR: {m.mtrNumber || 'CoA On File'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pillar 2: Operations Routing Execution */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                        2. Operations Routing ({selectedDhr.operations.length} Stations)
                      </h4>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">Operator &amp; Machine Stamps</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDhr.operations.map(op => (
                      <div key={op.stepId} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>Op {op.sequence}: {op.operationName}</span>
                          <span className="text-cyan-400">{op.actualDurationMinutes} min</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Machine: {op.machineId} ({op.machineName})</span>
                          <span className="text-emerald-300">Op: {op.operatorName} ({op.operatorBadge})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pillar 3: Quality Checks & CMM Metrology */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                        3. Quality Inspections &amp; Metrology ({selectedDhr.qualityInspections.length} Tests)
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Tolerances Passed</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDhr.qualityInspections.map(qc => (
                      <div key={qc.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>Op {qc.operationSequence}: {qc.parameterName}</span>
                          <span className={qc.result === 'pass' ? 'text-emerald-400' : 'text-rose-400'}>
                            {qc.measuredValue} ({qc.result.toUpperCase()})
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Spec: {qc.specification}</span>
                          <span>Gauge: {qc.gaugeCalibrationId || 'Direct'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pillar 4: Electronic Signatures & Approvals */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-400" />
                      <h4 className="text-xs font-bold font-mono text-slate-200 uppercase">
                        4. 21 CFR Part 11 Electronic Signatures ({selectedDhr.signatures.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-teal-400 font-mono">Cryptographically Sealed</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDhr.signatures.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">
                        No electronic signatures executed yet. Click &ldquo;Apply 21 CFR Part 11 Signature&rdquo; to seal.
                      </p>
                    ) : (
                      selectedDhr.signatures.map(sig => (
                        <div key={sig.id} className="p-2.5 rounded-lg bg-teal-950/20 border border-teal-700/30 text-xs font-mono space-y-1">
                          <div className="flex justify-between font-bold text-teal-300">
                            <span>{sig.signerName}</span>
                            <span className="text-[10px] text-teal-400 bg-teal-950 px-1.5 py-0.2 rounded border border-teal-700/40">
                              {sig.intentLabel}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">{sig.signerRole} &bull; {new Date(sig.signedAt).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800">
                            Hash: {sig.cryptographicSignature.substring(0, 32)}...
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FDA 21 CFR Part 11 Immutable Audit Trail */}
          {activeTab === 'audit_trail' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>FDA 21 CFR Part 11 &amp; EU Annex 11 Audit Trail Ledger</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                      Append-Only &bull; Non-Repudiation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tamper-evident chronological audit record of all actions performed on batch {selectedDhr.dhrNumber}.
                  </p>
                </div>

                <button
                  onClick={handleDownloadAllAuditCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Audit Trail CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                      <th className="py-2.5 px-3">User &amp; Role</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Justification</th>
                      <th className="py-2.5 px-3 font-mono text-[9px]">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedDhr.auditTrail.map(aud => (
                      <tr key={aud.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {new Date(aud.timestamp).toISOString()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{aud.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{aud.userRole}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-cyan-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                            {aud.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs">
                          {aud.description}
                        </td>
                        <td className="py-3 px-3 text-slate-400 italic text-[11px]">
                          {aud.justification || '—'}
                        </td>
                        <td className="py-3 px-3 font-mono text-[9px] text-slate-500 max-w-[120px] truncate">
                          {aud.eventHash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No electronic batch records found.</p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <SignEDHRModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        dhr={selectedDhr}
        onSign={async (params) => {
          await signRecord(params);
        }}
      />

      <AutoCompileEDHRModal
        isOpen={isCompileModalOpen}
        onClose={() => setIsCompileModalOpen(false)}
        onCompile={async (params) => {
          await autoCompile(params);
        }}
      />

      <LogDeviationModal
        isOpen={isDeviationModalOpen}
        onClose={() => setIsDeviationModalOpen(false)}
        dhr={selectedDhr}
        onLog={async (deviation) => {
          if (selectedDhr) {
            await logDeviation(selectedDhr.id, deviation);
          }
        }}
      />

      <EDHRPrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        dhr={selectedDhr}
      />
    </div>
  );
};
