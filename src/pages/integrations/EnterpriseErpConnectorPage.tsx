// src/pages/integrations/EnterpriseErpConnectorPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { 
  EnterpriseErpSystem, 
  EnterpriseErpDualConfig, 
  EnterpriseRestTransaction, 
  EnterpriseConnectorStats,
  EnterpriseRestOperation
} from '../../types/enterpriseErpConnector';
import { 
  enterpriseErpConnectorService, 
  DEFAULT_ENTERPRISE_CONFIG 
} from '../../services/enterpriseErpConnectorService';
import { 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCode, 
  Database, 
  ShieldCheck, 
  Zap, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ArrowRight, 
  Sliders, 
  Building2, 
  Download, 
  Terminal, 
  Layers, 
  FileText, 
  ShoppingBag, 
  Truck, 
  Package, 
  ExternalLink,
  ChevronRight,
  Info,
  Save,
  RotateCcw,
  Key,
  Globe,
  Send,
  Lock,
  Server,
  Activity
} from 'lucide-react';

export const EnterpriseErpConnectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'operations' | 'oauth_desk' | 'api_sandbox' | 'error_queue' | 'endpoints_config'>('operations');

  // Core state
  const [dualConfig, setDualConfig] = useState<EnterpriseErpDualConfig>(enterpriseErpConnectorService.getConfig(tenantId));
  const [transactions, setTransactions] = useState<EnterpriseRestTransaction[]>([]);
  const [stats, setStats] = useState<EnterpriseConnectorStats>(enterpriseErpConnectorService.getStats(tenantId));

  // Action states
  const [authenticating, setAuthenticating] = useState(false);
  const [pullingSo, setPullingSo] = useState(false);
  const [pushingProd, setPushingProd] = useState(false);
  const [syncingInv, setSyncingInv] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inspector Modal
  const [selectedTx, setSelectedTx] = useState<EnterpriseRestTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState<'all' | EnterpriseRestOperation>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Sandbox state
  const [sandboxMethod, setSandboxMethod] = useState<'GET' | 'POST' | 'PUT'>('GET');
  const [sandboxEndpoint, setSandboxEndpoint] = useState('/fscmRestApi/resources/11.13.18.05/salesOrdersForOrderHub?q=StatusCode=\'OPEN\'');
  const [sandboxBody, setSandboxBody] = useState('{\n  "WorkOrderNumber": "WO-2026-0004",\n  "CompletedQuantity": 50,\n  "OperationCode": "CNC_HOBBING"\n}');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<EnterpriseRestTransaction | null>(null);

  const activeSystem = dualConfig.activeSystem;
  const currentEpConfig = activeSystem === 'oracle_fusion' ? dualConfig.oracle : dualConfig.sap;

  const loadData = () => {
    const loadedConfig = enterpriseErpConnectorService.getConfig(tenantId);
    const loadedTxns = enterpriseErpConnectorService.getTransactions(tenantId);
    const loadedStats = enterpriseErpConnectorService.getStats(tenantId);
    setDualConfig(loadedConfig);
    setTransactions(loadedTxns);
    setStats(loadedStats);
  };

  useEffect(() => {
    loadData();
    const handleConfigUpdate = () => loadData();
    const handleTxnsUpdate = () => loadData();
    window.addEventListener('enterprise_erp_config_updated', handleConfigUpdate);
    window.addEventListener('enterprise_erp_txns_updated', handleTxnsUpdate);
    return () => {
      window.removeEventListener('enterprise_erp_config_updated', handleConfigUpdate);
      window.removeEventListener('enterprise_erp_txns_updated', handleTxnsUpdate);
    };
  }, [tenantId]);

  // System switcher (Oracle Fusion vs SAP S/4HANA)
  const handleSwitchSystem = (newSystem: EnterpriseErpSystem) => {
    const updated = { ...dualConfig, activeSystem: newSystem };
    setDualConfig(updated);
    enterpriseErpConnectorService.saveConfig(tenantId, updated);
    toastInfo('Active Enterprise ERP Switched', `Switched to ${newSystem === 'oracle_fusion' ? 'Oracle Fusion Cloud SCM' : 'SAP S/4HANA Cloud'}.`);
    
    // Update default sandbox endpoint
    if (newSystem === 'oracle_fusion') {
      setSandboxEndpoint('/fscmRestApi/resources/11.13.18.05/salesOrdersForOrderHub?q=StatusCode=\'OPEN\'');
    } else {
      setSandboxEndpoint('/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$top=5');
    }
  };

  // Acceptance Criteria 1: OAuth Token Authentication
  const handleAuthenticateOAuth = async () => {
    setAuthenticating(true);
    try {
      const res = await enterpriseErpConnectorService.authenticateOAuth(tenantId, activeSystem);
      toastSuccess('OAuth 2.0 Authenticated', res.message);
      loadData();
    } catch (e: any) {
      toastError('OAuth Failed', e.message);
    } finally {
      setAuthenticating(false);
    }
  };

  // Acceptance Criteria 2: SO Pull REST call
  const handlePullSalesOrders = async () => {
    setPullingSo(true);
    try {
      const res = await enterpriseErpConnectorService.pullSalesOrdersRest(tenantId);
      toastSuccess('Sales Orders Pulled', `Received open orders from ${currentEpConfig.systemName} (HTTP 200).`);
      loadData();
    } catch (e: any) {
      toastError('SO Pull Failed', e.message);
    } finally {
      setPullingSo(false);
    }
  };

  // Acceptance Criteria 2: Production Push REST call
  const handlePushProduction = async () => {
    setPushingProd(true);
    try {
      const res = await enterpriseErpConnectorService.pushProductionConfirmationRest(tenantId);
      toastSuccess('Production Confirmed', `Operation completion & component backflush posted to ${currentEpConfig.systemName} (Ref: ${res.referenceId}).`);
      loadData();
    } catch (e: any) {
      toastError('Production Push Failed', e.message);
    } finally {
      setPushingProd(false);
    }
  };

  // Acceptance Criteria 2: Inventory Sync REST call
  const handleSyncInventory = async () => {
    setSyncingInv(true);
    try {
      const res = await enterpriseErpConnectorService.syncInventoryMovementRest(tenantId);
      toastSuccess('Inventory Movement Synced', `Material Document created in ${currentEpConfig.systemName} (Ref: ${res.referenceId}).`);
      loadData();
    } catch (e: any) {
      toastError('Inventory Sync Failed', e.message);
    } finally {
      setSyncingInv(false);
    }
  };

  // Acceptance Criteria 3: Retry single failed
  const handleRetryTx = async (txId: string) => {
    setRetryingId(txId);
    try {
      const res = await enterpriseErpConnectorService.retryTransaction(tenantId, txId);
      toastSuccess('Call Recovered', `Successfully posted transaction #${res.referenceId} after exponential backoff.`);
      loadData();
    } catch (e: any) {
      toastError('Retry Failed', e.message);
    } finally {
      setRetryingId(null);
    }
  };

  // Acceptance Criteria 3: Retry all failed
  const handleRetryAllFailed = async () => {
    setRetryingAll(true);
    try {
      const res = await enterpriseErpConnectorService.retryAllFailed(tenantId);
      toastSuccess('Error Queue Cleared', `Successfully recovered ${res.length} failed calls.`);
      loadData();
    } catch (e: any) {
      toastError('Bulk Retry Failed', e.message);
    } finally {
      setRetryingAll(false);
    }
  };

  // Run Sandbox Request
  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    try {
      let res: EnterpriseRestTransaction;
      if (sandboxMethod === 'GET') {
        res = await enterpriseErpConnectorService.pullSalesOrdersRest(tenantId);
      } else if (sandboxEndpoint.includes('inventory') || sandboxEndpoint.includes('MATERIAL')) {
        res = await enterpriseErpConnectorService.syncInventoryMovementRest(tenantId);
      } else {
        res = await enterpriseErpConnectorService.pushProductionConfirmationRest(tenantId);
      }
      setSandboxResponse(res);
      toastSuccess('REST Call Executed', `Received HTTP ${res.httpStatus} in ${res.durationMs}ms`);
      loadData();
    } catch (e: any) {
      toastError('Call Error', e.message);
    } finally {
      setSandboxRunning(false);
    }
  };

  // Save Config
  const handleSaveConfig = () => {
    setSavingConfig(true);
    try {
      enterpriseErpConnectorService.saveConfig(tenantId, dualConfig);
      toastSuccess('Configuration Saved', 'Enterprise REST API endpoints and OAuth parameters updated.');
    } catch (e: any) {
      toastError('Save Error', e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSystem = t.system === activeSystem;
      const matchesOp = operationFilter === 'all' || t.operation === operationFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(q) ||
        t.referenceId.toLowerCase().includes(q) ||
        t.endpointPath.toLowerCase().includes(q) ||
        (t.correlationId && t.correlationId.toLowerCase().includes(q));
      return matchesSystem && matchesOp && matchesStatus && matchesSearch;
    });
  }, [transactions, activeSystem, operationFilter, statusFilter, searchQuery]);

  const failedTransactions = useMemo(() => {
    return transactions.filter(t => t.system === activeSystem && t.status === 'failed');
  }, [transactions, activeSystem]);

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase tracking-wider">
              ENTERPRISE ERP CONNECTOR · REST API & OAUTH 2.0
            </span>
            <span className="text-slate-300">·</span>
            
            {/* Live OAuth Status Badge */}
            {stats.oauthValid ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>OAuth Token Active (Bearer Valid)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-rose-600" />
                <span>Token Expired / Unconfigured</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 mt-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Oracle / SAP REST API Connector
            </h1>

            {/* Active System Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 font-mono text-xs">
              <button
                onClick={() => handleSwitchSystem('oracle_fusion')}
                className={`px-3 py-1 rounded-md font-bold uppercase transition cursor-pointer flex items-center space-x-1.5 ${
                  activeSystem === 'oracle_fusion' 
                    ? 'bg-rose-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Oracle Fusion SCM</span>
              </button>
              <button
                onClick={() => handleSwitchSystem('sap_s4hana')}
                className={`px-3 py-1 rounded-md font-bold uppercase transition cursor-pointer flex items-center space-x-1.5 ${
                  activeSystem === 'sap_s4hana' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>SAP S/4HANA Cloud</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-normal">
            Enterprise-grade REST API integration connecting FlowOps shopfloor operations to {currentEpConfig.systemName}. Performs OAuth 2.0 authenticated REST calls for Sales Order pull, WIP production push, and inventory movement sync with automated error handling and circuit breaker.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={handleAuthenticateOAuth}
            disabled={authenticating}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Authenticate via OAuth 2.0 Client Credentials Grant"
          >
            <Key className={`h-4 w-4 ${authenticating ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{authenticating ? 'Authenticating...' : 'Refresh Token'}</span>
          </button>

          <button
            onClick={handlePullSalesOrders}
            disabled={pullingSo}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Pull Sales Orders via REST API"
          >
            <ShoppingBag className={`h-4 w-4 text-indigo-600 ${pullingSo ? 'animate-bounce' : ''}`} />
            <span>{pullingSo ? 'Pulling...' : 'SO Pull (REST)'}</span>
          </button>

          <button
            onClick={handlePushProduction}
            disabled={pushingProd}
            className="border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Push WIP Operation Completion to ERP"
          >
            <Cpu className={`h-4 w-4 text-emerald-600 ${pushingProd ? 'animate-pulse' : ''}`} />
            <span>{pushingProd ? 'Pushing...' : 'Production Push'}</span>
          </button>

          <button
            onClick={handleSyncInventory}
            disabled={syncingInv}
            className="border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Sync Material Movement / Goods Receipt Note"
          >
            <Package className={`h-4 w-4 text-sky-600 ${syncingInv ? 'animate-spin' : ''}`} />
            <span>{syncingInv ? 'Syncing...' : 'Inventory Sync'}</span>
          </button>

          <button
            onClick={() => navigate('/integrations/tally')}
            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Switch to Tally Connector (India)"
          >
            <Server className="h-4 w-4 text-amber-600" />
            <span>Tally Prime</span>
          </button>

          <button
            onClick={() => navigate('/integrations/error-queue')}
            className="border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Open ERP Error Handling & Retry Queue"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Error Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 font-mono">
        
        {/* Total REST Calls */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">REST Calls</span>
            <Activity className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalCalls}</div>
          <span className="text-[10px] text-slate-400 block truncate">Total API invocations</span>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.successRatePct}%</div>
          <span className="text-[10px] text-emerald-700 font-semibold block truncate">HTTP 200/201 Status</span>
        </div>

        {/* Avg Latency */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Avg Roundtrip</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.avgLatencyMs}ms</div>
          <span className="text-[10px] text-slate-400 block truncate">Cloud gateway latency</span>
        </div>

        {/* SOs Pulled */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">SO Pulled</span>
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats.soPulledCount}</div>
          <span className="text-[10px] text-indigo-700 font-semibold block truncate">Orders imported</span>
        </div>

        {/* Production Pushed */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Prod Pushed</span>
            <Cpu className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.productionPushedCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold block truncate">WIP backflushed</span>
        </div>

        {/* Quarantined Errors */}
        <div className={`p-3.5 rounded-xl border transition shadow-3xs space-y-1 ${
          stats.failedCount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Error Queue</span>
            <AlertTriangle className={`h-4 w-4 ${stats.failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black ${stats.failedCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {stats.failedCount}
          </div>
          <span className={`text-[10px] block truncate font-semibold ${stats.failedCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {stats.failedCount > 0 ? 'Action required' : 'Zero failures'}
          </span>
        </div>

      </div>

      {/* 3. Primary Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('operations')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'operations'
              ? 'border-sky-600 text-sky-900 bg-sky-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>REST API Ledger ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('oauth_desk')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'oauth_desk'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Key className="h-4 w-4" />
          <span>OAuth 2.0 Auth Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('api_sandbox')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'api_sandbox'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>REST API Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('error_queue')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'error_queue'
              ? 'border-rose-600 text-rose-900 bg-rose-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>Error Queue & Retries ({failedTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('endpoints_config')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'endpoints_config'
              ? 'border-slate-800 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Endpoints & BU Config</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: UNIFIED REST API OPERATIONS LEDGER
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'operations' && (
        <div className="space-y-4 font-mono text-xs">
          
          {/* Filters Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search endpoint, correlation ID, reference #..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Operation Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Op:</span>
                <select
                  value={operationFilter}
                  onChange={e => setOperationFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <option value="all">All Operations</option>
                  <option value="so_pull">SO Pull</option>
                  <option value="production_push">Production Push</option>
                  <option value="inventory_sync">Inventory Sync</option>
                  <option value="oauth_token">OAuth Token</option>
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                200/201 OK
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'failed' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Failed ({failedTransactions.length})
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Method & Status</th>
                    <th className="py-3 px-4">Operation & Title</th>
                    <th className="py-3 px-4">Resource Endpoint</th>
                    <th className="py-3 px-4">Reference Document</th>
                    <th className="py-3 px-4">Correlation ECID</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No enterprise REST transactions match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isSuccess = tx.status === 'success';
                      const isFailed = tx.status === 'failed';

                      return (
                        <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${
                          isFailed ? 'bg-rose-50/20' : ''
                        }`}>
                          
                          {/* Method & Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                tx.httpMethod === 'GET' ? 'bg-sky-100 text-sky-800' :
                                tx.httpMethod === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.httpMethod}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {tx.httpStatus}
                              </span>
                            </div>
                          </td>

                          {/* Operation & Title */}
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block truncate max-w-[220px]">{tx.title}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5 uppercase">
                              {tx.operation.replace('_', ' ')} · {new Date(tx.timestamp).toLocaleTimeString()}
                            </span>
                          </td>

                          {/* Endpoint */}
                          <td className="py-3.5 px-4">
                            <code className="text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded block truncate max-w-[220px]">
                              {tx.endpointPath}
                            </code>
                          </td>

                          {/* Reference */}
                          <td className="py-3.5 px-4">
                            <strong className="text-indigo-900 block">{tx.referenceId}</strong>
                          </td>

                          {/* Correlation ECID */}
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]" title={tx.correlationId}>
                              {tx.correlationId || 'N/A'}
                            </span>
                          </td>

                          {/* Latency */}
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {tx.durationMs}ms
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedTx(tx)}
                                className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                              >
                                View
                              </button>

                              {isFailed && (
                                <button
                                  onClick={() => handleRetryTx(tx.id)}
                                  disabled={retryingId === tx.id}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1"
                                >
                                  <RotateCcw className={`h-3 w-3 ${retryingId === tx.id ? 'animate-spin' : ''}`} />
                                  <span>Retry</span>
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

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: OAUTH 2.0 AUTHENTICATION DESK (Acceptance Criteria 1)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'oauth_desk' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 6 cols: OAuth Parameters Configuration */}
            <div className="lg:col-span-6 p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider block">
                    OAUTH 2.0 CLIENT CREDENTIALS GRANT
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {currentEpConfig.systemName} Token Exchange
                  </h3>
                </div>
                <button
                  onClick={handleAuthenticateOAuth}
                  disabled={authenticating}
                  className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Key className={`h-3.5 w-3.5 ${authenticating ? 'animate-spin' : ''}`} />
                  <span>{authenticating ? 'Acquiring...' : 'Request Bearer Token'}</span>
                </button>
              </div>

              {/* Token URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">OAuth 2.0 Token Endpoint URL</label>
                <input
                  type="text"
                  value={currentEpConfig.oauth.tokenUrl}
                  onChange={e => {
                    const updated = { ...dualConfig };
                    if (activeSystem === 'oracle_fusion') {
                      updated.oracle.oauth.tokenUrl = e.target.value;
                    } else {
                      updated.sap.oauth.tokenUrl = e.target.value;
                    }
                    setDualConfig(updated);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>

              {/* Client ID & Secret */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Client ID</label>
                  <input
                    type="text"
                    value={currentEpConfig.oauth.clientId}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.oauth.clientId = e.target.value;
                      } else {
                        updated.sap.oauth.clientId = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Client Secret (Masked)</label>
                  <input
                    type="password"
                    value={currentEpConfig.oauth.clientSecret}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.oauth.clientSecret = e.target.value;
                      } else {
                        updated.sap.oauth.clientSecret = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Scope & Grant Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Requested Scope</label>
                  <input
                    type="text"
                    value={currentEpConfig.oauth.scope}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.oauth.scope = e.target.value;
                      } else {
                        updated.sap.oauth.scope = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Grant Type</label>
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold">
                    client_credentials
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-[11px] text-indigo-950 space-y-1">
                <strong>Enterprise Security Architecture:</strong>
                <p>
                  FlowOps exchanges client credentials securely using HTTPS TLS 1.3. Access tokens are cached in memory and automatically refreshed 5 minutes prior to expiry without interrupting shopfloor operators.
                </p>
              </div>
            </div>

            {/* Right 6 cols: Active Bearer Token & JWT Inspection */}
            <div className="lg:col-span-6 p-5 bg-slate-900 text-slate-100 rounded-xl space-y-4 shadow-3xs flex flex-col">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-400 flex items-center space-x-1.5">
                  <Lock className="h-4 w-4" />
                  <span>Active Bearer Token & JWT Metadata</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded uppercase font-bold">
                  Status: {currentEpConfig.oauth.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block uppercase font-bold">Token Expiry</span>
                  <span className="text-emerald-300 font-bold block mt-0.5">
                    {currentEpConfig.oauth.expiresAt ? new Date(currentEpConfig.oauth.expiresAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block uppercase font-bold">Last Refresh</span>
                  <span className="text-indigo-300 font-bold block mt-0.5">
                    {currentEpConfig.oauth.lastRefreshedAt ? new Date(currentEpConfig.oauth.lastRefreshedAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Token String Preview */}
              <div className="space-y-1 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>JWT Token String</span>
                  <button
                    onClick={() => handleCopy(currentEpConfig.oauth.accessToken || '', 'oauth_token')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === 'oauth_token' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === 'oauth_token' ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-indigo-200 break-all max-h-36 overflow-auto">
                  {currentEpConfig.oauth.accessToken || 'No active token. Click "Request Bearer Token" above.'}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>Injected into REST Headers: <code className="text-emerald-400">Authorization: Bearer &lt;token&gt;</code></span>
                <span className="text-indigo-400">HMAC-SHA256 Signed</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: INTERACTIVE REST API SANDBOX (Acceptance Criteria 2)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'api_sandbox' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block">
                  REST API CALL EXECUTION SANDBOX
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Test Endpoints for SO Pull, Production Push & Inventory Sync
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSandboxMethod('GET');
                    setSandboxEndpoint(activeSystem === 'oracle_fusion' 
                      ? '/fscmRestApi/resources/11.13.18.05/salesOrdersForOrderHub?q=StatusCode=\'OPEN\'' 
                      : '/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$top=5');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] uppercase font-bold"
                >
                  SO Pull Preset
                </button>
                <button
                  onClick={() => {
                    setSandboxMethod('POST');
                    setSandboxEndpoint(activeSystem === 'oracle_fusion'
                      ? '/fscmRestApi/resources/11.13.18.05/wipOperations'
                      : '/sap/opu/odata/sap/API_PRODUCTION_ORDER_CONFIRMATION_SRV/ProductionOrderConfirmation');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] uppercase font-bold"
                >
                  Production Push Preset
                </button>
                <button
                  onClick={() => {
                    setSandboxMethod('POST');
                    setSandboxEndpoint(activeSystem === 'oracle_fusion'
                      ? '/fscmRestApi/resources/11.13.18.05/inventoryTransactions'
                      : '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] uppercase font-bold"
                >
                  Inventory Sync Preset
                </button>
              </div>
            </div>

            {/* Request Builder Line */}
            <div className="flex items-center space-x-2">
              <select
                value={sandboxMethod}
                onChange={e => setSandboxMethod(e.target.value as any)}
                className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 font-bold text-xs"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>

              <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-lg overflow-hidden">
                <span className="px-3 text-slate-400 bg-slate-100 border-r border-slate-300 text-xs py-2 select-none">
                  {currentEpConfig.baseUrl}
                </span>
                <input
                  type="text"
                  value={sandboxEndpoint}
                  onChange={e => setSandboxEndpoint(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-xs font-mono text-slate-800"
                />
              </div>

              <button
                onClick={handleRunSandbox}
                disabled={sandboxRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Send className={`h-3.5 w-3.5 ${sandboxRunning ? 'animate-spin' : ''}`} />
                <span>{sandboxRunning ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Request Body Editor (for POST/PUT) */}
            {sandboxMethod !== 'GET' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Request Body (JSON)</label>
                <textarea
                  rows={5}
                  value={sandboxBody}
                  onChange={e => setSandboxBody(e.target.value)}
                  className="w-full p-3 bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg font-mono text-[11px]"
                />
              </div>
            )}

            {/* Response Console */}
            {sandboxResponse && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                      HTTP {sandboxResponse.httpStatus}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Execution Duration: <strong className="text-white">{sandboxResponse.durationMs}ms</strong>
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Correlation: <code className="text-indigo-400">{sandboxResponse.correlationId}</code>
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(sandboxResponse.responseBody || '', 'sandbox_resp')}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === 'sandbox_resp' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === 'sandbox_resp' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-56 overflow-auto text-emerald-300 text-[10px]">
                  <pre>{sandboxResponse.responseBody}</pre>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: ERROR QUEUE & RETRIES (Acceptance Criteria 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'error_queue' && (
        <div className="space-y-4 font-mono text-xs">
          
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-950 shadow-3xs">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block text-sm">Quarantined REST API Calls</strong>
                <span className="text-[11px] text-rose-800 block">
                  Captures rate limit timeouts (HTTP 429), expired tokens (HTTP 401), and payload schema mismatches with automatic retry and suggested remediations.
                </span>
              </div>
            </div>

            {failedTransactions.length > 0 && (
              <button
                onClick={handleRetryAllFailed}
                disabled={retryingAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white text-[11px] uppercase font-extrabold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className={`h-4 w-4 ${retryingAll ? 'animate-spin' : ''}`} />
                <span>Retry All ({failedTransactions.length})</span>
              </button>
            )}
          </div>

          {failedTransactions.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <strong className="text-slate-800 block">Error Queue is Empty</strong>
              <p className="text-xs text-slate-500 mt-1">All Oracle/SAP REST API calls have succeeded with HTTP 200/201 status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedTransactions.map(tx => (
                <div key={tx.id} className="p-4 bg-white border border-rose-200 rounded-xl shadow-3xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px] uppercase">
                          HTTP {tx.httpStatus} · {tx.errorCode || 'ERR_REST_API'}
                        </span>
                        <strong className="text-slate-900 text-xs">{tx.title}</strong>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-700 font-bold">Ref: {tx.referenceId}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Endpoint: {tx.endpointPath} · Correlation: {tx.correlationId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                      >
                        Inspect Payload
                      </button>

                      <button
                        onClick={() => handleRetryTx(tx.id)}
                        disabled={retryingId === tx.id}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${retryingId === tx.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === tx.id ? 'Retrying...' : 'Retry Call'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1 text-[11px] text-rose-950">
                    <div><strong>Error Cause:</strong> {tx.errorMessage}</div>
                    <div className="text-slate-600"><strong>Remediation:</strong> {tx.suggestedFix}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 5: ENDPOINTS & BUSINESS UNIT CONFIGURATION
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'endpoints_config' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-5 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  RESOURCE ENDPOINTS & INVENTORY LOCATORS
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {currentEpConfig.systemName} REST API Mapping Rules
                </h3>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Server & Organization Codes */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Enterprise Scope & Host URL
                </strong>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Base API URL</label>
                  <input
                    type="text"
                    value={currentEpConfig.baseUrl}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.baseUrl = e.target.value;
                      } else {
                        updated.sap.baseUrl = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Business Unit / Plant</label>
                    <input
                      type="text"
                      value={currentEpConfig.businessUnit}
                      onChange={e => {
                        const updated = { ...dualConfig };
                        if (activeSystem === 'oracle_fusion') {
                          updated.oracle.businessUnit = e.target.value;
                        } else {
                          updated.sap.businessUnit = e.target.value;
                        }
                        setDualConfig(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Org / Storage Loc</label>
                    <input
                      type="text"
                      value={currentEpConfig.organizationCode}
                      onChange={e => {
                        const updated = { ...dualConfig };
                        if (activeSystem === 'oracle_fusion') {
                          updated.oracle.organizationCode = e.target.value;
                        } else {
                          updated.sap.organizationCode = e.target.value;
                        }
                        setDualConfig(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">HTTP Timeout (ms)</label>
                  <input
                    type="number"
                    value={currentEpConfig.timeoutMs}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.timeoutMs = Number(e.target.value);
                      } else {
                        updated.sap.timeoutMs = Number(e.target.value);
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Endpoints Paths */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Resource Endpoint Paths
                </strong>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Sales Orders (SO Pull)</label>
                  <input
                    type="text"
                    value={currentEpConfig.soPullEndpoint}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.soPullEndpoint = e.target.value;
                      } else {
                        updated.sap.soPullEndpoint = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Production Push (WIP Operations)</label>
                  <input
                    type="text"
                    value={currentEpConfig.productionPushEndpoint}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.productionPushEndpoint = e.target.value;
                      } else {
                        updated.sap.productionPushEndpoint = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Inventory Movement (Material Docs)</label>
                  <input
                    type="text"
                    value={currentEpConfig.inventorySyncEndpoint}
                    onChange={e => {
                      const updated = { ...dualConfig };
                      if (activeSystem === 'oracle_fusion') {
                        updated.oracle.inventorySyncEndpoint = e.target.value;
                      } else {
                        updated.sap.inventorySyncEndpoint = e.target.value;
                      }
                      setDualConfig(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 font-mono text-xs animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-600 block">
                  ENTERPRISE REST TRANSACTION INSPECTOR
                </span>
                <strong className="text-slate-900 text-sm">
                  {selectedTx.httpMethod} {selectedTx.endpointPath}
                </strong>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs uppercase px-2 py-1 rounded cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3 text-[11px] p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">HTTP Status</span>
                  <strong className={selectedTx.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}>
                    {selectedTx.httpStatus} ({selectedTx.status.toUpperCase()})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Duration</span>
                  <strong className="text-slate-900 block">{selectedTx.durationMs}ms</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Correlation ECID</span>
                  <strong className="text-indigo-700 block truncate">{selectedTx.correlationId || 'N/A'}</strong>
                </div>
              </div>

              {/* Request Headers */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">HTTP Request Headers</span>
                <div className="p-2.5 bg-slate-950 text-slate-300 rounded-lg border border-slate-800 text-[10px] max-h-28 overflow-auto">
                  <pre>{JSON.stringify(selectedTx.requestHeaders, null, 2)}</pre>
                </div>
              </div>

              {/* Request Body (if any) */}
              {selectedTx.requestBody && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Request Body (JSON)</span>
                    <button
                      onClick={() => handleCopy(selectedTx.requestBody || '', 'modal_req')}
                      className="text-[10px] text-sky-600 hover:text-sky-800 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedId === 'modal_req' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === 'modal_req' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 text-sky-200 rounded-lg border border-slate-800 text-[10px] max-h-40 overflow-auto">
                    <pre>{selectedTx.requestBody}</pre>
                  </div>
                </div>
              )}

              {/* Response Body */}
              {selectedTx.responseBody && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Response Body (JSON)</span>
                    <button
                      onClick={() => handleCopy(selectedTx.responseBody || '', 'modal_resp')}
                      className="text-[10px] text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedId === 'modal_resp' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === 'modal_resp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 text-emerald-200 rounded-lg border border-slate-800 text-[10px] max-h-48 overflow-auto">
                    <pre>{selectedTx.responseBody}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Timestamp: {new Date(selectedTx.timestamp).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
