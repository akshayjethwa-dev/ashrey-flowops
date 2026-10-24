// src/components/executive-dashboard/ExecutiveKpiGrid.tsx

import React from 'react';
import { ExecutiveKpis } from '../../types/executiveDashboard';
import { 
  DollarSign, 
  TrendingUp, 
  Truck, 
  ShoppingBag, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Props {
  kpis: ExecutiveKpis;
  onDrillDown: (type: 'revenue' | 'margin' | 'otd' | 'backlog' | 'wip') => void;
}

export const ExecutiveKpiGrid: React.FC<Props> = ({ kpis, onDrillDown }) => {
  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
      
      {/* 1. REVENUE KPI */}
      <div 
        onClick={() => onDrillDown('revenue')}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Revenue (MTD)
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(kpis.revenueActual)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold flex items-center">
              <ArrowUpRight className="h-3 w-3 inline mr-0.5" />
              +{kpis.revenueGrowthPct}% MoM
            </span>
            <span className="text-slate-400">Target: {formatCurrency(kpis.revenueTarget)}</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-emerald-700 font-bold">● Above monthly pace</span>
          <span className="flex items-center text-slate-400 group-hover:text-emerald-600 font-bold">
            Drill-down <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </span>
        </div>
      </div>

      {/* 2. GROSS MARGIN KPI */}
      <div 
        onClick={() => onDrillDown('margin')}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-indigo-400 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Gross Margin %
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpis.grossMarginPct}%
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({formatCurrency(kpis.grossProfitValue)})
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
              Target: {kpis.grossMarginTargetPct}%
            </span>
            <span className="text-slate-400">+{((kpis.grossMarginPct - kpis.grossMarginTargetPct)).toFixed(1)}% Spread</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-indigo-700 font-bold">● Profitable P&L Health</span>
          <span className="flex items-center text-slate-400 group-hover:text-indigo-600 font-bold">
            Drill-down <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </span>
        </div>
      </div>

      {/* 3. ON-TIME DELIVERY (OTD %) */}
      <div 
        onClick={() => onDrillDown('otd')}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-sky-400 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              On-Time Delivery (OTD)
            </span>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg group-hover:scale-110 transition">
              <Truck className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpis.otdPct}%
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              OTIF: {kpis.otifPct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-bold">
              {kpis.onTimeShipments} / {kpis.totalShipments} On-Time
            </span>
            <span className="text-rose-500 font-bold">({kpis.delayedShipments} Delayed)</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-sky-700 font-bold">● Benchmark ≥ 95%</span>
          <span className="flex items-center text-slate-400 group-hover:text-sky-600 font-bold">
            Drill-down <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </span>
        </div>
      </div>

      {/* 4. COMMITTED BACKLOG VALUE */}
      <div 
        onClick={() => onDrillDown('backlog')}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-amber-400 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Order Backlog
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(kpis.backlogTotalValue)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
              {kpis.backlogOrderCount} Active Orders
            </span>
            <span className="text-slate-400">Avg {kpis.backlogAvgDaysRemaining}d remaining</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-amber-700 font-bold">● Production Committed</span>
          <span className="flex items-center text-slate-400 group-hover:text-amber-600 font-bold">
            Drill-down <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </span>
        </div>
      </div>

      {/* 5. SHOPFLOOR WIP VALUE */}
      <div 
        onClick={() => onDrillDown('wip')}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-purple-400 hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              WIP Capital Value
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition">
              <Layers className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(kpis.wipTotalValue)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className="text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded font-bold">
              {kpis.wipActiveOrdersCount} WOs on Floor
            </span>
            <span className="text-slate-400">Lead time: {kpis.wipAverageCycleDays}d</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-purple-700 font-bold">● Active Working Capital</span>
          <span className="flex items-center text-slate-400 group-hover:text-purple-600 font-bold">
            Drill-down <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </span>
        </div>
      </div>

    </div>
  );
};
