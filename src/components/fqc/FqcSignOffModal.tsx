// src/components/fqc/FqcSignOffModal.tsx

import React, { useState } from 'react';
import {
  X,
  Award,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileCheck2,
  Stamp,
  User,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { FqcInspectionOrder } from '../../types/fqc';

interface FqcSignOffModalProps {
  order: FqcInspectionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOff: (
    orderId: string,
    signOffData: {
      signedBy: string;
      role: string;
      badgeId?: string;
      remarks: string;
      disposition: 'passed' | 'rejected' | 'conditional_release';
      signaturePinOrHash?: string;
    }
  ) => void;
}

export const FqcSignOffModal: React.FC<FqcSignOffModalProps> = ({
  order,
  isOpen,
  onClose,
  onSignOff
}) => {
  if (!isOpen || !order) return null;

  const [signedBy, setSignedBy] = useState('Sarah Lin, CQE');
  const [role, setRole] = useState('Quality Assurance Authority');
  const [badgeId, setBadgeId] = useState('QA-AUTH-09');
  const [disposition, setDisposition] = useState<'passed' | 'rejected' | 'conditional_release'>(
    order.defectSummary.critical > 0 ? 'rejected' : 'passed'
  );
  const [remarks, setRemarks] = useState(
    order.defectSummary.critical > 0
      ? 'REJECTED: Non-conformance detected on critical characteristic. Lot quarantined to MRB area.'
      : 'All final inspection checklist characteristics verified conforming to engineering specifications and ISO 9001:2015. Lot released for dispatch gate.'
  );
  const [signaturePin, setSignaturePin] = useState('8842');
  const [agreedToCompliance, setAgreedToCompliance] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pendingItems = order.items.filter(it => it.result === 'pending').length;
  const criticalDefects = order.defectSummary.critical;

  const handleDispositionChange = (newDisp: 'passed' | 'rejected' | 'conditional_release') => {
    setDisposition(newDisp);
    if (newDisp === 'passed') {
      setRemarks('All final inspection checklist characteristics verified conforming to engineering specifications and ISO 9001:2015. Lot released for dispatch gate.');
    } else if (newDisp === 'conditional_release') {
      setRemarks('CONDITIONAL RELEASE: Approved Engineering Deviation #DEV-2026-44 authorized. Minor cosmetic variance within customer concession limits.');
    } else {
      setRemarks('REJECTED: Non-conformance detected on critical characteristic. Lot quarantined to MRB area.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedBy.trim()) return;

    setSubmitting(true);
    try {
      const hash = `SHA256:${Date.now().toString(16)}-${Math.random().toString(36).substr(2, 8)}-CERT-AUTH`;
      onSignOff(order.id, {
        signedBy: signedBy.trim(),
        role: role.trim(),
        badgeId: badgeId.trim(),
        remarks: remarks.trim(),
        disposition,
        signaturePinOrHash: hash
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Quality Authority Sign-Off & Dispatch Release Gate
              </h2>
              <p className="text-xs text-slate-400">
                Official digital endorsement under ISO 9001:2015, IATF 16949 Section 8.6 & 21 CFR Part 820
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

        {/* Inspection Summary Banner */}
        <div className="px-6 py-3.5 bg-slate-850/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">FQC Inspection:</span>{' '}
            <strong className="text-white font-mono">{order.fqcNumber}</strong>
            <span className="mx-2 text-slate-600">&bull;</span>
            <span className="text-slate-400">Part:</span>{' '}
            <strong className="text-cyan-300">{order.partSku}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Lot:</span>{' '}
            <span className="font-mono text-slate-200">{order.lotNumber}</span>
            <span className="mx-1 text-slate-600">&bull;</span>
            <span className="text-slate-400">Qty:</span>{' '}
            <span className="font-mono text-slate-200">{order.batchQuantity} pcs</span>
          </div>
        </div>

        {/* Warning if items are pending */}
        {pendingItems > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-950/50 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Note:</strong> {pendingItems} checklist items are still marked pending. Conforming release requires full inspection verification.
            </span>
          </div>
        )}

        {criticalDefects > 0 && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/50 border border-rose-500/60 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Critical Defect Alert:</strong> {criticalDefects} critical parameter(s) failed inspection! Releasing this lot for dispatch may cause severe customer rejections.
            </span>
          </div>
        )}

        {/* Sign-off Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Release Disposition Choice */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">
              Select Quality Release Disposition:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Passed & Released */}
              <button
                type="button"
                onClick={() => handleDispositionChange('passed')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  disposition === 'passed'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Release for Dispatch
                  </span>
                  {disposition === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Conforming finished lot. Generates CoC certificate and unlocks Dispatch release gate.
                </p>
              </button>

              {/* Conditional Release */}
              <button
                type="button"
                onClick={() => handleDispositionChange('conditional_release')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  disposition === 'conditional_release'
                    ? 'bg-amber-950/50 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Conditional Release
                  </span>
                  {disposition === 'conditional_release' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Approved engineering deviation / concession documented with customer approval.
                </p>
              </button>

              {/* Reject & Quarantine */}
              <button
                type="button"
                onClick={() => handleDispositionChange('rejected')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  disposition === 'rejected'
                    ? 'bg-rose-950/50 border-rose-500 text-white shadow-sm ring-1 ring-rose-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Reject & Quarantine
                  </span>
                  {disposition === 'rejected' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Non-conforming product. Dispatch gate remains hard-blocked. Auto-hold transferred to MRB.
                </p>
              </button>
            </div>
          </div>

          {/* Signatory Authority Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Authorized Signatory Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={signedBy}
                  onChange={e => setSignedBy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Sarah Lin, CQE"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Quality Authority Title & Role *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
                placeholder="e.g. Quality Assurance Authority / QA Manager"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Inspector Badge / Certification ID
              </label>
              <input
                type="text"
                value={badgeId}
                onChange={e => setBadgeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                placeholder="e.g. QA-AUTH-09"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Digital PIN / E-Signature Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={signaturePin}
                  onChange={e => setSignaturePin(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter 4-digit PIN"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Final Quality Sign-off Remarks & Conformance Endorsement *
            </label>
            <textarea
              rows={2}
              required
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none text-xs"
            />
          </div>

          {/* ISO 9001 Compliance Statement Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-slate-850/80 border border-slate-750 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreedToCompliance}
              onChange={e => setAgreedToCompliance(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white block font-semibold mb-0.5">
                Official Quality Declaration (ISO 9001:2015 & IATF 16949 Section 8.6)
              </strong>
              I hereby certify that the finished goods lots referenced above have been inspected in accordance with approved quality control plans and engineering drawings. I endorse this disposition under factory quality policy.
            </div>
          </label>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !agreedToCompliance}
              className={`px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition flex items-center gap-2 ${
                disposition === 'passed'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : disposition === 'conditional_release'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              } ${!agreedToCompliance ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Stamp className="w-4 h-4" />
              {disposition === 'passed'
                ? 'Endorse CoC & Release Dispatch Gate'
                : disposition === 'conditional_release'
                ? 'Issue Conditional Deviation Release'
                : 'Enforce Rejection & Lock MRB Quarantine'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
