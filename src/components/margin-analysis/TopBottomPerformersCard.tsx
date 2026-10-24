// src/components/margin-analysis/TopBottomPerformersCard.tsx

import React, { useState } from 'react';
import {
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Package,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import { TopBottomPerformers } from '../../types/marginAnalysis';

interface TopBottomPerformersCardProps {
  performers: TopBottomPerformers;
  onSelectOrder?: (workOrderId: string) => void;
}

export const TopBottomPerformersCard: React.FC<TopBottomPerformersCardProps> = ({
  performers,
  onSelectOrder
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'orders'>('products');

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header with View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Top & Bottom Performers — Profit Generators vs Margin Diluters
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Pinpoint which products, accounts, and job orders are driving factory profitability versus eroding commercial margins.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products ({performers.topProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Customers ({performers.topCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Work Orders ({performers.topOrders.length})
          </button>
        </div>
      </div>

      {/* Two Column Layout: Top Performers (Green) vs Bottom Diluters (Red) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top Margin Performers */}
        <div className="bg-slate-950/80 rounded-xl border border-emerald-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-emerald-400">
                Top Margin Champions (Highest Realized Margin %)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-500 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              High Margin
            </span>
          </div>

          <div className="space-y-3">
            {activeTab === 'products' &&
              performers.topProducts.map((p, idx) => (
                <div
                  key={p.partCode}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-emerald-700/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs">{p.partName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{p.partCode}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>Top buyer: {p.topCustomer}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {p.grossMarginPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Profit: {formatInr(p.grossProfit)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Units: <strong className="text-slate-200">{p.unitsCount.toLocaleString()}</strong> | Quoted: {p.quotedMarginPct}%
                    </span>
                    <span className="text-emerald-400 font-medium">
                      +{(p.grossMarginPct - p.quotedMarginPct).toFixed(1)}% vs Quote
                    </span>
                  </div>
                </div>
              ))}

            {activeTab === 'customers' &&
              performers.topCustomers.map((c, idx) => (
                <div
                  key={c.customerId}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-emerald-700/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs">{c.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 font-medium text-[10px]">
                          {c.tier}
                        </span>
                        <span>•</span>
                        <span>{c.orderCount} Jobs</span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{c.topProduct}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {c.grossMarginPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Total Rev: {formatInr(c.totalRevenue)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Share of Plant Profit: <strong className="text-emerald-400">{c.marginContributionPct}%</strong>
                    </span>
                    <span className="text-slate-300 font-mono">
                      Gross Profit: {formatInr(c.grossProfit)}
                    </span>
                  </div>
                </div>
              ))}

            {activeTab === 'orders' &&
              performers.topOrders.map((o, idx) => (
                <div
                  key={o.workOrderId}
                  onClick={() => onSelectOrder?.(o.workOrderId)}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-emerald-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs group-hover:text-emerald-300">
                          {o.workOrderNumber} — {o.customerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{o.partCode}</span>
                        <span>•</span>
                        <span>Qty: {o.quantity}</span>
                        <span>•</span>
                        <span>Due: {o.dueDate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        {o.actualGrossMarginPercent}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Profit: {formatInr(o.grossProfit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Bottom Performers / Margin Diluters */}
        <div className="bg-slate-950/80 rounded-xl border border-rose-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-rose-400">
                Margin Diluters & Profit Eroders (Lowest Margin / Cost Overrun)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
              Action Required
            </span>
          </div>

          <div className="space-y-3">
            {activeTab === 'products' &&
              performers.bottomProducts.map((p, idx) => (
                <div
                  key={p.partCode}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-rose-700/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs">{p.partName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{p.partCode}</span>
                        <span>•</span>
                        <span>Cost Driver: <strong className="text-amber-400 capitalize">{p.primaryCostDriver}</strong></span>
                        <span>•</span>
                        <span className="text-rose-400 font-mono">COPQ: {formatInr(p.copqCost)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {p.grossMarginPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Dilution: <span className="text-rose-400">{p.marginVariancePct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation pill */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300/90 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      {p.marginVariancePct < -5
                        ? 'Excess setup & tool chatter — trigger CNC feed/speed audit'
                        : p.copqCost > 20000
                        ? 'High scrap rate — inspect material heat & hardness'
                        : 'Review contract price indexation with customer'}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Quoted: {p.quotedMarginPct}%
                    </span>
                  </div>
                </div>
              ))}

            {activeTab === 'customers' &&
              performers.bottomCustomers.map((c, idx) => (
                <div
                  key={c.customerId}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-rose-700/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs">{c.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-800 rounded text-slate-300 font-medium text-[10px]">
                          {c.tier}
                        </span>
                        <span>•</span>
                        <span>{c.orderCount} Orders</span>
                        <span>•</span>
                        <span>Revenue: {formatInr(c.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {c.grossMarginPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Profit: {formatInr(c.grossProfit)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300/90 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      {c.grossMarginPct < 15
                        ? 'Contract renewal due: Apply +8% raw material surcharge'
                        : 'Batch size consolidation needed to amortize setup costs'}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Quoted: {c.quotedMarginPct}%
                    </span>
                  </div>
                </div>
              ))}

            {activeTab === 'orders' &&
              performers.bottomOrders.map((o, idx) => (
                <div
                  key={o.workOrderId}
                  onClick={() => onSelectOrder?.(o.workOrderId)}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5 hover:border-rose-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-800/50">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs group-hover:text-rose-300">
                          {o.workOrderNumber} — {o.customerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{o.partCode}</span>
                        <span>•</span>
                        <span>Dilution: <strong className="text-rose-400">{o.marginDilutionPercent}%</strong></span>
                        <span>•</span>
                        <span className="text-rose-400 font-mono">Scrap: {formatInr(o.scrapCost)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {o.actualGrossMarginPercent}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Profit: {formatInr(o.grossProfit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
