// src/components/stock-aging/SlowMovingReportDrawer.tsx

import React, { useState } from 'react';
import {
  X,
  TrendingDown,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import {
  ItemStockValuationRecord,
  LiquidationAction,
  ValuationMethod
} from '../../types/stockAgingValuation';
import { exportToCSV } from '../../utils/exportUtils';

interface SlowMovingReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemStockValuationRecord[];
  valuationMethod: ValuationMethod;
  onUpdateAction: (itemId: string, action: LiquidationAction, provisionRate?: number, notes?: string) => void;
}

export const SlowMovingReportDrawer: React.FC<SlowMovingReportDrawerProps> = ({
  isOpen,
  onClose,
  items,
  valuationMethod,
  onUpdateAction
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<LiquidationAction>('clearance_discount');
  const [selectedProvision, setSelectedProvision] = useState<number>(20);
  const [actionNotes, setActionNotes] = useState<string>('');

  if (!isOpen) return null;

  // Filter only items with slow or non moving status
  const slowItems = items.filter(
    (i) =>
      i.slowMovingStatus === 'slow_moving' ||
      i.slowMovingStatus === 'non_moving' ||
      i.slowMovingStatus === 'obsolete' ||
      i.daysSinceLastMovement >= 45
  );

  const totalSlowValue = slowItems.reduce(
    (acc, i) => acc + (valuationMethod === 'fifo' ? i.fifoTotalValuation : i.weightedAvgTotalValuation),
    0
  );

  const totalCarryingCost = slowItems.reduce(
    (acc, i) => acc + i.monthlyCarryingCostEstimate,
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleStartEdit = (item: ItemStockValuationRecord) => {
    setEditingItemId(item.itemId);
    setSelectedAction(item.liquidationAction || 'clearance_discount');
    setSelectedProvision(item.provisionWriteDownRate || 15);
    setActionNotes(item.carryingNotes || '');
  };

  const handleSaveAction = (itemId: string) => {
    onUpdateAction(itemId, selectedAction, selectedProvision, actionNotes);
    setEditingItemId(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Plant',
      'Store & Bin',
      'On Hand Qty',
      'Unit',
      'Days Inactive',
      'DOH (Days)',
      'Valuation (₹)',
      'Monthly Carrying Cost (₹)',
      'Status',
      'Recommended Action',
      'Write-Down Provision (%)'
    ];

    const rows = slowItems.map((item) => [
      item.itemCode,
      item.itemName,
      item.category,
      item.plantName,
      `${item.storeName || ''} - ${item.binCode || ''}`,
      item.totalOnHandQty,
      item.unit,
      item.daysSinceLastMovement,
      item.daysOfInventoryOnHand,
      valuationMethod === 'fifo' ? item.fifoTotalValuation : item.weightedAvgTotalValuation,
      item.monthlyCarryingCostEstimate,
      item.slowMovingStatus.toUpperCase(),
      item.liquidationAction || 'Review Needed',
      `${item.provisionWriteDownRate || 0}%`
    ]);

    exportToCSV(headers, rows, `Slow_Moving_Inventory_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Slow-Moving & Obsolete Inventory Report
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dormant inventory tracking, working capital lock-in, and mitigation recommendations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
            <div className="text-[11px] text-slate-400 font-medium">Slow Items Identified</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {slowItems.length} SKU{slowItems.length === 1 ? '' : 's'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Inactive &gt; 45 days</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
            <div className="text-[11px] text-rose-400 font-medium">Locked Capital Value</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              {formatCurrency(totalSlowValue)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Method: {valuationMethod.toUpperCase()}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
            <div className="text-[11px] text-amber-400 font-medium">Monthly Carrying Cost</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalCarryingCost)} /mo
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Storage & capital drag</div>
          </div>
        </div>

        {/* List of Slow Moving Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {slowItems.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-white">No Slow-Moving Items Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                All inventory is moving efficiently with healthy turnover velocity and active consumption.
              </p>
            </div>
          ) : (
            slowItems.map((item) => {
              const itemVal = valuationMethod === 'fifo' ? item.fifoTotalValuation : item.weightedAvgTotalValuation;
              const isEditing = editingItemId === item.itemId;

              return (
                <div
                  key={item.itemId}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">
                          {item.itemCode}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            item.slowMovingStatus === 'obsolete'
                              ? 'bg-rose-500/20 text-rose-400'
                              : item.slowMovingStatus === 'non_moving'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.slowMovingStatus.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.plantName} • {item.binCode}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white mt-1.5">
                        {item.itemName}
                      </h3>

                      {item.slowMovingReason && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          "{item.slowMovingReason}"
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:shrink-0">
                      <div className="text-base font-extrabold text-white font-mono">
                        {formatCurrency(itemVal)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.totalOnHandQty} {item.unit} on hand
                      </div>
                      <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                        Carrying: {formatCurrency(item.monthlyCarryingCostEstimate)}/mo
                      </div>
                    </div>
                  </div>

                  {/* Velocity Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Days Inactive</span>
                      <span className="font-bold text-white font-mono">{item.daysSinceLastMovement} days</span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Days On Hand (DOH)</span>
                      <span className="font-bold text-amber-400 font-mono">{item.daysOfInventoryOnHand} days</span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Stagnant &gt; 60d</span>
                      <span className="font-bold text-rose-400 font-mono">
                        {item.stagnantQty} {item.unit}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Turnover Turns</span>
                      <span className="font-bold text-slate-300 font-mono">{item.turnoverRatio}x / yr</span>
                    </div>
                  </div>

                  {/* Action / Mitigation Row */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    {isEditing ? (
                      <div className="bg-slate-900 p-3 rounded-lg border border-indigo-500/30 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Recommended Liquidation Action
                            </label>
                            <select
                              value={selectedAction}
                              onChange={(e) => setSelectedAction(e.target.value as LiquidationAction)}
                              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="clearance_discount">Clearance Discount / Commercial Sale</option>
                              <option value="rework_into_standard">Rework into Standard BOM Product</option>
                              <option value="priority_bom_allocation">Priority Allocation in Next Work Order</option>
                              <option value="vendor_return_claim">Return to Vendor / Debit Note</option>
                              <option value="scrap_reserve">Write-Off to Scrap Reserve</option>
                              <option value="hold_audit">Hold for Technical Audit</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Write-Down Provision: {selectedProvision}%
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={selectedProvision}
                              onChange={(e) => setSelectedProvision(Number(e.target.value))}
                              className="w-full accent-indigo-500"
                            />
                            <div className="text-[10px] text-slate-400 flex justify-between font-mono mt-0.5">
                              <span>0%</span>
                              <span className="text-amber-400 font-bold">
                                Reserve: {formatCurrency((itemVal * selectedProvision) / 100)}
                              </span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Action Notes / Mitigation Plan
                          </label>
                          <input
                            type="text"
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder="e.g. Schedule review with engineering to adapt billet specs."
                            className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAction(item.itemId)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow"
                          >
                            Save Action & Provision
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Current Strategy:</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            {item.liquidationAction
                              ? item.liquidationAction.replace(/_/g, ' ').toUpperCase()
                              : 'No Action Assigned'}
                          </span>
                          {item.provisionWriteDownRate ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                              {item.provisionWriteDownRate}% Write-Down
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 self-start sm:self-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Set Mitigation Action
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total of {slowItems.length} items flagged for working capital liberation.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
