// src/pages/engineering/RoutingsPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCommit, 
  Layers, 
  Building2, 
  Clock, 
  Wrench, 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  Award, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Scissors,
  Flame,
  Cpu,
  Eye,
  Package,
  CalendarClock
} from 'lucide-react';
import { useRoutings } from '../../hooks/useRoutings';
import { VisualRoutingFlowDiagram } from '../../components/routings/VisualRoutingFlowDiagram';
import { RoutingOperationEditorModal } from '../../components/routings/RoutingOperationEditorModal';
import { BatchTimeEstimatorCard } from '../../components/routings/BatchTimeEstimatorCard';
import { WorkCenterModal } from '../../components/routings/WorkCenterModal';
import { OperationMasterModal } from '../../components/routings/OperationMasterModal';
import { CreateRoutingModal } from '../../components/routings/CreateRoutingModal';
import { ShopTravelerPrintModal } from '../../components/routings/ShopTravelerPrintModal';
import { 
  ProductRouting, 
  RoutingOperation, 
  WorkCenter, 
  OperationMasterItem 
} from '../../types/routing';

type RoutingTab = 'routing' | 'master_ops' | 'work_centers';

export const RoutingsPage: React.FC = () => {
  const {
    routings,
    workCenters,
    operationMaster,
    selectedRouting,
    selectedRoutingId,
    loading,
    error,
    selectRouting,
    saveRouting,
    deleteRouting,
    duplicateRouting,
    addOperation,
    updateOperation,
    deleteOperation,
    renumberSequences,
    moveOperation,
    saveWorkCenter,
    saveMasterOp
  } = useRoutings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<RoutingTab>('routing');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isOpEditorOpen, setIsOpEditorOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<RoutingOperation | null>(null);
  const [isWcModalOpen, setIsWcModalOpen] = useState(false);
  const [editingWc, setEditingWc] = useState<WorkCenter | null>(null);
  const [isMasterOpModalOpen, setIsMasterOpModalOpen] = useState(false);
  const [editingMasterOp, setEditingMasterOp] = useState<OperationMasterItem | null>(null);
  const [isCreateRoutingOpen, setIsCreateRoutingOpen] = useState(false);
  const [isTravelerPrintOpen, setIsTravelerPrintOpen] = useState(false);

  // KPIs
  const totalRoutingsCount = routings.length;
  const activeWcCount = workCenters.filter(w => w.status === 'active').length;
  const masterOpsCount = operationMaster.length;
  const currentTotalOps = selectedRouting?.operations.length || 0;
  const currentStdCost = selectedRouting?.totalStandardCostPerUnit || 0;

  // Filtered Routings
  const filteredRoutings = useMemo(() => {
    return routings.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      return !q || 
        r.routingNumber.toLowerCase().includes(q) ||
        r.partNumber.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q));
    });
  }, [routings, searchQuery]);

  // Next proposed sequence number (e.g. 10, 20, 30...)
  const nextSeq = useMemo(() => {
    if (!selectedRouting || selectedRouting.operations.length === 0) return 10;
    const maxSeq = Math.max(...selectedRouting.operations.map(o => o.sequenceNumber));
    return maxSeq + 10;
  }, [selectedRouting]);

  // Handlers
  const handleOpenAddOp = () => {
    setEditingOp(null);
    setIsOpEditorOpen(true);
  };

  const handleOpenEditOp = (op: RoutingOperation) => {
    setEditingOp(op);
    setIsOpEditorOpen(true);
  };

  const handleSaveOpData = async (opData: Omit<RoutingOperation, 'id'>) => {
    if (!selectedRouting) return;
    if (editingOp) {
      await updateOperation(selectedRouting.id, editingOp.id, opData);
    } else {
      await addOperation(selectedRouting.id, opData);
    }
  };

  const handleDeleteOp = async (opId: string) => {
    if (!selectedRouting) return;
    if (window.confirm('Are you sure you want to delete this operation step from the sequence?')) {
      await deleteOperation(selectedRouting.id, opId);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedRouting) return;
    const newRoutingNo = `${selectedRouting.routingNumber}-COPY`;
    const newPartNo = `${selectedRouting.partNumber}-V2`;
    await duplicateRouting(selectedRouting.id, newRoutingNo, newPartNo, 'Rev 1.0');
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global KPIs ───────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Manufacturing Engineering
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Process Plans & Work Instructions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <GitCommit className="w-8 h-8 text-indigo-400" />
              Routing & Operation Sequencing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Define standardized manufacturing operation sequences (cutting → welding → machining → inspection → packing) with machine work center assignments, standard cycle/setup times, and skill certification requirements.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedRouting && (
              <button
                type="button"
                onClick={() => setIsTravelerPrintOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                title="Print Shop Traveler Operation Sheet"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Shop Traveler SOP</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/scheduling')}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CalendarClock className="w-4 h-4 text-indigo-400" />
              <span>Capacity Scheduler</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingWc(null);
                setIsWcModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>+ Work Center</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingMasterOp(null);
                setIsMasterOpModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>+ Master Op</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ipqc')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              title="Configure Quality Control Points (QCP) and in-process checks"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Operation QCPs</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateRoutingOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Routing</span>
            </button>
          </div>
        </div>

        {/* ── KPI Stat Row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Product Routings</span>
            <span className="text-xl font-bold font-mono text-white">{totalRoutingsCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Active process plans</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Active Work Centers</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{activeWcCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Machine bays & cells</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Master Operations</span>
            <span className="text-xl font-bold font-mono text-amber-400">{masterOpsCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Standardized catalog</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Current Sequence</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{currentTotalOps} Steps</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{selectedRouting?.partNumber || '—'}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Standard Unit Cost</span>
            <span className="text-xl font-bold font-mono text-sky-400">₹{currentStdCost.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Labor + machine rate</span>
          </div>
        </div>
      </div>

      {/* ── Routing Switcher & Navigation Tabs ─────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Routing Quick Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-mono uppercase text-slate-500 shrink-0">Routing:</span>
          {routings.map((r) => {
            const isSelected = selectedRoutingId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => selectRouting(r.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2 shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>{r.routingNumber}</span>
                <span className="text-[10px] opacity-80 font-normal">({r.partNumber})</span>
              </button>
            );
          })}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'routing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Process Sequence Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('master_ops')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'master_ops' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Operation Master ({masterOpsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('work_centers')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'work_centers' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Work Centers ({activeWcCount})</span>
          </button>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}

      {/* TAB 1: Process Routing & Operations Sequence */}
      {activeTab === 'routing' && selectedRouting && (
        <div className="space-y-5">
          {/* Routing Header Card & Quick Operations Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {selectedRouting.routingNumber}
                </span>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  {selectedRouting.revision}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border capitalize text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                  {selectedRouting.status}
                </span>
                {selectedRouting.category && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {selectedRouting.category}
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-slate-200">
                {selectedRouting.partName} ({selectedRouting.partNumber})
              </h2>

              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {selectedRouting.description}
              </p>
            </div>

            {/* Sequence Operation Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => renumberSequences(selectedRouting.id, 10)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl border border-slate-700 transition-colors"
                title="Renumber operations by 10s (10, 20, 30, 40...)"
              >
                Renumber 10, 20...
              </button>

              <button
                type="button"
                onClick={handleDuplicate}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Duplicate routing into new branch"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Clone</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddOp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Operation Step</span>
              </button>
            </div>
          </div>

          {/* Visual Routing Flow Stepper & Operations List */}
          <VisualRoutingFlowDiagram
            routing={selectedRouting}
            workCenters={workCenters}
            onEditOperation={handleOpenEditOp}
            onDeleteOperation={handleDeleteOp}
            onMoveOperation={(opId, dir) => moveOperation(selectedRouting.id, opId, dir)}
          />

          {/* Interactive Batch Time & Capacity Estimator Card */}
          <BatchTimeEstimatorCard
            routing={selectedRouting}
            workCenters={workCenters}
          />
        </div>
      )}

      {/* TAB 2: Operation Master Library */}
      {activeTab === 'master_ops' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Operation Master Library
              </h3>
              <p className="text-xs text-slate-400">
                Standardized operation specifications, default work centers, and cycle times for re-use across all product routings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingMasterOp(null);
                setIsMasterOpModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Master Operation</span>
            </button>
          </div>

          {/* Master Operations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operationMaster.map((op) => (
              <div 
                key={op.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {op.operationCode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase border bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {op.operationType}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {op.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {op.standardInstructions}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Default Work Center:</span>
                      <strong className="text-slate-200 truncate max-w-[140px]">{op.defaultWorkCenterName}</strong>
                    </div>

                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Standard Run:</span>
                      <strong className="text-emerald-400">{op.defaultCycleTimeMinutes}m / pc</strong>
                    </div>

                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Standard Setup:</span>
                      <strong className="text-slate-200">{op.defaultSetupTimeMinutes}m</strong>
                    </div>

                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Skill Level:</span>
                      <strong className="text-sky-300 capitalize">{op.skillRequirement.level.replace('_', ' ')}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMasterOp(op);
                      setIsMasterOpModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Work Centers & Machine Bays */}
      {activeTab === 'work_centers' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Work Centers & Shopfloor Machine Bays
              </h3>
              <p className="text-xs text-slate-400">
                Machine cells, CNC centers, welding bays, and metrology labs with hourly rates and shift capacity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingWc(null);
                setIsWcModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Work Center</span>
            </button>
          </div>

          {/* Work Centers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workCenters.map((wc) => (
              <div 
                key={wc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {wc.code}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                      wc.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {wc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {wc.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      {wc.department}
                    </span>
                  </div>

                  {wc.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {wc.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Machine Rate</span>
                      <strong className="text-emerald-400">₹{wc.hourlyMachineRate}/hr</strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Labor Rate</span>
                      <strong className="text-sky-300">₹{wc.hourlyLaborRate}/hr</strong>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-800/60 text-slate-400 flex items-center justify-between">
                      <span>Daily Shift Capacity:</span>
                      <strong className="text-white">{wc.capacityHoursPerDay} hrs / day</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWc(wc);
                      setIsWcModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Cell</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      <RoutingOperationEditorModal
        isOpen={isOpEditorOpen}
        onClose={() => {
          setIsOpEditorOpen(false);
          setEditingOp(null);
        }}
        onSave={handleSaveOpData}
        existingOperation={editingOp}
        nextSequenceNumber={nextSeq}
        workCenters={workCenters}
        operationMaster={operationMaster}
      />

      <WorkCenterModal
        isOpen={isWcModalOpen}
        onClose={() => {
          setIsWcModalOpen(false);
          setEditingWc(null);
        }}
        onSave={saveWorkCenter}
        existingItem={editingWc}
      />

      <OperationMasterModal
        isOpen={isMasterOpModalOpen}
        onClose={() => {
          setIsMasterOpModalOpen(false);
          setEditingMasterOp(null);
        }}
        onSave={saveMasterOp}
        existingItem={editingMasterOp}
        workCenters={workCenters}
      />

      <CreateRoutingModal
        isOpen={isCreateRoutingOpen}
        onClose={() => setIsCreateRoutingOpen(false)}
        onCreate={async (routingData) => {
          const newId = `rt_${Date.now()}`;
          const newRouting: ProductRouting = {
            id: newId,
            tenantId: 'tenant_default',
            routingNumber: routingData.routingNumber || `RT-${Date.now()}`,
            partNumber: routingData.partNumber || 'PRT-NEW-01',
            partName: routingData.partName || 'New Manufactured Part',
            description: routingData.description || '',
            category: routingData.category || 'Machined Components',
            revision: routingData.revision || 'Rev 1.0',
            status: 'draft',
            targetBatchSize: routingData.targetBatchSize || 50,
            operations: [],
            totalSetupTimeMinutes: 0,
            totalCycleTimeMinutes: 0,
            totalStandardCostPerUnit: 0,
            drawingNumber: routingData.drawingNumber,
            drawingRevision: routingData.drawingRevision,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await saveRouting(newRouting);
          selectRouting(newId);
        }}
      />

      {selectedRouting && (
        <ShopTravelerPrintModal
          isOpen={isTravelerPrintOpen}
          onClose={() => setIsTravelerPrintOpen(false)}
          routing={selectedRouting}
        />
      )}
    </div>
  );
};
