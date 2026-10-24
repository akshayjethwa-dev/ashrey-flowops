// src/pages/finance/WhatIfCostSimulationPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Package,
  Clock,
  Factory,
  Layers,
  Plus,
  Copy,
  Trash2,
  Edit3,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Search,
  ArrowRight,
  Info,
  Scale,
  Sliders,
  Check,
  ChevronDown
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  CostSimulationScenario,
  ProductSimulationResult,
  PortfolioSimulationSummary,
  MultiScenarioComparisonData
} from '../../types/costSimulation';
import { costSimulationService, BASELINE_SCENARIO } from '../../services/costSimulationService';
import { ScenarioBuilderModal } from '../../components/cost-simulation/ScenarioBuilderModal';
import { ScenarioComparisonMatrix } from '../../components/cost-simulation/ScenarioComparisonMatrix';

export const WhatIfCostSimulationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [revision, setRevision] = useState(0);

  // Available Scenarios list
  const [scenarios, setScenarios] = useState<CostSimulationScenario[]>(() => {
    return costSimulationService.getScenarios();
  });

  // Selected Primary Scenario for Detailed Deep-Dive
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-mat-inflation');

  // Selected Scenario IDs for Multi-Scenario Comparison (default: 3 scenarios)
  const [comparisonScenarioIds, setComparisonScenarioIds] = useState<string[]>([
    'scenario-mat-inflation',
    'scenario-wage-revision',
    'scenario-lean-machining'
  ]);

  // Active view tab: 'single_scenario' | 'multi_compare' | 'tornado'
  const [activeTab, setActiveTab] = useState<'single_scenario' | 'multi_compare' | 'tornado'>('single_scenario');

  // Modal states
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<CostSimulationScenario | null>(null);

  // Product filter within active scenario
  const [productSearch, setProductSearch] = useState('');
  const [productHealthFilter, setProductHealthFilter] = useState<'all' | 'eroded' | 'loss' | 'benefiting'>('all');

  // Reload scenarios on revision
  useEffect(() => {
    setScenarios(costSimulationService.getScenarios());
  }, [revision]);

  // Active primary scenario object
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[1] || BASELINE_SCENARIO;
  }, [scenarios, activeScenarioId]);

  // Primary scenario simulation results
  const primarySimulation = useMemo(() => {
    return costSimulationService.simulatePortfolio(activeScenario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario, revision]);

  // Multi-scenario comparison data
  const comparisonData: MultiScenarioComparisonData = useMemo(() => {
    return costSimulationService.compareMultipleScenarios(comparisonScenarioIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonScenarioIds, scenarios, revision]);

  // Filtered products list for active scenario
  const filteredProducts: ProductSimulationResult[] = useMemo(() => {
    let list = primarySimulation.products;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => 
        p.partName.toLowerCase().includes(q) ||
        p.partCode.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.workOrderNumber.toLowerCase().includes(q)
      );
    }
    if (productHealthFilter === 'eroded') {
      list = list.filter(p => p.isMarginEroded);
    } else if (productHealthFilter === 'loss') {
      list = list.filter(p => p.isLossMaking);
    } else if (productHealthFilter === 'benefiting') {
      list = list.filter(p => p.isBenefiting);
    }
    return list;
  }, [primarySimulation.products, productSearch, productHealthFilter]);

  // Toggle scenario inclusion in multi-comparison
  const handleToggleComparison = (id: string) => {
    if (comparisonScenarioIds.includes(id)) {
      if (comparisonScenarioIds.length <= 1) {
        addToast('info', 'Minimum 1 Scenario', 'Keep at least one scenario active for comparison.');
        return;
      }
      setComparisonScenarioIds(comparisonScenarioIds.filter(x => x !== id));
    } else {
      if (comparisonScenarioIds.length >= 4) {
        addToast('info', 'Comparison Limit Reached', 'You can compare up to 4 scenarios side-by-side.');
        return;
      }
      setComparisonScenarioIds([...comparisonScenarioIds, id]);
    }
  };

  // Duplicate scenario
  const handleDuplicate = (id: string) => {
    const copy = costSimulationService.duplicateScenario(id);
    if (copy) {
      setRevision(r => r + 1);
      setActiveScenarioId(copy.id);
      addToast('success', 'Scenario Duplicated', `Created "${copy.name}". You can now edit its levers.`);
    }
  };

  // Delete custom scenario
  const handleDelete = (id: string) => {
    const success = costSimulationService.deleteScenario(id);
    if (success) {
      setRevision(r => r + 1);
      if (activeScenarioId === id) {
        setActiveScenarioId('scenario-mat-inflation');
      }
      setComparisonScenarioIds(prev => prev.filter(x => x !== id));
      addToast('success', 'Scenario Deleted', 'Custom scenario removed.');
    } else {
      addToast('error', 'Cannot Delete', 'System presets cannot be deleted.');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = costSimulationService.exportComparisonCsv(comparisonData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `What_If_Cost_Simulation_${activeScenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Simulation Exported', 'Downloaded multi-scenario margin impact CSV report.');
  };

  const formatCurrency = (val: number) => {
    return `₹${Math.abs(val).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400">
                <SlidersHorizontal size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    What-If Cost Simulation &amp; Margin Stress Test
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    STRATEGIC PLANNING
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate the strategic impact of raw material inflation, labor wage revisions, and routing cycle times on product margins.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingScenario(null);
                setIsBuilderModalOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition"
            >
              <Plus size={14} />
              <span>New Scenario</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Download Side-by-Side Comparison CSV"
            >
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => navigate('/cost-variance')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Switch to Planned vs Actual Variance Analysis"
            >
              <Scale size={14} className="text-indigo-400" />
              <span>Variance Analysis</span>
            </button>

            <button
              onClick={() => navigate('/margin-analysis')}
              className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-700/80 flex items-center gap-1.5 transition"
              title="Real-Time Gross Margin Dashboards & Live P&L"
            >
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Margin Dashboards</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Step-by-Step Business Owner Guidance Box */}
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-purple-200">
                Strategic Decision-Making Workflow
              </div>
              <div className="text-purple-300/80 mt-0.5">
                <strong>Step 1:</strong> Select or build a simulation scenario (*Material Price Shock*, *Wage Settlement*, *5-Axis Lean Routing*) • <strong>Step 2:</strong> Compare side-by-side against Baseline actuals • <strong>Step 3:</strong> Identify at-risk parts and calculate breakeven selling prices to protect net margins.
              </div>
            </div>
          </div>

          {/* Quick Scenario Preset Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-purple-500/40 shrink-0">
            <span className="text-[11px] font-semibold text-slate-300 pl-2">Active Scenario:</span>
            <select
              value={activeScenarioId}
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-slate-950 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer max-w-[220px] truncate"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isPreset ? '' : '(Custom)'}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setEditingScenario(activeScenario);
                setIsBuilderModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Edit scenario levers"
            >
              <Edit3 size={13} />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('single_scenario')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'single_scenario'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sliders size={14} />
              <span>Active Scenario Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('multi_compare')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'multi_compare'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers size={14} />
              <span>Multi-Scenario Comparison ({comparisonScenarioIds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tornado')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'tornado'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingDown size={14} />
              <span>Cost Sensitivity Waterfall</span>
            </button>
          </div>

          {/* Preset Scenario Badge Selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">Include in Multi-Compare:</span>
            {scenarios.filter(s => s.id !== 'scenario-baseline').slice(0, 4).map(s => {
              const active = comparisonScenarioIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleToggleComparison(s.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono transition border flex items-center gap-1 ${
                    active
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {active && <Check size={10} />}
                  <span className="truncate max-w-[120px]">{s.name.split('(')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: SINGLE SCENARIO IMPACT DEEP-DIVE ─────────────── */}
        {activeTab === 'single_scenario' && (
          <div className="space-y-6">
            
            {/* Scenario Header Card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{activeScenario.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                    {activeScenario.category}
                  </span>
                  {activeScenario.isPreset ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                      System Preset
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      User Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{activeScenario.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingScenario(activeScenario);
                    setIsBuilderModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Edit3 size={13} />
                  <span>Adjust Levers</span>
                </button>

                <button
                  onClick={() => handleDuplicate(activeScenario.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                  title="Clone this scenario to create an alternative variant"
                >
                  <Copy size={13} />
                  <span>Clone</span>
                </button>

                {!activeScenario.isPreset && (
                  <button
                    onClick={() => handleDelete(activeScenario.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                    title="Delete scenario"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 4 Executive Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Blended Margin Delta */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Blended Portfolio Margin
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${
                    primarySimulation.summary.blendedMarginSimulatedPercent >= 15 
                      ? 'text-emerald-400' 
                      : primarySimulation.summary.blendedMarginSimulatedPercent >= 0 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                  }`}>
                    {primarySimulation.summary.blendedMarginSimulatedPercent}%
                  </span>
                  <span className={`text-xs font-bold font-mono ${
                    primarySimulation.summary.marginDeltaPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ({primarySimulation.summary.marginDeltaPoints >= 0 ? `+${primarySimulation.summary.marginDeltaPoints}% pts` : `${primarySimulation.summary.marginDeltaPoints}% pts`})
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800 font-mono">
                  <span>Baseline: {primarySimulation.summary.blendedMarginBaselinePercent}%</span>
                  <span>{primarySimulation.summary.marginDeltaPoints < 0 ? 'Margin Erosion' : 'Margin Expansion'}</span>
                </div>
              </div>

              {/* Card 2: Net Realized Profit Delta */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Net Portfolio Profit Impact
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${
                    primarySimulation.summary.netProfitDeltaAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {primarySimulation.summary.netProfitDeltaAmount >= 0 ? '+' : ''}{formatCurrency(primarySimulation.summary.netProfitDeltaAmount)}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800 font-mono">
                  <span>Sim Profit: {formatCurrency(primarySimulation.summary.grossProfitSimulated)}</span>
                  <span>Base: {formatCurrency(primarySimulation.summary.grossProfitBaseline)}</span>
                </div>
              </div>

              {/* Card 3: Incurred Cost Delta */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Total Cost Incurred Delta
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${
                    primarySimulation.summary.netCostDeltaAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {primarySimulation.summary.netCostDeltaAmount > 0 ? '+' : ''}{formatCurrency(primarySimulation.summary.netCostDeltaAmount)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({primarySimulation.summary.netCostDeltaPercent > 0 ? '+' : ''}{primarySimulation.summary.netCostDeltaPercent}%)
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800 font-mono">
                  <span>Sim Cost: {formatCurrency(primarySimulation.summary.totalCostSimulated)}</span>
                  <span>Base: {formatCurrency(primarySimulation.summary.totalCostBaseline)}</span>
                </div>
              </div>

              {/* Card 4: Loss-Making Products */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Loss-Making Products
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${
                    primarySimulation.summary.jobsLossMakingCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {primarySimulation.summary.jobsLossMakingCount} of {primarySimulation.summary.totalJobsCount}
                  </span>
                  {primarySimulation.summary.jobsFlippedToLossCount > 0 && (
                    <span className="text-xs font-mono font-bold text-rose-400 animate-pulse">
                      (⚠ {primarySimulation.summary.jobsFlippedToLossCount} flipped!)
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800 font-mono">
                  <span>{primarySimulation.summary.jobsMarginErodedCount} Eroded</span>
                  <span>{primarySimulation.summary.jobsMarginImprovedCount} Benefited</span>
                </div>
              </div>

            </div>

            {/* Product-Level Impact & Breakeven Pricing Table */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-purple-400" />
                    Simulated Product Unit Economics &amp; Suggested Breakeven Price
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare baseline vs. simulated unit cost, gross margin shift, and target selling price needed to protect profits.
                  </p>
                </div>

                {/* Filter and search */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filter part code or name..."
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <select
                    value={productHealthFilter}
                    onChange={(e) => setProductHealthFilter(e.target.value as any)}
                    className="bg-slate-950 text-slate-300 font-medium text-xs px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Products ({primarySimulation.products.length})</option>
                    <option value="eroded" className="text-amber-400">Margin Eroded (&gt;3% drop)</option>
                    <option value="loss" className="text-rose-400">Loss Making (&lt;0% margin)</option>
                    <option value="benefiting" className="text-emerald-400">Margin Benefiting</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">Part / Work Order</th>
                      <th className="py-3 px-3.5 text-right">Selling Price</th>
                      <th className="py-3 px-3.5 text-right">Base Unit Cost</th>
                      <th className="py-3 px-3.5 text-right">Sim Unit Cost</th>
                      <th className="py-3 px-3.5 text-right">Unit Cost Δ</th>
                      <th className="py-3 px-3.5 text-center">Baseline Margin</th>
                      <th className="py-3 px-3.5 text-center">Simulated Margin</th>
                      <th className="py-3 px-3.5 text-right">Sim Gross Profit</th>
                      <th className="py-3 px-3.5 text-right">Suggested Breakeven Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-sans">
                    {filteredProducts.map((p) => {
                      const flipped = p.baselineGrossProfit >= 0 && p.simulatedGrossProfit < 0;

                      return (
                        <tr key={p.workOrderId} className="hover:bg-slate-800/40 transition">
                          {/* Part & Order */}
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-white">{p.partName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <span className="text-indigo-400">{p.partCode}</span>
                              <span>•</span>
                              <span>{p.workOrderNumber}</span>
                              <span>•</span>
                              <span>{p.customerName}</span>
                            </div>
                          </td>

                          {/* Current Selling Price */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <div className="text-white font-semibold">₹{p.simulatedSellingPrice.toLocaleString()}</div>
                            {p.simulatedSellingPrice !== p.baselineSellingPrice && (
                              <div className="text-[10px] text-purple-400">
                                Base: ₹{p.baselineSellingPrice.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Baseline Unit Cost */}
                          <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                            ₹{p.baselineUnitCost}
                          </td>

                          {/* Simulated Unit Cost */}
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                            ₹{p.simulatedUnitCost}
                          </td>

                          {/* Unit Cost Delta */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <span className={p.costDeltaAmount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              {p.costDeltaAmount > 0 ? '+' : ''}₹{(p.costDeltaAmount / p.quantity).toFixed(2)}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              ({p.costDeltaPercent > 0 ? '+' : ''}{p.costDeltaPercent}%)
                            </div>
                          </td>

                          {/* Baseline Margin */}
                          <td className="py-3 px-3.5 text-center font-mono">
                            <span className="text-slate-300 font-medium">
                              {p.baselineGrossMarginPercent}%
                            </span>
                          </td>

                          {/* Simulated Margin */}
                          <td className="py-3 px-3.5 text-center font-mono">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                                p.isLossMaking 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                  : p.simulatedGrossMarginPercent >= 20 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {p.simulatedGrossMarginPercent}%
                                <span className="text-[10px] font-normal">
                                  ({p.marginDeltaPercent > 0 ? `+${p.marginDeltaPercent}` : p.marginDeltaPercent}%)
                                </span>
                              </span>
                              {flipped && (
                                <span className="text-[9px] font-bold text-rose-400 uppercase animate-pulse">
                                  Turned Loss
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Simulated Gross Profit */}
                          <td className="py-3 px-3.5 text-right font-mono font-bold">
                            <span className={p.simulatedGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {p.simulatedGrossProfit >= 0 ? '+' : ''}₹{p.simulatedGrossProfit.toLocaleString()}
                            </span>
                          </td>

                          {/* Suggested Breakeven Price */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded font-bold text-xs">
                              ₹{p.suggestedBreakevenPrice.toLocaleString()}/u
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              (Δ +₹{(p.suggestedBreakevenPrice - p.baselineSellingPrice).toFixed(1)})
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: MULTI-SCENARIO COMPARISON MATRIX ─────────────── */}
        {activeTab === 'multi_compare' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  Side-by-Side Multi-Scenario Executive Comparison Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Benchmarking Baseline shop actuals against {comparisonScenarioIds.length} strategic scenarios simultaneously.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition"
                >
                  <Download size={13} />
                  <span>Export Matrix CSV</span>
                </button>
              </div>
            </div>

            <ScenarioComparisonMatrix
              data={comparisonData}
              onSelectProduct={(woId) => {
                setActiveTab('single_scenario');
                setProductSearch(woId);
              }}
            />
          </div>
        )}

        {/* ── TAB 3: COST SENSITIVITY TORNADO & WATERFALL ─────────── */}
        {activeTab === 'tornado' && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown size={16} className="text-purple-400" />
                  Portfolio Net Profit Variance Driver Waterfall
                </h3>
                <p className="text-xs text-slate-400">
                  Isolates the relative financial impact of material price hikes, labor rate changes, machine cycle times, overhead absorption, and customer pass-through.
                </p>
              </div>

              {/* Waterfall Breakdown Bars */}
              <div className="space-y-3 pt-2">
                {/* Material Impact */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <Package size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Raw Material Price &amp; Scrap Impact</div>
                      <div className="text-[10px] text-slate-400">Ingot, billet, alloy grade price shifts &amp; scrap waste</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${
                      primarySimulation.summary.materialCostImpact > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {primarySimulation.summary.materialCostImpact > 0 ? '+' : ''}₹{primarySimulation.summary.materialCostImpact.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {primarySimulation.summary.materialCostImpact > 0 ? 'Cost Increase (Erosion)' : 'Cost Savings'}
                    </span>
                  </div>
                </div>

                {/* Labor Impact */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Clock size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Shop Floor Direct Labor Wage Impact</div>
                      <div className="text-[10px] text-slate-400">Machinist wage rates, overtime premium &amp; setup efficiency</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${
                      primarySimulation.summary.laborCostImpact > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {primarySimulation.summary.laborCostImpact > 0 ? '+' : ''}₹{primarySimulation.summary.laborCostImpact.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {primarySimulation.summary.laborCostImpact > 0 ? 'Cost Increase (Erosion)' : 'Cost Savings'}
                    </span>
                  </div>
                </div>

                {/* Machine Routing Impact */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Factory size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Machine Routing &amp; Cycle Time Impact</div>
                      <div className="text-[10px] text-slate-400">Spindle speed CAM optimization, MHR rates &amp; power tariffs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${
                      primarySimulation.summary.machineCostImpact > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {primarySimulation.summary.machineCostImpact > 0 ? '+' : ''}₹{primarySimulation.summary.machineCostImpact.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {primarySimulation.summary.machineCostImpact > 0 ? 'Cost Increase (Erosion)' : 'Cost Savings (Lean Gain)'}
                    </span>
                  </div>
                </div>

                {/* Overhead Impact */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Sliders size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Factory Overhead &amp; SG&amp;A Absorption</div>
                      <div className="text-[10px] text-slate-400">Industrial absorption rule shifts from direct labor &amp; machine hours</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${
                      primarySimulation.summary.overheadCostImpact > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {primarySimulation.summary.overheadCostImpact > 0 ? '+' : ''}₹{primarySimulation.summary.overheadCostImpact.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">Overhead Absorption Shift</span>
                  </div>
                </div>

                {/* Pass-Through Relief */}
                {primarySimulation.summary.revenuePassThroughImpact > 0 && (
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-purple-500/40 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <DollarSign size={15} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Customer Price Pass-Through Revenue Recovery</div>
                        <div className="text-[10px] text-slate-400">Portion of cost increase passed directly to contract selling price</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-400">
                        +₹{primarySimulation.summary.revenuePassThroughImpact.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-purple-300">Revenue Mitigation</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Net Result Bar */}
              <div className="p-4 bg-slate-950 rounded-xl border-2 border-slate-800 flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Net Realized Portfolio Profit Delta:</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Baseline: ₹{primarySimulation.summary.grossProfitBaseline.toLocaleString()} → Simulated: ₹{primarySimulation.summary.grossProfitSimulated.toLocaleString()}
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  primarySimulation.summary.netProfitDeltaAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {primarySimulation.summary.netProfitDeltaAmount >= 0 ? '+' : ''}₹{primarySimulation.summary.netProfitDeltaAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* SCENARIO BUILDER MODAL */}
      {isBuilderModalOpen && (
        <ScenarioBuilderModal
          initialScenario={editingScenario}
          onClose={() => setIsBuilderModalOpen(false)}
          onSaved={(saved) => {
            setIsBuilderModalOpen(false);
            setRevision(r => r + 1);
            setActiveScenarioId(saved.id);
            if (!comparisonScenarioIds.includes(saved.id)) {
              setComparisonScenarioIds(prev => [...prev.slice(0, 3), saved.id]);
            }
          }}
        />
      )}
    </div>
  );
};
