// src/components/edhr/LogDeviationModal.tsx

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { EDHRRecord, DeviationSeverity } from '../../types/edhr';

interface LogDeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dhr: EDHRRecord | null;
  onLog: (deviation: {
    deviationNumber: string;
    operationSequence?: number;
    severity: DeviationSeverity;
    description: string;
    immediateAction: string;
    rootCauseAnalysis?: string;
    disposition: 'use_as_is' | 'rework' | 'scrap' | 'return_to_vendor';
    loggedBy: string;
    capaReference?: string;
  }) => Promise<void>;
}

export const LogDeviationModal: React.FC<LogDeviationModalProps> = ({
  isOpen,
  onClose,
  dhr,
  onLog
}) => {
  if (!isOpen || !dhr) return null;

  const [deviationNumber, setDeviationNumber] = useState(`NCR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [operationSequence, setOperationSequence] = useState<number>(20);
  const [severity, setSeverity] = useState<DeviationSeverity>('major');
  const [description, setDescription] = useState('Spindle tool chatter observed; dimension approaching upper tolerance limit.');
  const [immediateAction, setImmediateAction] = useState('Machine halted; quarantined with physical red tag for MRB review.');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('Toolholder collet wear leading to dynamic runout.');
  const [disposition, setDisposition] = useState<'use_as_is' | 'rework' | 'scrap' | 'return_to_vendor'>('rework');
  const [loggedBy, setLoggedBy] = useState('Devendra Shinde (Lead Machinist)');
  const [capaReference, setCapaReference] = useState('CAPA-2026-015');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLog({
        deviationNumber,
        operationSequence,
        severity,
        description,
        immediateAction,
        rootCauseAnalysis,
        disposition,
        loggedBy,
        capaReference
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
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Log Non-Conformance Report (NCR)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/40">
                  Batch Quarantine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Batch Record: {dhr.dhrNumber} &bull; {dhr.batchNumber}
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

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">NCR / Deviation #</label>
              <input
                type="text"
                value={deviationNumber}
                onChange={e => setDeviationNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-rose-300 font-mono font-bold focus:border-rose-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as DeviationSeverity)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-hidden"
              >
                <option value="critical">Critical (Immediate Line Stop)</option>
                <option value="major">Major (Out of Drawing Spec)</option>
                <option value="minor">Minor (Cosmetic / Process Drift)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Operation Sequence #</label>
              <input
                type="number"
                value={operationSequence}
                onChange={e => setOperationSequence(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Proposed Disposition</label>
              <select
                value={disposition}
                onChange={e => setDisposition(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-hidden"
              >
                <option value="rework">Rework to Drawing Standard</option>
                <option value="use_as_is">Use As Is (MRB Concession)</option>
                <option value="scrap">Scrap Part</option>
                <option value="return_to_vendor">Return to Supplier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Description of Non-Conformance</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-rose-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Immediate Containment Action</label>
            <input
              type="text"
              value={immediateAction}
              onChange={e => setImmediateAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-rose-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Root Cause Finding</label>
              <input
                type="text"
                value={rootCauseAnalysis}
                onChange={e => setRootCauseAnalysis(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">CAPA Reference</label>
              <input
                type="text"
                value={capaReference}
                onChange={e => setCapaReference(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Logged By (Inspector / Operator)</label>
            <input
              type="text"
              value={loggedBy}
              onChange={e => setLoggedBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-rose-500 focus:outline-hidden"
              required
            />
          </div>

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
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm transition cursor-pointer"
            >
              {submitting ? 'Logging NCR...' : 'Commit NCR & Quarantine Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
