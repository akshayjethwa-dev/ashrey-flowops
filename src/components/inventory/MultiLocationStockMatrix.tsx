// src/components/inventory/MultiLocationStockMatrix.tsx

import React, { useState } from 'react';
import {
  Package,
  Layers,
  Building2,
  Warehouse,
  Boxes,
  ArrowRightLeft,
  Lock,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Clock,
  Plus,
  SlidersHorizontal,
  DollarSign,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  SkuMultiLocationSummary,
  BinStockRecord,
  MultiLocationFilterParams
} from '../../types/inventoryLocation';
import { StockCategory } from '../../types';

interface MultiLocationStockMatrixProps {
  summaries: SkuMultiLocationSummary[];
  filterParams: MultiLocationFilterParams;
  onFilterChange: (params: Partial<MultiLocationFilterParams>) => void;
  onInitiateTransfer: (record: BinStockRecord) => void;
  onOpenReservationModal: (record: BinStockRecord) => void;
  onOpenAdjustModal: (record: BinStockRecord) => void;
}

export const MultiLocationStockMatrix: React.FC<MultiLocationStockMatrixProps> = ({
  summaries,
  filterParams,
  onFilterChange,
  onInitiateTransfer,
  onOpenReservationModal,
  onOpenAdjustModal
}) => {
  // Expanded SKU rows
  const [expandedSkus, setExpandedSkus] = useState<Record<string, boolean>>(() => {
    // Expand the first SKU row by default
    const init: Record<string, boolean> = {};
    if (summaries.length > 0) {
      init[summaries[0].stockItemId] = true;
    }
    return init;
  });

  const toggleSkuRow = (itemId: string) => {
    setExpandedSkus((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    summaries.forEach((s) => (all[s.stockItemId] = true));
    setExpandedSkus(all);
  };

  const collapseAll = () => {
    setExpandedSkus({});
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getCategoryBadge = (category: StockCategory) => {
    switch (category) {
      case 'raw_material':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished_goods':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'consumable':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'spare':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getAlertBadge = (status: SkuMultiLocationSummary['alertStatus']) => {
    switch (status) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-200 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Stockout / 0 Available
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Near Safety Reorder
          </span>
        );
      case 'overstock':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold border border-indigo-200">
            <TrendingUp className="h-3 w-3" />
            High Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Healthy Stock
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Matrix Controls & Search */}
      <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-600" />
              Multi-Location Inventory Matrix & Valuation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live segregation of physical on-hand, locked reservations, free available to promise, and incoming purchase pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
            >
              Expand All Locations
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search SKU */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU code or description..."
              value={filterParams.searchQuery || ''}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          {/* Availability Status */}
          <div>
            <select
              value={filterParams.availabilityStatus || 'all'}
              onChange={(e) =>
                onFilterChange({
                  availabilityStatus: e.target.value as MultiLocationFilterParams['availabilityStatus']
                })
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">⚡ All Availability States</option>
              <option value="in_stock">🟢 Available Stock &gt; 0</option>
              <option value="low_available">🟡 Low Available (Below Reorder)</option>
              <option value="out_of_stock">🔴 Out of Stock / 0 Available</option>
              <option value="has_reserved">🔒 Has Active Reserved Allocations</option>
              <option value="has_on_order">🚚 Has Inbound Orders Expected</option>
            </select>
          </div>

          {/* Material Category */}
          <div>
            <select
              value={filterParams.category || 'all'}
              onChange={(e) =>
                onFilterChange({
                  category: e.target.value as StockCategory | 'all'
                })
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">📁 All Categories</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_goods">Finished Goods</option>
              <option value="consumable">Consumables & Oils</option>
              <option value="spare">Spares & Tooling</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={filterParams.sortBy || 'value_desc'}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as MultiLocationFilterParams['sortBy']
                })
              }
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="value_desc">💰 Sort: Highest Inventory Value</option>
              <option value="available_asc">⚠️ Sort: Lowest Available First</option>
              <option value="on_hand_desc">📦 Sort: Largest Physical On-Hand</option>
              <option value="code">🔤 Sort: SKU Code (A-Z)</option>
              <option value="name">📝 Sort: Description Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Matrix */}
      {summaries.length === 0 ? (
        <div className="p-16 text-center text-slate-400">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No inventory matches your active filter</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, location breadcrumb, or status criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold w-10"></th>
                <th className="py-3.5 px-4 font-semibold">SKU / Item</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold text-right">Physical On-Hand</th>
                <th className="py-3.5 px-4 font-semibold text-right text-amber-700">
                  <span className="flex items-center justify-end gap-1">
                    <Lock className="h-3 w-3" />
                    Reserved
                  </span>
                </th>
                <th className="py-3.5 px-4 font-semibold text-right text-emerald-700">
                  Available to Promise
                </th>
                <th className="py-3.5 px-4 font-semibold text-right text-sky-700">
                  On-Order (Inbound)
                </th>
                <th className="py-3.5 px-4 font-semibold text-right">Unit Cost</th>
                <th className="py-3.5 px-4 font-semibold text-right font-bold text-slate-900">
                  Total Valuation
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((sku) => {
                const isExpanded = !!expandedSkus[sku.stockItemId];

                return (
                  <React.Fragment key={sku.stockItemId}>
                    {/* SKU Summary Master Row */}
                    <tr
                      onClick={() => toggleSkuRow(sku.stockItemId)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-sky-50/20' : 'bg-white'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button className="text-slate-400 hover:text-slate-700 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {sku.stockItemCode}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{sku.stockItemName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>Stored in {sku.binCount} Bin(s) across {sku.plantCount} Plant(s)</span>
                          <span>•</span>
                          <span>Reorder Min: {sku.reorderLevel} {sku.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${getCategoryBadge(
                            sku.category
                          )}`}
                        >
                          {sku.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900">
                        {sku.totalOnHandQty} <span className="text-[10px] text-slate-400 font-normal">{sku.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-amber-700">
                        {sku.totalReservedQty > 0 ? (
                          <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                            {sku.totalReservedQty} {sku.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">0 {sku.unit}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-black">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            sku.totalAvailableQty <= 0
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : sku.totalAvailableQty <= sku.reorderLevel
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {sku.totalAvailableQty} {sku.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-sky-700">
                        {sku.totalOnOrderQty > 0 ? (
                          <span className="bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            +{sku.totalOnOrderQty} {sku.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                        {formatCurrency(sku.unitCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-black text-slate-900">
                        {formatCurrency(sku.totalOnHandValue)}
                        <p className="text-[9px] text-emerald-600 font-normal mt-0.5">
                          Avail: {formatCurrency(sku.totalAvailableValue)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getAlertBadge(sku.alertStatus)}
                      </td>
                    </tr>

                    {/* Expandable Child Row: Break down by Storage Bins */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={10} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-mono font-bold text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <Boxes className="h-4 w-4 text-sky-600" />
                                Storage Location Breakdown: {sku.stockItemCode}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Segregated by Plant → Store / Warehouse → Storage Bin
                              </span>
                            </div>

                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-mono uppercase text-slate-400">
                                  <th className="py-2.5 px-4">Location Coordinates</th>
                                  <th className="py-2.5 px-4">Plant Facility</th>
                                  <th className="py-2.5 px-4">Store / Warehouse</th>
                                  <th className="py-2.5 px-4 text-right">On-Hand</th>
                                  <th className="py-2.5 px-4 text-right text-amber-700">Reserved</th>
                                  <th className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                                    Available
                                  </th>
                                  <th className="py-2.5 px-4 text-right">Bin Valuation</th>
                                  <th className="py-2.5 px-4 text-right">Quick Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sku.binRecords.map((binRec) => (
                                  <tr key={binRec.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                                          {binRec.binCode}
                                        </span>
                                        <span className="text-slate-800 font-medium">
                                          {binRec.binName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3 text-slate-400" />
                                        {binRec.plantName}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <Warehouse className="h-3 w-3 text-slate-400" />
                                        {binRec.storeName} ({binRec.storeCode})
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                                      {binRec.onHandQty} {binRec.unit}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                                      {binRec.reservedQty > 0 ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenReservationModal(binRec);
                                          }}
                                          className="hover:underline flex items-center justify-end gap-1 ml-auto text-amber-700"
                                          title="View Work Orders locking this stock"
                                        >
                                          <Lock className="h-3 w-3" />
                                          {binRec.reservedQty} {binRec.unit}
                                        </button>
                                      ) : (
                                        <span className="text-slate-300">0</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700">
                                      {binRec.availableQty} {binRec.unit}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                                      {formatCurrency(binRec.onHandValue)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {/* Transfer button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onInitiateTransfer(binRec);
                                          }}
                                          className="px-2 py-1 text-[10px] font-mono font-bold uppercase bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Transfer between bins or stores"
                                        >
                                          <ArrowRightLeft className="h-3 w-3" />
                                          Transfer
                                        </button>

                                        {/* Reserve button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenReservationModal(binRec);
                                          }}
                                          className="px-2 py-1 text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Reserve or view reservations for Work Orders"
                                        >
                                          <Lock className="h-3 w-3" />
                                          Reserve
                                        </button>

                                        {/* Adjust Count Variance */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenAdjustModal(binRec);
                                          }}
                                          className="px-2 py-1 text-[10px] font-mono font-bold uppercase bg-slate-50 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer transition-colors"
                                          title="Adjust physical count variance"
                                        >
                                          Adjust
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
