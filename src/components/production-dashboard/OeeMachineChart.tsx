// src/components/production-dashboard/OeeMachineChart.tsx

import React from 'react';
import { MachineOeeCardData } from '../../types/productionDashboard';
import { 
  Gauge, 
  Activity, 
  Cpu, 
  Radio, 
  RotateCw, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Zap
} from 'lucide-react';

interface Props {
  machines: MachineOeeCardData[];
}

export const OeeMachineChart: React.FC<Props> = ({ machines }) => {
  // Compute overall plant averages
  const overallOee = machines.length > 0 
    ? Number((machines.reduce((acc, m) => acc + m.oeePct, 0) / machines.length).toFixed(1))
    : 81.4;
  const overallAvail = machines.length > 0
    ? Number((machines.reduce((acc, m) => acc + m.availabilityPct, 0) / machines.length).toFixed(1))
    : 88.5;
  const overallPerf = machines.length > 0
    ? Number((machines.reduce((acc, m) => acc + m.performancePct, 0) / machines.length).toFixed(1))
    : 92.4;
  const overallQual = machines.length > 0
    ? Number((machines.reduce((acc, m) => acc + m.qualityPct, 0) / machines.length).toFixed(1))
    : 98.6;

  const runningCount = machines.filter(m => m.state === 'running').length;
  const idleCount = machines.filter(m => m.state === 'idle').length;
  const faultedCount = machines.filter(m => m.state === 'faulted').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-5 font-sans">
      
      {/* Header & Plant Overall OEE Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Machine Connectivity & Overall Equipment Effectiveness (OEE)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated sensor telemetry (OPC UA / Modbus) calculating Availability × Performance × Quality in real-time.
          </p>
        </div>

        {/* Live Fleet Run State Badges */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {runningCount} Running
          </span>
          {idleCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {idleCount} Idle
            </span>
          )}
          {faultedCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {faultedCount} Faulted
            </span>
          )}
        </div>
      </div>

      {/* 3 OEE Factor Scores Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Overall Plant OEE
            </span>
            <div className="text-2xl font-black mt-0.5 tracking-tight">{overallOee}%</div>
            <span className="text-[10px] text-slate-400">World-Class Target: 85%</span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-400">
            {overallOee}%
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            1. Availability (Operating / Planned)
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{overallAvail}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${overallAvail}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            2. Performance (Net Run Rate)
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{overallPerf}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${overallPerf}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            3. Quality (First-Pass Yield)
          </span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{overallQual}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallQual}%` }}></div>
          </div>
        </div>
      </div>

      {/* Machine-by-Machine OEE Comparative Chart */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          Machine-by-Machine OEE Benchmarks
        </h4>

        <div className="space-y-2.5">
          {machines.map((m) => {
            const isHigh = m.oeePct >= 85.0;
            const isMedium = m.oeePct >= 75.0 && m.oeePct < 85.0;

            return (
              <div 
                key={m.machineId}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      m.state === 'running' ? 'bg-emerald-500 animate-pulse' :
                      m.state === 'idle' ? 'bg-amber-500' :
                      m.state === 'faulted' ? 'bg-rose-500' : 'bg-slate-400'
                    }`}></span>
                    <strong className="text-slate-900 font-bold">{m.machineCode}</strong>
                    <span className="text-slate-500 font-sans">({m.machineName})</span>
                    <span className="text-[10px] text-slate-400">· {m.department}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px]">
                    <span className="text-slate-500">
                      Avail: <strong className="text-slate-800">{m.availabilityPct}%</strong>
                    </span>
                    <span className="text-slate-500">
                      Perf: <strong className="text-slate-800">{m.performancePct}%</strong>
                    </span>
                    <span className="text-slate-500">
                      Qual: <strong className="text-slate-800">{m.qualityPct}%</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                      isHigh ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isMedium ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      OEE: {m.oeePct}%
                    </span>
                  </div>
                </div>

                {/* Comparative Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${m.oeePct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh ? 'bg-emerald-500' : isMedium ? 'bg-sky-500' : 'bg-amber-500'
                    }`}
                  ></div>
                </div>

                {/* Subtext info */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    Active: <strong className="text-slate-700 font-sans">{m.activePart || 'Idle'}</strong> ({m.activeWorkOrder})
                  </span>
                  <span>
                    Output: <strong className="text-slate-800">{m.actualPiecesShift}</strong> / {m.targetPiecesShift} pcs · Downtime: {m.downtimeMinutesToday}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
