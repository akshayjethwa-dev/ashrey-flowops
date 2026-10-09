// src/components/inventory/StockReservationModal.tsx

import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  Layers,
  Briefcase
} from 'lucide-react';
import {
  BinStockRecord,
  StockReservation
} from '../../types/inventoryLocation';

interface StockReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BinStockRecord | null;
  reservations: StockReservation[];
  onAllocateReservation: (params: {
    binStockId: string;
    orderType: StockReservation['orderType'];
    orderId: string;
    orderNumber: string;
    qty: number;
    notes?: string;
  }) => Promise<any>;
  onReleaseReservation: (reservationId: string) => Promise<any>;
}

export const StockReservationModal: React.FC<StockReservationModalProps> = ({
  isOpen,
  onClose,
  record,
  reservations,
  onAllocateReservation,
  onReleaseReservation
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');

  // Form State
  const [orderType, setOrderType] = useState<StockReservation['orderType']>('work_order');
  const [orderNumber, setOrderNumber] = useState('');
  const [qty, setQty] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'err' | 'success'; text: string } | null>(null);

  if (!isOpen || !record) return null;

  const relevantReservations = reservations.filter(
    (r) => r.stockItemId === record.stockItemId && r.status === 'active'
  );

  const numQty = typeof qty === 'number' ? qty : 0;
  const isOverAvailable = numQty > record.availableQty;

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!orderNumber.trim()) {
      setStatusMsg({ type: 'err', text: 'Please enter a valid Order Reference Number (e.g., WO-2026-005).' });
      return;
    }
    if (numQty <= 0) {
      setStatusMsg({ type: 'err', text: 'Reservation quantity must be greater than zero.' });
      return;
    }
    if (numQty > record.availableQty) {
      setStatusMsg({
        type: 'err',
        text: `Cannot reserve ${numQty} ${record.unit}. Only ${record.availableQty} ${record.unit} is unreserved.`
      });
      return;
    }

    try {
      setSubmitting(true);
      await onAllocateReservation({
        binStockId: record.id,
        orderType,
        orderId: orderNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
        orderNumber: orderNumber.trim().toUpperCase(),
        qty: numQty,
        notes: notes.trim() || undefined
      });

      setStatusMsg({
        type: 'success',
        text: `Allocated ${numQty} ${record.unit} for ${orderNumber.toUpperCase()} successfully!`
      });
      setQty('');
      setOrderNumber('');
      setNotes('');
      setTimeout(() => {
        setActiveTab('view');
        setStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to allocate reservation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (resId: string, orderNum: string) => {
    try {
      setReleasingId(resId);
      await onReleaseReservation(resId);
      setStatusMsg({
        type: 'success',
        text: `Released allocation for ${orderNum}. Stock returned to Available pool.`
      });
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.message || 'Failed to release reservation.' });
    } finally {
      setReleasingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Stock Reservations & Allocations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.stockItemCode} — {record.stockItemName}
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

        {/* Status Breakdown Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <p className="text-[10px] font-mono uppercase text-slate-400 font-semibold">On-Hand (Physical)</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {record.onHandQty} {record.unit}
            </p>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <p className="text-[10px] font-mono uppercase text-amber-700 font-bold">Reserved (Locked)</p>
            <p className="text-sm font-black text-amber-800 mt-0.5">
              {record.reservedQty} {record.unit}
            </p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <p className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Available to Promise</p>
            <p className="text-sm font-black text-emerald-800 mt-0.5">
              {record.availableQty} {record.unit}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 cursor-pointer transition-all ${
              activeTab === 'view'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Active Allocations ({relevantReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Reserve for Order
          </button>
        </div>

        <div className="p-6">
          {/* Notifications */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl mb-4 flex items-center gap-2.5 text-xs font-semibold ${
                statusMsg.type === 'err'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusMsg.type === 'err' ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'view' ? (
            <div className="space-y-3">
              {relevantReservations.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Active Stock Reservations</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    All {record.onHandQty} {record.unit} in {record.binCode} is unreserved and 100% available to promise for production.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold uppercase hover:bg-slate-800 cursor-pointer"
                  >
                    Lock Material for Work Order
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {relevantReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {res.orderNumber}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                            {res.orderType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-700">
                          {res.reservedQty} {res.unit} locked
                        </p>
                        {res.notes && (
                          <p className="text-[11px] text-slate-600 italic">"{res.notes}"</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {res.reservedByName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(res.reservedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRelease(res.id, res.orderNumber)}
                        disabled={releasingId === res.id}
                        className="px-2.5 py-1.5 text-[11px] font-mono uppercase font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Release this reserved allocation back to free available stock"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        {releasingId === res.id ? 'Releasing...' : 'Release'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-bold">Allocating Free Available Stock</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Available unreserved stock: <strong>{record.availableQty} {record.unit}</strong> in {record.binCode}.
                  Locking this material guarantees it will not be promised to other orders.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as StockReservation['orderType'])}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                >
                  <option value="work_order">⚡ Work Order (Shop Floor Production)</option>
                  <option value="sales_order">📦 Sales Order (Customer Dispatch)</option>
                  <option value="subcontract_dispatch">🚚 Subcontracting Dispatch</option>
                  <option value="maintenance_hold">🔧 Plant Maintenance / Overhaul</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Order Number / Reference
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. WO-2026-004 or SO-8819"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-bold uppercase text-slate-500">
                    Reserve Quantity ({record.unit})
                  </label>
                  <button
                    type="button"
                    onClick={() => setQty(record.availableQty)}
                    className="text-[10px] font-mono text-amber-700 hover:text-amber-900 font-bold"
                  >
                    All Available ({record.availableQty})
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  max={record.availableQty}
                  value={qty}
                  onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Max ${record.availableQty}`}
                  className={`w-full p-2.5 text-xs font-bold rounded-lg border ${
                    isOverAvailable
                      ? 'border-rose-400 bg-rose-50 text-rose-900'
                      : 'border-slate-300 bg-slate-50 text-slate-800'
                  } focus:bg-white`}
                />
                {isOverAvailable && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Exceeds available unreserved quantity ({record.availableQty} {record.unit}).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1">
                  Allocation Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Scheduled for CNC Machining line #2"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs font-mono font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !numQty || isOverAvailable || !orderNumber.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-sm"
                >
                  <Lock className="h-4 w-4" />
                  {submitting ? 'Allocating...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
