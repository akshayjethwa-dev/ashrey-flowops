// src/pages/quality/ScrapReworkCostTrackingPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  AlertOctagon,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Factory,
  Clock,
  User,
  Sliders,
  Filter,
  Search,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  ExternalLink,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ScrapRecord,
  ReworkRecord,
  ParetoDimension,
  ShiftType,
  RootCauseCategory,
  ScrapReworkFilters,
  ReworkStatus
} from '../../types/scrapRework';
import { scrapReworkService } from '../../services/scrapReworkService';
import { CopqParetoChart } from '../../components/scrap-rework/CopqParetoChart';
import { ScrapEntryModal } from '../../components/scrap-rework/ScrapEntryModal';
import { ReworkTrackingModal } from '../../components/scrap-rework/ReworkTrackingModal';
import { ReworkStatusUpdateModal } from '../../components/scrap-rework/ReworkStatusUpdateModal';
import { useToast } from '../../context/ToastContext';

export const ScrapReworkCostTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pareto' | 'scrap_registry' | 'rework_pipeline' | 'wo_margin_impact'>('pareto');

  // Pareto Dimension
  const [paretoDimension, setParetoDimension] = useState<ParetoDimension>('machine');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'all'>('all');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<RootCauseCategory | 'all'>('all');

  // Modals State
  const [isScrapModalOpen, setIsScrapModalOpen] = useState<boolean>(false);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState<boolean>(false);
  const [selectedReworkForStatus, setSelectedReworkForStatus] = useState<ReworkRecord | null>(null);

  // Revision state to force re-render when record added
  const [revision, setRevision] = useState<number>(0);

  // Master Catalogs for filter dropdowns
  const machines = useMemo(() => scrapReworkService.getMachinesList(), []);
  const operators = useMemo(() => scrapReworkService.getOperatorsList(), []);
  const workOrders = useMemo(() => scrapReworkService.getWorkOrdersList(), []);

  // Filter Object
  const currentFilters: ScrapReworkFilters = useMemo(() => {
    return {
      searchQuery: searchQuery || undefined,
      machineId: selectedMachineId !== 'all' ? selectedMachineId : undefined,
      shift: selectedShift,
      operatorId: selectedOperatorId !== 'all' ? selectedOperatorId : undefined,
      rootCauseCategory: selectedCategory
    };
  }, [searchQuery, selectedMachineId, selectedShift, selectedOperatorId, selectedCategory]);

  // Data Queries
  const scrapRecords = useMemo(() => {
    return scrapReworkService.getScrapRecords(currentFilters);
  }, [currentFilters, revision]);

  const reworkRecords = useMemo(() => {
    return scrapReworkService.getReworkRecords(currentFilters);
  }, [currentFilters, revision]);

  const summary = useMemo(() => {
    return scrapReworkService.getCopqSummary(currentFilters);
  }, [currentFilters, revision]);

  const paretoAnalysis = useMemo(() => {
    return scrapReworkService.getParetoAnalysis(paretoDimension, currentFilters);
  }, [paretoDimension, currentFilters, revision]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const csvData = scrapReworkService.exportCopqAuditCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `COPQ_Scrap_Rework_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'COPQ Audit CSV successfully generated and downloaded.');
  };

  const handleResetDefaults = () => {
    if (confirm('Reset Scrap & Rework database to factory demonstration records?')) {
      scrapReworkService.resetToFactoryDefaults();
      setRevision(prev => prev + 1);
      addToast('info', 'Reset to factory seed records completed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Navigation Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-2 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Quality &amp; Continuous Improvement</span>
          <span>/</span>
          <span className="text-rose-400 font-semibold">Scrap &amp; Rework Cost Tracking (COPQ)</span>
        </div>

        {/* Cross-module Quick Links */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/cost-rollup')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-Time Cost Roll-Up</span>
          </button>
          <button
            onClick={() => navigate('/cost-variance')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Planned vs Actual Variance</span>
          </button>
          <button
            onClick={() => navigate('/cost-simulation')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>What-If Simulation</span>
          </button>
          <button
            onClick={() => navigate('/margin-analysis')}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-800/80 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Margin Dashboards</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-950/40">
              <Flame className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Scrap &amp; Rework Cost Tracking
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Calculate the True Cost of Poor Quality (COPQ) tied back to machines, shifts, and operators with actionable Pareto analysis
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsScrapModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02]"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Record Scrap</span>
          </button>

          <button
            onClick={() => setIsReworkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Create Rework Ticket</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
            title="Export CSV Audit"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export Audit CSV</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-colors"
            title="Reset to Demo Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total COPQ */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total COPQ Loss</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">
            ${summary.totalCopq.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-300/80 mt-1.5">
            <span className="font-bold">{summary.copqPercentageOfProduction}%</span>
            <span>of total production value</span>
          </div>
        </div>

        {/* Card 2: Net Scrap Loss */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Net Scrap Loss</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white mt-2">
            ${summary.netScrapCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
            <span>{summary.totalScrappedUnits} units scrapped</span>
            <span className="text-emerald-400 font-mono">+${summary.totalSalvageRecovery.toFixed(0)} salvage</span>
          </div>
        </div>

        {/* Card 3: Rework Cost Incurred */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Rework Cost Incurred</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-2">
            ${summary.totalReworkCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
            <span>{summary.totalReworkLaborHours} labor hrs</span>
            <span>{summary.totalReworkMachineHours} mch hrs</span>
          </div>
        </div>

        {/* Card 4: Value Preserved via Rework */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Value Preserved / Saved</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            +${summary.totalCostSavedViaRework.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mt-1.5">
            <span>Rework Pass Rate</span>
            <span className="font-bold font-mono">{summary.reworkSuccessRatePct}%</span>
          </div>
        </div>

        {/* Card 5: Vital Few Offenders */}
        <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Vital Few Offenders</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-300 mt-2">
            {summary.vitalFewOffendersCount} <span className="text-xs text-slate-400 font-normal">Entities</span>
          </div>
          <div className="text-[11px] text-indigo-300/80 mt-1.5">
            Generate 80% of factory COPQ
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search WO#, Part, Machine, Reason, Operator..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Machine Filter */}
          <div className="flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Machines</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftType | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Shifts</option>
              <option value="shift_a">Shift A (Morning)</option>
              <option value="shift_b">Shift B (Evening)</option>
              <option value="shift_c">Shift C (Night)</option>
            </select>
          </div>

          {/* Operator Filter */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Operators</option>
              {operators.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as RootCauseCategory | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Root Cause Categories</option>
              <option value="Machining & CNC Programming">Machining & CNC Programming</option>
              <option value="Tooling & Cutters">Tooling & Cutters</option>
              <option value="Raw Material Defect">Raw Material Defect</option>
              <option value="Operator Technique & Setup">Operator Technique & Setup</option>
              <option value="Thermal & Heat Treatment">Thermal & Heat Treatment</option>
              <option value="Handling & Contamination">Handling & Contamination</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedMachineId !== 'all' || selectedShift !== 'all' || selectedOperatorId !== 'all' || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMachineId('all');
              setSelectedShift('all');
              setSelectedOperatorId('all');
              setSelectedCategory('all');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl font-medium transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pareto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pareto'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Pareto Analysis (Machine / Shift / Operator)</span>
        </button>

        <button
          onClick={() => setActiveTab('scrap_registry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'scrap_registry'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Scrap Registry &amp; Reasons ({scrapRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rework_pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rework_pipeline'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Rework Tracking &amp; Recovery ({reworkRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wo_margin_impact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wo_margin_impact'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Work Order Margin Erosion</span>
        </button>
      </div>

      {/* Tab 1: Pareto Analysis */}
      {activeTab === 'pareto' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Dual-axis Pareto Chart Component */}
          <CopqParetoChart
            analysis={paretoAnalysis}
            selectedDimension={paretoDimension}
            onDimensionChange={setParetoDimension}
          />

          {/* Pareto Ranked Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ranked Contributors by Total COPQ ({paretoDimension.toUpperCase()})
                </h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing {paretoAnalysis.items.length} contributors sorted by financial impact
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rank &amp; Entity</th>
                    <th className="py-3 px-3">Classification</th>
                    <th className="py-3 px-3 text-right">Scrap Cost ($)</th>
                    <th className="py-3 px-3 text-right">Rework Cost ($)</th>
                    <th className="py-3 px-4 text-right">Total COPQ ($)</th>
                    <th className="py-3 px-3 text-right">Share %</th>
                    <th className="py-3 px-3 text-right">Cumulative %</th>
                    <th className="py-3 px-4">Root Cause &amp; Corrective Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paretoAnalysis.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.isVitalFew ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                            idx === 0
                              ? 'bg-rose-600 text-white'
                              : idx === 1
                              ? 'bg-amber-600 text-white'
                              : idx === 2
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white text-xs">{item.label}</div>
                            {item.subLabel && (
                              <div className="text-[10px] text-slate-500 font-mono">{item.subLabel}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.isVitalFew ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Flame className="w-3 h-3 text-rose-400" />
                            VITAL FEW
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                            USEFUL MANY
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-rose-400 font-semibold">
                        ${item.scrapCost.toFixed(2)}
                        <div className="text-[10px] text-slate-500">({item.scrapUnits} pcs)</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-400 font-semibold">
                        ${item.reworkCost.toFixed(2)}
                        <div className="text-[10px] text-slate-500">({item.reworkUnits} pcs)</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        ${item.totalCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300 font-medium">
                        {item.percentage}%
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400">
                        {item.cumulativePercentage}%
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-300">
                          <span className="text-slate-400 font-medium">Top Driver: </span>
                          <span className="text-amber-300 font-semibold">{item.topReasonOrMachine}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                          {item.primaryActionRecommendation}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scrap Registry & Reason Codes */}
      {activeTab === 'scrap_registry' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                  <span>Production Scrap Registry</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    {scrapRecords.length} records
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed ledger of scrapped work orders, standardized reason codes, scrap credit offsets, and root causes
                </p>
              </div>

              <button
                onClick={() => setIsScrapModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Scrap</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Scrap # / Work Order</th>
                    <th className="py-3 px-4">Part &amp; Operation</th>
                    <th className="py-3 px-3">Reason Code &amp; Root Cause</th>
                    <th className="py-3 px-3">Attribution (Mch / Shift / Op)</th>
                    <th className="py-3 px-3 text-center">Qty Scrapped</th>
                    <th className="py-3 px-3 text-right">Gross Cost</th>
                    <th className="py-3 px-3 text-right">Salvage Credit</th>
                    <th className="py-3 px-4 text-right">Net Scrap Loss</th>
                    <th className="py-3 px-4">Lot / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scrapRecords.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-rose-400">{s.scrapNumber}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{s.workOrderNumber}</div>
                        <div className="text-[10px] text-slate-500">{s.customerName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{s.partCode}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{s.partName}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {s.operationCode}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-amber-300 text-xs">{s.reasonName}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {s.rootCauseCategory}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-white font-medium truncate max-w-[150px]">{s.machineName}</div>
                        <div className="text-[11px] text-indigo-300 font-mono">{s.shiftLabel.split(' ')[0]} &bull; {s.operatorName}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold font-mono text-white">
                        {s.quantityScrapped} {s.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        ${s.grossScrapCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-400">
                        -${s.totalSalvageCredit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                        ${s.netScrapCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-mono text-[10px] text-slate-400">Lot: {s.lotNumber}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{s.notes || s.description}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rework Tracking & Recovery */}
      {activeTab === 'rework_pipeline' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span>Rework Tracking &amp; Value Preservation Pipeline</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    {reworkRecords.length} tickets
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track secondary operations, corrective labor hours, machine overhead, and value saved by avoiding scrap
                </p>
              </div>

              <button
                onClick={() => setIsReworkModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Rework Ticket</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ticket # / Work Order</th>
                    <th className="py-3 px-4">Part &amp; Station</th>
                    <th className="py-3 px-3">Rework Reason</th>
                    <th className="py-3 px-3">Technician &amp; Machine</th>
                    <th className="py-3 px-3 text-center">Rework Qty</th>
                    <th className="py-3 px-3 text-right">Time Captured</th>
                    <th className="py-3 px-3 text-right">Total Rework Cost</th>
                    <th className="py-3 px-3 text-right">Net Value Saved</th>
                    <th className="py-3 px-3 text-center">Disposition Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reworkRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold font-mono text-amber-400">{r.reworkNumber}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{r.workOrderNumber}</div>
                        <div className="text-[10px] text-slate-500">{r.customerName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{r.partCode}</div>
                        <div className="text-[11px] text-amber-300/90 font-medium">{r.reworkStationName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{r.reworkInstructions}</div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-200">
                        {r.reasonName}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{r.operatorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.machineName}</div>
                        <div className="text-[10px] text-indigo-300 font-mono">{r.shiftLabel.split(' ')[0]}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold font-mono text-white">
                        {r.reworkQuantity} {r.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        <div>{r.reworkLaborHours}h labor</div>
                        <div className="text-[10px] text-slate-400">{r.reworkMachineHours}h machine</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                        ${r.totalReworkCost.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        +${r.netCostBenefit.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {r.status === 'rework_passed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            PASSED QC
                          </span>
                        )}
                        {r.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                            IN PROGRESS
                          </span>
                        )}
                        {r.status === 'pending_rework' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            QUEUED
                          </span>
                        )}
                        {r.status === 'rework_failed_scrapped' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            FAILED / SCRAP
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReworkForStatus(r)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          Update Disposition
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

      {/* Tab 4: Work Order Margin Impact & Cost Roll-Up Integration */}
      {activeTab === 'wo_margin_impact' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Work Order Margin Impact &amp; True Cost Roll-Up</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison of standard quoted margin vs actual margin degraded by Scrap and Rework COPQ
                </p>
              </div>

              <button
                onClick={() => navigate('/cost-rollup')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/40"
              >
                <span>Open Full Cost Roll-Up</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Work Order</th>
                    <th className="py-3 px-4">Customer &amp; Part</th>
                    <th className="py-3 px-3 text-right">Job Revenue ($)</th>
                    <th className="py-3 px-3 text-right">Standard Cost ($)</th>
                    <th className="py-3 px-3 text-right">Quoted Margin %</th>
                    <th className="py-3 px-3 text-right text-rose-400">Scrap Debit ($)</th>
                    <th className="py-3 px-3 text-right text-amber-400">Rework Debit ($)</th>
                    <th className="py-3 px-3 text-right font-bold text-white">Total COPQ ($)</th>
                    <th className="py-3 px-3 text-right font-bold">Actual Margin %</th>
                    <th className="py-3 px-4 text-center">Profitability Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {workOrders.map((wo) => {
                    const woScrap = scrapRecords.filter(s => s.workOrderId === wo.id);
                    const woRework = reworkRecords.filter(r => r.workOrderId === wo.id);

                    const scrapCost = woScrap.reduce((acc, s) => acc + s.netScrapCost, 0);
                    const reworkCost = woRework.reduce((acc, r) => acc + r.totalReworkCost, 0);
                    const totalWoCopq = scrapCost + reworkCost;

                    // Typical job batch of 50 units
                    const batchQty = 50;
                    const totalRevenue = wo.revenue * batchQty;
                    const standardTotalCost = wo.baseCost * batchQty;
                    const quotedMarginPct = Number((((totalRevenue - standardTotalCost) / totalRevenue) * 100).toFixed(1));

                    const actualTotalCost = standardTotalCost + totalWoCopq;
                    const actualMarginPct = Number((((totalRevenue - actualTotalCost) / totalRevenue) * 100).toFixed(1));
                    const marginErosionPct = Number((quotedMarginPct - actualMarginPct).toFixed(1));

                    const isLoss = actualMarginPct < 15;

                    return (
                      <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold font-mono text-white">{wo.number}</div>
                          <span className="text-[10px] text-slate-500 font-mono">50 units batch</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{wo.part}</div>
                          <div className="text-[11px] text-slate-400">{wo.customer}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                          ${totalRevenue.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          ${standardTotalCost.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                          {quotedMarginPct}%
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-rose-400 font-semibold">
                          ${scrapCost.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-amber-400 font-semibold">
                          ${reworkCost.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-white text-sm">
                          ${totalWoCopq.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={actualMarginPct < 20 ? 'text-rose-400' : 'text-emerald-400'}>
                            {actualMarginPct}%
                          </span>
                          <div className="text-[10px] text-rose-400 font-mono">-{marginErosionPct}%</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isLoss ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              MARGIN ERODED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              PROFITABLE
                            </span>
                          )}
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

      {/* Modals */}
      <ScrapEntryModal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        onScrapAdded={(newScrap) => {
          setRevision(prev => prev + 1);
          addToast('success', `Scrap entry ${newScrap.scrapNumber} recorded (-$${newScrap.netScrapCost.toFixed(2)})`);
        }}
      />

      <ReworkTrackingModal
        isOpen={isReworkModalOpen}
        onClose={() => setIsReworkModalOpen(false)}
        onReworkAdded={(newRework) => {
          setRevision(prev => prev + 1);
          addToast('success', `Rework ticket ${newRework.reworkNumber} created (Saved +$${newRework.netCostBenefit.toFixed(2)})`);
        }}
      />

      <ReworkStatusUpdateModal
        reworkRecord={selectedReworkForStatus}
        isOpen={!!selectedReworkForStatus}
        onClose={() => setSelectedReworkForStatus(null)}
        onUpdated={(updated) => {
          setRevision(prev => prev + 1);
          addToast('success', `Rework ticket ${updated.reworkNumber} updated to ${updated.status}`);
        }}
      />
    </div>
  );
};
