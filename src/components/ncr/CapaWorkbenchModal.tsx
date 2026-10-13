// src/components/ncr/CapaWorkbenchModal.tsx

import React, { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Plus,
  Trash2,
  Calendar,
  Layers,
  FileCheck2,
  Stamp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import {
  CapaRecord,
  CapaPhase,
  CapaActionItem,
  CapaVerificationDetails
} from '../../types/ncr';

interface CapaWorkbenchModalProps {
  capa: CapaRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCapa: (id: string, updates: Partial<CapaRecord>) => void;
  onVerifyAndClose: (id: string, verificationData: CapaVerificationDetails) => void;
}

export const CapaWorkbenchModal: React.FC<CapaWorkbenchModalProps> = ({
  capa,
  isOpen,
  onClose,
  onSaveCapa,
  onVerifyAndClose
}) => {
  if (!isOpen || !capa) return null;

  const [activeTab, setActiveTab] = useState<'root_cause' | 'actions' | 'verification'>('root_cause');

  // 5-Whys states
  const [fiveWhys, setFiveWhys] = useState<string[]>(
    capa.fiveWhys.length > 0
      ? capa.fiveWhys
      : [
          'Why 1: What triggered the non-conformance? -> ',
          'Why 2: Why did that condition occur? -> ',
          'Why 3: Why was it not detected immediately? -> ',
          'Why 4: Why did standard safeguards fail? -> ',
          'Why 5: What is the underlying systemic root cause? -> '
        ]
  );
  const [ishikawaCategory, setIshikawaCategory] = useState(capa.ishikawaCategory);
  const [rootCauseSummary, setRootCauseSummary] = useState(capa.rootCauseSummary || '');
  const [problemStatement, setProblemStatement] = useState(capa.problemStatement || '');

  // Corrective and Preventive actions
  const [correctiveActions, setCorrectiveActions] = useState<CapaActionItem[]>(
    capa.correctiveActions || []
  );
  const [preventiveActions, setPreventiveActions] = useState<CapaActionItem[]>(
    capa.preventiveActions || []
  );

  // Verification state
  const [verifiedBy, setVerifiedBy] = useState(
    capa.verificationDetails?.verifiedBy || 'Sarah Lin, CQE'
  );
  const [verificationMethod, setVerificationMethod] = useState(
    capa.verificationDetails?.verificationMethod ||
      'Audit 3 consecutive production batches with zero defects on coordinate measuring machine.'
  );
  const [auditFindings, setAuditFindings] = useState(
    capa.verificationDetails?.auditFindings ||
      'Inspection of lots WO-4428 and WO-4432 verified 100% conforming with zero defects.'
  );
  const [effectivenessMet, setEffectivenessMet] = useState(
    capa.verificationDetails?.effectivenessMet ?? false
  );
  const [closureAuthorized, setClosureAuthorized] = useState(
    capa.verificationDetails?.closureAuthorized ?? false
  );

  const handleUpdateWhy = (idx: number, text: string) => {
    const updated = [...fiveWhys];
    updated[idx] = text;
    setFiveWhys(updated);
  };

  const handleAddAction = (type: 'corrective' | 'preventive') => {
    const newItem: CapaActionItem = {
      id: `act-${Date.now()}`,
      action: '',
      owner: 'Lead Process Engineer',
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      status: 'pending'
    };

    if (type === 'corrective') {
      setCorrectiveActions([...correctiveActions, newItem]);
    } else {
      setPreventiveActions([...preventiveActions, newItem]);
    }
  };

  const handleUpdateAction = (
    type: 'corrective' | 'preventive',
    id: string,
    field: keyof CapaActionItem,
    value: any
  ) => {
    const updater = (list: CapaActionItem[]) =>
      list.map(a => (a.id === id ? { ...a, [field]: value } : a));

    if (type === 'corrective') {
      setCorrectiveActions(updater(correctiveActions));
    } else {
      setPreventiveActions(updater(preventiveActions));
    }
  };

  const handleRemoveAction = (type: 'corrective' | 'preventive', id: string) => {
    if (type === 'corrective') {
      setCorrectiveActions(correctiveActions.filter(a => a.id !== id));
    } else {
      setPreventiveActions(preventiveActions.filter(a => a.id !== id));
    }
  };

  const handleSaveDraft = () => {
    onSaveCapa(capa.id, {
      problemStatement,
      fiveWhys,
      ishikawaCategory,
      rootCauseSummary,
      correctiveActions,
      preventiveActions
    });
    onClose();
  };

  const handleFinalClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedBy.trim()) return;

    onVerifyAndClose(capa.id, {
      verifiedBy: verifiedBy.trim(),
      verifiedAt: new Date().toISOString(),
      effectivenessMet,
      verificationMethod: verificationMethod.trim(),
      auditFindings: auditFindings.trim(),
      closureAuthorized
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">8D CAPA Investigation Workbench</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  {capa.capaNumber}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase font-bold">
                  Phase: {capa.phase.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                8D Corrective & Preventive Action: 5-Whys Root Cause, Action Plan, & Effectiveness Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Info Banner */}
        <div className="px-6 py-3 bg-slate-850/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Part SKU & Name</span>
            <strong className="text-cyan-300 block truncate">{capa.partSku}</strong>
            <span className="text-[11px] text-slate-400 truncate block">{capa.partName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Linked NCR(s)</span>
            <span className="font-mono font-bold text-amber-400 block truncate">
              {capa.linkedNcrNumbers.join(', ') || 'Direct Audit Finding'}
            </span>
            <span className="text-[11px] text-slate-400 block">Owner: {capa.ownerName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Target Closure Date</span>
            <span className="font-mono text-slate-200 block">{capa.targetClosureDate}</span>
            <span className="text-[11px] text-slate-400 block">Aging: {capa.agingDays} days</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Investigation Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase w-fit block mt-0.5 ${
              capa.status === 'closed'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : capa.isOverdue
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            }`}>
              {capa.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('root_cause')}
            className={`pb-1 transition flex items-center gap-1.5 ${
              activeTab === 'root_cause'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            D2/D4: 5-Whys Root Cause
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-1 transition flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            D5/D6/D7: Corrective & Preventive Actions ({correctiveActions.length + preventiveActions.length})
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-1 transition flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            D8: Effectiveness Verification & Closure
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: 5-Whys & Root Cause */}
          {activeTab === 'root_cause' && (
            <div className="space-y-4">
              
              {/* Problem statement */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  D2: Detailed 5W2H Problem Statement *
                </label>
                <textarea
                  rows={2}
                  value={problemStatement}
                  onChange={e => setProblemStatement(e.target.value)}
                  placeholder="Who, What, Where, When, Why, How much..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Ishikawa 6M Category */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Ishikawa Fishbone Primary Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'man', label: 'Man (Operator)' },
                    { id: 'machine', label: 'Machine (Tooling)' },
                    { id: 'material', label: 'Material (Alloy)' },
                    { id: 'method', label: 'Method (Routing)' },
                    { id: 'measurement', label: 'Measurement' },
                    { id: 'environment', label: 'Environment' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setIshikawaCategory(cat.id as any)}
                      className={`p-2 rounded-lg border text-center transition font-semibold text-[11px] ${
                        ishikawaCategory === cat.id
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5-Whys Interactive Investigation Tree */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-300 font-bold">
                    D4: 5-Whys Step-by-Step Root Cause Tree *
                  </label>
                  <span className="text-[10px] text-slate-400">Drill down to find the systemic failure</span>
                </div>

                <div className="space-y-2.5">
                  {fiveWhys.map((whyText, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-850/80 border border-slate-750 rounded-xl flex items-start gap-3"
                    >
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                        Why {i + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={whyText}
                        onChange={e => handleUpdateWhy(i, e.target.value)}
                        placeholder={`Why ${i + 1} did this occur?`}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Statement */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Root Cause Summary Statement *
                </label>
                <textarea
                  rows={2}
                  value={rootCauseSummary}
                  onChange={e => setRootCauseSummary(e.target.value)}
                  placeholder="Summarize the core systemic root cause identified..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Action Plans */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              
              {/* Corrective Actions D5/D6 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      D5/D6: Permanent Corrective Actions ({correctiveActions.length})
                    </h3>
                    <p className="text-slate-400 text-[11px]">Actions to eliminate the identified root cause</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddAction('corrective')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Action
                  </button>
                </div>

                <div className="space-y-2.5">
                  {correctiveActions.length === 0 ? (
                    <p className="text-slate-500 italic p-3 text-center">No corrective actions logged yet.</p>
                  ) : (
                    correctiveActions.map((act, i) => (
                      <div
                        key={act.id}
                        className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-cyan-400 font-bold">#{i + 1}</span>
                          <input
                            type="text"
                            placeholder="Action description"
                            value={act.action}
                            onChange={e => handleUpdateAction('corrective', act.id, 'action', e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium"
                          />
                          <select
                            value={act.status}
                            onChange={e => handleUpdateAction('corrective', act.id, 'status', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction('corrective', act.id)}
                            className="text-slate-400 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-500 mr-1">Owner:</span>
                            <input
                              type="text"
                              value={act.owner}
                              onChange={e => handleUpdateAction('corrective', act.id, 'owner', e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 w-44"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500 mr-1">Due Date:</span>
                            <input
                              type="date"
                              value={act.dueDate}
                              onChange={e => handleUpdateAction('corrective', act.id, 'dueDate', e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preventive Actions D7 */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      D7: Systemic Preventive Actions ({preventiveActions.length})
                    </h3>
                    <p className="text-slate-400 text-[11px]">SOP updates, tooling redesigns, error-proofing (Poka-Yoke)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddAction('preventive')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Preventive Action
                  </button>
                </div>

                <div className="space-y-2.5">
                  {preventiveActions.length === 0 ? (
                    <p className="text-slate-500 italic p-3 text-center">No preventive actions logged yet.</p>
                  ) : (
                    preventiveActions.map((act, i) => (
                      <div
                        key={act.id}
                        className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-cyan-400 font-bold">#PA-{i + 1}</span>
                          <input
                            type="text"
                            placeholder="Preventive SOP or design update"
                            value={act.action}
                            onChange={e => handleUpdateAction('preventive', act.id, 'action', e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium"
                          />
                          <select
                            value={act.status}
                            onChange={e => handleUpdateAction('preventive', act.id, 'status', e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction('preventive', act.id)}
                            className="text-slate-400 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-500 mr-1">Owner:</span>
                            <input
                              type="text"
                              value={act.owner}
                              onChange={e => handleUpdateAction('preventive', act.id, 'owner', e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 w-44"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500 mr-1">Due Date:</span>
                            <input
                              type="date"
                              value={act.dueDate}
                              onChange={e => handleUpdateAction('preventive', act.id, 'dueDate', e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Verification D8 */}
          {activeTab === 'verification' && (
            <form onSubmit={handleFinalClosure} className="space-y-4">
              <div className="p-4 bg-slate-850 rounded-xl border border-slate-750 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>D8: Effectiveness Verification Audit & CAPA Closure Gate</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  ISO 9001:2015 & IATF 16949 mandate objective verification of implemented actions over time before a CAPA can be formally marked closed.
                </p>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Verification Method & Acceptance Criteria *
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationMethod}
                    onChange={e => setVerificationMethod(e.target.value)}
                    placeholder="e.g. Audit 3 consecutive production batches with zero defects on CMM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Audit Findings & Statistical Evidence *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={auditFindings}
                    onChange={e => setAuditFindings(e.target.value)}
                    placeholder="Enter inspection results, Cp/Cpk improvements, zero recurring defect confirmation..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effectivenessMet}
                      onChange={e => setEffectivenessMet(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 bg-slate-800 border-slate-700"
                    />
                    <div>
                      <strong className="text-white block font-semibold text-xs">
                        Effectiveness Criteria Satisfied
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Root cause eliminated with objective proof of zero recurrence.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closureAuthorized}
                      onChange={e => setClosureAuthorized(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 bg-slate-800 border-slate-700"
                    />
                    <div>
                      <strong className="text-white block font-semibold text-xs">
                        Formal Closure Authorized
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Authorize final closure of CAPA and all linked NCRs.
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Authorized Quality Director / Verifier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={verifiedBy}
                    onChange={e => setVerifiedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={!effectivenessMet || !closureAuthorized}
                    className={`px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-1.5 transition ${
                      effectivenessMet && closureAuthorized
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Stamp className="w-4 h-4" />
                    Verify Effectiveness & Close CAPA
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">
            {capa.correctiveActions.filter(a => a.status === 'completed').length} of{' '}
            {capa.correctiveActions.length} corrective actions implemented
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition font-medium"
            >
              Exit
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition font-bold"
            >
              Save Investigation Progress
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
