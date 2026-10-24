// src/pages/quality/DefectParetoHeatmapPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Crosshair,
  Flame,
  Factory,
  Clock,
  User,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Cpu,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import {
  DefectRecord,
  PartDefinition,
  DefectFilterOptions,
  ParetoMetricType,
  ShiftType,
  DefectSeverityLevel,
  DefectClassification,
  DefectSpatialPoint
} from '../../types/defectPareto';
import {
  defectParetoService,
  DEFECT_CLASSIFICATION_INFO,
  PRESET_PARTS
} from '../../services/defectParetoService';
import { DefectParetoChart } from '../../components/defect-pareto/DefectParetoChart';
import { PartHeatmapViewer } from '../../components/defect-pareto/PartHeatmapViewer';
import { MachineShiftOperatorBreakdown } from '../../components/defect-pareto/MachineShiftOperatorBreakdown';
import { DefectDetailModal } from '../../components/defect-pareto/DefectDetailModal';
import { LogDefectModal } from '../../components/defect-pareto/LogDefectModal';
import { useToast } from '../../context/ToastContext';

export const DefectParetoHeatmapPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Parts Catalog & Active Selected Part
  const parts = useMemo(() => defectParetoService.getParts(), []);
  const [activePart, setActivePart] = useState<PartDefinition>(parts[0]);

  // Master Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>(undefined);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | undefined>(undefined);
  const [selectedShift, setSelectedShift] = useState<ShiftType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<DefectSeverityLevel | 'all'>('all');
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'last_7_days' | 'last_30_days'>('all');

  // Pareto Chart Metric
  const [paretoMetric, setParetoMetric] = useState<ParetoMetricType>('frequency');

  // Interactive Pinpoint Mode on Part
  const [isPinpointMode, setIsPinpointMode] = useState<boolean>(false);
  const [pickedSpatialPoint, setPickedSpatialPoint] = useState<DefectSpatialPoint | null>(null);

  // Modals State
  const [selectedDefectForModal, setSelectedDefectForModal] = useState<DefectRecord | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Revision ticker to force re-render when new defect is logged
  const [revision, setRevision] = useState<number>(0);

  // Combined Filters
  const currentFilters: DefectFilterOptions = useMemo(() => {
    return {
      searchQuery: searchQuery || undefined,
      machineId: selectedMachineId,
      operatorId: selectedOperatorId,
      shift: selectedShift,
      severity: selectedSeverity,
      defectClassification: selectedClassification as DefectClassification || undefined,
      timeRange
    };
  }, [
    searchQuery,
    selectedMachineId,
    selectedOperatorId,
    selectedShift,
    selectedSeverity,
    selectedClassification,
    timeRange
  ]);

  // Reactive Data Calculations
  const allFilteredDefects = useMemo(() => {
    return defectParetoService.getDefects(currentFilters);
  }, [currentFilters, revision]);

  const paretoResult = useMemo(() => {
    return defectParetoService.computeParetoAnalysis(currentFilters, paretoMetric);
  }, [currentFilters, paretoMetric, revision]);

  const heatmapZones = useMemo(() => {
    return defectParetoService.getHeatmapZones(activePart.sku, currentFilters);
  }, [activePart.sku, currentFilters, revision]);

  const machineBreakdown = useMemo(() => {
    return defectParetoService.getMachineBreakdown(currentFilters);
  }, [currentFilters, revision]);

  const shiftBreakdown = useMemo(() => {
    return defectParetoService.getShiftBreakdown(currentFilters);
  }, [currentFilters, revision]);

  const operatorBreakdown = useMemo(() => {
    return defectParetoService.getOperatorBreakdown(currentFilters);
  }, [currentFilters, revision]);

  // KPI Calculations
  const totalDefectsCount = paretoResult.totalDefectCount;
  const totalCost = paretoResult.totalCostCopq;
  const vitalFewDefectCount = paretoResult.vitalFewCount;
  const topCulpritMachine = machineBreakdown[0];

  // Actions
  const handleDropPinpoint = (point: DefectSpatialPoint) => {
    setPickedSpatialPoint(point);
    setIsPinpointMode(false);
    setIsLogModalOpen(true);
  };

  const handleDefectLogged = (defect: DefectRecord) => {
    setRevision(r => r + 1);
    addToast(
      'success',
      'Defect Logged Successfully',
      `${defect.defectNumber} recorded on ${defect.spatialLocation.zoneName}. Pareto & Heatmap updated.`
    );
  };

  const handleExportCsv = () => {
    try {
      const csv = defectParetoService.exportDefectsCsv(currentFilters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Defect_Pareto_Heatmap_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(
        'info',
        'Report Exported',
        'Defect Pareto & spatial coordinates exported to CSV.'
      );
    } catch {
      addToast(
        'error',
        'Export Failed',
        'Unable to generate CSV export.'
      );
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMachineId(undefined);
    setSelectedOperatorId(undefined);
    setSelectedShift('all');
    setSelectedSeverity('all');
    setSelectedClassification(null);
    setTimeRange('all');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <BarChart2 size={12} className="text-rose-400" />
              ISO 9001:2015 §8.7 & IATF 16949
            </span>
            <span className="text-xs text-slate-400">
              Quality Assurance & Continuous Improvement
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Flame className="text-rose-500 animate-pulse" size={28} />
            <span>Defect Pareto & Heat Maps</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Prioritize root cause actions using the <strong className="text-rose-300">80/20 Pareto principle</strong>. Visualize spatial defect clusters on <strong className="text-amber-300">2D CAD blueprints & 3D models</strong>, and cross-tabulate variances by machine, operator, and shift.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            onClick={() => {
              setPickedSpatialPoint(null);
              setIsLogModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Log Defect</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigate('/ncr')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-900/60 transition-all flex items-center gap-1.5"
          >
            <ShieldAlert size={14} className="text-rose-400" />
            <span>NCR & CAPA Desk</span>
          </button>

          <button
            onClick={() => navigate('/scrap-rework')}
            className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-800/80 transition-all flex items-center gap-1.5"
          >
            <Flame size={14} className="text-rose-400" />
            <span>Scrap & Rework COPQ</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Defects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
              Total Defect Count
            </span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {totalDefectsCount} defects
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              -12% vs last month
            </span>
          </div>
        </div>

        {/* Card 2: COPQ Financial Loss */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
              COPQ Scrap & Rework
            </span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              ${totalCost.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Direct quality loss
            </span>
          </div>
        </div>

        {/* Card 3: Vital Few 80% */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
              Vital Few Defect Types
            </span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
              {vitalFewDefectCount} of {paretoResult.items.length}
            </div>
            <span className="text-[10px] text-rose-300 font-mono">
              Drives 80% of all losses
            </span>
          </div>
        </div>

        {/* Card 4: Top Culprit Machine */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Factory size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
              Highest Defect Station
            </span>
            <div className="text-base font-bold text-indigo-300 truncate max-w-[140px] mt-0.5">
              {topCulpritMachine ? topCulpritMachine.machineId : 'None'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {topCulpritMachine ? `${topCulpritMachine.defectCount} defects` : 'No data'}
            </span>
          </div>
        </div>

        {/* Card 5: Shopfloor DPMO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block">
              DPMO / Defect Rate
            </span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              1,840 PPM
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              Six Sigma 4.4 σ Level
            </span>
          </div>
        </div>
      </div>

      {/* Master Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by defect number, title, part SKU, machine, operator, or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Quick Clear Button */}
          {(searchQuery || selectedMachineId || selectedOperatorId || selectedShift !== 'all' || selectedSeverity !== 'all' || selectedClassification || timeRange !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs text-rose-400 hover:text-white bg-rose-950/60 border border-rose-800 rounded-xl font-semibold transition-all shrink-0"
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
          {/* Machine Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Machine</label>
            <select
              value={selectedMachineId || 'all'}
              onChange={(e) => setSelectedMachineId(e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Machines</option>
              {machineBreakdown.map(m => (
                <option key={m.machineId} value={m.machineId}>{m.machineId}</option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftType | 'all')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Shifts (A, B, C)</option>
              <option value="shift_a">Shift A (Morning)</option>
              <option value="shift_b">Shift B (Afternoon)</option>
              <option value="shift_c">Shift C (Night)</option>
            </select>
          </div>

          {/* Operator Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Operator</label>
            <select
              value={selectedOperatorId || 'all'}
              onChange={(e) => setSelectedOperatorId(e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Operators</option>
              {operatorBreakdown.map(o => (
                <option key={o.operatorId} value={o.operatorId}>{o.operatorName}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as DefectSeverityLevel | 'all')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          {/* Defect Classification Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Defect Category</label>
            <select
              value={selectedClassification || 'all'}
              onChange={(e) => setSelectedClassification(e.target.value === 'all' ? null : e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Categories</option>
              {Object.entries(DEFECT_CLASSIFICATION_INFO).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Time Horizon</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="all">All Time Records</option>
              <option value="today">Today's Run</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Section 1: Defect Pareto Chart */}
      <DefectParetoChart
        paretoResult={paretoResult}
        metricType={paretoMetric}
        onChangeMetric={setParetoMetric}
        selectedClassification={selectedClassification}
        onSelectClassification={setSelectedClassification}
      />

      {/* Main Section 2: Interactive Part Defect Heatmap Viewer (2D/3D) */}
      <PartHeatmapViewer
        parts={parts}
        activePart={activePart}
        onSelectPart={setActivePart}
        defects={allFilteredDefects}
        heatmapZones={heatmapZones}
        onSelectDefect={setSelectedDefectForModal}
        onDropPinpoint={handleDropPinpoint}
        isPinpointMode={isPinpointMode}
        onTogglePinpointMode={setIsPinpointMode}
      />

      {/* Main Section 3: Machine, Shift & Operator Drill-Downs */}
      <MachineShiftOperatorBreakdown
        machines={machineBreakdown}
        shifts={shiftBreakdown}
        operators={operatorBreakdown}
        activeMachineId={selectedMachineId}
        activeShift={selectedShift}
        activeOperatorId={selectedOperatorId}
        onFilterMachine={setSelectedMachineId}
        onFilterShift={setSelectedShift}
        onFilterOperator={setSelectedOperatorId}
      />

      {/* Main Section 4: Filtered Defect Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-rose-400" />
              <span>Detailed Defect Event Log ({allFilteredDefects.length} records)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any defect record to inspect coordinates, metrology variance, and auto-generate an NCR.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Showing {allFilteredDefects.length} matched incidents
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs text-left text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="p-3">Defect #</th>
                <th className="p-3">Part & Zone</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Machine</th>
                <th className="p-3">Operator / Shift</th>
                <th className="p-3">Units</th>
                <th className="p-3">COPQ ($)</th>
                <th className="p-3">NCR Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {allFilteredDefects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-sans">
                    No defects match current filter criteria.
                  </td>
                </tr>
              ) : (
                allFilteredDefects.map((def) => {
                  const isCritical = def.severity === 'critical';
                  const totalCost = def.scrapCost + def.reworkCost;

                  return (
                    <tr
                      key={def.id}
                      onClick={() => setSelectedDefectForModal(def)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="p-3 font-bold text-rose-400">
                        {def.defectNumber}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white font-sans">{def.partName}</div>
                        <div className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                          <Crosshair size={10} />
                          <span>{def.spatialLocation.zoneName} (X:{def.spatialLocation.x}%, Y:{def.spatialLocation.y}%)</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-sans font-medium text-slate-200 block truncate max-w-[170px]">
                          {def.defectCategoryLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">{def.title}</span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          isCritical
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : def.severity === 'major'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {def.severity}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-200">{def.machineId}</span>
                        <span className="text-[10px] text-slate-500 font-sans block truncate max-w-[120px]">
                          {def.machineName}
                        </span>
                      </td>

                      <td className="p-3 font-sans">
                        <span className="text-slate-200 font-medium block">{def.operatorName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{def.shiftLabel}</span>
                      </td>

                      <td className="p-3 font-bold text-cyan-300">
                        {def.defectiveUnitsCount}
                      </td>

                      <td className="p-3 font-bold text-amber-300">
                        ${totalCost.toLocaleString()}
                      </td>

                      <td className="p-3">
                        {def.linkedNcrNumber ? (
                          <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                            {def.linkedNcrNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-sans">None</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDefectForModal(def);
                          }}
                          className="px-2.5 py-1 bg-slate-800 group-hover:bg-rose-600 group-hover:text-white text-slate-300 rounded font-sans text-[11px] transition-all"
                        >
                          Inspect
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

      {/* Inspector Modal */}
      <DefectDetailModal
        defect={selectedDefectForModal}
        onClose={() => setSelectedDefectForModal(null)}
        onNcrCreated={(ncrNumber) => {
          setRevision(r => r + 1);
          addToast(
            'success',
            'NCR Created & Linked',
            `Created non-conformance ${ncrNumber} with disposition workflow.`
          );
        }}
        onNavigateToNcr={(ncrNum) => {
          setSelectedDefectForModal(null);
          navigate('/ncr');
        }}
      />

      {/* Log Defect Modal */}
      {isLogModalOpen && (
        <LogDefectModal
          parts={parts}
          activePart={activePart}
          initialSpatialPoint={pickedSpatialPoint}
          onClose={() => setIsLogModalOpen(false)}
          onDefectLogged={handleDefectLogged}
        />
      )}
    </div>
  );
};
