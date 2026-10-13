// src/components/ncr/NcrAgingDashboard.tsx

import React from 'react';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  ArrowRight,
  Flame,
  ChevronRight
} from 'lucide-react';
import {
  NcrRecord,
  CapaRecord,
  NcrAgingSummary,
  NcrKpiSummary
} from '../../types/ncr';

interface NcrAgingDashboardProps {
  aging: NcrAgingSummary;
  kpis: NcrKpiSummary;
  ncrs: NcrRecord[];
  capas: CapaRecord[];
  onSelectNcr: (ncr: NcrRecord) => void;
  onFilterBracket?: (bracket: 'all' | 'under_7' | '8_to_14' | '15_to_30' | 'over_30') => void;
}

export const NcrAgingDashboard: React.FC<NcrAgingDashboardProps> = ({
  aging,
  kpis,
  ncrs,
  capas,
  onSelectNcr,
  onFilterBracket
}) => {
  const overdueNcrs = ncrs.filter(n => n.isOverdue && n.status !== 'closed');
  const overdueCapas = capas.filter(c => c.isOverdue && c.status !== 'closed');

  const totalBracket = aging.totalOpen || 1;
  const pUnder7 = Math.round((aging.bracketUnder7 / totalBracket) * 100);
  const p8to14 = Math.round((aging.bracket8to14 / totalBracket) * 100);
  const p15to30 = Math.round((aging.bracket15to30 / totalBracket) * 100);
  const pOver30 = Math.round((aging.bracketOver30 / totalBracket) * 100);

  return (
    <div className="space-y-5 text-xs">
      
      {/* Top Aging Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Open Non-Conformances */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Open Non-Conformances</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{aging.totalOpen}</span>
            <span className="text-xs text-slate-400 ml-1.5">NCRs in flight</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting final closeout</span>
        </div>

        {/* Avg Disposition Turnaround */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Avg Days to MRB Disposition</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {aging.avgDispositionDays}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">Days (Target &le; 3d)</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">MRB response velocity</span>
        </div>

        {/* Avg CAPA Resolution Time */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Avg Days to CAPA Closure</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {aging.avgCapaClosureDays}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">Days (Target &le; 30d)</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">8D root cause cycle</span>
        </div>

        {/* Total COPQ Financial Impact */}
        <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 font-bold">
            <span>Cost of Poor Quality (COPQ)</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              ${aging.totalEstimatedCopq.toLocaleString()}
            </span>
            <span className="text-xs text-rose-400/80 ml-1.5">Scrap + Rework</span>
          </div>
          <span className="text-[11px] text-rose-400/70 mt-1 block">Factory financial loss</span>
        </div>

      </div>

      {/* Aging Distribution Brackets Section */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Non-Conformance Aging Distribution & Escalation Heatmap</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks how long non-conforming inventory remains quarantined without resolution
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {aging.totalOpen} Active Quarantined Batches
          </span>
        </div>

        {/* Multi-segmented Aging Bar */}
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-800 rounded-full flex overflow-hidden">
            <div
              style={{ width: `${pUnder7}%` }}
              className="bg-emerald-500 transition-all hover:opacity-90"
              title={`< 7 Days: ${aging.bracketUnder7} NCRs (${pUnder7}%)`}
            />
            <div
              style={{ width: `${p8to14}%` }}
              className="bg-cyan-500 transition-all hover:opacity-90"
              title={`8 - 14 Days: ${aging.bracket8to14} NCRs (${p8to14}%)`}
            />
            <div
              style={{ width: `${p15to30}%` }}
              className="bg-amber-500 transition-all hover:opacity-90"
              title={`15 - 30 Days: ${aging.bracket15to30} NCRs (${p15to30}%)`}
            />
            <div
              style={{ width: `${pOver30}%` }}
              className="bg-rose-500 transition-all hover:opacity-90"
              title={`> 30 Days: ${aging.bracketOver30} NCRs (${pOver30}%)`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            {/* < 7 Days */}
            <button
              type="button"
              onClick={() => onFilterBracket && onFilterBracket('under_7')}
              className="p-3 rounded-xl bg-slate-850 border border-emerald-500/30 text-left hover:bg-slate-800 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">&lt; 7 Days</span>
                <span className="font-mono font-bold text-white text-sm">{aging.bracketUnder7}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Fresh Containment</span>
            </button>

            {/* 8 - 14 Days */}
            <button
              type="button"
              onClick={() => onFilterBracket && onFilterBracket('8_to_14')}
              className="p-3 rounded-xl bg-slate-850 border border-cyan-500/30 text-left hover:bg-slate-800 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">8 - 14 Days</span>
                <span className="font-mono font-bold text-white text-sm">{aging.bracket8to14}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Under MRB Review</span>
            </button>

            {/* 15 - 30 Days */}
            <button
              type="button"
              onClick={() => onFilterBracket && onFilterBracket('15_to_30')}
              className="p-3 rounded-xl bg-slate-850 border border-amber-500/30 text-left hover:bg-slate-800 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold">15 - 30 Days</span>
                <span className="font-mono font-bold text-white text-sm">{aging.bracket15to30}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Escalated Attention</span>
            </button>

            {/* > 30 Days */}
            <button
              type="button"
              onClick={() => onFilterBracket && onFilterBracket('over_30')}
              className="p-3 rounded-xl bg-slate-850 border border-rose-500/40 text-left hover:bg-slate-800 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  &gt; 30 Days
                </span>
                <span className="font-mono font-bold text-rose-300 text-sm">{aging.bracketOver30}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Critical Overdue</span>
            </button>

          </div>
        </div>
      </div>

      {/* Critical Overdue Escalations Ledger */}
      {overdueNcrs.length > 0 && (
        <div className="p-5 bg-rose-950/20 border border-rose-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Overdue Non-Conformances Requiring Immediate Action ({overdueNcrs.length})</span>
            </div>
            <span className="text-[11px] text-rose-300 font-mono">
              Action SLA Breached
            </span>
          </div>

          <div className="space-y-2">
            {overdueNcrs.map(n => (
              <div
                key={n.id}
                onClick={() => onSelectNcr(n)}
                className="p-3 bg-slate-900 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-850 cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">{n.ncrNumber}</span>
                    <strong className="text-white text-xs">{n.title}</strong>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {n.partSku}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Quarantined at: <strong className="text-amber-300">{n.quarantineLocation}</strong> &bull;{' '}
                    Aging: <strong className="text-rose-400">{n.agingDays} days</strong> &bull;{' '}
                    Defective Qty: {n.defectiveQuantity} pcs
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-bold font-mono">
                    Disposition: {n.disposition.dispositionType.toUpperCase()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
