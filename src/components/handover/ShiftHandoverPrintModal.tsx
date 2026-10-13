// src/components/handover/ShiftHandoverPrintModal.tsx

import React from 'react';
import {
  X,
  Printer,
  Download,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  User,
  Building2
} from 'lucide-react';
import { ShiftHandoverRecord } from '../../types/shiftHandover';
import { shiftHandoverService } from '../../services/shiftHandoverService';

interface ShiftHandoverPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  handover: ShiftHandoverRecord | null;
}

export const ShiftHandoverPrintModal: React.FC<ShiftHandoverPrintModalProps> = ({
  isOpen,
  onClose,
  handover
}) => {
  if (!isOpen || !handover) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvContent = shiftHandoverService.exportCsv(handover);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Shift_Handover_${handover.outgoingShift}_${handover.handoverDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Header Toolbar */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Shift Handover Official Dossier
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-600/40 uppercase">
                  {handover.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Print-ready shift handover document for physical clipboard and shop floor display.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/40 text-slate-100 font-sans print:bg-white print:text-black">
          {/* Plant Letterhead */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 print:border-black print:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase print:text-black">
                  PRECISION MANUFACTURING PLANT OPERATIONS
                </span>
                <h1 className="text-xl font-black text-slate-100 mt-1 print:text-black">
                  OFFICIAL SHIFT SUPERVISOR HANDOVER REPORT
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5 print:text-gray-600">
                  Plant: {handover.plantName} &bull; Date: {handover.handoverDate}
                </p>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-slate-400 text-[10px]">DOCUMENT REF</div>
                <div className="font-bold text-indigo-300 print:text-black">{handover.id}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Dual Signoff: {handover.status === 'acknowledged' ? 'VERIFIED' : 'PENDING ACK'}
                </div>
              </div>
            </div>

            {/* Handover Details Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Outgoing Shift</span>
                <span className="font-bold text-slate-200 print:text-black">{handover.outgoingShiftLabel}</span>
                <div className="text-[11px] text-indigo-400">
                  {handover.outgoingSupervisorName} ({handover.outgoingSupervisorBadge})
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Incoming Shift</span>
                <span className="font-bold text-slate-200 print:text-black">{handover.incomingShiftLabel}</span>
                <div className="text-[11px] text-teal-400">
                  {handover.incomingSupervisorName || 'Pending'} ({handover.incomingSupervisorBadge || '—'})
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Shift Throughput</span>
                <span className="font-bold text-slate-200 print:text-black">
                  {handover.shiftMetrics?.totalUnitsProduced ?? '—'} units
                </span>
                <div className="text-[11px] text-slate-400">
                  OEE: {handover.shiftMetrics?.averageOeePercent ?? '—'}% &bull; Scrap: {handover.shiftMetrics?.totalScrapUnits ?? 0}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Submission Time</span>
                <span className="text-slate-200 print:text-black">
                  {new Date(handover.outgoingSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="text-[11px] text-slate-400">
                  Ack: {handover.incomingAcknowledgedAt ? new Date(handover.incomingAcknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* General Summary & Instructions */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 text-xs print:border-black print:bg-white">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-1 print:text-black">
              General Shift Summary &amp; Direct Instructions
            </span>
            <p className="text-slate-200 print:text-black leading-relaxed">
              {handover.generalSummaryNotes}
            </p>
          </div>

          {/* Safety & Quality Summary */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 text-xs space-y-2 print:border-black print:bg-white">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block print:text-black">
              Safety, Quality Alerts &amp; Critical Notes
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="font-bold text-slate-300 print:text-black block">Safety:</span>
                <span className="text-slate-400 print:text-gray-700">{handover.safetyAndQuality.safetyObservations || 'Zero incidents.'}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="font-bold text-slate-300 print:text-black block">Quality &amp; NCRs:</span>
                <span className="text-slate-400 print:text-gray-700">{handover.safetyAndQuality.qualityAlerts || 'Zero active quality alerts.'}</span>
              </div>
            </div>
          </div>

          {/* Machine Fleet Status Table */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 text-xs print:border-black print:bg-white">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-2 print:text-black">
              Machine Fleet Status ({handover.machinesSummary.length} Machines)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print:border print:border-black text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Code</th>
                    <th className="py-2 px-2.5">Machine &amp; Cell</th>
                    <th className="py-2 px-2.5">State</th>
                    <th className="py-2 px-2.5">Active Job</th>
                    <th className="py-2 px-2.5">Operator</th>
                    <th className="py-2 px-2.5">Maintenance Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {handover.machinesSummary.map(m => (
                    <tr key={m.machineId}>
                      <td className="py-2 px-2.5 font-mono font-bold text-cyan-300 print:text-black">{m.machineCode}</td>
                      <td className="py-2 px-2.5 font-medium text-slate-200 print:text-black">{m.machineName}</td>
                      <td className="py-2 px-2.5 uppercase font-mono text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded ${
                          m.state === 'running' ? 'text-emerald-400' :
                          m.state === 'faulted' ? 'text-rose-400' : 'text-amber-400'
                        } print:text-black`}>
                          {m.state}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-300 print:text-black">{m.currentJob || '—'}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{m.operatorOnStation || '—'}</td>
                      <td className="py-2 px-2.5 text-slate-400 italic print:text-gray-700">{m.maintenanceNote || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Work Orders Table */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 text-xs print:border-black print:bg-white">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-2 print:text-black">
              Open Work Orders at Handover ({handover.openWorkOrders.length} Orders)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print:border print:border-black text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Work Order</th>
                    <th className="py-2 px-2.5">Part Description</th>
                    <th className="py-2 px-2.5">Priority</th>
                    <th className="py-2 px-2.5 text-center">Current Station</th>
                    <th className="py-2 px-2.5 text-right">Qty Done / Target</th>
                    <th className="py-2 px-2.5">Handover Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {handover.openWorkOrders.map(wo => (
                    <tr key={wo.workOrderId}>
                      <td className="py-2 px-2.5 font-mono font-bold text-indigo-300 print:text-black">{wo.orderNumber}</td>
                      <td className="py-2 px-2.5 font-medium text-slate-200 print:text-black">{wo.partName}</td>
                      <td className="py-2 px-2.5 uppercase font-mono text-[10px] text-slate-300 print:text-black">{wo.priority}</td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-300 print:text-black">Op {wo.currentOperationSequence}: {wo.currentOperationName}</td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-200 print:text-black">{wo.completedQuantity} / {wo.targetQuantity} ({wo.progressPercent}%)</td>
                      <td className="py-2 px-2.5 text-slate-300 italic print:text-gray-700">{wo.handoverNote || 'Standard run'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Tasks Checklist */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 text-xs print:border-black print:bg-white">
            <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block mb-2 print:text-black">
              Pending Action Items for Incoming Shift ({handover.pendingTasks.length} Tasks)
            </span>
            <div className="space-y-1.5">
              {handover.pendingTasks.map((t, idx) => (
                <div key={t.id} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between print:bg-gray-50 print:border-black">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">[{t.isCompleted ? '✓' : ' '}]</span>
                    <span className="font-bold text-slate-200 print:text-black">{idx + 1}. {t.taskDescription}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({t.stationOrCell})</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-slate-400 print:text-black">
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Signoff Manifest */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 print:border-black print:bg-white">
            <div className="grid grid-cols-2 gap-6 text-xs font-mono">
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 print:bg-gray-50 print:border-black">
                <span className="text-[10px] uppercase text-indigo-400 font-bold block print:text-black">
                  Outgoing Supervisor Signoff
                </span>
                <div className="text-sm font-bold text-slate-100 print:text-black mt-1">
                  {handover.outgoingSupervisorName}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Badge: {handover.outgoingSupervisorBadge} &bull; Signed: {new Date(handover.outgoingSubmittedAt).toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500 mt-2 truncate">
                  Hash: {handover.outgoingDigitalSignatureHash}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 print:bg-gray-50 print:border-black">
                <span className="text-[10px] uppercase text-teal-400 font-bold block print:text-black">
                  Incoming Supervisor Acknowledgment
                </span>
                <div className="text-sm font-bold text-slate-100 print:text-black mt-1">
                  {handover.incomingSupervisorName || 'Pending Acknowledgment'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Badge: {handover.incomingSupervisorBadge || '—'} &bull; Ack: {handover.incomingAcknowledgedAt ? new Date(handover.incomingAcknowledgedAt).toLocaleString() : 'Pending'}
                </div>
                <div className="text-[9px] text-slate-500 mt-2 truncate">
                  Hash: {handover.incomingDigitalSignatureHash || 'Awaiting Handshake'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Shift Handover Record &bull; Dual Signoff Compliance Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
