// src/components/stock-aging/ValuationMethodComparisonCard.tsx

import React from 'react';
import {
  Calculator,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { StockAgingSummary, ValuationMethod } from '../../types/stockAgingValuation';

interface ValuationMethodComparisonCardProps {
  summary: StockAgingSummary;
  valuationMethod: ValuationMethod;
  onMethodChange: (method: ValuationMethod) => void;
  onOpenSimulator: () => void;
}

export const ValuationMethodComparisonCard: React.FC<ValuationMethodComparisonCardProps> = ({
  summary,
  valuationMethod,
  onMethodChange,
  onOpenSimulator
}) => {
  const {
    totalValuationFifo,
    totalValuationWac,
    valuationVariance,
    valuationVariancePercent,
    workingCapitalLocked90Plus,
    workingCapitalLocked60Plus,
    monthlyCarryingCostTotal
  } = summary;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isFifo = valuationMethod === 'fifo';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              Inventory Valuation Engine
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Real-Time Dual Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare First-In, First-Out (FIFO) vs Weighted Average Cost (WAC) to optimize working capital reporting and tax compliance.
          </p>
        </div>

        {/* Method Switcher Button Group */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => onMethodChange('fifo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isFifo
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              FIFO Method
            </button>
            <button
              onClick={() => onMethodChange('weighted_average')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isFifo
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              Weighted Average (WAC)
            </button>
          </div>

          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-lg border border-emerald-500/30 font-medium transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Working Capital Simulator
          </button>
        </div>
      </div>

      {/* Main Grid: Comparison Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Card 1: Active Effective Valuation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Active Book Valuation</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
              {isFifo ? 'FIFO' : 'WAC'}
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">
            {formatCurrency(isFifo ? totalValuationFifo : totalValuationWac)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Balance sheet current asset value
          </div>
        </div>

        {/* Card 2: Alternate Method Valuation & Variance */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Alternate Valuation Model</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
              {isFifo ? 'WAC' : 'FIFO'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-200 tracking-tight font-mono">
            {formatCurrency(isFifo ? totalValuationWac : totalValuationFifo)}
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between">
            <span className="text-slate-400">Method Variance:</span>
            <span className={`font-mono font-bold ${valuationVariance >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {valuationVariance >= 0 ? '+' : ''}{formatCurrency(valuationVariance)} ({valuationVariancePercent}%)
            </span>
          </div>
        </div>

        {/* Card 3: Capital Trapped in Aged Stock */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Capital Trapped in 90+ Days</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold">
              Stagnant
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight font-mono">
            {formatCurrency(workingCapitalLocked90Plus)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>In 61+ Days:</span>
            <span className="font-mono text-slate-300 font-semibold">
              {formatCurrency(workingCapitalLocked60Plus)}
            </span>
          </div>
        </div>

        {/* Card 4: Monthly Carrying Cost */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Estimated Carrying Cost</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              1.8% / mo
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">
            {formatCurrency(monthlyCarryingCostTotal)}
            <span className="text-xs text-slate-400 font-normal ml-1">/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Storage, capital cost, and insurance
          </div>
        </div>
      </div>

      {/* Accounting Insight Bar */}
      <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-lg flex items-start sm:items-center gap-3">
        <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs text-slate-300 leading-relaxed flex-1">
          <strong className="text-white font-semibold">Finance Manager Note: </strong>
          {valuationVariance > 0 ? (
            <>
              FIFO valuation is higher by <strong>{formatCurrency(valuationVariance)}</strong> ({valuationVariancePercent}%) because recently received raw material heats reflect steel inflation over older layers. FIFO represents more accurate replacement valuation on current assets.
            </>
          ) : (
            <>
              Weighted Average Costing smooths out purchase price spikes across production batches, resulting in steady margin recognition across work orders.
            </>
          )}
        </div>
      </div>
    </div>
  );
};
