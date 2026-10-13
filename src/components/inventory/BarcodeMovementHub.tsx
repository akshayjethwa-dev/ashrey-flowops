// src/components/inventory/BarcodeMovementHub.tsx

import React, { useState, useMemo } from 'react';
import {
  ScanLine,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Warehouse,
  Boxes,
  Tag,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  ScanMovementLog,
  BarcodeMovementType
} from '../../types/barcodeMovement';
import { StorageStore, StorageBin, BinStockRecord, StockInboundOrder, StockReservation } from '../../types/inventoryLocation';
import { BarcodeLabelPrintModal } from './BarcodeLabelPrintModal';

interface Props {
  logs: ScanMovementLog[];
  stores: StorageStore[];
  bins: StorageBin[];
  binStockRecords: BinStockRecord[];
  inboundOrders: StockInboundOrder[];
  reservations: StockReservation[];
  onOpenTerminal: (type: BarcodeMovementType) => void;
}

export const BarcodeMovementHub: React.FC<Props> = ({
  logs,
  stores,
  bins,
  binStockRecords,
  inboundOrders,
  reservations,
  onOpenTerminal
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | BarcodeMovementType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let inwardCount = 0;
    let outwardCount = 0;
    let returnCount = 0;
    let totalMovedValue = 0;

    for (const l of logs) {
      totalMovedValue += l.totalValue || 0;
      if (l.type === 'receive') inwardCount++;
      else if (l.type === 'issue') outwardCount++;
      else if (l.type === 'return') returnCount++;
    }

    return {
      total: logs.length,
      inwardCount,
      outwardCount,
      returnCount,
      totalMovedValue
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter !== 'all' && log.type !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = log.referenceNumber?.toLowerCase().includes(q);
        const matchesMovement = log.movementNumber?.toLowerCase().includes(q);
        const matchesCode = log.stockItemCode?.toLowerCase().includes(q);
        const matchesName = log.stockItemName?.toLowerCase().includes(q);
        const matchesBarcode = log.scannedBarcode?.toLowerCase().includes(q);
        const matchesBin = log.binCode?.toLowerCase().includes(q);
        const matchesStore = log.storeName?.toLowerCase().includes(q);
        const matchesOperator = log.operatorName?.toLowerCase().includes(q);
        return (
          matchesRef ||
          matchesMovement ||
          matchesCode ||
          matchesName ||
          matchesBarcode ||
          matchesBin ||
          matchesStore ||
          matchesOperator
        );
      }
      return true;
    });
  }, [logs, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Storekeeper Quick-Action Launchpads ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Launchpad 1: Scan to Receive (PO) */}
        <button
          type="button"
          onClick={() => onOpenTerminal('receive')}
          className="group p-5 bg-gradient-to-br from-sky-900/90 to-slate-900 border border-sky-500/30 hover:border-sky-400 rounded-2xl text-left shadow-lg shadow-sky-950/20 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                INWARD PO
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
              Scan-to-Receive
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Scan inbound PO or vendor delivery challan to update bin inventory instantly.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-sky-300 font-semibold">
            <span>Launch Inward Terminal</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Launchpad 2: Scan to Issue (WO) */}
        <button
          type="button"
          onClick={() => onOpenTerminal('issue')}
          className="group p-5 bg-gradient-to-br from-amber-900/90 to-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-2xl text-left shadow-lg shadow-amber-950/20 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ArrowUpFromLine className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                OUTWARD WO
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Scan-to-Issue
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Scan Work Order traveler or machine request to issue materials and deduct reservations.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-amber-300 font-semibold">
            <span>Launch Issue Terminal</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Launchpad 3: Scan to Return */}
        <button
          type="button"
          onClick={() => onOpenTerminal('return')}
          className="group p-5 bg-gradient-to-br from-emerald-900/90 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl text-left shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <RotateCcw className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                RETURN TO STOCK
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Scan-to-Return
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Scan shop floor returns: surplus material, off-cut scrap, or quarantine holds.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-emerald-300 font-semibold">
            <span>Launch Return Terminal</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Launchpad 4: Barcode Label Print Station */}
        <button
          type="button"
          onClick={() => {
            setPrintData({
              type: 'material',
              code: 'MAT-WR-1002',
              title: 'Wire Rod — High Tensile Steel 8mm',
              subtext: 'High Tensile Coil • Batch LOT-2026-TATA-91',
              locationName: 'BIN-RM-A01 • Pune RM Store'
            });
            setPrintModalOpen(true);
          }}
          className="group p-5 bg-gradient-to-br from-indigo-900/90 to-slate-900 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl text-left shadow-lg shadow-indigo-950/20 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                PRINT STATION
              </span>
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Print Barcode Tags
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Print physical Code-128 / QR label tags for bins, pallets, coils, and work orders.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-indigo-300 font-semibold">
            <span>Open Label Generator</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* ── 2. Movement Activity KPIs ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Total Movements Logged
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-500 font-mono">transactions</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-sky-600 font-bold">
            Scan-to-Receive (PO)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-600 font-mono">
              {metrics.inwardCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">inward receipts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-amber-600 font-bold">
            Scan-to-Issue (WO)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {metrics.outwardCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">shopfloor dispatches</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-emerald-600 font-bold">
            Movement Value Turnover
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(metrics.totalMovedValue)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Movement Audit Log Table ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-150 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Barcode Material Movement Ledger
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700">
              Instant Sync
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('receive')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'receive'
                    ? 'bg-sky-50 text-sky-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inward PO ({metrics.inwardCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('issue')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'issue'
                    ? 'bg-amber-50 text-amber-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Issue WO ({metrics.outwardCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('return')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeFilter === 'return'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Return ({metrics.returnCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO, WO, Barcode, Bin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Movement #</th>
                <th className="py-3 px-4">Type & Reference</th>
                <th className="py-3 px-4">Material / SKU</th>
                <th className="py-3 px-4">Quantity & Valuation</th>
                <th className="py-3 px-4">Location (Plant → Store → Bin)</th>
                <th className="py-3 px-4">Operator / Machine</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ScanLine className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No barcode material movements found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Use the quick launchpads above to scan materials at receiving, issue, or return.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Movement # */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {log.movementNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDate(log.timestamp)}
                      </div>
                    </td>

                    {/* Type & Reference */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {log.type === 'receive' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
                            <ArrowDownToLine className="h-3 w-3" /> INWARD PO
                          </span>
                        )}
                        {log.type === 'issue' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <ArrowUpFromLine className="h-3 w-3" /> OUTWARD WO
                          </span>
                        )}
                        {log.type === 'return' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> RETURN
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-800 mt-1">
                        Ref: {log.referenceNumber}
                      </div>
                      {log.scannedBarcode && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Barcode: {log.scannedBarcode}
                        </div>
                      )}
                    </td>

                    {/* Material Item */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {log.stockItemName}
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                        {log.stockItemCode}
                      </div>
                      {log.lotNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Lot: {log.lotNumber}
                        </div>
                      )}
                    </td>

                    {/* Quantity & Valuation */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-extrabold text-sm text-slate-900">
                        {log.type === 'issue' ? `-${log.qty}` : `+${log.qty}`} {log.unit}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {formatCurrency(log.totalValue)}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Boxes className="h-3.5 w-3.5 text-indigo-500" />
                        {log.binCode}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {log.storeName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.plantName}
                      </div>
                    </td>

                    {/* Operator / Machine */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        {log.operatorName}
                      </div>
                      {log.issuedTo && (
                        <div className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          To: {log.issuedTo}
                        </div>
                      )}
                      {log.notes && (
                        <div className="text-[10px] text-slate-400 max-w-[180px] truncate" title={log.notes}>
                          {log.notes}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPrintData({
                            type: log.type === 'receive' ? 'po' : 'wo',
                            code: log.scannedBarcode || log.movementNumber,
                            title: log.stockItemName,
                            subtext: `${log.qty} ${log.unit} • Ref: ${log.referenceNumber}`,
                            locationName: `${log.binCode} (${log.storeName})`
                          });
                          setPrintModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Print Barcode Tag"
                      >
                        <Printer className="h-3.5 w-3.5 text-indigo-600" />
                        Tag
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Print Modal */}
      <BarcodeLabelPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        defaultData={printData}
      />
    </div>
  );
};
