// src/components/landed-cost/LandedCostComponentBreakdownCard.tsx

import React from 'react';
import {
  PieChart,
  Ship,
  TrendingUp,
  AlertTriangle,
  Scale,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { LandedCostComponentType } from '../../types/landedCost';
import { COMPONENT_LABELS } from '../../services/landedCostService';

interface LandedCostComponentBreakdownCardProps {
  byComponent: Record<LandedCostComponentType, number>;
  totalAbsorbed: number;
}

export const LandedCostComponentBreakdownCard: React.FC<LandedCostComponentBreakdownCardProps> = ({
  byComponent,
  totalAbsorbed
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const componentColors: Record<LandedCostComponentType, { bar: string; text: string; bg: string }> = {
    ocean_freight: { bar: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-950/40' },
    air_freight: { bar: 'bg-sky-500', text: 'text-sky-400', bg: 'bg-sky-950/40' },
    road_freight: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-950/40' },
    customs_duty: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-950/40' },
    port_handling: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-950/40' },
    cargo_insurance: { bar: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-950/40' },
    demurrage_storage: { bar: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-950/40' },
    unloading_cartage: { bar: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-950/40' },
    other: { bar: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-950/40' }
  };

  const items = (Object.keys(byComponent) as LandedCostComponentType[])
    .map((type) => {
      const amount = byComponent[type] || 0;
      const share = totalAbsorbed > 0 ? (amount / totalAbsorbed) * 100 : 0;
      return {
        type,
        amount,
        share,
        ...COMPONENT_LABELS[type],
        colors: componentColors[type] || componentColors.other
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Landed Cost Component Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of capitalized freight, tariffs, customs & handling charges
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ind AS 2 / IAS 2 Capitalized</span>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        {items.map((item) => (
          <div
            key={item.type}
            className={`h-full ${item.colors.bar} transition-all duration-300`}
            style={{ width: `${item.share}%` }}
            title={`${item.label}: ${formatCurrency(item.amount)} (${item.share.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {items.map((item) => (
          <div
            key={item.type}
            className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.colors.bar}`} />
                <span className="text-xs font-medium text-slate-200">{item.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
            </div>
            <div className="text-right shrink-0 font-mono">
              <div className="text-xs font-bold text-white">{formatCurrency(item.amount)}</div>
              <div className="text-[11px] text-slate-400">{item.share.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Regulatory Accounting Rule Callout */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-300">Accounting Standard Treatment (Ind AS 2 / IAS 2 / US GAAP):</span>
          <p>
            All non-creditable direct costs incurred to bring inventories to their present location and condition—including ocean/air freight, import duties, customs clearance, and transit insurance—are capitalized directly into raw material lot unit costs.
          </p>
        </div>
      </div>
    </div>
  );
};
