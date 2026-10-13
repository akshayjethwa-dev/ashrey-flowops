// src/components/mrp/ConvertToPoModal.tsx

import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building2,
  Warehouse,
  Boxes,
  Truck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { MrpPurchaseRecommendation } from '../../types/mrp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recommendation: MrpPurchaseRecommendation | null;
  onConfirm: (
    recommendationId: string,
    params: { poNumber: string; notes?: string }
  ) => Promise<any>;
}

export const ConvertToPoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recommendation,
  onConfirm
}) => {
  if (!isOpen || !recommendation) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const defaultPoNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [poNumber, setPoNumber] = useState(defaultPoNumber);
  const [notes, setNotes] = useState(
    `Generated via MRP Engine against demands for ${recommendation.demandsBreakdown.length} scheduled production orders.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(recommendation.id, {
        poNumber: poNumber.trim().toUpperCase(),
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to convert to purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Convert Recommendation to Purchase Order
              </h2>
              <p className="text-xs text-slate-400">
                Generate official vendor PO & update in-transit on-order inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Material Highlight Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">
                  {recommendation.stockItemCode}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {recommendation.stockItemName}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Supplier: {recommendation.preferredSupplierName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Recommended Qty</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {recommendation.recommendedOrderQty} {recommendation.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                <span className="font-bold text-slate-200">
                  {formatCurrency(recommendation.unitCost)} / {recommendation.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Total Est. PO Value</span>
                <span className="font-extrabold text-white text-sm">
                  {formatCurrency(recommendation.totalEstimatedCost)}
                </span>
              </div>
            </div>
          </div>

          {/* PO Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                Purchase Order Number *
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                Target Facility / Receiving Dock
              </label>
              <input
                type="text"
                disabled
                value={`${recommendation.plantName}`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                Order Release Date (PO Date)
              </label>
              <input
                type="text"
                disabled
                value={recommendation.orderByDate}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                Expected Dock Delivery Date
              </label>
              <input
                type="text"
                disabled
                value={recommendation.expectedDeliveryDate}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
              PO Remarks / Buyer Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Demand Source Traceability */}
          {recommendation.demandsBreakdown.length > 0 && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">
                Driven by Scheduled Work Orders:
              </span>
              <div className="space-y-1">
                {recommendation.demandsBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                    <span>• {d.workOrderNumber} ({d.productPartName})</span>
                    <span className="text-slate-400">{d.qty} {recommendation.unit} (Need: {d.requiredDate})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Creating Purchase Order...' : 'Confirm & Issue Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
