// src/components/routings/VisualRoutingFlowDiagram.tsx

import React from 'react';
import { 
  ArrowRight, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  Boxes, 
  ChevronRight, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  Trash2, 
  Sparkles,
  Scissors,
  Flame,
  Cpu,
  Eye,
  Package,
  Layers,
  Building2,
  CheckCircle2,
  Award
} from 'lucide-react';
import { 
  ProductRouting, 
  RoutingOperation, 
  OperationType,
  WorkCenter 
} from '../../types/routing';

interface VisualRoutingFlowDiagramProps {
  routing: ProductRouting;
  workCenters: WorkCenter[];
  onSelectOperation?: (op: RoutingOperation) => void;
  onEditOperation: (op: RoutingOperation) => void;
  onDeleteOperation: (opId: string) => void;
  onMoveOperation: (opId: string, direction: 'up' | 'down') => void;
  selectedOperationId?: string;
  isReadOnly?: boolean;
}

const OP_TYPE_ICONS: Record<OperationType, React.ComponentType<{ className?: string }>> = {
  cutting: Scissors,
  welding: Flame,
  machining: Cpu,
  turning: Cpu,
  milling: Cpu,
  heat_treatment: Flame,
  surface_treatment: Sparkles,
  inspection: Eye,
  assembly: Layers,
  packing: Package,
  subcontract: Building2
};

const OP_TYPE_COLORS: Record<OperationType, { bg: string; text: string; border: string; accent: string }> = {
  cutting: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', accent: 'bg-amber-500' },
  welding: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', accent: 'bg-orange-500' },
  machining: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', accent: 'bg-indigo-500' },
  turning: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', accent: 'bg-sky-500' },
  milling: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', accent: 'bg-blue-500' },
  heat_treatment: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', accent: 'bg-rose-500' },
  surface_treatment: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', accent: 'bg-purple-500' },
  inspection: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: 'bg-emerald-500' },
  assembly: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', accent: 'bg-teal-500' },
  packing: { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30', accent: 'bg-slate-400' },
  subcontract: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', accent: 'bg-cyan-500' }
};

export const VisualRoutingFlowDiagram: React.FC<VisualRoutingFlowDiagramProps> = ({
  routing,
  workCenters,
  onSelectOperation,
  onEditOperation,
  onDeleteOperation,
  onMoveOperation,
  selectedOperationId,
  isReadOnly = false
}) => {
  const sortedOperations = [...routing.operations].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  return (
    <div className="space-y-4">
      {/* Horizontal Flow Stepper Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 overflow-x-auto shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Operation Sequence Pipeline ({sortedOperations.length} Steps)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {routing.partNumber}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total Cycle: <strong className="text-white">{routing.totalCycleTimeMinutes}m</strong> • Total Setup: <strong className="text-white">{routing.totalSetupTimeMinutes}m</strong>
          </span>
        </div>

        {/* Stepper Chain */}
        <div className="flex items-center gap-2 min-w-max py-2">
          {sortedOperations.map((op, idx) => {
            const Icon = OP_TYPE_ICONS[op.operationType] || Wrench;
            const colors = OP_TYPE_COLORS[op.operationType] || OP_TYPE_COLORS.machining;
            const isSelected = selectedOperationId === op.id;

            return (
              <React.Fragment key={op.id}>
                {/* Step Card */}
                <div
                  onClick={() => onSelectOperation && onSelectOperation(op)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer w-48 shrink-0 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    {/* Header: Seq & Type badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        Op {op.sequenceNumber}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${colors.bg} ${colors.text} ${colors.border}`}>
                        {op.operationType}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${colors.bg} ${colors.text} ${colors.border}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs font-bold text-white leading-tight line-clamp-2">
                        {op.name}
                      </div>
                    </div>
                  </div>

                  {/* Work Center & Cycle Time */}
                  <div className="pt-2 border-t border-slate-800/60 space-y-1 font-mono text-[10px]">
                    <div className="text-slate-400 truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{op.workCenterCode || op.workCenterName}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Run: <strong className="text-white">{op.cycleTimeMinutes}m</strong>
                      </span>
                      <span className="text-slate-500">
                        Set: {op.setupTimeMinutes}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connecting Arrow */}
                {idx < sortedOperations.length - 1 && (
                  <div className="flex items-center text-slate-600 shrink-0">
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detailed Operations Sequence List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Detailed Operations Master Sequence
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Step-by-step instructions for CNC operators & technicians
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {sortedOperations.map((op, idx) => {
            const Icon = OP_TYPE_ICONS[op.operationType] || Wrench;
            const colors = OP_TYPE_COLORS[op.operationType] || OP_TYPE_COLORS.machining;

            return (
              <div 
                key={op.id}
                className="p-4 sm:p-5 hover:bg-slate-850/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Column: Seq, Icon, Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Sequence Badge */}
                  <div className="flex flex-col items-center justify-center pt-0.5 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono text-white">
                      <span className="text-[9px] uppercase text-slate-400 leading-none">Seq</span>
                      <span className="text-sm font-bold leading-tight">{op.sequenceNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Header Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                        <Icon className="w-3 h-3" />
                        {op.operationType}
                      </span>

                      <span className="font-mono text-xs font-bold text-white">
                        {op.operationCode}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {op.workCenterName} ({op.workCenterCode})
                      </span>

                      {op.skillLevel && (
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded capitalize flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {op.skillLevel.replace('_', ' ')}
                        </span>
                      )}

                      {op.isSubcontracted && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          Subcontract: {op.subcontractorName || 'Outside Vendor'}
                        </span>
                      )}
                    </div>

                    {/* Operation Title */}
                    <h4 className="text-sm font-bold text-slate-100">
                      {op.name}
                    </h4>

                    {/* Step-by-Step Operator Instructions */}
                    {op.instructions && (
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                        <strong className="text-slate-400">Work Instructions: </strong>
                        {op.instructions}
                      </p>
                    )}

                    {/* Metadata tags: Tooling, QC criteria, Safety PPE */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-0.5">
                      {op.toolingFixtures && (
                        <span>
                          <strong className="text-slate-300 font-mono">Tooling: </strong>
                          {op.toolingFixtures}
                        </span>
                      )}

                      {op.qualityInspectionCriteria && (
                        <span className="text-emerald-400/90 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <strong>QC: </strong> {op.qualityInspectionCriteria}
                        </span>
                      )}

                      {op.safetyPpe && op.safetyPpe.length > 0 && (
                        <span>
                          <strong className="text-amber-400 font-mono">PPE: </strong>
                          {op.safetyPpe.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Time Parameters & Reordering */}
                <div className="flex items-center gap-5 shrink-0 self-end lg:self-center pl-2">
                  {/* Setup & Cycle metrics */}
                  <div className="grid grid-cols-2 gap-2 text-right font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Setup Time</span>
                      <span className="text-xs font-bold text-slate-200">{op.setupTimeMinutes} min</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">Cycle / Pc</span>
                      <span className="text-xs font-bold text-emerald-400">{op.cycleTimeMinutes} min</span>
                    </div>
                  </div>

                  {/* Actions & Reordering */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveOperation(op.id, 'up')}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Move Up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === sortedOperations.length - 1}
                        onClick={() => onMoveOperation(op.id, 'down')}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Move Down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-slate-800 mx-1" />

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditOperation(op)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Operation"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteOperation(op.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Operation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
