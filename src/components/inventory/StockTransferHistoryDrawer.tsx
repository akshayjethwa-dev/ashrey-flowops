// src/components/inventory/StockTransferHistoryDrawer.tsx

import React from 'react';
import {
  X,
  History,
  ArrowRight,
  Building2,
  Warehouse,
  Boxes,
  Calendar,
  User,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { StockTransferRecord } from '../../types/inventoryLocation';

interface StockTransferHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transfers: StockTransferRecord[];
}

export const StockTransferHistoryDrawer: React.FC<StockTransferHistoryDrawerProps> = ({
  isOpen,
  onClose,
  transfers
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (isoString: string) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Inter-Location Transfer Audit Log
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chain of custody across Bins, Racks, Warehouses, and Facilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {transfers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No transfers recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Stock movements between storage bins will appear here in chronological order.
              </p>
            </div>
          ) : (
            transfers.map((trf) => (
              <div
                key={trf.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      {trf.transferNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{trf.stockItemName}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                      {trf.stockItemCode}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                </div>

                {/* From -> To Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                      Source (Outward)
                    </span>
                    <p className="font-bold text-slate-800">{trf.sourceStoreName}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Bin: {trf.sourceBinCode} • {trf.sourcePlantName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-sky-600 block mb-0.5">
                      Target Destination (Inward)
                    </span>
                    <p className="font-bold text-sky-900">{trf.targetStoreName}</p>
                    <p className="text-[11px] font-mono text-sky-700">
                      Bin: {trf.targetBinCode} • {trf.targetPlantName}
                    </p>
                  </div>
                </div>

                {/* Quantity and Valuation details */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Moved: </span>
                    <span className="font-mono font-black text-slate-900">
                      {trf.qty} {trf.unit}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({formatCurrency(trf.totalValue)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {trf.transferredByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(trf.timestamp)}
                    </span>
                  </div>
                </div>

                {trf.notes && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-100/60 p-2 rounded border border-slate-200/60">
                    "{trf.notes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
