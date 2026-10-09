// src/components/inventory/StockAdjustModal.tsx

import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ArrowRight
} from 'lucide-react';
import { BinStockRecord } from '../../types/inventoryLocation';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BinStockRecord | null;
  onAdjustStock: (params: {
    binStockId: string;
    newOnHandQty: number;
    reason: string;
  }) => Promise<any>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  record,
  onAdjustStock
}) => {
  const [newQty, setNewQty] = useState<number | ''>(record?.onHandQty ?? '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'err' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    if (record) {
      setNewQty(record.onHandQty);
      setReason('');
      setMsg(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const currentOnHand = record.onHandQty;
  const numNewQty = typeof newQty === 'number' ? newQty : 0;
  const variance = numNewQty - currentOnHand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (numNewQty < 0) {
      setMsg({ type: 'err', text: 'On-hand quantity cannot be negative.' });
      return;
    }
    if (numNewQty < record.reservedQty) {
      setMsg({
        type: 'err',
        text: `New on-hand quantity (${numNewQty}) cannot be less than currently reserved locked stock (${record.reservedQty}).`
      });
      return;
    }
    if (!reason.trim()) {
      setMsg({ type: 'err', text: 'Audit adjustment reason is required.' });
      return;
    }

    try {
      setSubmitting(true);
      await onAdjustStock({
        binStockId: record.id,
        newOnHandQty: numNewQty,
        reason: reason.trim()
      });

      setMsg({
        type: 'success',
        text: `Stock count in ${record.binCode} updated to ${numNewQty} ${record.unit}.`
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Failed to update stock.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Physical Count Variance Adjustment</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.stockItemCode} in {record.binCode}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {msg && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                msg.type === 'err'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {msg.type === 'err' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Recorded On-Hand:</span>
              <span className="font-mono font-bold text-slate-900">
                {currentOnHand} {record.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currently Reserved:</span>
              <span className="font-mono font-bold text-amber-700">
                {record.reservedQty} {record.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
              Verified Physical Count ({record.unit})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-base font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
            />
            {variance !== 0 && (
              <p
                className={`text-xs mt-1 font-mono font-bold ${
                  variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                Variance: {variance > 0 ? `+${variance}` : variance} {record.unit} (
                {variance > 0 ? 'Surplus Count' : 'Stock Shrinkage / Deficit'})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
              Audit Reason / Offset Justification
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. End of month physical audit count offset"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || newQty === '' || !reason.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? 'Applying...' : 'Save Count'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
