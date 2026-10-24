// src/components/scrap-rework/ReworkStatusUpdateModal.tsx

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  UserCheck,
  Save,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { ReworkRecord, ReworkStatus } from '../../types/scrapRework';
import { scrapReworkService } from '../../services/scrapReworkService';

interface ReworkStatusUpdateModalProps {
  reworkRecord: ReworkRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ReworkRecord) => void;
}

export const ReworkStatusUpdateModal: React.FC<ReworkStatusUpdateModalProps> = ({
  reworkRecord,
  isOpen,
  onClose,
  onUpdated
}) => {
  if (!isOpen || !reworkRecord) return null;

  const [status, setStatus] = useState<ReworkStatus>(reworkRecord.status);
  const [inspectorName, setInspectorName] = useState<string>(
    reworkRecord.verifiedByQualityInspector || 'Priya Sundaram (Lead QC Inspector)'
  );
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = scrapReworkService.updateReworkStatus(
      reworkRecord.id,
      status,
      notes,
      inspectorName
    );
    if (updated) {
      onUpdated(updated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Update Rework Disposition ({reworkRecord.reworkNumber})
              </h3>
              <p className="text-xs text-slate-400">
                {reworkRecord.partCode} &bull; {reworkRecord.workOrderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Quick Metrics */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Rework Qty</span>
              <span className="text-sm font-bold text-white">{reworkRecord.reworkQuantity} {reworkRecord.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Rework Cost Incurred</span>
              <span className="text-sm font-bold text-amber-400">${reworkRecord.totalReworkCost.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Select Rework Status / Disposition *
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                status === 'in_progress' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="in_progress"
                  checked={status === 'in_progress'}
                  onChange={() => setStatus('in_progress')}
                  className="accent-amber-500"
                />
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">In Progress (Active on Station)</div>
                  <div className="text-[10px] text-slate-400">Technician is actively re-machining or correcting parts</div>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                status === 'rework_passed' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="rework_passed"
                  checked={status === 'rework_passed'}
                  onChange={() => setStatus('rework_passed')}
                  className="accent-emerald-500"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Rework Completed & Passed Quality Inspection</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Parts salvaged back into primary production stream (+${reworkRecord.netCostBenefit.toFixed(2)} saved)</div>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                status === 'rework_failed_scrapped' ? 'bg-rose-500/10 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="rework_failed_scrapped"
                  checked={status === 'rework_failed_scrapped'}
                  onChange={() => setStatus('rework_failed_scrapped')}
                  className="accent-rose-500"
                />
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Rework Failed — Converted to Scrap</div>
                  <div className="text-[10px] text-rose-400">Parts cannot be salvaged; unrecoverable scrap loss confirmed</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Verifying Quality Inspector
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Inspection Findings & Release Justification
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dimensions verified within drawing tolerance using optical comparator and bore micrometer. Conformance certificate issued."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/40"
            >
              <Save className="w-4 h-4" />
              <span>Save Disposition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
