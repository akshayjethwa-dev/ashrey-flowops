// src/components/quality-holds/ReleaseQualityHoldModal.tsx

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  CheckCircle2,
  Lock,
  User,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  Clock,
  Layers,
  Stamp,
  Check
} from 'lucide-react';
import {
  QualityHoldRecord,
  QualityReleaseDisposition,
  QualityHoldVerificationChecklist,
  QualityHoldReleaseWorkflow
} from '../../types/qualityHold';
import { useAuth } from '../../hooks/useAuth';

interface ReleaseQualityHoldModalProps {
  isOpen: boolean;
  hold: QualityHoldRecord | null;
  onClose: () => void;
  onRelease: (holdId: string, workflow: QualityHoldReleaseWorkflow) => void;
}

export const ReleaseQualityHoldModal: React.FC<ReleaseQualityHoldModalProps> = ({
  isOpen,
  hold,
  onClose,
  onRelease
}) => {
  const { profile } = useAuth();

  const [releasedBy, setReleasedBy] = useState(profile?.name || 'Dr. Ashok Nair');
  const [releasedByRole, setReleasedByRole] = useState(
    profile?.role === 'manager' || profile?.role === 'admin'
      ? 'Head of Quality Assurance & Plant Compliance'
      : 'Authorized Quality Assurance Director'
  );
  const [authorityCredentials, setAuthorityCredentials] = useState('IATF-16949-LEAD-SIGNATORY-9921');
  const [releaseDisposition, setReleaseDisposition] = useState<QualityReleaseDisposition>('re_inspected_passed');
  const [releaseJustification, setReleaseJustification] = useState(
    'Batch underwent 100% coordinate measurement re-inspection with calibrated CMM standard (CAL-REF-091). All 24 dimensional features confirmed within ±0.015mm drawing tolerances. Rework / deviation validated and authorized for dispatch release.'
  );

  // Verification Checklist
  const [checklist, setChecklist] = useState<QualityHoldVerificationChecklist>({
    reInspectionDone: true,
    rootCauseIdentified: true,
    quarantineTagRemoved: true,
    customerConcessionAttached: false,
    documentationUpdated: true
  });

  const [agreeTerms, setAgreeTerms] = useState(false);

  if (!isOpen || !hold) return null;

  const isChecklistValid = checklist.reInspectionDone && checklist.rootCauseIdentified && checklist.quarantineTagRemoved && checklist.documentationUpdated;

  const handleToggleChecklist = (key: keyof QualityHoldVerificationChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('You must confirm the legal Quality Authority certification before releasing.');
      return;
    }
    if (!isChecklistValid) {
      alert('Please complete the mandatory verification checklist items before authorizing release.');
      return;
    }

    const digitalToken = `SIG-QA-RELEASE-${releasedBy.toUpperCase().replace(/[^A-Z]/g, '')}-${Date.now().toString().slice(-6)}`;

    const workflow: QualityHoldReleaseWorkflow = {
      releasedBy: releasedBy.trim(),
      releasedByRole: releasedByRole.trim(),
      releasedAt: new Date().toISOString(),
      authorityCredentials: authorityCredentials.trim(),
      releaseDisposition,
      releaseJustification: releaseJustification.trim(),
      verificationChecklist: checklist,
      electronicSignature: digitalToken
    };

    onRelease(hold.id, workflow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-5 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Quality Authority Release Workflow</h2>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                  Dispatch Unlock Gate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ISO 9001:2015 &amp; IATF 16949 Section 8.7: Formal disposition and release sign-off.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Hold Overview Summary Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                  {hold.id}
                </span>
                <span className="text-slate-300 font-mono text-xs">
                  Target: <strong className="text-white">{hold.targetNumber}</strong> ({hold.targetType.toUpperCase()})
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Quarantined at: <span className="font-mono text-slate-200">{hold.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Part Description</span>
                <span className="font-semibold text-slate-200">{hold.partName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Customer</span>
                <span className="font-semibold text-slate-200">{hold.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Quantity on Hold</span>
                <span className="font-mono font-bold text-amber-400">{hold.quantity} {hold.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Original Reason</span>
                <span className="text-slate-300 truncate block" title={hold.holdReason}>{hold.holdReason}</span>
              </div>
            </div>
          </div>

          {/* Release Disposition Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Authorized Release Disposition <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                {
                  id: 're_inspected_passed',
                  title: 'Re-Inspected & Conforming (100% Pass)',
                  desc: 'Re-measured with calibrated instruments, all dimensions conforming.'
                },
                {
                  id: 'rework_verified',
                  title: 'Rework Completed & Verified',
                  desc: 'Re-machined, deburred, or re-plated with certified post-inspection.'
                },
                {
                  id: 'concession_approved',
                  title: 'Customer Concession Approved',
                  desc: 'Customer engineering authority granted formal deviation acceptance.'
                },
                {
                  id: 'use_as_is_approved',
                  title: 'MRB Authorized "Use-As-Is"',
                  desc: 'Material Review Board evaluated non-functional impact.'
                },
                {
                  id: 'deviation_authorized',
                  title: 'Engineering Deviation Permit',
                  desc: 'Internal Engineering Change Note / temporary deviation signed.'
                },
                {
                  id: 'scrapped_disposed',
                  title: 'Reject & Scrap / Metal Salvage',
                  desc: 'Permanently rejected. Move to scrap yard and close hold.'
                }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setReleaseDisposition(opt.id as QualityReleaseDisposition)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    releaseDisposition === opt.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                      : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      releaseDisposition === opt.id
                        ? 'border-emerald-400 bg-emerald-500 text-slate-900'
                        : 'border-slate-600'
                    }`}
                  >
                    {releaseDisposition === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{opt.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Verification Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Mandatory Quality Assurance Verification Checklist <span className="text-emerald-400">*</span>
            </label>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 space-y-2">
              {[
                {
                  key: 'reInspectionDone' as const,
                  label: 'Re-inspection or rework dimensional measurement logged with certified calibrated gage',
                  required: true
                },
                {
                  key: 'rootCauseIdentified' as const,
                  label: 'Root cause investigated and linked to CAPA / process parameter adjustment',
                  required: true
                },
                {
                  key: 'quarantineTagRemoved' as const,
                  label: 'Physical Red Quarantine Tag removed from shopfloor pallet & material released to staging',
                  required: true
                },
                {
                  key: 'documentationUpdated' as const,
                  label: 'Quality inspection dossier & electronic batch record (eDHR) updated with disposition',
                  required: true
                },
                {
                  key: 'customerConcessionAttached' as const,
                  label: 'Customer concession / deviation waiver signed and attached (if applicable)',
                  required: false
                }
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => handleToggleChecklist(item.key)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer select-none transition"
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                      checklist[item.key]
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {checklist[item.key] && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs ${checklist[item.key] ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                    {item.label}
                    {item.required && <span className="text-rose-400 ml-1">*</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engineering Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Engineering Justification &amp; Authority Release Rationale <span className="text-emerald-400">*</span>
            </label>
            <textarea
              rows={3}
              value={releaseJustification}
              onChange={e => setReleaseJustification(e.target.value)}
              required
              placeholder="State technical justification, gage serial numbers, re-measurement data, and reasons why this batch is conforming for dispatch..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>

          {/* Quality Authority Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quality Authority Signatory <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={releasedBy}
                  onChange={e => setReleasedBy(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Signatory Role / Designation <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={releasedByRole}
                onChange={e => setReleasedByRole(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authority Credential / ID <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={authorityCredentials}
                  onChange={e => setAuthorityCredentials(e.target.value)}
                  required
                  placeholder="e.g. IATF-LEAD-SIGNATORY-9921"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Formal E-Signature Acknowledgement */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="agreeRelease"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded border-slate-600 focus:ring-emerald-500 bg-slate-900 mt-0.5"
              />
              <label htmlFor="agreeRelease" className="text-xs text-slate-300 cursor-pointer leading-snug">
                <strong className="text-emerald-300">Formal Digital Attestation:</strong> I hereby certify under penalty of
                quality system audit that this lot has been thoroughly re-evaluated, meets all functional requirements,
                and is legally released from Quality Hold for dispatch release.
              </label>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/80 pl-6 flex items-center gap-1.5">
              <Stamp className="w-3 h-3" />
              <span>Will apply digital cryptographic timestamp: SIG-QA-RELEASE-[TIMESTAMP]</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!agreeTerms || !isChecklistValid}
              className={`font-mono text-xs uppercase font-extrabold tracking-wider px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition ${
                agreeTerms && isChecklistValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign &amp; Release Quality Hold (Unlock Dispatch)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
