// src/components/stock-aging/WorkingCapitalSimulatorModal.tsx

import React, { useState } from 'react';
import {
  X,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { StockAgingSummary } from '../../types/stockAgingValuation';

interface WorkingCapitalSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StockAgingSummary;
  onSimulate: (pct90: number, pct60: number) => {
    targetLiquidationPercent90Plus: number;
    targetLiquidationPercent60Plus: number;
    estimatedWorkingCapitalFreed: number;
    estimatedCarryingCostSavedMonthly: number;
  };
}

export const WorkingCapitalSimulatorModal: React.FC<WorkingCapitalSimulatorModalProps> = ({
  isOpen,
  onClose,
  summary,
  onSimulate
}) => {
  const [pct90, setPct90] = useState<number>(50);
  const [pct60, setPct60] = useState<number>(30);

  if (!isOpen) return null;

  const simulation = onSimulate(pct90, pct60);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const annualSavings = simulation.estimatedCarryingCostSavedMonthly * 12;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Working Capital Optimization Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Model cash flow liberation by targeted liquidation of slow and aged inventory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Slider 1: 90+ Days Liquidation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-white">
                  Target Liquidation of 90+ Days Inventory
                </label>
                <p className="text-xs text-slate-400">
                  Total capital currently locked: {formatCurrency(summary.workingCapitalLocked90Plus)}
                </p>
              </div>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">
                {pct90}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct90}
              onChange={(e) => setPct90(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (Status Quo)</span>
              <span>50% (Recommended)</span>
              <span>100% (Full Clearance)</span>
            </div>
          </div>

          {/* Slider 2: 61-90 Days Liquidation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-white">
                  Target Liquidation of 61 - 90 Days Inventory
                </label>
                <p className="text-xs text-slate-400">
                  Total capital currently in watchlist:{' '}
                  {formatCurrency(summary.workingCapitalLocked60Plus - summary.workingCapitalLocked90Plus)}
                </p>
              </div>
              <span className="text-lg font-extrabold text-sky-400 font-mono">
                {pct60}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct60}
              onChange={(e) => setPct60(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (Status Quo)</span>
              <span>30% (Standard)</span>
              <span>100% (Aggressive)</span>
            </div>
          </div>

          {/* Simulated Impact Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                Working Capital Released
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {formatCurrency(simulation.estimatedWorkingCapitalFreed)}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Immediate liquidity added back to operating cash reserves for new POs.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <TrendingUp className="w-4 h-4" />
                Carrying Cost Saved
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(simulation.estimatedCarryingCostSavedMonthly)}
                <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Annual P&L savings of <strong>{formatCurrency(annualSavings)}/yr</strong> in holding costs.
              </p>
            </div>
          </div>

          {/* Action Steps */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recommended Procurement & Sales Strategy:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
              <li>Offer 10-15% discount on 90+ days slow-moving finished goods to key Tier-1 clients.</li>
              <li>Reallocate aged EN24 alloy round bars into upcoming Work Order forging jobs.</li>
              <li>Return surplus Grade 12.9 socket head bolts under vendor credit memo.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
          >
            Apply Target to Finance Plan
          </button>
        </div>
      </div>
    </div>
  );
};
