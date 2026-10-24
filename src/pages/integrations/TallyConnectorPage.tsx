// src/pages/integrations/TallyConnectorPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { 
  TallyGatewayConfig, 
  TallyGatewayHealth, 
  TallySyncTransaction, 
  TallyConnectorKpis,
  TallyVoucherCategory,
  TallySyncStatus,
  TallyGstInvoiceData
} from '../../types/tallyConnector';
import { 
  tallyConnectorService, 
  DEFAULT_TALLY_CONFIG 
} from '../../services/tallyConnectorService';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCode, 
  Database, 
  Scale, 
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
  Sparkles,
  Globe
} from 'lucide-react';

export const TallyConnectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'gateway_console' | 'odbc_fallback' | 'gst_engine' | 'settings'>('transactions');

  // Core state
  const [config, setConfig] = useState<TallyGatewayConfig>(tallyConnectorService.getConfig(tenantId));
  const [transactions, setTransactions] = useState<TallySyncTransaction[]>([]);
  const [kpis, setKpis] = useState<TallyConnectorKpis>(tallyConnectorService.getKpis(tenantId));
  const [health, setHealth] = useState<TallyGatewayHealth | null>(null);

  // Action states
  const [pinging, setPinging] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [actionTxId, setActionTxId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Inspector Modal
  const [selectedTx, setSelectedTx] = useState<TallySyncTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TallyVoucherCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TallySyncStatus>('all');

  // Interactive GST Simulator State
  const [gstSimPartyGstin, setGstSimPartyGstin] = useState('27AAACB2234P1Z2'); // Maharashtra (Inter-State)
  const [gstSimInvoiceNo, setGstSimInvoiceNo] = useState('INV-2026-0099');
  const [gstSimTaxableAmount, setGstSimTaxableAmount] = useState(150000);
  const [gstSimEwayBill, setGstSimEwayBill] = useState('241928374829');
  const [gstSimVehicle, setGstSimVehicle] = useState('GJ-06-AX-8910');
  const [gstSimIrn, setGstSimIrn] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  const loadData = () => {
    const loadedConfig = tallyConnectorService.getConfig(tenantId);
    const loadedTxns = tallyConnectorService.getTransactions(tenantId);
    const loadedKpis = tallyConnectorService.getKpis(tenantId);
    setConfig(loadedConfig);
    setTransactions(loadedTxns);
    setKpis(loadedKpis);
  };

  useEffect(() => {
    loadData();
    // Initial health check
    handlePingGateway(false);

    const handleConfigUpdate = () => loadData();
    const handleTxnsUpdate = () => loadData();
    window.addEventListener('tally_config_updated', handleConfigUpdate);
    window.addEventListener('tally_txns_updated', handleTxnsUpdate);
    return () => {
      window.removeEventListener('tally_config_updated', handleConfigUpdate);
      window.removeEventListener('tally_txns_updated', handleTxnsUpdate);
    };
  }, [tenantId]);

  // Ping Gateway Server
  const handlePingGateway = async (showToast: boolean = true) => {
    setPinging(true);
    try {
      const result = await tallyConnectorService.pingGateway(config);
      setHealth(result);
      if (showToast) {
        if (result.isOnline) {
          toastSuccess('Tally Gateway Online', `Connected to ${result.activeCompanyName} via port ${config.serverPort} (${result.latencyMs}ms).`);
        } else {
          toastInfo('Tally Gateway', result.diagMessage || 'HTTP Gateway offline. ODBC Fallback ready.');
        }
      }
    } catch (e: any) {
      if (showToast) toastError('Ping Failed', e.message);
    } finally {
      setPinging(false);
    }
  };

  // Push single transaction (HTTP or ODBC Fallback)
  const handlePushTx = async (txId: string, forceOdbc: boolean = false) => {
    setActionTxId(txId);
    try {
      const res = await tallyConnectorService.pushTransaction(tenantId, txId, forceOdbc);
      if (res.status === 'synced') {
        toastSuccess('Tally Sync Success', `Voucher ${res.tallyVoucherNumber} created in TallyPrime.`);
      } else if (res.status === 'fallback_odbc') {
        toastInfo('ODBC Fallback Dispatched', `Voucher ${res.referenceNumber} processed via ${config.odbcDsn}.`);
      }
      loadData();
    } catch (e: any) {
      toastError('Sync Failed', e.message);
    } finally {
      setActionTxId(null);
    }
  };

  // Push all pending transactions
  const handlePushAllPending = async () => {
    setSyncingAll(true);
    toastInfo('Transmitting to Tally', `Pushing ${kpis.pendingCount} pending vouchers to TallyPrime...`);
    try {
      await tallyConnectorService.syncAllPending(tenantId);
      toastSuccess('Batch Sync Complete', 'All pending transactions posted to TallyPrime.');
      loadData();
    } catch (e: any) {
      toastError('Batch Sync Error', e.message);
    } finally {
      setSyncingAll(false);
    }
  };

  // Save Settings
  const handleSaveConfig = () => {
    setSavingConfig(true);
    try {
      tallyConnectorService.saveConfig(tenantId, config);
      toastSuccess('Configuration Saved', 'Tally Gateway and ODBC Fallback settings updated.');
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
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        t.referenceNumber.toLowerCase().includes(q) ||
        t.entityTitle.toLowerCase().includes(q) ||
        t.tallyVoucherType.toLowerCase().includes(q) ||
        (t.tallyVoucherNumber && t.tallyVoucherNumber.toLowerCase().includes(q));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [transactions, categoryFilter, statusFilter, searchQuery]);

  // Simulated GST Calculation
  const isInterState = useMemo(() => {
    const supplierStateCode = '24'; // Gujarat
    const customerStateCode = gstSimPartyGstin.slice(0, 2);
    return supplierStateCode !== customerStateCode;
  }, [gstSimPartyGstin]);

  const simulatedTaxBreakdown = useMemo(() => {
    const taxable = gstSimTaxableAmount;
    const rate = 18;
    if (isInterState) {
      const igst = (taxable * rate) / 100;
      return {
        taxable,
        cgst: 0,
        sgst: 0,
        igst,
        totalTax: igst,
        grandTotal: taxable + igst
      };
    } else {
      const cgst = (taxable * (rate / 2)) / 100;
      const sgst = (taxable * (rate / 2)) / 100;
      return {
        taxable,
        cgst,
        sgst,
        igst: 0,
        totalTax: cgst + sgst,
        grandTotal: taxable + cgst + sgst
      };
    }
  }, [gstSimTaxableAmount, isInterState]);

  // Live generated XML for GST Simulator
  const simulatedXml = useMemo(() => {
    const data: TallyGstInvoiceData = {
      invoiceNumber: gstSimInvoiceNo,
      invoiceDate: '2026-10-18',
      dispatchNumber: 'DSP-2026-0120',
      customerName: isInterState ? 'Bharat Forge Ltd. (Pune Plant)' : 'Tata Motors CVBU (Sanand Plant)',
      customerGstin: gstSimPartyGstin,
      customerState: isInterState ? 'Maharashtra' : 'Gujarat',
      customerStateCode: gstSimPartyGstin.slice(0, 2),
      supplierGstin: '24AABCA1234F1Z8',
      supplierState: 'Gujarat',
      supplierStateCode: '24',
      placeOfSupply: isInterState ? `${gstSimPartyGstin.slice(0, 2)}-Maharashtra` : '24-Gujarat',
      isInterState,
      ewayBillNumber: gstSimEwayBill,
      vehicleNumber: gstSimVehicle,
      irnNumber: gstSimIrn,
      taxableValue: simulatedTaxBreakdown.taxable,
      cgstAmount: simulatedTaxBreakdown.cgst,
      sgstAmount: simulatedTaxBreakdown.sgst,
      igstAmount: simulatedTaxBreakdown.igst,
      totalTax: simulatedTaxBreakdown.totalTax,
      roundOff: 0,
      grandTotal: simulatedTaxBreakdown.grandTotal,
      items: [
        {
          itemCode: 'FG-SPUR-GEAR-M4',
          itemName: 'Forged Steel Spur Gear (Mod 4, 32T)',
          hsnCode: '84834000',
          quantity: 40,
          uom: 'Nos',
          rate: 3750,
          amount: simulatedTaxBreakdown.taxable,
          gstRatePercent: 18,
          godownName: config.fgGodown,
          batchNumber: 'LOT-2026-SG-401'
        }
      ]
    };
    return tallyConnectorService.generateGstInvoiceXml(data, config);
  }, [config, gstSimInvoiceNo, gstSimPartyGstin, isInterState, simulatedTaxBreakdown, gstSimEwayBill, gstSimVehicle, gstSimIrn]);

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      
      {/* 1. Header Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
              INDIA SPECIFIC · TALLYPRIME ERP INTEGRATION
            </span>
            <span className="text-slate-300">·</span>
            
            {/* Live Gateway Status Badge */}
            {health?.isOnline ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gateway Active ({health.latencyMs}ms)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>ODBC Fallback Ready</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            Tally Connector (India-Specific)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Seamless two-way integration with TallyPrime for Sales Orders, Dispatches & Invoices, and Inventory Movements. Fully compliant with Indian GST (CGST/SGST/IGST), E-Way Bill, and IRN with automated ODBC fallback.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => handlePingGateway(true)}
            disabled={pinging}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Ping Tally XML Gateway Server (Port 9000)"
          >
            <Server className={`h-4 w-4 ${pinging ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>{pinging ? 'Pinging...' : 'Ping Gateway'}</span>
          </button>

          {kpis.pendingCount > 0 && (
            <button
              onClick={handlePushAllPending}
              disabled={syncingAll}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-350 text-white text-xs uppercase font-extrabold tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-200" />
              <span>{syncingAll ? 'Posting...' : `Push All Pending (${kpis.pendingCount})`}</span>
            </button>
          )}

          <button
            onClick={() => navigate('/settings/master-data-sync')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Master Data Sync"
          >
            <span>Master Data</span>
          </button>

          <button
            onClick={() => navigate('/integrations/oracle-sap')}
            className="border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Switch to Enterprise Oracle Fusion & SAP S/4HANA REST API Connector"
          >
            <Globe className="h-4 w-4 text-sky-600" />
            <span>Oracle / SAP REST</span>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono">
        
        {/* Total Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Total Vouchers</span>
            <FileCode className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.totalTransactions}</div>
          <span className="text-[10px] text-slate-400 block truncate">SO, Invoices & Movements</span>
        </div>

        {/* XML/HTTP Synced */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">XML / HTTP Synced</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{kpis.syncedCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold block truncate">Port 9000 Gateway Direct</span>
        </div>

        {/* ODBC Fallback Recoveries */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">ODBC Fallbacks</span>
            <Database className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{kpis.odbcFallbackCount}</div>
          <span className="text-[10px] text-indigo-700 font-semibold block truncate">DSN Failover Recovered</span>
        </div>

        {/* Pending Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Pending Sync</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.pendingCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold block truncate">Ready for transmission</span>
        </div>

        {/* Total Synced Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Synced Value</span>
            <Scale className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 truncate">
            ₹{kpis.totalSyncedValueINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Reconciled in Tally</span>
        </div>

      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-amber-600 text-amber-900 bg-amber-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Unified Sync Desk ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway_console')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'gateway_console'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>XML/HTTP Gateway Console</span>
        </button>

        <button
          onClick={() => setActiveTab('odbc_fallback')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'odbc_fallback'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>ODBC Fallback Center ({kpis.odbcFallbackCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('gst_engine')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'gst_engine'
              ? 'border-purple-600 text-purple-900 bg-purple-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>GST Invoice Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-slate-800 text-slate-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Ledger & Godown Mappings</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: UNIFIED TRANSACTIONS SYNC DESK
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 font-mono text-xs">
          
          {/* Filters Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
            
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search voucher #, ref #, party name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Voucher:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <option value="all">All Domains</option>
                  <option value="sales_order">Sales Orders</option>
                  <option value="dispatch_invoice">Dispatches / Invoices</option>
                  <option value="goods_receipt">Goods Receipts (GRN)</option>
                  <option value="material_issue">Material Issues</option>
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
                onClick={() => setStatusFilter('synced')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'synced' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                HTTP ({kpis.syncedCount})
              </button>
              <button
                onClick={() => setStatusFilter('fallback_odbc')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'fallback_odbc' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ODBC ({kpis.odbcFallbackCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pending ({kpis.pendingCount})
              </button>
            </div>

          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">FlowOps Ref / Domain</th>
                    <th className="py-3 px-4">Party / Item Description</th>
                    <th className="py-3 px-4">Tally Voucher Type</th>
                    <th className="py-3 px-4">Amount (₹)</th>
                    <th className="py-3 px-4">Tally Voucher #</th>
                    <th className="py-3 px-4">Channel / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No Tally transactions match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isPending = tx.status === 'pending';
                      const isOdbc = tx.status === 'fallback_odbc';
                      const isSynced = tx.status === 'synced';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Ref & Domain */}
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block">{tx.referenceNumber}</strong>
                            <div className="mt-1">
                              {tx.category === 'dispatch_invoice' ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold text-[9px] uppercase">
                                  <Truck className="h-3 w-3" />
                                  <span>GST Dispatch</span>
                                </span>
                              ) : tx.category === 'sales_order' ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 font-bold text-[9px] uppercase">
                                  <ShoppingBag className="h-3 w-3" />
                                  <span>Sales Order</span>
                                </span>
                              ) : tx.category === 'goods_receipt' ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 font-bold text-[9px] uppercase">
                                  <Package className="h-3 w-3" />
                                  <span>Receipt (GRN)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px] uppercase">
                                  <Layers className="h-3 w-3" />
                                  <span>Material Issue</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Party / Title */}
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-800 block truncate max-w-[220px]">{tx.entityTitle}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(tx.timestamp).toLocaleString()}
                            </span>
                          </td>

                          {/* Voucher Type */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800">{tx.tallyVoucherType}</span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            ₹{tx.amountINR.toLocaleString('en-IN')}
                          </td>

                          {/* Tally Voucher # */}
                          <td className="py-3.5 px-4 font-mono">
                            {tx.tallyVoucherNumber ? (
                              <div>
                                <strong className="text-slate-900 block">{tx.tallyVoucherNumber}</strong>
                                <span className="text-[9px] text-slate-400 block">ID: {tx.tallyMasterId}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Unposted</span>
                            )}
                          </td>

                          {/* Channel / Status */}
                          <td className="py-3.5 px-4">
                            {isSynced ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>HTTP Synced</span>
                              </span>
                            ) : isOdbc ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase" title="Recovered via Tally ODBC driver">
                                <Database className="h-3 w-3 text-indigo-600" />
                                <span>ODBC Fallback</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedTx(tx)}
                                className="px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                title="Inspect XML & ODBC Payload"
                              >
                                View
                              </button>

                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handlePushTx(tx.id, false)}
                                    disabled={actionTxId === tx.id}
                                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-350 text-white rounded-lg text-[10px] uppercase font-bold transition cursor-pointer flex items-center space-x-1"
                                    title="Push via XML/HTTP Gateway"
                                  >
                                    <Zap className="h-3 w-3 text-amber-200" />
                                    <span>Sync</span>
                                  </button>

                                  <button
                                    onClick={() => handlePushTx(tx.id, true)}
                                    disabled={actionTxId === tx.id}
                                    className="px-2 py-1.5 border border-indigo-300 hover:bg-indigo-50 text-indigo-700 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                    title="Failover directly via ODBC Fallback"
                                  >
                                    ODBC
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handlePushTx(tx.id, false)}
                                  disabled={actionTxId === tx.id}
                                  className="px-2 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-bold transition cursor-pointer"
                                  title="Re-sync voucher to Tally"
                                >
                                  Re-sync
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
          TAB 2: XML/HTTP GATEWAY CONSOLE (Acceptance Criteria 1)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'gateway_console' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Interactive XML Terminal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-xs">Tally Gateway Server HTTP Request (Port {config.serverPort})</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
                    POST {config.protocol}://{config.serverHost}:{config.serverPort}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Direct XML/HTTP envelope sent over socket to TallyPrime's Gateway Server engine:
                </p>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-300">
                  <pre>{`<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${config.companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`}</pre>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Expected Response: <code className="text-emerald-400">&lt;COMPANY&gt;...&lt;/COMPANY&gt;</code>
                  </div>
                  <button
                    onClick={() => handlePingGateway(true)}
                    disabled={pinging}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${pinging ? 'animate-spin' : ''}`} />
                    <span>{pinging ? 'Executing Request...' : 'Send XML Request'}</span>
                  </button>
                </div>
              </div>

              {/* Server Diagnostics Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-3xs">
                <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <span>Gateway Diagnostics & Protocol Parameters</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Protocol</span>
                    <strong className="text-slate-900 block mt-0.5">{config.protocol.toUpperCase()} / XML</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Port Number</span>
                    <strong className="text-slate-900 block mt-0.5">{config.serverPort}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Active Engine</span>
                    <strong className="text-emerald-700 block mt-0.5">{health?.tallyVersion || 'TallyPrime 4.1'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Failover Protocol</span>
                    <strong className="text-indigo-700 block mt-0.5">ODBC (DSN {config.odbcDsn})</strong>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-[11px] space-y-1">
                  <strong>Gateway Engine Status:</strong>
                  <div>{health?.diagMessage || 'Gateway HTTP listening on port 9000. ODBC server standby ready.'}</div>
                </div>
              </div>

            </div>

            {/* Right Col: Tally Configuration Instructions */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5 shadow-3xs">
              <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                <Server className="h-4 w-4 text-amber-600" />
                <span>Enabling Tally Gateway Server</span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                To enable two-way XML/HTTP communications in your local TallyPrime instance:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-700 leading-normal">
                <li>
                  In TallyPrime, press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">F12: Configure</kbd>.
                </li>
                <li>
                  Select <strong>Advanced Configuration</strong>.
                </li>
                <li>
                  Set <strong>Enable ODBC Server</strong> to <strong className="text-emerald-700">Yes</strong>.
                </li>
                <li>
                  Set <strong>Port</strong> to <strong className="text-amber-700">9000</strong> (matching FlowOps config).
                </li>
                <li>
                  Set <strong>Client/Server Configuration</strong> to <strong className="text-indigo-700">Both</strong>.
                </li>
                <li>
                  Restart TallyPrime. Verify that the bottom status bar shows: <code className="text-[10px] text-slate-800 bg-slate-100 px-1 py-0.5 rounded">Server: 9000 (ODBC enabled)</code>.
                </li>
              </ol>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-950 space-y-1">
                <strong>Pro-Tip for Indian SMEs:</strong>
                <p>
                  If FlowOps runs on cloud and TallyPrime is on your factory LAN, use a lightweight reverse proxy or Cloudflare Tunnel to expose port 9000 securely without opening public routers.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: ODBC FALLBACK CENTER (Acceptance Criteria 2)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'odbc_fallback' && (
        <div className="space-y-6 font-mono text-xs">
          
          {/* Header Banner */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-indigo-950 shadow-3xs">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <strong className="block text-sm">Automated Tally ODBC Fallback Architecture</strong>
                <span className="text-[11px] text-indigo-800 block">
                  Ensures zero data loss. If Windows Firewall or antivirus blocks HTTP port 9000, FlowOps automatically reroutes vouchers via the registered 64-bit Tally ODBC DSN driver.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded">
                Active DSN: {config.odbcDsn}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ODBC SQL Generator & Query Inspector */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  <span>ODBC SQL Statement Generator (Live Preview)</span>
                </span>
                <button
                  onClick={() => handleCopy(`-- FlowOps Tally ODBC Batch Script
-- Target DSN: ${config.odbcDsn}
SELECT $Name, $Parent, $OpeningBalance FROM "Ledger";
INSERT INTO "Voucher" ($Date, $VoucherTypeName, $VoucherNumber, $PartyLedgerName, $Amount, $Narration) VALUES ('2026-10-18', 'Sales', 'INV-2026-0082', 'Bharat Forge Ltd', 289100, 'FlowOps Invoiced Dispatch via ODBC');`, 'odbc_sql')}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-bold cursor-pointer"
                >
                  {copiedId === 'odbc_sql' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedId === 'odbc_sql' ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                SQL syntax supported natively by Tally's embedded SQL engine:
              </p>

              <div className="p-3 bg-slate-950 text-indigo-300 font-mono text-[11px] rounded-lg border border-slate-800 overflow-x-auto">
                <pre>{`-- 1. Read Ledgers & Balances via ODBC DSN
SELECT $Name, $Parent, $ClosingBalance 
FROM "Ledger" 
WHERE $Parent = 'Sundry Debtors';

-- 2. Fallback Voucher Insertion (Lorry Dispatch)
INSERT INTO "Voucher" (
  $Date, 
  $VoucherTypeName, 
  $VoucherNumber, 
  $Reference, 
  $PartyLedgerName, 
  $Amount, 
  $Narration
) VALUES (
  '2026-10-18', 
  'Sales', 
  'INV-2026-0082', 
  'DSP-2026-0091', 
  'Bharat Forge Ltd.', 
  289100.00, 
  'FlowOps Invoiced Dispatch synced via ODBC Fallback'
);`}</pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400">Driver: {config.odbcDriverName}</span>
                <button
                  onClick={() => {
                    const blob = new Blob([`' FlowOps VBScript Tally ODBC Runner
Dim conn, rs
Set conn = CreateObject("ADODB.Connection")
conn.Open "DSN=${config.odbcDsn};"
WScript.Echo "Connected to TallyPrime via DSN: ${config.odbcDsn}"
Set rs = conn.Execute("SELECT $Name, $ClosingBalance FROM ""Ledger"" WHERE $Parent = 'Sundry Debtors'")
Do While Not rs.EOF
    WScript.Echo rs.Fields(0).Value & " -> " & rs.Fields(1).Value
    rs.MoveNext
Loop
conn.Close`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tally_odbc_sync_${config.odbcDsn}.vbs`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toastSuccess('Script Exported', `Downloaded tally_odbc_sync_${config.odbcDsn}.vbs`);
                  }}
                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[10px] uppercase font-bold flex items-center space-x-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download ODBC Script (.vbs)</span>
                </button>
              </div>
            </div>

            {/* ODBC Fallback Queue & Failover Log */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
              <span className="font-bold text-slate-900 text-xs flex items-center space-x-2 border-b border-slate-100 pb-2">
                <RotateCcw className="h-4 w-4 text-indigo-600" />
                <span>Recent ODBC Fallback Executions ({kpis.odbcFallbackCount})</span>
              </span>

              <div className="space-y-3">
                {transactions.filter(t => t.status === 'fallback_odbc').length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <strong>No Fallback Recoveries Needed</strong>
                    <p className="text-[11px] text-slate-500 mt-1">All vouchers are posting through direct HTTP Gateway.</p>
                  </div>
                ) : (
                  transactions.filter(t => t.status === 'fallback_odbc').map(tx => (
                    <div key={tx.id} className="p-3 bg-slate-50 border border-indigo-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{tx.referenceNumber}</strong>
                        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded">
                          {tx.tallyVoucherNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">{tx.entityTitle}</div>
                      <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                        {tx.errorMessage}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: GST-COMPLIANT INVOICE ENGINE (Acceptance Criteria 3)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'gst_engine' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Interactive GST Parameters Simulator */}
            <div className="lg:col-span-5 p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-3xs">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider block">
                  STATUTORY COMPLIANCE CALCULATOR
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  GSTIN & Place of Supply Validation
                </h3>
              </div>

              {/* Customer GSTIN */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Buyer GSTIN (15 Digits)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={gstSimPartyGstin}
                    onChange={e => setGstSimPartyGstin(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                  <button
                    onClick={() => setGstSimPartyGstin(isInterState ? '24AAACT2727Q1ZW' : '27AAACB2234P1Z2')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded uppercase font-bold"
                  >
                    Switch State
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>State Code: {gstSimPartyGstin.slice(0, 2)}</span>
                  <span className={`font-bold ${isInterState ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    {isInterState ? 'Inter-State (IGST 18%)' : 'Intra-State (CGST 9% + SGST 9%)'}
                  </span>
                </div>
              </div>

              {/* Invoice Number & Taxable Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Invoice Number</label>
                  <input
                    type="text"
                    value={gstSimInvoiceNo}
                    onChange={e => setGstSimInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Taxable Amount (₹)</label>
                  <input
                    type="number"
                    value={gstSimTaxableAmount}
                    onChange={e => setGstSimTaxableAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* E-Way Bill & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">E-Way Bill (12 Digits)</label>
                  <input
                    type="text"
                    value={gstSimEwayBill}
                    onChange={e => setGstSimEwayBill(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Lorry Vehicle No.</label>
                  <input
                    type="text"
                    value={gstSimVehicle}
                    onChange={e => setGstSimVehicle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* IRN Hash */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">E-Invoice IRN Hash (64 Hex)</label>
                <input
                  type="text"
                  value={gstSimIrn}
                  onChange={e => setGstSimIrn(e.target.value)}
                  className="w-full px-3 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600 truncate"
                />
              </div>

              {/* Tax Summary Box */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span>Tax Summary (HSN 8483)</span>
                  <span>Grand Total: ₹{simulatedTaxBreakdown.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-purple-900 font-mono">
                  <div>Taxable: ₹{simulatedTaxBreakdown.taxable.toLocaleString('en-IN')}</div>
                  {isInterState ? (
                    <div className="col-span-2 font-bold text-indigo-700">IGST (18%): ₹{simulatedTaxBreakdown.igst.toLocaleString('en-IN')}</div>
                  ) : (
                    <>
                      <div>CGST (9%): ₹{simulatedTaxBreakdown.cgst.toLocaleString('en-IN')}</div>
                      <div>SGST (9%): ₹{simulatedTaxBreakdown.sgst.toLocaleString('en-IN')}</div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Right 7 Cols: Live Tally GST XML Preview */}
            <div className="lg:col-span-7 p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 shadow-3xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <FileCode className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-xs">Generated Tally GST Invoice XML (&lt;VOUCHER VCHTYPE="Sales"&gt;)</span>
                </div>
                <button
                  onClick={() => handleCopy(simulatedXml, 'gst_xml')}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-bold cursor-pointer"
                >
                  {copiedId === 'gst_xml' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedId === 'gst_xml' ? 'Copied' : 'Copy XML'}</span>
                </button>
              </div>

              <div className="flex-1 bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[10px] overflow-auto max-h-[380px] text-amber-200">
                <pre>{simulatedXml}</pre>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Statutory tags included: UDF:EWAYBILLNO, UDF:IRNNO, UDF:VEHICLENO</span>
                <span className="text-emerald-400">100% TallyPrime XML DTD Compliant</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 5: SETTINGS & LEDGER MAPPING
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-6 font-mono text-xs">
          
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-5 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ACCOUNTING CHART OF ACCOUNTS & GODOWNS
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Tally Ledger & Godown Allocation Rules
                </h3>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Tally Server Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Tally Gateway Engine
                </strong>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Host IP / Domain</label>
                    <input
                      type="text"
                      value={config.serverHost}
                      onChange={e => setConfig({ ...config, serverHost: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Port</label>
                    <input
                      type="number"
                      value={config.serverPort}
                      onChange={e => setConfig({ ...config, serverPort: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Company Name (Exact Tally match)</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={e => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">ODBC DSN Driver Name</label>
                  <input
                    type="text"
                    value={config.odbcDsn}
                    onChange={e => setConfig({ ...config, odbcDsn: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* GST Tax Ledgers */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <strong className="block text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  GST Tax Ledgers
                </strong>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Output CGST Ledger</label>
                    <input
                      type="text"
                      value={config.cgstLedger}
                      onChange={e => setConfig({ ...config, cgstLedger: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Output SGST Ledger</label>
                    <input
                      type="text"
                      value={config.sgstLedger}
                      onChange={e => setConfig({ ...config, sgstLedger: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Output IGST Ledger</label>
                    <input
                      type="text"
                      value={config.igstLedger}
                      onChange={e => setConfig({ ...config, igstLedger: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Round-Off Ledger</label>
                    <input
                      type="text"
                      value={config.roundOffLedger}
                      onChange={e => setConfig({ ...config, roundOffLedger: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Finished Goods Godown</label>
                  <input
                    type="text"
                    value={config.fgGodown}
                    onChange={e => setConfig({ ...config, fgGodown: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. Voucher Inspector Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 font-mono text-xs animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 block">
                  TALLY VOUCHER PAYLOAD INSPECTOR
                </span>
                <strong className="text-slate-900 text-sm">
                  {selectedTx.referenceNumber} · {selectedTx.tallyVoucherType}
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
                  <span className="text-slate-400 block text-[9px] uppercase">Entity Title</span>
                  <strong className="text-slate-900 truncate block">{selectedTx.entityTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Amount</span>
                  <strong className="text-slate-900 block">₹{selectedTx.amountINR.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Channel Used</span>
                  <strong className="text-indigo-700 block uppercase">{selectedTx.usedChannel}</strong>
                </div>
              </div>

              {/* Request XML */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tally XML Request Payload</span>
                  <button
                    onClick={() => handleCopy(selectedTx.requestXml, 'modal_req_xml')}
                    className="text-[10px] text-amber-600 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedId === 'modal_req_xml' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === 'modal_req_xml' ? 'Copied' : 'Copy XML'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 text-amber-200 rounded-lg border border-slate-800 text-[10px] max-h-48 overflow-auto">
                  <pre>{selectedTx.requestXml}</pre>
                </div>
              </div>

              {/* ODBC SQL Fallback (if applicable) */}
              {selectedTx.odbcFallbackSql && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">ODBC Fallback Query</span>
                  <div className="p-3 bg-slate-950 text-indigo-300 rounded-lg border border-slate-800 text-[10px] max-h-36 overflow-auto">
                    <pre>{selectedTx.odbcFallbackSql}</pre>
                  </div>
                </div>
              )}

              {/* Response XML */}
              {selectedTx.responseXml && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Tally Gateway Server Response</span>
                  <div className="p-3 bg-slate-950 text-emerald-300 rounded-lg border border-slate-800 text-[10px] max-h-36 overflow-auto">
                    <pre>{selectedTx.responseXml}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Logged at: {new Date(selectedTx.timestamp).toLocaleString()}
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
