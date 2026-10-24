// src/components/landed-cost/LandedCostKpiCards.tsx

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Layers,
  Scale,
  Ship,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { LandedCostSummaryKpis } from '../../types/landedCost';

interface LandedCostKpiCardsProps {
  kpis: LandedCostSummaryKpis;
  onOpenNewVoucher: () => void;
  onQuickFilterStatus?: (status: 'all' | 'posted' | 'draft') => void;
}

export const LandedCostKpiCards: React.FC<LandedCostKpiCardsProps> = ({
  kpis,
  onOpenNewVoucher,
  onQuickFilterStatus
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Landed Charges Capitalized */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Landed Costs Absorbed
          </span>
          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
            Active in FIFO
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight">
          {formatCurrency(kpis.totalLandedCostsAbsorbed)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            +{kpis.averageMarkupPercent.toFixed(1)}% Avg Cost Markup
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {kpis.postedVouchersCount} Vouchers
          </span>
        </div>
        <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition" />
      </div>

      {/* KPI 2: True Landed Inventory Capitalized */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-indigo-400" />
            True Landed Valuation
          </span>
          <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full font-medium">
            GAAP / AS-2
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight">
          {formatCurrency(kpis.totalLandedInventoryValue)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="text-indigo-300">Base Cost + Logistics</span>
          <span className="text-slate-500 font-mono text-[11px]">Audit Compliant</span>
        </div>
        <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition" />
      </div>

      {/* KPI 3: Lots Capitalized */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Material Lots Impacted
          </span>
          <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-medium">
            Active Lots
          </span>
        </div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight">
          {kpis.affectedLotsCount} <span className="text-sm font-normal text-slate-400">Lots Adjusted</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-300">WAC & FIFO Updated</span>
          <span className="text-emerald-400 flex items-center gap-0.5 text-[11px]">
            100% Balanced
          </span>
        </div>
        <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition" />
      </div>

      {/* KPI 4: Allocation Vouchers & Quick Action */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              Voucher Pipeline
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuickFilterStatus && onQuickFilterStatus('posted')}
                className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded hover:bg-emerald-900 transition flex items-center gap-0.5"
                title="Filter posted"
              >
                <CheckCircle2 className="w-2.5 h-2.5" /> {kpis.postedVouchersCount}
              </button>
              <button
                onClick={() => onQuickFilterStatus && onQuickFilterStatus('draft')}
                className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded hover:bg-amber-900 transition flex items-center gap-0.5"
                title="Filter drafts"
              >
                <Clock className="w-2.5 h-2.5" /> {kpis.draftVouchersCount}
              </button>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-200">
            {kpis.draftVouchersCount > 0 ? (
              <span className="text-amber-400 font-semibold">{kpis.draftVouchersCount} Draft Voucher awaiting posting</span>
            ) : (
              <span className="text-slate-400">All landed cost vouchers posted</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Need new allocation?</span>
          <button
            onClick={onOpenNewVoucher}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            Create Voucher <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
