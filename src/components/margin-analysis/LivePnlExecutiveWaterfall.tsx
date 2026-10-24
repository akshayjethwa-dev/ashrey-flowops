// src/components/margin-analysis/LivePnlExecutiveWaterfall.tsx

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldCheck,
  Package,
  Activity
} from 'lucide-react';
import { LivePnLSummary } from '../../types/marginAnalysis';

interface LivePnlExecutiveWaterfallProps {
  pnl: LivePnLSummary;
}

export const LivePnlExecutiveWaterfall: React.FC<LivePnlExecutiveWaterfallProps> = ({ pnl }) => {
  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getPctOfRev = (amount: number) => {
    if (pnl.totalRevenue <= 0) return '0.0%';
    return `${((amount / pnl.totalRevenue) * 100).toFixed(1)}%`;
  };

  // Waterfall Items
  const waterfallSteps = [
    {
      label: 'Gross Revenue',
      amount: pnl.totalRevenue,
      pct: '100%',
      type: 'revenue',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      description: 'Total contracted commercial invoice value across jobs'
    },
    {
      label: 'Direct Materials',
      amount: -pnl.totalMaterialCost,
      pct: getPctOfRev(pnl.totalMaterialCost),
      type: 'cost',
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      description: 'Raw billet, plate, bar stock, castings, and hardware consumed'
    },
    {
      label: 'Direct Labor',
      amount: -pnl.totalLaborCost,
      pct: getPctOfRev(pnl.totalLaborCost),
      type: 'cost',
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      description: 'Operator wages, overtime, and setup labor tracked on shop floor'
    },
    {
      label: 'Machine & Power',
      amount: -pnl.totalMachineCost,
      pct: getPctOfRev(pnl.totalMachineCost),
      type: 'cost',
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      description: 'CNC machine hourly absorption, power tariffs, and tooling wear'
    },
    {
      label: 'Subcontracting',
      amount: -pnl.totalSubcontractCost,
      pct: getPctOfRev(pnl.totalSubcontractCost),
      type: 'cost',
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      description: 'Outsourced heat treatment, plating, and NABL certified testing'
    },
    {
      label: 'Factory Overhead',
      amount: -pnl.totalFactoryOverheadCost,
      pct: getPctOfRev(pnl.totalFactoryOverheadCost),
      type: 'cost',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      description: 'Tool crib, maintenance, coolants, and facility indirects'
    },
    {
      label: 'SG&A Indirect',
      amount: -pnl.totalSgaCost,
      pct: getPctOfRev(pnl.totalSgaCost),
      type: 'cost',
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      description: 'Selling, administrative, and general plant supervision'
    },
    {
      label: 'Mfg Gross Profit',
      amount: pnl.grossProfitBeforeCopq,
      pct: `${pnl.manufacturingGrossMarginPct}%`,
      type: 'subtotal',
      color: 'bg-teal-500',
      textColor: 'text-teal-400',
      description: 'Factory margin before factoring in scrap rejection and rework'
    },
    {
      label: 'COPQ Losses (Scrap/Rework)',
      amount: -pnl.totalCopqLosses,
      pct: getPctOfRev(pnl.totalCopqLosses),
      type: 'copq',
      color: 'bg-red-600',
      textColor: 'text-red-400',
      description: 'Material scrapped + recovery machining & secondary labor debits'
    },
    {
      label: 'Net Realized Profit',
      amount: pnl.netRealizedProfit,
      pct: `${pnl.netRealizedMarginPct}%`,
      type: 'final',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-300',
      description: 'True realized bottom-line profit delivered into company accounts'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Main Executive Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Commercial Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatInr(pnl.totalRevenue)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>{pnl.totalOrdersCount} active/completed jobs</span>
            <span className="text-emerald-400 font-medium">{pnl.totalUnitsProduced.toLocaleString()} units</span>
          </div>
        </div>

        {/* Total COGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Cost of Goods Sold (COGS)</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatInr(pnl.totalCogs)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Absorption: Materials, Labor, Mach & Ovh</span>
            <span className="text-rose-400 font-medium">{getPctOfRev(pnl.totalCogs)}</span>
          </div>
        </div>

        {/* Realized Gross Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Net Realized Gross Profit</span>
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {formatInr(pnl.netRealizedProfit)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Pre-COPQ Profit:</span>
            <span className="text-slate-300 font-medium">{formatInr(pnl.grossProfitBeforeCopq)}</span>
          </div>
        </div>

        {/* Gross Margin % & Benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Gross Margin % (Live P&L)</span>
            <span className={`p-1.5 rounded-lg ${pnl.netRealizedMarginPct >= pnl.targetMarginPct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {pnl.netRealizedMarginPct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              target: {pnl.targetMarginPct}%
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className={`font-semibold flex items-center gap-1 ${pnl.marginSpreadPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {pnl.marginSpreadPct >= 0 ? '+' : ''}{pnl.marginSpreadPct}% vs Benchmark
            </span>
            <span className="text-rose-400 font-medium text-[11px]">
              -{getPctOfRev(pnl.totalCopqLosses)} COPQ Drag
            </span>
          </div>
        </div>
      </div>

      {/* Visual Waterfall Progression Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live P&L Cost Absorption Waterfall
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualizes how every rupee of gross revenue cascades through manufacturing cost drivers and quality deductions to arrive at net profit.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md font-mono border border-slate-700">
              Manufacturing Margin: <strong className="text-teal-300">{pnl.manufacturingGrossMarginPct}%</strong>
            </span>
            <span className="px-2.5 py-1 bg-rose-950/60 text-rose-300 rounded-md font-mono border border-rose-800/60">
              Scrap & Rework Drag: <strong className="text-rose-400">-{getPctOfRev(pnl.totalCopqLosses)}</strong>
            </span>
          </div>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 mb-6">
          <div className="text-xs text-slate-400 mb-2 font-medium flex justify-between">
            <span>Revenue Absorption Distribution</span>
            <span>100% Total Revenue ({formatInr(pnl.totalRevenue)})</span>
          </div>
          <div className="h-7 w-full rounded-md overflow-hidden flex bg-slate-800">
            {/* Material */}
            <div
              style={{ width: `${(pnl.totalMaterialCost / pnl.totalRevenue) * 100}%` }}
              className="bg-rose-500 h-full relative group transition-all"
              title={`Material: ${formatInr(pnl.totalMaterialCost)} (${getPctOfRev(pnl.totalMaterialCost)})`}
            />
            {/* Labor */}
            <div
              style={{ width: `${(pnl.totalLaborCost / pnl.totalRevenue) * 100}%` }}
              className="bg-amber-500 h-full relative group transition-all"
              title={`Labor: ${formatInr(pnl.totalLaborCost)} (${getPctOfRev(pnl.totalLaborCost)})`}
            />
            {/* Machine */}
            <div
              style={{ width: `${(pnl.totalMachineCost / pnl.totalRevenue) * 100}%` }}
              className="bg-blue-500 h-full relative group transition-all"
              title={`Machine: ${formatInr(pnl.totalMachineCost)} (${getPctOfRev(pnl.totalMachineCost)})`}
            />
            {/* Subcontract */}
            <div
              style={{ width: `${(pnl.totalSubcontractCost / pnl.totalRevenue) * 100}%` }}
              className="bg-cyan-500 h-full relative group transition-all"
              title={`Subcontract: ${formatInr(pnl.totalSubcontractCost)} (${getPctOfRev(pnl.totalSubcontractCost)})`}
            />
            {/* Overhead */}
            <div
              style={{ width: `${((pnl.totalFactoryOverheadCost + pnl.totalSgaCost) / pnl.totalRevenue) * 100}%` }}
              className="bg-purple-500 h-full relative group transition-all"
              title={`Overheads: ${formatInr(pnl.totalFactoryOverheadCost + pnl.totalSgaCost)} (${getPctOfRev(pnl.totalFactoryOverheadCost + pnl.totalSgaCost)})`}
            />
            {/* COPQ */}
            <div
              style={{ width: `${(pnl.totalCopqLosses / pnl.totalRevenue) * 100}%` }}
              className="bg-red-600 h-full relative group transition-all"
              title={`COPQ Scrap & Rework: ${formatInr(pnl.totalCopqLosses)} (${getPctOfRev(pnl.totalCopqLosses)})`}
            />
            {/* Net Profit */}
            <div
              style={{ width: `${Math.max(0, (pnl.netRealizedProfit / pnl.totalRevenue) * 100)}%` }}
              className="bg-emerald-500 h-full relative group transition-all"
              title={`Net Realized Profit: ${formatInr(pnl.netRealizedProfit)} (${getPctOfRev(pnl.netRealizedProfit)})`}
            />
          </div>

          {/* Bar Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
              <span className="truncate">Material ({getPctOfRev(pnl.totalMaterialCost)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
              <span className="truncate">Labor ({getPctOfRev(pnl.totalLaborCost)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
              <span className="truncate">Machine ({getPctOfRev(pnl.totalMachineCost)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500 shrink-0" />
              <span className="truncate">Subcontract ({getPctOfRev(pnl.totalSubcontractCost)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500 shrink-0" />
              <span className="truncate">Overheads ({getPctOfRev(pnl.totalFactoryOverheadCost + pnl.totalSgaCost)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-600 shrink-0" />
              <span className="truncate">COPQ Drag ({getPctOfRev(pnl.totalCopqLosses)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
              <span className="truncate font-semibold text-emerald-400">Net Profit ({pnl.netRealizedMarginPct}%)</span>
            </div>
          </div>
        </div>

        {/* Detailed Financial Line Item Breakdown Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Financial P&L Line Item</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">% of Revenue</th>
                <th className="py-3 px-4">Operational Source / Accounting Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {waterfallSteps.map((step, idx) => {
                const isSubtotal = step.type === 'subtotal';
                const isFinal = step.type === 'final';
                const isRevenue = step.type === 'revenue';

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isFinal
                        ? 'bg-emerald-950/20 font-bold'
                        : isSubtotal
                        ? 'bg-teal-950/20 font-semibold'
                        : isRevenue
                        ? 'bg-slate-800/40 font-bold'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${step.color}`} />
                      <span className={step.textColor}>{step.label}</span>
                    </td>
                    <td className={`py-3 px-4 text-right ${step.textColor}`}>
                      {step.amount > 0 ? formatInr(step.amount) : `(${formatInr(Math.abs(step.amount))})`}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {step.pct}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {step.description}
                    </td>
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
