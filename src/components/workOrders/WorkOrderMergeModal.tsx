// src/components/workOrders/WorkOrderMergeModal.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Layers,
  Merge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Package,
  TrendingDown,
  Info,
  ShieldAlert,
  Check
} from 'lucide-react';
import {
  WorkOrder,
  MergeExecutionParams,
  WorkOrderPriority,
  ExplodedBomItem
} from '../../types/workOrder';
import { workOrderSplitMergeService } from '../../services/workOrderSplitMergeService';

interface WorkOrderMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedOrders?: WorkOrder[];
  allAvailableOrders: WorkOrder[];
  onMerge: (params: MergeExecutionParams) => Promise<any>;
}

const MERGE_REASONS = [
  { id: 'setup_savings', label: 'Setup Time Reduction (Single machine setup instead of multiple small runs)' },
  { id: 'material_heat_lot', label: 'Heat Lot Consolidation (Process all identical parts using the same raw material billet lot)' },
  { id: 'tooling_economy', label: 'Tooling Wear Optimization (Run continuous CNC cycle to minimize tool indexing)' },
  { id: 'customer_bundling', label: 'Customer Order Bundling (Combine multiple line items for unified shipment)' },
  { id: 'other', label: 'Other Operational Efficiency' }
];

export const WorkOrderMergeModal: React.FC<WorkOrderMergeModalProps> = ({
  isOpen,
  onClose,
  initialSelectedOrders = [],
  allAvailableOrders,
  onMerge
}) => {
  if (!isOpen) return null;

  // Selected Order IDs
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [targetOrderNumber, setTargetOrderNumber] = useState<string>('');
  const [targetDueDate, setTargetDueDate] = useState<string>('');
  const [priority, setPriority] = useState<WorkOrderPriority>('high');
  const [mergeReason, setMergeReason] = useState<string>('setup_savings');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize selected orders
  useEffect(() => {
    if (initialSelectedOrders.length > 0) {
      setSelectedOrderIds(initialSelectedOrders.map(o => o.id));
      const base = initialSelectedOrders[0];
      setTargetOrderNumber(`${base.orderNumber}-M`);
      
      // Earliest due date
      const earliestDue = initialSelectedOrders.reduce((earliest, o) => {
        return !earliest || o.dueDate < earliest ? o.dueDate : earliest;
      }, '');
      setTargetDueDate(earliestDue || base.dueDate);

      // Highest priority
      const priorities: WorkOrderPriority[] = ['urgent', 'high', 'medium', 'low'];
      const highestPri = initialSelectedOrders.reduce<WorkOrderPriority>((highest, o) => {
        return priorities.indexOf(o.priority) < priorities.indexOf(highest) ? o.priority : highest;
      }, 'low');
      setPriority(highestPri);
    } else {
      setSelectedOrderIds([]);
    }
    setSubmitError(null);
  }, [initialSelectedOrders, isOpen]);

  // Selected Work Orders objects
  const selectedOrders = useMemo(() => {
    return allAvailableOrders.filter(o => selectedOrderIds.includes(o.id));
  }, [allAvailableOrders, selectedOrderIds]);

  // Candidate orders that match the part of the currently selected group
  const compatibleCandidates = useMemo(() => {
    if (selectedOrders.length === 0) {
      // Show all active orders eligible for merging
      return allAvailableOrders.filter(
        o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'merged'
      );
    }
    const targetPart = selectedOrders[0].partName;
    return allAvailableOrders.filter(
      o => o.partName === targetPart &&
           o.status !== 'completed' &&
           o.status !== 'cancelled' &&
           o.status !== 'merged'
    );
  }, [allAvailableOrders, selectedOrders]);

  // Validation
  const validation = useMemo(() => {
    return workOrderSplitMergeService.validateMerge(selectedOrders);
  }, [selectedOrders]);

  const toggleOrderSelection = (wo: WorkOrder) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(wo.id)) {
        return prev.filter(id => id !== wo.id);
      } else {
        const next = [...prev, wo.id];
        // If this is the first order selected, set default target number & date
        if (prev.length === 0) {
          setTargetOrderNumber(`${wo.orderNumber}-M`);
          setTargetDueDate(wo.dueDate);
          setPriority(wo.priority);
        }
        return next;
      }
    });
  };

  const handleSubmit = async () => {
    if (!validation.valid) {
      setSubmitError(validation.errors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const effectiveReason = mergeReason === 'other'
        ? (customReasonText.trim() || 'Custom operational consolidation')
        : (MERGE_REASONS.find(r => r.id === mergeReason)?.label || mergeReason);

      const params: MergeExecutionParams = {
        sourceWorkOrderIds: selectedOrderIds,
        targetOrderNumber: targetOrderNumber.trim(),
        dueDate: targetDueDate,
        priority,
        mergedReason: effectiveReason,
        notes: notes.trim()
      };

      await onMerge(params);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to merge work orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* ── Modal Header ────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Merge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-100">
                  Merge Work Orders into Consolidated Batch
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-semibold">
                  {selectedOrders.length} Orders Selected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Combine small orders for the same component to save setup hours and optimize machine throughput.
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

        {/* ── Efficiency Savings Banner ────────────────────────────── */}
        {selectedOrders.length >= 2 && validation.valid && (
          <div className="px-6 py-3.5 bg-purple-950/40 border-b border-purple-800/60 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-4 h-4 text-purple-400" />
              <span>
                Estimated Setup Savings: <strong className="text-purple-300 font-mono text-sm">~{validation.estimatedSetupSavingsMinutes} mins</strong> saved by eliminating redundant tool changes!
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Combined Batch Qty: <strong className="font-mono text-white text-sm">{validation.combinedQuantity} pcs</strong></span>
            </div>
          </div>
        )}

        {/* ── Modal Body ──────────────────────────────────────────── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Step 1: Select Orders */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Select Work Orders to Merge (Must be same part)
              </span>
              <span className="text-[11px] text-slate-400">
                {compatibleCandidates.length} compatible orders available
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950/60">
              {compatibleCandidates.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No compatible active orders found to merge.
                </div>
              ) : (
                compatibleCandidates.map(wo => {
                  const isChecked = selectedOrderIds.includes(wo.id);
                  return (
                    <div
                      key={wo.id}
                      onClick={() => toggleOrderSelection(wo)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-purple-950/40 border-purple-600/80 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-slate-700 bg-slate-800'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-purple-300">{wo.orderNumber}</span>
                            <span className="text-xs font-semibold text-slate-200">{wo.partName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({wo.partCode || 'N/A'})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Customer: {wo.customerName} • Due: {wo.dueDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-100 block">{wo.quantity} pcs</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{wo.priority}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Target Consolidated Order Details */}
          {selectedOrders.length >= 2 && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">
                Consolidated Work Order Configuration
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Merged Work Order #
                  </label>
                  <input
                    type="text"
                    value={targetOrderNumber}
                    onChange={(e) => setTargetOrderNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                    placeholder="WO-XXXX-M"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Committed Due Date
                  </label>
                  <input
                    type="date"
                    value={targetDueDate}
                    onChange={(e) => setTargetDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Merge Reason */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-400" />
                  Reason for Merging Orders
                </label>
                <select
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {MERGE_REASONS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>

                {mergeReason === 'other' && (
                  <input
                    type="text"
                    placeholder="Specify reason for merge..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Consolidated Material Requirements Table */}
          {validation.consolidatedBom.length > 0 && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
              <div className="px-4 py-2.5 bg-slate-850 flex items-center justify-between border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  Consolidated Raw Material &amp; Component Requirements
                </span>
                <span className="text-[11px] text-slate-400">
                  {validation.consolidatedBom.length} components
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3">Part Number</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Combined Qty</th>
                    <th className="py-2.5 px-3 text-right">Stock Available</th>
                    <th className="py-2.5 px-3">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {validation.consolidatedBom.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="py-2 px-3 font-mono text-slate-200">{item.partNumber}</td>
                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate">{item.description}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-400">
                          {item.itemType}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-100 text-right">
                        {item.totalRequiredQuantity} {item.unit}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300 text-right">
                        {item.stockAvailable ?? 'N/A'} {item.unit}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.allocatedStatus === 'allocated'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.allocatedStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Errors */}
          {validation.errors.length > 0 && selectedOrders.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Please check selection:</span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-200/90">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* ── Modal Footer ────────────────────────────────────────── */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Source orders status:</span>
            <span className="font-semibold text-slate-300">Marked as 'merged' &amp; consolidated</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!validation.valid || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition ${
                validation.valid && !isSubmitting
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Merging Orders...
                </>
              ) : (
                <>
                  <Merge className="w-3.5 h-3.5" />
                  Merge &amp; Create Consolidated Order ({validation.combinedQuantity} pcs)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
