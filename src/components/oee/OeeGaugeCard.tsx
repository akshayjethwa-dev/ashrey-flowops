// src/components/oee/OeeGaugeCard.tsx

import React from 'react';
import {
  Gauge,
  Award,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { PlantOeeSummary } from '../../types/oee';

interface OeeGaugeCardProps {
  summary: PlantOeeSummary;
}

export const OeeGaugeCard: React.FC<OeeGaugeCardProps> = ({ summary }) => {
  const oee = summary.overallOeePercent;
  const avail = summary.overallAvailabilityPercent;
  const perf = summary.overallPerformancePercent;
  const qual = summary.overallQualityPercent;
  const benchmark = summary.worldClassBenchmarkPercent;

  // Arc calculation for SVG semi-circle gauge (radius 70)
  const radius = 70;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // half circle length
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, oee)) / 100) * circumference;

  const isWorldClass = oee >= benchmark;

  const getGaugeColor = (val: number) => {
    if (val >= 85) return '#10b981'; // emerald
    if (val >= 70) return '#0ea5e9'; // sky
    if (val >= 60) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
            <Gauge size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Overall Plant OEE</h2>
            <p className="text-[11px] text-slate-400">
              Live automated composite from PLC & sensor telemetry
            </p>
          </div>
        </div>

        {/* World Class Benchmark Badge */}
        <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
          isWorldClass
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
            : 'bg-amber-950/80 border-amber-700 text-amber-300'
        }`}>
          <Award size={14} className={isWorldClass ? 'text-emerald-400' : 'text-amber-400'} />
          <span>{isWorldClass ? 'World-Class (≥85%)' : 'Target: 85%'}</span>
        </div>
      </div>

      {/* Center Semi-Circle Gauge */}
      <div className="py-4 flex flex-col items-center justify-center relative">
        <svg width="220" height="125" viewBox="0 0 220 125" className="overflow-visible select-none">
          {/* Background Arc */}
          <path
            d="M 25 110 A 70 70 0 0 1 195 110"
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Benchmark 85% Marker Line */}
          <line
            x1="165"
            y1="40"
            x2="175"
            y2="30"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeDasharray="2 2"
          />

          {/* Active Colored Value Arc */}
          <path
            d="M 25 110 A 70 70 0 0 1 195 110"
            fill="none"
            stroke={getGaugeColor(oee)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Gauge Value Text Overlay */}
        <div className="text-center -mt-12">
          <div className="text-4xl font-mono font-black text-white tracking-tight">
            {oee.toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            Real-Time OEE
          </div>
        </div>
      </div>

      {/* 3 Sub-Factor Component Bars: A x P x Q */}
      <div className="space-y-2.5 pt-3 border-t border-slate-700/60">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>OEE = Availability × Performance × Quality</span>
          <span className="text-cyan-400 font-bold">Six Big Losses Math</span>
        </div>

        {/* Availability */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Availability (Operating / Planned Time)</span>
            <span className="font-mono font-bold text-white">{avail.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${avail}%` }}
            />
          </div>
        </div>

        {/* Performance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Performance (Actual / Ideal Cycle Speed)</span>
            <span className="font-mono font-bold text-white">{perf.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${perf}%` }}
            />
          </div>
        </div>

        {/* Quality */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Quality (Good Units / Total Produced)</span>
            <span className="font-mono font-bold text-white">{qual.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${qual}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
