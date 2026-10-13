// src/pages/quality/InProcessQualityPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ruler,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck2,
  Download,
  Plus,
  Search,
  Filter,
  Sliders,
  Rotate3d,
  Lock,
  Unlock,
  Building2,
  Layers,
  Sparkles,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  Zap,
  Pin,
  TrendingUp
} from 'lucide-react';
import { useIPQC } from '../../hooks/useIPQC';
import { IpqcTask, QualityControlPointConfig } from '../../types/ipqc';
import { IpqcInspectionTaskModal } from '../../components/ipqc/IpqcInspectionTaskModal';
import { QcpConfigEditorModal } from '../../components/ipqc/QcpConfigEditorModal';
import { SpawnIpqcTaskModal } from '../../components/ipqc/SpawnIpqcTaskModal';

export const InProcessQualityPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    configs,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    saveMeasurement,
    attachPhoto,
    deletePhoto,
    signOffTask,
    autoGenerateTask,
    saveQcpConfig,
    exportCsv
  } = useIPQC();

  const [activeTab, setActiveTab] = useState<'tasks' | 'qcps' | 'analytics'>('tasks');

  // Modals state
  const [activeTaskForInspection, setActiveTaskForInspection] = useState<IpqcTask | null>(null);
  const [isSpawnTaskOpen, setIsSpawnTaskOpen] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<QualityControlPointConfig | null>(null);
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Rotate3d className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                In-Process Quality Control (IPQC)
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Shopfloor QCP
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Quality Control Points per routing operation, 3D part pin markings, first-piece inspections, and machine hold gates
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsSpawnTaskOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Trigger Inspection Task
          </button>

          <button
            onClick={() => {
              setEditingConfig(null);
              setIsConfigEditorOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            Configure Operation QCP
          </button>

          <button
            onClick={() => navigate('/spc')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-900/60 to-cyan-900/60 hover:from-blue-800/80 hover:to-cyan-800/80 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            SPC Control Charts
          </button>

          <button
            onClick={() => navigate('/fqc')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Final Quality Control (FQC) & Dispatch Release"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Final Quality (FQC)
          </button>

          <button
            onClick={() => navigate('/ncr')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Non-Conformance Reports & CAPA Management"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            NCR & CAPA
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Download CSV Audit Log"
          >
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Pending Tasks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Pending Inspection</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {kpis.pendingInspection}
            </span>
            <span className="text-[11px] text-slate-500">awaiting QA</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Avg response: <strong>{kpis.avgResolutionMinutes} min</strong>
          </div>
        </div>

        {/* In-Progress Testing */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">In-Progress Testing</span>
            <Ruler className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {kpis.inProgress}
            </span>
            <span className="text-[11px] text-slate-500">active tasks</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Station measurement mode
          </div>
        </div>

        {/* Station Pass Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">First-Pass Yield</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {kpis.passRatePct}%
            </span>
            <span className="text-[11px] text-slate-500">target ≥ 95%</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/90 font-mono">
            {kpis.passedTasks} First Pieces Approved
          </div>
        </div>

        {/* Machine Hold Interlocks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Machines on Hold</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {kpis.failedHoldTasks}
            </span>
            <span className="text-[11px] text-slate-500">active interlocks</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400 font-mono">
            Operation stop active
          </div>
        </div>

        {/* Configured QCP Points */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-semibold">Routing QCP Points</span>
            <Rotate3d className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {kpis.activeQcpPoints}
            </span>
            <span className="text-[11px] text-slate-500">active points</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Configured on routings
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-xl px-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'tasks'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Station Inspection Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('qcps')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'qcps'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Routing QCP Configuration Library ({configs.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          In-Process Defect Analytics
        </button>
      </div>

      {/* TAB 1: TASKS QUEUE */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                placeholder="Search Task#, WO#, Part, Machine, Op..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Task Statuses</option>
                <option value="pending">Pending Inspection</option>
                <option value="in_progress">In-Progress</option>
                <option value="passed">Passed / Gate Open</option>
                <option value="hold">Hold / Machine Locked</option>
                <option value="failed">Failed Setup</option>
              </select>

              <select
                value={filter.triggerType}
                onChange={(e) => setFilter({ ...filter, triggerType: e.target.value as any })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Trigger Types</option>
                <option value="first_piece">First Article (FAI)</option>
                <option value="periodic_interval">Periodic Interval</option>
                <option value="final_operation_gate">Final Operation Gate</option>
                <option value="tool_change">Tool Change</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Task # & Trigger</th>
                    <th className="p-3.5">Work Order & Op</th>
                    <th className="p-3.5">Machine / Cell</th>
                    <th className="p-3.5">Part SKU & 3D Model</th>
                    <th className="p-3.5">3D Coordinate Pins</th>
                    <th className="p-3.5">Photo Evidence</th>
                    <th className="p-3.5">Gate Decision</th>
                    <th className="p-3.5">Inspector</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No inspection tasks matching filter.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const oosPins = task.markers.filter(m => m.status === 'out_of_spec').length;
                      const inSpecPins = task.markers.filter(m => m.status === 'in_spec').length;

                      return (
                        <tr key={task.id} className="hover:bg-slate-800/40 transition">
                          
                          {/* Task # & Trigger */}
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-white block">
                              {task.taskNumber}
                            </span>
                            <span className="text-[10px] text-blue-400 block mt-0.5">
                              {task.triggerType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* WO & Op */}
                          <td className="p-3.5 font-mono">
                            <span className="text-slate-200 font-bold block">
                              {task.workOrderNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                              Op {task.operationSequence}: {task.operationName}
                            </span>
                          </td>

                          {/* Machine */}
                          <td className="p-3.5">
                            <span className="font-bold text-amber-300 font-mono block">
                              {task.machineCode}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                              {task.workCenterName}
                            </span>
                          </td>

                          {/* Part SKU & Model */}
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {task.partNumber}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                              <Rotate3d className="w-3 h-3" />
                              {task.partModelType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* 3D Coordinate Pins Status */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {oosPins > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {oosPins} Pin OOS
                                </span>
                              ) : inSpecPins > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> {inSpecPins}/{task.markers.length} In-Spec
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  {task.markers.length} Pins Pending
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Photos */}
                          <td className="p-3.5">
                            {task.photos.length > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 w-max">
                                <Camera className="w-3 h-3 text-blue-400" />
                                {task.photos.length} Photo{task.photos.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">None</span>
                            )}
                          </td>

                          {/* Gate Status */}
                          <td className="p-3.5 font-mono">
                            {task.status === 'passed' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                                <Unlock className="w-3 h-3" /> GATE OPEN
                              </span>
                            ) : task.status === 'hold' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
                                <Lock className="w-3 h-3" /> HOLD LOCKED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                                <Clock className="w-3 h-3" /> TESTING
                              </span>
                            )}
                          </td>

                          {/* Inspector */}
                          <td className="p-3.5 text-slate-300 text-xs">
                            {task.inspectorName || 'Anita Desai (QC-408)'}
                          </td>

                          {/* Action */}
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setActiveTaskForInspection(task)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition border border-blue-500/40 flex items-center gap-1 ml-auto"
                            >
                              <Ruler className="w-3.5 h-3.5" />
                              Inspect
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTING QCP CONFIGURATION LIBRARY */}
      {activeTab === 'qcps' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Quality Control Points (QCP) mapped directly into routing operations to automatically trigger tasks upon operation kickoff.
            </p>
            <button
              onClick={() => {
                setEditingConfig(null);
                setIsConfigEditorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase transition"
            >
              <Plus className="w-4 h-4" /> Add Operation QCP
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {cfg.operationCode}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Sequence {cfg.sequenceNumber}
                        </span>
                        {cfg.mandatoryHoldPoint && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Hold Gate
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {cfg.operationName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Part: <strong>{cfg.partName} ({cfg.partNumber})</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingConfig(cfg);
                        setIsConfigEditorOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      Edit QCP
                    </button>
                  </div>

                  {/* Summary of 3D Pins & Tolerances */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
                      3D Part Markers & Inspection Features ({cfg.markers.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cfg.markers.map((m) => (
                        <div key={m.id} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                          <span className="font-bold text-slate-200 block truncate">{m.label}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {m.nominalValue !== undefined ? `${m.nominalValue} ${m.unit || 'mm'}` : 'Visual / Ra'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Trigger: <strong className="text-slate-300">{cfg.triggerType.replace(/_/g, ' ')}</strong></span>
                  <span>CAD Model: <strong className="text-slate-300">{cfg.partModelType}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEFECT PARETO & CAPABILITY ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              In-Process Root Cause Pareto (Machine Defect Breakdown)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time non-conformances flagged by 3D pins and shopfloor patrol tasks.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tool Chatter Vibration (Finish Ra Spike)</span>
                  <span className="font-bold text-rose-400">40% (8 Incidents)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tool Wear / Undercut on Keyway</span>
                  <span className="font-bold text-amber-400">30% (6 Incidents)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Shoulder Chamfer Parting Burrs</span>
                  <span className="font-bold text-blue-400">20% (4 Incidents)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Thermal Expansion / Setup Drift</span>
                  <span className="font-bold text-purple-400">10% (2 Incidents)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                First Article (FAI) First-Pass Yield by Machine Cell
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Comparison of station FAI approval rate and hold durations across shopfloor cells.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">CNC-04 (Mazak Quick Turn 250)</span>
                    <span className="text-[11px] text-slate-400 block">Op 20 Turning</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">97.8% FAI Yield</span>
                    <span className="text-[10px] text-slate-400">0 Active Holds</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">VMC-02 (Haas VF-4 4-Axis)</span>
                    <span className="text-[11px] text-slate-400 block">Op 30 Keyway Milling</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">88.5% FAI Yield</span>
                    <span className="text-[10px] text-rose-400">1 Interlock Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => navigate('/oee')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                View Machine Telemetry & OEE Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeTaskForInspection && (
        <IpqcInspectionTaskModal
          task={activeTaskForInspection}
          onClose={() => setActiveTaskForInspection(null)}
          onSaveMeasurement={saveMeasurement}
          onAttachPhoto={attachPhoto}
          onDeletePhoto={deletePhoto}
          onSignOff={signOffTask}
        />
      )}

      {isConfigEditorOpen && (
        <QcpConfigEditorModal
          config={editingConfig}
          onClose={() => {
            setIsConfigEditorOpen(false);
            setEditingConfig(null);
          }}
          onSaveConfig={saveQcpConfig}
        />
      )}

      {isSpawnTaskOpen && (
        <SpawnIpqcTaskModal
          configs={configs}
          onClose={() => setIsSpawnTaskOpen(false)}
          onSpawnTask={autoGenerateTask}
        />
      )}

    </div>
  );
};
