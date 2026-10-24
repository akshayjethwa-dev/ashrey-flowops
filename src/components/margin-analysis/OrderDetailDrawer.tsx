// src/components/margin-analysis/OrderDetailDrawer.tsx

import React from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Flame,
  AlertOctagon,
  Clock,
  Package,
  Factory,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { OrderMarginSummary } from '../../types/marginAnalysis';

interface OrderDetailDrawerProps {
  order: OrderMarginSummary | null;
  onClose: () => void;
  onNavigateToCostVariance?: (workOrderNumber: string) => void;
  onNavigateToScrapRework?: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onNavigateToCostVariance,
  onNavigateToScrapRework
}) => {
  if (!order) return null;

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const unitSellingPrice = order.contractPricePerUnit;
  const unitActualCost = order.quantity > 0 ? Math.round(order.actualTotalCost / order.quantity) : 0;
  const unitProfit = unitSellingPrice - unitActualCost;
  const isTargetMet = order.actualGrossMarginPercent >= 25.0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {order.workOrderNumber}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                order.health === 'high_margin'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : order.health === 'healthy'
                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                  : order.health === 'at_risk'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {order.health.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">
                Status: <strong className="text-slate-200 uppercase">{order.status}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {order.customerName}
            </h2>
            <p className="text-xs text-slate-400">
              {order.partName} <span className="font-mono text-slate-300">({order.partCode})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Commercial Unit Economics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Selling Price / Unit</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                {formatInr(unitSellingPrice)}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Actual Cost / Unit</span>
              <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                {formatInr(unitActualCost)}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Gross Profit / Unit</span>
              <div className={`text-lg font-bold font-mono mt-1 ${unitProfit >= 0 ? 'text-teal-400' : 'text-rose-500'}`}>
                {formatInr(unitProfit)}
              </div>
            </div>
          </div>

          {/* Quoted vs Actual Margin Spread */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Gross Margin Performance
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Batch Qty: <strong className="text-white">{order.quantity} pcs</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border-r border-slate-800 pr-4">
                <span className="text-xs text-slate-400">Quoted Target Margin</span>
                <div className="text-2xl font-bold text-slate-200 font-mono mt-1">
                  {order.standardGrossMarginPercent}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Budgeted Profit: {formatInr(order.standardGrossProfit)}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400">Actual Realized Margin</span>
                <div className={`text-2xl font-bold font-mono mt-1 ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {order.actualGrossMarginPercent}%
                </div>
                <div className="text-[11px] mt-1 flex items-center gap-1">
                  <span className="text-slate-400">Variance:</span>
                  <span className={`font-semibold ${order.marginDilutionPercent <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {order.marginDilutionPercent > 0 ? `-${order.marginDilutionPercent}% Dilution` : `+${Math.abs(order.marginDilutionPercent)}% Gain`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Cost Rollup Element Breakdown */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              Order Manufacturing Cost Breakdown (₹)
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  Direct Raw Materials
                </span>
                <span className="text-white font-semibold">{formatInr(order.materialCost)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  Direct Labor (Wages & Setup)
                </span>
                <span className="text-white font-semibold">{formatInr(order.laborCost)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                  Machine Hourly & Power Rate
                </span>
                <span className="text-white font-semibold">{formatInr(order.machineCost)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                  Subcontract Processing
                </span>
                <span className="text-white font-semibold">{formatInr(order.subcontractCost)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                  Allocated Factory & SG&A Overhead
                </span>
                <span className="text-white font-semibold">{formatInr(order.overheadCost)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-600" />
                  COPQ Scrap & Rework Losses
                </span>
                <span className="text-rose-400 font-semibold">{formatInr(order.scrapCost + order.reworkCost)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-sm font-bold bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-white">Total Actual Cost of Order</span>
                <span className="text-rose-400">{formatInr(order.actualTotalCost)}</span>
              </div>
            </div>
          </div>

          {/* Commercial & Contract Metadata */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Order Commercial References
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Sales Order:</span>
                <div className="text-slate-200 font-mono mt-0.5">{order.salesOrderNumber}</div>
              </div>
              <div>
                <span className="text-slate-500">Customer PO:</span>
                <div className="text-slate-200 font-mono mt-0.5">{order.customerPoNumber}</div>
              </div>
              <div>
                <span className="text-slate-500">Quotation Ref:</span>
                <div className="text-slate-200 font-mono mt-0.5">{order.quoteNumber}</div>
              </div>
              <div>
                <span className="text-slate-500">Due Delivery Date:</span>
                <div className="text-slate-200 font-mono mt-0.5">{order.dueDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onNavigateToCostVariance && (
              <button
                onClick={() => onNavigateToCostVariance(order.workOrderNumber)}
                className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-800/60 flex items-center gap-1.5 transition-colors"
              >
                <span>Planned vs Actual Variance</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            {onNavigateToScrapRework && (order.scrapCost > 0 || order.reworkCost > 0) && (
              <button
                onClick={onNavigateToScrapRework}
                className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/60 flex items-center gap-1.5 transition-colors"
              >
                <span>COPQ Scrap & Rework</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
