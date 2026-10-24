// src/components/cost-simulation/ScenarioBuilderModal.tsx

import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  Package,
  Clock,
  Factory,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Save,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { CostSimulationScenario } from '../../types/costSimulation';
import { costSimulationService } from '../../services/costSimulationService';
import { useToast } from '../../context/ToastContext';

interface Props {
  initialScenario?: CostSimulationScenario | null;
  onClose: () => void;
  onSaved: (saved: CostSimulationScenario) => void;
}

export const ScenarioBuilderModal: React.FC<Props> = ({
  initialScenario,
  onClose,
  onSaved
}) => {
  const { addToast } = useToast();

  const isEditing = Boolean(initialScenario && !initialScenario.isPreset);

  // Scenario Identity
  const [name, setName] = useState(initialScenario?.name || 'Custom Strategic Scenario');
  const [description, setDescription] = useState(
    initialScenario?.description || 'Simulate combined impact of material price adjustments, wage settlements, and cycle times.'
  );
  const [category, setCategory] = useState<CostSimulationScenario['category']>(
    initialScenario?.category || 'custom'
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'material' | 'labor' | 'routing' | 'commercials'>('material');

  // Levers state
  const [globalMaterialPercent, setGlobalMaterialPercent] = useState(
    initialScenario?.materials.globalMaterialPercent ?? 15
  );
  const [steelForgingPercent, setSteelForgingPercent] = useState(
    initialScenario?.materials.steelForgingPercent ?? 15
  );
  const [aluminumAlloyPercent, setAluminumAlloyPercent] = useState(
    initialScenario?.materials.aluminumAlloyPercent ?? 10
  );
  const [exoticSuperalloyPercent, setExoticSuperalloyPercent] = useState(
    initialScenario?.materials.exoticSuperalloyPercent ?? 20
  );
  const [hardwareFastenersPercent, setHardwareFastenersPercent] = useState(
    initialScenario?.materials.hardwareFastenersPercent ?? 0
  );
  const [scrapWasteRateMultiplier, setScrapWasteRateMultiplier] = useState(
    initialScenario?.materials.scrapWasteRateMultiplier ?? 1.0
  );

  // Labor
  const [globalLaborRatePercent, setGlobalLaborRatePercent] = useState(
    initialScenario?.labor.globalLaborRatePercent ?? 8
  );
  const [overtimeHourMultiplier, setOvertimeHourMultiplier] = useState(
    initialScenario?.labor.overtimeHourMultiplier ?? 1.5
  );
  const [skilledSpecialistPercent, setSkilledSpecialistPercent] = useState(
    initialScenario?.labor.skilledSpecialistPercent ?? 10
  );
  const [setupLaborEfficiencyPercent, setSetupLaborEfficiencyPercent] = useState(
    initialScenario?.labor.setupLaborEfficiencyPercent ?? 0
  );

  // Routing
  const [cycleTimeEfficiencyPercent, setCycleTimeEfficiencyPercent] = useState(
    initialScenario?.routing.cycleTimeEfficiencyPercent ?? 0
  );
  const [machineHourRatePercent, setMachineHourRatePercent] = useState(
    initialScenario?.routing.machineHourRatePercent ?? 5
  );
  const [facilityPowerTariffPercent, setFacilityPowerTariffPercent] = useState(
    initialScenario?.routing.facilityPowerTariffPercent ?? 0
  );
  const [subcontractRatePercent, setSubcontractRatePercent] = useState(
    initialScenario?.routing.subcontractRatePercent ?? 0
  );
  const [insourceSubcontractOperations, setInsourceSubcontractOperations] = useState(
    initialScenario?.routing.insourceSubcontractOperations ?? false
  );

  // Commercials
  const [customerPricePassThroughPercent, setCustomerPricePassThroughPercent] = useState(
    initialScenario?.commercials.customerPricePassThroughPercent ?? 0
  );

  // Build draft scenario object for live simulation preview
  const draftScenario: CostSimulationScenario = useMemo(() => {
    return {
      id: isEditing ? initialScenario!.id : `scenario-custom-${Date.now()}`,
      name: name.trim() || 'Untitled Scenario',
      description,
      category,
      isPreset: false,
      createdAt: initialScenario?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'User',
      materials: {
        globalMaterialPercent,
        steelForgingPercent,
        aluminumAlloyPercent,
        exoticSuperalloyPercent,
        hardwareFastenersPercent,
        scrapWasteRateMultiplier
      },
      labor: {
        globalLaborRatePercent,
        overtimeHourMultiplier,
        skilledSpecialistPercent,
        setupLaborEfficiencyPercent
      },
      routing: {
        cycleTimeEfficiencyPercent,
        machineHourRatePercent,
        facilityPowerTariffPercent,
        subcontractRatePercent,
        insourceSubcontractOperations
      },
      commercials: {
        customerPricePassThroughPercent
      }
    };
  }, [
    isEditing,
    initialScenario,
    name,
    description,
    category,
    globalMaterialPercent,
    steelForgingPercent,
    aluminumAlloyPercent,
    exoticSuperalloyPercent,
    hardwareFastenersPercent,
    scrapWasteRateMultiplier,
    globalLaborRatePercent,
    overtimeHourMultiplier,
    skilledSpecialistPercent,
    setupLaborEfficiencyPercent,
    cycleTimeEfficiencyPercent,
    machineHourRatePercent,
    facilityPowerTariffPercent,
    subcontractRatePercent,
    insourceSubcontractOperations,
    customerPricePassThroughPercent
  ]);

  // Live simulation summary
  const livePreview = useMemo(() => {
    return costSimulationService.simulatePortfolio(draftScenario);
  }, [draftScenario]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Scenario Name Required', 'Please enter a descriptive name for your scenario.');
      return;
    }
    const saved = costSimulationService.saveScenario(draftScenario);
    addToast('success', 'Scenario Saved', `Scenario "${saved.name}" has been stored and is ready for comparison.`);
    onSaved(saved);
  };

  const handleResetToZero = () => {
    setGlobalMaterialPercent(0);
    setSteelForgingPercent(0);
    setAluminumAlloyPercent(0);
    setExoticSuperalloyPercent(0);
    setHardwareFastenersPercent(0);
    setScrapWasteRateMultiplier(1.0);
    setGlobalLaborRatePercent(0);
    setOvertimeHourMultiplier(1.5);
    setSkilledSpecialistPercent(0);
    setSetupLaborEfficiencyPercent(0);
    setCycleTimeEfficiencyPercent(0);
    setMachineHourRatePercent(0);
    setFacilityPowerTariffPercent(0);
    setSubcontractRatePercent(0);
    setInsourceSubcontractOperations(false);
    setCustomerPricePassThroughPercent(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isEditing ? 'Edit Simulation Scenario' : 'What-If Scenario Builder'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase font-mono font-bold">
                  MULTI-VARIABLE LEVERS
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate raw material inflation, wage revisions, and cycle time reductions on product margins.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Impact Preview Bar (Sticky under header) */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Simulated Margin</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-sm font-bold ${
                livePreview.summary.blendedMarginSimulatedPercent >= 15 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {livePreview.summary.blendedMarginSimulatedPercent}%
              </span>
              <span className="text-[10px] text-slate-500">
                (Base: {livePreview.summary.blendedMarginBaselinePercent}%)
              </span>
            </div>
            <span className={`text-[10px] block ${
              livePreview.summary.marginDeltaPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {livePreview.summary.marginDeltaPoints >= 0 ? `+${livePreview.summary.marginDeltaPoints}% pts` : `${livePreview.summary.marginDeltaPoints}% pts`}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Portfolio Profit Impact</span>
            <div className={`text-sm font-bold ${
              livePreview.summary.netProfitDeltaAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {livePreview.summary.netProfitDeltaAmount >= 0 ? '+' : ''}₹{livePreview.summary.netProfitDeltaAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Cost: {livePreview.summary.netCostDeltaAmount >= 0 ? '+' : ''}₹{livePreview.summary.netCostDeltaAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Loss-Making Jobs</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${
                livePreview.summary.jobsLossMakingCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {livePreview.summary.jobsLossMakingCount} of {livePreview.summary.totalJobsCount} Jobs
              </span>
            </div>
            {livePreview.summary.jobsFlippedToLossCount > 0 && (
              <span className="text-[10px] text-rose-400 block animate-pulse">
                ⚠ {livePreview.summary.jobsFlippedToLossCount} flipped to loss!
              </span>
            )}
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pass-Through Relief</span>
            <div className="text-sm font-bold text-sky-400">
              ₹{livePreview.summary.revenuePassThroughImpact.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block">
              @{customerPricePassThroughPercent}% Pass-Through
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/90 flex space-x-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('material')}
            className={`py-2.5 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'material'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={14} />
            <span>Material Prices &amp; Scrap</span>
            {globalMaterialPercent !== 0 && (
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded text-[10px] font-mono">
                {globalMaterialPercent > 0 ? `+${globalMaterialPercent}%` : `${globalMaterialPercent}%`}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('labor')}
            className={`py-2.5 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'labor'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock size={14} />
            <span>Labor Rates &amp; Overtime</span>
            {globalLaborRatePercent !== 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-mono">
                {globalLaborRatePercent > 0 ? `+${globalLaborRatePercent}%` : `${globalLaborRatePercent}%`}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`py-2.5 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'routing'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory size={14} />
            <span>Routing &amp; Cycle Times</span>
            {cycleTimeEfficiencyPercent !== 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">
                {cycleTimeEfficiencyPercent}% Cycle
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('commercials')}
            className={`py-2.5 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'commercials'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={14} />
            <span>Customer Pass-Through &amp; Policy</span>
            {customerPricePassThroughPercent > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded text-[10px] font-mono">
                {customerPricePassThroughPercent}% Pass
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          
          {/* Metadata Name & Description Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Scenario Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Steel Surcharge Spike (+20%)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="inflation">Inflation &amp; Price Shock</option>
                <option value="wage_revision">Wage &amp; Labor Settlement</option>
                <option value="efficiency">Lean Efficiency &amp; Tooling</option>
                <option value="stress_test">Stagflation Stress Test</option>
                <option value="custom">Custom Strategic</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Business Objective / Assumptions</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. Evaluate profit sustainability if mill steel costs rise by 20% in Q3."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* TAB 1: MATERIAL LEVERS */}
          {activeTab === 'material' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Global &amp; Alloy-Specific Material Price Levers
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    Impact: {livePreview.summary.materialCostImpact >= 0 ? '+' : ''}₹{livePreview.summary.materialCostImpact.toLocaleString()}
                  </span>
                </div>

                {/* Global Material Price Slider */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Global Material Price Change (% across all grades)</span>
                    <span className="font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                      {globalMaterialPercent > 0 ? `+${globalMaterialPercent}%` : `${globalMaterialPercent}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="60"
                    step="1"
                    value={globalMaterialPercent}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setGlobalMaterialPercent(v);
                      setSteelForgingPercent(v);
                      setAluminumAlloyPercent(v);
                      setExoticSuperalloyPercent(v);
                    }}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-25% Deflation</span>
                    <span>0% (Baseline)</span>
                    <span>+25% Surge</span>
                    <span>+60% Hyper-inflation</span>
                  </div>
                </div>

                {/* Specific Alloy Modifiers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Steel Billets &amp; Forgings (EN353 / 20MnCr5)</span>
                      <span className="font-mono text-white font-bold">{steelForgingPercent > 0 ? `+${steelForgingPercent}%` : `${steelForgingPercent}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="60"
                      value={steelForgingPercent}
                      onChange={(e) => setSteelForgingPercent(Number(e.target.value))}
                      className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Aluminum Alloys (Al6061-T6 / Al7075)</span>
                      <span className="font-mono text-white font-bold">{aluminumAlloyPercent > 0 ? `+${aluminumAlloyPercent}%` : `${aluminumAlloyPercent}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="60"
                      value={aluminumAlloyPercent}
                      onChange={(e) => setAluminumAlloyPercent(Number(e.target.value))}
                      className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Superalloys (Inconel 718 / Titanium)</span>
                      <span className="font-mono text-white font-bold">{exoticSuperalloyPercent > 0 ? `+${exoticSuperalloyPercent}%` : `${exoticSuperalloyPercent}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="80"
                      value={exoticSuperalloyPercent}
                      onChange={(e) => setExoticSuperalloyPercent(Number(e.target.value))}
                      className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Scrap &amp; Bar-End Waste Multiplier</span>
                      <span className="font-mono text-white font-bold">{scrapWasteRateMultiplier}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.05"
                      value={scrapWasteRateMultiplier}
                      onChange={(e) => setScrapWasteRateMultiplier(Number(e.target.value))}
                      className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LABOR LEVERS */}
          {activeTab === 'labor' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Direct Labor Wages &amp; Overtime Settlements
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Impact: {livePreview.summary.laborCostImpact >= 0 ? '+' : ''}₹{livePreview.summary.laborCostImpact.toLocaleString()}
                  </span>
                </div>

                {/* Global Labor Rate Slider */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Shop Floor Direct Labor Hourly Wage Hike (%)</span>
                    <span className="font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      {globalLaborRatePercent > 0 ? `+${globalLaborRatePercent}%` : `${globalLaborRatePercent}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="40"
                    step="1"
                    value={globalLaborRatePercent}
                    onChange={(e) => setGlobalLaborRatePercent(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-10%</span>
                    <span>0% (Current Wages)</span>
                    <span>+15% Annual Settlement</span>
                    <span>+40%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Overtime Premium Rate Multiplier</span>
                      <span className="font-mono text-white font-bold">{overtimeHourMultiplier}x base wage</span>
                    </div>
                    <select
                      value={overtimeHourMultiplier}
                      onChange={(e) => setOvertimeHourMultiplier(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="1.25">1.25x (Standard Staggered Shift)</option>
                      <option value="1.5">1.50x (Standard Industrial Overtime)</option>
                      <option value="1.8">1.80x (Weekend / Hot Jobs)</option>
                      <option value="2.0">2.00x (Double-Time Holiday / Union Rule)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Setup Time Reduction (SMED Lean Efficiency)</span>
                      <span className="font-mono text-white font-bold">{setupLaborEfficiencyPercent}% setup time</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="30"
                      value={setupLaborEfficiencyPercent}
                      onChange={(e) => setSetupLaborEfficiencyPercent(Number(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>-40% (Lean SMED)</span>
                      <span>0% (Current)</span>
                      <span>+30% Delay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROUTING & CYCLE TIMES */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory size={16} className="text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Routing Efficiency, Spindle Speeds &amp; MHR Rates
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Impact: {livePreview.summary.machineCostImpact >= 0 ? '+' : ''}₹{livePreview.summary.machineCostImpact.toLocaleString()}
                  </span>
                </div>

                {/* Cycle Time Reduction Slider */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Spindle Cycle Time Optimization (% change per part via tooling/CAM)
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                      cycleTimeEfficiencyPercent < 0 
                        ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' 
                        : cycleTimeEfficiencyPercent > 0 
                        ? 'text-rose-300 bg-rose-500/20 border-rose-500/30' 
                        : 'text-slate-300 bg-slate-800 border-slate-700'
                    }`}>
                      {cycleTimeEfficiencyPercent > 0 ? `+${cycleTimeEfficiencyPercent}% (Slower)` : `${cycleTimeEfficiencyPercent}% (Faster)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={cycleTimeEfficiencyPercent}
                    onChange={(e) => setCycleTimeEfficiencyPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-400">-40% High-Feed Tooling</span>
                    <span>0% (Current Cycle Time)</span>
                    <span className="text-rose-400">+40% Bottleneck Lag</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Machine Hourly Rate (MHR) Adjustment</span>
                      <span className="font-mono text-white font-bold">{machineHourRatePercent > 0 ? `+${machineHourRatePercent}%` : `${machineHourRatePercent}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="35"
                      value={machineHourRatePercent}
                      onChange={(e) => setMachineHourRatePercent(Number(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Facility Power Tariff (Grid Electricity Spike)</span>
                      <span className="font-mono text-white font-bold">{facilityPowerTariffPercent > 0 ? `+${facilityPowerTariffPercent}%` : `${facilityPowerTariffPercent}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={facilityPowerTariffPercent}
                      onChange={(e) => setFacilityPowerTariffPercent(Number(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMMERCIAL PASS-THROUGH */}
          {activeTab === 'commercials' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-purple-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Customer Price Pass-Through &amp; Contract Mitigation
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    Recovered Revenue: +₹{livePreview.summary.revenuePassThroughImpact.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        Customer Cost Pass-Through Percentage
                      </span>
                      <p className="text-[11px] text-slate-400">
                        What percentage of raw material and labor cost increases can be passed through to customers in quoted prices?
                      </p>
                    </div>
                    <span className="font-mono font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/40 text-sm">
                      {customerPricePassThroughPercent}% Pass-Through
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={customerPricePassThroughPercent}
                    onChange={(e) => setCustomerPricePassThroughPercent(Number(e.target.value))}
                    className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="grid grid-cols-3 text-[11px] text-slate-400 font-mono text-center pt-1">
                    <div className="text-left">
                      <strong className="text-white block">0% (Zero Pass)</strong>
                      <span>Company absorbs 100% of cost spikes</span>
                    </div>
                    <div>
                      <strong className="text-white block">50% (Shared Burden)</strong>
                      <span>Split increases 50/50 with OEM customer</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-white block">100% (Full Cost-Plus)</strong>
                      <span>Customer pays 100% of material &amp; wage hike</span>
                    </div>
                  </div>
                </div>

                {customerPricePassThroughPercent < 50 && livePreview.summary.netCostDeltaAmount > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong>Margin Erosion Warning:</strong> Passing less than 50% of inflation will erode portfolio margin by <strong>{Math.abs(livePreview.summary.marginDeltaPoints)} percentage points</strong>, turning {livePreview.summary.jobsFlippedToLossCount} products negative.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToZero}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RotateCcw size={13} />
            <span>Reset Levers to Baseline</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition"
            >
              <Save size={14} />
              <span>{isEditing ? 'Save Scenario Changes' : 'Save & Add to Comparison'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
