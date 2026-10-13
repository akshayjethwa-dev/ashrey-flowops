// src/pages/procurement/PurchaseOrdersPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Building2,
  Warehouse,
  Boxes,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Mail,
  Printer,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  RefreshCw,
  Cpu,
  Layers,
  Check,
  ExternalLink,
  Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  SupplierAckStatus
} from '../../types/purchaseOrder';
import { PurchaseOrderDetailModal } from '../../components/purchaseOrders/PurchaseOrderDetailModal';
import { PurchaseOrderPrintModal } from '../../components/purchaseOrders/PurchaseOrderPrintModal';
import { PoAutomationRuleModal } from '../../components/purchaseOrders/PoAutomationRuleModal';
import { QuickPoApprovalModal } from '../../components/purchaseOrders/QuickPoApprovalModal';

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, profile } = useAuth();
  const { plants = [] } = usePlants(tenant?.id);

  const {
    orders,
    allOrders,
    automationRule,
    loading,
    submitting,
    error,
    filters,
    setFilters,
    kpis,
    refresh,
    runReorderSweep,
    approvePo,
    rejectPo,
    issuePo,
    recordAcknowledgment,
    recordDispatch,
    saveAutomationRule
  } = usePurchaseOrders();

  // Active status tab
  const [activeTab, setActiveTab] = useState<'all' | 'pending_approval' | 'approved_issued' | 'in_transit' | 'acknowledged' | 'received'>('all');

  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<PurchaseOrder | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<PurchaseOrder | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [approvalModalOrder, setApprovalModalOrder] = useState<PurchaseOrder | null>(null);
  const [approvalModalMode, setApprovalModalMode] = useState<'approve' | 'reject'>('approve');

  // Sweep result toast
  const [sweepResultMsg, setSweepResultMsg] = useState<string | null>(null);

  // Trigger Reorder Level Sweep
  const handleTriggerSweep = async () => {
    try {
      const res = await runReorderSweep();
      if (res.generatedCount > 0) {
        setSweepResultMsg(
          `Reorder Sweep complete! Auto-generated ${res.generatedCount} replenishment Purchase Order(s) routed to approval pipeline.`
        );
      } else {
        setSweepResultMsg('Reorder Sweep complete: All SKU stock levels currently above reorder buffers. No new POs needed.');
      }
      setTimeout(() => setSweepResultMsg(null), 6000);
    } catch (err: any) {
      setSweepResultMsg(`Reorder sweep failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSweepResultMsg(null), 6000);
    }
  };

  // Filter orders by tab
  const tabFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending_approval') return o.status === 'pending_approval';
      if (activeTab === 'approved_issued') return o.status === 'approved' || o.status === 'issued';
      if (activeTab === 'in_transit') return o.status === 'in_transit';
      if (activeTab === 'acknowledged') return o.status === 'acknowledged';
      if (activeTab === 'received') return o.status === 'received';
      return true;
    });
  }, [orders, activeTab]);

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

  const getDaysDiffFromToday = (isoDate: string) => {
    try {
      const target = new Date(isoDate).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      const diffDays = Math.round((target - today) / 86400000);
      return diffDays;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 select-none font-sans text-slate-800">
      
      {/* ── 1. Page Header & Primary Actions ────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded font-bold tracking-wider">
              Procurement & Supply Chain
            </span>
            <span className="text-xs font-mono uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-bold tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Reorder Engine: {automationRule?.enabled ? 'Active' : 'Disabled'}
            </span>
            {automationRule?.autoApproveUnderAmount ? (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Auto-Approve limit: ≤ {formatCurrency(automationRule.autoApproveUnderAmount)}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-indigo-600" />
            Purchase Order Automation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auto-generate POs upon reorder breach or MRP explosion, manage multi-tier approvals, and track vendor acknowledgments.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => navigate('/mrp')}
            id="btn-goto-mrp"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Open Automated MRP Engine"
          >
            <Cpu className="h-4 w-4 text-indigo-600" />
            MRP Engine
          </button>

          <button
            onClick={() => navigate('/suppliers')}
            id="btn-goto-suppliers"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Open Supplier Management & Scorecards"
          >
            <Award className="h-4 w-4 text-indigo-600" />
            Supplier Scorecards
          </button>

          <button
            onClick={() => navigate('/iqc')}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono uppercase py-2.5 px-3 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Open Incoming Quality Control (IQC) Desk"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Incoming IQC
          </button>

          <button
            onClick={() => setRulesModalOpen(true)}
            id="btn-po-rules"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono uppercase py-2.5 px-3.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            title="Configure auto-approval thresholds and supplier notification rules"
          >
            <Sliders className="h-4 w-4 text-slate-600" />
            Approval Policies
          </button>

          <button
            onClick={handleTriggerSweep}
            disabled={submitting}
            id="btn-trigger-reorder-sweep"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase py-2.5 px-4 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Scan all bin levels and generate POs for items below reorder point"
          >
            <Zap className="h-4 w-4 fill-white" />
            {submitting ? 'Scanning Stock...' : 'Run Reorder Level Sweep'}
          </button>
        </div>
      </div>

      {/* Sweep Result Banner */}
      {sweepResultMsg && (
        <div className="p-4 bg-indigo-950 text-indigo-200 border border-indigo-800 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{sweepResultMsg}</span>
          </div>
          <button
            onClick={() => setSweepResultMsg(null)}
            className="text-indigo-400 hover:text-white ml-3 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── 2. KPI Scorecards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Open PO Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Total Open Spend
            </p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(kpis.totalOpenSpend)}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Across {kpis.openOrdersCount} active purchase orders
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Pending Approval Routing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
              Pending Approvals
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-amber-600 font-mono">
                {kpis.pendingApprovalCount}
              </h3>
              {kpis.pendingApprovalCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Awaiting manager / VP sign-off
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Awaiting Supplier Acknowledgment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-sky-500 font-bold">
              Awaiting Vendor Ack
            </p>
            <h3 className="text-2xl font-black text-sky-600 font-mono mt-1">
              {kpis.awaitingAckCount} Orders
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Issued to supplier, awaiting ETA
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: In-Transit Shipments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-purple-600 font-bold">
              In-Transit Freight
            </p>
            <h3 className="text-2xl font-black text-purple-600 font-mono mt-1">
              {kpis.inTransitCount} Shipments
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Active LR / tracking carrier
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Overdue Delivery Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-bold">
              Delivery Overdue
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-black text-rose-600 font-mono">
                {kpis.overdueCount}
              </h3>
              {kpis.overdueCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded animate-pulse">
                  Late
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Past expected delivery date
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Filter Toolbar & Search ─────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders ({allOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending_approval'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending Approval
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-white">
              {allOrders.filter(o => o.status === 'pending_approval').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved_issued')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approved_issued'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved & Issued ({allOrders.filter(o => o.status === 'approved' || o.status === 'issued').length})
          </button>

          <button
            onClick={() => setActiveTab('in_transit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'in_transit'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            In-Transit ({allOrders.filter(o => o.status === 'in_transit').length})
          </button>

          <button
            onClick={() => setActiveTab('acknowledged')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'acknowledged'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            Acknowledged ({allOrders.filter(o => o.status === 'acknowledged').length})
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'received'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Received ({allOrders.filter(o => o.status === 'received').length})
          </button>
        </div>

        {/* Search & Plant Scopes */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PO #, vendor, SKU, LR..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Plant Dropdown */}
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

      {/* ── 4. Main Purchase Orders List ───────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-mono text-xs">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
            Loading purchase orders...
          </div>
        ) : tabFilteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No purchase orders match your active filter criteria. Run the Reorder Level Sweep or trigger an MRP calculation.
            </p>
            <button
              onClick={handleTriggerSweep}
              className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-mono font-bold py-2 px-4 rounded-xl cursor-pointer hover:bg-indigo-500"
            >
              <Zap className="h-3.5 w-3.5" />
              Run Reorder Level Sweep Now
            </button>
          </div>
        ) : (
          tabFilteredOrders.map((po) => {
            const daysDiff = getDaysDiffFromToday(po.expectedDeliveryDate);
            const isOverdue = daysDiff < 0 && !['received', 'cancelled'].includes(po.status);
            const isDueSoon = daysDiff >= 0 && daysDiff <= 2 && !['received', 'cancelled'].includes(po.status);

            return (
              <div
                key={po.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-300/40'
                    : po.status === 'pending_approval'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setSelectedOrderForDetail(po)}
                      className="text-base font-black text-slate-900 font-mono hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {po.poNumber}
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    {/* Source Trigger Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                        po.sourceTrigger === 'reorder_level_breach'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : po.sourceTrigger === 'mrp_engine'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                      title={po.triggerReference}
                    >
                      {po.sourceTrigger === 'reorder_level_breach' && <Zap className="h-3 w-3 text-rose-500" />}
                      {po.sourceTrigger === 'mrp_engine' && <Cpu className="h-3 w-3 text-indigo-500" />}
                      {po.sourceTrigger === 'reorder_level_breach'
                        ? 'Auto-Reorder Breach'
                        : po.sourceTrigger === 'mrp_engine'
                        ? 'MRP Engine'
                        : 'Manual Buyer'}
                    </span>

                    {/* Plant Scope */}
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {po.plantName}
                    </span>
                  </div>

                  {/* Status & Approval Indicators */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approval Status Badge */}
                    {po.approvalStatus === 'approved' ? (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {po.approvalLimitTier === 'auto_approved' ? 'Auto-Approved (< ₹50k)' : 'Approved'}
                      </span>
                    ) : po.approvalStatus === 'pending' ? (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        {po.approvalLimitTier === 'executive_level'
                          ? 'Pending VP Sign-off (> ₹5L)'
                          : 'Pending Manager Approval'}
                      </span>
                    ) : po.approvalStatus === 'rejected' ? (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        Rejected
                      </span>
                    ) : null}

                    {/* Lifecycle Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'in_transit'
                          ? 'bg-purple-100 text-purple-800'
                          : po.status === 'acknowledged'
                          ? 'bg-sky-100 text-sky-800'
                          : po.status === 'issued'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {po.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Body Details Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Col 1: Supplier Info */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Vendor / Supplier
                    </p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {po.supplierName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {po.supplierContactPerson || po.supplierPhone || po.supplierEmail || 'Industrial Vendor'}
                    </p>
                    {po.supplierGstin && (
                      <p className="text-[10px] font-mono text-slate-400">GSTIN: {po.supplierGstin}</p>
                    )}
                  </div>

                  {/* Col 2: Line Items & Qty */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Line Items ({po.items.length})
                    </p>
                    {po.items.slice(0, 1).map((item) => (
                      <div key={item.id} className="text-xs">
                        <div className="font-mono font-bold text-slate-800">
                          {item.stockItemCode} — {item.orderedQty} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.stockItemName}
                        </div>
                      </div>
                    ))}
                    {po.items.length > 1 && (
                      <p className="text-[10px] text-indigo-600 font-mono font-bold">
                        +{po.items.length - 1} more item(s)
                      </p>
                    )}
                  </div>

                  {/* Col 3: Financials & Dates */}
                  <div className="space-y-1">
                    <div className="flex justify-between md:block">
                      <div>
                        <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                          Total Amount (Incl. 18% GST)
                        </p>
                        <p className="text-base font-black text-slate-900 font-mono">
                          {formatCurrency(po.totalAmount)}
                        </p>
                      </div>

                      <div className="mt-1">
                        <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                          Expected Delivery Date
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {formatDate(po.expectedDeliveryDate)}
                          </span>
                          {isOverdue ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-700">
                              {Math.abs(daysDiff)}d overdue
                            </span>
                          ) : isDueSoon ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-700">
                              Due in {daysDiff}d
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700">
                              On Track
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Col 4: Supplier Ack & Tracking */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                        Supplier Acknowledgment
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          po.supplierAck.status === 'acknowledged_on_time'
                            ? 'bg-emerald-100 text-emerald-700'
                            : po.supplierAck.status === 'counter_proposed_date'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {po.supplierAck.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {po.supplierAck.status !== 'pending' ? (
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        {po.supplierAck.vendorConfirmationRef && (
                          <p>
                            Ref: <strong className="font-mono">{po.supplierAck.vendorConfirmationRef}</strong>
                          </p>
                        )}
                        {po.supplierAck.lorryReceiptNumber && (
                          <p className="flex items-center gap-1 text-purple-700 font-mono font-semibold">
                            <Truck className="h-3 w-3" />
                            {po.supplierAck.trackingCarrier || 'Freight'}: {po.supplierAck.lorryReceiptNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Awaiting supplier date confirmation
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Row */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Ordered: {formatDate(po.orderDate)}</span>
                    <span>•</span>
                    <span>By: {po.createdByName}</span>
                    {po.triggerReference && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-400 truncate max-w-xs">{po.triggerReference}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve / Reject buttons if pending approval */}
                    {po.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => {
                            setApprovalModalOrder(po);
                            setApprovalModalMode('approve');
                          }}
                          className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve PO
                        </button>
                        <button
                          onClick={() => {
                            setApprovalModalOrder(po);
                            setApprovalModalMode('reject');
                          }}
                          className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {/* Issue PO to Supplier if Approved */}
                    {po.status === 'approved' && (
                      <button
                        onClick={async () => {
                          try {
                            await issuePo(po.id, 'whatsapp');
                            alert(`PO ${po.poNumber} dispatched to supplier via WhatsApp!`);
                          } catch (err: any) {
                            alert(err.message || 'Failed to dispatch PO');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Dispatch to Supplier
                      </button>
                    )}

                    {/* Print Preview Button */}
                    <button
                      onClick={() => setSelectedOrderForPrint(po)}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Print Official Purchase Order Document with Barcode"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-500" />
                      Print PO
                    </button>

                    {/* View Full Detail Button */}
                    <button
                      onClick={() => setSelectedOrderForDetail(po)}
                      className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details & Tracking
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Modals Mount ───────────────────────────────────────── */}
      <PurchaseOrderDetailModal
        isOpen={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onApprove={approvePo}
        onReject={rejectPo}
        onIssuePo={issuePo}
        onRecordAck={recordAcknowledgment}
        onRecordDispatch={recordDispatch}
        onOpenPrintModal={(po) => setSelectedOrderForPrint(po)}
      />

      <PurchaseOrderPrintModal
        isOpen={Boolean(selectedOrderForPrint)}
        onClose={() => setSelectedOrderForPrint(null)}
        order={selectedOrderForPrint}
      />

      <PoAutomationRuleModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        rule={automationRule}
        onSave={saveAutomationRule}
      />

      <QuickPoApprovalModal
        isOpen={Boolean(approvalModalOrder)}
        onClose={() => setApprovalModalOrder(null)}
        order={approvalModalOrder}
        mode={approvalModalMode}
        onConfirmApprove={approvePo}
        onConfirmReject={rejectPo}
      />
    </div>
  );
};
