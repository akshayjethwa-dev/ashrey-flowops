// src/components/purchaseOrders/QuickPoApprovalModal.tsx

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  User,
  Building2,
  FileText,
  DollarSign
} from 'lucide-react';
import { PurchaseOrder } from '../../types/purchaseOrder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  mode: 'approve' | 'reject';
  onConfirmApprove: (poId: string, comments?: string) => Promise<any>;
  onConfirmReject: (poId: string, reason: string) => Promise<any>;
}

export const QuickPoApprovalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  mode,
  onConfirmApprove,
  onConfirmReject
}) => {
  if (!isOpen || !order) return null;

  const [commentOrReason, setCommentOrReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const isExecutiveTier = order.approvalLimitTier === 'executive_level';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reject' && !commentOrReason.trim()) {
      setError('Please provide a mandatory reason for rejecting this PO.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'approve') {
        await onConfirmApprove(order.id, commentOrReason.trim() || undefined);
      } else {
        await onConfirmReject(order.id, commentOrReason.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            mode === 'approve'
              ? 'bg-emerald-950/40 border-emerald-900/50'
              : 'bg-rose-950/40 border-rose-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                mode === 'approve'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
              }`}
            >
              {mode === 'approve' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                {mode === 'approve' ? 'Authorize Purchase Order' : 'Reject Purchase Order'}
              </h2>
              <p className="text-xs text-slate-400">
                {order.poNumber} • {order.supplierName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              {error}
            </div>
          )}

          {/* PO Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Total Order Value
                </span>
                <p className="text-2xl font-black text-white font-mono mt-0.5">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Subtotal: {formatCurrency(order.subtotal)} + 18% GST ({formatCurrency(order.totalTax)})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Approval Tier
                </span>
                <div className="mt-1">
                  {isExecutiveTier ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Tier 3: Executive VP Sign-off
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Tier 2: Procurement Manager
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500">Plant:</span> <span className="font-semibold">{order.plantName}</span>
              </div>
              <div>
                <span className="text-slate-500">Items:</span> <span className="font-semibold">{order.items.length} line item(s)</span>
              </div>
              <div>
                <span className="text-slate-500">Expected Delivery:</span>{' '}
                <span className="font-mono text-amber-300 font-bold">
                  {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Executive note */}
          {mode === 'approve' && isExecutiveTier && (
            <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
              <span>
                <strong>High-Value Authorization:</strong> This PO exceeds ₹5,00,000. Your approval will be recorded with timestamp in the permanent financial audit trail and will release the order for supplier dispatch.
              </span>
            </div>
          )}

          {/* Comment / Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>{mode === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}</span>
              {mode === 'reject' && <span className="text-rose-400 text-[10px]">* Mandatory</span>}
            </label>
            <textarea
              rows={3}
              value={commentOrReason}
              onChange={(e) => setCommentOrReason(e.target.value)}
              placeholder={
                mode === 'approve'
                  ? 'e.g. Budget pre-cleared against Q4 forging schedule...'
                  : 'e.g. Unit price exceeds quotation benchmark, renegotiate terms...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer ${
                mode === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {mode === 'approve' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Approving PO...' : 'Confirm Approval & Release'}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {submitting ? 'Rejecting PO...' : 'Confirm Rejection'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
