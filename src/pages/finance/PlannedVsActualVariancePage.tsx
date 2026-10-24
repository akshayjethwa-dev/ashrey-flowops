// src/pages/finance/PlannedVsActualVariancePage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Search,
  Filter,
  Download,
  RotateCcw,
  Package,
  Clock,
  Factory,
  Layers,
  ArrowRight,
  Info,
  ChevronRight,
  BarChart3,
  Scale,
  Sparkles,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  SlidersHorizontal
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  VarianceReportRow,
  VarianceThresholdSettings,
  VarianceSummaryMetrics,
  VarianceFilterOptions,
  JobProfitabilityStatus
} from '../../types/costVariance';
import { costVarianceService, DEFAULT_THRESHOLD_SETTINGS } from '../../services/costVarianceService';
import { SourceTransactionDrillDownModal } from '../../components/cost-variance/SourceTransactionDrillDownModal';

export const PlannedVsActualVariancePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [revision, setRevision] = useState(0);
  const [selectedRowForDrillDown, setSelectedRowForDrillDown] = useState<VarianceReportRow | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'table' | 'visual' | 'profitability'>('table');

  // Configurable Threshold Settings
  const [thresholdSettings, setThresholdSettings] = useState<VarianceThresholdSettings>(() => {
    return costVarianceService.getThresholdSettings();
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [profitabilityFilter, setProfitabilityFilter] = useState<'all' | 'made_money' | 'lost_money'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'exceeding_threshold' | 'critical_loss' | 'favorable_savings'>('all');
  const [driverFilter, setDriverFilter] = useState<'all' | 'Material' | 'Labor' | 'Machine' | 'Overhead'>('all');
  const [sortBy, setSortBy] = useState<'totalVarianceCost' | 'totalVariancePercent' | 'actualProfit' | 'revenue' | 'orderNumber'>('totalVarianceCost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle threshold update
  const handleThresholdChange = (newThreshold: number) => {
    const updated = { ...thresholdSettings, costOverrunThresholdPct: newThreshold };
    setThresholdSettings(updated);
    costVarianceService.saveThresholdSettings(updated);
    setRevision(r => r + 1);
  };

  // Get Variance Report Rows
  const rows: VarianceReportRow[] = useMemo(() => {
    return costVarianceService.getVarianceReport(thresholdSettings, {
      searchQuery,
      profitabilityFilter,
      alertFilter,
      driverFilter,
      sortBy,
      sortOrder
    });
    // revision is intentional dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdSettings, searchQuery, profitabilityFilter, alertFilter, driverFilter, sortBy, sortOrder, revision]);

  // Summary Metrics
  const summary: VarianceSummaryMetrics = useMemo(() => {
    return costVarianceService.getSummaryMetrics(rows);
  }, [rows]);

  // CSV Export handler
  const handleExportCsv = () => {
    const csv = costVarianceService.exportVarianceReportCsv(rows, thresholdSettings.costOverrunThresholdPct);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planned_vs_Actual_Variance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Variance Report Exported', 'Downloaded comprehensive Cost Accountant Planned vs Actual CSV audit.');
  };

  const formatCurrency = (val: number) => {
    return `₹${Math.abs(val).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                <Scale size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Planned vs. Actual Variance Analysis
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    COST ACCOUNTING AUDIT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare quoted cost vs. actual shop floor actuals, isolate material, labor & overhead drivers, and flag jobs that made vs. lost money.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/margin-analysis')}
              className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Real-time gross margin by product, customer, order, and time period"
            >
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Margin Dashboards</span>
            </button>

            <button
              onClick={() => navigate('/scrap-rework')}
              className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Track Scrap, Rework hours, COPQ and Pareto by Machine/Shift/Operator"
            >
              <AlertOctagon size={14} className="text-rose-400" />
              <span>Scrap & Rework COPQ</span>
            </button>

            <button
              onClick={() => navigate('/cost-simulation')}
              className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/80 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Simulate Material Price, Labor & Cycle Time Impact on Product Margins"
            >
              <SlidersHorizontal size={14} className="text-purple-400" />
              <span>What-If Simulation</span>
            </button>

            <button
              onClick={() => navigate('/cost-rollup')}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Switch to Real-Time Cost Roll-Up Live Feed"
            >
              <DollarSign size={14} className="text-emerald-400" />
              <span>Real-Time Roll-Up</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet size={14} />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Step-by-Step Cost Accountant Workflow Guidance Box */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-indigo-200">
                Cost Accounting Workflow & Threshold Alert System
              </div>
              <div className="text-indigo-300/80 mt-0.5">
                <strong>Step 1:</strong> Set your target variance threshold (e.g. 10%) • <strong>Step 2:</strong> Review Net Variance & jobs flagged as <span className="text-emerald-300 font-semibold">Made Money</span> vs <span className="text-rose-300 font-semibold">Lost Money</span> • <strong>Step 3:</strong> Drill down into source transactions (lots, time punches, MHR, overhead) to audit root causes.
              </div>
            </div>
          </div>

          {/* Interactive Threshold Selector Widget */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-indigo-500/40 shrink-0">
            <span className="text-[11px] font-semibold text-slate-300 pl-2 flex items-center gap-1">
              <Sliders size={12} className="text-indigo-400" />
              Alert Threshold:
            </span>
            {[5, 10, 15, 20].map((t) => (
              <button
                key={t}
                onClick={() => handleThresholdChange(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  thresholdSettings.costOverrunThresholdPct === t
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ±{t}%
              </button>
            ))}
          </div>
        </div>

        {/* 4 Primary Executive Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: Net Cost Variance */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium uppercase tracking-wider text-[10px]">Net Quoted vs Actual Cost</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                summary.isNetUnfavorable 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {summary.isNetUnfavorable ? 'UNFAVORABLE (OVERRUN)' : 'FAVORABLE (SAVINGS)'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono tracking-tight ${
                summary.isNetUnfavorable ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {summary.netCostVariance > 0 ? '+' : ''}{formatCurrency(summary.netCostVariance)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({summary.netCostVariancePercent > 0 ? '+' : ''}{summary.netCostVariancePercent}%)
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800/80">
              <span>Actual: {formatCurrency(summary.totalActualCost)}</span>
              <span>Quoted: {formatCurrency(summary.totalPlannedCost)}</span>
            </div>
          </div>

          {/* CARD 2: Jobs Made Money (Profitable) */}
          <div 
            onClick={() => setProfitabilityFilter(profitabilityFilter === 'made_money' ? 'all' : 'made_money')}
            className={`p-4 bg-slate-900/90 border rounded-2xl relative overflow-hidden cursor-pointer transition hover:border-emerald-500/50 ${
              profitabilityFilter === 'made_money' ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium uppercase tracking-wider text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Jobs Made Money
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                {summary.jobsMadeMoneyCount} of {summary.totalJobsAnalyzed} Jobs
              </span>
            </div>

            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              +{formatCurrency(summary.totalProfitFromWinners)}
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Net Portfolio Profit</span>
              <span className="font-mono text-emerald-300 font-bold">{summary.blendedActualMarginPercent}% Margin</span>
            </div>
          </div>

          {/* CARD 3: Jobs Lost Money (Loss Making) */}
          <div 
            onClick={() => setProfitabilityFilter(profitabilityFilter === 'lost_money' ? 'all' : 'lost_money')}
            className={`p-4 bg-slate-900/90 border rounded-2xl relative overflow-hidden cursor-pointer transition hover:border-rose-500/50 ${
              profitabilityFilter === 'lost_money' ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium uppercase tracking-wider text-[10px] text-rose-400 flex items-center gap-1">
                <AlertOctagon size={12} />
                Jobs Lost Money
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 font-mono">
                {summary.jobsLostMoneyCount} Critical Jobs
              </span>
            </div>

            <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
              -{formatCurrency(summary.totalLossFromLosers)}
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Erosion Impact</span>
              <span className="font-mono text-rose-300 font-bold">Negative Margin</span>
            </div>
          </div>

          {/* CARD 4: Threshold Alerts Triggered */}
          <div 
            onClick={() => setAlertFilter(alertFilter === 'exceeding_threshold' ? 'all' : 'exceeding_threshold')}
            className={`p-4 bg-slate-900/90 border rounded-2xl relative overflow-hidden cursor-pointer transition hover:border-amber-500/50 ${
              alertFilter === 'exceeding_threshold' ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                Threshold Overruns
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                &gt; {thresholdSettings.costOverrunThresholdPct}%
              </span>
            </div>

            <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
              {summary.alertThresholdExceededCount} Flags
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Audit Action Required</span>
              <span className="font-mono text-amber-400 font-bold">Click to Filter</span>
            </div>
          </div>
        </div>

        {/* Category Variance Breakdown Bar */}
        <div className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Material Variance */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Package size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Material Variance</div>
                <div className="text-[10px] text-slate-400">Scrap, waste & lot unit rates</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className={`text-xs font-bold ${summary.totalMaterialVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.totalMaterialVariance > 0 ? `+₹${summary.totalMaterialVariance.toLocaleString()}` : `-₹${Math.abs(summary.totalMaterialVariance).toLocaleString()}`}
              </div>
              <div className="text-[10px] text-slate-500">
                ({summary.totalMaterialVariancePct > 0 ? '+' : ''}{summary.totalMaterialVariancePct}%)
              </div>
            </div>
          </div>

          {/* Labor Variance */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Labor Variance</div>
                <div className="text-[10px] text-slate-400">Time clock capture & overtime</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className={`text-xs font-bold ${summary.totalLaborVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.totalLaborVariance > 0 ? `+₹${summary.totalLaborVariance.toLocaleString()}` : `-₹${Math.abs(summary.totalLaborVariance).toLocaleString()}`}
              </div>
              <div className="text-[10px] text-slate-500">
                ({summary.totalLaborVariancePct > 0 ? '+' : ''}{summary.totalLaborVariancePct}%)
              </div>
            </div>
          </div>

          {/* Overhead Variance */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sliders size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Overhead Variance</div>
                <div className="text-[10px] text-slate-400">Factory absorption & SG&A</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className={`text-xs font-bold ${summary.totalOverheadVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.totalOverheadVariance > 0 ? `+₹${summary.totalOverheadVariance.toLocaleString()}` : `-₹${Math.abs(summary.totalOverheadVariance).toLocaleString()}`}
              </div>
              <div className="text-[10px] text-slate-500">
                ({summary.totalOverheadVariancePct > 0 ? '+' : ''}{summary.totalOverheadVariancePct}%)
              </div>
            </div>
          </div>

        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search work order #, quote #, customer, part code or part description..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Variance Report Table
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'visual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cost Element Visuals
              </button>
              <button
                onClick={() => setActiveTab('profitability')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'profitability' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Winners vs Losers
              </button>
            </div>
          </div>

          {/* Secondary Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Profitability filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Outcome:</span>
              <select
                value={profitabilityFilter}
                onChange={(e) => setProfitabilityFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Jobs</option>
                <option value="made_money" className="bg-slate-900 text-emerald-400">Made Money (Profitable)</option>
                <option value="lost_money" className="bg-slate-900 text-rose-400">Lost Money (Loss Making)</option>
              </select>
            </div>

            {/* Threshold Alert filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Alert Flag:</span>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Alert Statuses</option>
                <option value="exceeding_threshold" className="bg-slate-900 text-amber-400">Overrun &gt; {thresholdSettings.costOverrunThresholdPct}% Alert</option>
                <option value="critical_loss" className="bg-slate-900 text-rose-400">Critical Loss-Making</option>
                <option value="favorable_savings" className="bg-slate-900 text-emerald-400">Favorable Cost Savings</option>
              </select>
            </div>

            {/* Primary Driver filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Driver:</span>
              <select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Drivers</option>
                <option value="Material" className="bg-slate-900 text-blue-400">Material Overrun</option>
                <option value="Labor" className="bg-slate-900 text-emerald-400">Labor Overrun</option>
                <option value="Machine" className="bg-slate-900 text-amber-400">Machine Overrun</option>
                <option value="Overhead" className="bg-slate-900 text-indigo-400">Overhead Overrun</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 ml-auto">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="totalVarianceCost" className="bg-slate-900">Highest Cost Variance (INR)</option>
                <option value="totalVariancePercent" className="bg-slate-900">Highest Variance %</option>
                <option value="actualProfit" className="bg-slate-900">Actual Realized Profit</option>
                <option value="revenue" className="bg-slate-900">Total Revenue</option>
                <option value="orderNumber" className="bg-slate-900">Work Order #</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-1.5 py-0.5 text-slate-400 hover:text-white font-mono text-[11px]"
                title="Toggle Sort Order"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {(searchQuery || profitabilityFilter !== 'all' || alertFilter !== 'all' || driverFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setProfitabilityFilter('all');
                  setAlertFilter('all');
                  setDriverFilter('all');
                }}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 ml-2"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: MAIN VARIANCE REPORT AUDIT TABLE */}
        {activeTab === 'table' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Job / Work Order</th>
                    <th className="py-3.5 px-4">Part & Customer</th>
                    <th className="py-3.5 px-4 text-right">Revenue</th>
                    <th className="py-3.5 px-4 text-right">Material Var</th>
                    <th className="py-3.5 px-4 text-right">Labor Var</th>
                    <th className="py-3.5 px-4 text-right">Overhead Var</th>
                    <th className="py-3.5 px-4 text-right">Quoted vs Actual</th>
                    <th className="py-3.5 px-4 text-right">Net Cost Variance</th>
                    <th className="py-3.5 px-4 text-center">Gross Margin Target</th>
                    <th className="py-3.5 px-4 text-center">Profit Outcome</th>
                    <th className="py-3.5 px-4 text-center">Audit Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        No work orders matched the current variance threshold and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      return (
                        <tr
                          key={r.workOrderId}
                          className={`hover:bg-slate-800/40 transition cursor-pointer ${
                            r.isThresholdAlert ? 'bg-amber-500/[0.02]' : ''
                          }`}
                          onClick={() => setSelectedRowForDrillDown(r)}
                        >
                          {/* Job / Work Order */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">{r.workOrderNumber}</span>
                              {r.quoteNumber && (
                                <span className="text-[10px] text-slate-500 font-mono">({r.quoteNumber})</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Qty: <strong className="text-slate-300">{r.quantity}</strong></span>
                              <span>•</span>
                              <span className="uppercase text-slate-500">{r.orderStatus}</span>
                            </div>
                          </td>

                          {/* Part & Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-200">{r.partName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span className="font-mono text-indigo-400">{r.partCode}</span>
                              <span>•</span>
                              <span className="truncate max-w-[130px]">{r.customerName}</span>
                            </div>
                          </td>

                          {/* Revenue */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="font-semibold text-white">
                              ₹{r.totalRevenue.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              @ ₹{r.contractPricePerUnit}/u
                            </div>
                          </td>

                          {/* Material Variance */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className={`font-semibold ${r.material.varianceCost > 0 ? 'text-rose-400' : r.material.varianceCost < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {r.material.varianceCost > 0 ? `+₹${r.material.varianceCost.toLocaleString()}` : r.material.varianceCost < 0 ? `-₹${Math.abs(r.material.varianceCost).toLocaleString()}` : '0'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ({r.material.variancePercent > 0 ? '+' : ''}{r.material.variancePercent}%)
                            </div>
                          </td>

                          {/* Labor Variance */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className={`font-semibold ${r.labor.varianceCost > 0 ? 'text-rose-400' : r.labor.varianceCost < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {r.labor.varianceCost > 0 ? `+₹${r.labor.varianceCost.toLocaleString()}` : r.labor.varianceCost < 0 ? `-₹${Math.abs(r.labor.varianceCost).toLocaleString()}` : '0'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ({r.labor.variancePercent > 0 ? '+' : ''}{r.labor.variancePercent}%)
                            </div>
                          </td>

                          {/* Overhead Variance */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className={`font-semibold ${r.overhead.varianceCost > 0 ? 'text-rose-400' : r.overhead.varianceCost < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {r.overhead.varianceCost > 0 ? `+₹${r.overhead.varianceCost.toLocaleString()}` : r.overhead.varianceCost < 0 ? `-₹${Math.abs(r.overhead.varianceCost).toLocaleString()}` : '0'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ({r.overhead.variancePercent > 0 ? '+' : ''}{r.overhead.variancePercent}%)
                            </div>
                          </td>

                          {/* Quoted vs Actual Cost */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="font-bold text-amber-300">
                              ₹{r.totalActualCost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Quoted: ₹{r.totalPlannedCost.toLocaleString()}
                            </div>
                          </td>

                          {/* Total Cost Variance & Threshold Alert */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r.totalVarianceCost > 0
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : r.totalVarianceCost < 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'text-slate-400'
                              }`}>
                                {r.totalVarianceCost > 0 ? `+₹${r.totalVarianceCost.toLocaleString()}` : r.totalVarianceCost < 0 ? `-₹${Math.abs(r.totalVarianceCost).toLocaleString()}` : '±0'}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">
                                  ({r.totalVariancePercent > 0 ? '+' : ''}{r.totalVariancePercent}%)
                                </span>
                                {r.isThresholdAlert && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase">
                                    &gt;{thresholdSettings.costOverrunThresholdPct}% Alert
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Gross Margin Target vs Actual */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono font-bold text-xs">
                              <span className={r.actualGrossMarginPercent >= 15 ? 'text-emerald-400' : r.actualGrossMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                                {r.actualGrossMarginPercent}%
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Target: {r.plannedGrossMarginPercent}%
                            </div>
                          </td>

                          {/* Profitability Outcome: Made Money vs Lost Money */}
                          <td className="py-3.5 px-4 text-center">
                            {r.profitabilityStatus === 'made_money' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Made +₹{r.actualGrossProfit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 animate-pulse">
                                <AlertOctagon size={12} />
                                Lost -₹{Math.abs(r.actualGrossProfit).toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Drill-Down Action Button */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRowForDrillDown(r);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1 mx-auto"
                              title="Audit Source Transactions (Lots, Time, Overhead)"
                            >
                              <span>Audit</span>
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COST ELEMENT VISUAL COMPARISON */}
        {activeTab === 'visual' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-400" />
                    Quoted Planned Cost vs Actual Incurred Cost per Job
                  </h3>
                  <p className="text-xs text-slate-400">
                    Side-by-side component meters highlighting material, labor, machine, and overhead cost variances.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-2 rounded bg-slate-600"></span> Quoted Budget
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-3 h-2 rounded bg-amber-500"></span> Actual Incurred
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {rows.map((r) => {
                  const maxCost = Math.max(r.totalPlannedCost, r.totalActualCost) * 1.1 || 1;
                  const plannedWidth = (r.totalPlannedCost / maxCost) * 100;
                  const actualWidth = (r.totalActualCost / maxCost) * 100;

                  return (
                    <div
                      key={r.workOrderId}
                      onClick={() => setSelectedRowForDrillDown(r)}
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{r.workOrderNumber}</span>
                          <span className="text-slate-300 font-medium">{r.partName}</span>
                          <span className="text-slate-500">({r.customerName})</span>
                          {r.isThresholdAlert && (
                            <span className="text-[10px] font-bold px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                              Overrun &gt; {thresholdSettings.costOverrunThresholdPct}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-slate-400">
                            Variance: <strong className={r.totalVarianceCost > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                              {r.totalVarianceCost > 0 ? `+₹${r.totalVarianceCost.toLocaleString()}` : `-₹${Math.abs(r.totalVarianceCost).toLocaleString()}`} ({r.totalVariancePercent}%)
                            </strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.profitabilityStatus === 'made_money' ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
                          }`}>
                            {r.profitabilityStatus === 'made_money' ? `Profit: +₹${r.actualGrossProfit.toLocaleString()}` : `Loss: -₹${Math.abs(r.actualGrossProfit).toLocaleString()}`}
                          </span>
                        </div>
                      </div>

                      {/* Bar Comparison */}
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {/* Quoted Bar */}
                        <div className="flex items-center gap-3">
                          <span className="w-16 text-slate-500 text-right">Quoted:</span>
                          <div className="flex-1 h-3.5 bg-slate-900 rounded-full overflow-hidden">
                            <div style={{ width: `${plannedWidth}%` }} className="h-full bg-slate-600 rounded-full" />
                          </div>
                          <span className="w-20 text-slate-400 text-right">₹{r.totalPlannedCost.toLocaleString()}</span>
                        </div>

                        {/* Actual Bar */}
                        <div className="flex items-center gap-3">
                          <span className="w-16 text-amber-400 text-right">Actual:</span>
                          <div className="flex-1 h-3.5 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${actualWidth}%` }} 
                              className={`h-full rounded-full ${r.totalActualCost > r.totalPlannedCost ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            />
                          </div>
                          <span className="w-20 font-bold text-white text-right">₹{r.totalActualCost.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Driver Pill tags */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center gap-3 font-mono">
                          <span className={r.material.varianceCost > 0 ? 'text-rose-400' : 'text-slate-400'}>
                            Material: {r.material.varianceCost > 0 ? `+₹${r.material.varianceCost.toLocaleString()}` : '±0'}
                          </span>
                          <span className={r.labor.varianceCost > 0 ? 'text-rose-400' : 'text-slate-400'}>
                            Labor: {r.labor.varianceCost > 0 ? `+₹${r.labor.varianceCost.toLocaleString()}` : '±0'}
                          </span>
                          <span className={r.overhead.varianceCost > 0 ? 'text-rose-400' : 'text-slate-400'}>
                            Overhead: {r.overhead.varianceCost > 0 ? `+₹${r.overhead.varianceCost.toLocaleString()}` : '±0'}
                          </span>
                        </div>
                        <span className="text-indigo-400 flex items-center gap-1 hover:underline">
                          Drill down to transactions <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WINNERS VS LOSERS PROFITABILITY WATERFALL */}
        {activeTab === 'profitability' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WINNERS: Jobs That Made Money */}
            <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Jobs That Made Money (Winners)</h3>
                    <p className="text-xs text-slate-400">Total Profit: +₹{summary.totalProfitFromWinners.toLocaleString()}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                  {summary.jobsMadeMoneyCount} Jobs
                </span>
              </div>

              <div className="space-y-3">
                {rows.filter(r => r.profitabilityStatus === 'made_money').map((r) => (
                  <div
                    key={r.workOrderId}
                    onClick={() => setSelectedRowForDrillDown(r)}
                    className="p-3.5 bg-slate-950/60 border border-emerald-500/20 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{r.workOrderNumber}</span>
                        <span className="text-slate-300 font-medium text-xs">{r.partName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.customerName} • Qty {r.quantity} • Revenue: ₹{r.totalRevenue.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-emerald-400">+₹{r.actualGrossProfit.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{r.actualGrossMarginPercent}% Margin</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LOSERS: Jobs That Lost Money */}
            <div className="p-5 bg-slate-900 border border-rose-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertOctagon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Jobs That Lost Money (Losers)</h3>
                    <p className="text-xs text-slate-400">Total Deficit: -₹{summary.totalLossFromLosers.toLocaleString()}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 font-mono">
                  {summary.jobsLostMoneyCount} Critical Jobs
                </span>
              </div>

              <div className="space-y-3">
                {rows.filter(r => r.profitabilityStatus === 'lost_money').map((r) => (
                  <div
                    key={r.workOrderId}
                    onClick={() => setSelectedRowForDrillDown(r)}
                    className="p-3.5 bg-slate-950/60 border border-rose-500/30 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{r.workOrderNumber}</span>
                        <span className="text-slate-300 font-medium text-xs">{r.partName}</span>
                      </div>
                      <div className="text-[11px] text-rose-300/80 mt-0.5">
                        Primary Driver: <strong>{r.primaryDriver}</strong> Overrun (+₹{r.totalVarianceCost.toLocaleString()})
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-rose-400">-₹{Math.abs(r.actualGrossProfit).toLocaleString()}</div>
                      <div className="text-[10px] text-rose-400 font-semibold">{r.actualGrossMarginPercent}% Margin</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* SOURCE TRANSACTION DRILL-DOWN AUDIT MODAL */}
      {selectedRowForDrillDown && (
        <SourceTransactionDrillDownModal
          row={selectedRowForDrillDown}
          thresholdPct={thresholdSettings.costOverrunThresholdPct}
          onClose={() => setSelectedRowForDrillDown(null)}
          onUpdated={() => setRevision(r => r + 1)}
        />
      )}
    </div>
  );
};
