// src/components/stock-aging/LotCostLayerDrawer.tsx

import React from 'react';
import {
  X,
  Layers,
  Calculator,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  ShieldCheck,
  Building2,
  Hash
} from 'lucide-react';
import { ItemStockValuationRecord, ValuationMethod } from '../../types/stockAgingValuation';

interface LotCostLayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemStockValuationRecord | null;
  valuationMethod: ValuationMethod;
}

export const LotCostLayerDrawer: React.FC<LotCostLayerDrawerProps> = ({
  isOpen,
  onClose,
  item,
  valuationMethod
}) => {
  if (!isOpen || !item) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getBucketBadge = (bucket: string) => {
    switch (bucket) {
      case 'bucket_0_30':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'bucket_31_60':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'bucket_61_90':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                {item.itemCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                {item.category.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{item.itemName}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {item.plantName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {item.storeName} ({item.binCode})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dual Valuation Comparison Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">FIFO Valuation</div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(item.fifoTotalValuation)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Unit Cost: {formatCurrency(item.fifoUnitCost)}/{item.unit}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Weighted Average (WAC)</div>
              <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                {formatCurrency(item.weightedAvgTotalValuation)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Avg Cost: {formatCurrency(item.weightedAvgUnitCost)}/{item.unit}
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Valuation Mechanics Explanation
            </div>
            <div className="text-slate-300 font-mono text-[11px] space-y-1">
              <div>
                • <strong>Total On-Hand Stock:</strong> {item.totalOnHandQty} {item.unit} across {item.layers.length} receipt layer{item.layers.length === 1 ? '' : 's'}.
              </div>
              <div>
                • <strong>Weighted Average Cost:</strong> Sum(Layer Qty × Unit Cost) ÷ Total Qty = {formatCurrency(item.weightedAvgTotalValuation)} ÷ {item.totalOnHandQty} = <strong>{formatCurrency(item.weightedAvgUnitCost)}/{item.unit}</strong>
              </div>
              <div>
                • <strong>FIFO Variance:</strong> {formatCurrency(item.valuationVariance)} ({item.valuationVariancePercent}% difference vs WAC).
              </div>
            </div>
          </div>

          {/* FIFO Layers Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Receipt Inward Layers (FIFO Sequence)
              </h3>
              <span className="text-xs text-slate-400">
                Sorted oldest to newest
              </span>
            </div>

            <div className="space-y-3">
              {item.layers.map((layer, idx) => (
                <div
                  key={layer.layerId}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      {layer.lotNumber && (
                        <span className="font-mono text-xs text-indigo-300 font-semibold">
                          {layer.lotNumber}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono border ${getBucketBadge(
                          layer.bucket
                        )}`}
                      >
                        {layer.ageDays} Days Old
                      </span>
                    </div>

                    <div className="text-right sm:shrink-0 font-mono">
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(layer.totalValue)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        ({layer.remainingQty} {item.unit} @ {formatCurrency(layer.unitCost)})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Receipt Date</span>
                      <span>{new Date(layer.receiptDate).toLocaleDateString()}</span>
                    </div>

                    {layer.grnNumber && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">GRN / PO Ref</span>
                        <span>{layer.grnNumber}</span>
                      </div>
                    )}

                    {layer.vendorName && (
                      <div>
                        <span className="text-[10px] text-slate-500 block">Supplier</span>
                        <span className="truncate block">{layer.vendorName}</span>
                      </div>
                    )}

                    {layer.expiryDate && (
                      <div className="col-span-2 sm:col-span-3 text-amber-400">
                        <span className="text-[10px] text-slate-500 block">Shelf-Life Expiry</span>
                        <span>
                          {new Date(layer.expiryDate).toLocaleDateString()} (In {layer.daysToExpiry} days)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
