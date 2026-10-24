// src/components/quality-dashboard/QualityKpiGrid.tsx

import React from 'react';
import { QualityKpis } from '../../types/qualityDashboard';
import { 
  CheckCircle2, 
  Flame, 
  Clock, 
  AlertOctagon, 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  IndianRupee
} from 'lucide-react';

interface QualityKpiGridProps {
  kpis: QualityKpis;
  onCapaClick?: () => void;
  onScrapClick?: () => void;
}

export const QualityKpiGrid: React.FC<QualityKpiGridProps> = ({
  kpis,
  onCapaClick,
  onScrapClick
}) => {
  const fpyDelta = Number((kpis.fpyPct - kpis.fpyTargetPct).toFixed(1));
  const scrapDelta = Number((kpis.scrapRatePct - kpis.scrapThresholdPct).toFixed(2));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. First-Pass Yield (FPY) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            First-Pass Yield (FPY)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.fpyPct}%
          </span>
          <span className="text-xs text-slate-400 font-medium">
            target {kpis.fpyTargetPct}%
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-1.5 text-xs">
          {fpyDelta >= 0 ? (
            <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{fpyDelta}%
            </span>
          ) : (
            <span className="inline-flex items-center text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              {fpyDelta}%
            </span>
          )}
          <span className="text-slate-500 text-[11px]">
            {kpis.passedUnits.toLocaleString('en-IN')} / {kpis.totalInspectedUnits.toLocaleString('en-IN')} pcs
          </span>
        </div>
      </div>

      {/* 2. Scrap Rate % & Loss Value */}
      <div 
        onClick={onScrapClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Scrap Rate & Cost
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.scrapRatePct}%
          </span>
          <span className="text-xs text-rose-600 font-bold">
            ₹{(kpis.scrapCostValue / 1000).toFixed(1)}k loss
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Max threshold: {kpis.scrapThresholdPct}%
          </span>
          <span className="text-[10px] font-mono font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
            +{scrapDelta}% over
          </span>
        </div>
      </div>

      {/* 3. Open & Overdue CAPAs */}
      <div 
        onClick={onCapaClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Active CAPA Aging
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.openCapaCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            in-flight CAPAs
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
            <AlertOctagon className="w-3 h-3 mr-0.5" />
            {kpis.overdueCapaCount} Overdue (&gt;30d)
          </span>
          <span className="text-slate-400 text-[11px]">
            Avg: {kpis.avgCapaClosureDays}d
          </span>
        </div>
      </div>

      {/* 4. Active Quality Holds & Defect Quarantine */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Quarantine & Holds
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.activeQualityHoldsCount}
          </span>
          <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
            MRB Active
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500 text-[11px]">
          <span>Rework: {kpis.reworkedUnits} pcs</span>
          <span>•</span>
          <span>Scrap: {kpis.scrappedUnits} pcs</span>
        </div>
      </div>
    </div>
  );
};
