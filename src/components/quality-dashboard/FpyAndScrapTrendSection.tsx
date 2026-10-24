// src/components/quality-dashboard/FpyAndScrapTrendSection.tsx

import React, { useState } from 'react';
import { FpyDayTrendPoint } from '../../types/qualityDashboard';
import { 
  TrendingUp, 
  BarChart3, 
  Flame, 
  Info, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface FpyAndScrapTrendSectionProps {
  trendData: FpyDayTrendPoint[];
}

export const FpyAndScrapTrendSection: React.FC<FpyAndScrapTrendSectionProps> = ({
  trendData
}) => {
  const [selectedDay, setSelectedDay] = useState<FpyDayTrendPoint>(trendData[trendData.length - 1]);
  const [activeMetricTab, setActiveMetricTab] = useState<'fpy' | 'scrap'>('fpy');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              First-Pass Yield (FPY) & Scrap Rate Trajectory
            </h3>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-100">
              7-Day Rolling Window
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quality gate progression comparing First Pass Yield against the 98.5% plant standard and scrap containment threshold.
          </p>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-center font-medium">
          <button
            onClick={() => setActiveMetricTab('fpy')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeMetricTab === 'fpy'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FPY Yield (%)
          </button>
          <button
            onClick={() => setActiveMetricTab('scrap')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeMetricTab === 'scrap'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scrap Rate (%)
          </button>
        </div>
      </div>

      {/* Visual Chart Representation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Chart Column (3 spans) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Target line legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-mono">
            <span className="flex items-center space-x-1.5">
              <span className={`w-3 h-3 rounded-xs ${activeMetricTab === 'fpy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{activeMetricTab === 'fpy' ? 'First-Pass Yield %' : 'Scrap Rate %'}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-4 h-0.5 border-t border-dashed border-slate-400" />
              <span>{activeMetricTab === 'fpy' ? 'Target: 98.5%' : 'Threshold: ≤ 1.2%'}</span>
            </span>
          </div>

          {/* Bar / Column Chart */}
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-3 bg-slate-50/70 border border-slate-100 rounded-xl relative">
            {/* Horizontal Target Reference Line */}
            {activeMetricTab === 'fpy' ? (
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400 pointer-events-none z-10"
                style={{ bottom: '82%' }}
              >
                <span className="absolute right-2 -top-2.5 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Target 98.5%
                </span>
              </div>
            ) : (
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400 pointer-events-none z-10"
                style={{ bottom: '48%' }}
              >
                <span className="absolute right-2 -top-2.5 text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                  Max Allowed 1.2%
                </span>
              </div>
            )}

            {trendData.map((pt) => {
              const isSelected = selectedDay.date === pt.date;
              const val = activeMetricTab === 'fpy' ? pt.firstPassYieldPct : pt.scrapRatePct;
              
              // Scale heights
              let heightPct = 0;
              if (activeMetricTab === 'fpy') {
                // scale 94% to 100% into 0% to 100% height
                heightPct = Math.max(15, Math.min(100, ((val - 94) / (100 - 94)) * 100));
              } else {
                // scale 0% to 2.5% into 0% to 100% height
                heightPct = Math.max(10, Math.min(100, (val / 2.5) * 100));
              }

              const isMeetingGoal = activeMetricTab === 'fpy' ? val >= pt.fpyTargetPct : val <= 1.2;

              return (
                <div 
                  key={pt.date}
                  onClick={() => setSelectedDay(pt)}
                  className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end relative"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {val}% ({pt.inspected} pcs)
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] flex flex-col justify-end items-center h-full">
                    <div 
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        activeMetricTab === 'fpy'
                          ? isMeetingGoal 
                            ? 'bg-emerald-500 hover:bg-emerald-600' 
                            : 'bg-amber-500 hover:bg-amber-600'
                          : isMeetingGoal
                            ? 'bg-slate-400 hover:bg-slate-500'
                            : 'bg-rose-500 hover:bg-rose-600'
                      } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={`text-[10px] mt-2 font-mono truncate max-w-full text-center ${
                    isSelected ? 'font-bold text-indigo-600' : 'text-slate-500'
                  }`}>
                    {pt.dayLabel.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Audit Card (1 span) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
              Inspection Batch Audit
            </span>
            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {selectedDay.dayLabel}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Inspected Volume:</span>
              <span className="font-bold text-slate-900 font-mono">{selectedDay.inspected} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">First-Pass Yield:</span>
              <span className={`font-bold font-mono ${
                selectedDay.firstPassYieldPct >= 98.5 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {selectedDay.firstPassYieldPct}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Scrap Rate:</span>
              <span className={`font-bold font-mono ${
                selectedDay.scrapRatePct <= 1.2 ? 'text-slate-700' : 'text-rose-600'
              }`}>
                {selectedDay.scrapRatePct}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Rework Rate:</span>
              <span className="font-bold text-slate-700 font-mono">{selectedDay.reworkRatePct}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            {selectedDay.firstPassYieldPct >= 98.5 ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                Exceeded target FPY benchmark with zero critical escapes.
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Under target due to tool chatter in CNC milling section.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
