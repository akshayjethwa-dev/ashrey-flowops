// src/components/oee/MachineStateFleetCard.tsx

import React, { useState } from 'react';
import {
  Activity,
  PlayCircle,
  PauseCircle,
  AlertOctagon,
  AlertTriangle,
  Wrench,
  Wifi,
  WifiOff,
  Sliders,
  Clock,
  Zap,
  Gauge,
  Thermometer,
  Layers,
  ChevronRight,
  Settings,
  Sparkles
} from 'lucide-react';
import { MachineLiveOee, MachineState, MachineConnectionConfig } from '../../types/oee';

interface MachineStateFleetCardProps {
  machine: MachineLiveOee;
  config?: MachineConnectionConfig;
  onSetState: (machineId: string, state: MachineState, reason?: string) => void;
  onConfigureOpcua: (machine: MachineLiveOee) => void;
  onPromptDowntimeReason?: (machine: MachineLiveOee) => void;
  onResolveDowntime?: (machine: MachineLiveOee) => void;
}

export const MachineStateFleetCard: React.FC<MachineStateFleetCardProps> = ({
  machine,
  config,
  onSetState,
  onConfigureOpcua,
  onPromptDowntimeReason,
  onResolveDowntime
}) => {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  // State styling metadata
  const stateMeta: Record<
    MachineState,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode; dotColor: string }
  > = {
    running: {
      label: 'RUNNING',
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-600/70',
      icon: <PlayCircle size={14} className="text-emerald-400" />,
      dotColor: 'bg-emerald-400 animate-ping'
    },
    idle: {
      label: 'IDLE / STANDBY',
      bg: 'bg-sky-950/80',
      text: 'text-sky-300',
      border: 'border-sky-600/70',
      icon: <PauseCircle size={14} className="text-sky-400" />,
      dotColor: 'bg-sky-400'
    },
    faulted: {
      label: 'FAULTED / DOWN',
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-600/70',
      icon: <AlertOctagon size={14} className="text-rose-400" />,
      dotColor: 'bg-rose-500 animate-pulse'
    },
    setup: {
      label: 'SETUP / CHANGEOVER',
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-600/70',
      icon: <Wrench size={14} className="text-amber-400" />,
      dotColor: 'bg-amber-400'
    },
    offline: {
      label: 'OFFLINE',
      bg: 'bg-slate-900',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: <WifiOff size={14} className="text-slate-400" />,
      dotColor: 'bg-slate-500'
    }
  };

  const meta = stateMeta[machine.state];

  return (
    <div className={`rounded-2xl border transition-all shadow-lg flex flex-col justify-between ${
      machine.state === 'faulted'
        ? 'bg-slate-800/90 border-rose-500/80 ring-1 ring-rose-500/50'
        : machine.state === 'running'
        ? 'bg-slate-800/90 border-slate-700 hover:border-cyan-500/60'
        : 'bg-slate-800/80 border-slate-700/80'
    }`}>
      {/* Top Header */}
      <div className="p-4 border-b border-slate-700/60">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                {machine.machineCode}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {machine.department}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
              {machine.machineName}
            </h3>
          </div>

          {/* OPC UA Protocol Badge & Settings Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onConfigureOpcua(machine)}
              className="p-1.5 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition"
              title="Configure OPC UA Endpoint & Node Tag Mapping"
            >
              <Settings size={14} />
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>OPC UA</span>
              {config && (
                <span className="text-slate-500 ml-0.5">{config.lastPingMs}ms</span>
              )}
            </div>
          </div>
        </div>

        {/* Current State Indicator */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${meta.bg} ${meta.border}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
            {meta.icon}
            <span className={`text-xs font-mono font-bold tracking-wide ${meta.text}`}>
              {meta.label}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>{Math.round(machine.stateDurationMinutes)} min</span>
          </div>
        </div>

        {/* Downtime Alert Message with Categorize / Resolve Action */}
        {(machine.state === 'faulted' || machine.state === 'idle' || machine.state === 'setup') && (
          <div className="mt-2.5 space-y-1.5">
            {machine.downtimeReason ? (
              <div className="p-2 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-200 flex items-center justify-between gap-1.5">
                <div className="flex items-start gap-1.5 min-w-0">
                  <AlertOctagon size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{machine.downtimeReason}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPromptDowntimeReason?.(machine)}
                    className="px-2 py-0.5 bg-rose-900 hover:bg-rose-850 text-rose-200 border border-rose-700 rounded text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    Edit Code
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveDowntime?.(machine)}
                    className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-amber-950/80 border border-amber-800 rounded-lg text-xs text-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-[11px]">Machine stopped: Reason uncategorized</span>
                </div>
                <button
                  type="button"
                  onClick={() => onPromptDowntimeReason?.(machine)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-mono font-bold uppercase transition cursor-pointer animate-pulse"
                >
                  Prompt Reason
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: OEE Score & Production Context */}
      <div className="p-4 space-y-3">
        {/* OEE Score Big Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Machine OEE</div>
            <div className={`text-2xl font-mono font-black ${
              machine.oeePercent >= 85
                ? 'text-emerald-400'
                : machine.oeePercent >= 70
                ? 'text-sky-400'
                : 'text-amber-400'
            }`}>
              {machine.oeePercent.toFixed(1)}%
            </div>
          </div>

          {/* Shift Output */}
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">Shift Output</div>
            <div className="text-sm font-mono font-bold text-white">
              {machine.goodPieces} <span className="text-slate-400 text-xs font-normal">/ {machine.totalPieces} pcs</span>
            </div>
            {machine.scrapPieces > 0 && (
              <div className="text-[10px] font-mono text-rose-400">
                {machine.scrapPieces} scrap ({((machine.scrapPieces / machine.totalPieces) * 100).toFixed(1)}%)
              </div>
            )}
          </div>
        </div>

        {/* 3 Sub-Factor Mini Bars */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-700/80">
            <div className="text-slate-400">Avail</div>
            <div className="font-bold text-cyan-300">{machine.availabilityPercent.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-700/80">
            <div className="text-slate-400">Perf</div>
            <div className="font-bold text-emerald-300">{machine.performancePercent.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-700/80">
            <div className="text-slate-400">Qual</div>
            <div className="font-bold text-purple-300">{machine.qualityPercent.toFixed(0)}%</div>
          </div>
        </div>

        {/* Active Work Order / Part Context */}
        {machine.activeWorkOrderNumber && (
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 text-xs flex items-center justify-between">
            <span className="text-slate-400 font-mono">{machine.activeWorkOrderNumber}</span>
            <span className="font-medium text-slate-200 truncate ml-2 max-w-[160px]">
              {machine.activePartName}
            </span>
          </div>
        )}

        {/* Real-Time Sensor Telemetry Ribbon */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block">SPINDLE</span>
            <span className="font-bold text-cyan-400">{machine.telemetry.spindleRpm} RPM</span>
          </div>
          <div>
            <span className="text-slate-500 block">FEEDRATE</span>
            <span className="font-bold text-emerald-400">{machine.telemetry.feedratePercent}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">TEMP</span>
            <span className="font-bold text-amber-400">{machine.telemetry.temperatureCelsius}°C</span>
          </div>
          <div>
            <span className="text-slate-500 block">POWER</span>
            <span className="font-bold text-purple-400">{machine.telemetry.powerKw} kW</span>
          </div>
        </div>
      </div>

      {/* Bottom: PLC Sensor Override & State Simulator */}
      <div className="p-3 bg-slate-850 border-t border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">
          PLC State Simulator:
        </span>

        {/* Quick State Toggle Buttons */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => onSetState(machine.machineId, 'running')}
            className={`px-2 py-1 rounded transition ${
              machine.state === 'running'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Simulate PLC In-Cycle Run"
          >
            Run
          </button>
          <button
            onClick={() => onSetState(machine.machineId, 'idle', 'Operator material shortage')}
            className={`px-2 py-1 rounded transition ${
              machine.state === 'idle'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Simulate PLC Idle Standby"
          >
            Idle
          </button>
          <button
            onClick={() => onSetState(machine.machineId, 'setup', 'Job setup & calibration')}
            className={`px-2 py-1 rounded transition ${
              machine.state === 'setup'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Simulate Setup Mode"
          >
            Setup
          </button>
          <button
            onClick={() => {
              onSetState(machine.machineId, 'faulted', undefined);
              if (onPromptDowntimeReason) {
                onPromptDowntimeReason(machine);
              }
            }}
            className={`px-2 py-1 rounded transition ${
              machine.state === 'faulted'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Simulate Fault Alarm (Prompts Operator Reason Code)"
          >
            Fault (Stop)
          </button>
        </div>
      </div>
    </div>
  );
};
