// src/pages/finance/StockAgingValuationPage.tsx

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Layers,
  Clock,
  TrendingDown,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Download,
  FileCheck,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Building2,
  Package,
  Calendar,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStockAgingValuation } from '../../hooks/useStockAgingValuation';
import { AgingBucketsVisualizer } from '../../components/stock-aging/AgingBucketsVisualizer';
import { ValuationMethodComparisonCard } from '../../components/stock-aging/ValuationMethodComparisonCard';
import { SlowMovingReportDrawer } from '../../components/stock-aging/SlowMovingReportDrawer';
import { ExpiryAlertsModal } from '../../components/stock-aging/ExpiryAlertsModal';
import { WorkingCapitalSimulatorModal } from '../../components/stock-aging/WorkingCapitalSimulatorModal';
import { LotCostLayerDrawer } from '../../components/stock-aging/LotCostLayerDrawer';
import { StockValuationAuditReportModal } from '../../components/stock-aging/StockValuationAuditReportModal';
import { ItemStockValuationRecord, AgingBucketKey } from '../../types/stockAgingValuation';
import { exportToCSV } from '../../utils/exportUtils';

export const StockAgingValuationPage: React.FC = () => {
  const { tenant } = useAuth();
  const companyName = tenant?.companyName || 'FlowOps Heavy Engineering Ltd.';

  const {
    items,
    summary,
    valuationMethod,
    setValuationMethod,
    filters,
    setFilters,
    resetFilters,
    setAgingBucket,
    toggleSlowMovingOnly,
    toggleExpiryAlertsOnly,
    updateLiquidationAction,
    simulateWorkingCapital,
    loading,
    refresh
  } = useStockAgingValuation();

  // Modals & Drawers
  const [slowMovingDrawerOpen, setSlowMovingDrawerOpen] = useState(false);
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedLayerItem, setSelectedLayerItem] = useState<ItemStockValuationRecord | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'valuation' | 'age' | 'code' | 'doh'>('valuation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSort = (field: 'valuation' | 'age' | 'code' | 'doh') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'valuation') {
        const valA = valuationMethod === 'fifo' ? a.fifoTotalValuation : a.weightedAvgTotalValuation;
        const valB = valuationMethod === 'fifo' ? b.fifoTotalValuation : b.weightedAvgTotalValuation;
        comparison = valA - valB;
      } else if (sortField === 'age') {
        comparison = a.averageStockAgeDays - b.averageStockAgeDays;
      } else if (sortField === 'code') {
        comparison = a.itemCode.localeCompare(b.itemCode);
      } else if (sortField === 'doh') {
        comparison = a.daysOfInventoryOnHand - b.daysOfInventoryOnHand;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortOrder, valuationMethod]);

  const handleExportFullCSV = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Plant',
      'Bin Location',
      'On Hand Qty',
      'Unit',
      'FIFO Unit Cost (₹)',
      'FIFO Total (₹)',
      'WAC Unit Cost (₹)',
      'WAC Total (₹)',
      'Primary Aging Bucket',
      'Avg Age (Days)',
      'Days Since Movement',
      'DOH',
      'Status',
      'Earliest Expiry',
      'Expiry Risk'
    ];

    const rows = sortedItems.map((item) => [
      item.itemCode,
      item.itemName,
      item.category,
      item.plantName,
      item.binCode || 'N/A',
      item.totalOnHandQty,
      item.unit,
      item.fifoUnitCost,
      item.fifoTotalValuation,
      item.weightedAvgUnitCost,
      item.weightedAvgTotalValuation,
      item.primaryAgingBucket,
      item.averageStockAgeDays,
      item.daysSinceLastMovement,
      item.daysOfInventoryOnHand,
      item.slowMovingStatus,
      item.earliestExpiryDate ? new Date(item.earliestExpiryDate).toLocaleDateString() : 'N/A',
      item.expiryRiskLevel
    ]);

    exportToCSV(headers, rows, `Inventory_Aging_Valuation_${new Date().toISOString().slice(0, 10)}`);
  };

  const getBucketBadgeStyle = (bucketKey: AgingBucketKey) => {
    switch (bucketKey) {
      case 'bucket_0_30':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'bucket_31_60':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'bucket_61_90':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'bucket_90_plus':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Stock Aging & Valuation
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  AS-2 / IND-AS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time inventory aging, dual FIFO vs Weighted Average models, slow-moving SKU liquidation, and shelf-life expiry alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Slow-Moving Report Button */}
          <button
            onClick={() => setSlowMovingDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors shadow-sm"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Slow-Moving Report
            {summary.slowMovingItemsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                {summary.slowMovingItemsCount}
              </span>
            )}
          </button>

          {/* Expiry Alerts Button */}
          <button
            onClick={() => setExpiryModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            Expiry Alerts
            {summary.criticalExpiryItemsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-slate-950 text-[10px] font-bold font-mono">
                {summary.criticalExpiryItemsCount}
              </span>
            )}
          </button>

          {/* Audit Statement Modal */}
          <button
            onClick={() => setAuditModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
            Audit Statement
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportFullCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Refresh valuation calculations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Module 1: Dual Valuation Engine Comparison Card */}
      <ValuationMethodComparisonCard
        summary={summary}
        valuationMethod={valuationMethod}
        onMethodChange={setValuationMethod}
        onOpenSimulator={() => setSimulatorModalOpen(true)}
      />

      {/* Module 2: The 4 Acceptance Criteria Aging Buckets (0-30, 31-60, 61-90, 90+ days) */}
      <AgingBucketsVisualizer
        summary={summary}
        selectedBucket={filters.agingBucket}
        onSelectBucket={setAgingBucket}
        valuationMethod={valuationMethod}
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by SKU Code, Description, Bin, Lot Number, or Vendor..."
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-4 py-2 focus:border-indigo-500 focus:outline-none placeholder-slate-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="raw_material">Raw Materials (Coils/Bars)</option>
              <option value="finished_goods">Finished Goods</option>
              <option value="bought_out">Bought-Out Spares</option>
              <option value="consumable">Consumables & Cutting Oils</option>
              <option value="spare">Tooling & Dies</option>
            </select>

            {/* Plant Filter */}
            <select
              value={filters.plantId}
              onChange={(e) => setFilters((prev) => ({ ...prev, plantId: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Manufacturing Plants</option>
              <option value="plant-pune">Pune Heavy Forge Facility</option>
            </select>

            {/* Quick Toggle 1: Slow-Moving Only */}
            <button
              onClick={toggleSlowMovingOnly}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                filters.slowMovingOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Slow-Moving Only
            </button>

            {/* Quick Toggle 2: Expiry Risk Only */}
            <button
              onClick={toggleExpiryAlertsOnly}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                filters.expiryAlertsOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Expiry Risk Only
            </button>

            {(filters.category !== 'all' ||
              filters.plantId !== 'all' ||
              filters.agingBucket !== 'all' ||
              filters.slowMovingOnly ||
              filters.expiryAlertsOnly ||
              filters.searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
          <div>
            Showing <strong>{sortedItems.length}</strong> of <strong>{summary.totalItemsCount}</strong> items
            {filters.agingBucket !== 'all' && (
              <span className="ml-2 text-indigo-400 font-sans">
                Filtered by: {filters.agingBucket.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>Valuation Model: <strong>{valuationMethod.toUpperCase()}</strong></span>
            <span>Effective Total: <strong>{formatCurrency(summary.effectiveTotalValuation)}</strong></span>
          </div>
        </div>
      </div>

      {/* Real-Time Stock Valuation & Aging Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('code')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Item Code & Description
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Location (Plant / Bin)</th>
                <th className="py-3 px-4 font-semibold text-right">On Hand Qty</th>
                <th className="py-3 px-4 font-semibold text-right">
                  Unit Cost ({valuationMethod.toUpperCase()})
                </th>
                <th
                  onClick={() => handleSort('valuation')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Valuation (₹)
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('age')}
                  className="py-3 px-4 font-semibold text-center cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    Aging Bucket
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('doh')}
                  className="py-3 px-4 font-semibold text-center cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    Velocity / DOH
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-center">Expiry / Shelf-Life</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    No inventory records match the selected aging or category filters.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const effectiveUnitCost =
                    valuationMethod === 'fifo' ? item.fifoUnitCost : item.weightedAvgUnitCost;
                  const effectiveTotalValuation =
                    valuationMethod === 'fifo'
                      ? item.fifoTotalValuation
                      : item.weightedAvgTotalValuation;

                  return (
                    <tr
                      key={item.itemId}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLayerItem(item)}
                    >
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                                {item.itemCode}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 capitalize">
                                {item.category.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                              {item.itemName}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {item.layers.length} FIFO Layer{item.layers.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-medium text-slate-200">{item.plantName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          {item.storeName} • {item.binCode}
                        </div>
                      </td>

                      {/* On Hand Qty */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-white">
                          {item.totalOnHandQty} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Avail: {item.availableQty} {item.unit}
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-slate-200">
                          {formatCurrency(effectiveUnitCost)}
                        </div>
                        {valuationMethod === 'fifo' && item.valuationVariance !== 0 && (
                          <div className="text-[10px] text-slate-500">
                            WAC: {formatCurrency(item.weightedAvgUnitCost)}
                          </div>
                        )}
                      </td>

                      {/* Total Valuation */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-sm font-extrabold text-white">
                          {formatCurrency(effectiveTotalValuation)}
                        </div>
                        {item.valuationVariance !== 0 && (
                          <div
                            className={`text-[10px] font-semibold ${
                              item.valuationVariance > 0 ? 'text-amber-400/90' : 'text-emerald-400/90'
                            }`}
                          >
                            Var: {item.valuationVariance > 0 ? '+' : ''}
                            {formatCurrency(item.valuationVariance)}
                          </div>
                        )}
                      </td>

                      {/* Aging Bucket */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${getBucketBadgeStyle(
                            item.primaryAgingBucket
                          )}`}
                        >
                          {item.primaryAgingBucket === 'bucket_0_30'
                            ? '0 - 30d'
                            : item.primaryAgingBucket === 'bucket_31_60'
                            ? '31 - 60d'
                            : item.primaryAgingBucket === 'bucket_61_90'
                            ? '61 - 90d'
                            : '90+ Days'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Avg: {item.averageStockAgeDays}d
                        </div>
                      </td>

                      {/* Velocity / DOH */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.slowMovingStatus === 'fast_moving'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : item.slowMovingStatus === 'normal'
                              ? 'bg-sky-500/10 text-sky-400'
                              : item.slowMovingStatus === 'slow_moving'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {item.slowMovingStatus.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          DOH: {item.daysOfInventoryOnHand}d
                        </div>
                      </td>

                      {/* Expiry Risk */}
                      <td className="py-3.5 px-4 text-center">
                        {item.daysToEarliestExpiry !== undefined ? (
                          <div>
                            <span
                              className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                item.expiryRiskLevel === 'critical'
                                  ? 'bg-rose-500 text-slate-950 font-black'
                                  : item.expiryRiskLevel === 'warning'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {item.daysToEarliestExpiry <= 15
                                ? `${item.daysToEarliestExpiry}d (CRITICAL)`
                                : `${item.daysToEarliestExpiry}d left`}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(item.earliestExpiryDate!).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Non-Perishable
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLayerItem(item)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                        >
                          Layers
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Click any item row to inspect its chronological FIFO receipt layers and batch valuation history.</span>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div>
              Total SKUs: <strong className="text-white">{sortedItems.length}</strong>
            </div>
            <div>
              Portfolio Value: <strong className="text-emerald-400">{formatCurrency(summary.effectiveTotalValuation)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Slow-Moving Item Report Drawer */}
      <SlowMovingReportDrawer
        isOpen={slowMovingDrawerOpen}
        onClose={() => setSlowMovingDrawerOpen(false)}
        items={items}
        valuationMethod={valuationMethod}
        onUpdateAction={updateLiquidationAction}
      />

      {/* Shelf-Life Expiry Alerts Modal */}
      <ExpiryAlertsModal
        isOpen={expiryModalOpen}
        onClose={() => setExpiryModalOpen(false)}
        items={items}
        valuationMethod={valuationMethod}
      />

      {/* Working Capital Simulator Modal */}
      <WorkingCapitalSimulatorModal
        isOpen={simulatorModalOpen}
        onClose={() => setSimulatorModalOpen(false)}
        summary={summary}
        onSimulate={simulateWorkingCapital}
      />

      {/* Lot / Layer Cost Breakdown Drawer */}
      <LotCostLayerDrawer
        isOpen={selectedLayerItem !== null}
        onClose={() => setSelectedLayerItem(null)}
        item={selectedLayerItem}
        valuationMethod={valuationMethod}
      />

      {/* Official Audit Statement Modal */}
      <StockValuationAuditReportModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        summary={summary}
        items={items}
        valuationMethod={valuationMethod}
        companyName={companyName}
      />
    </div>
  );
};
