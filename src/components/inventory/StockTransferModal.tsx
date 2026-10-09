// src/components/inventory/StockTransferModal.tsx

import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  Building2,
  Warehouse,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  BinStockRecord,
  StorageStore,
  StorageBin,
  StockTransferRecord
} from '../../types/inventoryLocation';
import { Plant } from '../../types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRecord?: BinStockRecord | null;
  allRecords: BinStockRecord[];
  plants: Plant[];
  stores: StorageStore[];
  bins: StorageBin[];
  onExecuteTransfer: (params: {
    stockItemId: string;
    sourceBinId: string;
    targetBinId: string;
    qty: number;
    reason: StockTransferRecord['reason'];
    notes?: string;
  }) => Promise<any>;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  sourceRecord: initialSourceRecord,
  allRecords,
  plants,
  stores,
  bins,
  onExecuteTransfer
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialSourceRecord?.id || ''
  );

  // Sync if initialSourceRecord changes
  React.useEffect(() => {
    if (initialSourceRecord?.id) {
      setSelectedRecordId(initialSourceRecord.id);
    } else if (allRecords.length > 0 && !selectedRecordId) {
      setSelectedRecordId(allRecords[0].id);
    }
  }, [initialSourceRecord, allRecords]);

  const activeSourceRecord = useMemo(() => {
    return allRecords.find((r) => r.id === selectedRecordId) || initialSourceRecord || null;
  }, [allRecords, selectedRecordId, initialSourceRecord]);

  // Target Location State
  const [targetPlantId, setTargetPlantId] = useState<string>('');
  const [targetStoreId, setTargetStoreId] = useState<string>('');
  const [targetBinId, setTargetBinId] = useState<string>('');

  // Transfer parameters
  const [qty, setQty] = useState<number | ''>('');
  const [reason, setReason] = useState<StockTransferRecord['reason']>('bin_optimization');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default target plant when source changes
  React.useEffect(() => {
    if (activeSourceRecord) {
      setTargetPlantId(activeSourceRecord.plantId);
      // Pick first available target store
      const matchingStores = stores.filter((s) => s.plantId === activeSourceRecord.plantId);
      if (matchingStores.length > 0) {
        setTargetStoreId(matchingStores[0].id);
      }
    }
  }, [activeSourceRecord, stores]);

  // Filter available target stores based on selected target plant
  const availableTargetStores = useMemo(() => {
    if (!targetPlantId) return stores;
    return stores.filter((s) => s.plantId === targetPlantId);
  }, [stores, targetPlantId]);

  // When target store changes, select first valid bin that is NOT the source bin
  const availableTargetBins = useMemo(() => {
    if (!targetStoreId) return [];
    return bins.filter(
      (b) => b.storeId === targetStoreId && b.id !== activeSourceRecord?.binId
    );
  }, [bins, targetStoreId, activeSourceRecord]);

  React.useEffect(() => {
    if (availableTargetBins.length > 0) {
      setTargetBinId(availableTargetBins[0].id);
    } else {
      setTargetBinId('');
    }
  }, [availableTargetBins]);

  if (!isOpen) return null;

  const numQty = typeof qty === 'number' ? qty : 0;
  const unitCost = activeSourceRecord?.unitCost || 0;
  const transferValue = numQty * unitCost;
  const availableQty = activeSourceRecord?.availableQty || 0;

  const isOverAvailable = numQty > availableQty;

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!activeSourceRecord) {
      setErrorMsg('No source stock item selected.');
      return;
    }
    if (!targetBinId) {
      setErrorMsg('Please select a valid destination storage bin.');
      return;
    }
    if (targetBinId === activeSourceRecord.binId) {
      setErrorMsg('Source bin and destination bin cannot be identical.');
      return;
    }
    if (numQty <= 0) {
      setErrorMsg('Transfer quantity must be greater than zero.');
      return;
    }
    if (numQty > availableQty) {
      setErrorMsg(
        `Cannot transfer ${numQty} ${activeSourceRecord.unit}. Only ${availableQty} ${activeSourceRecord.unit} is unreserved.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await onExecuteTransfer({
        stockItemId: activeSourceRecord.stockItemId,
        sourceBinId: activeSourceRecord.binId,
        targetBinId,
        qty: numQty,
        reason,
        notes: notes.trim() || undefined
      });

      setSuccessMsg(
        `Successfully transferred ${numQty} ${activeSourceRecord.unit} of ${activeSourceRecord.stockItemCode}!`
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Stock transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Inter-Location Stock Transfer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Relocate materials between Plant Bins, Racks, and Warehouses with instant balance reconciliation.
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

        <form onSubmit={handleTransferSubmit} className="p-6 space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1.5">
              Select Material & Source Bin
            </label>
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
            >
              {allRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.stockItemCode}] {r.stockItemName} — {r.plantName} / {r.storeName} / {r.binCode} (Avail: {r.availableQty} {r.unit})
                </option>
              ))}
            </select>
          </div>

          {activeSourceRecord && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Source Location
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                    {activeSourceRecord.binCode}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{activeSourceRecord.storeName}</h4>
                  <p className="text-[11px] text-slate-500">{activeSourceRecord.plantName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeSourceRecord.binName}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <p className="text-[9px] font-mono uppercase text-slate-400">On-Hand</p>
                    <p className="text-xs font-black text-slate-800">
                      {activeSourceRecord.onHandQty} {activeSourceRecord.unit}
                    </p>
                  </div>
                  <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                    <p className="text-[9px] font-mono uppercase text-amber-600">Reserved</p>
                    <p className="text-xs font-black text-amber-700">
                      {activeSourceRecord.reservedQty} {activeSourceRecord.unit}
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                    <p className="text-[9px] font-mono uppercase text-emerald-600">Available</p>
                    <p className="text-xs font-black text-emerald-700">
                      {activeSourceRecord.availableQty} {activeSourceRecord.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Destination Card */}
              <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5 text-sky-500" />
                    Target Destination
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-sky-200 text-sky-800 px-2 py-0.5 rounded font-bold">
                    Move Inward
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                      Target Plant
                    </label>
                    <select
                      value={targetPlantId}
                      onChange={(e) => setTargetPlantId(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800"
                    >
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>
                          🏭 {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                      Target Store / Warehouse
                    </label>
                    <select
                      value={targetStoreId}
                      onChange={(e) => setTargetStoreId(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800"
                    >
                      {availableTargetStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          📦 {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                      Target Storage Bin / Rack
                    </label>
                    <select
                      value={targetBinId}
                      onChange={(e) => setTargetBinId(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800"
                    >
                      {availableTargetBins.length === 0 ? (
                        <option value="">No other bins available in this store</option>
                      ) : (
                        availableTargetBins.map((b) => (
                          <option key={b.id} value={b.id}>
                            📍 {b.code} — {b.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Quantity and Valuation Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-bold uppercase text-slate-500">
                  Transfer Quantity ({activeSourceRecord?.unit})
                </label>
                {activeSourceRecord && (
                  <button
                    type="button"
                    onClick={() => setQty(activeSourceRecord.availableQty)}
                    className="text-[10px] font-mono text-sky-600 hover:text-sky-800 font-bold"
                  >
                    Transfer Max ({activeSourceRecord.availableQty})
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0.001"
                max={availableQty}
                value={qty}
                onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`e.g. 5.0 ${activeSourceRecord?.unit || ''}`}
                className={`w-full p-2.5 text-sm font-bold rounded-lg border ${
                  isOverAvailable
                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                    : 'border-slate-300 bg-slate-50 text-slate-800 focus:ring-sky-500'
                } focus:bg-white`}
              />
              {isOverAvailable && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Exceeds available quantity ({availableQty} {activeSourceRecord?.unit}).
                </p>
              )}
            </div>

            {/* Financial Valuation Preview */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Asset Transfer Valuation Impact
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(transferValue)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (@ {formatCurrency(unitCost)}/{activeSourceRecord?.unit})
                </span>
              </div>
            </div>
          </div>

          {/* Reason and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1.5">
                Movement Purpose / Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as StockTransferRecord['reason'])}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              >
                <option value="bin_optimization">📦 Bin & Space Optimization</option>
                <option value="line_feed">🏭 Line-Side Feeding / Staging</option>
                <option value="replenishment">🔄 High-Bay Replenishment</option>
                <option value="inter_plant_rebalance">🚚 Inter-Plant Inventory Rebalance</option>
                <option value="quarantine_move">⚠️ Inspection / Quarantine Hold</option>
                <option value="other">📝 Other Operational Relocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-500 mb-1.5">
                Transfer Notes & Gate Pass Ref
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Moved via forklift #2, bay optimization"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !numQty || isOverAvailable || !targetBinId}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
              {submitting ? 'Executing Transfer...' : 'Confirm & Move Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
