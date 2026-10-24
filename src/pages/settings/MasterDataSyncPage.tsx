// src/pages/settings/MasterDataSyncPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  MasterDataEntityType, 
  SyncDirection, 
  MasterDataConflict, 
  MasterDataSyncLog, 
  MasterDataSyncConfig, 
  MasterDataEntityItem,
  ChartOfAccountRecord,
  ConflictResolutionPolicy
} from '../../types/masterDataSync';
import { masterDataSyncService } from '../../services/masterDataSyncService';
import { MasterDataConflictModal } from '../../components/sync/MasterDataConflictModal';
import { SyncPayloadInspectorModal } from '../../components/sync/SyncPayloadInspectorModal';
import { 
  FolderSync, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  Check, 
  FileCode, 
  Package, 
  Layers, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  ShieldCheck, 
  ExternalLink,
  Save,
  Activity,
  Play,
  Settings,
  ShoppingBag,
  CheckCheck,
  ArrowRightLeft,
  Server,
  Globe
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const MasterDataSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'entities' | 'conflicts' | 'logs' | 'config'>('entities');

  // Core Data States
  const [config, setConfig] = useState<MasterDataSyncConfig>(masterDataSyncService.getConfig(tenantId));
  const [entities, setEntities] = useState<MasterDataEntityItem[]>([]);
  const [conflicts, setConflicts] = useState<MasterDataConflict[]>([]);
  const [logs, setLogs] = useState<MasterDataSyncLog[]>([]);

  // Syncing / Loading States
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  // Modals
  const [selectedConflictForModal, setSelectedConflictForModal] = useState<MasterDataConflict | null>(null);
  const [selectedLogForModal, setSelectedLogForModal] = useState<MasterDataSyncLog | null>(null);

  // Filters for Entities Tab
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | MasterDataEntityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'conflict' | 'pending'>('all');

  // Load Data
  const loadData = () => {
    setLoading(true);
    const loadedConfig = masterDataSyncService.getConfig(tenantId);
    const loadedEntities = masterDataSyncService.getMasterEntities(tenantId);
    const loadedConflicts = masterDataSyncService.getConflicts(tenantId);
    const loadedLogs = masterDataSyncService.getSyncLogs(tenantId);

    setConfig(loadedConfig);
    setEntities(loadedEntities);
    setConflicts(loadedConflicts);
    setLogs(loadedLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Execute Full Bi-directional Sync
  const handleRunFullSync = async () => {
    setSyncingAll(true);
    toastInfo('Bi-Directional Sync Initiated', 'Exchanging item master, BOMs, vendors, clients, and GL accounts with ERP...');
    try {
      const resLog = await masterDataSyncService.executeSync(tenantId, 'all', 'bi_directional');
      toastSuccess(
        'Master Data Synchronized', 
        `Processed ${resLog.recordsProcessed} records. ${resLog.recordsUpdated} updated, ${resLog.conflictsFound} conflicts flagged.`,
        5000
      );
      loadData();
    } catch (err: any) {
      toastError('Sync Failed', err.message || 'ERP gateway error');
    } finally {
      setSyncingAll(false);
    }
  };

  // Execute Single Entity Sync
  const handleSyncSingleEntity = async (type: MasterDataEntityType) => {
    setSyncingEntity(type);
    try {
      const resLog = await masterDataSyncService.executeSync(tenantId, type, 'bi_directional');
      toastSuccess(`${type.toUpperCase()} Master Synced`, `Processed ${resLog.recordsProcessed} items with ERP.`);
      loadData();
    } catch (err: any) {
      toastError(`Failed syncing ${type}`, err.message);
    } finally {
      setSyncingEntity(null);
    }
  };

  // Test ERP Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await masterDataSyncService.testConnection(config);
      setConnectionTestResult(res);
      toastSuccess('Connection Verified', `ERP responded in ${res.latencyMs}ms with 200 OK.`);
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Failed to ping ERP server'
      });
      toastError('Connection Error', 'Could not reach ERP endpoint.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Conflict Resolution Handler
  const handleResolveConflict = (conflict: MasterDataConflict, resolution: 'flowops' | 'erp' | 'custom_merged', notes?: string) => {
    try {
      masterDataSyncService.resolveConflict(
        tenantId,
        conflict.id,
        resolution,
        'IT Administrator',
        notes
      );
      toastSuccess('Conflict Reconciled', `Applied ${resolution} version for ${conflict.entityIdentifier}.`);
      loadData();
    } catch (err: any) {
      toastError('Resolution Error', err.message);
    }
  };

  // Filtered Master Entities
  const filteredEntities = useMemo(() => {
    return entities.filter(ent => {
      const matchesType = entityTypeFilter === 'all' || ent.entityType === entityTypeFilter;
      const matchesStatus = statusFilter === 'all' || ent.syncStatus === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        ent.code.toLowerCase().includes(q) ||
        ent.name.toLowerCase().includes(q) ||
        (ent.erpReferenceId && ent.erpReferenceId.toLowerCase().includes(q));

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [entities, entityTypeFilter, statusFilter, searchQuery]);

  const pendingConflictsCount = conflicts.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-indigo-650 uppercase tracking-widest block leading-none">
              ENTERPRISE INTEGRATION · IT ADMINISTRATION
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
              ERP Bridge Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Master Data Synchronization & ERP Bridge
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Bi-directional synchronization of Item Master, Bills of Material (BOMs), Suppliers, Customers, and Charts of Accounts between FlowOps and corporate ERP ({config.erpSystem.toUpperCase()}).
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => navigate('/sales-orders/erp-sync')}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Sales Order Sync & Work Order Auto-Generation"
          >
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            <span>Sales Orders Sync</span>
          </button>

          <button
            onClick={() => navigate('/production-confirmation-sync')}
            className="border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Production Confirmation Sync (FG, Materials, Scrap & Quality to ERP)"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            <span>Production Confirmation</span>
          </button>

          <button
            onClick={() => navigate('/inventory/movement-sync')}
            className="border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Store Keeper Inventory Movement Sync (Goods Receipt, Material Issue, FG Receipt)"
          >
            <ArrowRightLeft className="h-4 w-4 text-sky-600" />
            <span>Inventory Movement Sync</span>
          </button>

          <button
            onClick={() => navigate('/integrations/tally')}
            className="border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Tally Connector (India-Specific: XML/HTTP, ODBC Fallback, GST Sync)"
          >
            <Server className="h-4 w-4 text-amber-600" />
            <span>Tally Connector</span>
          </button>

          <button
            onClick={() => navigate('/integrations/oracle-sap')}
            className="border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Oracle / SAP REST API Connector (OAuth 2.0, SO Pull, WIP Push, Inventory Sync)"
          >
            <Globe className="h-4 w-4 text-sky-600" />
            <span>Oracle / SAP REST</span>
          </button>

          <button
            onClick={() => navigate('/integrations/error-queue')}
            className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Central ERP Error Handling & Retry Queue"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>ERP Error Queue</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Ping Tally / Oracle ERP Gateway"
          >
            <Activity className={`h-4 w-4 ${testingConnection ? 'animate-pulse text-indigo-600' : 'text-slate-500'}`} />
            <span>{testingConnection ? 'Pinging...' : 'Test ERP Gateway'}</span>
          </button>

          <button
            onClick={handleRunFullSync}
            disabled={syncingAll}
            className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-200 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Synchronizing All...' : 'Run Full Bi-Directional Sync'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Status & Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Metric 1: Master Entities In-Sync */}
        <div 
          onClick={() => setActiveTab('entities')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'entities' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Master Records</span>
            <Database className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{entities.length}</span>
            <span className="text-xs text-slate-500">Entities Tracked</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-700 font-semibold truncate">
            Items, BOMs, Vendors, Clients, GL
          </div>
        </div>

        {/* Metric 2: Divergence Conflicts */}
        <div 
          onClick={() => setActiveTab('conflicts')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'conflicts' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Conflicts</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-800 tracking-tight">{pendingConflictsCount}</span>
            <span className="text-xs text-slate-500">Divergent Records</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold truncate">
            {pendingConflictsCount > 0 ? 'Requires IT review & resolution' : 'Zero conflicts · fully aligned'}
          </div>
        </div>

        {/* Metric 3: Target ERP System */}
        <div 
          onClick={() => setActiveTab('config')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'config' ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20' : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">ERP System Target</span>
            <Cpu className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {config.erpSystem}
            </span>
            <span className="text-xs text-emerald-700 font-bold">200 OK</span>
          </div>
          <div className="mt-1 text-[11px] text-sky-700 font-semibold truncate">
            {config.erpSystem === 'tally' ? 'Tally Prime HTTP :9000' : 'Oracle Cloud FSCM REST'}
          </div>
        </div>

        {/* Metric 4: Sync Schedule & Health */}
        <div 
          onClick={() => setActiveTab('logs')}
          className={`p-4 rounded-xl border transition cursor-pointer shadow-3xs ${
            activeTab === 'logs' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Sync Execution Log</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{logs.length}</span>
            <span className="text-xs text-slate-500">Sync Events</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold truncate">
            Policy: {config.conflictPolicy.toUpperCase()}
          </div>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono">
        <button
          onClick={() => setActiveTab('entities')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'entities'
              ? 'border-indigo-650 text-indigo-900 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Master Records Directory ({entities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'conflicts'
              ? 'border-amber-600 text-amber-900 bg-amber-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Conflict Resolution Center</span>
          {pendingConflictsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
              {pendingConflictsCount} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Sync Audit Logs & Telemetry ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer ${
            activeTab === 'config'
              ? 'border-slate-800 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>ERP Connectors & Conflict Rules</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: MASTER RECORDS DIRECTORY (Acceptance Criteria 1, 2, 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'entities' && (
        <div className="space-y-4 font-mono">
          
          {/* Quick Domain Sync Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              On-Demand Entity Domain Sync:
            </span>
            <div className="flex items-center space-x-1.5 flex-wrap">
              {(['item', 'bom', 'supplier', 'customer', 'coa'] as const).map(dom => (
                <button
                  key={dom}
                  onClick={() => handleSyncSingleEntity(dom)}
                  disabled={syncingEntity === dom || syncingAll}
                  className="px-2.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 disabled:bg-slate-200 text-slate-800 text-[11px] rounded-lg font-bold uppercase transition cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className={`h-3 w-3 ${syncingEntity === dom ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
                  <span>Sync {dom === 'coa' ? 'COA' : dom.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, name, SKU, or ERP reference ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Entity Domain Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Domain:</span>
                {(['all', 'item', 'bom', 'supplier', 'customer', 'coa'] as const).map(dt => (
                  <button
                    key={dt}
                    onClick={() => setEntityTypeFilter(dt)}
                    className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                      entityTypeFilter === dt 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dt === 'coa' ? 'COA' : dt}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
              {(['all', 'synced', 'conflict'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-indigo-650 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Master Entities Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Entity Type / Code</th>
                    <th className="py-3 px-4">Master Record Name</th>
                    <th className="py-3 px-4">Category / Revision / Ledger</th>
                    <th className="py-3 px-4">ERP Reference Identifier</th>
                    <th className="py-3 px-4">Sync State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No master data records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntities.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Type & Code */}
                        <td className="py-3 px-4">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mb-1 ${
                            item.entityType === 'item' ? 'bg-indigo-100 text-indigo-800' :
                            item.entityType === 'bom' ? 'bg-purple-100 text-purple-800' :
                            item.entityType === 'supplier' ? 'bg-amber-100 text-amber-800' :
                            item.entityType === 'customer' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.entityType === 'coa' ? 'CHART OF ACCOUNTS' : item.entityType.toUpperCase()}
                          </span>
                          <strong className="text-slate-900 block">{item.code}</strong>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block truncate max-w-[240px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {item.details.hsn ? `HSN: ${item.details.hsn} · ` : ''}
                            {item.details.gstin ? `GSTIN: ${item.details.gstin}` : ''}
                            {item.details.flowOpsUsage ? item.details.flowOpsUsage : ''}
                          </span>
                        </td>

                        {/* Category / Revision */}
                        <td className="py-3 px-4 text-slate-600">
                          <span className="block">{item.categoryOrRevision}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Updated: {new Date(item.flowOpsUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* ERP Reference */}
                        <td className="py-3 px-4 font-bold text-slate-700">
                          <span>{item.erpReferenceId || 'Not mapped'}</span>
                          <span className="text-[9px] text-slate-400 block font-normal uppercase mt-0.5">
                            Target: {config.erpSystem.toUpperCase()}
                          </span>
                        </td>

                        {/* Sync State */}
                        <td className="py-3 px-4">
                          {item.syncStatus === 'synced' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>In Sync</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span>Conflict</span>
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          {item.syncStatus === 'conflict' ? (
                            <button
                              onClick={() => {
                                const matchedConflict = conflicts.find(c => c.entityId === item.id || c.entityIdentifier.includes(item.code));
                                if (matchedConflict) {
                                  setSelectedConflictForModal(matchedConflict);
                                } else {
                                  toastInfo('Conflict Inspection', `Opening divergence inspection for ${item.code}`);
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] uppercase font-bold transition cursor-pointer"
                            >
                              Resolve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSyncSingleEntity(item.entityType)}
                              className="px-2 py-1 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded text-[10px] uppercase font-bold transition cursor-pointer"
                              title="Re-synchronize this record with ERP"
                            >
                              Sync
                            </button>
                          )}
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
          TAB 2: CONFLICT RESOLUTION CENTER (Acceptance Criteria 4)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4 font-mono">
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-3xs">
            <div className="flex items-center space-x-3">
              <ArrowLeftRight className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">Bi-Directional Discrepancy & Conflict Queue</span>
                <span className="text-[11px] text-amber-800 block">
                  Active policy: <strong>{config.conflictPolicy.toUpperCase()}</strong>. Discrepancies detected between FlowOps and ERP records require IT admin reconciliation to protect corporate accounting and shopfloor BOM integrity.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {conflicts.map(conf => (
              <div 
                key={conf.id} 
                className={`p-4 bg-white border rounded-xl shadow-3xs space-y-3 transition ${
                  conf.status === 'resolved' ? 'border-slate-200 opacity-60' : 'border-amber-300 ring-1 ring-amber-400/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {conf.entityType.toUpperCase()} CONFLICT
                    </span>
                    <strong className="text-slate-900 text-sm">{conf.entityIdentifier}</strong>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 text-[10px]">Detected: {new Date(conf.detectedAt).toLocaleTimeString()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      conf.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {conf.status}
                    </span>
                  </div>
                </div>

                {/* Summary of Discrepant Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {conf.differingFields.map(diff => (
                    <div key={diff.field} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{diff.label}</span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-900 font-semibold truncate max-w-[120px]">
                          FlowOps: {String(diff.flowOpsValue)}
                        </span>
                        <span className="text-amber-900 font-semibold truncate max-w-[120px]">
                          ERP: {String(diff.erpValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conflict Action Buttons */}
                {conf.status === 'pending' ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">
                      Choose an authoritative version or inspect full field-by-field diff:
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveConflict(conf, 'flowops')}
                        className="px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                        title="Keep FlowOps shopfloor version and update ERP"
                      >
                        Keep FlowOps Version
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conf, 'erp')}
                        className="px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer"
                        title="Accept ERP corporate version and update FlowOps"
                      >
                        Accept ERP Version
                      </button>
                      <button
                        onClick={() => setSelectedConflictForModal(conf)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>Side-by-Side Diff</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-800 pt-1 flex items-center space-x-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
                    <span>{conf.notes || 'Reconciled successfully.'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: SYNC AUDIT LOGS & TELEMETRY (Acceptance Criteria 5)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="space-y-4 font-mono">
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  ERP INTERACTION AUDIT TRAIL
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Synchronized Execution History & Gateway Telemetry
                </h3>
              </div>
              <span className="text-xs text-slate-300">
                Retaining last 50 sync cycles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                    <th className="py-2.5 px-4">Execution Timestamp</th>
                    <th className="py-2.5 px-4">Domain Entity</th>
                    <th className="py-2.5 px-4">Direction & System</th>
                    <th className="py-2.5 px-4">Processed Stats</th>
                    <th className="py-2.5 px-4">Latency</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Payload Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 uppercase font-bold text-indigo-900">
                        {log.entityType}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-800 font-bold block uppercase">{log.erpSystem}</span>
                        <span className="text-[10px] text-slate-400 block uppercase">{log.direction}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span>{log.recordsProcessed} processed</span>
                        <span className="text-[10px] text-slate-400 block">
                          +{log.recordsCreated} created · ~{log.recordsUpdated} updated
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {log.durationMs} ms
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'conflict' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogForModal(log)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] uppercase font-bold transition flex items-center space-x-1 ml-auto cursor-pointer"
                          title="Inspect raw XML or JSON payload transmitted over HTTP"
                        >
                          <FileCode className="h-3 w-3" />
                          <span>Inspect Payload</span>
                        </button>
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
          TAB 4: ERP CONNECTORS & CONFLICT POLICY CONFIGURATION
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="space-y-6 font-mono text-xs text-slate-700">
          
          {/* Conflict Resolution Policy Selector */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-3xs">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Conflict Resolution Policy
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              When master data attributes differ between FlowOps and ERP, how should the automated engine resolve divergences?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'manual', title: 'Manual Review Queue', desc: 'Flags discrepancy for IT admin review with side-by-side diff.' },
                { id: 'erp_wins', title: 'ERP Authoritative', desc: 'Corporate ERP master always overrides FlowOps shopfloor values.' },
                { id: 'flowops_wins', title: 'FlowOps Authoritative', desc: 'Shopfloor CAD/BOM master overrides ERP values.' },
                { id: 'latest_timestamp', title: 'Latest Timestamp', desc: 'Most recently edited record automatically takes precedence.' }
              ].map(pol => (
                <label 
                  key={pol.id}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    config.conflictPolicy === pol.id 
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <input
                      type="radio"
                      name="conflictPolicy"
                      checked={config.conflictPolicy === pol.id}
                      onChange={() => setConfig({ ...config, conflictPolicy: pol.id as ConflictResolutionPolicy })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-900 text-xs">{pol.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-tight pl-5">
                    {pol.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Active ERP Target System */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Connected ERP System Gateway
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {(['tally', 'oracle', 'sap', 'netsuite'] as const).map(erp => (
                  <button
                    key={erp}
                    onClick={() => setConfig({ ...config, erpSystem: erp })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      config.erpSystem === erp 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {erp}
                  </button>
                ))}
              </div>
            </div>

            {config.erpSystem === 'tally' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Tally Prime HTTP XML Gateway Configuration (:9000)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Tally HTTP Server Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.tallyConfig.serverUrl}
                      onChange={e => setConfig({
                        ...config,
                        tallyConfig: { ...config.tallyConfig, serverUrl: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Tally Company Name
                    </label>
                    <input
                      type="text"
                      value={config.tallyConfig.companyName}
                      onChange={e => setConfig({
                        ...config,
                        tallyConfig: { ...config.tallyConfig, companyName: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Oracle Cloud / SAP S/4HANA REST API Configuration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      REST API Gateway Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={config.oracleSapConfig.endpointUrl}
                      onChange={e => setConfig({
                        ...config,
                        oracleSapConfig: { ...config.oracleSapConfig, endpointUrl: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Business Unit / Organization ID
                    </label>
                    <input
                      type="text"
                      value={config.oracleSapConfig.businessUnit}
                      onChange={e => setConfig({
                        ...config,
                        oracleSapConfig: { ...config.oracleSapConfig, businessUnit: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test Connection Result Box */}
            {connectionTestResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                connectionTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {connectionTestResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{connectionTestResult.message} (Roundtrip: {connectionTestResult.latencyMs}ms)</span>
              </div>
            )}

            {/* Save Config Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  masterDataSyncService.saveConfig(tenantId, config);
                  toastSuccess('Configuration Saved', 'ERP connection settings and conflict policies updated.');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs uppercase font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODALS & SUB-FLOWS
         ═════════════════════════════════════════════════════════════ */}

      {/* 1. Conflict Resolution Modal */}
      {selectedConflictForModal && (
        <MasterDataConflictModal
          isOpen={!!selectedConflictForModal}
          onClose={() => setSelectedConflictForModal(null)}
          conflict={selectedConflictForModal}
          onResolved={(resolution, notes) => {
            handleResolveConflict(selectedConflictForModal, resolution, notes);
            setSelectedConflictForModal(null);
          }}
        />
      )}

      {/* 2. Sync Payload Inspector Modal */}
      {selectedLogForModal && (
        <SyncPayloadInspectorModal
          isOpen={!!selectedLogForModal}
          onClose={() => setSelectedLogForModal(null)}
          log={selectedLogForModal}
        />
      )}

    </div>
  );
};
