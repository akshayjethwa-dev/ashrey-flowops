// src/pages/quality/QualityHoldsPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Printer,
  FileCheck2,
  RotateCcw,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building2,
  Award,
  Hash
} from 'lucide-react';
import { useQualityHolds } from '../../hooks/useQualityHolds';
import {
  QualityHoldRecord,
  QualityHoldStatus,
  QualityHoldSeverity,
  QualityHoldReasonCategory,
  QualityHoldReleaseWorkflow
} from '../../types/qualityHold';
import { QualityHoldBadge } from '../../components/quality-holds/QualityHoldBadge';
import { PlaceQualityHoldModal } from '../../components/quality-holds/PlaceQualityHoldModal';
import { ReleaseQualityHoldModal } from '../../components/quality-holds/ReleaseQualityHoldModal';
import { QualityHoldDetailsModal } from '../../components/quality-holds/QualityHoldDetailsModal';
import { PrintHoldTagModal } from '../../components/quality-holds/PrintHoldTagModal';

export const QualityHoldsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    holds,
    kpis,
    filters,
    setFilters,
    loading,
    refresh,
    placeHold,
    releaseHold,
    exportCsv
  } = useQualityHolds();

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'active_hold' | 'released' | 'quarantined'>('active_hold');

  // Modal States
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [selectedHoldForRelease, setSelectedHoldForRelease] = useState<QualityHoldRecord | null>(null);
  const [selectedHoldForDetails, setSelectedHoldForDetails] = useState<QualityHoldRecord | null>(null);
  const [selectedHoldForPrint, setSelectedHoldForPrint] = useState<QualityHoldRecord | null>(null);

  const handleTabChange = (tab: 'all' | 'active_hold' | 'released' | 'quarantined') => {
    setActiveTab(tab);
    setFilters(prev => ({
      ...prev,
      status: tab === 'all' ? 'all' : tab
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, search: val }));
  };

  const handleSeverityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as QualityHoldSeverity | 'all';
    setFilters(prev => ({ ...prev, severity: val }));
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, reasonCategory: val === 'all' ? undefined : val }));
  };

  const formatAging = (placedAt: string) => {
    const diffMs = Date.now() - new Date(placedAt).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Top Header & Accreditations ───────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-100">
                  Quality Holds &amp; Dispatch Quarantine
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60 font-bold">
                  ISO 9001:2015 §8.7
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  IATF 16949 Control of Nonconforming Outputs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Flag non-conforming batches &amp; work orders, enforce zero-defect dispatch lockouts, and manage formal Quality Authority release workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/fqc')}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition"
            title="Jump to Final Quality Control"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>FQC Desk</span>
          </button>
          <button
            onClick={() => navigate('/ncr')}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition"
            title="Jump to NCR & CAPA"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>NCR &amp; CAPA</span>
          </button>
          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsPlaceModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase font-extrabold tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Place Quality Hold</span>
          </button>
        </div>
      </div>

      {/* ── KPI Overview Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-300 font-bold font-mono">
            <span>ACTIVE HOLDS</span>
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {kpis.activeHolds}
          </div>
          <div className="text-[10px] text-rose-300/80 font-mono">
            {kpis.criticalActiveCount} critical priority
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium font-mono">
            <span>DISPATCH BLOCKED</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {kpis.activeHolds}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Logistics Release Gate Locked
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium font-mono">
            <span>AVG HOLD AGING</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-300">
            {kpis.avgAgingHours}h
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Active containment duration
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium font-mono">
            <span>RELEASED THIS MONTH</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {kpis.releasedHolds}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            Authorized by Quality Authority
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium font-mono">
            <span>HARD QUARANTINED</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            {kpis.quarantinedHolds}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            MRB Cage / Metal Scrap
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Controls ─────────────────────────────────── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 w-fit">
            {[
              { id: 'active_hold', label: 'Active Holds (Blocked)', count: kpis.activeHolds, color: 'text-rose-400' },
              { id: 'all', label: 'All Records', count: kpis.totalHolds, color: 'text-slate-300' },
              { id: 'released', label: 'Released', count: kpis.releasedHolds, color: 'text-emerald-400' },
              { id: 'quarantined', label: 'Quarantined / Scrapped', count: kpis.quarantinedHolds, color: 'text-purple-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 font-bold ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search WO#, Batch#, Part SKU, Hold ID, Customer..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 font-sans"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] shrink-0">Severity:</span>
            <select
              value={filters.severity || 'all'}
              onChange={handleSeverityFilter}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="moderate">Moderate</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] shrink-0">Reason Category:</span>
            <select
              value={filters.reasonCategory || 'all'}
              onChange={handleCategoryFilter}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            >
              <option value="all">All Categories</option>
              <option value="dimensional_deviation">Dimensional Deviation</option>
              <option value="inspection_failure">Inspection Failure</option>
              <option value="material_chemistry">Material Chemistry</option>
              <option value="visual_defect">Visual / Surface Defect</option>
              <option value="surface_finish">Surface Finish</option>
              <option value="expired_gage_calibration">Expired Gage Calibration</option>
              <option value="open_ncr_capa">Open NCR / CAPA</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={refresh}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Quality Holds Master Table ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Hold ID &amp; Status</th>
                <th className="py-3 px-4">Target WO / Batch</th>
                <th className="py-3 px-4">Part &amp; Customer</th>
                <th className="py-3 px-4">Quarantined Qty</th>
                <th className="py-3 px-4">Reason &amp; Containment</th>
                <th className="py-3 px-4">Aging &amp; Flagged By</th>
                <th className="py-3 px-4 text-center">Dispatch Gate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {holds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-400">No Quality Holds Found</p>
                    <p className="text-[11px] text-slate-500 mt-1">All batches and work orders are conforming, or adjust active filters.</p>
                  </td>
                </tr>
              ) : (
                holds.map(hold => {
                  const isBlocked = hold.status === 'active_hold';
                  return (
                    <tr
                      key={hold.id}
                      className={`hover:bg-slate-850/60 transition ${
                        isBlocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Hold ID & Status Badge */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono font-bold text-slate-200">
                            {hold.id}
                          </span>
                          <QualityHoldBadge
                            status={hold.status}
                            severity={hold.severity}
                            size="sm"
                          />
                        </div>
                      </td>

                      {/* Target Number */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{hold.targetNumber}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {hold.targetType}
                            </span>
                          </div>
                          {hold.salesOrderNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              SO: {hold.salesOrderNumber}
                            </div>
                          )}
                          {hold.batchNumber && hold.targetType !== 'batch' && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Batch: {hold.batchNumber}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Part & Customer */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 truncate" title={hold.partName}>
                            {hold.partName}
                          </div>
                          {hold.partCode && (
                            <div className="text-[10px] font-mono text-slate-400">
                              SKU: {hold.partCode}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 truncate">
                            {hold.customerName}
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-200">
                          {hold.quantity} <span className="text-xs text-slate-400 font-normal">{hold.unit}</span>
                        </div>
                      </td>

                      {/* Reason & Location */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-200 line-clamp-1" title={hold.holdReason}>
                            {hold.holdReason}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-rose-300/80 font-mono">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{hold.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* Aging & Flagged By */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatAging(hold.placedAt)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {hold.placedBy}
                          </div>
                        </div>
                      </td>

                      {/* Dispatch Gate Lock Status */}
                      <td className="py-3 px-4 text-center">
                        {isBlocked ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-600/60 font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            <span>LOCKED</span>
                          </div>
                        ) : hold.status === 'released' ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>RELEASED</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950/80 text-red-300 border border-red-700/60 font-mono text-[10px] font-bold uppercase tracking-wider">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            <span>SCRAP</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBlocked && (
                            <button
                              onClick={() => setSelectedHoldForRelease(hold)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 shadow-sm transition"
                              title="Authorized Quality Release Workflow"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Release</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedHoldForDetails(hold)}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-mono text-[10px] transition"
                            title="View Full Dossier & Audit Log"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => setSelectedHoldForPrint(hold)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 transition"
                            title="Print Red Quarantine Tag"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <PlaceQualityHoldModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSubmit={params => {
          placeHold(params);
        }}
      />

      <ReleaseQualityHoldModal
        isOpen={Boolean(selectedHoldForRelease)}
        hold={selectedHoldForRelease}
        onClose={() => setSelectedHoldForRelease(null)}
        onRelease={(holdId, workflow) => {
          releaseHold(holdId, workflow);
          setSelectedHoldForRelease(null);
        }}
      />

      <QualityHoldDetailsModal
        isOpen={Boolean(selectedHoldForDetails)}
        hold={selectedHoldForDetails}
        onClose={() => setSelectedHoldForDetails(null)}
        onOpenReleaseModal={hold => {
          setSelectedHoldForDetails(null);
          setSelectedHoldForRelease(hold);
        }}
        onOpenPrintModal={hold => {
          setSelectedHoldForDetails(null);
          setSelectedHoldForPrint(hold);
        }}
      />

      <PrintHoldTagModal
        isOpen={Boolean(selectedHoldForPrint)}
        hold={selectedHoldForPrint}
        onClose={() => setSelectedHoldForPrint(null)}
      />
    </div>
  );
};
