// src/components/genealogy/LogOperationStepModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Cpu,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { ProductionGenealogyRecord, OperationGenealogyStep, OperationStepStatus } from '../../types/genealogy';

interface LogOperationStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProductionGenealogyRecord | null;
  onSave: (stepData: Omit<OperationGenealogyStep, 'stepId'>) => Promise<void>;
}

export const LogOperationStepModal: React.FC<LogOperationStepModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave
}) => {
  if (!isOpen || !record) return null;

  const nextSequence = (record.operations.length > 0
    ? Math.max(...record.operations.map(o => o.sequence)) + 10
    : 10);

  const [sequence, setSequence] = useState<number>(nextSequence);
  const [operationName, setOperationName] = useState('High Precision CNC Turning & Boring');
  const [workCenterName, setWorkCenterName] = useState('CNC Machining Bay #2');
  const [machineCode, setMachineCode] = useState('MC-CNC-03');
  const [machineName, setMachineName] = useState('Doosan Lynx 2100LSY CNC Lathe');
  const [operatorName, setOperatorName] = useState('Vikram Rao');
  const [operatorBadge, setOperatorBadge] = useState('EMP-104');
  const [startedAt, setStartedAt] = useState<string>(() => new Date(Date.now() - 65 * 60 * 1000).toISOString().slice(0, 16));
  const [completedAt, setCompletedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState<number>(60);
  const [status, setStatus] = useState<OperationStepStatus>('completed');
  const [paramName, setParamName] = useState('Critical Journal Bore Dia');
  const [paramSpec, setParamSpec] = useState('50.000 ± 0.008 mm');
  const [paramVal, setParamVal] = useState('50.003 mm');
  const [notes, setNotes] = useState('Surface finish Ra 0.22 achieved. Tooling inspected and signed off.');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const startTime = new Date(startedAt).toISOString();
      const endTime = completedAt ? new Date(completedAt).toISOString() : undefined;
      const duration = endTime
        ? Math.max(1, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)))
        : 0;

      await onSave({
        sequence,
        operationName,
        workCenterId: `wc-${Date.now()}`,
        workCenterName,
        machineId: `mc-${machineCode.toLowerCase()}`,
        machineName,
        machineCode,
        operatorId: `usr-${operatorBadge.toLowerCase()}`,
        operatorName,
        operatorBadge,
        startedAt: startTime,
        completedAt: endTime,
        durationMinutes: duration,
        plannedDurationMinutes,
        status,
        qcParameters: [
          {
            paramName,
            specification: paramSpec,
            measuredValue: paramVal,
            status: 'pass',
            inspectorName: operatorName
          }
        ],
        consumedRawLots: [],
        notes
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Log Operation Step on Traveler
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Item: {record.identifier} &bull; Work Order: {record.workOrderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Sequence #</label>
              <input
                type="number"
                value={sequence}
                onChange={e => setSequence(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Operation Name</label>
              <input
                type="text"
                value={operationName}
                onChange={e => setOperationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Work Center / Bay</label>
              <input
                type="text"
                value={workCenterName}
                onChange={e => setWorkCenterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OperationStepStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="completed">Completed (Passed QC)</option>
                <option value="in_progress">In-Progress</option>
                <option value="hold">Hold / Quarantine Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Machine Code</label>
              <input
                type="text"
                value={machineCode}
                onChange={e => setMachineCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Machine Name</label>
              <input
                type="text"
                value={machineName}
                onChange={e => setMachineName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Operator Name</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Operator Badge #</label>
              <input
                type="text"
                value={operatorBadge}
                onChange={e => setOperatorBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Start Timestamp</label>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">End Timestamp</label>
              <input
                type="datetime-local"
                value={completedAt}
                onChange={e => setCompletedAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              In-Process QC Verification Parameter
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Parameter Name"
                value={paramName}
                onChange={e => setParamName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="Specification"
                value={paramSpec}
                onChange={e => setParamSpec(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
              />
              <input
                type="text"
                placeholder="Measured Value"
                value={paramVal}
                onChange={e => setParamVal(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Operator Traveler Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
            >
              {submitting ? 'Recording...' : 'Commit Step to Traveler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
