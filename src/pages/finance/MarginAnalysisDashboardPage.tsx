// src/pages/finance/MarginAnalysisDashboardPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Flame,
  Calendar,
  Filter,
  Download,
  Search,
  RotateCcw,
  Sliders,
  ChevronDown,
  Package,
  User,
  FileText,
  Trophy,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  TimePeriodOption,
  MarginFilterParams,
  OrderMarginSummary
} from '../../types/marginAnalysis';
import { marginAnalysisService } from '../../services/marginAnalysisService';
import { LivePnlExecutiveWaterfall } from '../../components/margin-analysis/LivePnlExecutiveWaterfall';
import { MarginTrendChart } from '../../components/margin-analysis/MarginTrendChart';
import { TopBottomPerformersCard } from '../../components/margin-analysis/TopBottomPerformersCard';
import { OrderDetailDrawer } from '../../components/margin-analysis/OrderDetailDrawer';

type ActiveTab = 'overview' | 'products' | 'customers' | 'orders' | 'trends' | 'performers';

export const MarginAnalysisDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<MarginFilterParams>({
    timePeriod: 'all_time',
    customer: 'all',
    product: 'all',
    health: 'all',
    searchQuery: '',
    targetMarginPct: 25.0
  });

  // Table Sorting States
  const [productSortField, setProductSortField] = useState<'revenue' | 'profit' | 'margin' | 'variance'>('revenue');
  const [customerSortField, setCustomerSortField] = useState<'revenue' | 'profit' | 'margin' | 'contribution'>('revenue');
  const [orderSortField, setOrderSortField] = useState<'date' | 'revenue' | 'margin' | 'dilution'>('date');

  // Filter dropdown options
  const filterOptions = useMemo(() => {
    return marginAnalysisService.getFilterOptions();
  }, []);

  // Aggregated Data
  const livePnl = useMemo(() => {
    return marginAnalysisService.getLivePnLSummary(filters);
  }, [filters]);

  const productMargins = useMemo(() => {
    const list = marginAnalysisService.getProductMargins(filters);
    return list.sort((a, b) => {
      if (productSortField === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (productSortField === 'profit') return b.grossProfit - a.grossProfit;
      if (productSortField === 'margin') return b.grossMarginPct - a.grossMarginPct;
      if (productSortField === 'variance') return a.marginVariancePct - b.marginVariancePct;
      return 0;
    });
  }, [filters, productSortField]);

  const customerMargins = useMemo(() => {
    const list = marginAnalysisService.getCustomerMargins(filters);
    return list.sort((a, b) => {
      if (customerSortField === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (customerSortField === 'profit') return b.grossProfit - a.grossProfit;
      if (customerSortField === 'margin') return b.grossMarginPct - a.grossMarginPct;
      if (customerSortField === 'contribution') return b.marginContributionPct - a.marginContributionPct;
      return 0;
    });
  }, [filters, customerSortField]);

  const orderMargins = useMemo(() => {
    const list = marginAnalysisService.getFilteredOrders(filters);
    return list.sort((a, b) => {
      if (orderSortField === 'date') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (orderSortField === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (orderSortField === 'margin') return b.actualGrossMarginPercent - a.actualGrossMarginPercent;
      if (orderSortField === 'dilution') return b.marginDilutionPercent - a.marginDilutionPercent;
      return 0;
    });
  }, [filters, orderSortField]);

  const periodTrends = useMemo(() => {
    return marginAnalysisService.getTimePeriodTrend(filters);
  }, [filters]);

  const topBottomPerformers = useMemo(() => {
    return marginAnalysisService.getTopBottomPerformers(filters);
  }, [filters]);

  // Selected Order for Slide-Over Drawer
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    const all = marginAnalysisService.getUnifiedOrders();
    return all.find(o => o.workOrderId === selectedOrderId) || null;
  }, [selectedOrderId]);

  // Currency Formatter
  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export handlers
  const handleExportSummary = () => {
    marginAnalysisService.exportSummaryCsv(livePnl, filters);
    addToast('success', 'Live P&L Executive Statement CSV downloaded.');
    setIsExportMenuOpen(false);
  };

  const handleExportProducts = () => {
    marginAnalysisService.exportProductMarginsCsv(productMargins);
    addToast('success', 'Product Gross Margin Matrix CSV downloaded.');
    setIsExportMenuOpen(false);
  };

  const handleExportCustomers = () => {
    marginAnalysisService.exportCustomerMarginsCsv(customerMargins);
    addToast('success', 'Customer Gross Margin Analysis CSV downloaded.');
    setIsExportMenuOpen(false);
  };

  const handleExportOrders = () => {
    marginAnalysisService.exportOrderMarginsCsv(orderMargins);
    addToast('success', 'Order-by-Order Gross Margin Audit CSV downloaded.');
    setIsExportMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── 1. Top Executive Navigation & Header ──────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Commercial P&L
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Precision Manufacturing Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Margin Analysis Dashboards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time gross margin by product, customer, order, and time period with absorption waterfall, live COPQ erosion, and benchmark tracking.
          </p>
        </div>

        {/* Action Buttons & Cross Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick links to sister financial tools */}
          <button
            onClick={() => navigate('/cost-variance')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-900/60 transition-all flex items-center gap-1.5"
            title="Planned vs Actual Variance Analysis"
          >
            <span>Variance Analysis</span>
          </button>

          <button
            onClick={() => navigate('/cost-simulation')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-white rounded-xl text-xs font-semibold border border-purple-900/60 transition-all flex items-center gap-1.5"
            title="What-If Cost Simulation"
          >
            <span>What-If Simulation</span>
          </button>

          <button
            onClick={() => navigate('/scrap-rework')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-900/60 transition-all flex items-center gap-1.5"
            title="Scrap & Rework COPQ Tracking"
          >
            <span>Scrap & Rework</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export P&L</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs animate-in fade-in duration-150">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Audit-Ready CSV Exports
                </div>
                <button
                  onClick={handleExportSummary}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live P&L Statement (Summary)</span>
                </button>
                <button
                  onClick={handleExportProducts}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span>Margin by Product (Breakdown)</span>
                </button>
                <button
                  onClick={handleExportCustomers}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Margin by Customer (Matrix)</span>
                </button>
                <button
                  onClick={handleExportOrders}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Margin by Order (Line Items)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Global Filter Toolbar ──────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time Period Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(
              [
                { id: 'all_time', label: 'All History' },
                { id: 'ytd', label: 'YTD 2026' },
                { id: 'qtd', label: 'Q4 2026' },
                { id: 'mtd', label: 'MTD (Oct)' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'today', label: 'Real-Time Today' }
              ] as const
            ).map(period => (
              <button
                key={period.id}
                onClick={() => setFilters(f => ({ ...f, timePeriod: period.id }))}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filters.timePeriod === period.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Benchmark Target Margin Slider / Control */}
          <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Target Benchmark:</span>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={filters.targetMarginPct}
              onChange={e => setFilters(f => ({ ...f, targetMarginPct: Number(e.target.value) }))}
              className="w-20 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-emerald-400 w-10 text-right">
              {filters.targetMarginPct}%
            </span>
          </div>
        </div>

        {/* Secondary Filter Dropdowns & Keyword Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, Part..."
              value={filters.searchQuery}
              onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={filters.customer}
              onChange={e => setFilters(f => ({ ...f, customer: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Customers</option>
              {filterOptions.customers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={filters.product}
              onChange={e => setFilters(f => ({ ...f, product: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Products / Parts</option>
              {filterOptions.products.map(p => (
                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
              ))}
            </select>
          </div>

          {/* Margin Health Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filters.health}
              onChange={e => setFilters(f => ({ ...f, health: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Margin Health Grades</option>
              <option value="high_margin">High Margin (≥25%)</option>
              <option value="healthy">Healthy (15% - 25%)</option>
              <option value="at_risk">At Risk (0% - 15%)</option>
              <option value="loss_making">Loss Making (&lt;0%)</option>
            </select>

            {(filters.customer !== 'all' || filters.product !== 'all' || filters.health !== 'all' || filters.searchQuery) && (
              <button
                onClick={() => setFilters(f => ({ ...f, customer: 'all', product: 'all', health: 'all', searchQuery: '' }))}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Tabbed Navigation Bar ──────────────────────────────────── */}
      <div className="flex border-b border-slate-800 text-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Live P&L & Waterfall</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Margin by Product ({productMargins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Margin by Customer ({customerMargins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Margin by Order ({orderMargins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'trends'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trend Over Time</span>
        </button>

        <button
          onClick={() => setActiveTab('performers')}
          className={`pb-3 px-4 font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'performers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Top / Bottom Performers</span>
        </button>
      </div>

      {/* ── 4. Main Tab Content Views ─────────────────────────────────── */}

      {/* TAB 1: Live P&L Executive Summary & Waterfall */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <LivePnlExecutiveWaterfall pnl={livePnl} />

          {/* Quick Preview of Top & Bottom Performers */}
          <TopBottomPerformersCard
            performers={topBottomPerformers}
            onSelectOrder={id => setSelectedOrderId(id)}
          />

          {/* Quick Preview of Time Series Trend */}
          <MarginTrendChart
            periods={periodTrends}
            targetMarginPct={filters.targetMarginPct}
          />
        </div>
      )}

      {/* TAB 2: Margin by Product */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                Gross Margin Analysis by Product / Manufactured Part
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluates revenue volume, unit economics (ASP vs Unit Cost), realized gross margin %, quoted variance, and cost drivers across {productMargins.length} part codes.
              </p>
            </div>

            {/* Sort Toggles */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-slate-500 px-2">Sort by:</span>
              <button
                onClick={() => setProductSortField('revenue')}
                className={`px-2.5 py-1 rounded ${productSortField === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setProductSortField('profit')}
                className={`px-2.5 py-1 rounded ${productSortField === 'profit' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Profit
              </button>
              <button
                onClick={() => setProductSortField('margin')}
                className={`px-2.5 py-1 rounded ${productSortField === 'margin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Margin %
              </button>
              <button
                onClick={() => setProductSortField('variance')}
                className={`px-2.5 py-1 rounded ${productSortField === 'variance' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Dilution
              </button>
            </div>
          </div>

          {/* Product Margin Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Part Code & Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Units</th>
                  <th className="py-3 px-3 text-right">ASP (₹)</th>
                  <th className="py-3 px-3 text-right">Unit Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Total Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                  <th className="py-3 px-3 text-right">Quote Var</th>
                  <th className="py-3 px-3 text-center">Health</th>
                  <th className="py-3 px-3">Primary Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {productMargins.map(p => {
                  return (
                    <tr key={p.partCode} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        <div className="font-semibold text-white">{p.partName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{p.partCode} • {p.orderCount} Jobs</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">{p.category}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{p.unitsCount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{formatInr(p.avgSellingPrice)}</td>
                      <td className="py-3 px-3 text-right text-rose-400">{formatInr(p.avgUnitCost)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatInr(p.totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatInr(p.totalCost)}</td>
                      <td className="py-3 px-4 text-right text-teal-400 font-bold">{formatInr(p.grossProfit)}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">{p.grossMarginPct}%</td>
                      <td className={`py-3 px-3 text-right font-medium ${p.marginVariancePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.marginVariancePct >= 0 ? `+${p.marginVariancePct}%` : `${p.marginVariancePct}%`}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.health === 'high_margin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : p.health === 'healthy'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            : p.health === 'at_risk'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}>
                          {p.health.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans capitalize text-slate-400 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {p.primaryCostDriver.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Margin by Customer */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Customer Account Profitability & Gross Margin Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Analyzes customer commercial terms, total gross revenue, profit contribution % to plant bottom line, and margin health across {customerMargins.length} client accounts.
              </p>
            </div>

            {/* Sort Toggles */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-slate-500 px-2">Sort by:</span>
              <button
                onClick={() => setCustomerSortField('revenue')}
                className={`px-2.5 py-1 rounded ${customerSortField === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setCustomerSortField('profit')}
                className={`px-2.5 py-1 rounded ${customerSortField === 'profit' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Profit
              </button>
              <button
                onClick={() => setCustomerSortField('margin')}
                className={`px-2.5 py-1 rounded ${customerSortField === 'margin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Margin %
              </button>
              <button
                onClick={() => setCustomerSortField('contribution')}
                className={`px-2.5 py-1 rounded ${customerSortField === 'contribution' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Profit Share
              </button>
            </div>
          </div>

          {/* Customer Margin Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Customer Name & Tier</th>
                  <th className="py-3 px-3 text-right">Orders</th>
                  <th className="py-3 px-3 text-right">Total Units</th>
                  <th className="py-3 px-4 text-right">Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Total Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                  <th className="py-3 px-3 text-right">Profit Share</th>
                  <th className="py-3 px-3 text-center">Health</th>
                  <th className="py-3 px-4">Primary Purchased Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customerMargins.map(c => {
                  return (
                    <tr key={c.customerId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        <div className="font-semibold text-white">{c.customerName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 font-medium text-[10px]">
                            {c.tier}
                          </span>
                          <span className="text-[11px] text-slate-400">Recent: {c.recentOrderDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">{c.orderCount}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{c.totalUnits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatInr(c.totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatInr(c.totalCost)}</td>
                      <td className="py-3 px-4 text-right text-teal-400 font-bold">{formatInr(c.grossProfit)}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">{c.grossMarginPct}%</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-semibold">{c.marginContributionPct}%</td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.health === 'high_margin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : c.health === 'healthy'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            : c.health === 'at_risk'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}>
                          {c.health.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300 text-[11px] truncate max-w-[200px]">
                        {c.topProduct}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Margin by Order */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Work Order Commercial Profitability & Margin Dilution Audit
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Line-item audit of individual work orders showing contract revenue, actual total cost, gross profit, quoted vs actual margin, and dilution factors.
              </p>
            </div>

            {/* Sort Toggles */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-slate-500 px-2">Sort by:</span>
              <button
                onClick={() => setOrderSortField('date')}
                className={`px-2.5 py-1 rounded ${orderSortField === 'date' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Date
              </button>
              <button
                onClick={() => setOrderSortField('revenue')}
                className={`px-2.5 py-1 rounded ${orderSortField === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setOrderSortField('margin')}
                className={`px-2.5 py-1 rounded ${orderSortField === 'margin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Margin %
              </button>
              <button
                onClick={() => setOrderSortField('dilution')}
                className={`px-2.5 py-1 rounded ${orderSortField === 'dilution' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Dilution
              </button>
            </div>
          </div>

          {/* Orders Margin Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Work Order / Sales Order</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Part Details</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Price/Unit</th>
                  <th className="py-3 px-4 text-right">Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Actual Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-3 text-right">Actual %</th>
                  <th className="py-3 px-3 text-right">Quoted %</th>
                  <th className="py-3 px-3 text-right">Dilution</th>
                  <th className="py-3 px-3 text-center">Health</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orderMargins.map(o => {
                  return (
                    <tr
                      key={o.workOrderId}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrderId(o.workOrderId)}
                    >
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        <div className="font-semibold text-white font-mono">{o.workOrderNumber}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{o.salesOrderNumber} • Due: {o.dueDate}</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 font-medium">{o.customerName}</td>
                      <td className="py-3 px-3 font-sans">
                        <div className="text-white text-xs">{o.partName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{o.partCode}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">{o.quantity}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{formatInr(o.contractPricePerUnit)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatInr(o.totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatInr(o.actualTotalCost)}</td>
                      <td className="py-3 px-4 text-right text-teal-400 font-bold">{formatInr(o.grossProfit)}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">{o.actualGrossMarginPercent}%</td>
                      <td className="py-3 px-3 text-right text-slate-400">{o.standardGrossMarginPercent}%</td>
                      <td className={`py-3 px-3 text-right font-medium ${o.marginDilutionPercent <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {o.marginDilutionPercent <= 0 ? `+${Math.abs(o.marginDilutionPercent)}%` : `-${o.marginDilutionPercent}%`}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.health === 'high_margin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : o.health === 'healthy'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            : o.health === 'at_risk'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}>
                          {o.health.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedOrderId(o.workOrderId);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Trends & Periodic P&L */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <MarginTrendChart
            periods={periodTrends}
            targetMarginPct={filters.targetMarginPct}
          />
        </div>
      )}

      {/* TAB 6: Top & Bottom Performers */}
      {activeTab === 'performers' && (
        <div className="space-y-6">
          <TopBottomPerformersCard
            performers={topBottomPerformers}
            onSelectOrder={id => setSelectedOrderId(id)}
          />
        </div>
      )}

      {/* ── 5. Slide-Over Order Detail Drawer ─────────────────────────── */}
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onNavigateToCostVariance={woNumber => navigate('/cost-variance')}
        onNavigateToScrapRework={() => navigate('/scrap-rework')}
      />
    </div>
  );
};
