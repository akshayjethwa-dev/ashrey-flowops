// src/components/cost-variance/SourceTransactionDrillDownModal.tsx

import React, { useState } from 'react';
import {
  X,
  Layers,
  Package,
  Clock,
  Factory,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  User,
  Barcode,
  Save,
  Tag,
  Info
} from 'lucide-react';
import { VarianceReportRow } from '../../types/costVariance';
import { costVarianceService } from '../../services/costVarianceService';
import { useToast } from '../../context/ToastContext';

interface Props {
  row: VarianceReportRow;
  thresholdPct: number;
  onClose: () => void;
  onUpdated: () => void;
}

export const SourceTransactionDrillDownModal: React.FC<Props> = ({
  row,
  thresholdPct,
  onClose,
  onUpdated
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'material' | 'labor' | 'machine' | 'overhead' | 'audit'>('material');

  // Audit form state
  const [noteText, setNoteText] = useState(row.accountantNotes || '');
  const [rootCause, setRootCause] = useState<string>(row.rootCauseCategory || 'Normal');
  const [isSavingAudit, setIsSavingAudit] = useState(false);

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAudit(true);
    costVarianceService.saveAuditNote(row.workOrderId, noteText, rootCause);
    setIsSavingAudit(false);
    addToast('success', 'Audit Note Saved', `Updated variance notes and root cause for ${row.workOrderNumber}.`);
    onUpdated();
  };

  const getVarianceBadge = (varianceCost: number, variancePct: number) => {
    if (varianceCost > 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1 font-mono">
          <TrendingUp size={12} />
          +₹{varianceCost.toLocaleString()} (+{variancePct}%)
        </span>
      );
    }
    if (varianceCost < 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 font-mono">
          <TrendingDown size={12} />
          -₹{Math.abs(varianceCost).toLocaleString()} ({variancePct}%)
        </span>
      );
    }
    return <span className="text-xs text-slate-400 font-mono">±0 (0%)</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              row.profitabilityStatus === 'made_money'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{row.workOrderNumber}</h2>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium border border-slate-700">
                  {row.partCode}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  row.profitabilityStatus === 'made_money'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {row.profitabilityStatus === 'made_money' ? '★ MADE MONEY' : '⚠ LOSS MAKING JOB'}
                </span>
                {row.isThresholdAlert && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    &gt; {thresholdPct}% THRESHOLD ALERT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {row.partName} • Customer: <strong className="text-slate-300">{row.customerName}</strong> • Qty: {row.quantity} pcs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Close drill-down"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Financial Comparison Ribbon */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Revenue</span>
            <span className="text-base font-bold font-mono text-white">₹{row.totalRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 block">₹{row.contractPricePerUnit}/unit</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quoted vs Actual Cost</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-300 text-xs">₹{row.totalPlannedCost.toLocaleString()}</span>
              <span className="text-slate-600">→</span>
              <span className="font-mono text-amber-300 font-bold text-sm">₹{row.totalActualCost.toLocaleString()}</span>
            </div>
            <div className="mt-0.5">{getVarianceBadge(row.totalVarianceCost, row.totalVariancePercent)}</div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gross Profit Realized</span>
            <div className={`text-base font-bold font-mono ${row.actualGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{row.actualGrossProfit.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Quoted Target: ₹{row.plannedGrossProfit.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gross Margin & Erosion</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-bold font-mono ${row.actualGrossMarginPercent >= 15 ? 'text-emerald-400' : row.actualGrossMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {row.actualGrossMarginPercent}%
              </span>
              <span className="text-[10px] text-slate-500">(Target: {row.plannedGrossMarginPercent}%)</span>
            </div>
            <span className={`text-[10px] block ${row.marginErosionPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {row.marginErosionPercent > 0 ? `-${row.marginErosionPercent}% Margin Eroded` : `+${Math.abs(row.marginErosionPercent)}% Margin Expanded`}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-900 flex space-x-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('material')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'material'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={14} />
            <span>Material Ledger ({row.materialTransactions.length})</span>
            {row.material.varianceCost > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded text-[10px] font-mono">
                +₹{row.material.varianceCost.toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('labor')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'labor'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock size={14} />
            <span>Labor Time Punch Logs ({row.laborTransactions.length})</span>
            {row.labor.varianceCost > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded text-[10px] font-mono">
                +₹{row.labor.varianceCost.toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('machine')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'machine'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory size={14} />
            <span>Machine Meter Hours ({row.machineTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overhead')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'overhead'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} />
            <span>Overhead Absorption Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Cost Accountant Audit & Notes</span>
            {row.accountantNotes && <span className="w-2 h-2 rounded-full bg-purple-400"></span>}
          </button>
        </div>

        {/* Body Contents */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          
          {/* TAB 1: MATERIAL SOURCE TRANSACTIONS */}
          {activeTab === 'material' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-blue-400" />
                    Material Consumption & Lot Issue Source Transactions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Drill-down to specific heat numbers, batch lot codes, bin allocations, and standard BOM versus actual quantity issues.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Material Cost Variance:</div>
                  <div>{getVarianceBadge(row.material.varianceCost, row.material.variancePercent)}</div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Material Code & Name</th>
                      <th className="py-2.5 px-3">Lot / Heat #</th>
                      <th className="py-2.5 px-3">Bin / Location</th>
                      <th className="py-2.5 px-3 text-right">Std BOM Qty</th>
                      <th className="py-2.5 px-3 text-right">Actual Issued</th>
                      <th className="py-2.5 px-3 text-right">Scrap Waste</th>
                      <th className="py-2.5 px-3 text-right">Std Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Actual Lot Price</th>
                      <th className="py-2.5 px-3 text-right">Variance (INR)</th>
                      <th className="py-2.5 px-3 text-center">Issued By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                    {row.materialTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500">
                          No direct material issues logged for this work order yet.
                        </td>
                      </tr>
                    ) : (
                      row.materialTransactions.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{m.materialName}</div>
                            <div className="text-[10px] font-mono text-indigo-400">{m.materialCode}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                              {m.lotNumber}
                            </span>
                            {m.heatNumber && (
                              <div className="text-[10px] text-slate-500 mt-0.5">Heat: {m.heatNumber}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            <div>{m.storeLocation}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Bin: {m.binCode}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {m.standardRequiredQty} {m.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {m.actualIssuedQty} {m.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                            {m.scrapWasteQty > 0 ? `+${m.scrapWasteQty} ${m.unit}` : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            ₹{m.standardUnitCost}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                            ₹{m.actualUnitCost}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={m.varianceCost > 0 ? 'text-rose-400' : m.varianceCost < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                              {m.varianceCost > 0 ? `+₹${m.varianceCost.toLocaleString()}` : m.varianceCost < 0 ? `-₹${Math.abs(m.varianceCost).toLocaleString()}` : '0'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">
                            <div className="text-[11px] text-slate-300">{m.issuedByOperator}</div>
                            <div className="text-[10px] text-slate-500">{new Date(m.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Material Subtotal Summary Box */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-400">
                  Total Planned Material: <strong className="text-white">₹{row.material.plannedCost.toLocaleString()}</strong>
                  <span className="mx-2">•</span>
                  Total Actual Material Incurred: <strong className="text-amber-300">₹{row.material.actualCost.toLocaleString()}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Material Cost Variance:</span>
                  {getVarianceBadge(row.material.varianceCost, row.material.variancePercent)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LABOR TIME PUNCH LOGS */}
          {activeTab === 'labor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-emerald-400" />
                    Shop Floor Operator Labor Time Punch Logs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Itemized time clock captures, operator wage rates, setup vs runtime variance, and overtime premiums.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Labor Cost Variance:</div>
                  <div>{getVarianceBadge(row.labor.varianceCost, row.labor.variancePercent)}</div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Operation Sequence</th>
                      <th className="py-2.5 px-3">Operator Name & Badge</th>
                      <th className="py-2.5 px-3 text-right">Wage Rate (INR/hr)</th>
                      <th className="py-2.5 px-3 text-right">Std Plan Time</th>
                      <th className="py-2.5 px-3 text-right">Actual Setup</th>
                      <th className="py-2.5 px-3 text-right">Actual Run</th>
                      <th className="py-2.5 px-3 text-right">Total Min</th>
                      <th className="py-2.5 px-3 text-right">Std Cost</th>
                      <th className="py-2.5 px-3 text-right">Actual Cost</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                    {row.laborTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500">
                          No direct labor time logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      row.laborTransactions.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">Op {l.operationSequence}: {l.operationName}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {l.operationId}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-200">{l.operatorName}</div>
                            <div className="text-[10px] font-mono text-indigo-400">{l.operatorBadgeNumber} ({l.role})</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            ₹{l.hourlyRate}/hr
                            {l.overtimeLaborCost > 0 && (
                              <div className="text-[10px] text-amber-400">OT: ₹{l.overtimeHourlyRate}/hr</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {l.standardMinutes} min
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {l.actualSetupMinutes} min
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {l.actualRunMinutes} min
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {l.totalActualMinutes} min
                            {l.isLiveRunning && (
                              <span className="block text-[9px] text-emerald-400 animate-pulse uppercase">LIVE RUNNING</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            ₹{l.standardLaborCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                            ₹{l.totalLaborCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={l.varianceCost > 0 ? 'text-rose-400' : l.varianceCost < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                              {l.varianceCost > 0 ? `+₹${l.varianceCost.toLocaleString()}` : l.varianceCost < 0 ? `-₹${Math.abs(l.varianceCost).toLocaleString()}` : '0'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Labor Summary Footer */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-400">
                  Total Planned Labor: <strong className="text-white">₹{row.labor.plannedCost.toLocaleString()}</strong>
                  <span className="mx-2">•</span>
                  Total Actual Labor Incurred: <strong className="text-amber-300">₹{row.labor.actualCost.toLocaleString()}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Labor Cost Variance:</span>
                  {getVarianceBadge(row.labor.varianceCost, row.labor.variancePercent)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MACHINE METER HOURS */}
          {activeTab === 'machine' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Factory size={16} className="text-amber-400" />
                    Machine Hour Rate (MHR) & Energy Consumption
                  </h3>
                  <p className="text-xs text-slate-400">
                    Spindle meter run hours, setup calibration, machine depreciation, and tooling wear allowance.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Machine Cost Variance:</div>
                  <div>{getVarianceBadge(row.machine.varianceCost, row.machine.variancePercent)}</div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Machine Code & Description</th>
                      <th className="py-2.5 px-3 text-right">Standard MHR</th>
                      <th className="py-2.5 px-3 text-right">Power Rating</th>
                      <th className="py-2.5 px-3 text-right">Std Plan Hours</th>
                      <th className="py-2.5 px-3 text-right">Actual Hours</th>
                      <th className="py-2.5 px-3 text-right">Setup Cost</th>
                      <th className="py-2.5 px-3 text-right">Machining Cost</th>
                      <th className="py-2.5 px-3 text-right">Tooling Allowance</th>
                      <th className="py-2.5 px-3 text-right">Total Actual Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                    {row.machineTransactions.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{m.machineName}</div>
                          <div className="text-[10px] font-mono text-amber-400">{m.machineCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          ₹{m.hourlyRate}/hr
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {m.powerRatingKw} kW
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {(m.standardMachineMinutes / 60).toFixed(1)} hrs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {m.totalMachineHours} hrs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          ₹{m.setupCost}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          ₹{m.machiningCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          ₹{m.toolingCost}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                          ₹{m.totalMachineCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: OVERHEAD ABSORPTION LEDGER */}
          {activeTab === 'overhead' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-400" />
                    Applied Overhead Absorption Rules & Pool Allocations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active strategy: <strong className="text-indigo-300">{row.overheadConfig.name}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Overhead Variance:</div>
                  <div>{getVarianceBadge(row.overhead.varianceCost, row.overhead.variancePercent)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Factory Overhead</span>
                  <div className="text-lg font-bold font-mono text-indigo-300">
                    ₹{row.overhead.actualCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono pt-1 border-t border-slate-800">
                    <div>Direct Labor Overhead: {row.overheadConfig.laborOverheadPercent}%</div>
                    <div>Machine Hour Levy: ₹{row.overheadConfig.machineHourOverheadRate}/hr</div>
                    <div>Fixed Unit Tooling Levy: ₹{row.overheadConfig.factoryFixedRatePerUnit}/u</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">SG&A (Selling & Admin)</span>
                  <div className="text-lg font-bold font-mono text-indigo-300">
                    {row.overheadConfig.generalAdminSgaPercent}% of Prime Cost
                  </div>
                  <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                    Covers engineering CAD/CAM programming, quality compliance overhead, and corporate logistics.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Overhead Variance vs Quote</span>
                  <div className="text-lg font-bold font-mono">
                    {getVarianceBadge(row.overhead.varianceCost, row.overhead.variancePercent)}
                  </div>
                  <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                    Quoted overhead: ₹{row.overhead.plannedCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COST ACCOUNTANT AUDIT & NOTES */}
          {activeTab === 'audit' && (
            <form onSubmit={handleSaveAudit} className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText size={16} className="text-purple-400" />
                    Cost Accountant Variance Audit & Reconciliation Log
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record formal accounting explanations for job overruns, assign root causes, and prepare variance reports for management review.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Root Cause Category
                    </label>
                    <select
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Normal">Normal / Within Variance Tolerance</option>
                      <option value="Scrap / Defect">High Scrap / Quality Defect Rework</option>
                      <option value="Machine Breakdown">Machine Breakdown / Unplanned Downtime</option>
                      <option value="Rate Hike">Raw Material Price / Lot Surcharge Hike</option>
                      <option value="Overtime">Urgent Customer Delivery Overtime Penalty</option>
                      <option value="Setup Delay">Tooling Setup Calibration & First-Piece Delay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Primary Variance Driver Detected
                    </label>
                    <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 font-bold flex items-center gap-2">
                      <Tag size={14} className="text-amber-400" />
                      {row.primaryDriver} ({row.totalVarianceCost > 0 ? `+₹${row.totalVarianceCost.toLocaleString()}` : `-₹${Math.abs(row.totalVarianceCost).toLocaleString()}`})
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cost Accountant Audit Findings & Corrective Action Notes
                  </label>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="E.g., CNC lathe insert chipped on 3rd cycle causing 45 minutes of setup reset and 3 rejected pieces. Material lot heat #H-8820 had higher hardness than nominal spec."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingAudit}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
                  >
                    <Save size={14} />
                    <span>{isSavingAudit ? 'Saving Audit Note...' : 'Save Audit Log'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Info size={14} className="text-indigo-400" />
            <span>All source data cross-referenced with Shop Floor Time Kiosk, Inventory Lots & ERP Quotes.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
