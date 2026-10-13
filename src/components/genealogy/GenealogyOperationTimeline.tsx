// src/components/genealogy/GenealogyOperationTimeline.tsx

import React from 'react';
import {
  Clock,
  Cpu,
  User,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Plus,
  ShieldAlert,
  Edit2,
  FileCheck2,
  Info,
  Calendar,
  Hash
} from 'lucide-react';
import { ProductionGenealogyRecord, OperationGenealogyStep } from '../../types/genealogy';

interface GenealogyOperationTimelineProps {
  record: ProductionGenealogyRecord;
  onOpenLogModal: () => void;
  onOpenCompliance: () => void;
  onQuarantineItem: () => void;
}

export const GenealogyOperationTimeline: React.FC<GenealogyOperationTimelineProps> = ({
  record,
  onOpenLogModal,
  onOpenCompliance,
  onQuarantineItem
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Passed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <PlayCircle className="w-3 h-3 text-cyan-400" />
            <span>In-Progress</span>
          </span>
        );
      case 'hold':
      case 'quarantined':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Hold / QC Fail</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-100">
              Operational Traveler &amp; Execution History
            </h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
              {record.identifier}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step digital traveler with operator signatures, machine identifiers, and verified cycle timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onQuarantineItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/60 text-xs font-medium transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Hold / Quarantine</span>
          </button>

          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Next Operation</span>
          </button>
        </div>
      </div>

      {/* ── Chronological Operations Table ─────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono uppercase text-[10px]">
              <th className="py-2.5 px-3">Seq #</th>
              <th className="py-2.5 px-3">Operation &amp; Work Center</th>
              <th className="py-2.5 px-3">Assigned Machine</th>
              <th className="py-2.5 px-3">Certified Operator</th>
              <th className="py-2.5 px-3">Start &amp; End Timestamp</th>
              <th className="py-2.5 px-3 text-right">Duration</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-center">QC Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {record.operations.map((op, idx) => (
              <tr key={op.stepId} className="hover:bg-slate-850/50 transition">
                {/* Sequence */}
                <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                  <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                    {op.sequence}
                  </div>
                </td>

                {/* Operation & Cell */}
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-100">{op.operationName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{op.workCenterName}</div>
                </td>

                {/* Machine */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-mono text-cyan-300">{op.machineCode}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{op.machineName}</div>
                </td>

                {/* Operator */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{op.operatorName}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">Badge: {op.operatorBadge}</div>
                </td>

                {/* Timestamps */}
                <td className="py-3 px-3 font-mono text-slate-300">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">In:</span>
                    <span>{op.startedAt ? new Date(op.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-slate-500">Out:</span>
                    <span>{op.completedAt ? new Date(op.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In-Progress'}</span>
                  </div>
                </td>

                {/* Duration */}
                <td className="py-3 px-3 text-right font-mono">
                  <div className="font-bold text-slate-100">
                    {op.durationMinutes ? `${op.durationMinutes} min` : 'Running'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Std: {op.plannedDurationMinutes} min
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center">
                  {getStatusBadge(op.status)}
                </td>

                {/* QC Result */}
                <td className="py-3 px-3 text-center">
                  {op.qcParameters.length === 0 ? (
                    <span className="text-[10px] text-slate-500 font-mono">—</span>
                  ) : op.qcParameters.every(q => q.status === 'pass') ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      <FileCheck2 className="w-3 h-3 text-emerald-400" />
                      <span>{op.qcParameters.length} Checks OK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Param Out</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Summary Footer with Compliance Seal ─────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-slate-200">
              Digital Traveler Verification: 100% Sequence Completed
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Mill Heat {record.rawMaterialSummary.heatNumber} &bull; MTR Cert {record.rawMaterialSummary.mtrNumber} &bull; Work Order {record.workOrderNumber}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCompliance}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600/40 text-teal-200 border border-teal-500/50 text-xs font-semibold transition cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>View Audit Report &amp; CoC</span>
        </button>
      </div>
    </div>
  );
};
