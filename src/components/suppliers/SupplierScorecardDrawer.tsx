// src/components/suppliers/SupplierScorecardDrawer.tsx

import React, { useState } from 'react';
import {
  X,
  Award,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Printer,
  Edit,
  Plus,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Truck
} from 'lucide-react';
import {
  SupplierWithMetrics,
  SupplierIncident,
  SupplierTier
} from '../../types/supplierScorecard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithMetrics | null;
  onEditSupplier: (supplier: SupplierWithMetrics) => void;
  onOpenPrintModal: (supplier: SupplierWithMetrics) => void;
  onLogIncident: (incident: Omit<SupplierIncident, 'id'>) => Promise<any>;
  onUpdateCapa: (
    incidentId: string,
    capaStatus: SupplierIncident['capaStatus'],
    capaDoc?: string
  ) => Promise<any>;
}

export const SupplierScorecardDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  supplier,
  onEditSupplier,
  onOpenPrintModal,
  onLogIncident,
  onUpdateCapa
}) => {
  if (!isOpen || !supplier) return null;

  const [activeTab, setActiveTab] = useState<'scorecard' | 'trends' | 'incidents' | 'commercial'>('scorecard');
  const [incidentFormOpen, setIncidentFormOpen] = useState(false);

  // New Incident state
  const [incType, setIncType] = useState<SupplierIncident['type']>('quality_defect');
  const [incSeverity, setIncSeverity] = useState<SupplierIncident['severity']>('high');
  const [incPoNumber, setIncPoNumber] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incRootCause, setIncRootCause] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getTierBadge = (tier: SupplierTier) => {
    switch (tier) {
      case 'tier_1':
        return {
          label: 'Tier 1 — Platinum Partner',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          desc: 'Score ≥ 90% • Preferred primary allocation'
        };
      case 'tier_2':
        return {
          label: 'Tier 2 — Gold Approved',
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
          desc: 'Score 80–89% • Standard AVL vendor'
        };
      case 'tier_3':
        return {
          label: 'Tier 3 — Silver Conditional',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          desc: 'Score 70–79% • Requires manager PO sign-off'
        };
      case 'tier_4':
        return {
          label: 'Tier 4 — Bronze At-Risk',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          desc: 'Score < 70% • Under CAPA probation'
        };
    }
  };

  const tierInfo = getTierBadge(supplier.metrics.tier);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim()) return;

    try {
      setSubmittingIncident(true);
      await onLogIncident({
        supplierId: supplier.id,
        type: incType,
        severity: incSeverity,
        date: new Date().toISOString(),
        poNumber: incPoNumber.trim() || undefined,
        description: incDesc.trim(),
        rootCause: incRootCause.trim() || undefined,
        capaStatus: 'open',
        loggedBy: 'Procurement Manager'
      });
      setIncidentFormOpen(false);
      setIncDesc('');
      setIncRootCause('');
      setIncPoNumber('');
    } finally {
      setSubmittingIncident(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-700 text-slate-100 h-full flex flex-col shadow-2xl animate-fade-in overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {supplier.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${tierInfo.bg}`}>
                  {tierInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Code: {supplier.code}</span>
                <span>•</span>
                <span>Rank #{supplier.metrics.rank} of {supplier.metrics.totalSuppliersInRank}</span>
                <span>•</span>
                <span>GSTIN: {supplier.gstin}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintModal(supplier)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print Official Scorecard Audit Report"
            >
              <Printer className="h-4 w-4" />
              Print Scorecard
            </button>
            <button
              onClick={() => onEditSupplier(supplier)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Edit Supplier Master Data"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/60 flex gap-2 overflow-x-auto text-xs font-mono font-bold uppercase">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scorecard'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Performance Scorecard
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trends'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            6-Month Trends
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Incident Log & CAPA ({supplier.metrics.recentIncidents.length})
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commercial'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Master & Terms
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── TAB 1: PERFORMANCE SCORECARD ─────────────────────── */}
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              
              {/* Composite Score Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Composite Supplier Performance Index
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <h3 className="text-4xl font-black text-white font-mono">
                      {supplier.metrics.compositeScore}
                      <span className="text-xl text-slate-500 font-normal"> / 100</span>
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${tierInfo.bg}`}>
                      Rank #{supplier.metrics.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Weighted: 40% OTD + 40% Quality + 15% Responsiveness + 5% Price Stability
                  </p>
                </div>

                {/* Donut / Progress Meter visual */}
                <div className="relative h-24 w-24 shrink-0 flex items-center justify-center bg-slate-950 rounded-full border-4 border-indigo-500/30">
                  <span className="text-2xl font-black font-mono text-indigo-400">
                    {supplier.metrics.compositeScore}%
                  </span>
                </div>
              </div>

              {/* 4 Core Dimensions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. On-Time Delivery (OTD %) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-sky-400" />
                      On-Time Delivery (OTD)
                    </span>
                    <span className="text-lg font-black font-mono text-sky-400">
                      {supplier.metrics.onTimeDeliveryRatePct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${supplier.metrics.onTimeDeliveryRatePct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[11px]">Avg Delay:</span>{' '}
                      <span className="font-mono font-bold text-white">{supplier.metrics.avgDelayDays} days</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Agreed Lead Time:</span>{' '}
                      <span className="font-mono font-bold text-white">{supplier.leadTimeDays} days</span>
                    </div>
                  </div>
                </div>

                {/* 2. Quality Acceptance Rate (QAR %) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Quality Acceptance Rate
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {supplier.metrics.qualityAcceptanceRatePct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${supplier.metrics.qualityAcceptanceRatePct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[11px]">Defect Rate:</span>{' '}
                      <span className="font-mono font-bold text-white">{supplier.metrics.ppmDefectRate} PPM</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Dock Rejections:</span>{' '}
                      <span className="font-mono font-bold text-white">
                        {supplier.metrics.recentIncidents.filter(i => i.type === 'quality_defect').length} lots
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Responsiveness SLA */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Responsiveness SLA
                    </span>
                    <span className="text-lg font-black font-mono text-indigo-400">
                      {supplier.metrics.responsivenessScorePct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${supplier.metrics.responsivenessScorePct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[11px]">PO Ack Time:</span>{' '}
                      <span className="font-mono font-bold text-white">≤ 4 Hours</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">RFQ Turnaround:</span>{' '}
                      <span className="font-mono font-bold text-white">24 Hours SLA</span>
                    </div>
                  </div>
                </div>

                {/* 4. Price Stability & Variance */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                      Price Stability Index
                    </span>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {Math.max(0, 100 - (supplier.metrics.priceVariancePct * 10))}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(0, 100 - (supplier.metrics.priceVariancePct * 10))}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-850">
                    <div>
                      <span className="text-slate-500 text-[11px]">Quote Variance:</span>{' '}
                      <span className="font-mono font-bold text-white">±{supplier.metrics.priceVariancePct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Total Fulfilled:</span>{' '}
                      <span className="font-mono font-bold text-white">{formatCurrency(supplier.metrics.totalSpend)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sourcing Recommendation Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Procurement Sourcing Recommendation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {supplier.metrics.compositeScore >= 90
                    ? `Supplier maintains top-tier performance on the Approved Vendor List. High reliability across both delivery adherence (${supplier.metrics.onTimeDeliveryRatePct}%) and incoming dock quality (${supplier.metrics.qualityAcceptanceRatePct}%). Recommended for automated reorder PO routing and volume contracts.`
                    : supplier.metrics.compositeScore >= 80
                    ? `Supplier meets standard AVL criteria with strong manufacturing quality. Delivery transit should be monitored to reduce delay variance before peak seasons.`
                    : supplier.metrics.compositeScore >= 70
                    ? `Supplier is under conditional status. 100% incoming dock sampling inspection required. Manual procurement manager approval mandated on all purchase orders.`
                    : `CRITICAL: Supplier performance is below acceptable thresholds. Corrective Action Plan (CAPA) is active. New purchase orders restricted until audit clearance.`}
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 2: 6-MONTH TRENDS ────────────────────────────── */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">6-Month Rolling Performance History</h3>
                  <p className="text-xs text-slate-400">Monthly OTD, quality inspection pass rate, and spend</p>
                </div>
              </div>

              <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4 text-right">Orders Fulfilled</th>
                      <th className="py-3 px-4 text-right">OTD Rate</th>
                      <th className="py-3 px-4 text-right">Quality Rate</th>
                      <th className="py-3 px-4 text-right">PPM Defect</th>
                      <th className="py-3 px-4 text-right">Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono">
                    {supplier.metrics.monthlyTrends.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-900/60">
                        <td className="py-3 px-4 font-bold text-white">{m.monthLabel}</td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {m.ordersCount} ({m.deliveredOnTimeCount} on-time)
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.otdRatePct >= 95 ? 'bg-emerald-500/20 text-emerald-300' :
                            m.otdRatePct >= 85 ? 'bg-indigo-500/20 text-indigo-300' :
                            'bg-rose-500/20 text-rose-300'
                          }`}>
                            {m.otdRatePct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.qualityAcceptancePct >= 98 ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {m.qualityAcceptancePct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">{m.ppmDefectRate}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatCurrency(m.spendAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: INCIDENTS & CAPA ──────────────────────────── */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Corrective & Preventive Action (CAPA) Log</h3>
                  <p className="text-xs text-slate-400">Quality non-conformances, delayed deliveries, and 8D reports</p>
                </div>
                <button
                  onClick={() => setIncidentFormOpen(!incidentFormOpen)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Incident
                </button>
              </div>

              {/* Quick Incident Form */}
              {incidentFormOpen && (
                <form
                  onSubmit={handleCreateIncident}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-in text-xs"
                >
                  <h4 className="font-bold text-white flex items-center gap-1.5 font-mono uppercase text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Record Quality / Delivery Deviation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 text-[11px]">Deviation Type</label>
                      <select
                        value={incType}
                        onChange={e => setIncType(e.target.value as any)}
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                      >
                        <option value="quality_defect">Quality Defect / Spec Out</option>
                        <option value="delivery_delay">Delivery Delay Past ETA</option>
                        <option value="unresponsive_sla">Unresponsive SLA Breach</option>
                        <option value="packaging_damage">Damaged Packaging / Dock</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px]">Severity</label>
                      <select
                        value={incSeverity}
                        onChange={e => setIncSeverity(e.target.value as any)}
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                      >
                        <option value="critical">Critical (Line Stoppage)</option>
                        <option value="high">High (Quarantine / Rework)</option>
                        <option value="medium">Medium (Moderate Delay)</option>
                        <option value="low">Low (Minor Deviation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px]">PO Reference #</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-2026-902"
                        value={incPoNumber}
                        onChange={e => setIncPoNumber(e.target.value)}
                        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                      >
                      </input>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px]">Incident Description *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Describe the defect, measurement out-of-spec, or delay impact..."
                      value={incDesc}
                      onChange={e => setIncDesc(e.target.value)}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIncidentFormOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingIncident}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono"
                    >
                      {submittingIncident ? 'Saving...' : 'Submit Incident'}
                    </button>
                  </div>
                </form>
              )}

              {/* Incidents List */}
              {supplier.metrics.recentIncidents.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs font-mono">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  Zero recorded quality or delivery deviations. Pristine compliance history!
                </div>
              ) : (
                <div className="space-y-3">
                  {supplier.metrics.recentIncidents.map(inc => (
                    <div
                      key={inc.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              inc.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : inc.severity === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="font-bold text-white capitalize">
                            {inc.type.replace('_', ' ')}
                          </span>
                          {inc.poNumber && (
                            <span className="font-mono text-slate-400 text-[11px]">
                              PO: {inc.poNumber}
                            </span>
                          )}
                        </div>

                        {/* CAPA Status Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[11px]">CAPA:</span>
                          <select
                            value={inc.capaStatus}
                            onChange={e =>
                              onUpdateCapa(
                                inc.id,
                                e.target.value as SupplierIncident['capaStatus']
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border cursor-pointer ${
                              inc.capaStatus === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : inc.capaStatus === 'capa_submitted'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <option value="open">Open</option>
                            <option value="under_investigation">Under Investigation</option>
                            <option value="capa_submitted">8D CAPA Submitted</option>
                            <option value="resolved">Resolved & Closed</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-slate-300">{inc.description}</p>
                      {inc.rootCause && (
                        <p className="text-slate-400 text-[11px] italic">
                          Root cause: {inc.rootCause}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-850 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>Logged: {new Date(inc.date).toLocaleDateString('en-IN')} by {inc.loggedBy}</span>
                        {inc.capaDocumentRef && (
                          <span className="text-indigo-400 font-bold">Doc Ref: {inc.capaDocumentRef}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: COMMERCIAL & MASTER DATA ──────────────────── */}
          {activeTab === 'commercial' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white font-mono uppercase text-xs">Contracted Commercial Terms</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Payment Terms:</span>
                    <p className="font-bold text-white mt-0.5">{supplier.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Terms:</span>
                    <p className="font-bold text-white mt-0.5">{supplier.deliveryTerms}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominal Lead Time:</span>
                    <p className="font-bold text-white mt-0.5">{supplier.leadTimeDays} Calendar Days</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Servicing Plants:</span>
                    <p className="font-bold text-white mt-0.5">{supplier.primaryPlants.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white font-mono uppercase text-xs">Quality Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white font-mono uppercase text-xs">Registered Facility Address</h3>
                <p className="text-slate-300">
                  {supplier.address.street}, {supplier.address.city}, {supplier.address.state} — {supplier.address.pinCode}, {supplier.address.country}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
