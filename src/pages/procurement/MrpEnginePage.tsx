// src/pages/procurement/MrpEnginePage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Play,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Building2,
  Boxes,
  Truck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  ChevronRight,
  Check,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { useMrpEngine } from '../../hooks/useMrpEngine';
import { MrpHorizon, MrpRecommendationUrgency, MrpPurchaseRecommendation } from '../../types/mrp';
import { MrpRunModal } from '../../components/mrp/MrpRunModal';
import { ConvertToPoModal } from '../../components/mrp/ConvertToPoModal';
import { MrpScheduleModal } from '../../components/mrp/MrpScheduleModal';
import { MrpTimelineDrawer } from '../../components/mrp/MrpTimelineDrawer';

export const MrpEnginePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { plants = [] } = usePlants(tenant?.id);

  const {
    recommendations,
    allRecommendations,
    runs,
    latestRun,
    scheduleConfig,
    rules,
    filters,
    setFilters,
    loading,
    submitting,
    kpis,
    refresh,
    executeMrpRun,
    convertToPo,
    dismissRecommendation,
    updateScheduleConfig,
    updateSafetyRules
  } = useMrpEngine();

  // Active page tab
  const [activeTab, setActiveTab] = useState<'recommendations' | 'rules' | 'history'>('recommendations');

  // Modal states
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [convertToPoModalOpen, setConvertToPoModalOpen] = useState(false);
  const [selectedRecForPo, setSelectedRecForPo] = useState<MrpPurchaseRecommendation | null>(null);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [selectedRecForTimeline, setSelectedRecForTimeline] = useState<MrpPurchaseRecommendation | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 select-none font-sans text-slate-800">
      {/* ── 1. Page Header & Actions ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold tracking-wider">
              Procurement & Supply Chain
            </span>
            <span className="text-xs font-mono uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {scheduleConfig?.enabled ? `Auto Schedule: Active (${scheduleConfig.timeOfDay})` : 'Auto Schedule: Paused'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-indigo-600" />
            Automated MRP Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Time-phased material requirements planning, lead-time explosion, and purchase order recommendations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => navigate('/purchase-orders')}
            id="mrp-po-desk-btn"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Open Purchase Orders Management Desk"
          >
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Purchase Orders Desk
          </button>

          <button
            onClick={() => setScheduleModalOpen(true)}
            id="mrp-schedule-btn"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Configure automated scheduled MRP runs"
          >
            <Clock className="h-4 w-4 text-indigo-600" />
            Schedule Runs
          </button>

          <button
            onClick={() => setRunModalOpen(true)}
            id="mrp-run-btn"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase py-2.5 px-4 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            title="Trigger manual MRP calculation"
          >
            <Play className="h-4 w-4 fill-white" />
            Run MRP Calculation
          </button>
        </div>
      </div>

      {/* ── 2. KPI Scorecards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Recommended Purchase Commitment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Recommended Purchase Spend
            </p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(kpis.totalRecommendedSpend)}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Across {kpis.pendingRecommendationsCount} pending purchase lines
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Critical Stockout Risks (Negative Slack) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-bold">
              Critical Stockout Risks
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-rose-600 font-mono">
                {kpis.criticalShortagesCount}
              </h3>
              <span className="text-xs text-rose-700 font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                Negative Slack
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Order release overdue vs lead time
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: High Urgency Orders (Due in ≤ 3 Days) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
              High Urgency (Next 3 Days)
            </p>
            <h3 className="text-2xl font-black text-amber-600 font-mono mt-1">
              {kpis.highUrgencyCount} Orders
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Must release PO this week
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Converted POs & Run Engine Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
              Converted to Active POs
            </p>
            <h3 className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {kpis.convertedToPoCount} Orders
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {latestRun ? `Last run: ${latestRun.runNumber}` : 'Ready for calculation'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── 3. Horizon Switcher & Filter Bar ──────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'recommendations'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="h-4 w-4 text-sky-400" />
            Purchase Recommendations
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-500 text-white">
              {recommendations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Safety Stock & Lead Times ({rules.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            MRP Run History ({runs.length})
          </button>
        </div>

        {/* Scope Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Horizon Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-mono">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Horizon:</span>
            {([7, 14, 30, 60] as MrpHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setFilters(prev => ({ ...prev, horizonDays: h }))}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filters.horizonDays === h
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {h}d
              </button>
            ))}
          </div>

          {/* Plant Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-xl px-3 py-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filters.plantId}
              onChange={(e) => setFilters(prev => ({ ...prev, plantId: e.target.value }))}
              className="bg-transparent border-none text-xs font-bold text-slate-800 p-0 pr-4 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Facilities</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Main Body: Recommendations Tab ──────────────────── */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Sub-Filters Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-150 pb-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all', urgency: 'all' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  filters.status === 'all' && filters.urgency === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({allRecommendations.length})
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'pending', urgency: 'critical' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filters.urgency === 'critical'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Critical Overdue ({allRecommendations.filter(r => r.urgency === 'critical' && r.status === 'pending').length})
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'pending', urgency: 'high' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filters.urgency === 'high'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                High Urgency ({allRecommendations.filter(r => r.urgency === 'high' && r.status === 'pending').length})
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'po_created', urgency: 'all' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filters.status === 'po_created'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                POs Issued ({allRecommendations.filter(r => r.status === 'po_created').length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search material, code, supplier..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Urgency & Material</th>
                  <th className="py-3 px-4">Current Stock vs Reserved</th>
                  <th className="py-3 px-4">Gross Demand & Safety</th>
                  <th className="py-3 px-4 text-right">Net Shortage</th>
                  <th className="py-3 px-4 text-right">Recommended PO</th>
                  <th className="py-3 px-4">Schedule (Need / Order By)</th>
                  <th className="py-3 px-4">Preferred Supplier</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-bold text-slate-700">No stockout shortages detected</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Current on-hand stock and pending deliveries fully cover active work orders within the {filters.horizonDays}-day horizon.
                      </p>
                    </td>
                  </tr>
                ) : (
                  recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Urgency & Material */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {rec.urgency === 'critical' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> OVERDUE ({rec.slackDays}d)
                            </span>
                          )}
                          {rec.urgency === 'high' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> DUE IN {rec.slackDays}d
                            </span>
                          )}
                          {rec.urgency === 'medium' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              PLANNED ({rec.slackDays}d)
                            </span>
                          )}
                          {rec.status === 'po_created' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              PO: {rec.poNumber}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900">{rec.stockItemName}</div>
                        <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                          {rec.stockItemCode}
                        </div>
                      </td>

                      {/* Stock vs Reserved */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-bold">
                          {rec.currentOnHand} {rec.unit}
                        </div>
                        <div className="text-[10px] text-amber-600">
                          Locked: {rec.reservedQty} {rec.unit}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Free: {rec.availableStock} {rec.unit}
                        </div>
                      </td>

                      {/* Gross Demand & Safety */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-bold">
                          Demand: {rec.grossRequirement} {rec.unit}
                        </div>
                        <div className="text-[10px] text-sky-600">
                          Safety Buffer: +{rec.safetyStockRequired} {rec.unit}
                        </div>
                        {rec.scheduledInbound > 0 && (
                          <div className="text-[10px] text-indigo-600">
                            On-Order: +{rec.scheduledInbound} {rec.unit}
                          </div>
                        )}
                      </td>

                      {/* Net Shortage */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-extrabold text-sm text-rose-600">
                          {rec.netRequirement} {rec.unit}
                        </span>
                      </td>

                      {/* Recommended PO (MOQ Adjusted) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-black text-sm text-slate-900">
                          {rec.recommendedOrderQty} {rec.unit}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatCurrency(rec.totalEstimatedCost)}
                        </div>
                        {rec.moq > 0 && (
                          <div className="text-[9px] text-slate-400">
                            MOQ: {rec.moq} {rec.unit}
                          </div>
                        )}
                      </td>

                      {/* Schedule (Need vs Order By) */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-bold text-[11px]">
                          Need: {rec.needByDate}
                        </div>
                        <div className={`text-[10px] ${rec.slackDays <= 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          Order By: {rec.orderByDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lead Time: {rec.leadTimeDays}d
                        </div>
                      </td>

                      {/* Preferred Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 text-xs">
                          {rec.preferredSupplierName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rec.vendorPaymentTerms || 'Net 30'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecForTimeline(rec);
                            setTimelineDrawerOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors inline-block"
                          title="View Supply-Demand Waterfall Timeline"
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                        </button>

                        {rec.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecForPo(rec);
                              setConvertToPoModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            Create PO
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200">
                            ✓ PO Created
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Tab 2: Safety Stock & Lead Time Rules ───────────── */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Material Safety Stock & Lead Time Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defines minimum buffer thresholds, vendor manufacturing lead times, and batch size order multiples.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Material / SKU</th>
                  <th className="py-3 px-4">Rule Type</th>
                  <th className="py-3 px-4 text-right">Fixed Buffer Qty</th>
                  <th className="py-3 px-4 text-right">Buffer Days of Supply</th>
                  <th className="py-3 px-4 text-right">Min Order Qty (MOQ)</th>
                  <th className="py-3 px-4 text-right">Order Multiple</th>
                  <th className="py-3 px-4 text-right">Inspection Lag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rule.stockItemId}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      {rule.ruleType === 'fixed_units' ? 'Fixed Units Buffer' : 'Days of Supply'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-sky-600">
                      {rule.fixedBufferQty}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700">
                      {rule.bufferDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {rule.minOrderQty}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {rule.orderMultiple}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {rule.inspectionBufferDays}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Tab 3: Execution History ────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                MRP Run Audit & Execution History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit trail of all manual and scheduled background explosion runs.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Run #</th>
                  <th className="py-3 px-4">Trigger Mode & User</th>
                  <th className="py-3 px-4">Facility Scope</th>
                  <th className="py-3 px-4">Horizon</th>
                  <th className="py-3 px-4 text-right">Items Analyzed</th>
                  <th className="py-3 px-4 text-right">Recommendations</th>
                  <th className="py-3 px-4 text-right">Critical Alerts</th>
                  <th className="py-3 px-4 text-right">Recommended Spend</th>
                  <th className="py-3 px-4 text-right">Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.runNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(r.triggeredAt).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        r.runMode === 'scheduled' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.runMode.toUpperCase()}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5">{r.triggeredByName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-700">{r.plantName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.horizonDays} Days</td>
                    <td className="py-3.5 px-4 text-right">{r.totalMaterialsAnalyzed}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-sky-600">{r.recommendationsCount}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">{r.criticalRecommendationsCount}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(r.totalRecommendedSpend)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">{r.runtimeMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals & Drawers ──────────────────────────────────── */}
      <MrpRunModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        plants={plants}
        initialPlantId={filters.plantId}
        initialHorizon={filters.horizonDays}
        onExecuteRun={executeMrpRun}
      />

      <MrpScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        config={scheduleConfig}
        onSave={updateScheduleConfig}
      />

      <ConvertToPoModal
        isOpen={convertToPoModalOpen}
        onClose={() => {
          setConvertToPoModalOpen(false);
          setSelectedRecForPo(null);
        }}
        recommendation={selectedRecForPo}
        onConfirm={convertToPo}
      />

      <MrpTimelineDrawer
        isOpen={timelineDrawerOpen}
        onClose={() => {
          setTimelineDrawerOpen(false);
          setSelectedRecForTimeline(null);
        }}
        recommendation={selectedRecForTimeline}
        onConvertToPo={(rec) => {
          setSelectedRecForPo(rec);
          setConvertToPoModalOpen(true);
        }}
      />
    </div>
  );
};
