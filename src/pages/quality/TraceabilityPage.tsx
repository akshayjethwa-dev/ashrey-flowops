// src/pages/quality/TraceabilityPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  GitBranch,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  Package,
  Layers,
  Truck,
  Building2,
  AlertTriangle,
  Printer,
  ExternalLink,
  ChevronRight,
  Lock,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  Activity,
  ArrowRight,
  ArrowLeft,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTraceability } from '../../hooks/useTraceability';
import {
  LotRecord,
  LotType,
  LotStatus,
  RecallReport
} from '../../types/traceability';
import { MaterialReceiptLotModal } from '../../components/traceability/MaterialReceiptLotModal';
import { GenealogyTraceGraphModal } from '../../components/traceability/GenealogyTraceGraphModal';
import { InitiateRecallModal } from '../../components/traceability/InitiateRecallModal';
import { RecallReportPrintModal } from '../../components/traceability/RecallReportPrintModal';
import { LotDetailDrawer } from '../../components/traceability/LotDetailDrawer';
import { LotIssueToWoModal } from '../../components/traceability/LotIssueToWoModal';

export const TraceabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const {
    lots,
    recalls,
    loading,
    error,
    kpis,
    createMaterialReceiptLot,
    linkLotToWorkOrder,
    initiateRecall,
    updateRecallStatus
  } = useTraceability();

  // Tab State
  const [activeTab, setActiveTab] = useState<'register' | 'recalls' | 'wip_links' | 'grn_log'>('register');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<LotType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'all'>('all');

  // Modals State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [traceGraphModalOpen, setTraceGraphModalOpen] = useState(false);
  const [traceInitialLot, setTraceInitialLot] = useState<string>('LOT-2026-RM-0412');
  const [traceDirection, setTraceDirection] = useState<'forward' | 'backward'>('forward');

  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [recallTargetLot, setRecallTargetLot] = useState<string>('');

  const [printRecallModalOpen, setPrintRecallModalOpen] = useState(false);
  const [selectedRecallReport, setSelectedRecallReport] = useState<RecallReport | null>(null);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedLotForDetail, setSelectedLotForDetail] = useState<LotRecord | null>(null);

  const [issueToWoModalOpen, setIssueToWoModalOpen] = useState(false);
  const [selectedLotForIssue, setSelectedLotForIssue] = useState<LotRecord | null>(null);

  // Filtered Lots
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      if (typeFilter !== 'all' && lot.lotType !== typeFilter) return false;
      if (statusFilter !== 'all' && lot.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesLot = lot.lotNumber.toLowerCase().includes(q);
        const matchesSku = lot.stockItemCode.toLowerCase().includes(q) || lot.stockItemName.toLowerCase().includes(q);
        const matchesHeat = lot.heatNumber?.toLowerCase().includes(q);
        const matchesSupplier = lot.supplierName?.toLowerCase().includes(q);
        const matchesPo = lot.poNumber?.toLowerCase().includes(q);
        const matchesBin = lot.binCode.toLowerCase().includes(q);
        const matchesGrn = lot.grnNumber?.toLowerCase().includes(q);
        return matchesLot || matchesSku || matchesHeat || matchesSupplier || matchesPo || matchesBin || matchesGrn;
      }
      return true;
    });
  }, [lots, typeFilter, statusFilter, searchQuery]);

  const handleOpenTrace = (lotNumber: string, direction: 'forward' | 'backward') => {
    setTraceInitialLot(lotNumber);
    setTraceDirection(direction);
    setTraceGraphModalOpen(true);
  };

  const handleOpenRecall = (lotNumber: string) => {
    setRecallTargetLot(lotNumber);
    setRecallModalOpen(true);
  };

  const handleOpenPrintRecall = (recall: RecallReport) => {
    setSelectedRecallReport(recall);
    setPrintRecallModalOpen(true);
  };

  const handleOpenDetail = (lot: LotRecord) => {
    setSelectedLotForDetail(lot);
    setDetailDrawerOpen(true);
  };

  const handleOpenIssueToWo = (lot: LotRecord) => {
    setSelectedLotForIssue(lot);
    setIssueToWoModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Lot / Batch Traceability & Containment
                </h1>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  ISO / IATF 16949
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Full-lifecycle material genealogy linking Mill Heat Certificates → Receiving GRN → Work Orders → Finished Goods → Customer Dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/edhr')}
            className="px-4 py-2.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-teal-600" />
            <span>Electronic Batch (eDHR)</span>
          </button>

          <button
            onClick={() => handleOpenTrace(lots[0]?.lotNumber || 'LOT-2026-RM-0412', 'forward')}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-colors"
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span>Genealogy Explorer</span>
          </button>

          <button
            onClick={() => handleOpenRecall(lots[0]?.lotNumber || '')}
            className="px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Initiate Recall Hold</span>
          </button>

          <button
            onClick={() => setReceiptModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Dock Receipt & Auto-Lot</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tracked Master Lots</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.totalLotsCount}</div>
          <span className="text-[10px] text-slate-500 mt-1">{kpis.rawMaterialLotsCount} Raw • {kpis.finishedGoodsLotsCount} Finished</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active & Released</span>
          <div className="text-2xl font-black text-emerald-600 mt-2">{kpis.activeReleasedCount}</div>
          <span className="text-[10px] text-emerald-600 mt-1">Available for shopfloor use</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quarantine Holding</span>
          <div className="text-2xl font-black text-amber-600 mt-2">{kpis.quarantinedCount}</div>
          <span className="text-[10px] text-amber-600 mt-1">Awaiting lab tests</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
          kpis.recalledCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Recalled / Lockdown</span>
          <div className="text-2xl font-black text-rose-700 mt-2 flex items-center space-x-2">
            <span>{kpis.recalledCount}</span>
            {kpis.recalledCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold mt-1">{kpis.activeRecallsCount} Active Recall Bulletins</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tracked Inventory Value</span>
          <div className="text-2xl font-black text-indigo-950 mt-2">₹{(kpis.totalInventoryValue / 100000).toFixed(1)}L</div>
          <span className="text-[10px] text-slate-500 mt-1">Current on-hand valuation</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">QC Receiving Pass Rate</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.inspectionPassRatePct}%</div>
          <span className="text-[10px] text-slate-500 mt-1">Spectrometer & dimensional</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 flex space-x-8 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('register')}
            className={`py-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'register'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Lot Master Register ({filteredLots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recalls')}
            className={`py-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'recalls'
                ? 'border-rose-600 text-rose-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Recall & Containment Center ({recalls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wip_links')}
            className={`py-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'wip_links'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Work Order Genealogy Links</span>
          </button>

          <button
            onClick={() => setActiveTab('grn_log')}
            className={`py-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'grn_log'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>GRN Inward Receipts & Heat Logs</span>
          </button>
        </div>

        {/* Tab 1: Lot Master Register */}
        {activeTab === 'register' && (
          <div className="p-6 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Scan or search Lot #, Heat #, PO #, SKU, or Bin..."
                  className="pl-9 pr-4 py-2 text-xs font-mono rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 w-full bg-slate-50/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="text-xs rounded-xl border-slate-300 py-2 px-3 bg-white font-medium text-slate-700 shadow-sm"
                >
                  <option value="all">All Lot Types</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="finished_goods">Finished Goods</option>
                  <option value="sub_assembly">Sub-Assembly</option>
                  <option value="bought_out">Bought-Out</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="text-xs rounded-xl border-slate-300 py-2 px-3 bg-white font-medium text-slate-700 shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="released">Released</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="recalled">Recalled</option>
                  <option value="consumed">Consumed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Lot Number / Barcode</th>
                      <th className="p-3">Material Master SKU</th>
                      <th className="p-3">Heat / Cast #</th>
                      <th className="p-3">Source Origin (PO / WO)</th>
                      <th className="p-3">Storage Bin</th>
                      <th className="p-3 text-right">Available Qty</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLots.map(lot => {
                      const isRec = lot.status === 'recalled' || lot.isRecalled;
                      return (
                        <tr
                          key={lot.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isRec ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span
                                onClick={() => handleOpenDetail(lot)}
                                className="font-mono font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline underline-offset-2"
                              >
                                {lot.lotNumber}
                              </span>
                              {isRec && (
                                <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded uppercase">
                                  RECALL
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {lot.barcode}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{lot.stockItemName}</div>
                            <div className="text-[10px] text-slate-400">
                              [{lot.stockItemCode}] • {lot.materialGrade || 'Standard'}
                            </div>
                          </td>

                          <td className="p-3">
                            {lot.heatNumber ? (
                              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                {lot.heatNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">N/A</span>
                            )}
                          </td>

                          <td className="p-3">
                            {lot.poNumber ? (
                              <div>
                                <span className="font-mono text-slate-700 font-medium">{lot.poNumber}</span>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {lot.supplierName}
                                </div>
                              </div>
                            ) : lot.producedFromOrderNumber ? (
                              <div>
                                <span className="font-mono text-purple-700 font-medium">{lot.producedFromOrderNumber}</span>
                                <div className="text-[10px] text-slate-400">Manufactured in-house</div>
                              </div>
                            ) : (
                              <span className="text-slate-500">Direct Inward</span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-800">{lot.binCode}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{lot.storeName}</div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="font-bold text-slate-900">{lot.currentQty} {lot.unit}</div>
                            <div className="text-[10px] text-slate-400">
                              Init: {lot.initialQty} | WIP: {lot.consumedQty}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isRec
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : lot.status === 'released'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : lot.status === 'quarantine'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lot.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenTrace(lot.lotNumber, lot.lotType === 'finished_goods' ? 'backward' : 'forward')}
                                title="Explore Visual Genealogy"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <GitBranch className="w-4 h-4" />
                              </button>

                              {lot.lotType === 'raw_material' && lot.currentQty > 0 && !isRec && (
                                <button
                                  onClick={() => handleOpenIssueToWo(lot)}
                                  title="Issue to Work Order"
                                  className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                >
                                  <Layers className="w-4 h-4" />
                                </button>
                              )}

                              {!isRec && (
                                <button
                                  onClick={() => handleOpenRecall(lot.lotNumber)}
                                  title="Initiate Recall Containment"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenDetail(lot)}
                                title="View Lot Profile"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Precision Recall & Containment Center */}
        {activeTab === 'recalls' && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">Active Recall Containment Bulletins</h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Formal 8D Root-Cause Action Reports with forward material exposure tracking and customer alert schedules.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenRecall(lots[0]?.lotNumber || '')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Declare New Containment</span>
              </button>
            </div>

            {/* Recalls List */}
            <div className="space-y-4">
              {recalls.map(rc => (
                <div
                  key={rc.id}
                  className="bg-white border-2 border-rose-200 hover:border-rose-300 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-200">
                          {rc.recallNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                          {rc.severity} SEVERITY
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {rc.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{rc.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Suspect Lot: <strong className="font-mono text-indigo-700">{rc.suspectLotNumber}</strong> • Item: <strong>{rc.suspectItemName}</strong> • Heat #: <strong className="font-mono text-amber-700">{rc.heatNumber || 'N/A'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenPrintRecall(rc)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Official 8D Report</span>
                      </button>

                      <button
                        onClick={() => handleOpenTrace(rc.suspectLotNumber, 'forward')}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-indigo-200 transition-colors"
                      >
                        <GitBranch className="w-4 h-4" />
                        <span>View Tree</span>
                      </button>
                    </div>
                  </div>

                  {/* Exposure Metric Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Quarantine</span>
                      <span className="font-bold text-rose-700 text-sm">
                        {rc.exposure.warehouseOnHandQty} on-hand ({rc.affectedLocations.length} bins locked)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">WIP Line Stops</span>
                      <span className="font-bold text-purple-700 text-sm">
                        {rc.exposure.wipWorkOrderCount} Work Orders halted
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Finished Goods Impact</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {rc.exposure.finishedGoodsProducedQty} FG units exposed
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Dispatches</span>
                      <span className="font-bold text-rose-600 text-sm">
                        {rc.exposure.dispatchedToCustomerQty} units ({rc.affectedDispatches.length} invoices)
                      </span>
                    </div>
                  </div>

                  {/* Root Cause & CAPA preview */}
                  <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                    <span className="font-bold text-amber-900 block mb-0.5">5-Why Root-Cause Finding:</span>
                    {rc.rootCauseFindings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Work Order Genealogy Links */}
        {activeTab === 'wip_links' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Work Order Material Consumption Matrix</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live shopfloor logs showing which Raw Material lots and mill heats were consumed to assemble finished products.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Work Order #</th>
                    <th className="p-3">Manufactured Part</th>
                    <th className="p-3">Source Raw Lot</th>
                    <th className="p-3">Mill Heat / Cast #</th>
                    <th className="p-3">Operation & Machine</th>
                    <th className="p-3 text-right">Consumed Qty</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Resulting FG Lot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lots.flatMap(lot =>
                    (lot.workOrderLinks || []).map(link => (
                      <tr key={link.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-purple-700">{link.workOrderNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">{link.partName}</td>
                        <td className="p-3 font-mono text-indigo-700 font-semibold">{lot.lotNumber}</td>
                        <td className="p-3 font-mono text-amber-700 font-bold">{lot.heatNumber || 'N/A'}</td>
                        <td className="p-3 text-slate-600">
                          {link.operationName} • {link.workCenterName}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{link.consumedQty} {link.unit}</td>
                        <td className="p-3 text-slate-600">{link.consumedByOperator}</td>
                        <td className="p-3">
                          {link.resultingFgLotNumber ? (
                            <span className="font-mono font-bold text-emerald-700">{link.resultingFgLotNumber}</span>
                          ) : (
                            <span className="text-slate-400">In Production</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Inward GRN Dock Log */}
        {activeTab === 'grn_log' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Goods Receipt Note (GRN) & Heat Master Register</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Material dock arrivals with Mill Test Report (MTR) certificates, spectrometer analysis, and bin storage records.
                </p>
              </div>
              <button
                onClick={() => setReceiptModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Inward GRN</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">GRN Number</th>
                    <th className="p-3">Receipt Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">PO & Challan</th>
                    <th className="p-3">Generated Lot #</th>
                    <th className="p-3">Heat / Cast #</th>
                    <th className="p-3">Mill MTR Certificate</th>
                    <th className="p-3 text-right">Inward Qty</th>
                    <th className="p-3 text-center">QC Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lots.filter(l => l.grnNumber).map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{l.grnNumber}</td>
                      <td className="p-3 text-slate-600">{new Date(l.receivedAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-semibold text-slate-800">{l.supplierName || 'Direct Inward'}</td>
                      <td className="p-3 font-mono text-slate-700">
                        {l.poNumber || 'N/A'} {l.vendorChallanNo ? `• ${l.vendorChallanNo}` : ''}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{l.lotNumber}</td>
                      <td className="p-3 font-mono font-bold text-amber-700">{l.heatNumber || 'N/A'}</td>
                      <td className="p-3">
                        {l.inspectionRecord?.mtrNumber ? (
                          <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {l.inspectionRecord.mtrNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">Dock Inspection</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">{l.initialQty} {l.unit}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            l.inspectionStatus === 'passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.inspectionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <MaterialReceiptLotModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSubmit={createMaterialReceiptLot}
      />

      <GenealogyTraceGraphModal
        isOpen={traceGraphModalOpen}
        onClose={() => setTraceGraphModalOpen(false)}
        initialLotNumber={traceInitialLot}
        initialDirection={traceDirection}
        onInitiateRecall={handleOpenRecall}
        onPrintRecallReport={lotNum => {
          const matchRecall = recalls.find(r => r.suspectLotNumber === lotNum) || recalls[0];
          if (matchRecall) handleOpenPrintRecall(matchRecall);
        }}
      />

      <InitiateRecallModal
        isOpen={recallModalOpen}
        onClose={() => setRecallModalOpen(false)}
        lots={lots}
        initialLotNumber={recallTargetLot}
        onSubmit={initiateRecall}
      />

      <RecallReportPrintModal
        isOpen={printRecallModalOpen}
        onClose={() => setPrintRecallModalOpen(false)}
        recall={selectedRecallReport}
      />

      <LotDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        lot={selectedLotForDetail}
        onExploreTrace={handleOpenTrace}
        onIssueToWo={handleOpenIssueToWo}
        onInitiateRecall={handleOpenRecall}
      />

      <LotIssueToWoModal
        isOpen={issueToWoModalOpen}
        onClose={() => setIssueToWoModalOpen(false)}
        lot={selectedLotForIssue}
        onSubmit={params => {
          if (!selectedLotForIssue) return Promise.reject();
          return linkLotToWorkOrder(selectedLotForIssue.lotNumber, params);
        }}
      />
    </div>
  );
};
