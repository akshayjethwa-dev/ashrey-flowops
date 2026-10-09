// src/components/bom-multilevel/BomRevisionManager.tsx

import React, { useState } from 'react';
import { 
  GitBranch, 
  History, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  FileDiff, 
  Plus, 
  ChevronRight, 
  Sparkles,
  RotateCcw,
  User,
  ArrowRight
} from 'lucide-react';
import { 
  MultiLevelBom, 
  BomRevision, 
  BomRevisionStatus 
} from '../../types/multiLevelBom';

interface BomRevisionManagerProps {
  bom: MultiLevelBom;
  selectedRevision: BomRevision | null;
  asOfDate: string;
  onSelectRevision: (revisionId: string) => void;
  onSetAsOfDate: (date: string) => void;
  onBranchRevision: (baseRevId: string, newRevCode: string, changeReason: string) => Promise<any>;
  onOpenDiffModal: () => void;
}

const REVISION_STATUS_BADGES: Record<BomRevisionStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20'
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20'
  },
  approved: {
    label: 'Approved',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20'
  },
  released: {
    label: 'Released (Active)',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20'
  },
  superseded: {
    label: 'Superseded',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20'
  },
  obsolete: {
    label: 'Obsolete',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20'
  }
};

export const BomRevisionManager: React.FC<BomRevisionManagerProps> = ({
  bom,
  selectedRevision,
  asOfDate,
  onSelectRevision,
  onSetAsOfDate,
  onBranchRevision,
  onOpenDiffModal
}) => {
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [targetRevCode, setTargetRevCode] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isBranching, setIsBranching] = useState(false);
  const [branchError, setBranchError] = useState('');

  // Propose next revision code
  const handleOpenBranchModal = () => {
    if (!selectedRevision) return;
    const currentCode = selectedRevision.revision; // e.g. "Rev B.0" or "B.0"
    let nextLetter = 'D';
    const match = currentCode.match(/([A-Z])/i);
    if (match) {
      nextLetter = String.fromCharCode(match[1].toUpperCase().charCodeAt(0) + 1);
    }
    setTargetRevCode(`Rev ${nextLetter}.0`);
    setChangeReason('');
    setBranchError('');
    setIsBranchModalOpen(true);
  };

  const handleExecuteBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevision) return;
    if (!targetRevCode.trim()) {
      setBranchError('Please provide a target revision code.');
      return;
    }
    if (!changeReason.trim()) {
      setBranchError('Please specify the engineering change reason.');
      return;
    }

    try {
      setIsBranching(true);
      setBranchError('');
      await onBranchRevision(selectedRevision.id, targetRevCode.trim(), changeReason.trim());
      setIsBranchModalOpen(false);
    } catch (err: any) {
      setBranchError(err?.message || 'Failed to branch revision');
    } finally {
      setIsBranching(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top Header: Revision Selector & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Revision Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-mono uppercase text-slate-400 shrink-0 flex items-center gap-1.5 mr-1">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Revisions:
          </span>

          {bom.revisions.map((rev) => {
            const isSelected = selectedRevision?.id === rev.id;
            const badge = REVISION_STATUS_BADGES[rev.status] || REVISION_STATUS_BADGES.draft;

            return (
              <button
                key={rev.id}
                type="button"
                onClick={() => onSelectRevision(rev.id)}
                className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-2 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="font-bold">{rev.revision}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                {rev.id === bom.currentRevisionId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Default Active" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Branch Revision & Compare Diff */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenDiffModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Side-by-side Revision Comparison"
          >
            <FileDiff className="w-3.5 h-3.5 text-sky-400" />
            <span>Compare Diff</span>
          </button>

          <button
            type="button"
            onClick={handleOpenBranchModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
            title="Create new draft revision branch"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Branch New Revision</span>
          </button>
        </div>
      </div>

      {/* Effectivity Date Filter Bar (Time Travel) */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              Time-Travel Effectivity Filter
              {asOfDate ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Active as of: {asOfDate}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  All Items (No Date Filter)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Filter product structure to inspect active components as of a specific date in past or future production schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => onSetAsOfDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={() => onSetAsOfDate(todayIso)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Today
          </button>

          {asOfDate && (
            <button
              type="button"
              onClick={() => onSetAsOfDate('')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Clear date filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Revision Details Strip */}
      {selectedRevision && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 border-t border-slate-800/60 font-mono text-xs">
          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Revision Status</span>
            <span className="font-bold text-white capitalize">{selectedRevision.status}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Effective From</span>
            <span className="text-slate-300">{selectedRevision.effectiveFrom}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Rolled-Up Cost</span>
            <span className="font-bold text-emerald-400">₹{selectedRevision.rolledUpCost.toLocaleString()}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Components</span>
            <span className="text-slate-300">{selectedRevision.totalComponentCount} parts</span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Tree Depth</span>
            <span className="text-slate-300">{selectedRevision.maxLevelDepth} levels</span>
          </div>

          <div>
            <span className="text-[10px] uppercase text-slate-500 block">Created By</span>
            <span className="text-slate-300 truncate block">{selectedRevision.createdByName}</span>
          </div>
        </div>
      )}

      {/* Branch New Revision Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Branch New Revision</h3>
                <p className="text-xs text-slate-400">
                  Clones product structure from <strong className="text-white font-mono">{selectedRevision?.revision}</strong> into a new working draft.
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Revision Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={targetRevCode}
                  onChange={(e) => setTargetRevCode(e.target.value)}
                  placeholder="e.g. Rev C.0 or Rev B.1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Reason for Revision / Change Intent <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Describe engineering motivation (e.g. Mass reduction on planet carrier, supplier standardization, cost optimization)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                />
              </div>

              {branchError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{branchError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBranching}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <GitBranch className="w-4 h-4" />
                  {isBranching ? 'Branching...' : 'Create Draft Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
