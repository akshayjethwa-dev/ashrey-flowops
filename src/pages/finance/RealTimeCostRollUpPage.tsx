// src/pages/finance/RealTimeCostRollUpPage.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Clock,
  Factory,
  Package,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Search,
  Filter,
  Download,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Building,
  User,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Zap,
  BarChart2,
  FileSpreadsheet,
  Scale,
  SlidersHorizontal
} from 'lucide-react';
import {
  WorkOrderCostRollup,
  CostRollupFilterParams,
  MarginHealthStatus,
  CostRollupSummaryKPIs
} from '../../types/costRollup';
import { costRollupService } from '../../services/costRollupService';
import { WorkOrderCostDetailModal } from '../../components/cost-rollup/WorkOrderCostDetailModal';
import { IssueMaterialModal } from '../../components/cost-rollup/IssueMaterialModal';
import { OverheadConfigModal } from '../../components/cost-rollup/OverheadConfigModal';

export const RealTimeCostRollUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { addToast } = useToast();

  const [revision, setRevision] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderCostRollup | null>(null);
  const [issueMaterialWo, setIssueMaterialWo] = useState<{ id: string; number: string } | null>(null);
  const [isOverheadModalOpen, setIsOverheadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'drivers' | 'variance'>('ledger');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'ready' | 'completed' | 'paused'>('all');
  const [marginHealthFilter, setMarginHealthFilter] = useState<'all' | MarginHealthStatus>('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'actualMarginPercent' | 'actualCost' | 'revenue' | 'varianceCost' | 'orderNumber'>('actualMarginPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [liveOnly, setLiveOnly] = useState(false);

  // Auto-refresh interval (5s) for live stopwatch tracking from shopfloor
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      setRevision((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Fetch rolled-up work order data
  const rollups: WorkOrderCostRollup[] = useMemo(() => {
    return costRollupService.getAllWorkOrderCostRollups({
      searchQuery,
      status: statusFilter,
      marginHealth: marginHealthFilter,
      plantId: plantFilter,
      sortBy,
      sortOrder,
      liveOnly
    });
    // revision is intentional dependency for live re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, marginHealthFilter, plantFilter, sortBy, sortOrder, liveOnly, revision]);

  const summaryKPIs: CostRollupSummaryKPIs = useMemo(() => {
    return costRollupService.getSummaryKPIs(rollups);
  }, [rollups]);

  const activeOverhead = useMemo(() => {
    return costRollupService.getActiveOverheadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const handleExportCsv = () => {
    const csv = costRollupService.exportCostRollupCsv(rollups);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RealTime_Cost_Rollup_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export Successful', 'Downloaded work order cost roll-up CSV ledger.');
  };

  const getMarginBadge = (health: MarginHealthStatus, margin: number) => {
    switch (health) {
      case 'high_margin':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          label: `${margin}% (High)`
        };
      case 'healthy':
        return {
          bg: 'bg-sky-950/70 border-sky-500/40 text-sky-300',
          dot: 'bg-sky-400',
          label: `${margin}% (Healthy)`
        };
      case 'at_risk':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          label: `${margin}% (At Risk)`
        };
      case 'loss_making':
      default:
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400 animate-pulse',
          label: `${margin}% (Loss)`
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign size={20} />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Real-Time Cost Roll-Up & Job Margin Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Shop Floor & Inventory
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated actual manufacturing cost roll-up per work order calculated from actual material lot consumption, operator time tickets, machine runtime hours, and overhead allocation rules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Ticker Toggle */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                isAutoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically updates live running machine & operator hours every 5 seconds"
            >
              <RefreshCw size={13} className={isAutoRefresh ? 'animate-spin text-emerald-400' : ''} />
              {isAutoRefresh ? 'Live Feed (5s)' : 'Paused'}
            </button>

            {/* What-If Simulation */}
            <button
              onClick={() => navigate('/cost-simulation')}
              className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Simulate Material Price, Labor & Cycle Time Impact on Product Margins"
            >
              <SlidersHorizontal size={13} className="text-purple-400" />
              <span>What-If Simulation</span>
            </button>

            {/* Planned vs Actual Variance Analysis */}
            <button
              onClick={() => navigate('/cost-variance')}
              className="px-3.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white border border-indigo-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Compare Quoted vs Actual Cost with Threshold Alerts and Transaction Audit"
            >
              <Scale size={13} />
              <span>Variance Analysis</span>
            </button>

            {/* Scrap & Rework Cost Tracking */}
            <button
              onClick={() => navigate('/scrap-rework')}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Track Scrap, Rework hours, COPQ and Pareto by Machine/Shift/Operator"
            >
              <AlertOctagon size={13} className="text-rose-400" />
              <span>Scrap & Rework COPQ</span>
            </button>

            {/* Overhead Rules Config */}
            <button
              onClick={() => setIsOverheadModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              <Sliders size={13} className="text-indigo-400" />
              <span>Overhead Rules</span>
            </button>

            {/* Quoting Rules link */}
            <button
              onClick={() => navigate('/cost-engine')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
              title="View Standard Quoting Cost Engine Rules"
            >
              <FileSpreadsheet size={13} className="text-sky-400" />
              <span>Quoting Engine</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Card 1: Total WIP Revenue */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total WIP Value</span>
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              ₹{summaryKPIs.totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">
              {summaryKPIs.totalJobsCount} Jobs in Pipeline
            </div>
          </div>

          {/* Card 2: Actual Cost Incurred */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Actual Cost Incurred</span>
              <Factory size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              ₹{summaryKPIs.totalActualCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Budget: ₹{summaryKPIs.totalStandardCost.toLocaleString()}</span>
              <span className={summaryKPIs.totalCostVariance > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                ({summaryKPIs.totalCostVariance > 0 ? '+' : ''}₹{summaryKPIs.totalCostVariance.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Card 3: Realized Gross Profit */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Gross Profit</span>
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
            <div className={`text-xl font-bold font-mono ${summaryKPIs.totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{summaryKPIs.totalGrossProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">
              Net manufacturing surplus
            </div>
          </div>

          {/* Card 4: Blended Gross Margin */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Blended Gross Margin</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className={`text-2xl font-black font-mono ${
              summaryKPIs.blendedGrossMarginPercent >= 25 ? 'text-emerald-400' :
              summaryKPIs.blendedGrossMarginPercent >= 15 ? 'text-sky-400' :
              summaryKPIs.blendedGrossMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {summaryKPIs.blendedGrossMarginPercent}%
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">{summaryKPIs.highMarginCount} High</span>
              <span>•</span>
              <span className="text-sky-400 font-medium">{summaryKPIs.healthyCount} Healthy</span>
              <span>•</span>
              <span className="text-rose-400 font-medium">{summaryKPIs.lossMakingCount + summaryKPIs.atRiskCount} Risk</span>
            </div>
          </div>

          {/* Card 5: Live Shop Floor Jobs */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Active Shop Floor</span>
              <Zap size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {summaryKPIs.liveShopFloorJobsCount} Live Jobs
            </div>
            <div className="text-[11px] text-slate-400">
              Clocked-in at Work Centers
            </div>
          </div>
        </div>

        {/* Highest Cost Overrun Notice Banner (if any) */}
        {summaryKPIs.topOverrunWorkOrder && summaryKPIs.topOverrunWorkOrder.varianceCost > 0 && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-400 shrink-0" size={16} />
              <span className="text-amber-200">
                <strong>Cost Variance Alert:</strong> Work Order{' '}
                <span className="font-mono font-bold text-white">{summaryKPIs.topOverrunWorkOrder.orderNumber}</span>{' '}
                ({summaryKPIs.topOverrunWorkOrder.partName}) has an overrun of{' '}
                <strong className="text-rose-400 font-mono">+₹{summaryKPIs.topOverrunWorkOrder.varianceCost.toLocaleString()} (+{summaryKPIs.topOverrunWorkOrder.variancePercent}%)</strong>{' '}
                primarily driven by <strong>{summaryKPIs.topOverrunWorkOrder.primaryDriver}</strong> consumption.
              </span>
            </div>
            <button
              onClick={() => {
                const target = rollups.find(r => r.workOrderNumber === summaryKPIs.topOverrunWorkOrder?.orderNumber);
                if (target) setSelectedWorkOrder(target);
              }}
              className="text-xs font-semibold text-amber-300 hover:text-white underline transition"
            >
              Inspect Work Order Breakdown →
            </button>
          </div>
        )}

        {/* Applied Overhead Strategy Pill */}
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Applied Overhead Allocation Rule:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold text-[11px] border border-indigo-500/30">
              {activeOverhead.name}
            </span>
            <span className="text-slate-500 hidden md:inline">({activeOverhead.notes})</span>
          </div>
          <button
            onClick={() => setIsOverheadModalOpen(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            Change Allocation Strategy →
          </button>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'ledger'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                Work Order Cost Ledger
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'drivers'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 size={13} />
                Cost Drivers Matrix
              </button>
              <button
                onClick={() => setActiveTab('variance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'variance'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp size={13} />
                Margin Health Classification
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search WO, Part, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>

              {/* Margin Health Filter */}
              <select
                value={marginHealthFilter}
                onChange={(e) => setMarginHealthFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Margins</option>
                <option value="high_margin">High Margin (&gt;25%)</option>
                <option value="healthy">Healthy (15-25%)</option>
                <option value="at_risk">At Risk (0-15%)</option>
                <option value="loss_making">Loss Making (&lt;0%)</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="actualMarginPercent">Sort by Margin %</option>
                <option value="actualCost">Sort by Actual Cost</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="varianceCost">Sort by Variance Cost</option>
                <option value="orderNumber">Sort by WO #</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                title="Toggle sort direction"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>

              {/* Live Only Filter */}
              <button
                onClick={() => setLiveOnly(!liveOnly)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  liveOnly
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play size={11} className={liveOnly ? 'fill-emerald-400' : ''} />
                Live Only
              </button>
            </div>
          </div>

          {/* TAB 1: WORK ORDER COST LEDGER TABLE */}
          {activeTab === 'ledger' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Work Order & Customer</th>
                      <th className="py-3 px-4">Part & Batch</th>
                      <th className="py-3 px-4 text-right">Revenue</th>
                      <th className="py-3 px-4 text-right">Target vs Actual Cost</th>
                      <th className="py-3 px-4 text-right">Cost Variance</th>
                      <th className="py-3 px-4 text-right">Actual Unit Cost</th>
                      <th className="py-3 px-4 text-center">Gross Margin</th>
                      <th className="py-3 px-4 text-center">Live Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {rollups.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          No work orders match the current filters.
                        </td>
                      </tr>
                    ) : (
                      rollups.map((r) => {
                        const marginBadge = getMarginBadge(r.marginHealth, r.actualGrossMarginPercent);
                        const costProgressPct = r.standardTotalCost > 0 
                          ? Math.min(100, (r.actualTotalCost / r.standardTotalCost) * 100) 
                          : 100;

                        return (
                          <tr
                            key={r.workOrderId}
                            onClick={() => setSelectedWorkOrder(r)}
                            className="hover:bg-slate-800/50 transition cursor-pointer group"
                          >
                            {/* WO # & Customer */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs group-hover:text-indigo-400 transition">
                                  {r.workOrderNumber}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                  SO:{r.salesOrderNumber}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Building size={11} className="text-slate-500" />
                                <span>{r.customerName}</span>
                              </div>
                            </td>

                            {/* Part & Batch */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-200">{r.partName}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span className="font-mono text-indigo-400">{r.partCode}</span>
                                <span>•</span>
                                <span>Qty: <strong className="text-slate-300">{r.quantity}</strong></span>
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

                            {/* Target vs Actual Cost with Mini Bar */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="font-mono font-bold text-amber-300 text-xs">
                                ₹{r.actualTotalCost.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Target: ₹{r.standardTotalCost.toLocaleString()}
                              </div>
                              {/* Mini progress bar */}
                              <div className="w-24 h-1.5 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${r.actualTotalCost > r.standardTotalCost ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${costProgressPct}%` }}
                                />
                              </div>
                            </td>

                            {/* Cost Variance */}
                            <td className="py-3.5 px-4 text-right font-mono">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                r.totalCostVariance > 0
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : r.totalCostVariance < 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'text-slate-400'
                              }`}>
                                {r.totalCostVariance > 0 ? `+₹${r.totalCostVariance.toLocaleString()}` : r.totalCostVariance < 0 ? `-₹${Math.abs(r.totalCostVariance).toLocaleString()}` : '±0'}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                ({r.totalCostVariancePercent > 0 ? '+' : ''}{r.totalCostVariancePercent}%)
                              </div>
                            </td>

                            {/* Unit Cost */}
                            <td className="py-3.5 px-4 text-right font-mono">
                              <span className="font-semibold text-slate-200">
                                ₹{r.actualUnitCost}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Target: ₹{r.standardUnitCost}
                              </span>
                            </td>

                            {/* Gross Margin */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${marginBadge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${marginBadge.dot}`}></span>
                                {marginBadge.label}
                              </span>
                            </td>

                            {/* Live Status */}
                            <td className="py-3.5 px-4 text-center">
                              {r.isLiveRunning ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1 animate-pulse">
                                  <Play size={9} className="fill-emerald-400" />
                                  LIVE
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 uppercase font-mono">
                                  {r.orderStatus}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setIssueMaterialWo({ id: r.workOrderId, number: r.workOrderNumber })}
                                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                                  title="Issue Material from Inventory"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={() => setSelectedWorkOrder(r)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                  title="View Detailed Breakdown"
                                >
                                  <ArrowRight size={14} />
                                </button>
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
          )}

          {/* TAB 2: COST DRIVERS MATRIX */}
          {activeTab === 'drivers' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Cost Driver Composition by Job</h3>
                    <p className="text-xs text-slate-400">Proportional absorption across Material, Labor, Machine, and Overhead</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-blue-400"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Material</span>
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Labor</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Machine</span>
                    <span className="flex items-center gap-1 text-indigo-400"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Overhead</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {rollups.map((r) => {
                    const total = r.actualTotalCost;
                    const matPct = total > 0 ? (r.actualMaterialCost / total) * 100 : 0;
                    const labPct = total > 0 ? (r.actualLaborCost / total) * 100 : 0;
                    const machPct = total > 0 ? (r.actualMachineCost / total) * 100 : 0;
                    const ovhPct = total > 0 ? (r.totalOverheadCost / total) * 100 : 0;

                    return (
                      <div
                        key={r.workOrderId}
                        onClick={() => setSelectedWorkOrder(r)}
                        className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:bg-slate-800/70 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{r.workOrderNumber}</span>
                            <span className="text-slate-300 font-medium">{r.partName}</span>
                            <span className="text-slate-500">({r.customerName})</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-400">Total: ₹{r.actualTotalCost.toLocaleString()}</span>
                            <span className="font-bold text-emerald-400">Margin: {r.actualGrossMarginPercent}%</span>
                          </div>
                        </div>

                        {/* Stacked Proportional Bar */}
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
                          <div style={{ width: `${matPct}%` }} className="h-full bg-blue-500" title={`Material: ${matPct.toFixed(1)}%`} />
                          <div style={{ width: `${labPct}%` }} className="h-full bg-emerald-500" title={`Labor: ${labPct.toFixed(1)}%`} />
                          <div style={{ width: `${machPct}%` }} className="h-full bg-amber-500" title={`Machine: ${machPct.toFixed(1)}%`} />
                          <div style={{ width: `${ovhPct}%` }} className="h-full bg-indigo-500" title={`Overhead: ${ovhPct.toFixed(1)}%`} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Mat: ₹{r.actualMaterialCost.toLocaleString()} ({matPct.toFixed(0)}%)</span>
                          <span>Lab: ₹{r.actualLaborCost.toLocaleString()} ({labPct.toFixed(0)}%)</span>
                          <span>Mach: ₹{r.actualMachineCost.toLocaleString()} ({machPct.toFixed(0)}%)</span>
                          <span>Ovh: ₹{r.totalOverheadCost.toLocaleString()} ({ovhPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARGIN HEALTH CLASSIFICATION */}
          {activeTab === 'variance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Margin & Healthy Jobs */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  Profitable & On-Track Work Orders (Margin &gt;= 15%)
                </div>
                <div className="space-y-2.5">
                  {rollups.filter(r => r.actualGrossMarginPercent >= 15).map(r => (
                    <div
                      key={r.workOrderId}
                      onClick={() => setSelectedWorkOrder(r)}
                      className="p-3 bg-slate-800/40 border border-emerald-500/20 rounded-xl hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{r.workOrderNumber} — {r.partName}</div>
                        <div className="text-[11px] text-slate-400">{r.customerName} • Qty {r.quantity}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-bold text-emerald-400">{r.actualGrossMarginPercent}%</div>
                        <div className="text-[10px] text-slate-400">Profit: ₹{r.actualGrossProfit.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* At-Risk and Margin Erosion Jobs */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertOctagon size={16} />
                  Eroded & At-Risk Work Orders (Margin &lt; 15%)
                </div>
                <div className="space-y-2.5">
                  {rollups.filter(r => r.actualGrossMarginPercent < 15).map(r => (
                    <div
                      key={r.workOrderId}
                      onClick={() => setSelectedWorkOrder(r)}
                      className="p-3 bg-slate-800/40 border border-rose-500/20 rounded-xl hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{r.workOrderNumber} — {r.partName}</div>
                        <div className="text-[11px] text-rose-300">
                          {r.hasMaterialOverrun ? '• Material scrap overrun' : ''}
                          {r.hasLaborOverrun ? ' • Labor time excess' : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className={`text-sm font-bold ${r.actualGrossMarginPercent < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {r.actualGrossMarginPercent}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Overrun: +₹{r.totalCostVariance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* DETAIL MODAL */}
      {selectedWorkOrder && (
        <WorkOrderCostDetailModal
          rollup={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          onOpenIssueMaterial={(woId) => {
            const wo = rollups.find(r => r.workOrderId === woId);
            if (wo) {
              setIssueMaterialWo({ id: wo.workOrderId, number: wo.workOrderNumber });
            }
          }}
          onRefresh={() => setRevision(r => r + 1)}
        />
      )}

      {/* ISSUE MATERIAL MODAL */}
      {issueMaterialWo && (
        <IssueMaterialModal
          workOrderId={issueMaterialWo.id}
          workOrderNumber={issueMaterialWo.number}
          onClose={() => setIssueMaterialWo(null)}
          onSuccess={() => {
            setRevision(r => r + 1);
            addToast('success', 'Material Issued', `Additional stock lots issued to ${issueMaterialWo.number}. Job cost rolled up.`);
          }}
        />
      )}

      {/* OVERHEAD CONFIG MODAL */}
      {isOverheadModalOpen && (
        <OverheadConfigModal
          onClose={() => setIsOverheadModalOpen(false)}
          onSaved={() => {
            setRevision(r => r + 1);
            addToast('success', 'Overhead Strategy Updated', 'New absorption rules applied to all active work orders.');
          }}
        />
      )}
    </div>
  );
};
