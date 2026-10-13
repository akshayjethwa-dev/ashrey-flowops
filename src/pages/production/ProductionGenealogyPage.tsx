// src/pages/production/ProductionGenealogyPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  User,
  Barcode,
  Flame,
  FileText,
  Printer,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Award,
  Sparkles,
  Tablet,
  Gauge,
  FileCheck2
} from 'lucide-react';
import { useProductionGenealogy } from '../../hooks/useProductionGenealogy';
import { GenealogyTreeView } from '../../components/genealogy/GenealogyTreeView';
import { GenealogyOperationTimeline } from '../../components/genealogy/GenealogyOperationTimeline';
import { GenealogyComplianceModal } from '../../components/genealogy/GenealogyComplianceModal';
import { LogOperationStepModal } from '../../components/genealogy/LogOperationStepModal';
import { RegisterUnitBatchModal } from '../../components/genealogy/RegisterUnitBatchModal';
import { ProductionGenealogyRecord, TrackingLevel, ProductionItemStatus } from '../../types/genealogy';
import { qualityHoldService } from '../../services/qualityHoldService';

export const ProductionGenealogyPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    records,
    selectedRecord,
    setSelectedRecord,
    filter,
    setFilter,
    loading,
    refresh,
    createRecord,
    logOperation,
    updateStatus,
    exportCsv
  } = useProductionGenealogy();

  const [activeTab, setActiveTab] = useState<'tree' | 'traveler' | 'registry' | 'compliance'>('tree');
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isLogStepModalOpen, setIsLogStepModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Statistics
  const totalUnits = records.filter(r => r.trackingLevel === 'unit').length;
  const totalBatches = records.filter(r => r.trackingLevel === 'batch').length;
  const inProductionCount = records.filter(r => r.status === 'in_production').length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const quarantineCount = records.filter(r => r.status === 'quarantined' || r.qualityDisposition === 'quarantined').length;

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const term = scanInput.trim().toLowerCase();
    const matched = records.find(r => 
      r.identifier.toLowerCase() === term ||
      r.barcode.toLowerCase() === term ||
      r.workOrderNumber.toLowerCase() === term
    );

    if (matched) {
      setSelectedRecord(matched);
      setScanMessage(`Found record: ${matched.identifier} (${matched.partName})`);
      setTimeout(() => setScanMessage(null), 4000);
    } else {
      setScanMessage(`No unit or batch matching "${scanInput}" found.`);
      setTimeout(() => setScanMessage(null), 4000);
    }
    setScanInput('');
  };

  const handleDownloadAllCsv = () => {
    const csv = exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MES_Production_Genealogy_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuarantineCurrentItem = async () => {
    if (!selectedRecord) return;
    const reason = prompt('Enter reason for Quality Hold / Quarantine:', 'Dimensional deviation or defect suspected during machining');
    if (reason) {
      await updateStatus(selectedRecord.id, 'quarantined', 'quarantined', reason);
      // Synchronize with Quality Holds & Dispatch Lockout Gate
      qualityHoldService.placeHold({
        targetType: selectedRecord.trackingLevel === 'batch' ? 'batch' : 'work_order',
        targetId: selectedRecord.id,
        targetNumber: selectedRecord.identifier || selectedRecord.workOrderNumber,
        workOrderNumber: selectedRecord.workOrderNumber,
        batchNumber: selectedRecord.trackingLevel === 'batch' ? selectedRecord.identifier : undefined,
        partName: selectedRecord.partName,
        customerName: selectedRecord.customerName || 'Production Line / MES',
        quantity: selectedRecord.batchQuantity || 1,
        severity: 'critical',
        holdReasonCategory: 'dimensional_deviation',
        holdReason: reason,
        holdDescription: `Flagged from Production Genealogy workbench during operation tracking. Current station: ${selectedRecord.currentOperationName || 'Shopfloor'}.`,
        location: 'Quarantine Bay 03 — Red Tag Cage',
        placedBy: 'Shopfloor Lead Inspector',
        placedByRole: 'MES Production Quality Lead'
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header & Actions ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-100">
                  Production Reporting &amp; Genealogy
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Unit &amp; Batch Traceability
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Track every unit or batch through every operation with certified operator, machine, and timestamp lineage.
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/work-orders')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            <span>Work Orders</span>
          </button>

          <button
            onClick={() => navigate('/time-capture')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 text-xs font-mono transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Time Kiosk</span>
          </button>

          <button
            onClick={() => navigate('/oee')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-800/60 text-xs font-mono transition cursor-pointer"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Machine OEE</span>
          </button>

          <button
            onClick={() => navigate('/edhr')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/70 hover:bg-teal-900/70 text-teal-300 border border-teal-800/60 text-xs font-mono transition cursor-pointer"
            title="Inspect FDA 21 CFR Part 11 Electronic Batch Records"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
            <span>eDHR Records</span>
          </button>

          <button
            onClick={handleDownloadAllCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Export Entire Ledger to CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Unit/Batch</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tracked Serials</span>
            <Barcode className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{totalUnits} units</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Unit-level genealogy</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Production Batches</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">{totalBatches} batches</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Lot-level traveler</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active WIP</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{inProductionCount} in progress</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Live shop stations</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>QC Conformance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{completedCount} released</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">CoC certified</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Quarantine Hold</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1">{quarantineCount} on hold</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">MRB review flagged</div>
        </div>
      </div>

      {/* ── Search, Barcode Scanner & Filter Bar ──────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Quick Barcode / Serial Scan */}
        <form onSubmit={handleScanSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Scan or enter Serial #, Batch #, Heat #, or Work Order..."
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
          >
            Scan / Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <select
            value={filter.trackingLevel}
            onChange={e => setFilter(prev => ({ ...prev, trackingLevel: e.target.value as TrackingLevel | 'all' }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="all">All Tracking Levels</option>
            <option value="unit">Unit-Level (Serial)</option>
            <option value="batch">Batch-Level (Lot)</option>
          </select>

          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value as ProductionItemStatus | 'all' }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="in_production">In Production</option>
            <option value="completed">Completed / Passed</option>
            <option value="quarantined">Quarantined / Hold</option>
          </select>

          <button
            onClick={() => refresh()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-700 text-indigo-300 text-xs font-mono flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ── Active Item Selector Chips Carousel ───────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-mono text-[11px] uppercase shrink-0">Selected Traveler:</span>
        {records.map(rec => {
          const isSelected = selectedRecord?.id === rec.id;
          return (
            <button
              key={rec.id}
              onClick={() => setSelectedRecord(rec)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{rec.identifier}</span>
              <span className="text-[10px] text-slate-500 font-sans">({rec.partNumber})</span>
              <span className={`w-2 h-2 rounded-full ${
                rec.status === 'completed' ? 'bg-emerald-400' :
                rec.status === 'quarantined' ? 'bg-rose-400' : 'bg-cyan-400 animate-pulse'
              }`} />
            </button>
          );
        })}
      </div>

      {/* ── Tabbed View Switcher ─────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'tree'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Genealogy Tree Flow</span>
        </button>

        <button
          onClick={() => setActiveTab('traveler')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'traveler'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shop Traveler &amp; Stations</span>
        </button>

        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'registry'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Unit / Batch Audit Registry ({records.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('compliance');
            setIsComplianceModalOpen(true);
          }}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'compliance'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Certificate of Conformance (CoC)</span>
        </button>
      </div>

      {/* ── Tab Content Views ───────────────────────────────────────── */}
      {selectedRecord ? (
        <>
          {activeTab === 'tree' && (
            <GenealogyTreeView
              record={selectedRecord}
              onOpenCompliance={() => setIsComplianceModalOpen(true)}
            />
          )}

          {activeTab === 'traveler' && (
            <GenealogyOperationTimeline
              record={selectedRecord}
              onOpenLogModal={() => setIsLogStepModalOpen(true)}
              onOpenCompliance={() => setIsComplianceModalOpen(true)}
              onQuarantineItem={handleQuarantineCurrentItem}
            />
          )}

          {activeTab === 'registry' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Serialized Units &amp; Batches Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive ledger of all tracked components with live operational progress.
                  </p>
                </div>
                <button
                  onClick={handleDownloadAllCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-mono transition"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Download Full CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">Tracking ID</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Work Order</th>
                      <th className="py-2.5 px-3">Part Description</th>
                      <th className="py-2.5 px-3">Heat / Raw Lot</th>
                      <th className="py-2.5 px-3">Current Operation</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {records.map(rec => (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedRecord(rec)}
                        className={`hover:bg-slate-850/50 cursor-pointer transition ${
                          selectedRecord?.id === rec.id ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                          {rec.identifier}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {rec.trackingLevel === 'unit' ? 'Serial (1 pc)' : `Batch (${rec.batchQuantity})`}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {rec.workOrderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-100">{rec.partName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{rec.customerName}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-300">
                          {rec.rawMaterialSummary.heatNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">
                            Op {rec.currentSequence}: {rec.currentOperationName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.operations.length} stations logged
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
                            rec.status === 'completed' ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40' :
                            rec.status === 'quarantined' ? 'text-rose-300 bg-rose-950/70 border-rose-500/40' :
                            'text-cyan-300 bg-cyan-950/70 border-cyan-500/40'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(rec);
                              setIsComplianceModalOpen(true);
                            }}
                            className="p-1.5 rounded hover:bg-slate-800 text-teal-400 transition"
                            title="View Certificate"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No production records found matching filters.</p>
        </div>
      )}

      {/* ── Compliance & Export Modal ───────────────────────────────── */}
      <GenealogyComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        record={selectedRecord}
        onSignedOff={(updated) => {
          setSelectedRecord(updated);
          refresh();
        }}
      />

      {/* ── Log Operation Step Modal ────────────────────────────────── */}
      <LogOperationStepModal
        isOpen={isLogStepModalOpen}
        onClose={() => setIsLogStepModalOpen(false)}
        record={selectedRecord}
        onSave={async (stepData) => {
          if (selectedRecord) {
            await logOperation(selectedRecord.id, stepData);
          }
        }}
      />

      {/* ── Register Unit / Batch Modal ─────────────────────────────── */}
      <RegisterUnitBatchModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={async (data) => {
          await createRecord(data);
        }}
      />
    </div>
  );
};
