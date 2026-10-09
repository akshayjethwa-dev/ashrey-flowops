// src/components/workOrders/WorkOrderSplitModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Split,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Package,
  Plus,
  Trash2,
  Cpu,
  ShieldAlert,
  Info,
  ChevronRight
} from 'lucide-react';
import {
  WorkOrder,
  SplitChildDraft,
  SplitExecutionParams,
  ExplodedBomItem
} from '../../types/workOrder';
import { workOrderSplitMergeService } from '../../services/workOrderSplitMergeService';

interface WorkOrderSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onSplit: (params: SplitExecutionParams) => Promise<any>;
}

const SPLIT_REASONS = [
  { id: 'parallel_machines', label: 'Parallel Machine Run (Split to run on 2+ machines simultaneously)' },
  { id: 'multi_shift', label: 'Shift Allocation (Run partial batch on Morning shift, remainder on Night shift)' },
  { id: 'urgent_delivery', label: 'Urgent Partial Delivery (Expedite Child A for early customer shipment)' },
  { id: 'machine_breakdown', label: 'Machine Breakdown / Maintenance Bypass (Reroute sub-batch)' },
  { id: 'batch_optimization', label: 'Heat Treatment / Furnace Batch Size Optimization' },
  { id: 'other', label: 'Other Operational Optimization' }
];

export const WorkOrderSplitModal: React.FC<WorkOrderSplitModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSplit
}) => {
  if (!isOpen || !workOrder) return null;

  const totalParentQty = workOrder.quantity;
  const completedQty = workOrder.quantityCompleted || 0;
  const availableQty = Math.max(0, totalParentQty - completedQty);

  const [splitReason, setSplitReason] = useState<string>('parallel_machines');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'splits' | 'materials'>('splits');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initial splits state: default 2 children
  const [children, setChildren] = useState<SplitChildDraft[]>([]);

  useEffect(() => {
    if (workOrder) {
      const half1 = Math.ceil(availableQty / 2);
      const half2 = availableQty - half1;
      const baseNum = workOrder.orderNumber;

      setChildren([
        {
          childOrderNumber: `${baseNum}-A`,
          quantity: half1,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 1 (Day)',
          notes: 'Batch A - Parallel Line 1'
        },
        {
          childOrderNumber: `${baseNum}-B`,
          quantity: half2,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 2 (Night)',
          notes: 'Batch B - Parallel Line 2'
        }
      ]);
      setSubmitError(null);
    }
  }, [workOrder, availableQty]);

  // Total allocated across children
  const allocatedQty = useMemo(() => {
    return children.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
  }, [children]);

  const remainingQty = availableQty - allocatedQty;
  const isQuantityValid = allocatedQty === availableQty && allocatedQty > 0;

  // Validation
  const validation = useMemo(() => {
    return workOrderSplitMergeService.validateSplit(workOrder, children);
  }, [workOrder, children]);

  // Apply Presets
  const applyPreset = (type: '50_50' | '33_33_34' | '70_30') => {
    const baseNum = workOrder.orderNumber;
    if (type === '50_50') {
      const q1 = Math.floor(availableQty / 2);
      const q2 = availableQty - q1;
      setChildren([
        {
          childOrderNumber: `${baseNum}-A`,
          quantity: q1,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 1 (Day)'
        },
        {
          childOrderNumber: `${baseNum}-B`,
          quantity: q2,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 2 (Night)'
        }
      ]);
    } else if (type === '33_33_34') {
      const q1 = Math.floor(availableQty / 3);
      const q2 = Math.floor(availableQty / 3);
      const q3 = availableQty - q1 - q2;
      setChildren([
        {
          childOrderNumber: `${baseNum}-A`,
          quantity: q1,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 1'
        },
        {
          childOrderNumber: `${baseNum}-B`,
          quantity: q2,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 2'
        },
        {
          childOrderNumber: `${baseNum}-C`,
          quantity: q3,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          targetShiftName: 'Shift 3'
        }
      ]);
    } else if (type === '70_30') {
      const q1 = Math.round(availableQty * 0.7);
      const q2 = availableQty - q1;
      setChildren([
        {
          childOrderNumber: `${baseNum}-A`,
          quantity: q1,
          dueDate: workOrder.dueDate,
          priority: 'urgent',
          notes: 'Expedited Early Delivery'
        },
        {
          childOrderNumber: `${baseNum}-B`,
          quantity: q2,
          dueDate: workOrder.dueDate,
          priority: workOrder.priority,
          notes: 'Standard Delivery'
        }
      ]);
    }
  };

  const handleAddChild = () => {
    const letter = String.fromCharCode(65 + children.length);
    const newQty = remainingQty > 0 ? remainingQty : 1;
    setChildren(prev => [
      ...prev,
      {
        childOrderNumber: `${workOrder.orderNumber}-${letter}`,
        quantity: newQty,
        dueDate: workOrder.dueDate,
        priority: workOrder.priority,
        targetShiftName: `Shift ${prev.length + 1}`
      }
    ]);
  };

  const handleRemoveChild = (index: number) => {
    if (children.length <= 2) return;
    setChildren(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateChild = (index: number, patch: Partial<SplitChildDraft>) => {
    setChildren(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // Submit execution
  const handleSubmit = async () => {
    if (!validation.valid) {
      setSubmitError(validation.errors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const effectiveReason = splitReason === 'other' 
        ? (customReasonText.trim() || 'Custom operational split')
        : (SPLIT_REASONS.find(r => r.id === splitReason)?.label || splitReason);

      const params: SplitExecutionParams = {
        parentWorkOrderId: workOrder.id,
        splitReason: effectiveReason,
        splits: children,
        archiveParent: true
      };

      await onSplit(params);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to split work order');
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
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Split className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-100">
                  Split Work Order
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">
                  {workOrder.orderNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Qty: {workOrder.quantity} pcs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Part: <span className="text-slate-200 font-medium">{workOrder.partName}</span> ({workOrder.partCode || 'N/A'}) • Customer: <span className="text-slate-300">{workOrder.customerName}</span>
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

        {/* ── Quantity Balance Bar & Quick Presets ────────────────── */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Available Qty</span>
              <span className="font-mono text-lg font-bold text-slate-100">{availableQty} <span className="text-xs text-slate-400 font-normal">pcs</span></span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Total Split Qty</span>
              <span className={`font-mono text-lg font-bold ${isQuantityValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allocatedQty} <span className="text-xs text-slate-400 font-normal">pcs</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Balance</span>
              <span className={`font-mono text-lg font-bold ${remainingQty === 0 ? 'text-emerald-400' : remainingQty < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {remainingQty > 0 ? `+${remainingQty}` : remainingQty} <span className="text-xs text-slate-400 font-normal">pcs</span>
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('50_50')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              50 / 50 Equal
            </button>
            <button
              type="button"
              onClick={() => applyPreset('33_33_34')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              3-Way Equal
            </button>
            <button
              type="button"
              onClick={() => applyPreset('70_30')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              70 / 30 Rush
            </button>
          </div>
        </div>

        {/* ── Sub-navigation Tabs ──────────────────────────────────── */}
        <div className="px-6 pt-3 flex border-b border-slate-800 gap-4 bg-slate-900">
          <button
            onClick={() => setActiveTab('splits')}
            className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'splits'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Child Work Orders ({children.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-2.5 px-1 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'materials'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Material Allocation Breakdown
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
              {workOrder.bomItems?.length || 0} items
            </span>
          </button>
        </div>

        {/* ── Modal Body ──────────────────────────────────────────── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Reason Section */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Reason for Splitting Work Order
            </label>
            <select
              value={splitReason}
              onChange={(e) => setSplitReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {SPLIT_REASONS.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>

            {splitReason === 'other' && (
              <input
                type="text"
                placeholder="Specify reason for split..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* TAB 1: CHILD ORDERS CONFIGURATION */}
          {activeTab === 'splits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Configure Child Production Batches
                </span>
                <button
                  type="button"
                  onClick={handleAddChild}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Child Batch
                </button>
              </div>

              <div className="space-y-3">
                {children.map((child, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={child.childOrderNumber}
                          onChange={(e) => handleUpdateChild(idx, { childOrderNumber: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-indigo-200 font-bold focus:outline-none focus:border-indigo-500"
                          placeholder="Child WO #"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-slate-400">Batch Qty:</label>
                          <input
                            type="number"
                            min="1"
                            max={availableQty}
                            value={child.quantity}
                            onChange={(e) => handleUpdateChild(idx, { quantity: parseInt(e.target.value) || 0 })}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500 text-right"
                          />
                          <span className="text-xs text-slate-400">pcs</span>
                        </div>

                        {children.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Remove child batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-850">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          Target Shift / Machine
                        </label>
                        <input
                          type="text"
                          value={child.targetShiftName || ''}
                          onChange={(e) => handleUpdateChild(idx, { targetShiftName: e.target.value })}
                          placeholder="e.g. Shift 1 (Day) / CNC-02"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={child.dueDate}
                          onChange={(e) => handleUpdateChild(idx, { dueDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                          Priority
                        </label>
                        <select
                          value={child.priority || 'high'}
                          onChange={(e) => handleUpdateChild(idx, { priority: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROPORTIONAL MATERIAL ALLOCATION BREAKDOWN */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  FlowOps automatically calculates proportional raw materials and bought-out hardware required for each child batch. Stock availability is verified against warehouse inventory.
                </p>
              </div>

              {validation.allocations.map((alloc, childIdx) => (
                <div key={childIdx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                  <div className="px-4 py-2.5 bg-slate-850 flex items-center justify-between border-b border-slate-800">
                    <span className="text-xs font-bold font-mono text-indigo-300">
                      Child Batch {alloc.childOrderNumber} — {alloc.quantity} pcs
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {alloc.bomItems.length} BOM components allocated
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3">Part Number</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Per Unit</th>
                        <th className="py-2.5 px-3 text-right">Required Qty</th>
                        <th className="py-2.5 px-3 text-right">Available Stock</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {alloc.bomItems.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-900/60">
                          <td className="py-2 px-3 font-mono text-slate-200">{item.partNumber}</td>
                          <td className="py-2 px-3 text-slate-300 max-w-xs truncate">{item.description}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-400">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">{item.quantityPerUnit} {item.unit}</td>
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
                                : item.allocatedStatus === 'partial'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {item.allocatedStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Validation Errors Display */}
          {validation.errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Please correct the following:</span>
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
            <span>Parent Status after split:</span>
            <span className="font-semibold text-slate-300">Archived (Status: 'split')</span>
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
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Child Orders...
                </>
              ) : (
                <>
                  <Split className="w-3.5 h-3.5" />
                  Execute Split ({children.length} Child Orders)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
