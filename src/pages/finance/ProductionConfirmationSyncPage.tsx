// src/pages/finance/ProductionConfirmationSyncPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  ProductionConfirmationRecord, 
  ProductionConfirmationStats,
  ConfirmationPostingConfig,
  ConfirmationErpSystem
} from '../../types/productionConfirmationSync';
import { productionConfirmationSyncService } from '../../services/productionConfirmationSyncService';
import { ProductionConfirmationDetailModal } from '../../components/finance/ProductionConfirmationDetailModal';
import { 
  CheckCheck, 
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
  DollarSign,
  Scale,
  ShieldCheck,
  AlertOctagon,
  Boxes,
  Package,
  FileCode,
  Save,
  Factory,
  Globe
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ProductionConfirmationSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, profile } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'confirmation_queue' | 'erp_vouchers' | 'payload_inspector' | 'posting_config'>('confirmation_queue');

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [bulkPushing, setBulkPushing] = useState(false);
  const [pushingRecordId, setPushingRecordId] = useState<string | null>(null);

  // Data
  const [records, setRecords] = useState<ProductionConfirmationRecord[]>([]);
  const [stats, setStats] = useState<ProductionConfirmationStats>({
    pendingConfirmationsCount: 0,
    confirmedCount: 0,
    totalFgValuationINR: 0,
    totalMaterialRelievedINR: 0,
    totalScrapBookedINR: 0,
    qualityPassedPct: 100
  });

  // Config State
  const [config, setConfig] = useState<ConfirmationPostingConfig>(productionConfirmationSyncService.getConfig(tenantId));
  const [savingConfig, setSavingConfig] = useState(false);

  // Selected item for modal
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<ProductionConfirmationRecord | null>(null);
  const [inspectorRecordId, setInspectorRecordId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | ConfirmationErpSystem>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const loadData = () => {
    setLoading(true);
    try {
      const data = productionConfirmationSyncService.getConfirmations(tenantId);
      const computedStats = productionConfirmationSyncService.getStats(tenantId);
      const conf = productionConfirmationSyncService.getConfig(tenantId);
      setRecords(data);
      setStats(computedStats);
      setConfig(conf);
      if (data.length > 0 && !inspectorRecordId) {
        setInspectorRecordId(data[0].id);
      }
    } catch (e) {
      console.error('Error loading production confirmations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('production_confirmation_updated', handleUpdate);
    return () => window.removeEventListener('production_confirmation_updated', handleUpdate);
  }, [tenantId]);

  // Bulk push
  const handleBulkPushAll = async () => {
    const pendingCount = stats.pendingConfirmationsCount;
    if (pendingCount === 0) return;

    setBulkPushing(true);
    toastInfo('Processing ERP Confirmations', `Pushing completion, material backflushing, scrap & quality to ERP...`);
    try {
      await productionConfirmationSyncService.bulkPushAllPending(tenantId, profile?.name || 'Finance Controller');
      toastSuccess('ERP Synchronized', `Successfully confirmed ${pendingCount} production order(s) in corporate ERP.`);
      loadData();
    } catch (e: any) {
      toastError('Bulk Sync Error', e.message);
    } finally {
      setBulkPushing(false);
    }
  };

  // Push single record
  const handlePushSingle = async (rec: ProductionConfirmationRecord) => {
    setPushingRecordId(rec.id);
    try {
      await productionConfirmationSyncService.pushFullProductionConfirmation(tenantId, rec.id, profile?.name || 'Finance Controller');
      toastSuccess(
        'Work Order Confirmed in ERP', 
        `Pushed FG receipt, material issue, scrap variance, and FQC release for ${rec.workOrderNumber}.`
      );
      loadData();
    } catch (e: any) {
      toastError('Push Failed', e.message);
    } finally {
      setPushingRecordId(null);
    }
  };

  // Save config
  const handleSaveConfig = () => {
    setSavingConfig(true);
    try {
      productionConfirmationSyncService.saveConfig(tenantId, config);
      toastSuccess('ERP Configuration Saved', 'Updated GL ledger mapping, Godown settings, and auto-push rules.');
    } catch (e: any) {
      toastError('Save Error', e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSystem = systemFilter === 'all' || r.erpSystem === systemFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pending' ? r.status !== 'confirmed' : r.status === 'confirmed');

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        r.workOrderNumber.toLowerCase().includes(q) ||
        r.salesOrderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        r.qualityResultsSync.cocNumber.toLowerCase().includes(q);

      return matchesSystem && matchesStatus && matchesSearch;
    });
  }, [records, systemFilter, statusFilter, searchQuery]);

  const inspectorRecord = useMemo(() => {
    return records.find(r => r.id === inspectorRecordId) || records[0];
  }, [records, inspectorRecordId]);

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase tracking-widest block leading-none">
              FINANCIAL ACCOUNTING & ERP INTEGRATION · COST CONTROLLER
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ERP Bridge Active ({config.erpSystem.toUpperCase()})</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Production Confirmation Sync to ERP
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automatically push completed production orders, raw material consumption backflushing, scrap/rework variances, and FQC quality sign-offs back to Tally Prime, Oracle Cloud, and SAP.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => navigate('/work-orders')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Inspect Shopfloor Work Orders Board"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            <span>Work Orders</span>
          </button>

          <button
            onClick={() => navigate('/invoices')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Inspect Invoices & Dispatch ERP Sync"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Invoices ERP</span>
          </button>

          <button
            onClick={() => navigate('/integrations/oracle-sap')}
            className="border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Open Enterprise Oracle Fusion & SAP S/4HANA REST API Connector"
          >
            <Globe className="h-4 w-4 text-sky-600" />
            <span>Oracle / SAP REST</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Refresh confirmation records from database"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {stats.pendingConfirmationsCount > 0 && (
            <button
              onClick={handleBulkPushAll}
              disabled={bulkPushing}
              className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{bulkPushing ? 'Processing...' : `Push All to ERP (${stats.pendingConfirmationsCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Operational KPI Strip (4 Pillars) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Metric 1: Pending Confirmations */}
        <div 
          onClick={() => {
            setActiveTab('confirmation_queue');
            setStatusFilter('pending');
          }}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            statusFilter === 'pending' && activeTab === 'confirmation_queue'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Unconfirmed Orders</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingConfirmationsCount}</span>
            <span className="text-xs text-slate-500">Orders Pending</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold truncate">
            Ready for ERP journal posting
          </div>
        </div>

        {/* Metric 2: Finished Goods Valuation */}
        <div 
          onClick={() => {
            setActiveTab('confirmation_queue');
            setStatusFilter('all');
          }}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition cursor-pointer shadow-3xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">FG Value in ERP</span>
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{(stats.totalFgValuationINR / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500">Received to Stock</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-700 font-semibold truncate">
            ₹{stats.totalFgValuationINR.toLocaleString('en-IN')} total inventory
          </div>
        </div>

        {/* Metric 3: Raw Materials Backflushed */}
        <div 
          onClick={() => setActiveTab('erp_vouchers')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition cursor-pointer shadow-3xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">RM Consumed Relieved</span>
            <Boxes className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              ₹{(stats.totalMaterialRelievedINR / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500">Cost Relieved</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            Debited to Consumption A/c
          </div>
        </div>

        {/* Metric 4: Scrap & Quality Yield */}
        <div 
          onClick={() => setActiveTab('posting_config')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-200 transition cursor-pointer shadow-3xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Scrap & FQC Yield</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.qualityPassedPct}%
            </span>
            <span className="text-xs text-slate-500">CoC Certified</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-semibold truncate">
            ₹{stats.totalScrapBookedINR.toLocaleString('en-IN')} scrap written off
          </div>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab('confirmation_queue')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'confirmation_queue'
              ? 'border-indigo-650 text-indigo-900 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CheckCheck className="h-4 w-4" />
          <span>Production Confirmation Queue ({records.length})</span>
          {stats.pendingConfirmationsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {stats.pendingConfirmationsCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('erp_vouchers')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'erp_vouchers'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Synchronized ERP Vouchers ({stats.confirmedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('payload_inspector')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'payload_inspector'
              ? 'border-purple-600 text-purple-900 bg-purple-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>ERP Payload Inspector (XML / JSON)</span>
        </button>

        <button
          onClick={() => setActiveTab('posting_config')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'posting_config'
              ? 'border-slate-800 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>ERP Posting & Cost Center Config</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: PRODUCTION CONFIRMATION QUEUE (Acceptance Criteria 1-4)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'confirmation_queue' && (
        <div className="space-y-4 font-mono">
          
          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs text-xs">
            
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search WO #, SO #, SKU, customer or CoC..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* ERP Filter */}
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
              <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pending ({stats.pendingConfirmationsCount})
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Confirmed ({stats.confirmedCount})
              </button>
            </div>

          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Work Order / Part</th>
                    <th className="py-3 px-4">Sales Order & Consignee</th>
                    <th className="py-3 px-4">Production Qty</th>
                    <th className="py-3 px-4">Confirmation Pillars Status</th>
                    <th className="py-3 px-4">FG Value / RM Cost (₹)</th>
                    <th className="py-3 px-4">ERP State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No production confirmation records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(rec => {
                      const isExpanded = !!expandedRows[rec.id];
                      const isPending = rec.status !== 'confirmed';

                      return (
                        <React.Fragment key={rec.id}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/15' : ''}`}>
                            
                            {/* WO & Part */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  rec.erpSystem === 'tally' ? 'bg-amber-100 text-amber-900' :
                                  rec.erpSystem === 'oracle' ? 'bg-sky-100 text-sky-900' : 'bg-purple-100 text-purple-900'
                                }`}>
                                  {rec.erpSystem}
                                </span>
                                <strong className="text-slate-900">{rec.workOrderNumber}</strong>
                              </div>
                              <span className="text-[11px] text-slate-800 font-bold block mt-0.5 truncate max-w-[200px]">
                                {rec.partName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Code: {rec.partCode}
                              </span>
                            </td>

                            {/* Consignee & Plant */}
                            <td className="py-3.5 px-4">
                              <strong className="text-slate-900 block truncate max-w-[190px]">
                                {rec.customerName}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                SO: {rec.salesOrderNumber} (PO: {rec.customerPoNumber})
                              </span>
                              <span className="text-[10px] text-slate-400 block flex items-center space-x-1 mt-0.5">
                                <Factory className="h-3 w-3 inline text-slate-400" />
                                <span>{rec.plantName}</span>
                              </span>
                            </td>

                            {/* Quantities */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-baseline space-x-1">
                                <strong className="text-slate-900 text-xs">
                                  {rec.quantityCompleted} {rec.uom}
                                </strong>
                                <span className="text-emerald-700 font-bold text-[10px]">FG Ready</span>
                              </div>
                              {rec.quantityScrapped > 0 ? (
                                <span className="text-[10px] text-rose-600 block mt-0.5 font-bold">
                                  {rec.quantityScrapped} {rec.uom} Scrapped
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Zero Scrap (100% yield)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleExpand(rec.id)}
                                className="text-indigo-600 hover:text-indigo-800 underline text-[10px] cursor-pointer mt-1 block"
                              >
                                {isExpanded ? 'Hide details' : 'Inspect breakdown'}
                              </button>
                            </td>

                            {/* 4 Pillars Status Badges */}
                            <td className="py-3.5 px-4">
                              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                                <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                                  rec.completionSync.status === 'posted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {rec.completionSync.status === 'posted' ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
                                  <span>1. FG Receipt</span>
                                </span>

                                <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                                  rec.materialConsumptionSync.status === 'posted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {rec.materialConsumptionSync.status === 'posted' ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
                                  <span>2. Backflush</span>
                                </span>

                                <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                                  rec.scrapReworkSync.status === 'posted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {rec.scrapReworkSync.status === 'posted' ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
                                  <span>3. Scrap</span>
                                </span>

                                <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                                  rec.qualityResultsSync.status === 'posted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {rec.qualityResultsSync.status === 'posted' ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
                                  <span>4. Quality CoC</span>
                                </span>
                              </div>
                            </td>

                            {/* Valuations */}
                            <td className="py-3.5 px-4 font-mono">
                              <strong className="text-slate-900 block text-xs">
                                FG: ₹{rec.completionSync.fgValuationINR.toLocaleString('en-IN')}
                              </strong>
                              <span className="text-[10px] text-slate-500 block">
                                RM: ₹{rec.materialConsumptionSync.totalMaterialCostINR.toLocaleString('en-IN')}
                              </span>
                            </td>

                            {/* ERP Status */}
                            <td className="py-3.5 px-4 font-mono">
                              {rec.status === 'confirmed' ? (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>ERP Posted</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                                    {rec.completionSync.voucherNumber}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    <span>Pending Push</span>
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => setSelectedRecordForModal(rec)}
                                  className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                  title="Inspect full 4-pillar confirmation details"
                                >
                                  Inspect
                                </button>

                                {isPending && (
                                  <button
                                    onClick={() => handlePushSingle(rec)}
                                    disabled={pushingRecordId === rec.id}
                                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white rounded-lg text-[10px] uppercase font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                                    title="Push production completion, material consumption, scrap, and quality to ERP"
                                  >
                                    <Zap className="h-3 w-3 text-amber-300" />
                                    <span>{pushingRecordId === rec.id ? 'Pushing...' : 'Push to ERP'}</span>
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>

                          {/* Expanded Breakdown */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={7} className="p-4 pl-8">
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 font-mono text-xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <strong className="text-slate-900 uppercase text-[11px]">
                                      Comprehensive Production & Costing Audit for {rec.workOrderNumber}
                                    </strong>
                                    <span className="text-[10px] text-slate-500">
                                      CoC Ref: {rec.qualityResultsSync.cocNumber}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* RM Backflush */}
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                        Backflushed Raw Materials:
                                      </span>
                                      <ul className="mt-1 space-y-1 text-[11px]">
                                        {rec.materialConsumptionSync.materials.map(m => (
                                          <li key={m.id} className="flex justify-between">
                                            <span>{m.itemName.slice(0, 24)}... (x{m.actualConsumedQty})</span>
                                            <strong>₹{m.totalCostINR.toLocaleString('en-IN')}</strong>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Scrap Breakdown */}
                                    <div className="p-3 bg-rose-50/60 rounded-lg">
                                      <span className="text-[10px] text-rose-700 font-bold uppercase block">
                                        Scrap & Rework Expense:
                                      </span>
                                      <div className="mt-1 text-[11px] text-rose-950 space-y-0.5">
                                        <div>Scrapped: <strong>{rec.scrapReworkSync.quantityScrapped} {rec.uom}</strong> (₹{rec.scrapReworkSync.scrapLossAmountINR.toLocaleString('en-IN')})</div>
                                        <div>Rework Hours: <strong>{rec.scrapReworkSync.reworkHours}h</strong> (₹{rec.scrapReworkSync.reworkLaborCostINR.toLocaleString('en-IN')})</div>
                                        <div className="text-[10px] text-slate-500">Reason: {rec.scrapReworkSync.scrapReasonDescription}</div>
                                      </div>
                                    </div>

                                    {/* Quality Release */}
                                    <div className="p-3 bg-emerald-50/60 rounded-lg">
                                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                                        FQC & Quality Conformance:
                                      </span>
                                      <div className="mt-1 text-[11px] text-emerald-950 space-y-0.5">
                                        <div>Inspector: <strong>{rec.qualityResultsSync.inspectorBadgeId}</strong></div>
                                        <div>Passed Qty: <strong>{rec.qualityResultsSync.passedQuantity}</strong> ({rec.qualityResultsSync.overallResult.toUpperCase()})</div>
                                        <div>Hold State: <strong>{rec.qualityResultsSync.qualityHoldStatus.toUpperCase()}</strong></div>
                                      </div>
                                    </div>
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
          TAB 2: SYNCHRONIZED ERP VOUCHERS (Audited Completed)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'erp_vouchers' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-3xs">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Production Confirmation Vouchers Reconciled in ERP</span>
                <span className="text-[11px] text-emerald-800 block">
                  All listed manufacturing orders have successfully posted Finished Goods receipts, debited consumption ledgers, and relieved raw material lots.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <span>View Finance Invoices</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">ERP Voucher Number</th>
                    <th className="py-3 px-4">Originating Work Order</th>
                    <th className="py-3 px-4">Finished Goods Inward</th>
                    <th className="py-3 px-4">Raw Materials Backflushed</th>
                    <th className="py-3 px-4">Posting Timestamp</th>
                    <th className="py-3 px-4 text-right">Audit Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.filter(r => r.status === 'confirmed').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No reconciled vouchers yet. Push pending confirmations from Queue.
                      </td>
                    </tr>
                  ) : (
                    records.filter(r => r.status === 'confirmed').map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span>{rec.completionSync.voucherNumber || 'TALLY-MFG-001'}</span>
                          <span className="text-[9px] text-slate-400 uppercase block font-normal mt-0.5">
                            Type: {rec.erpSystem.toUpperCase()} Mfg Journal
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          {rec.workOrderNumber}
                          <span className="text-[10px] text-slate-500 block font-normal">{rec.customerName}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <strong className="text-slate-900">{rec.quantityCompleted} {rec.uom}</strong>
                          <span className="text-[10px] text-slate-500 block">₹{rec.completionSync.fgValuationINR.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <strong className="text-slate-900">₹{rec.materialConsumptionSync.totalMaterialCostINR.toLocaleString('en-IN')}</strong>
                          <span className="text-[10px] text-slate-500 block">{rec.materialConsumptionSync.materials.length} line item(s) relieved</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {rec.lastSyncedAt ? new Date(rec.lastSyncedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Reconciled
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
          TAB 3: LIVE ERP PAYLOAD INSPECTOR (XML / JSON)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'payload_inspector' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Select Work Order to Inspect:</span>
              <select
                value={inspectorRecordId}
                onChange={e => setInspectorRecordId(e.target.value)}
                className="mt-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {records.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.workOrderNumber} — {r.partName} ({r.erpSystem.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500 font-bold">
                Format: {inspectorRecord?.erpSystem === 'tally' ? 'Tally XML Envelope' : 'REST JSON Payload'}
              </span>
            </div>
          </div>

          {inspectorRecord && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-xs">
                <span className="font-bold text-white flex items-center space-x-2">
                  <FileCode className="h-4 w-4 text-emerald-400" />
                  <span>Payload for {inspectorRecord.workOrderNumber} &rarr; {inspectorRecord.erpSystem.toUpperCase()}</span>
                </span>
                <span className="text-[10px] text-slate-500">UTF-8 Encoded</span>
              </div>
              <pre className="mt-3 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed select-text">
                {inspectorRecord.erpPayloadXmlOrJson || (
                  inspectorRecord.erpSystem === 'tally'
                    ? productionConfirmationSyncService.generateTallyMfgJournalXml(inspectorRecord, config)
                    : inspectorRecord.erpSystem === 'oracle'
                    ? productionConfirmationSyncService.generateOracleWipTxnJson(inspectorRecord, config)
                    : productionConfirmationSyncService.generateSapGoodsReceiptJson(inspectorRecord, config)
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: ERP POSTING & COST CENTER CONFIGURATION
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'posting_config' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  GENERAL LEDGER & INVENTORY POSTING RULES
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Corporate ERP Account Mapping Configuration
                </h3>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>

            {/* Target ERP Switcher */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-slate-800 block text-xs">Default Corporate ERP Destination</strong>
                <span className="text-[11px] text-slate-500">Determines default payload format and journal schema.</span>
              </div>
              <div className="flex items-center space-x-2">
                {(['tally', 'oracle', 'sap'] as const).map(sys => (
                  <button
                    key={sys}
                    onClick={() => setConfig(prev => ({ ...prev, erpSystem: sys }))}
                    className={`px-3 py-1.5 rounded text-xs uppercase font-bold transition cursor-pointer ${
                      config.erpSystem === sys ? 'bg-indigo-650 text-white shadow-2xs' : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>

            {/* Tally Settings */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-amber-800">
                Tally Prime Manufacturing Journal Mapping
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Voucher Type Name
                  </label>
                  <input
                    type="text"
                    value={config.tallyConfig.mfgJournalVoucherType}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      tallyConfig: { ...prev.tallyConfig, mfgJournalVoucherType: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Finished Goods Ledger Name
                  </label>
                  <input
                    type="text"
                    value={config.tallyConfig.fgLedger}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      tallyConfig: { ...prev.tallyConfig, fgLedger: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Raw Material Consumption Ledger
                  </label>
                  <input
                    type="text"
                    value={config.tallyConfig.rawMaterialConsumptionLedger}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      tallyConfig: { ...prev.tallyConfig, rawMaterialConsumptionLedger: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Manufacturing Scrap & Spoilage Expense A/c
                  </label>
                  <input
                    type="text"
                    value={config.tallyConfig.scrapExpenseLedger}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      tallyConfig: { ...prev.tallyConfig, scrapExpenseLedger: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Oracle Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-sky-800">
                Oracle Cloud SCM / WIP Completion Mapping
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Inventory Organization Code
                  </label>
                  <input
                    type="text"
                    value={config.oracleConfig.inventoryOrgCode}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      oracleConfig: { ...prev.oracleConfig, inventoryOrgCode: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    WIP Completion Subinventory
                  </label>
                  <input
                    type="text"
                    value={config.oracleConfig.wipCompletionSubinventory}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      oracleConfig: { ...prev.oracleConfig, wipCompletionSubinventory: e.target.value }
                    }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecordForModal && (
        <ProductionConfirmationDetailModal
          isOpen={!!selectedRecordForModal}
          onClose={() => setSelectedRecordForModal(null)}
          record={selectedRecordForModal}
          tenantId={tenantId}
          onUpdated={loadData}
        />
      )}

    </div>
  );
};
