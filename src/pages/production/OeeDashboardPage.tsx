// src/pages/production/OeeDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  Settings,
  RefreshCw,
  Cpu,
  Server,
  Zap,
  PlayCircle,
  PauseCircle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Gauge,
  Sliders,
  Radio,
  FileText,
  GitBranch
} from 'lucide-react';
import { useOee } from '../../hooks/useOee';
import { OeeGaugeCard } from '../../components/oee/OeeGaugeCard';
import { MachineStateFleetCard } from '../../components/oee/MachineStateFleetCard';
import { HistoricalOeeTrendChart } from '../../components/oee/HistoricalOeeTrendChart';
import { OpcuaConfigModal } from '../../components/oee/OpcuaConfigModal';
import { DowntimeReasonCaptureModal } from '../../components/oee/DowntimeReasonCaptureModal';
import { ResolveDowntimeModal } from '../../components/oee/ResolveDowntimeModal';
import { DowntimeParetoView } from '../../components/oee/DowntimeParetoView';
import {
  MachineLiveOee,
  MachineState,
  ConnectivityProtocol,
  DowntimeEventRecord
} from '../../types/oee';

export const OeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    machines,
    configs,
    summary,
    downtimeLosses,
    downtimeReasons,
    downtimeEvents,
    setMachineState,
    updateConnectionConfig,
    testOpcuaPing,
    getHistoricalTrends,
    logDowntimeEvent,
    resolveDowntimeEvent,
    getParetoAnalysis
  } = useOee();

  const [filterState, setFilterState] = useState<'all' | MachineState>('all');
  const [selectedMachineForConfig, setSelectedMachineForConfig] = useState<MachineLiveOee | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'analytics' | 'downtime_pareto' | 'opcua_nodes'>('fleet');
  const [machineForDowntimePrompt, setMachineForDowntimePrompt] = useState<MachineLiveOee | null>(null);
  const [eventForResolution, setEventForResolution] = useState<DowntimeEventRecord | null>(null);

  // Filtered machines
  const filteredMachines = machines.filter(m => {
    if (filterState === 'all') return true;
    return m.state === filterState;
  });

  // State counts
  const runningCount = machines.filter(m => m.state === 'running').length;
  const idleCount = machines.filter(m => m.state === 'idle').length;
  const faultedCount = machines.filter(m => m.state === 'faulted').length;
  const setupCount = machines.filter(m => m.state === 'setup').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio size={14} className="animate-pulse text-cyan-400" />
            <span className="uppercase tracking-widest font-bold">Industry 4.0 Telemetry · node-opcua v2.187</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Machine Connectivity & Real-Time OEE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Direct PLC/sensor telemetry (OPC UA / Modbus TCP / MQTT) calculating Availability, Performance & Quality in real time without manual reporting.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/work-orders')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            <Layers size={14} />
            <span>Work Orders</span>
          </button>

          <button
            onClick={() => navigate('/time-capture')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            <Clock size={14} />
            <span>Time Capture</span>
          </button>

          <button
            onClick={() => navigate('/production-genealogy')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 rounded-lg text-xs font-mono transition cursor-pointer"
          >
            <GitBranch size={14} className="text-indigo-400" />
            <span>Genealogy</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 rounded-lg text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>OPC UA Broker: Active</span>
          </div>
        </div>
      </div>

      {/* Top Summary & Gauge Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World-Class OEE Radial Gauge */}
        <div className="lg:col-span-1">
          <OeeGaugeCard summary={summary} />
        </div>

        {/* Machine Status Tally Cards & Telemetry Snapshot */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Running Machines */}
          <div
            onClick={() => setFilterState(filterState === 'running' ? 'all' : 'running')}
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              filterState === 'running'
                ? 'bg-emerald-950 border-emerald-500 shadow-lg'
                : 'bg-slate-800/90 border-slate-700/80 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Running</span>
              <PlayCircle size={18} className="text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black text-white">{runningCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Producing at rate</div>
            </div>
          </div>

          {/* Idle Machines */}
          <div
            onClick={() => setFilterState(filterState === 'idle' ? 'all' : 'idle')}
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              filterState === 'idle'
                ? 'bg-sky-950 border-sky-500 shadow-lg'
                : 'bg-slate-800/90 border-slate-700/80 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">Idle / Starved</span>
              <PauseCircle size={18} className="text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black text-white">{idleCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Awaiting workpiece</div>
            </div>
          </div>

          {/* Faulted Machines */}
          <div
            onClick={() => setFilterState(filterState === 'faulted' ? 'all' : 'faulted')}
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              filterState === 'faulted'
                ? 'bg-rose-950 border-rose-500 shadow-lg'
                : 'bg-slate-800/90 border-slate-700/80 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">Faulted</span>
              <AlertOctagon size={18} className="text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black text-white">{faultedCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">PLC E-Stop / Alarm</div>
            </div>
          </div>

          {/* Setup / Changeover Machines */}
          <div
            onClick={() => setFilterState(filterState === 'setup' ? 'all' : 'setup')}
            className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              filterState === 'setup'
                ? 'bg-amber-950 border-amber-500 shadow-lg'
                : 'bg-slate-800/90 border-slate-700/80 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Tool Setup</span>
              <Wrench size={18} className="text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black text-white">{setupCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fixture / Calibrate</div>
            </div>
          </div>

          {/* Plant Production Shift Metrics (Spans all 4 columns) */}
          <div className="col-span-2 sm:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-400">
                <Cpu size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Current Shift Live Telemetry</div>
                <div className="text-[11px] text-slate-400">
                  {summary.totalMachinesCount} Connected Industrial Endpoints · Polling cycle 1000ms
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL PIECES</span>
                <span className="font-bold text-white text-base">{summary.totalPiecesProducedShift} pcs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SCRAP / DEFECT</span>
                <span className="font-bold text-rose-400 text-base">{summary.totalScrapPiecesShift} pcs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">OPERATING TIME</span>
                <span className="font-bold text-emerald-400 text-base">{summary.totalOperatingHoursShift.toFixed(1)} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DOWNTIME LOSS</span>
                <span className="font-bold text-amber-400 text-base">{summary.totalDowntimeHoursShift.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2.5 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'fleet'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>Machine Fleet & States ({filteredMachines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Historical OEE Trends & Six Losses</span>
          </button>

          <button
            onClick={() => setActiveTab('downtime_pareto')}
            className={`px-4 py-2.5 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'downtime_pareto'
                ? 'border-rose-400 text-rose-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <AlertOctagon size={14} className="text-rose-400" />
            <span>Downtime Reasons & Pareto (80/20)</span>
          </button>

          <button
            onClick={() => setActiveTab('opcua_nodes')}
            className={`px-4 py-2.5 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'opcua_nodes'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Server size={14} />
            <span>OPC UA Tag Address Space ({configs.length} Nodes)</span>
          </button>
        </div>

        {/* State Filter Pills */}
        {activeTab === 'fleet' && (
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[11px] text-slate-400 font-mono mr-1">Filter:</span>
            {(['all', 'running', 'idle', 'faulted', 'setup'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition ${
                  filterState === st
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Machine Fleet Cards */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.map(m => {
            const cfg = configs.find(c => c.machineId === m.machineId);
            return (
              <MachineStateFleetCard
                key={m.machineId}
                machine={m}
                config={cfg}
                onSetState={setMachineState}
                onConfigureOpcua={mach => setSelectedMachineForConfig(mach)}
                onPromptDowntimeReason={mach => setMachineForDowntimePrompt(mach)}
                onResolveDowntime={mach => {
                  const activeEvt = downtimeEvents.find(e => (e.machineId === mach.machineId || e.machineCode === mach.machineCode) && !e.resolved);
                  if (activeEvt) {
                    setEventForResolution(activeEvt);
                  } else {
                    // Quick state return to running
                    setMachineState(mach.machineId, 'running');
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Tab 2: Historical OEE Trends & Six Big Losses */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <HistoricalOeeTrendChart
            onFetchTrends={getHistoricalTrends}
            downtimeLosses={downtimeLosses}
          />
        </div>
      )}

      {/* Tab 3: Downtime Root Cause Pareto Analysis & Events Log */}
      {activeTab === 'downtime_pareto' && (
        <div className="space-y-6">
          <DowntimeParetoView
            paretoData={getParetoAnalysis()}
            events={downtimeEvents}
            onOpenCaptureModal={machId => {
              const m = machines.find(x => x.machineId === machId || x.machineCode === machId);
              if (m) setMachineForDowntimePrompt(m);
            }}
            onOpenResolveModal={evt => setEventForResolution(evt)}
          />
        </div>
      )}

      {/* Tab 3: OPC UA Tag Address Space Table */}
      {activeTab === 'opcua_nodes' && (
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-cyan-400" />
                <span>Configured OPC UA / Industrial IoT Endpoints</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Powered by node-opcua v2.187. Direct variable subscriptions to PLC state registers, good counters, reject counters, and speed encoders.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>All {configs.length} Endpoints Synchronized</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Machine & Code</th>
                  <th className="py-3 px-4">Protocol & Server Endpoint</th>
                  <th className="py-3 px-4">State NodeId</th>
                  <th className="py-3 px-4">Part Counters (Good / Scrap)</th>
                  <th className="py-3 px-4">Speed / Feedrate</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {configs.map(cfg => {
                  const m = machines.find(x => x.machineId === cfg.machineId);
                  return (
                    <tr key={cfg.machineId} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-white text-xs">{cfg.machineName}</div>
                        <div className="text-[11px] font-mono text-cyan-400">{cfg.machineCode}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-white text-[11px] font-semibold">{cfg.endpointUrl}</div>
                        <span className="text-[10px] text-slate-400 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {cfg.protocol === 'opc_ua' ? 'OPC UA (node-opcua)' : cfg.protocol}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-cyan-300 text-[11px]">
                        <code>{cfg.nodeIdState}</code>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                        <div>Good: <span className="text-emerald-400">{cfg.nodeIdPartsGood}</span></div>
                        <div>Defect: <span className="text-rose-400">{cfg.nodeIdPartsScrap}</span></div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div>RPM: <span className="text-white">{cfg.nodeIdSpindleRpm}</span></div>
                        <div>Feed: <span className="text-white">{cfg.nodeIdFeedrate}</span></div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                          {cfg.lastPingMs} ms
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (m) setSelectedMachineForConfig(m);
                          }}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-semibold transition"
                        >
                          Edit Tags
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: OPC UA Tag & Endpoint Configuration */}
      {selectedMachineForConfig && (
        <OpcuaConfigModal
          machine={selectedMachineForConfig}
          config={
            configs.find(c => c.machineId === selectedMachineForConfig.machineId) || {
              machineId: selectedMachineForConfig.machineId,
              machineCode: selectedMachineForConfig.machineCode,
              machineName: selectedMachineForConfig.machineName,
              protocol: 'opc_ua',
              endpointUrl: 'opc.tcp://192.168.1.104:4840',
              securityMode: 'None',
              securityPolicy: 'None',
              nodeIdState: 'ns=2;s=MachineState',
              nodeIdPartsGood: 'ns=2;s=GoodPartCount',
              nodeIdPartsScrap: 'ns=2;s=RejectPartCount',
              nodeIdSpindleRpm: 'ns=2;s=SpindleRPM',
              nodeIdFeedrate: 'ns=2;s=FeedrateOverride',
              pollingIntervalMs: 1000,
              connectionStatus: 'connected',
              lastPingMs: 15
            }
          }
          onSaveConfig={updateConnectionConfig}
          onTestPing={testOpcuaPing}
          onClose={() => setSelectedMachineForConfig(null)}
        />
      )}

      {/* Modal: Operator Prompt for Downtime Reason Code */}
      {machineForDowntimePrompt && (
        <DowntimeReasonCaptureModal
          machine={machineForDowntimePrompt}
          reasons={downtimeReasons}
          onConfirmDowntime={logDowntimeEvent}
          onClose={() => setMachineForDowntimePrompt(null)}
        />
      )}

      {/* Modal: Resolve Downtime & Resume Production */}
      {eventForResolution && (
        <ResolveDowntimeModal
          event={eventForResolution}
          onResolve={resolveDowntimeEvent}
          onClose={() => setEventForResolution(null)}
        />
      )}
    </div>
  );
};
