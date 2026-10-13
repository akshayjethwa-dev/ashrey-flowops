// src/pages/quality/FinalQualityPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
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
  Sliders,
  FileCheck2,
  Building2,
  Barcode,
  ArrowRight,
  Eye,
  Wrench,
  Ban,
  Package,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { useFqc } from '../../hooks/useFqc';
import {
  FqcInspectionOrder,
  FqcChecklistTemplate,
  FqcOrderStatus,
  FqcHoldStatus
} from '../../types/fqc';
import { FqcInspectionWorkbenchModal } from '../../components/fqc/FqcInspectionWorkbenchModal';
import { FqcSignOffModal } from '../../components/fqc/FqcSignOffModal';
import { CertificateOfConformanceModal } from '../../components/fqc/CertificateOfConformanceModal';
import { FqcTemplateEditorModal } from '../../components/fqc/FqcTemplateEditorModal';

export const FinalQualityPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    templates,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    createOrder,
    updateChecklistItem,
    signOffOrder,
    saveOrder,
    saveTemplate,
    exportCsv
  } = useFqc();

  const [activeTab, setActiveTab] = useState<'orders' | 'templates' | 'gate'>('orders');

  // Modals state
  const [activeWorkbenchOrder, setActiveWorkbenchOrder] = useState<FqcInspectionOrder | null>(null);
  const [signOffOrderTarget, setSignOffOrderTarget] = useState<FqcInspectionOrder | null>(null);
  const [activeCocOrder, setActiveCocOrder] = useState<FqcInspectionOrder | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FqcChecklistTemplate | null | 'new'>(null);

  // New Inspection quick creator
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    partSku: 'GEAR-SPUR-M4',
    customerName: 'Tata Motors Powertrain Division',
    orderNumber: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
    workOrderNumber: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
    lotNumber: `LOT-2026-X${Math.floor(100 + Math.random() * 900)}`,
    batchQuantity: 25,
    sampleSize: 5
  });

  const handleLaunchCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createOrder({
      ...newOrderForm,
      partName: templates.find(t => t.partSku === newOrderForm.partSku)?.partName || 'Precision Finished Component'
    });
    setIsCreatingOrder(false);
    setActiveWorkbenchOrder(created);
  };

  const getStatusBadge = (status: FqcOrderStatus, hold: FqcHoldStatus) => {
    if (hold === 'released') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          RELEASED FOR DISPATCH
        </span>
      );
    }

    if (hold === 'quarantined' || status === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 w-fit animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          QUARANTINED (BLOCKED)
        </span>
      );
    }

    if (status === 'in_progress') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 w-fit">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          AUTO-HOLD: IN PROGRESS
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 w-fit">
        <Clock className="w-3.5 h-3.5" />
        AUTO-HOLD: PENDING FQC
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Final Quality Control (FQC) & Dispatch Release
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  ISO 9001 Section 8.6 &bull; Dispatch Gate &bull; CoC Generator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured final inspection checklists before dispatch with quality authority sign-off and automatic dispatch holds
              </p>
            </div>
          </div>
        </div>

        {/* Global Page Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreatingOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New FQC Inspection
          </button>

          <button
            onClick={() => setEditingTemplate('new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            New SKU Template
          </button>

          <button
            onClick={() => navigate('/dispatch')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            Dispatch Desk
          </button>

          <button
            onClick={() => navigate('/ncr')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
            title="Non-Conformance & CAPA Management"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            NCR &amp; CAPA
          </button>

          <button
            onClick={() => navigate('/quality-holds')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-medium transition"
            title="Manage Quality Holds and Dispatch Gates"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Quality Holds
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Download CSV inspection ledger"
          >
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Inspected */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Finished Lots</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{kpis.totalOrders}</span>
            <span className="text-xs text-slate-400 ml-1.5">Batches</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Production completions</span>
        </div>

        {/* Cleared for Dispatch */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>Cleared for Dispatch</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{kpis.releasedCount}</span>
            <span className="text-xs text-emerald-400/80 ml-1.5">CoC Signed</span>
          </div>
          <span className="text-[11px] text-emerald-400/70 mt-1 block">Dispatch gate open</span>
        </div>

        {/* On Quality Hold */}
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>On Quality Hold</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{kpis.onHoldCount}</span>
            <span className="text-xs text-amber-400/80 ml-1.5">Auto-Held</span>
          </div>
          <span className="text-[11px] text-amber-400/70 mt-1 block">Dispatch withheld</span>
        </div>

        {/* First Pass Yield */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
            <span>First Pass Yield</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">{kpis.firstPassYieldPct}%</span>
            <span className="text-xs text-slate-400 ml-1.5">FPY</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Zero-defect compliance</span>
        </div>

        {/* Quarantined / Rejected */}
        <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
            <span>Quarantined / Rejected</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-400 font-mono">{kpis.rejectedCount}</span>
            <span className="text-xs text-rose-400/80 ml-1.5">Lots</span>
          </div>
          <span className="text-[11px] text-rose-400/70 mt-1 block">MRB non-conformance</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'orders' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Final Inspection Orders & Lots ({orders.length})
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'templates' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Product Checklist Templates ({templates.length})
          {activeTab === 'templates' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('gate')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'gate' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Dispatch Release Gate Policy & Rules
          {activeTab === 'gate' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
          )}
        </button>
      </div>

      {/* TAB 1: Inspection Orders & Lots */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by FQC #, Part SKU, Lot #, Customer, or CoC..."
                  value={filter.searchQuery || ''}
                  onChange={e => setFilter({ ...filter, searchQuery: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Hold Status Filter */}
              <select
                value={filter.holdStatus || 'all'}
                onChange={e => setFilter({ ...filter, holdStatus: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Release States</option>
                <option value="released">Released for Dispatch</option>
                <option value="on_hold">On Quality Hold</option>
                <option value="quarantined">Quarantined (Rejected)</option>
              </select>

              {/* Inspection Status Filter */}
              <select
                value={filter.status || 'all'}
                onChange={e => setFilter({ ...filter, status: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Inspection Progress</option>
                <option value="passed">Passed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => setFilter({ searchQuery: '', status: 'all', holdStatus: 'all' })}
              className="text-slate-400 hover:text-white px-2 py-1 rounded transition text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Table of Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">FQC Order & Linked Sales</th>
                    <th className="p-3.5">Part SKU & Description</th>
                    <th className="p-3.5">Lot # & Batch Size</th>
                    <th className="p-3.5">Checklist Progress</th>
                    <th className="p-3.5">Dispatch Release Status</th>
                    <th className="p-3.5">Quality Sign-Off</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No FQC inspection orders match your active filter.</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map(ord => {
                      const passedItems = ord.items.filter(it => it.result === 'pass').length;
                      const totalItems = ord.items.length;
                      const hasCoC = Boolean(ord.qualityAuthoritySignOff?.cocNumber);

                      return (
                        <tr key={ord.id} className="hover:bg-slate-850/50 transition">
                          
                          {/* FQC Number & Order */}
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-cyan-300 block">
                              {ord.fqcNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              SO: {ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {ord.customerName}
                            </span>
                          </td>

                          {/* Part SKU & Name */}
                          <td className="p-3.5">
                            <strong className="text-slate-200 block">{ord.partSku}</strong>
                            <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                              {ord.partName}
                            </span>
                          </td>

                          {/* Lot # & Batch Qty */}
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-200 block">
                              {ord.lotNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Qty: {ord.batchQuantity} pcs (Sample: {ord.sampleSize})
                            </span>
                          </td>

                          {/* Checklist Progress */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-emerald-400 font-bold">{passedItems}</span>
                              <span className="text-slate-600">/</span>
                              <span className="text-slate-400">{totalItems} checked</span>
                            </div>
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${totalItems > 0 ? (passedItems / totalItems) * 100 : 0}%` }}
                              />
                            </div>
                            {ord.defectSummary.critical > 0 && (
                              <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                                {ord.defectSummary.critical} Critical Defect(s)
                              </span>
                            )}
                          </td>

                          {/* Dispatch Gate Status */}
                          <td className="p-3.5">
                            {getStatusBadge(ord.status, ord.holdStatus)}
                          </td>

                          {/* Quality Sign-off */}
                          <td className="p-3.5">
                            {ord.qualityAuthoritySignOff ? (
                              <div>
                                <span className="font-mono text-emerald-400 font-bold block text-[11px]">
                                  {ord.qualityAuthoritySignOff.cocNumber}
                                </span>
                                <span className="text-[11px] text-slate-300 block">
                                  {ord.qualityAuthoritySignOff.signedBy}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {new Date(ord.qualityAuthoritySignOff.signedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs italic">
                                Pending Sign-Off
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Open Workbench */}
                              <button
                                onClick={() => setActiveWorkbenchOrder(ord)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                                title="Open inspection checklist workbench"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                Inspect
                              </button>

                              {/* Sign-Off */}
                              <button
                                onClick={() => setSignOffOrderTarget(ord)}
                                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-700/60 transition flex items-center gap-1"
                                title="Quality Authority digital sign-off"
                              >
                                <Award className="w-3.5 h-3.5" />
                                Sign-Off
                              </button>

                              {/* View Certificate */}
                              {hasCoC && (
                                <button
                                  onClick={() => setActiveCocOrder(ord)}
                                  className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-700/60 transition flex items-center gap-1"
                                  title="View Certificate of Conformance"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  CoC
                                </button>
                              )}
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

      {/* TAB 2: Product Checklist Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">
                Configured Product-Specific FQC Inspection Plans
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each finished part SKU has engineered characteristics, nominal tolerances, inspection methods, and AQL sampling rules
              </p>
            </div>

            <button
              onClick={() => setEditingTemplate('new')}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Add Product Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                      {tmpl.partSku}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{tmpl.version}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{tmpl.partName}</h4>
                  <p className="text-xs text-slate-400 mb-3">{tmpl.productFamily}</p>

                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sampling Rule:</span>
                      <span className="font-mono text-slate-200">{tmpl.sampleSizeRule.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">AQL Level:</span>
                      <span className="font-mono text-slate-200">{tmpl.aqlLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standard:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{tmpl.standardReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Characteristics:</span>
                      <span className="font-bold text-cyan-300">{tmpl.items.length} checklist items</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">By {tmpl.createdBy}</span>
                  <button
                    onClick={() => setEditingTemplate(tmpl)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    Edit Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Dispatch Release Gate Policy */}
      {activeTab === 'gate' && (
        <div className="space-y-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Dispatch Release Gate Architecture & Quality Auto-Hold Rules
                </h3>
                <p className="text-xs text-slate-400">
                  How FlowOps MES enforces non-negotiable finished goods release criteria across the factory
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
                  <Clock className="w-4 h-4" />
                  1. Automatic Dispatch Hold
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every sales order or production work order automatically enters <strong>Quality Auto-Hold</strong> upon completion of manufacturing. Warehouse logistics personnel cannot generate shipping manifests, lorry receipts (LR), or vehicle dispatch notes until the FQC inspection status is explicitly cleared.
                </p>
              </div>

              <div className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
                  <Award className="w-4 h-4" />
                  2. Quality Authority Endorsement
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inspectors enter measurements, visual results, and packaging confirmation. Final release requires a certified <strong>Quality Authority</strong> (QA Manager or CQE) to execute a digital signature with badge authentication, generating an official Certificate of Conformance (CoC).
                </p>
              </div>

              <div className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  3. Hard Quarantine Barrier
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If any critical dimension fails inspection or an uncalibrated gage is detected, the batch is routed to <strong>MRB Hard Quarantine</strong>. The Dispatch Gate locks immediately, preventing accidental shipment of non-conforming products under ISO 9001 and IATF 16949 Section 8.6.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* QUICK NEW INSPECTION CREATION MODAL */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Initiate Final Quality Inspection (FQC)</h3>
              </div>
              <button
                onClick={() => setIsCreatingOrder(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchCreateOrder} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Product SKU *</label>
                <select
                  value={newOrderForm.partSku}
                  onChange={e => setNewOrderForm({ ...newOrderForm, partSku: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.partSku}>
                      {t.partSku} - {t.partName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.customerName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sales Order Number</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.orderNumber}
                    onChange={e => setNewOrderForm({ ...newOrderForm, orderNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Work Order #</label>
                  <input
                    type="text"
                    value={newOrderForm.workOrderNumber}
                    onChange={e => setNewOrderForm({ ...newOrderForm, workOrderNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Lot / Heat #</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.lotNumber}
                    onChange={e => setNewOrderForm({ ...newOrderForm, lotNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Batch Qty</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.batchQuantity}
                    onChange={e => setNewOrderForm({ ...newOrderForm, batchQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sample Size</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.sampleSize}
                    onChange={e => setNewOrderForm({ ...newOrderForm, sampleSize: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Creating this inspection automatically sets Auto-Hold on the order until Quality Authority signs off.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingOrder(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-600/25"
                >
                  Launch Workbench
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION WORKBENCH MODAL */}
      {activeWorkbenchOrder && (
        <FqcInspectionWorkbenchModal
          order={activeWorkbenchOrder}
          isOpen={Boolean(activeWorkbenchOrder)}
          onClose={() => setActiveWorkbenchOrder(null)}
          onSaveItem={(itemId, updates) => {
            const updated = updateChecklistItem(activeWorkbenchOrder.id, itemId, updates);
            setActiveWorkbenchOrder(updated);
          }}
          onSubmitForSignOff={order => {
            setSignOffOrderTarget(order);
          }}
          onOpenSignOffModal={order => {
            setSignOffOrderTarget(order);
          }}
        />
      )}

      {/* QUALITY AUTHORITY SIGN-OFF MODAL */}
      {signOffOrderTarget && (
        <FqcSignOffModal
          order={signOffOrderTarget}
          isOpen={Boolean(signOffOrderTarget)}
          onClose={() => setSignOffOrderTarget(null)}
          onSignOff={(orderId, signOffData) => {
            const signed = signOffOrder(orderId, signOffData);
            if (activeWorkbenchOrder?.id === orderId) {
              setActiveWorkbenchOrder(signed);
            }
            if (signed.qualityAuthoritySignOff?.cocNumber) {
              setActiveCocOrder(signed);
            }
          }}
        />
      )}

      {/* CERTIFICATE OF CONFORMANCE MODAL */}
      {activeCocOrder && (
        <CertificateOfConformanceModal
          order={activeCocOrder}
          isOpen={Boolean(activeCocOrder)}
          onClose={() => setActiveCocOrder(null)}
        />
      )}

      {/* TEMPLATE EDITOR MODAL */}
      {editingTemplate && (
        <FqcTemplateEditorModal
          template={editingTemplate}
          isOpen={Boolean(editingTemplate)}
          onClose={() => setEditingTemplate(null)}
          onSave={tmpl => {
            saveTemplate(tmpl);
          }}
        />
      )}

    </div>
  );
};
