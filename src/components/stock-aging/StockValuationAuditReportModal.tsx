// src/components/stock-aging/StockValuationAuditReportModal.tsx

import React from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import {
  StockAgingSummary,
  ItemStockValuationRecord,
  ValuationMethod
} from '../../types/stockAgingValuation';
import { exportToCSV } from '../../utils/exportUtils';

interface StockValuationAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StockAgingSummary;
  items: ItemStockValuationRecord[];
  valuationMethod: ValuationMethod;
  companyName: string;
}

export const StockValuationAuditReportModal: React.FC<StockValuationAuditReportModalProps> = ({
  isOpen,
  onClose,
  summary,
  items,
  valuationMethod,
  companyName
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Item Code',
      'Item Description',
      'Category',
      'Plant',
      'On Hand Qty',
      'Unit',
      'Unit Cost (FIFO)',
      'Valuation (FIFO)',
      'Unit Cost (WAC)',
      'Valuation (WAC)',
      'Aging Bucket',
      'Avg Age (Days)',
      'Slow-Moving Status',
      'Expiry Risk'
    ];

    const rows = items.map((i) => [
      i.itemCode,
      i.itemName,
      i.category,
      i.plantName,
      i.totalOnHandQty,
      i.unit,
      i.fifoUnitCost,
      i.fifoTotalValuation,
      i.weightedAvgUnitCost,
      i.weightedAvgTotalValuation,
      i.primaryAgingBucket,
      i.averageStockAgeDays,
      i.slowMovingStatus,
      i.expiryRiskLevel
    ]);

    exportToCSV(headers, rows, `Inventory_Valuation_Audit_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Official Inventory Valuation & Aging Audit Statement
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Download CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow transition-colors font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Audit Certificate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 print:p-6 print:text-slate-900">
          {/* Header */}
          <div className="border-b border-slate-800 print:border-slate-300 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold print:text-indigo-700">
                  FLOWOPS INDUSTRIAL SYSTEMS • FINANCIAL DISCLOSURE
                </span>
                <h1 className="text-2xl font-black text-white print:text-slate-900 mt-1">
                  INVENTORY AGING & VALUATION CERTIFICATE
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  Certified stock evaluation for balance sheet reporting and statutory working capital audits.
                </p>
              </div>

              <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
                <div>
                  <strong className="text-white print:text-slate-900">{companyName}</strong>
                </div>
                <div>Audit Date: {reportDate}</div>
                <div>Method: {valuationMethod === 'fifo' ? 'First-In, First-Out (FIFO)' : 'Weighted Average Cost (WAC)'}</div>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Stock Valuation</span>
              <div className="text-xl font-bold text-white print:text-slate-900 font-mono mt-1">
                {formatCurrency(summary.effectiveTotalValuation)}
              </div>
              <span className="text-[10px] text-slate-500">Method: {valuationMethod.toUpperCase()}</span>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Trapped in 90+ Days</span>
              <div className="text-xl font-bold text-rose-400 print:text-rose-700 font-mono mt-1">
                {formatCurrency(summary.workingCapitalLocked90Plus)}
              </div>
              <span className="text-[10px] text-slate-500">Aged risk inventory</span>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Slow-Moving SKUs</span>
              <div className="text-xl font-bold text-amber-400 print:text-amber-700 font-mono mt-1">
                {summary.slowMovingItemsCount} Items
              </div>
              <span className="text-[10px] text-slate-500">{formatCurrency(summary.slowMovingTotalValue)}</span>
            </div>

            <div className="bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Shelf-Life Risk (&le;45d)</span>
              <div className="text-xl font-bold text-rose-400 print:text-rose-700 font-mono mt-1">
                {formatCurrency(summary.expiringTotalValueAtRisk)}
              </div>
              <span className="text-[10px] text-slate-500">{summary.expiringLotsCount} batches</span>
            </div>
          </div>

          {/* Aging Buckets Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 print:text-slate-800 uppercase tracking-wider mb-2">
              1. Aging Buckets Distribution
            </h3>
            <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Bucket Interval</th>
                    <th className="py-2.5 px-4 font-semibold text-right">SKU Count</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Units</th>
                    <th className="py-2.5 px-4 font-semibold text-right">FIFO Valuation</th>
                    <th className="py-2.5 px-4 font-semibold text-right">WAC Valuation</th>
                    <th className="py-2.5 px-4 font-semibold text-right">% of Capital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                  {Object.values(summary.buckets).map((b) => (
                    <tr key={b.label} className="text-slate-300 print:text-slate-800">
                      <td className="py-2.5 px-4 font-medium">{b.label}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{b.itemCount}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{b.totalQty}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(b.valueFifo)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(b.valueWac)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{b.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 print:text-slate-800 uppercase tracking-wider mb-2">
              2. General Ledger Category Valuation
            </h3>
            <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Items</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Physical Qty</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Effective Value</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                  {summary.categoryDistribution.map((cat) => (
                    <tr key={cat.category} className="text-slate-300 print:text-slate-800">
                      <td className="py-2.5 px-4 font-medium">{cat.label}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{cat.itemCount}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{cat.totalQty}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {formatCurrency(valuationMethod === 'fifo' ? cat.valueFifo : cat.valueWac)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">{cat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Compliance Stamp */}
          <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="h-12 border-b border-slate-700 print:border-slate-400 mb-2" />
              <div className="font-bold text-white print:text-slate-900">Finance Controller / CFO</div>
              <div className="text-slate-400 print:text-slate-600">FlowOps Financial Operations</div>
            </div>

            <div>
              <div className="h-12 border-b border-slate-700 print:border-slate-400 mb-2 flex items-center justify-end">
                <span className="font-mono text-[10px] text-emerald-400 print:text-emerald-700 border border-emerald-500/40 px-2 py-0.5 rounded">
                  VERIFIED: AS-2 / IND-AS COMPLIANT
                </span>
              </div>
              <div className="font-bold text-white print:text-slate-900 text-right">Lead Inventory Auditor</div>
              <div className="text-slate-400 print:text-slate-600 text-right">Statutory Audit Sign-off</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
