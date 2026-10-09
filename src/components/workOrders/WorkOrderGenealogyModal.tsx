// src/components/workOrders/WorkOrderGenealogyModal.tsx

import React, { useMemo } from 'react';
import {
  X,
  GitBranch,
  Split,
  Merge,
  ArrowRight,
  ArrowDown,
  Layers,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  ShieldCheck,
  Package
} from 'lucide-react';
import { WorkOrder } from '../../types/workOrder';
import { workOrderSplitMergeService } from '../../services/workOrderSplitMergeService';

interface WorkOrderGenealogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string | null;
  allWorkOrders: WorkOrder[];
  onSelectWorkOrder?: (woId: string) => void;
}

export const WorkOrderGenealogyModal: React.FC<WorkOrderGenealogyModalProps> = ({
  isOpen,
  onClose,
  workOrderId,
  allWorkOrders,
  onSelectWorkOrder
}) => {
  if (!isOpen || !workOrderId) return null;

  const targetWo = allWorkOrders.find(w => w.id === workOrderId);
  const genealogy = useMemo(() => {
    return workOrderSplitMergeService.getWorkOrderGenealogy(workOrderId, allWorkOrders);
  }, [workOrderId, allWorkOrders]);

  if (!targetWo) return null;

  const isChild = !!targetWo.parentWorkOrderId;
  const isSplitParent = !!targetWo.isSplitParent;
  const isMerged = !!targetWo.isMerged;
  const isMergedSource = targetWo.status === 'merged';

  // Parent Order if this is a child
  const parentWo = isChild ? allWorkOrders.find(w => w.id === targetWo.parentWorkOrderId) : null;
  // Children if this is a parent
  const childWos = isSplitParent 
    ? allWorkOrders.filter(w => targetWo.childWorkOrderIds?.includes(w.id))
    : [];
  // Siblings if this is a child
  const siblingWos = isChild 
    ? allWorkOrders.filter(w => w.parentWorkOrderId === targetWo.parentWorkOrderId && w.id !== targetWo.id)
    : [];
  // Sources if this is a merged order
  const mergedSources = isMerged
    ? allWorkOrders.filter(w => targetWo.mergedFromWorkOrderIds?.includes(w.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* ── Modal Header ────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-100">
                  Work Order Genealogy &amp; Traceability
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                  {targetWo.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lineage tracking, parent-child relationships, and operational split/merge history.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ──────────────────────────────────────────── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Family Tree Visual Diagram */}
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Lineage Relationship Tree
            </span>

            {/* SCENARIO 1: THIS ORDER IS A CHILD */}
            {isChild && parentWo && (
              <div className="space-y-4">
                {/* Parent Node */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                      <Split className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Original Parent Work Order</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">{parentWo.orderNumber}</span>
                        <span className="text-xs text-slate-400">Total Qty: {parentWo.quantity} pcs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Status: {parentWo.status}
                    </span>
                    {onSelectWorkOrder && (
                      <button
                        onClick={() => { onSelectWorkOrder(parentWo.id); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Parent WO"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Arrow down */}
                <div className="flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-slate-700" />
                    <span className="text-[10px] font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Split into {(parentWo.childOrderNumbers || []).length} child batches
                    </span>
                    <div className="h-4 w-0.5 bg-slate-700" />
                  </div>
                </div>

                {/* Children / Siblings List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-indigo-600/40">
                  {/* Current Target Child */}
                  <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/60 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-teal-400">Current Order (Child)</span>
                      <span className="text-xs font-mono font-bold text-teal-300">{targetWo.quantity} pcs</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-100 mt-1">{targetWo.orderNumber}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Split Ratio: {targetWo.splitRatio ? `${(targetWo.splitRatio * 100).toFixed(0)}%` : 'N/A'} of parent
                    </p>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Due: {targetWo.dueDate} • Status: <strong className="text-slate-200">{targetWo.status}</strong>
                    </div>
                  </div>

                  {/* Sibling Children */}
                  {siblingWos.map(sib => (
                    <div key={sib.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Sibling Batch</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{sib.quantity} pcs</span>
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-200 mt-1">{sib.orderNumber}</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {sib.dueDate} • Status: <span className="text-slate-300">{sib.status}</span>
                      </p>
                      {onSelectWorkOrder && (
                        <button
                          onClick={() => onSelectWorkOrder(sib.id)}
                          className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          View Batch <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCENARIO 2: THIS ORDER WAS SPLIT INTO CHILDREN */}
            {isSplitParent && (
              <div className="space-y-4">
                {/* Current Parent Node */}
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300">
                      <Split className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Parent Work Order (This Order)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">{targetWo.orderNumber}</span>
                        <span className="text-xs text-slate-400">Original Total Qty: {targetWo.quantity} pcs</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                    Split into {childWos.length} Batches
                  </span>
                </div>

                <div className="flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-slate-700" />
                    <span className="text-[10px] font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Child Batches
                    </span>
                    <div className="h-4 w-0.5 bg-slate-700" />
                  </div>
                </div>

                {/* Child Orders Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-indigo-600/40">
                  {childWos.map(child => (
                    <div key={child.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-indigo-300">{child.orderNumber}</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{child.quantity} pcs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Due: {child.dueDate} • Status: <strong className="text-slate-200">{child.status}</strong>
                      </p>
                      {onSelectWorkOrder && (
                        <button
                          onClick={() => onSelectWorkOrder(child.id)}
                          className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          View Child Batch <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCENARIO 3: THIS ORDER IS A MERGED RUN */}
            {isMerged && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Source Orders Combined</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mergedSources.map(src => (
                    <div key={src.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-purple-300">{src.orderNumber}</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{src.quantity} pcs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Customer: {src.customerName}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-slate-700" />
                    <span className="text-[10px] font-mono text-purple-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Consolidated into
                    </span>
                    <div className="h-4 w-0.5 bg-slate-700" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-400">Current Order (Consolidated)</span>
                    <div className="font-mono font-bold text-base text-slate-100">{targetWo.orderNumber}</div>
                    <p className="text-xs text-slate-400">Combined Quantity: {targetWo.quantity} pcs</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                    Merged Run
                  </span>
                </div>
              </div>
            )}

            {/* STANDARD ORDER WITHOUT SPLIT/MERGE */}
            {!isChild && !isSplitParent && !isMerged && (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>This work order is an original standard production batch (not split or merged).</p>
                <p className="text-slate-500">
                  You can split this order into smaller child batches from the Work Orders table or detail view.
                </p>
              </div>
            )}
          </div>

          {/* Audit History & Genealogy Events Timeline */}
          {genealogy.events.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Genealogy Event Log
              </span>

              <div className="space-y-2.5">
                {genealogy.events.map((evt, i) => (
                  <div
                    key={evt.id || i}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-850 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-850 text-slate-300 mt-0.5 shrink-0">
                      {evt.type === 'split' ? (
                        <Split className="w-3.5 h-3.5 text-indigo-400" />
                      ) : evt.type === 'merged' ? (
                        <Merge className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <GitBranch className="w-3.5 h-3.5 text-teal-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          {evt.description}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          {evt.userName || 'Supervisor'}
                        </span>
                        {evt.details?.splitReason && (
                          <span>Reason: <em className="text-slate-300">{evt.details.splitReason}</em></span>
                        )}
                        {evt.details?.mergedReason && (
                          <span>Reason: <em className="text-slate-300">{evt.details.mergedReason}</em></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ────────────────────────────────────────── */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
