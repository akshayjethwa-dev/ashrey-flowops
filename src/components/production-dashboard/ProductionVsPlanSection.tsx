// src/components/production-dashboard/ProductionVsPlanSection.tsx

import React from 'react';
import { ProductionPlanSummary, HourlyProductionPoint } from '../../types/productionDashboard';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Zap,
  BarChart2
} from 'lucide-react';

interface Props {
  planSummary: ProductionPlanSummary;
  hourlyPoints: HourlyProductionPoint[];
}

export const ProductionVsPlanSection: React.FC<Props> = ({ planSummary, hourlyPoints }) => {
  const maxHourly = 180;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-5 font-sans">
      
      {/* Header & Attainment Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Production Output vs. Scheduled Plan
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift dispatch commitments vs real-time counter tallies across CNC and Assembly cells.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-500">{planSummary.shiftName}</span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">
            ● 93.3% Attainment Pace
          </span>
        </div>
      </div>

      {/* Bento KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Target Shift Plan
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {planSummary.plannedUnits.toLocaleString()} pcs
          </div>
          <span className="text-[10px] text-slate-400">150 pcs/hour nominal run rate</span>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <span className="text-[10px] text-indigo-800 uppercase font-bold block">
            Actual Finished Good
          </span>
          <div className="text-xl font-bold text-indigo-950 mt-0.5">
            {planSummary.actualUnits.toLocaleString()} pcs
          </div>
          <span className="text-[10px] text-indigo-700 font-bold">
            {planSummary.planAttainmentPct}% of Shift Goal
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block">
            First-Pass Yield (FPY)
          </span>
          <div className="text-xl font-bold text-emerald-950 mt-0.5">
            {planSummary.firstPassYieldPct}%
          </div>
          <span className="text-[10px] text-emerald-700">Only {planSummary.scrapUnits} Rejects (1.3%)</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">
            Pacing Run-Rate
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {planSummary.runRateUnitsPerHour} pcs/hr
          </div>
          <span className="text-[10px] text-slate-500">1.5 hours remaining in shift</span>
        </div>
      </div>

      {/* Hourly Production Run-Rate Chart */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block"></span>
              <span>Actual Output (pcs)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-slate-200 rounded-sm inline-block"></span>
              <span>Scheduled Target (150 pcs)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Scrap Pieces</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-400">Hour-by-hour shift progression</span>
        </div>

        {/* Visual Columns Chart */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 h-48 items-end pt-4 pb-2 border-b border-slate-100">
          {hourlyPoints.map((pt) => {
            const actualH = (pt.actualUnits / maxHourly) * 100;
            const targetH = (pt.plannedUnits / maxHourly) * 100;
            const isMet = pt.actualUnits >= pt.plannedUnits;

            return (
              <div key={pt.hour} className="flex flex-col items-center h-full justify-end group relative">
                
                {/* Floating Tag */}
                <div className="mb-1 text-[10px] font-mono text-slate-700 font-bold">
                  {pt.actualUnits}
                </div>

                {/* Dual Bars */}
                <div className="flex items-end space-x-1 w-full justify-center max-w-[42px] h-[120px]">
                  {/* Target Bar */}
                  <div 
                    style={{ height: `${targetH}%` }}
                    className="w-1/2 bg-slate-200 rounded-t-sm"
                    title={`Target: ${pt.plannedUnits} pcs`}
                  ></div>

                  {/* Actual Output Bar */}
                  <div 
                    style={{ height: `${actualH}%` }}
                    className={`w-1/2 rounded-t-sm shadow-sm transition-all ${
                      isMet ? 'bg-indigo-600 group-hover:bg-indigo-500' : 'bg-amber-500 group-hover:bg-amber-400'
                    }`}
                    title={`Actual: ${pt.actualUnits} pcs · Scrap: ${pt.scrapUnits} pcs`}
                  ></div>
                </div>

                {/* Hour Label */}
                <span className="text-[9px] font-mono text-slate-400 mt-2 truncate max-w-full text-center">
                  {pt.hour.split(' - ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
