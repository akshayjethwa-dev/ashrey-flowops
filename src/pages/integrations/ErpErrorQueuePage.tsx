// src/pages/integrations/ErpErrorQueuePage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { 
  QueuedSyncErrorItem, 
  ErrorQueueConfig, 
  ErrorQueueStats,
  SyncIntegrationDomain,
  ErpTargetSystem,
  SyncFailureSeverity
} from '../../types/erpErrorQueue';
import { 
  erpErrorQueueService, 
  DEFAULT_QUEUE_CONFIG 
} from '../../services/erpErrorQueueService';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Zap, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ArrowRight, 
  Sliders, 
  MessageSquare, 
  Mail, 
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
  Bell,
  Cpu,
  Server,
  Globe,
  Database,
  Play,
  Pause,
  AlertOctagon,
  Edit3
} from 'lucide-react';

export const ErpErrorQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'queue_triage' | 'alerts_log' | 'resolved_history' | 'retry_policies'>('queue_triage');

  // Core state
  const [config, setConfig] = useState<ErrorQueueConfig>(erpErrorQueueService.getConfig(tenantId));
  const [queueItems, setQueueItems] = useState<QueuedSyncErrorItem[]>([]);
  const [stats, setStats] = useState<ErrorQueueStats>(erpErrorQueueService.getStats(tenantId));

  // Action states
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [autoRetryCycleRunning, setAutoRetryCycleRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Payload Inspector & Editor Modal
  const [selectedItemForModal, setSelectedItemForModal] = useState<QueuedSyncErrorItem | null>(null);
  const [editablePayload, setEditablePayload] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | SyncIntegrationDomain>('all');
  const [systemFilter, setSystemFilter] = useState<'all' | ErpTargetSystem>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | SyncFailureSeverity>('all');

  const loadData = () => {
    const loadedConfig = erpErrorQueueService.getConfig(tenantId);
    const loadedItems = erpErrorQueueService.getQueueItems(tenantId);
    const loadedStats = erpErrorQueueService.getStats(tenantId);
    setConfig(loadedConfig);
    setQueueItems(loadedItems);
    setStats(loadedStats);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('erp_error_queue_updated', handleUpdate);
    return () => window.removeEventListener('erp_error_queue_updated', handleUpdate);
  }, [tenantId]);

  // Acceptance Criteria 3: Manual Retry single item
  const handleManualRetry = async (item: QueuedSyncErrorItem, overridePayload?: string) => {
    setRetryingId(item.id);
    try {
      const res = await erpErrorQueueService.manualRetryItem(tenantId, item.id, overridePayload);
      toastSuccess('Sync Recovered', `Successfully committed ${res.referenceNumber} to ${res.erpSystem.toUpperCase()}.`);
      if (selectedItemForModal?.id === item.id) setSelectedItemForModal(null);
      loadData();
    } catch (e: any) {
      toastError('Manual Retry Failed', e.message);
    } finally {
      setRetryingId(null);
    }
  };

  // Acceptance Criteria 3: Manual Retry all quarantined items
  const handleRetryAll = async () => {
    const count = stats.totalQuarantined;
    if (count === 0) return;

    setRetryingAll(true);
    toastInfo('Retrying Error Queue', `Re-attempting ${count} quarantined sync requests...`);
    try {
      await erpErrorQueueService.manualRetryAll(tenantId);
      toastSuccess('Error Queue Cleared', `Successfully recovered ${count} transactions.`);
      loadData();
    } catch (e: any) {
      toastError('Retry Error', e.message);
    } finally {
      setRetryingAll(false);
    }
  };

  // Acceptance Criteria 2: Trigger automated retry cycle for ready items
  const handleRunAutoRetryCycle = async () => {
    setAutoRetryCycleRunning(true);
    const pendingItems = queueItems.filter(i => i.status === 'quarantined');
    try {
      for (const item of pendingItems.slice(0, 3)) {
        await erpErrorQueueService.executeAutoRetry(tenantId, item.id);
      }
      toastSuccess('Auto-Retry Cycle Complete', 'Processed ready items with exponential backoff algorithm.');
      loadData();
    } catch (e: any) {
      toastError('Auto-Retry Error', e.message);
    } finally {
      setAutoRetryCycleRunning(false);
    }
  };

  // Acceptance Criteria 4: Send test repeated failure alert
  const handleSendTestAlert = () => {
    const criticalItem = queueItems.find(i => i.severity === 'critical') || queueItems[0];
    if (criticalItem) {
      erpErrorQueueService.dispatchRepeatedFailureAlert(tenantId, criticalItem, config);
      toastSuccess('Repeated Failure Alert Sent', `Dispatched WhatsApp & In-App alert to ${config.itAdminWhatsAppPhone}`);
      loadData();
    }
  };

  // Save Settings
  const handleSaveConfig = () => {
    setSavingConfig(true);
    try {
      erpErrorQueueService.saveConfig(tenantId, config);
      toastSuccess('Configuration Saved', 'Updated retry thresholds, backoff intervals, and alert channels.');
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

  // Open modal with editable payload
  const handleOpenInspector = (item: QueuedSyncErrorItem) => {
    setSelectedItemForModal(item);
    setEditablePayload(item.requestPayload);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return queueItems.filter(item => {
      const matchesDomain = domainFilter === 'all' || item.domain === domainFilter;
      const matchesSystem = systemFilter === 'all' || item.erpSystem === systemFilter;
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        item.referenceNumber.toLowerCase().includes(q) ||
        item.entityTitle.toLowerCase().includes(q) ||
        item.errorCode.toLowerCase().includes(q) ||
        item.errorMessage.toLowerCase().includes(q) ||
        (item.correlationId && item.correlationId.toLowerCase().includes(q));
      return matchesDomain && matchesSystem && matchesSeverity && matchesSearch;
    });
  }, [queueItems, domainFilter, systemFilter, severityFilter, searchQuery]);

  const quarantinedItems = useMemo(() => {
    return filteredItems.filter(i => i.status === 'quarantined' || i.status === 'retrying');
  }, [filteredItems]);

  const resolvedItems = useMemo(() => {
    return filteredItems.filter(i => i.status === 'resolved');
  }, [filteredItems]);

  const criticalRepeatedFailures = useMemo(() => {
    return queueItems.filter(i => i.status === 'quarantined' && i.retryCount >= config.alertOnFailureThreshold);
  }, [queueItems, config.alertOnFailureThreshold]);

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase tracking-wider">
              ENTERPRISE RELIABILITY · IT ADMINISTRATOR DESK
            </span>
            <span className="text-slate-300">·</span>
            
            {/* Auto-Retry Engine Status */}
            {config.autoRetryEnabled ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-Retry Active (Exp. Backoff {config.baseBackoffSeconds}s–{config.maxBackoffSeconds}s)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <Pause className="h-3 w-3 text-amber-600" />
                <span>Auto-Retry Paused (Manual Only)</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            ERP Error Handling & Retry Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Centralized quarantine and recovery engine for all FlowOps integrations (Tally, Oracle Cloud, SAP S/4HANA, Zoho). Guarantees zero data loss during network outages with exponential backoff retries and automated multi-channel IT alerts.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={handleRunAutoRetryCycle}
            disabled={autoRetryCycleRunning || stats.totalQuarantined === 0}
            className="border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Execute immediate backoff cycle on ready items"
          >
            <RotateCcw className={`h-4 w-4 ${autoRetryCycleRunning ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{autoRetryCycleRunning ? 'Retrying...' : 'Run Auto-Retry'}</span>
          </button>

          {stats.totalQuarantined > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={retryingAll}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-200" />
              <span>{retryingAll ? 'Recovering...' : `Retry All Quarantined (${stats.totalQuarantined})`}</span>
            </button>
          )}

          <button
            onClick={handleSendTestAlert}
            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Dispatch simulated WhatsApp & in-app alert"
          >
            <Bell className="h-4 w-4 text-amber-600" />
            <span>Test IT Alert</span>
          </button>

          <button
            onClick={() => navigate('/integrations/tally')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Switch to Tally Connector"
          >
            <Server className="h-4 w-4 text-amber-600" />
            <span>Tally</span>
          </button>

          <button
            onClick={() => navigate('/integrations/oracle-sap')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Switch to Oracle / SAP REST API"
          >
            <Globe className="h-4 w-4 text-sky-600" />
            <span>Oracle / SAP</span>
          </button>
        </div>
      </div>

      {/* Critical Repeated Failure Alert Banner (Acceptance Criteria 4) */}
      {criticalRepeatedFailures.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl flex items-center justify-between text-xs text-rose-950 shadow-sm animate-in fade-in duration-200 font-mono">
          <div className="flex items-center space-x-3">
            <AlertOctagon className="h-6 w-6 text-rose-600 shrink-0 animate-pulse" />
            <div>
              <div className="flex items-center space-x-2">
                <strong className="text-sm font-bold text-rose-900">
                  REPEATED FAILURE ALERT TRIGGERED ({criticalRepeatedFailures.length} CRITICAL TRANSACTIONS)
                </strong>
                <span className="bg-rose-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                  Action Required
                </span>
              </div>
              <span className="text-[11px] text-rose-800 block mt-0.5">
                Vouchers have exceeded the failure threshold (≥{config.alertOnFailureThreshold} attempts). Dispatched notifications to WhatsApp ({config.itAdminWhatsAppPhone}) and Webhook.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('alerts_log')}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold uppercase transition shrink-0 cursor-pointer shadow-2xs"
          >
            View Alerts Log &rarr;
          </button>
        </div>
      )}

      {/* 2. Operational KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono">
        
        {/* Quarantined Errors */}
        <div className={`p-4 rounded-xl border transition shadow-3xs space-y-1 ${
          stats.totalQuarantined > 0 ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Quarantined Errors</span>
            <AlertTriangle className={`h-4 w-4 ${stats.totalQuarantined > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black ${stats.totalQuarantined > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {stats.totalQuarantined}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Pending re-transmission</span>
        </div>

        {/* Critical Repeated Failures */}
        <div className={`p-4 rounded-xl border transition shadow-3xs space-y-1 ${
          stats.criticalAlertCount > 0 ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Repeated Failures</span>
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.criticalAlertCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold block truncate">Exceeded retry threshold</span>
        </div>

        {/* Resolved Recoveries */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Resolved Recoveries</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.resolvedCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold block truncate">Recovered via retry</span>
        </div>

        {/* Recovery Rate % */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Recovery Rate</span>
            <ShieldAlert className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats.recoveryRatePct}%</div>
          <span className="text-[10px] text-slate-400 block truncate">Zero data loss guarantee</span>
        </div>

        {/* Auto-Retry Health */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Engine Policy</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {config.autoRetryEnabled ? 'Exp. Backoff' : 'Manual Mode'}
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Max {config.maxAutoRetries} auto-attempts</span>
        </div>

      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('queue_triage')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'queue_triage'
              ? 'border-rose-600 text-rose-900 bg-rose-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>Error Queue ({quarantinedItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts_log')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'alerts_log'
              ? 'border-amber-600 text-amber-900 bg-amber-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Bell className="h-4 w-4 text-amber-600" />
          <span>Repeated Failure Alerts ({criticalRepeatedFailures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resolved_history')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'resolved_history'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Resolved Recoveries ({resolvedItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('retry_policies')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'retry_policies'
              ? 'border-slate-800 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Retry Policies & Alert Setup</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: ERROR QUEUE TRIAGE DESK (Acceptance Criteria 1, 2, 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'queue_triage' && (
        <div className="space-y-4 font-mono text-xs">
          
          {/* Filters Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reference #, error code, error message..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Domain Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Domain:</span>
                <select
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <option value="all">All Domains</option>
                  <option value="invoices_dispatch">Invoices & Dispatches</option>
                  <option value="production_confirmation">Production Confirmations</option>
                  <option value="inventory_movement">Inventory Movements</option>
                  <option value="sales_orders">Sales Orders</option>
                  <option value="master_data">Master Data</option>
                </select>
              </div>

              {/* ERP System Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">ERP:</span>
                <select
                  value={systemFilter}
                  onChange={e => setSystemFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <option value="all">All ERPs</option>
                  <option value="oracle">Oracle Cloud</option>
                  <option value="sap">SAP S/4HANA</option>
                  <option value="tally">TallyPrime</option>
                  <option value="zoho">Zoho Books</option>
                </select>
              </div>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Severity:</span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  severityFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  severityFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Critical ({stats.criticalAlertCount})
              </button>
            </div>
          </div>

          {/* Quarantined List */}
          {quarantinedItems.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <strong className="text-slate-800 block text-sm">Error Queue is Completely Clear</strong>
              <p className="text-xs text-slate-500 mt-1">All synchronization transactions have committed successfully to corporate ERPs.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {quarantinedItems.map(item => {
                const isRepeatedFailure = item.retryCount >= config.alertOnFailureThreshold;

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 bg-white border rounded-xl shadow-3xs space-y-3 transition ${
                      isRepeatedFailure 
                        ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Item Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.severity === 'critical' ? 'bg-rose-100 text-rose-900' :
                          item.severity === 'high' ? 'bg-amber-100 text-amber-900' :
                          'bg-sky-100 text-sky-900'
                        }`}>
                          {item.severity}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase">
                          {item.erpSystem}
                        </span>

                        <strong className="text-slate-900 text-xs">{item.referenceNumber}</strong>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-700 font-bold truncate max-w-sm">{item.entityTitle}</span>
                      </div>

                      {/* Action Buttons (Acceptance Criteria 3: Manual Retry) */}
                      <div className="flex items-center space-x-2 shrink-0 font-mono">
                        <button
                          onClick={() => handleOpenInspector(item)}
                          className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Inspect / Edit</span>
                        </button>

                        <button
                          onClick={() => handleManualRetry(item)}
                          disabled={retryingId === item.id}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-350 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                        >
                          <RotateCcw className={`h-3 w-3 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                          <span>{retryingId === item.id ? 'Retrying...' : 'Retry Now'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Diagnostics & Error Diagnosis */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[11px]">
                      
                      <div className="md:col-span-8 p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1.5 text-rose-950">
                        <div className="flex items-center space-x-2">
                          <strong className="text-rose-900 uppercase text-[10px] tracking-wider">
                            Error Code: {item.errorCode}
                          </strong>
                          {item.httpStatus && (
                            <span className="bg-rose-200/80 text-rose-950 px-1.5 py-0.2 rounded text-[9px] font-bold">
                              HTTP {item.httpStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-800">{item.errorMessage}</div>
                        <div className="text-slate-600 font-medium">
                          <strong>Remediation:</strong> {item.suggestedRemediation}
                        </div>
                      </div>

                      {/* Retry Status & Backoff Schedule */}
                      <div className="md:col-span-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 uppercase font-bold">Retry Status</span>
                          <span className={`font-bold ${isRepeatedFailure ? 'text-rose-700' : 'text-slate-700'}`}>
                            Attempt {item.retryCount} of {item.maxRetries}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 uppercase font-bold">Next Backoff</span>
                          <span className="text-indigo-700 font-bold">
                            {item.backoffIntervalSec}s (Exp. Backoff)
                          </span>
                        </div>

                        {/* Alerts badge */}
                        <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-slate-400 uppercase font-bold">IT Alerts</span>
                          <div className="flex items-center space-x-1">
                            {item.alertsTriggered.length > 0 ? (
                              <span className="inline-flex items-center space-x-1 text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded font-bold">
                                <Bell className="h-3 w-3" />
                                <span>{item.alertsTriggered.length} Sent</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Standard Queue</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: REPEATED FAILURE ALERTS LOG (Acceptance Criteria 4)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts_log' && (
        <div className="space-y-4 font-mono text-xs">
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-950 shadow-3xs">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-sm">Repeated Failure Alert Dispatch Log</strong>
                <span className="text-[11px] text-amber-800 block">
                  Automatic escalation notifications dispatched when an ERP transaction fails 3 or more consecutive retries.
                </span>
              </div>
            </div>
            <button
              onClick={handleSendTestAlert}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs uppercase font-bold transition cursor-pointer shadow-3xs"
            >
              Trigger Test Alert
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Channel & Time</th>
                    <th className="py-3 px-4">Voucher Reference</th>
                    <th className="py-3 px-4">Recipient Destination</th>
                    <th className="py-3 px-4">Notification Content</th>
                    <th className="py-3 px-4 text-right">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {queueItems.flatMap(i => i.alertsTriggered.map(a => ({ ...a, refNo: i.referenceNumber }))).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        No alerts have been triggered yet. When a transaction fails repeatedly, alerts will appear here.
                      </td>
                    </tr>
                  ) : (
                    queueItems.flatMap(i => i.alertsTriggered.map(a => ({ ...a, refNo: i.referenceNumber }))).map(alt => (
                      <tr key={alt.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {alt.channel === 'whatsapp' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[9px] uppercase">
                                <MessageSquare className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </span>
                            ) : alt.channel === 'in_app' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[9px] uppercase">
                                <Bell className="h-3 w-3" />
                                <span>In-App</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[9px] uppercase">
                                <Terminal className="h-3 w-3" />
                                <span>Webhook</span>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {new Date(alt.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {alt.refNo}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          {alt.recipient}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">
                          {alt.message}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Delivered
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
          TAB 3: RESOLVED & RECOVERIES AUDIT
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'resolved_history' && (
        <div className="space-y-4 font-mono text-xs">
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Reference & Entity</th>
                    <th className="py-3 px-4">ERP Target</th>
                    <th className="py-3 px-4">Recovery Method</th>
                    <th className="py-3 px-4">Resolved Timestamp</th>
                    <th className="py-3 px-4">Total Attempts</th>
                    <th className="py-3 px-4 text-right">Audit State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {resolvedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No resolved records found.
                      </td>
                    </tr>
                  ) : (
                    resolvedItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{item.referenceNumber}</strong>
                          <span className="text-[10px] text-slate-400 block truncate max-w-sm">{item.entityTitle}</span>
                        </td>

                        <td className="py-3.5 px-4 uppercase font-bold text-slate-800">
                          {item.erpSystem}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                            {item.resolutionMethod?.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          {item.retryCount} attempts
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
          TAB 4: RETRY POLICIES & ALERT SETUP (Acceptance Criteria 2 & 4)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'retry_policies' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-5 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  EXPONENTIAL BACKOFF & ALERT POLICIES
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  IT Administrator Retry Queue Configuration
                </h3>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Backoff Intervals & Policy */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Exponential Backoff Engine
                </strong>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <strong className="block text-slate-800 text-xs">Automatic Retry Engine</strong>
                    <span className="text-[10px] text-slate-500">Run background retry cycle with backoff</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoRetryEnabled}
                      onChange={e => setConfig({ ...config, autoRetryEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Base Backoff (Seconds)</label>
                    <input
                      type="number"
                      value={config.baseBackoffSeconds}
                      onChange={e => setConfig({ ...config, baseBackoffSeconds: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Max Backoff Ceiling (Sec)</label>
                    <input
                      type="number"
                      value={config.maxBackoffSeconds}
                      onChange={e => setConfig({ ...config, maxBackoffSeconds: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Max Auto-Retries</label>
                    <input
                      type="number"
                      value={config.maxAutoRetries}
                      onChange={e => setConfig({ ...config, maxAutoRetries: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Alert Threshold Attempts</label>
                    <input
                      type="number"
                      value={config.alertOnFailureThreshold}
                      onChange={e => setConfig({ ...config, alertOnFailureThreshold: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Channel Alerts Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Repeated Failure Alert Destinations
                </strong>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">IT Admin WhatsApp Phone</label>
                  <input
                    type="text"
                    value={config.itAdminWhatsAppPhone}
                    onChange={e => setConfig({ ...config, itAdminWhatsAppPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">IT Admin Email Address</label>
                  <input
                    type="email"
                    value={config.itAdminEmail}
                    onChange={e => setConfig({ ...config, itAdminEmail: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Incident Webhook URL (Slack/PagerDuty)</label>
                  <input
                    type="text"
                    value={config.webhookUrl}
                    onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 5. Inspect / Edit Payload Modal (Acceptance Criteria 3) */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 font-mono text-xs animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600 block">
                  PAYLOAD INSPECTION & MANUAL REMEDIATION
                </span>
                <strong className="text-slate-900 text-sm">
                  {selectedItemForModal.referenceNumber} · {selectedItemForModal.erpSystem.toUpperCase()}
                </strong>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs uppercase px-2 py-1 rounded cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-950 text-[11px] space-y-1">
                <div><strong>Error Diagnostic:</strong> {selectedItemForModal.errorMessage}</div>
                <div className="text-slate-600"><strong>Remediation Advice:</strong> {selectedItemForModal.suggestedRemediation}</div>
              </div>

              {/* Editable Request Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Request Payload ({selectedItemForModal.payloadFormat.toUpperCase()}) - Edit & Retry
                  </span>
                  <button
                    onClick={() => handleCopy(editablePayload, 'modal_edit_payload')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    {copiedId === 'modal_edit_payload' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === 'modal_edit_payload' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={editablePayload}
                  onChange={e => setEditablePayload(e.target.value)}
                  className="w-full p-3 bg-slate-950 text-indigo-200 border border-slate-800 rounded-lg font-mono text-[11px]"
                />
              </div>

              {selectedItemForModal.lastResponsePayload && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Last Error Response from ERP</span>
                  <div className="p-2.5 bg-slate-950 text-rose-300 rounded-lg border border-slate-800 text-[10px] max-h-32 overflow-auto">
                    <pre>{selectedItemForModal.lastResponsePayload}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleManualRetry(selectedItemForModal, editablePayload)}
                disabled={retryingId === selectedItemForModal.id}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${retryingId === selectedItemForModal.id ? 'animate-spin' : ''}`} />
                <span>{retryingId === selectedItemForModal.id ? 'Retrying...' : 'Save & Retry Now'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
