// src/pages/planning/SalesOrderErpSyncPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  ErpSalesOrder, 
  ErpSoImportStatus, 
  SalesOrderSyncStats 
} from '../../types/salesOrderErpSync';
import { salesOrderErpSyncService } from '../../services/salesOrderErpSyncService';
import { 
  ShoppingBag, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Zap, 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  Cpu, 
  Building2, 
  SlidersHorizontal, 
  Play, 
  Plus, 
  Check, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  Server
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SalesOrderErpSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, profile } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'inbound_queue' | 'generated_wos' | 'mapping_rules'>('inbound_queue');

  // Loading and action states
  const [loading, setLoading] = useState(true);
  const [pullingFromErp, setPullingFromErp] = useState(false);
  const [importingSoId, setImportingSoId] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  // Configuration toggles
  const [autoGenerateWOs, setAutoGenerateWOs] = useState(true);

  // Data
  const [erpOrders, setErpOrders] = useState<ErpSalesOrder[]>([]);
  const [stats, setStats] = useState<SalesOrderSyncStats>({
    totalErpOrdersPulled: 0,
    pendingImportCount: 0,
    importedToFlowOpsCount: 0,
    workOrdersGeneratedCount: 0,
    totalValueINR: 0
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | 'tally' | 'oracle' | 'sap'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_import' | 'wo_generated'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const loadData = () => {
    setLoading(true);
    try {
      const orders = salesOrderErpSyncService.getErpSalesOrders(tenantId);
      const computedStats = salesOrderErpSyncService.getStats(tenantId);
      setErpOrders(orders);
      setStats(computedStats);
    } catch (e) {
      console.error('Failed loading ERP sales orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Pull orders from ERP
  const handlePullFromErp = async () => {
    setPullingFromErp(true);
    toastInfo('Polling Corporate ERP', 'Fetching newly released sales orders from Tally Prime and Oracle Cloud...');
    try {
      const res = await salesOrderErpSyncService.pullSalesOrdersFromErp(tenantId, 'all');
      toastSuccess('ERP Orders Synced', `Fetched ${res.pulledCount} incoming orders from ERP.`);
      loadData();
    } catch (err: any) {
      toastError('ERP Pull Error', err.message || 'Failed connecting to ERP');
    } finally {
      setPullingFromErp(false);
    }
  };

  // Import single order & auto-generate work orders
  const handleImportSingle = async (erpSo: ErpSalesOrder) => {
    setImportingSoId(erpSo.id);
    try {
      const res = await salesOrderErpSyncService.importSalesOrderAndGenerateWOs(
        tenantId,
        erpSo.id,
        {
          autoGenerateWOs,
          actorName: profile?.name || 'Production Planner',
          actorId: profile?.uid || 'planner_1'
        }
      );

      const woCount = res.workOrdersGenerated.length;
      toastSuccess(
        'Sales Order Imported & WOs Released',
        `Mapped to ${res.flowOpsOrder.orderNumber}. Generated ${woCount} work order(s) with exploded BOMs.`,
        5000
      );
      loadData();
    } catch (err: any) {
      toastError('Import Failed', err.message);
    } finally {
      setImportingSoId(null);
    }
  };

  // Bulk import all pending
  const handleBulkImportAll = async () => {
    const pending = erpOrders.filter(o => o.status === 'pending_import');
    if (pending.length === 0) return;

    setBulkImporting(true);
    toastInfo('Bulk Order Processing', `Importing ${pending.length} ERP orders & generating shopfloor work orders...`);
    try {
      await salesOrderErpSyncService.bulkImportAndGenerateWOs(
        tenantId,
        pending.map(p => p.id),
        {
          autoGenerateWOs,
          actorName: profile?.name || 'Production Planner',
          actorId: profile?.uid || 'planner_1'
        }
      );
      toastSuccess('Bulk Import Completed', `All ${pending.length} orders mapped and scheduled into production.`);
      loadData();
    } catch (err: any) {
      toastError('Bulk Import Error', err.message);
    } finally {
      setBulkImporting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered list
  const filteredOrders = useMemo(() => {
    return erpOrders.filter(so => {
      const matchesSystem = systemFilter === 'all' || so.erpSystem === systemFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending_import' ? so.status === 'pending_import' : so.status !== 'pending_import');

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        so.erpSoNumber.toLowerCase().includes(q) ||
        so.customerName.toLowerCase().includes(q) ||
        so.customerPoNumber.toLowerCase().includes(q) ||
        (so.flowOpsOrderNumber && so.flowOpsOrderNumber.toLowerCase().includes(q)) ||
        so.items.some(i => i.itemName.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q));

      return matchesSystem && matchesStatus && matchesSearch;
    });
  }, [erpOrders, systemFilter, statusFilter, searchQuery]);

  // Orders that have generated WOs
  const ordersWithWos = useMemo(() => {
    return erpOrders.filter(o => o.generatedWorkOrderNumbers && o.generatedWorkOrderNumbers.length > 0);
  }, [erpOrders]);

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase tracking-widest block leading-none">
              PRODUCTION PLANNING & SCHEDULING · ERP SALES INFLOW
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
              ERP Auto-Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Sales Order Sync from ERP
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automatically ingest incoming commercial sales orders from Tally Prime, Oracle Cloud, and SAP into FlowOps, explode multi-level BOMs, and auto-generate manufacturing Work Orders.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => navigate('/orders')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="View Shopfloor Orders Board"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Orders Board</span>
          </button>

          <button
            onClick={handlePullFromErp}
            disabled={pullingFromErp}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs disabled:opacity-50"
            title="Fetch latest customer orders from Tally / Oracle ERP"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 ${pullingFromErp ? 'animate-spin' : ''}`} />
            <span>{pullingFromErp ? 'Pulling from ERP...' : 'Pull SOs from ERP'}</span>
          </button>

          <button
            onClick={() => navigate('/integrations/tally')}
            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Open Tally Connector (XML/HTTP Gateway, ODBC Fallback, GST Sync)"
          >
            <Server className="h-4 w-4 text-amber-600" />
            <span>Tally Connector</span>
          </button>

          {stats.pendingImportCount > 0 && (
            <button
              onClick={handleBulkImportAll}
              disabled={bulkImporting}
              className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{bulkImporting ? 'Processing...' : `Auto-Generate WOs (${stats.pendingImportCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Metric 1: Pending Import Queue */}
        <div 
          onClick={() => {
            setActiveTab('inbound_queue');
            setStatusFilter('pending_import');
          }}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            statusFilter === 'pending_import' && activeTab === 'inbound_queue'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Unimported ERP SOs</span>
            <ShoppingBag className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingImportCount}</span>
            <span className="text-xs text-slate-500">Orders Pending</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold truncate">
            Ready to convert into FlowOps orders
          </div>
        </div>

        {/* Metric 2: Imported to FlowOps */}
        <div 
          onClick={() => {
            setActiveTab('inbound_queue');
            setStatusFilter('all');
          }}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition cursor-pointer shadow-3xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Pulled SOs</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalErpOrdersPulled}</span>
            <span className="text-xs text-slate-500">From Tally / Oracle</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-700 font-semibold truncate">
            ₹{stats.totalValueINR.toLocaleString('en-IN')} total pipeline
          </div>
        </div>

        {/* Metric 3: Work Orders Generated */}
        <div 
          onClick={() => setActiveTab('generated_wos')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'generated_wos'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Work Orders Released</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">{stats.workOrdersGeneratedCount}</span>
            <span className="text-xs text-slate-500">Orders Active</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            Sequential WO-2026 numbers & routing
          </div>
        </div>

        {/* Metric 4: Auto-Generation Rule Toggle */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Auto-WO Rule</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <label htmlFor="autoWoToggle" className="cursor-pointer text-xs font-bold text-slate-800">
              Auto-Explode BOM
            </label>
            <input
              type="checkbox"
              id="autoWoToggle"
              checked={autoGenerateWOs}
              onChange={e => setAutoGenerateWOs(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 truncate">
            {autoGenerateWOs ? 'Auto-releases WOs on import' : 'Manual WO generation'}
          </span>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab('inbound_queue')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'inbound_queue'
              ? 'border-indigo-650 text-indigo-900 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>ERP Inbound Sales Orders ({erpOrders.length})</span>
          {stats.pendingImportCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {stats.pendingImportCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('generated_wos')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'generated_wos'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Work Orders Generated ({ordersWithWos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping_rules')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'mapping_rules'
              ? 'border-slate-800 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>ERP Field Mapping & Routing Engine</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: INBOUND ERP SALES ORDERS QUEUE (Acceptance Criteria 1 & 2)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'inbound_queue' && (
        <div className="space-y-4 font-mono">
          
          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs text-xs">
            
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ERP SO #, customer PO, SKU, or client..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* ERP System Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">ERP:</span>
                {(['all', 'tally', 'oracle', 'sap'] as const).map(sys => (
                  <button
                    key={sys}
                    onClick={() => setSystemFilter(sys)}
                    className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                      systemFilter === sys 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Queue:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setStatusFilter('pending_import')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'pending_import' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pending Import ({stats.pendingImportCount})
              </button>
            </div>

          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">ERP SO # / PO Reference</th>
                    <th className="py-3 px-4">Consignee Client</th>
                    <th className="py-3 px-4">Ordered Line Items & Qty</th>
                    <th className="py-3 px-4">Delivery Due / Priority</th>
                    <th className="py-3 px-4">Order Value (₹)</th>
                    <th className="py-3 px-4">FlowOps State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No ERP sales orders found matching specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(so => {
                      const isExpanded = !!expandedOrders[so.id];
                      const isPending = so.status === 'pending_import';

                      return (
                        <React.Fragment key={so.id}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/20' : ''}`}>
                            
                            {/* ERP SO & PO */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  so.erpSystem === 'tally' ? 'bg-amber-100 text-amber-900' :
                                  so.erpSystem === 'oracle' ? 'bg-sky-100 text-sky-900' : 'bg-purple-100 text-purple-900'
                                }`}>
                                  {so.erpSystem}
                                </span>
                                <strong className="text-slate-900">{so.erpSoNumber}</strong>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                PO: <strong>{so.customerPoNumber}</strong>
                              </span>
                            </td>

                            {/* Client & Destination */}
                            <td className="py-3.5 px-4">
                              <strong className="text-slate-900 block truncate max-w-[190px]">
                                {so.customerName}
                              </strong>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[190px] flex items-center space-x-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0 inline text-slate-400" />
                                <span>{so.shippingAddress}</span>
                              </span>
                            </td>

                            {/* Line Items peek */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-800">
                                  {so.items[0]?.itemName} (x{so.items[0]?.orderedQuantity})
                                </span>
                                {so.items.length > 1 && (
                                  <span className="text-[9px] px-1 bg-slate-100 rounded text-slate-600 font-bold">
                                    +{so.items.length - 1} more
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="text-emerald-700 font-bold flex items-center space-x-0.5">
                                  <Check className="h-3 w-3 inline" />
                                  <span>BOM Matched</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(so.id)}
                                  className="text-indigo-600 hover:text-indigo-800 underline text-[10px] cursor-pointer"
                                >
                                  {isExpanded ? 'Hide items' : 'View lines'}
                                </button>
                              </div>
                            </td>

                            {/* Due date & Priority */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  so.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                                  so.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {so.priority}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-1">
                                Due: {so.requestedDeliveryDate}
                              </span>
                            </td>

                            {/* Order Total */}
                            <td className="py-3.5 px-4 font-mono">
                              <strong className="text-slate-900 block text-xs">
                                ₹{so.totalAmount.toLocaleString('en-IN')}
                              </strong>
                              <span className="text-[10px] text-slate-400 block">
                                GST: ₹{so.taxAmount.toLocaleString('en-IN')}
                              </span>
                            </td>

                            {/* FlowOps Status */}
                            <td className="py-3.5 px-4 font-mono">
                              {so.status === 'wo_generated' ? (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>WOs Released</span>
                                  </span>
                                  <span className="text-[10px] text-indigo-700 block mt-0.5 font-bold">
                                    {so.flowOpsOrderNumber}
                                  </span>
                                </div>
                              ) : so.status === 'imported' ? (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase">
                                    <span>Imported (SO Active)</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    {so.flowOpsOrderNumber}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    <span>Pending Import</span>
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => handleImportSingle(so)}
                                  disabled={importingSoId === so.id}
                                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white rounded-lg text-[10px] uppercase font-bold transition flex items-center space-x-1 ml-auto shadow-2xs cursor-pointer"
                                  title="Map to FlowOps and automatically generate Work Orders"
                                >
                                  <Zap className="h-3 w-3 text-amber-300" />
                                  <span>{importingSoId === so.id ? 'Importing...' : 'Import & Auto-WO'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate('/orders')}
                                  className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                  title="View on Orders Board"
                                >
                                  View Order
                                </button>
                              )}
                            </td>

                          </tr>

                          {/* Expanded Line Items Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={7} className="p-3 pl-8">
                                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Line Items Detail for {so.erpSoNumber}:
                                  </span>
                                  <div className="divide-y divide-slate-100">
                                    {so.items.map(it => (
                                      <div key={it.id} className="py-2 flex items-center justify-between text-xs font-mono">
                                        <div>
                                          <span className="font-bold text-slate-800">{it.itemName}</span>
                                          <span className="text-[10px] text-slate-400 block">
                                            Code: {it.itemCode} · Qty: {it.orderedQuantity} {it.uom} @ ₹{it.unitPrice.toLocaleString('en-IN')}/unit
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <strong className="text-slate-900 block">₹{it.lineTotal.toLocaleString('en-IN')}</strong>
                                          <span className="text-[10px] text-emerald-700 font-bold block">
                                            {it.workOrderNumber ? `Generated WO: ${it.workOrderNumber}` : 'BOM Ready for Explosion'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: WORK ORDERS GENERATED (Acceptance Criteria 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'generated_wos' && (
        <div className="space-y-4 font-mono">
          
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-3xs">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Production Work Orders Auto-Generated from ERP</span>
                <span className="text-[11px] text-emerald-800 block">
                  All listed commercial orders have been exploded into shopfloor travelers, assigned sequential WO-2026 numbers, and routed to CNC/machining centers.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <span>Open Work Orders Board</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Originating ERP SO</th>
                    <th className="py-3 px-4">FlowOps Sales Order</th>
                    <th className="py-3 px-4">Customer PO & Client</th>
                    <th className="py-3 px-4">Generated Work Orders</th>
                    <th className="py-3 px-4">Delivery Due Date</th>
                    <th className="py-3 px-4 text-right">Shopfloor Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersWithWos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No work orders generated from ERP yet. Use 'Import & Auto-WO' on the Inbound Queue.
                      </td>
                    </tr>
                  ) : (
                    ordersWithWos.map(so => (
                      <tr key={so.id} className="hover:bg-slate-50/80">
                        
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span>{so.erpSoNumber}</span>
                          <span className="text-[9px] text-slate-400 uppercase block font-normal mt-0.5">
                            Via {so.erpSystem.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          {so.flowOpsOrderNumber || 'ORD-2026-X'}
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-slate-800 block truncate max-w-[200px]">{so.customerName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono block">PO: {so.customerPoNumber}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center flex-wrap gap-1">
                            {(so.generatedWorkOrderNumbers || ['WO-2026-0042']).map(woNum => (
                              <span 
                                key={woNum}
                                className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200"
                              >
                                {woNum}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {so.requestedDeliveryDate}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                            In-Production
                          </span>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: ERP FIELD MAPPING & ROUTING ENGINE
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'mapping_rules' && (
        <div className="space-y-6 font-mono text-xs text-slate-700">
          
          {/* Architectural Diagram Box */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Automated Sales Order &rarr; Work Order Pipeline
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stage 1: Pull SO</span>
                <strong className="text-slate-800 text-xs block">Tally Prime / Oracle REST</strong>
                <p className="text-[10px] text-slate-500 font-sans">Fetches customer PO, line items, quantities, and pricing.</p>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <span className="text-[10px] text-indigo-600 font-bold uppercase block">Stage 2: Map to FlowOps</span>
                <strong className="text-indigo-950 text-xs block">FlowOps Sales Order</strong>
                <p className="text-[10px] text-slate-500 font-sans">Matches client code, resolves SKU catalogue, validates HSN/GST.</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] text-purple-600 font-bold uppercase block">Stage 3: Explode BOM</span>
                <strong className="text-purple-950 text-xs block">Engineering Multi-Level BOM</strong>
                <p className="text-[10px] text-slate-500 font-sans">Calculates raw material demand, scrap factor %, and routing operations.</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Stage 4: Release WOs</span>
                <strong className="text-emerald-950 text-xs block">WO-2026 Sequential Jobs</strong>
                <p className="text-[10px] text-slate-500 font-sans">Schedules shopfloor machining, traveler issuance, and FQC gate.</p>
              </div>
            </div>
          </div>

          {/* Field Mapping Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  FIELD TRANSFORMATION SCHEMA
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  ERP Voucher &rarr; FlowOps Sales Order & Work Order Mapping
                </h4>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <th className="py-2.5 px-4">ERP Source Field</th>
                  <th className="py-2.5 px-4">FlowOps Order Target</th>
                  <th className="py-2.5 px-4">Work Order Field</th>
                  <th className="py-2.5 px-4">Transformation Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { erp: 'VOUCHERNUMBER / OrderId', fo: 'orderNumber', wo: 'salesOrderNumber', rule: 'Preserved & cross-referenced with sequential prefix' },
                  { erp: 'PARTYNAME / CustomerCode', fo: 'customerName & customerId', wo: 'customerName', rule: 'Fuzzy match against FlowOps customer master' },
                  { erp: 'BASICBUYERADDRESS / ShipTo', fo: 'shippingAddress', wo: 'destination', rule: 'Direct mapping for factory gate pass & dispatch' },
                  { erp: 'STOCKITEMNAME / ItemCode', fo: 'items[].name / partSku', wo: 'partName & partNumber', rule: 'Matches active BOM SKU; triggers BOM explosion' },
                  { erp: 'BILLEDQTY', fo: 'items[].quantity', wo: 'plannedQuantity', rule: 'Direct integer mapping with scrap factor allowance' },
                  { erp: 'RATE / UnitPrice', fo: 'items[].unitPrice', wo: 'standardCost', rule: 'Flows to job cost rollup and gross margin analysis' },
                  { erp: 'DATE / PromisedDate', fo: 'deliveryDate', wo: 'targetCompletionDate', rule: 'Drives backward scheduling on Gantt planner' }
                ].map(r => (
                  <tr key={r.erp} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{r.erp}</td>
                    <td className="py-2.5 px-4 text-indigo-700 font-bold">{r.fo}</td>
                    <td className="py-2.5 px-4 text-emerald-800 font-bold">{r.wo}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px]">{r.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
