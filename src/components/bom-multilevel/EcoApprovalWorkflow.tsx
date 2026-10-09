// src/components/bom-multilevel/EcoApprovalWorkflow.tsx

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Plus, 
  ArrowRight, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Send, 
  Layers, 
  Sparkles,
  Check,
  X,
  FileCheck2,
  Users
} from 'lucide-react';
import { 
  EngineeringChangeOrder, 
  EcoStatus, 
  EcoSeverity, 
  EcoReason, 
  MultiLevelBom 
} from '../../types/multiLevelBom';

interface EcoApprovalWorkflowProps {
  ecos: EngineeringChangeOrder[];
  boms: MultiLevelBom[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onReviewEco: (ecoId: string, reviewerIndex: number, status: 'approved' | 'rejected', comments?: string) => Promise<any>;
  onImplementEco: (ecoId: string, comments?: string) => Promise<any>;
  onCreateEco: (ecoData: any) => Promise<any>;
}

const SEVERITY_BADGES: Record<EcoSeverity, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Low', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  medium: { label: 'Medium', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  high: { label: 'High', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  critical: { label: 'Critical', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
};

const STATUS_BADGES: Record<EcoStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  pending_approval: { label: 'Pending Approval', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  approved: { label: 'Approved', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  implemented: { label: 'Implemented', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
};

export const EcoApprovalWorkflow: React.FC<EcoApprovalWorkflowProps> = ({
  ecos,
  boms,
  currentUserId = 'usr_eng_mgr',
  currentUserName = 'Engineering Manager',
  currentUserRole = 'manager',
  onReviewEco,
  onImplementEco,
  onCreateEco
}) => {
  const [selectedEcoId, setSelectedEcoId] = useState<string>(ecos[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Review modal / prompt state
  const [reviewComment, setReviewComment] = useState<string>('');
  const [activeReviewerIdx, setActiveReviewerIdx] = useState<number | null>(null);
  const [activeReviewStatus, setActiveReviewStatus] = useState<'approved' | 'rejected' | null>(null);

  // Implementation remarks
  const [implementRemarks, setImplementRemarks] = useState<string>('');
  const [isImplementConfirmOpen, setIsImplementConfirmOpen] = useState<boolean>(false);

  const selectedEco = ecos.find(e => e.id === selectedEcoId) || ecos[0] || null;

  const filteredEcos = ecos.filter(e => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const handleExecuteReview = async () => {
    if (!selectedEco || activeReviewerIdx === null || !activeReviewStatus) return;
    try {
      setActionLoading(true);
      await onReviewEco(selectedEco.id, activeReviewerIdx, activeReviewStatus, reviewComment.trim());
      setActiveReviewerIdx(null);
      setActiveReviewStatus(null);
      setReviewComment('');
    } catch (err) {
      console.error('Review failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteImplement = async () => {
    if (!selectedEco) return;
    try {
      setActionLoading(true);
      await onImplementEco(selectedEco.id, implementRemarks.trim());
      setIsImplementConfirmOpen(false);
      setImplementRemarks('');
    } catch (err) {
      console.error('Implement failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Creation Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Engineering Change Order (ECO) Governance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-functional approval workflows, multi-stakeholder electronic signatures & automated BOM implementation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-2 transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Change Order</span>
        </button>
      </div>

      {/* Main ECO Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List of ECOs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['all', 'pending_approval', 'approved', 'implemented'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono capitalize transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All ECOs' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredEcos.map((eco) => {
              const isSelected = selectedEco?.id === eco.id;
              const sevBadge = SEVERITY_BADGES[eco.severity] || SEVERITY_BADGES.medium;
              const statusBadge = STATUS_BADGES[eco.status] || STATUS_BADGES.draft;

              return (
                <div
                  key={eco.id}
                  onClick={() => setSelectedEcoId(eco.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      {eco.ecoNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${sevBadge.bg} ${sevBadge.text} ${sevBadge.border}`}>
                        {sevBadge.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                    {eco.title}
                  </h4>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="truncate max-w-[150px]">{eco.assemblyPartNumber}</span>
                    <span className="text-slate-300">
                      {eco.currentRevision} → <strong className="text-indigo-400">{eco.targetRevision}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedEco ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {selectedEco.ecoNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono border ${STATUS_BADGES[selectedEco.status]?.bg} ${STATUS_BADGES[selectedEco.status]?.text} ${STATUS_BADGES[selectedEco.status]?.border}`}>
                      {STATUS_BADGES[selectedEco.status]?.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Target Date: <strong className="text-slate-200">{selectedEco.proposedEffectiveDate}</strong>
                  </div>
                </div>

                <h2 className="text-base font-bold text-white mb-1">
                  {selectedEco.title}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedEco.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/40">
                  <span>Target: <strong className="text-white">{selectedEco.assemblyPartNumber}</strong></span>
                  <span>Revision: {selectedEco.currentRevision} → <strong className="text-indigo-400">{selectedEco.targetRevision}</strong></span>
                  <span>Originator: <strong className="text-slate-300">{selectedEco.requestedByName}</strong></span>
                </div>
              </div>

              {/* Impact Analysis Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Engineering & Cost Impact Analysis
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Unit Cost Delta</span>
                    <span className={`text-sm font-bold font-mono ${selectedEco.impactSummary.costDelta < 0 ? 'text-emerald-400' : selectedEco.impactSummary.costDelta > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {selectedEco.impactSummary.costDelta > 0 ? '+' : ''}₹{selectedEco.impactSummary.costDelta.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Added</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      +{selectedEco.impactSummary.partsAdded}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Removed</span>
                    <span className="text-sm font-bold font-mono text-rose-400">
                      -{selectedEco.impactSummary.partsRemoved}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Parts Modified</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      {selectedEco.impactSummary.partsModified}
                    </span>
                  </div>
                </div>

                {selectedEco.impactSummary.scrapRiskNotes && (
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-slate-300">Inventory & Scrap Disposition: </strong>
                    {selectedEco.impactSummary.scrapRiskNotes}
                  </div>
                )}
              </div>

              {/* Multi-Reviewer Sign-off Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Reviewer Sign-Off Checklist
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedEco.reviewers.filter(r => r.status === 'approved').length} of {selectedEco.reviewers.length} Approved
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedEco.reviewers.map((rev, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          rev.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : rev.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {rev.status === 'approved' ? (
                            <Check className="w-4 h-4" />
                          ) : rev.status === 'rejected' ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span>{rev.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              ({rev.role})
                            </span>
                          </div>
                          {rev.comments ? (
                            <div className="text-[11px] text-slate-400 mt-0.5 italic">
                              "{rev.comments}"
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 capitalize">
                              Status: {rev.status}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sign-off Actions for Reviewer (if pending and ECO not yet implemented) */}
                      {selectedEco.status === 'pending_approval' && rev.status === 'pending' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReviewerIdx(idx);
                              setActiveReviewStatus('approved');
                              setReviewComment('');
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-all"
                            title="Sign and Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReviewerIdx(idx);
                              setActiveReviewStatus('rejected');
                              setReviewComment('');
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1 transition-all"
                            title="Reject with notes"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Action Bar */}
              {selectedEco.status === 'approved' && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4" />
                      All Stakeholders Approved — Ready for Release
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Implementing will promote <strong className="text-white">{selectedEco.targetRevision}</strong> to released status, apply effectivity dates, and supersede {selectedEco.currentRevision}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsImplementConfirmOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Implement to Production</span>
                  </button>
                </div>
              )}

              {selectedEco.status === 'implemented' && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Successfully implemented on {selectedEco.approvedAt?.slice(0, 10)}. BOM revision {selectedEco.targetRevision} is active in production.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a change order to inspect specifications & sign-off timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Remarks Modal */}
      {activeReviewerIdx !== null && activeReviewStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {activeReviewStatus === 'approved' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <X className="w-5 h-5 text-rose-400" />
              )}
              {activeReviewStatus === 'approved' ? 'Confirm Approval Sign-Off' : 'Confirm Rejection'}
            </h3>
            <p className="text-xs text-slate-400">
              Provide sign-off comments for <strong className="text-white font-mono">{selectedEco?.ecoNumber}</strong>:
            </p>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Reviewed tolerance stacks and tooling requirements. Approved."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveReviewerIdx(null);
                  setActiveReviewStatus(null);
                }}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteReview}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                  activeReviewStatus === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? 'Recording...' : `Submit ${activeReviewStatus === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Implement Confirmation Modal */}
      {isImplementConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Implement ECO to Production
            </h3>
            <p className="text-xs text-slate-400">
              This will officially release <strong className="text-white font-mono">{selectedEco?.targetRevision}</strong> and mark <strong className="text-white font-mono">{selectedEco?.currentRevision}</strong> as superseded across all shopfloor work orders and quotations.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Implementation Notes</label>
              <textarea
                rows={3}
                value={implementRemarks}
                onChange={(e) => setImplementRemarks(e.target.value)}
                placeholder="Release notes / instructions for production lines..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImplementConfirmOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteImplement}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{actionLoading ? 'Implementing...' : 'Confirm Release'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New ECO Modal */}
      {isCreateModalOpen && (
        <CreateEcoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          boms={boms}
          onCreate={onCreateEco}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      )}
    </div>
  );
};

interface CreateEcoModalProps {
  isOpen: boolean;
  onClose: () => void;
  boms: MultiLevelBom[];
  onCreate: (ecoData: any) => Promise<any>;
  currentUserId: string;
  currentUserName: string;
}

const CreateEcoModal: React.FC<CreateEcoModalProps> = ({
  isOpen,
  onClose,
  boms,
  onCreate,
  currentUserId,
  currentUserName
}) => {
  const [selectedBomId, setSelectedBomId] = useState(boms[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState<EcoReason>('design_fix');
  const [severity, setSeverity] = useState<EcoSeverity>('medium');
  const [targetRevision, setTargetRevision] = useState('Rev B.0');
  const [proposedEffectiveDate, setProposedEffectiveDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [costDelta, setCostDelta] = useState<number>(0);
  const [scrapRiskNotes, setScrapRiskNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedBom = boms.find(b => b.id === selectedBomId) || boms[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedBom) return;

    try {
      setLoading(true);
      const ecoNumber = `ECO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      await onCreate({
        ecoNumber,
        title: title.trim(),
        description: description.trim(),
        reason,
        severity,
        bomId: selectedBom.id,
        assemblyPartNumber: selectedBom.assemblyPartNumber,
        assemblyName: selectedBom.assemblyName,
        currentRevision: selectedBom.activeRevisionCode,
        targetRevision: targetRevision.trim(),
        proposedEffectiveDate,
        status: 'pending_approval' as EcoStatus,
        reviewers: [
          { userId: currentUserId, name: currentUserName, role: 'Engineering Manager', status: 'pending' },
          { userId: 'usr_qa', name: 'Anita Rao', role: 'Quality Assurance Head', status: 'pending' },
          { userId: 'usr_prod', name: 'Vikram Shinde', role: 'Production Lead', status: 'pending' },
          { userId: 'usr_cost', name: 'Priya Sharma', role: 'Cost Estimator', status: 'pending' }
        ],
        impactSummary: {
          costDelta: Number(costDelta),
          partsAdded: 1,
          partsRemoved: 0,
          partsModified: 1,
          scrapRiskNotes: scrapRiskNotes.trim() || 'Existing inventory to be consumed before new revision cut-in.',
          affectedAssemblies: [selectedBom.assemblyPartNumber]
        },
        requestedBy: currentUserId,
        requestedByName: currentUserName
      });

      onClose();
    } catch (err) {
      console.error('Failed to create ECO:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Engineering Change Order</h3>
              <p className="text-xs text-slate-400">Initiate formal multi-stage change governance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Product BOM</label>
            <select
              value={selectedBomId}
              onChange={(e) => setSelectedBomId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {boms.map(b => (
                <option key={b.id} value={b.id}>
                  {b.assemblyPartNumber} — {b.assemblyName} ({b.activeRevisionCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Change Order Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scalloped pockets mass reduction on planetary carrier"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Change Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as EcoReason)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cost_reduction">Cost Reduction</option>
                <option value="design_fix">Design Fix</option>
                <option value="quality_improvement">Quality Improvement</option>
                <option value="obsolescence">Obsolescence</option>
                <option value="customer_request">Customer Request</option>
                <option value="standardization">Standardization</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as EcoSeverity)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low (Cosmetic/Drawing fix)</option>
                <option value="medium">Medium (Component swap)</option>
                <option value="high">High (Major tolerance)</option>
                <option value="critical">Critical (Safety/Structural)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Revision</label>
              <input
                type="text"
                value={targetRevision}
                onChange={(e) => setTargetRevision(e.target.value)}
                placeholder="Rev B.0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Proposed Effective Date</label>
              <input
                type="date"
                value={proposedEffectiveDate}
                onChange={(e) => setProposedEffectiveDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Engineering Motivation</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State rationale, tests conducted, or customer requirements..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Submit Change Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
