// src/pages/quality/IncomingQualityPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ruler,
  Camera,
  FileCheck2,
  Download,
  Plus,
  Search,
  Filter,
  Sliders,
  Printer,
  Sparkles,
  Building2,
  Layers,
  Flame,
  Award,
  Trash2,
  RotateCcw,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useIQC } from '../../hooks/useIQC';
import { IqcOrder, InspectionPlan, DispositionType, InspectionOrderStatus } from '../../types/iqc';
import { IqcInspectionWorkbenchModal } from '../../components/iqc/IqcInspectionWorkbenchModal';
import { IqcDispositionModal } from '../../components/iqc/IqcDispositionModal';
import { IqcCertificatePrintModal } from '../../components/iqc/IqcCertificatePrintModal';
import { IqcPlanEditorModal } from '../../components/iqc/IqcPlanEditorModal';
import { CreateIqcOrderModal } from '../../components/iqc/CreateIqcOrderModal';

export const IncomingQualityPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    plans,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    saveMeasurements,
    addDefectPhoto,
    deleteDefectPhoto,
    applyDisposition,
    autoGenerateFromReceipt,
    createPlan,
    updatePlan,
    exportCsv
  } = useIQC();

  const [activeTab, setActiveTab] = useState<'orders' | 'plans' | 'analytics'>('orders');

  // Modal states
  const [workbenchOrder, setWorkbenchOrder] = useState<IqcOrder | null>(null);
  const [dispositionOrder, setDispositionOrder] = useState<IqcOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<IqcOrder | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<InspectionPlan | null>(null);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Incoming Quality Control (IQC)
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AS9100 / IATF 16949
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Inspect incoming raw materials & parts against supplier inspection plans with photo evidence and digital disposition
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Inward Inspection Order
          </button>

          <button
            onClick={() => {
              setEditingPlan(null);
              setIsPlanEditorOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            New Inspection Plan
          </button>

          <button
            onClick={() => navigate('/spc')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-900/60 to-cyan-900/60 hover:from-blue-800/80 hover:to-cyan-800/80 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            SPC Charts
          </button>

          <button
            onClick={() => navigate('/fqc')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Final Quality Control (FQC) & Dispatch Release"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Final Quality (FQC)
          </button>

          <button
            onClick={() => navigate('/ncr')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Non-Conformance Reports & CAPA Management"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            NCR & CAPA
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Download CSV Audit Ledger"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Pending Inspection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Pending Inspection</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {kpis.pendingInspection}
            </span>
            <span className="text-[11px] text-slate-500">at dock</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Avg cycle: <strong>{kpis.avgInspectionMinutes} min</strong>
          </div>
        </div>

        {/* In-Progress Testing */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">In-Progress Testing</span>
            <Ruler className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {kpis.inProgress}
            </span>
            <span className="text-[11px] text-slate-500">active orders</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Metrology lab queue
          </div>
        </div>

        {/* Quality Acceptance Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Lot Acceptance Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {kpis.acceptanceRatePct}%
            </span>
            <span className="text-[11px] text-slate-500">target ≥ 95%</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/90 font-mono">
            {kpis.acceptedLots} Lots Passed
          </div>
        </div>

        {/* Quarantined & RTV Lots */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Quarantined / RTV</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {kpis.rejectedLots}
            </span>
            <span className="text-[11px] text-slate-500">debit notes</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400/90 font-mono">
            Defect quarantine holding
          </div>
        </div>

        {/* Active Plans */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Inspection Plans</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {kpis.activePlansCount}
            </span>
            <span className="text-[11px] text-slate-500">protocols</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            ISO 2859-1 Level II
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-xl px-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Dock Inspection Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'plans'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Inspection Plans Library ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Defect & Disposition Analytics
        </button>
      </div>

      {/* TAB 1: INSPECTION ORDERS */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                placeholder="Search IQC#, PO#, Part, Supplier, Heat#..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
              {/* Status filter */}
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Inspection Statuses</option>
                <option value="pending_inspection">Pending Inspection</option>
                <option value="in_progress">In-Progress</option>
                <option value="completed">Completed</option>
                <option value="quarantined">Quarantined / Held</option>
              </select>

              {/* Disposition filter */}
              <select
                value={filter.disposition}
                onChange={(e) => setFilter({ ...filter, disposition: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Dispositions</option>
                <option value="accepted">Accepted / Released</option>
                <option value="rejected">Rejected / RTV</option>
                <option value="rework">Conditional Rework</option>
                <option value="pending">Disposition Pending</option>
              </select>

              {/* Date range filter */}
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter({ ...filter, dateRange: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Receipts</option>
                <option value="today">Today's Dock Receipts</option>
                <option value="this_week">Past 7 Days</option>
                <option value="this_month">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">IQC Order #</th>
                    <th className="p-3.5">PO & GRN Ref</th>
                    <th className="p-3.5">Supplier & Heat Lot</th>
                    <th className="p-3.5">Part SKU & Name</th>
                    <th className="p-3.5">Lot & Sample Size</th>
                    <th className="p-3.5">Parameters Check</th>
                    <th className="p-3.5">Photo Evidence</th>
                    <th className="p-3.5">Disposition</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No inspection orders matching selected criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const totalParams = order.parameters.length;
                      const passedParams = order.parameters.filter(p => p.parameterStatus === 'pass').length;
                      const failedParams = order.parameters.filter(p => p.parameterStatus === 'fail').length;

                      const disp = order.disposition?.disposition;

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition">
                          
                          {/* IQC Order # */}
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-white block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-blue-400 block mt-0.5">
                              {order.inspectionPlanCode}
                            </span>
                          </td>

                          {/* PO & GRN */}
                          <td className="p-3.5 font-mono">
                            <span className="text-slate-300 font-medium block">
                              {order.poNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {order.grnNumber}
                            </span>
                          </td>

                          {/* Supplier & Heat Lot */}
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-200 block truncate max-w-[160px]">
                              {order.supplierName}
                            </span>
                            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {order.heatLotNumber}
                            </span>
                          </td>

                          {/* Part SKU & Name */}
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {order.partSku}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                              {order.partName}
                            </span>
                          </td>

                          {/* Lot & Sample Size */}
                          <td className="p-3.5 font-mono">
                            <span className="text-slate-200 font-bold block">
                              {order.receivedQty} {order.unit}
                            </span>
                            <span className="text-[10px] text-blue-400 block">
                              Sample: {order.sampleSize} units
                            </span>
                          </td>

                          {/* Parameters Progress */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {failedParams > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {failedParams} OOS Fail
                                </span>
                              ) : passedParams === totalParams && totalParams > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {passedParams}/{totalParams} In-Spec
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {passedParams}/{totalParams} Done
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Photo Evidence */}
                          <td className="p-3.5">
                            {order.defectPhotos && order.defectPhotos.length > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 w-max">
                                <Camera className="w-3 h-3 text-blue-400" />
                                {order.defectPhotos.length} Photo{order.defectPhotos.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">
                                None
                              </span>
                            )}
                          </td>

                          {/* Disposition Badge */}
                          <td className="p-3.5 font-mono">
                            {disp === 'accepted' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ACCEPTED
                              </span>
                            ) : disp === 'rejected' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                REJECTED / RTV
                              </span>
                            ) : disp === 'rework' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                REWORK
                              </span>
                            ) : disp === 'mrb_review' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                MRB HOLD
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setWorkbenchOrder(order)}
                                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition border border-blue-500/40 flex items-center gap-1"
                                title="Open Metrology Workbench"
                              >
                                <Ruler className="w-3.5 h-3.5" />
                                Inspect
                              </button>

                              <button
                                onClick={() => setDispositionOrder(order)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1"
                                title="Apply Lot Disposition"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                                Disposition
                              </button>

                              <button
                                onClick={() => setPrintOrder(order)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
                                title="Print Certificate & Lot Traveler"
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
        </div>
      )}

      {/* TAB 2: INSPECTION PLANS LIBRARY */}
      {activeTab === 'plans' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Pre-configured inspection protocols governing raw steels, sheet metals, precision fasteners, and machined components.
            </p>
            <button
              onClick={() => {
                setEditingPlan(null);
                setIsPlanEditorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase transition"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {plan.planCode}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          v{plan.version}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {plan.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {plan.partName} ({plan.partSku})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsPlanEditorOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      Edit Plan
                    </button>
                  </div>

                  {/* Plan parameters summary */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
                      Configured Parameters ({plan.parameters.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {plan.parameters.map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 truncate">
                              {p.parameterName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {p.criticality}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.toleranceType === 'two_sided' ? (
                              <span>{p.lowerTolerance} ~ {p.upperTolerance} {p.unit}</span>
                            ) : (
                              <span>Attributive Pass/Fail</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Gauge: {p.gaugeOrInstrument}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>AQL: <strong className="text-slate-300">{plan.aqlLevel}</strong></span>
                  <span>Supplier: <strong className="text-slate-300">{plan.supplierName || 'All (*)'}</strong></span>
                  <span>Approved: <strong className="text-slate-300">{plan.approvedBy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEFECT & DISPOSITION ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Defect Categories Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              Incoming Defect Distribution (Pareto Analysis)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of non-conformances identified during incoming quality receiving inspections.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Dimensional Out-of-Tolerance (Thickness / OD)</span>
                  <span className="font-bold text-rose-400">45% (9 Lots)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Surface Oxidation / Transit Rust Spots</span>
                  <span className="font-bold text-amber-400">25% (5 Lots)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Thread Damage / Flank Burrs</span>
                  <span className="font-bold text-blue-400">15% (3 Lots)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '15%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Casting Porosity / Blowholes</span>
                  <span className="font-bold text-purple-400">10% (2 Lots)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Packaging & Seal Tampering</span>
                  <span className="font-bold text-slate-400">5% (1 Lot)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-slate-600 h-full rounded-full" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Quality PPM Scorecard Link */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Supplier Acceptance Rates & Closed-Loop Integration
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Inspection outcomes directly calibrate supplier scorecard rankings, auto-log 8D CAPA incidents, and throttle automatic purchase order generation.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Tata Prime Steel Ltd.</span>
                    <span className="text-[11px] text-slate-400 font-mono">EN8 Carbon Steel Rounds</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">98.4% Acceptance</span>
                    <span className="text-[10px] text-emerald-500 font-mono">Tier 1 Preferred</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Jindal Steel & Power Ltd.</span>
                    <span className="text-[11px] text-slate-400 font-mono">CRCA Sheet Metals</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 font-mono block">89.2% Acceptance</span>
                    <span className="text-[10px] text-rose-400 font-mono">Probation Alert (RTV Issued)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Sundram Fasteners Ltd.</span>
                    <span className="text-[11px] text-slate-400 font-mono">Hex Head Bolts Grade 8.8</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">99.1% Acceptance</span>
                    <span className="text-[10px] text-emerald-500 font-mono">Tier 1 Preferred</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => navigate('/suppliers')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                Open Full Supplier Scorecards & 8D CAPA Desk
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODALS */}

      {/* 1. Metrology Inspection Workbench Modal */}
      {workbenchOrder && (
        <IqcInspectionWorkbenchModal
          order={workbenchOrder}
          onClose={() => setWorkbenchOrder(null)}
          onSaveMeasurements={saveMeasurements}
          onAddPhoto={addDefectPhoto}
          onDeletePhoto={deleteDefectPhoto}
          onOpenDisposition={(o) => {
            setWorkbenchOrder(null);
            setDispositionOrder(o);
          }}
        />
      )}

      {/* 2. Final Disposition Modal */}
      {dispositionOrder && (
        <IqcDispositionModal
          order={dispositionOrder}
          onClose={() => setDispositionOrder(null)}
          onApplyDisposition={applyDisposition}
        />
      )}

      {/* 3. Certificate Print / PDF Modal */}
      {printOrder && (
        <IqcCertificatePrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* 4. Inspection Plan Editor Modal */}
      {isPlanEditorOpen && (
        <IqcPlanEditorModal
          plan={editingPlan}
          onClose={() => {
            setIsPlanEditorOpen(false);
            setEditingPlan(null);
          }}
          onSavePlan={async (data) => {
            if (editingPlan) {
              await updatePlan(editingPlan.id, data);
            } else {
              await createPlan(data);
            }
          }}
        />
      )}

      {/* 5. Inward Inspection Order Generator Modal */}
      {isCreateOrderOpen && (
        <CreateIqcOrderModal
          plans={plans}
          onClose={() => setIsCreateOrderOpen(false)}
          onCreateOrder={autoGenerateFromReceipt}
        />
      )}

    </div>
  );
};
