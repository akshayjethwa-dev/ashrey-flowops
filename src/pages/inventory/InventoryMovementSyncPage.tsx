// src/pages/inventory/InventoryMovementSyncPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  InventoryMovementSyncRecord, 
  InventoryMovementSyncStats, 
  InventoryMovementSyncConfig,
  InventoryMovementType,
  MovementSyncStatus,
  MovementSyncMode,
  InventoryErpSystem
} from '../../types/inventoryMovementSync';
import { inventoryMovementSyncService } from '../../services/inventoryMovementSyncService';
import { InventoryMovementDetailModal } from '../../components/inventory/InventoryMovementDetailModal';
import { 
  ArrowRightLeft, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Zap, 
  FileText, 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  Boxes, 
  Layers, 
  SlidersHorizontal, 
  ShieldAlert, 
  Save, 
  Calendar, 
  MapPin, 
  ExternalLink,
  ChevronDown,
  Building2,
  FileCode,
  Server
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const InventoryMovementSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, profile } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard_view' | 'error_queue' | 'vouchers_audit' | 'sync_config'>('dashboard_view');

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Data & Config
  const [movements, setMovements] = useState<InventoryMovementSyncRecord[]>([]);
  const [stats, setStats] = useState<InventoryMovementSyncStats>({
    totalMovements: 0,
    syncedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalValueSyncedINR: 0,
    avgSyncLatencyMs: 240,
    syncSuccessRatePct: 100
  });
  const [config, setConfig] = useState<InventoryMovementSyncConfig>(inventoryMovementSyncService.getConfig(tenantId));
  const [savingConfig, setSavingConfig] = useState(false);

  // Modals & Inspection
  const [selectedMovementForModal, setSelectedMovementForModal] = useState<InventoryMovementSyncRecord | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | InventoryMovementType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MovementSyncStatus>('all');
  const [systemFilter, setSystemFilter] = useState<'all' | InventoryErpSystem>('all');

  const loadData = () => {
    setLoading(true);
    try {
      const records = inventoryMovementSyncService.getMovements(tenantId);
      const computedStats = inventoryMovementSyncService.getStats(tenantId);
      const conf = inventoryMovementSyncService.getConfig(tenantId);
      setMovements(records);
      setStats(computedStats);
      setConfig(conf);
    } catch (e) {
      console.error('Error loading inventory movements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('inventory_movement_updated', handleUpdate);
    return () => window.removeEventListener('inventory_movement_updated', handleUpdate);
  }, [tenantId]);

  // Push single item
  const handleSyncSingle = async (rec: InventoryMovementSyncRecord) => {
    setSyncingId(rec.id);
    try {
      await inventoryMovementSyncService.syncSingleMovement(tenantId, rec.id);
      toastSuccess('Movement Synchronized', `Pushed ${rec.movementNumber} (${rec.itemName}) to ${rec.erpSystem.toUpperCase()}.`);
      loadData();
    } catch (e: any) {
      toastError('Sync Failed', e.message);
    } finally {
      setSyncingId(null);
    }
  };

  // Retry single failed
  const handleRetrySingle = async (rec: InventoryMovementSyncRecord) => {
    setSyncingId(rec.id);
    try {
      await inventoryMovementSyncService.retryFailedMovement(tenantId, rec.id);
      toastSuccess('Error Resolved', `Successfully posted ${rec.movementNumber} to ERP.`);
      loadData();
    } catch (e: any) {
      toastError('Retry Failed', e.message);
    } finally {
      setSyncingId(null);
    }
  };

  // Bulk batch sync
  const handleRunBatchSync = async () => {
    const pendingCount = stats.pendingCount;
    if (pendingCount === 0) return;

    setSyncingAll(true);
    toastInfo('Processing Batch Sync', `Transmitting ${pendingCount} inventory movements to ERP...`);
    try {
      await inventoryMovementSyncService.triggerBatchSync(tenantId);
      toastSuccess('Batch Sync Complete', `All ${pendingCount} movements updated in corporate ERP stock.`);
      loadData();
    } catch (e: any) {
      toastError('Batch Sync Error', e.message);
    } finally {
      setSyncingAll(false);
    }
  };

  // Retry all failed
  const handleRetryAllErrors = async () => {
    const failedCount = stats.failedCount;
    if (failedCount === 0) return;

    setRetryingAll(true);
    toastInfo('Retrying Error Queue', `Re-attempting ${failedCount} quarantined movements...`);
    try {
      await inventoryMovementSyncService.retryAllFailed(tenantId);
      toastSuccess('Error Queue Cleared', `Successfully retried all ${failedCount} movements.`);
      loadData();
    } catch (e: any) {
      toastError('Retry Error', e.message);
    } finally {
      setRetryingAll(false);
    }
  };

  // Save configuration
  const handleSaveConfig = () => {
    setSavingConfig(true);
    try {
      inventoryMovementSyncService.saveConfig(tenantId, config);
      toastSuccess('Configuration Saved', `Updated sync mode to ${config.syncMode.toUpperCase()} with ${config.batchIntervalMinutes}m interval.`);
    } catch (e: any) {
      toastError('Save Error', e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle sync mode quick action
  const handleToggleSyncMode = (newMode: MovementSyncMode) => {
    const updated = { ...config, syncMode: newMode };
    setConfig(updated);
    inventoryMovementSyncService.saveConfig(tenantId, updated);
    toastInfo('Sync Mode Switched', `Switched to ${newMode === 'real_time' ? 'Instant Real-Time' : 'Scheduled Batch'} sync.`);
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesSystem = systemFilter === 'all' || m.erpSystem === systemFilter;

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        m.movementNumber.toLowerCase().includes(q) ||
        m.referenceNumber.toLowerCase().includes(q) ||
        m.itemName.toLowerCase().includes(q) ||
        m.itemCode.toLowerCase().includes(q) ||
        m.lotNumber.toLowerCase().includes(q) ||
        m.sourceLocation.toLowerCase().includes(q) ||
        m.targetLocation.toLowerCase().includes(q) ||
        (m.erpVoucherNumber && m.erpVoucherNumber.toLowerCase().includes(q));

      return matchesType && matchesStatus && matchesSystem && matchesSearch;
    });
  }, [movements, typeFilter, statusFilter, systemFilter, searchQuery]);

  const failedMovements = useMemo(() => {
    return movements.filter(m => m.status === 'failed');
  }, [movements]);

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase tracking-widest block leading-none">
              STORE KEEPER & WAREHOUSE LOGISTICS · ERP MOVEMENT SYNC
            </span>
            <span className="text-slate-300">·</span>
            
            {/* Real-time vs Batch Status Indicator */}
            {config.syncMode === 'real_time' ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Real-Time Sync Active (0s Latency)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <Clock className="h-3 w-3 text-sky-600" />
                <span>Scheduled Batch (Every {config.batchIntervalMinutes}m)</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Inventory Movement Sync
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time and scheduled batch synchronization of Goods Receipts (GRN), Material Issues to shopfloor CNC work centers, and Finished Goods Receipts into corporate ERP inventory.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => navigate('/inventory')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Inspect Multi-Location Stock Matrix & Bin Hierarchy"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            <span>Inventory Hub</span>
          </button>

          <button
            onClick={() => navigate('/production-confirmation-sync')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Inspect Production Order Confirmations"
          >
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
            <span>Production ERP</span>
          </button>

          <button
            onClick={() => navigate('/integrations/tally')}
            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Open Tally Connector (XML/HTTP Gateway, ODBC Fallback, GST Sync)"
          >
            <Server className="h-4 w-4 text-amber-600" />
            <span>Tally Connector</span>
          </button>

          {stats.failedCount > 0 && (
            <button
              onClick={handleRetryAllErrors}
              disabled={retryingAll}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white text-xs uppercase font-extrabold tracking-wider px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
              title="Re-attempt failed movements in the error queue"
            >
              <RotateCcw className={`h-4 w-4 ${retryingAll ? 'animate-spin' : ''}`} />
              <span>{retryingAll ? 'Retrying...' : `Retry Errors (${stats.failedCount})`}</span>
            </button>
          )}

          {stats.pendingCount > 0 && (
            <button
              onClick={handleRunBatchSync}
              disabled={syncingAll}
              className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{syncingAll ? 'Posting...' : `Run Batch Sync (${stats.pendingCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Operational KPI Strip (Sync Status Dashboard - Acceptance Criteria 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Card 1: Synced Movements */}
        <div 
          onClick={() => {
            setActiveTab('dashboard_view');
            setStatusFilter('synced');
          }}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            statusFilter === 'synced' && activeTab === 'dashboard_view'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Synced to ERP</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">{stats.syncedCount}</span>
            <span className="text-xs text-slate-500">Movements Live</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            ₹{stats.totalValueSyncedINR.toLocaleString('en-IN')} updated in ERP
          </div>
        </div>

        {/* Card 2: Pending In-Queue */}
        <div 
          onClick={() => {
            setActiveTab('dashboard_view');
            setStatusFilter('pending');
          }}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            statusFilter === 'pending' && activeTab === 'dashboard_view'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Transmission</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingCount}</span>
            <span className="text-xs text-slate-500">Awaiting Sync</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold truncate">
            {config.syncMode === 'real_time' ? 'Transmitting immediately' : `Batch interval: ${config.batchIntervalMinutes}m`}
          </div>
        </div>

        {/* Card 3: Error Queue (Acceptance Criteria 2) */}
        <div 
          onClick={() => setActiveTab('error_queue')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'error_queue' || stats.failedCount > 0
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Error Queue (Triage)</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-700 tracking-tight">{stats.failedCount}</span>
            <span className="text-xs text-slate-500">Quarantined</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-semibold truncate">
            {stats.failedCount > 0 ? 'Click to inspect & retry errors' : 'Zero sync errors'}
          </div>
        </div>

        {/* Card 4: Real-Time Latency & Mode Controller (Acceptance Criteria 1) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-3xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Transmission Mode</span>
            <span className="text-[10px] text-emerald-700 font-bold">{stats.syncSuccessRatePct}% Success</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-slate-800">
              {config.syncMode === 'real_time' ? 'Instant Push' : 'Scheduled'}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleToggleSyncMode('real_time')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                  config.syncMode === 'real_time' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Real-Time
              </button>
              <button
                onClick={() => handleToggleSyncMode('scheduled_batch')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                  config.syncMode === 'scheduled_batch' ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Batch
              </button>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 truncate">
            Avg roundtrip: {stats.avgSyncLatencyMs}ms via {config.erpSystem.toUpperCase()}
          </span>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab('dashboard_view')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'dashboard_view'
              ? 'border-indigo-650 text-indigo-900 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Sync Status Dashboard ({movements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('error_queue')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'error_queue'
              ? 'border-rose-600 text-rose-900 bg-rose-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-600" />
          <span>Error Queue ({failedMovements.length})</span>
          {failedMovements.length > 0 && (
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
              Action Required
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('vouchers_audit')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'vouchers_audit'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Reconciled ERP Vouchers ({stats.syncedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('sync_config')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'sync_config'
              ? 'border-slate-800 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Sync Scheduling & Godown Config</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: SYNC STATUS DASHBOARD (Acceptance Criteria 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard_view' && (
        <div className="space-y-4 font-mono text-xs">
          
          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search movement #, PO, WO, SKU, lot, or location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Movement Type Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Type:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <option value="all">All Movements</option>
                  <option value="goods_receipt">Goods Receipt (GRN)</option>
                  <option value="material_issue">Material Issue (WIP)</option>
                  <option value="finished_goods_receipt">Finished Goods Receipt</option>
                </select>
              </div>

              {/* ERP Filter */}
              <div className="flex items-center space-x-1">
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
                onClick={() => setStatusFilter('synced')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'synced' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Synced ({stats.syncedCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pending ({stats.pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'failed' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Failed ({stats.failedCount})
              </button>
            </div>

          </div>

          {/* Movements Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Movement # / Type</th>
                    <th className="py-3 px-4">Stock SKU & Lot</th>
                    <th className="py-3 px-4">Logistics Route (From &rarr; To)</th>
                    <th className="py-3 px-4">Quantity & Value (₹)</th>
                    <th className="py-3 px-4">ERP Voucher Reference</th>
                    <th className="py-3 px-4">Sync State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No inventory movements found matching specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map(m => {
                      const isPending = m.status === 'pending';
                      const isFailed = m.status === 'failed';

                      return (
                        <tr key={m.id} className={`hover:bg-slate-50/80 transition-colors ${
                          isFailed ? 'bg-rose-50/20' : isPending ? 'bg-amber-50/15' : ''
                        }`}>
                          
                          {/* Movement # & Type */}
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block">{m.movementNumber}</strong>
                            <div className="mt-1">
                              {m.type === 'goods_receipt' ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold text-[9px] uppercase">
                                  <ArrowDownLeft className="h-3 w-3" />
                                  <span>Goods Receipt</span>
                                </span>
                              ) : m.type === 'material_issue' ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase">
                                  <ArrowUpRight className="h-3 w-3" />
                                  <span>Material Issue</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                                  <Package className="h-3 w-3" />
                                  <span>FG Receipt</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {m.referenceNumber}</span>
                          </td>

                          {/* SKU & Lot */}
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block truncate max-w-[200px]">{m.itemName}</strong>
                            <span className="text-[10px] text-slate-500 block">SKU: {m.itemCode}</span>
                            <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">Lot: {m.lotNumber}</span>
                          </td>

                          {/* Route */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block truncate max-w-[210px]">
                                From: <strong className="text-slate-700">{m.sourceLocation}</strong>
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[210px]">
                                To: <strong className="text-indigo-950 font-bold">{m.targetLocation}</strong>
                              </span>
                            </div>
                          </td>

                          {/* Quantity & Value */}
                          <td className="py-3.5 px-4 font-mono">
                            <strong className="text-slate-900 block text-xs">
                              {m.quantity} {m.uom}
                            </strong>
                            <span className="text-[11px] text-emerald-700 font-bold block">
                              ₹{m.totalValueINR.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* ERP Voucher Ref */}
                          <td className="py-3.5 px-4 font-mono">
                            {m.erpVoucherNumber ? (
                              <div>
                                <strong className="text-slate-900 block">{m.erpVoucherNumber}</strong>
                                <span className="text-[10px] text-slate-400 block">
                                  {m.erpSystem.toUpperCase()} {m.erpVoucherType || 'Voucher'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 block italic">Awaiting transmission</span>
                            )}
                          </td>

                          {/* Sync State */}
                          <td className="py-3.5 px-4">
                            {m.status === 'synced' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Synced</span>
                              </span>
                            ) : m.status === 'failed' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase">
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                <span>Failed (Error)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Pending Batch</span>
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 block mt-0.5 uppercase">
                              {m.syncMode === 'real_time' ? 'Real-Time' : 'Batch'}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedMovementForModal(m)}
                                className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                title="Inspect movement payload & audit history"
                              >
                                View
                              </button>

                              {isFailed ? (
                                <button
                                  onClick={() => handleRetrySingle(m)}
                                  disabled={syncingId === m.id}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1"
                                  title="Retry failed movement sync to ERP"
                                >
                                  <RotateCcw className={`h-3 w-3 ${syncingId === m.id ? 'animate-spin' : ''}`} />
                                  <span>Retry</span>
                                </button>
                              ) : isPending ? (
                                <button
                                  onClick={() => handleSyncSingle(m)}
                                  disabled={syncingId === m.id}
                                  className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                                  title="Push movement to ERP now"
                                >
                                  <Zap className="h-3 w-3 text-amber-300" />
                                  <span>Sync</span>
                                </button>
                              ) : null}
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

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: ERROR QUEUE & RETRY DESK (Acceptance Criteria 2)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'error_queue' && (
        <div className="space-y-4 font-mono text-xs">
          
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-3xs">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">Quarantined Movements Error Queue</span>
                <span className="text-[11px] text-rose-800 block">
                  Movements that failed transmission due to ERP socket timeouts, unmapped Godowns, or locked financial accounting periods.
                </span>
              </div>
            </div>
            {failedMovements.length > 0 && (
              <button
                onClick={handleRetryAllErrors}
                disabled={retryingAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white text-[11px] uppercase font-extrabold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <RotateCcw className={`h-4 w-4 ${retryingAll ? 'animate-spin' : ''}`} />
                <span>Retry All ({failedMovements.length})</span>
              </button>
            )}
          </div>

          {failedMovements.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <strong className="text-slate-800 block">Error Queue is Empty</strong>
              <p className="text-xs text-slate-500 mt-1">All inventory movements have successfully posted to corporate ERP.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedMovements.map(m => (
                <div key={m.id} className="p-4 bg-white border border-rose-200 rounded-xl shadow-3xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px] uppercase">
                          {m.lastError?.errorCode || 'ERR_ERP_SYNC'}
                        </span>
                        <strong className="text-slate-900 text-xs">{m.movementNumber}</strong>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-700 font-bold">{m.itemName} (x{m.quantity} {m.uom})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Route: {m.sourceLocation} &rarr; {m.targetLocation} · Logged by {m.operatorName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedMovementForModal(m)}
                        className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                      >
                        Inspect Payload
                      </button>

                      <button
                        onClick={() => handleRetrySingle(m)}
                        disabled={syncingId === m.id}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${syncingId === m.id ? 'animate-spin' : ''}`} />
                        <span>{syncingId === m.id ? 'Retrying...' : 'Retry Now'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1 text-[11px] text-rose-950">
                    <div><strong>Error Diagnosis:</strong> {m.lastError?.errorMessage}</div>
                    <div className="text-slate-600"><strong>Remediation:</strong> {m.lastError?.suggestedFix}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: RECONCILED ERP VOUCHERS
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'vouchers_audit' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">ERP Voucher Number</th>
                    <th className="py-3 px-4">FlowOps Movement</th>
                    <th className="py-3 px-4">SKU & Movement Type</th>
                    <th className="py-3 px-4">Quantity & Value</th>
                    <th className="py-3 px-4">Synchronized At</th>
                    <th className="py-3 px-4 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {movements.filter(m => m.status === 'synced').map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.erpVoucherNumber}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {m.erpSystem.toUpperCase()} {m.erpVoucherType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        {m.movementNumber}
                        <span className="text-[10px] text-slate-500 block font-normal">Ref: {m.referenceNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-800 block truncate max-w-[190px]">{m.itemName}</strong>
                        <span className="text-[10px] text-slate-400 block uppercase">{m.type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{m.quantity} {m.uom}</strong>
                        <span className="text-[11px] text-emerald-700 font-bold block">₹{m.totalValueINR.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {m.syncedAt ? new Date(m.syncedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Reconciled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: SYNC SCHEDULING & CONFIGURATION (Acceptance Criteria 1)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'sync_config' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  TRANSMISSION MODE & SCHEDULING DISCIPLINE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Store Keeper Inventory Movement Sync Rules
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sync Mode Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Transmission Engine Mode</span>
                <div className="flex items-center space-x-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="syncMode"
                      value="real_time"
                      checked={config.syncMode === 'real_time'}
                      onChange={() => setConfig(prev => ({ ...prev, syncMode: 'real_time' }))}
                      className="text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Real-Time Sync (Instant On Barcode Scan)</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="radio"
                      name="syncMode"
                      value="scheduled_batch"
                      checked={config.syncMode === 'scheduled_batch'}
                      onChange={() => setConfig(prev => ({ ...prev, syncMode: 'scheduled_batch' }))}
                      className="text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Scheduled Batch Sync (Accumulated Intervals)</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Real-time transmits vouchers within 500ms of barcode receipt/issue. Scheduled batch aggregates transactions to minimize ERP server load.
                </p>
              </div>

              {/* Batch Interval */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Batch Flush Interval</span>
                <select
                  value={config.batchIntervalMinutes}
                  onChange={e => setConfig(prev => ({ ...prev, batchIntervalMinutes: Number(e.target.value) }))}
                  disabled={config.syncMode === 'real_time'}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold disabled:opacity-50"
                >
                  <option value={15}>Every 15 Minutes</option>
                  <option value={30}>Every 30 Minutes</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={240}>Every 4 Hours</option>
                  <option value={480}>Shift End (8 Hours)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Applies when Scheduled Batch mode is active.
                </span>
              </div>

            </div>

            {/* Error Queue & Auto-Retry Rules */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Error Queue & Auto-Retry Thresholds
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="autoRetry"
                    checked={config.autoRetryFailed}
                    onChange={e => setConfig(prev => ({ ...prev, autoRetryFailed: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="autoRetry" className="cursor-pointer text-xs font-bold text-slate-800">
                    Auto-Retry Network Timeouts
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Max Auto-Retry Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={config.maxAutoRetries}
                    onChange={e => setConfig(prev => ({ ...prev, maxAutoRetries: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Default ERP Target
                  </label>
                  <select
                    value={config.erpSystem}
                    onChange={e => setConfig(prev => ({ ...prev, erpSystem: e.target.value as any }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold"
                  >
                    <option value="tally">Tally Prime (XML/ODBC)</option>
                    <option value="oracle">Oracle Cloud SCM (REST)</option>
                    <option value="sap">SAP S/4HANA (BAPI/OData)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Movement Detail Modal */}
      {selectedMovementForModal && (
        <InventoryMovementDetailModal
          isOpen={!!selectedMovementForModal}
          onClose={() => setSelectedMovementForModal(null)}
          record={selectedMovementForModal}
          tenantId={tenantId}
          onUpdated={loadData}
        />
      )}

    </div>
  );
};
