// src/components/ipqc/SpawnIpqcTaskModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Zap,
  Building2,
  Lock,
  FileCheck2,
  Cpu
} from 'lucide-react';
import { QualityControlPointConfig, QcpTriggerType } from '../../types/ipqc';

interface SpawnIpqcTaskModalProps {
  configs: QualityControlPointConfig[];
  onClose: () => void;
  onSpawnTask: (params: any) => Promise<any>;
}

export const SpawnIpqcTaskModal: React.FC<SpawnIpqcTaskModalProps> = ({
  configs,
  onClose,
  onSpawnTask
}) => {
  const [selectedQcpId, setSelectedQcpId] = useState<string>(configs[0]?.id || '');
  const activeQcp = configs.find(c => c.id === selectedQcpId) || configs[0];

  const [workOrderNumber, setWorkOrderNumber] = useState<string>('WO-2026-001');
  const [machineCode, setMachineCode] = useState<string>('CNC-04');
  const [triggerType, setTriggerType] = useState<QcpTriggerType>(activeQcp?.triggerType || 'first_piece');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQcp) return;

    try {
      setIsSubmitting(true);
      await onSpawnTask({
        workOrderId: `wo-${workOrderNumber.toLowerCase()}`,
        workOrderNumber,
        partNumber: activeQcp.partNumber,
        partName: activeQcp.partName,
        operationSequence: activeQcp.sequenceNumber,
        operationCode: activeQcp.operationCode,
        operationName: activeQcp.operationName,
        workCenterId: 'wc-cnc-01',
        workCenterName: 'Precision CNC Machining Cell',
        machineCode,
        triggerType,
        qcpId: activeQcp.id
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Trigger In-Process Inspection Task
              </h2>
              <p className="text-xs text-slate-400">
                Spawn QCP task at machine station to verify quality at the source
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-1">
              Select Quality Control Point (QCP)
            </label>
            <select
              value={selectedQcpId}
              onChange={(e) => setSelectedQcpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {configs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.operationCode} • Op {c.sequenceNumber}: {c.operationName} ({c.partNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Order #</label>
              <input
                type="text"
                required
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Machine Asset Code</label>
              <input
                type="text"
                required
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Reason</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="first_piece">First Article / First Piece (FAI) Setup</option>
              <option value="periodic_interval">Periodic Interval / Hourly Patrol</option>
              <option value="final_operation_gate">Final Operation Gate Release</option>
              <option value="tool_change">Tool Change / Cutter Insert Swap</option>
            </select>
          </div>

          {activeQcp && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>Part: <strong className="text-white">{activeQcp.partName}</strong></div>
              <div>Parameters: <strong className="text-blue-400">{activeQcp.parameters.length} characteristics</strong></div>
              <div>Hold Policy: <strong className="text-amber-400">{activeQcp.gateType.replace(/_/g, ' ')}</strong></div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              {isSubmitting ? 'Spawning...' : 'Generate Inspection Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
