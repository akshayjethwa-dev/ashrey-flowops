// src/components/handover/AcknowledgeHandoverModal.tsx

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Clock,
  Lock,
  Building2,
  AlertCircle
} from 'lucide-react';
import { ShiftHandoverRecord, ReceivingSupervisorChecklist } from '../../types/shiftHandover';

interface AcknowledgeHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  handover: ShiftHandoverRecord | null;
  onAcknowledge: (params: {
    incomingSupervisorName: string;
    incomingSupervisorBadge: string;
    checklist: ReceivingSupervisorChecklist;
  }) => Promise<void>;
}

export const AcknowledgeHandoverModal: React.FC<AcknowledgeHandoverModalProps> = ({
  isOpen,
  onClose,
  handover,
  onAcknowledge
}) => {
  if (!isOpen || !handover) return null;

  const [incomingSupervisorName, setIncomingSupervisorName] = useState(
    handover.incomingSupervisorName || 'Vikram Rao'
  );
  const [incomingSupervisorBadge, setIncomingSupervisorBadge] = useState('SUP-301');
  const [safetyBriefingCompleted, setSafetyBriefingCompleted] = useState(true);
  const [machineWalkthroughCompleted, setMachineWalkthroughCompleted] = useState(true);
  const [wipCountVerified, setWipCountVerified] = useState(true);
  const [urgentTasksUnderstood, setUrgentTasksUnderstood] = useState(true);
  const [receivingComments, setReceivingComments] = useState(
    'Walk-through completed. Machine fleet and open work orders received in full. Night shift team deployed.'
  );
  const [submitting, setSubmitting] = useState(false);

  const allChecklistItemsChecked = 
    safetyBriefingCompleted && 
    machineWalkthroughCompleted && 
    wipCountVerified && 
    urgentTasksUnderstood;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecklistItemsChecked) return;

    setSubmitting(true);
    try {
      await onAcknowledge({
        incomingSupervisorName,
        incomingSupervisorBadge,
        checklist: {
          safetyBriefingCompleted,
          machineWalkthroughCompleted,
          wipCountVerified,
          urgentTasksUnderstood,
          receivingComments
        }
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Receiving Shift Digital Handshake</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40">
                  Dual Signoff
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                From: {handover.outgoingShiftLabel} &rarr; To: {handover.incomingShiftLabel}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono uppercase text-slate-400">Outgoing Shift Submission</div>
            <div className="text-xs text-slate-200 font-semibold">
              Submitted by: <span className="text-indigo-300">{handover.outgoingSupervisorName} ({handover.outgoingSupervisorBadge})</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Timestamp: {new Date(handover.outgoingSubmittedAt).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Incoming Supervisor Name</label>
              <input
                type="text"
                value={incomingSupervisorName}
                onChange={e => setIncomingSupervisorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Employee Badge #</label>
              <input
                type="text"
                value={incomingSupervisorBadge}
                onChange={e => setIncomingSupervisorBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-teal-300 font-mono text-center focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Receiving Verification Checklist */}
          <div className="p-3.5 bg-teal-950/20 border border-teal-700/30 rounded-xl space-y-2.5">
            <span className="text-[11px] font-mono uppercase text-teal-300 font-bold block">
              Incoming Shift Acceptance Checklist (Mandatory)
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyBriefingCompleted}
                onChange={e => setSafetyBriefingCompleted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
              />
              <span className="text-[11px] text-slate-200">
                1. Safety briefing &amp; active near-miss review verified with outgoing supervisor.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={machineWalkthroughCompleted}
                onChange={e => setMachineWalkthroughCompleted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
              />
              <span className="text-[11px] text-slate-200">
                2. Plant machine floor physical walk-through executed ({handover.machinesSummary.length} machines inspected).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wipCountVerified}
                onChange={e => setWipCountVerified(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
              />
              <span className="text-[11px] text-slate-200">
                3. Physical WIP piece count and staging locations confirmed ({handover.openWorkOrders.length} open WOs).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={urgentTasksUnderstood}
                onChange={e => setUrgentTasksUnderstood(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
              />
              <span className="text-[11px] text-slate-200">
                4. Urgent pending tasks &amp; bottleneck order directives understood ({handover.pendingTasks.length} action items).
              </span>
            </label>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Receiving Supervisor Comments</label>
            <textarea
              rows={2}
              value={receivingComments}
              onChange={e => setReceivingComments(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-hidden"
              placeholder="Add receiving shift notes, staffing comments, or acceptance observations..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !allChecklistItemsChecked}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Acknowledging...' : 'Acknowledge & Sign Shift Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
