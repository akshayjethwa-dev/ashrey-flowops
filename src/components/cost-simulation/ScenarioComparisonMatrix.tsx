// src/components/cost-simulation/ScenarioComparisonMatrix.tsx

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Clock,
  Factory,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { MultiScenarioComparisonData } from '../../types/costSimulation';

interface Props {
  data: MultiScenarioComparisonData;
  onSelectProduct?: (workOrderId: string) => void;
}

export const ScenarioComparisonMatrix: React.FC<Props> = ({
  data,
  onSelectProduct
}) => {
  const { baselineSummary, scenarioSummaries, productComparisons } = data;

  const formatCurrency = (val: number) => {
    return `₹${Math.abs(val).toLocaleString()}`;
  };

  const getMarginBadge = (margin: number, isLoss: boolean) => {
    if (isLoss || margin < 0) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (margin >= 25) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (margin >= 15) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Executive Scenario Scorecards (Side-by-Side) ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Card */}
        <div className="p-4 bg-slate-900 border-2 border-indigo-500/40 rounded-2xl relative space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              REFERENCE BASELINE
            </span>
            <span className="text-xs text-slate-400 font-mono">{baselineSummary.totalJobsCount} Jobs</span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white truncate" title={baselineSummary.scenarioName}>
              Current Shop Floor Actuals
            </h4>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {baselineSummary.blendedMarginBaselinePercent}% Margin
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Profit: ₹{baselineSummary.grossProfitBaseline.toLocaleString()}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Total Revenue:</span>
              <strong className="text-white">₹{baselineSummary.totalRevenueBaseline.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Cost Incurred:</span>
              <strong className="text-slate-300">₹{baselineSummary.totalCostBaseline.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Profitable Jobs:</span>
              <strong>{baselineSummary.jobsProfitableCount}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Scenario Cards */}
        {scenarioSummaries.map((sc) => {
          const isProfitableGain = sc.netProfitDeltaAmount >= 0;
          return (
            <div
              key={sc.scenarioId}
              className={`p-4 bg-slate-900/90 border rounded-2xl relative space-y-3 transition ${
                sc.blendedMarginSimulatedPercent < 0 
                  ? 'border-rose-500/60 bg-rose-950/10' 
                  : sc.marginDeltaPoints < 0 
                  ? 'border-amber-500/40' 
                  : 'border-emerald-500/40 bg-emerald-950/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 truncate max-w-[170px]">
                  {sc.scenarioName}
                </span>
                <span className={`text-[11px] font-mono font-bold ${
                  sc.marginDeltaPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {sc.marginDeltaPoints >= 0 ? `+${sc.marginDeltaPoints}% pts` : `${sc.marginDeltaPoints}% pts`}
                </span>
              </div>

              <div>
                <div className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-2">
                  <span className={sc.blendedMarginSimulatedPercent >= 15 ? 'text-emerald-400' : sc.blendedMarginSimulatedPercent >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                    {sc.blendedMarginSimulatedPercent}%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    (Δ {sc.marginDeltaPoints > 0 ? '+' : ''}{sc.marginDeltaPoints}%)
                  </span>
                </div>
                <div className={`text-xs font-mono font-semibold ${isProfitableGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Profit Impact: {sc.netProfitDeltaAmount >= 0 ? '+' : ''}₹{sc.netProfitDeltaAmount.toLocaleString()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Simulated Total Cost:</span>
                  <span className="text-white">₹{sc.totalCostSimulated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost Delta:</span>
                  <span className={sc.netCostDeltaAmount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {sc.netCostDeltaAmount > 0 ? '+' : ''}₹{sc.netCostDeltaAmount.toLocaleString()} ({sc.netCostDeltaPercent > 0 ? '+' : ''}{sc.netCostDeltaPercent}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loss-Making Jobs:</span>
                  <span className={sc.jobsLossMakingCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {sc.jobsLossMakingCount} {sc.jobsFlippedToLossCount > 0 ? `(${sc.jobsFlippedToLossCount} flipped)` : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. Product-by-Product Multi-Scenario Margin Grid ─────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Product-by-Product Margin Sensitivity &amp; Loss Detection Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates individual work order margin vulnerability across all compared scenarios.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
              &gt;25% High
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
              15-25% Healthy
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
              0-15% Eroded
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
              &lt;0% Loss Making
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 sticky left-0 bg-slate-950 z-10">Job / Part Name</th>
                <th className="py-3 px-4 text-center bg-indigo-950/30 border-x border-slate-800">
                  <div className="text-indigo-300 font-bold">Baseline Margin %</div>
                  <div className="text-[9px] text-slate-400 font-normal">Current Actuals</div>
                </th>

                {scenarioSummaries.map((sc) => (
                  <th key={sc.scenarioId} className="py-3 px-4 text-center border-r border-slate-800 min-w-[150px]">
                    <div className="font-bold text-white truncate max-w-[140px] mx-auto" title={sc.scenarioName}>
                      {sc.scenarioName}
                    </div>
                    <div className="text-[9px] text-slate-400 font-normal">Margin % (Δ points)</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 font-mono">
              {productComparisons.map((p) => {
                return (
                  <tr
                    key={p.workOrderId}
                    onClick={() => onSelectProduct && onSelectProduct(p.workOrderId)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    {/* Part & Job details */}
                    <td className="py-3 px-4 sticky left-0 bg-slate-900/90 z-10 border-r border-slate-800/80 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{p.workOrderNumber}</span>
                        <span className="text-slate-300 font-medium text-xs">{p.partName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="text-indigo-400">{p.partCode}</span>
                        <span className="mx-1.5">•</span>
                        <span>{p.customerName}</span>
                      </div>
                    </td>

                    {/* Baseline Margin */}
                    <td className="py-3 px-4 text-center bg-indigo-950/10 border-x border-slate-800">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
                        getMarginBadge(p.baselineMargin, p.baselineProfit < 0)
                      }`}>
                        {p.baselineMargin}%
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ₹{p.baselineProfit.toLocaleString()}
                      </div>
                    </td>

                    {/* Dynamic Scenario Columns */}
                    {scenarioSummaries.map((sc) => {
                      const res = p.scenarioResults[sc.scenarioId];
                      if (!res) {
                        return (
                          <td key={sc.scenarioId} className="py-3 px-4 text-center text-slate-600 border-r border-slate-800">
                            -
                          </td>
                        );
                      }

                      const flipped = p.baselineMargin >= 0 && res.simulatedMargin < 0;

                      return (
                        <td key={sc.scenarioId} className="py-3 px-4 text-center border-r border-slate-800">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                              getMarginBadge(res.simulatedMargin, res.isLossMaking)
                            }`}>
                              {res.simulatedMargin}%
                              <span className="text-[10px] font-normal">
                                ({res.marginDelta > 0 ? `+${res.marginDelta}` : res.marginDelta}%)
                              </span>
                            </span>

                            <div className="text-[10px] text-slate-400">
                              Profit: <strong className={res.simulatedProfit >= 0 ? 'text-slate-200' : 'text-rose-400'}>
                                {res.simulatedProfit >= 0 ? '+' : ''}₹{res.simulatedProfit.toLocaleString()}
                              </strong>
                            </div>

                            {flipped && (
                              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider animate-pulse mt-0.5">
                                ⚠ Turned Loss
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
