// src/components/mrp/MrpTimelineDrawer.tsx

import React from 'react';
import {
  X,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Truck,
  ArrowRight,
  ShieldAlert,
  ArrowDownToLine
} from 'lucide-react';
import { MrpPurchaseRecommendation } from '../../types/mrp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recommendation: MrpPurchaseRecommendation | null;
  onConvertToPo?: (rec: MrpPurchaseRecommendation) => void;
}

export const MrpTimelineDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  recommendation,
  onConvertToPo
}) => {
  if (!isOpen || !recommendation) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Generate a simulated 4-week time-phased waterfall projection
  const now = new Date();
  const weeks = [
    {
      label: 'Week 1 (Days 1–7)',
      demand: recommendation.demandsBreakdown[0]?.qty || recommendation.grossRequirement * 0.6,
      inbound: recommendation.scheduledInbound,
      workOrders: [recommendation.demandsBreakdown[0]?.workOrderNumber || 'WO-2026-001']
    },
    {
      label: 'Week 2 (Days 8–14)',
      demand: recommendation.demandsBreakdown[1]?.qty || recommendation.grossRequirement * 0.3,
      inbound: 0,
      workOrders: [recommendation.demandsBreakdown[1]?.workOrderNumber || 'WO-2026-002']
    },
    {
      label: 'Week 3 (Days 15–21)',
      demand: recommendation.grossRequirement * 0.1,
      inbound: 0,
      workOrders: ['WO-2026-003']
    },
    {
      label: 'Week 4 (Days 22–30)',
      demand: 0,
      inbound: 0,
      workOrders: []
    }
  ];

  let runningBalance = recommendation.currentOnHand;

  return (
    <div className="fixed inset-0 z-[125] bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                {recommendation.stockItemCode}
              </span>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                  recommendation.urgency === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : recommendation.urgency === 'high'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {recommendation.urgency.toUpperCase()} URGENCY
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {recommendation.stockItemName}
            </h3>
            <p className="text-xs text-slate-400">
              Supply-Demand Waterfall & Projected Stock Balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Inventory Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">On-Hand</span>
              <span className="text-sm font-bold text-white font-mono">
                {recommendation.currentOnHand} {recommendation.unit}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Reserved</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {recommendation.reservedQty} {recommendation.unit}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Safety Stock</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {recommendation.safetyStockRequired} {recommendation.unit}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">On-Order</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">
                {recommendation.scheduledInbound} {recommendation.unit}
              </span>
            </div>
          </div>

          {/* Lead Time & Critical Dates Banner */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-sky-400" />
              Time-Phased Lead Time Analysis
            </h4>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Vendor Lead Time</span>
                <span className="font-bold text-slate-200">{recommendation.leadTimeDays} Days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Must Order By</span>
                <span className={`font-bold ${recommendation.slackDays <= 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {recommendation.orderByDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Need On Shopfloor</span>
                <span className="font-bold text-emerald-400">{recommendation.needByDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
              {recommendation.slackDays <= 0 ? (
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Negative Slack ({recommendation.slackDays} days): Order release date has passed! Stockout imminent without expedited freight.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{recommendation.slackDays} days remaining before PO release deadline to satisfy lead time.</span>
                </div>
              )}
            </div>
          </div>

          {/* Time-Phased Weekly Projection Table */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-indigo-400" />
              Weekly Projected Inventory Balance
            </h4>

            <div className="space-y-3">
              {weeks.map((w, idx) => {
                const prev = runningBalance;
                runningBalance = Number((runningBalance + w.inbound - w.demand).toFixed(3));
                const isUnderSafety = runningBalance < recommendation.safetyStockRequired;
                const isDeficit = runningBalance < 0;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isDeficit
                        ? 'bg-rose-950/40 border-rose-800/80'
                        : isUnderSafety
                        ? 'bg-amber-950/30 border-amber-800/60'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-white font-mono">{w.label}</span>
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          isDeficit
                            ? 'text-rose-400'
                            : isUnderSafety
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        Projected End: {runningBalance} {recommendation.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                      <div>Start: {prev} {recommendation.unit}</div>
                      <div>
                        Demand: -{w.demand.toFixed(1)} {recommendation.unit}
                      </div>
                      <div>
                        Inbound: +{w.inbound} {recommendation.unit}
                      </div>
                    </div>

                    {isDeficit && (
                      <div className="mt-2 text-[11px] text-rose-300 font-mono flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Stockout Deficit of {Math.abs(runningBalance)} {recommendation.unit} occurs here!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        {recommendation.status === 'pending' && onConvertToPo && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Recommended Order</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {recommendation.recommendedOrderQty} {recommendation.unit} ({formatCurrency(recommendation.totalEstimatedCost)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onConvertToPo(recommendation);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Convert to Purchase Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
