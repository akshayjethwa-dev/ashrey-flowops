// src/components/handover/CreateShiftHandoverModal.tsx

import React, { useState } from 'react';
import {
  X,
  Clock,
  Layers,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  User,
  Building2,
  Flame
} from 'lucide-react';
import {
  ShiftHandoverRecord,
  ShiftType,
  ShiftMachineSummary,
  ShiftWorkOrderSummary,
  ShiftPendingTask,
  ShiftSafetyQualityNote
} from '../../types/shiftHandover';
import { shiftHandoverService } from '../../services/shiftHandoverService';

interface CreateShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<ShiftHandoverRecord>) => Promise<void>;
}

export const CreateShiftHandoverModal: React.FC<CreateShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  // Initial draft from live telemetry
  const autoDraft = shiftHandoverService.getAutoCompiledDraft('shift_b');

  const [outgoingShift, setOutgoingShift] = useState<ShiftType>('shift_b');
  const [outgoingSupervisorName, setOutgoingSupervisorName] = useState(autoDraft.outgoingSupervisorName || 'Sanjay Patil');
  const [outgoingSupervisorBadge, setOutgoingSupervisorBadge] = useState(autoDraft.outgoingSupervisorBadge || 'SUP-204');
  const [incomingShift, setIncomingShift] = useState<ShiftType>('shift_c');
  const [incomingSupervisorName, setIncomingSupervisorName] = useState('Vikram Rao');
  const [generalSummaryNotes, setGeneralSummaryNotes] = useState(autoDraft.generalSummaryNotes || '');
  
  // Safety & Quality
  const [safetyIncidentsCount, setSafetyIncidentsCount] = useState(0);
  const [safetyObservations, setSafetyObservations] = useState('Zero safety incidents or near misses recorded during shift.');
  const [activeNcrCount, setActiveNcrCount] = useState(1);
  const [qualityAlerts, setQualityAlerts] = useState('NCR-2026-0042 active on Camshaft Lobe #3. MC-CNC-04 quarantined.');
  const [toolingAlerts, setToolingAlerts] = useState('Sandvik roughing inserts running low in Crib 1.');
  const [rawMaterialShortages, setRawMaterialShortages] = useState('EN8D round bar staged for upcoming shift.');

  // Machines
  const [machines, setMachines] = useState<ShiftMachineSummary[]>(autoDraft.machinesSummary || []);

  // Work Orders
  const [workOrders, setWorkOrders] = useState<ShiftWorkOrderSummary[]>(autoDraft.openWorkOrders || []);

  // Pending Tasks
  const [tasks, setTasks] = useState<ShiftPendingTask[]>(autoDraft.pendingTasks || []);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStation, setNewTaskStation] = useState('CNC Bay');
  const [newTaskPriority, setNewTaskPriority] = useState<'urgent' | 'high' | 'normal'>('high');

  const [submitting, setSubmitting] = useState(false);

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    const task: ShiftPendingTask = {
      id: `task-${Date.now()}`,
      taskDescription: newTaskDesc.trim(),
      stationOrCell: newTaskStation,
      priority: newTaskPriority,
      assignedRoleOrPerson: 'Incoming Supervisor / Lead Tech',
      isCompleted: false
    };
    setTasks([...tasks, task]);
    setNewTaskDesc('');
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        outgoingShift,
        outgoingSupervisorName,
        outgoingSupervisorBadge,
        incomingShift,
        incomingSupervisorName,
        generalSummaryNotes,
        safetyAndQuality: {
          safetyIncidentsCount,
          safetyObservations,
          activeNcrCount,
          qualityAlerts,
          toolingAlerts,
          rawMaterialShortages
        },
        machinesSummary: machines,
        openWorkOrders: workOrders,
        pendingTasks: tasks
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Create Digital Shift Handover Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-600/40">
                  Live MES Synchronized
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pass critical machine statuses, open work orders, and safety notes to the incoming shift supervisor.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Shift & Supervisor Details */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Outgoing Shift</label>
              <select
                value={outgoingShift}
                onChange={e => setOutgoingShift(e.target.value as ShiftType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="shift_a">Shift A (Morning · 06:00 - 14:00)</option>
                <option value="shift_b">Shift B (Afternoon · 14:00 - 22:00)</option>
                <option value="shift_c">Shift C (Night · 22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Outgoing Supervisor Name &amp; Badge</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outgoingSupervisorName}
                  onChange={e => setOutgoingSupervisorName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Supervisor Name"
                  required
                />
                <input
                  type="text"
                  value={outgoingSupervisorBadge}
                  onChange={e => setOutgoingSupervisorBadge(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-indigo-300 font-mono text-center focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Badge #"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Incoming Target Shift</label>
              <select
                value={incomingShift}
                onChange={e => setIncomingShift(e.target.value as ShiftType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="shift_b">Shift B (Afternoon · 14:00 - 22:00)</option>
                <option value="shift_c">Shift C (Night · 22:00 - 06:00)</option>
                <option value="shift_a">Shift A (Morning · 06:00 - 14:00)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Incoming Supervisor</label>
              <input
                type="text"
                value={incomingSupervisorName}
                onChange={e => setIncomingSupervisorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                placeholder="Receiving Supervisor"
              />
            </div>
          </div>

          {/* General Operational Summary */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              General Shift Summary &amp; Direct Instructions
            </label>
            <textarea
              rows={2}
              value={generalSummaryNotes}
              onChange={e => setGeneralSummaryNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 leading-relaxed focus:border-indigo-500 focus:outline-hidden"
              placeholder="Describe general throughput, bottleneck areas, or urgent directives for the incoming shift..."
              required
            />
          </div>

          {/* Safety & Quality Alerts Section */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Safety &amp; Quality Status</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mandatory Handover Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Safety Observations / Incidents</label>
                <input
                  type="text"
                  value={safetyObservations}
                  onChange={e => setSafetyObservations(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Quality Alerts &amp; Active NCRs</label>
                <input
                  type="text"
                  value={qualityAlerts}
                  onChange={e => setQualityAlerts(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Tooling &amp; Cutter Alerts</label>
                <input
                  type="text"
                  value={toolingAlerts}
                  onChange={e => setToolingAlerts(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Raw Material &amp; WIP Staging Alerts</label>
                <input
                  type="text"
                  value={rawMaterialShortages}
                  onChange={e => setRawMaterialShortages(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Machine Fleet Summary Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Live Machine Fleet Status ({machines.length} Machines)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Synchronized from OPC UA / PLC telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {machines.map((m, idx) => (
                <div key={m.machineId} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{m.machineCode}</span>
                      <span className="text-slate-300 font-medium">{m.machineName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.workCenterName} &bull; Job: {m.currentJob || 'None'}</div>
                    <input
                      type="text"
                      placeholder="Add maintenance remark or machine notes..."
                      value={m.maintenanceNote || ''}
                      onChange={e => {
                        const copy = [...machines];
                        copy[idx].maintenanceNote = e.target.value;
                        setMachines(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 mt-1"
                    />
                  </div>
                  <select
                    value={m.state}
                    onChange={e => {
                      const copy = [...machines];
                      copy[idx].state = e.target.value as any;
                      setMachines(copy);
                    }}
                    className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                      m.state === 'running' ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40' :
                      m.state === 'faulted' ? 'bg-rose-950 text-rose-300 border-rose-600/40' :
                      m.state === 'setup' ? 'bg-amber-950 text-amber-300 border-amber-600/40' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <option value="running">Running</option>
                    <option value="idle">Idle</option>
                    <option value="setup">Setup</option>
                    <option value="faulted">Faulted</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Open Work Orders Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Open Work Orders Transferred to Next Shift ({workOrders.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MES Traveler Progression</span>
            </div>

            <div className="space-y-2">
              {workOrders.map((wo, idx) => (
                <div key={wo.workOrderId} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-300">{wo.orderNumber}</span>
                      <span className="text-slate-200 font-semibold">{wo.partName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono uppercase">
                        {wo.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Current: Op {wo.currentOperationSequence} ({wo.currentOperationName}) &bull; Qty: {wo.completedQuantity}/{wo.targetQuantity} ({wo.progressPercent}%)
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Special instructions for incoming shift on this order..."
                      value={wo.handoverNote || ''}
                      onChange={e => {
                        const copy = [...workOrders];
                        copy[idx].handoverNote = e.target.value;
                        setWorkOrders(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Action Items for Incoming Shift */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-teal-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Pending Action Items for Incoming Shift ({tasks.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tracked Shift Handover Checklist</span>
            </div>

            {/* Existing Tasks List */}
            <div className="space-y-1.5">
              {tasks.map(t => (
                <div key={t.id} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      t.priority === 'urgent' ? 'bg-rose-950 text-rose-300 border border-rose-600/40 font-bold' :
                      t.priority === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-600/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-slate-200">{t.taskDescription}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({t.stationOrCell})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(t.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Task Input Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="New pending action item for incoming shift..."
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Station / Cell"
                value={newTaskStation}
                onChange={e => setNewTaskStation(e.target.value)}
                className="w-32 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{submitting ? 'Submitting Handover...' : 'Submit Handover for Incoming Ack'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
