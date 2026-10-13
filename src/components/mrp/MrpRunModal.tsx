// src/components/mrp/MrpRunModal.tsx

import React, { useState } from 'react';
import {
  X,
  Play,
  Calendar,
  Building2,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import { MrpHorizon } from '../../types/mrp';
import { Plant } from '../../types';
import { PlantExtended } from '../../types/plant';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plants: (Plant | PlantExtended)[];
  initialPlantId?: string;
  initialHorizon?: MrpHorizon;
  onExecuteRun: (params: {
    plantId: string;
    horizonDays: MrpHorizon;
    safetyMultiplier: number;
  }) => Promise<any>;
}

export const MrpRunModal: React.FC<Props> = ({
  isOpen,
  onClose,
  plants,
  initialPlantId = 'all',
  initialHorizon = 30,
  onExecuteRun
}) => {
  const [horizonDays, setHorizonDays] = useState<MrpHorizon>(initialHorizon);
  const [plantId, setPlantId] = useState<string>(initialPlantId);
  const [safetyMultiplier, setSafetyMultiplier] = useState<number>(1.0);
  const [includeDraftWos, setIncludeDraftWos] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [resultSummary, setResultSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRunning(true);
      setResultSummary(null);
      const res = await onExecuteRun({
        plantId,
        horizonDays,
        safetyMultiplier
      });
      setResultSummary(res);
    } catch (err: any) {
      console.error('MRP run error', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Launch MRP Calculation Engine
              </h2>
              <p className="text-xs text-slate-400">
                Explode active production schedule demands against multi-location stock & lead times
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {resultSummary ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  MRP Run Completed Successfully!
                </h3>
                <p className="text-xs text-emerald-300 font-mono mt-1">
                  Run ID: {resultSummary.run?.runNumber || 'MRP-SUCCESS'} • Execution Time: {resultSummary.run?.runtimeMs}ms
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Analyzed</span>
                  <span className="text-base font-bold text-white font-mono">{resultSummary.run?.totalMaterialsAnalyzed} Items</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Recommended POs</span>
                  <span className="text-base font-bold text-sky-400 font-mono">{resultSummary.run?.recommendationsCount} Orders</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-mono block">Critical Risks</span>
                  <span className="text-base font-bold text-rose-400 font-mono">{resultSummary.run?.criticalRecommendationsCount} Items</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Review Purchase Recommendations
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Planning Horizon */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  Select Planning Horizon (Days Ahead) *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {([7, 14, 30, 60, 90] as MrpHorizon[]).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setHorizonDays(days)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center border ${
                        horizonDays === days
                          ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  {horizonDays === 7 && 'Short-term tactical explosion: catches immediate shopfloor shortages.'}
                  {horizonDays === 14 && 'Bi-weekly run: balances weekly steel deliveries and urgent batch jobs.'}
                  {horizonDays === 30 && 'Standard monthly MRP: captures full vendor lead times and minimum order quantities.'}
                  {horizonDays === 60 && 'Extended quarterly horizon: ideal for long-lead forgings, tool steels, and imports.'}
                  {horizonDays === 90 && 'Strategic 3-month forecast: master supply chain procurement.'}
                </p>
              </div>

              {/* Plant Scope */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  Target Plant / Facility Scope *
                </label>
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none font-medium"
                >
                  <option value="all">🌐 All Facilities (Enterprise Consolidated MRP)</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      🏭 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Safety Stock Multiplier */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Safety Stock Buffer Multiplier
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 0.9, label: '0.9x Lean', sub: 'Low buffer' },
                    { val: 1.0, label: '1.0x Normal', sub: 'Standard buffer' },
                    { val: 1.2, label: '1.2x Peak', sub: '+20% Safety' },
                    { val: 1.4, label: '1.4x Disruption', sub: '+40% High buffer' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSafetyMultiplier(item.val)}
                      className={`p-2 rounded-xl text-xs font-mono text-center border transition-all ${
                        safetyMultiplier === item.val
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option checkboxes */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeDraftWos}
                    onChange={(e) => setIncludeDraftWos(e.target.checked)}
                    className="rounded border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span>Include planned draft Work Orders in gross demand explosion</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={running}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                >
                  <Play className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                  {running ? 'Calculating MRP Netting...' : 'Execute MRP Calculation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
