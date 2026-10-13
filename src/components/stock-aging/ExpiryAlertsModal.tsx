// src/components/stock-aging/ExpiryAlertsModal.tsx

import React from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  ArrowRight,
  Flame
} from 'lucide-react';
import { ItemStockValuationRecord, ValuationMethod } from '../../types/stockAgingValuation';
import { exportToCSV } from '../../utils/exportUtils';

interface ExpiryAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemStockValuationRecord[];
  valuationMethod: ValuationMethod;
}

export const ExpiryAlertsModal: React.FC<ExpiryAlertsModalProps> = ({
  isOpen,
  onClose,
  items,
  valuationMethod
}) => {
  if (!isOpen) return null;

  // Flatten all expiring layers/lots across items
  const expiringLots: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    plantName: string;
    storeName?: string;
    binCode?: string;
    lotNumber?: string;
    unit: string;
    remainingQty: number;
    unitCost: number;
    totalValue: number;
    expiryDate: string;
    daysToExpiry: number;
    riskLevel: 'critical' | 'warning' | 'monitored';
  }> = [];

  items.forEach((item) => {
    item.layers.forEach((layer) => {
      if (layer.expiryDate && layer.daysToExpiry !== undefined && layer.daysToExpiry <= 90) {
        expiringLots.push({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          plantName: item.plantName,
          storeName: item.storeName,
          binCode: item.binCode,
          lotNumber: layer.lotNumber,
          unit: item.unit,
          remainingQty: layer.remainingQty,
          unitCost: layer.unitCost,
          totalValue: layer.totalValue,
          expiryDate: layer.expiryDate,
          daysToExpiry: layer.daysToExpiry,
          riskLevel: layer.daysToExpiry <= 15 ? 'critical' : layer.daysToExpiry <= 45 ? 'warning' : 'monitored'
        });
      }
    });
  });

  // Sort by urgency: shortest days to expiry first
  expiringLots.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  const totalValueAtRisk = expiringLots.reduce((acc, l) => acc + l.totalValue, 0);
  const criticalLots = expiringLots.filter((l) => l.riskLevel === 'critical');
  const warningLots = expiringLots.filter((l) => l.riskLevel === 'warning');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleExportCSV = () => {
    const headers = [
      'Risk Level',
      'Days to Expiry',
      'Expiry Date',
      'Lot / Batch #',
      'Item Code',
      'Item Name',
      'Location (Plant / Bin)',
      'Remaining Qty',
      'Unit',
      'Unit Cost (₹)',
      'Total Value at Risk (₹)'
    ];

    const rows = expiringLots.map((lot) => [
      lot.riskLevel.toUpperCase(),
      lot.daysToExpiry,
      new Date(lot.expiryDate).toLocaleDateString(),
      lot.lotNumber || 'N/A',
      lot.itemCode,
      lot.itemName,
      `${lot.plantName} - ${lot.binCode || ''}`,
      lot.remainingQty,
      lot.unit,
      lot.unitCost,
      lot.totalValue
    ]);

    exportToCSV(headers, rows, `Inventory_Expiry_Risk_Audit_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Inventory Expiry Risk & Shelf-Life Watchlist
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  FEFO Priority
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batches requiring urgent consumption, re-inspection, or return to prevent scrap losses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              Export Expiry List
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Risk Summary Banners */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Critical (&le; 15 Days)</div>
              <div className="text-lg font-bold text-rose-400 font-mono">
                {criticalLots.length} Batch{criticalLots.length === 1 ? '' : 'es'}
              </div>
              <div className="text-[10px] text-slate-500">Immediate action needed</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Warning (16 - 45 Days)</div>
              <div className="text-lg font-bold text-amber-400 font-mono">
                {warningLots.length} Batch{warningLots.length === 1 ? '' : 'es'}
              </div>
              <div className="text-[10px] text-slate-500">FEFO priority allocation</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Total Capital at Risk</div>
              <div className="text-lg font-bold text-white font-mono">
                {formatCurrency(totalValueAtRisk)}
              </div>
              <div className="text-[10px] text-slate-500">Subject to expiry write-down</div>
            </div>
          </div>
        </div>

        {/* Expiring Lots Table */}
        <div className="max-h-[480px] overflow-y-auto p-6 space-y-3">
          {expiringLots.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-semibold text-white">No Expiring Inventory Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                All lots have over 90 days remaining or are non-perishable metals and hardware.
              </p>
            </div>
          ) : (
            expiringLots.map((lot, idx) => (
              <div
                key={`${lot.itemId}-${lot.lotNumber}-${idx}`}
                className={`border rounded-xl p-4 transition-all ${
                  lot.riskLevel === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                    : lot.riskLevel === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold">
                        {lot.itemCode}
                      </span>
                      {lot.lotNumber && (
                        <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Lot: {lot.lotNumber}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          lot.riskLevel === 'critical'
                            ? 'bg-rose-500 text-slate-950'
                            : lot.riskLevel === 'warning'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {lot.riskLevel === 'critical'
                          ? `Expires in ${lot.daysToExpiry} Days!`
                          : `Expires in ${lot.daysToExpiry} Days`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{lot.itemName}</h3>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {lot.plantName} • {lot.binCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Expiry Date: {new Date(lot.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-base font-extrabold text-white font-mono">
                      {formatCurrency(lot.totalValue)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {lot.remainingQty} {lot.unit} @ {formatCurrency(lot.unitCost)}/{lot.unit}
                    </div>
                  </div>
                </div>

                {/* Recommendation Pill */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-semibold">Action:</span>
                    {lot.riskLevel === 'critical' ? (
                      <span className="text-rose-300">
                        Immediate priority dispatch into shopfloor blending / cutting or vendor exchange.
                      </span>
                    ) : (
                      <span className="text-amber-300">
                        Flag in MRP Engine as First-Expired, First-Out (FEFO) component allocation.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
                      FEFO Tagged
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Adheres to First-Expired, First-Out (FEFO) standard accounting guidelines.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
