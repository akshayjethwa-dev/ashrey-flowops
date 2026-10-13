// src/components/edhr/SignEDHRModal.tsx

import React, { useState } from 'react';
import {
  X,
  FileCheck,
  ShieldCheck,
  Lock,
  Key,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { EDHRRecord, SignatureIntent } from '../../types/edhr';

interface SignEDHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  dhr: EDHRRecord | null;
  onSign: (params: {
    dhrId: string;
    signerName: string;
    signerEmail: string;
    signerRole: string;
    signerUserId: string;
    intent: SignatureIntent;
    reasonStatement: string;
  }) => Promise<void>;
}

export const SignEDHRModal: React.FC<SignEDHRModalProps> = ({
  isOpen,
  onClose,
  dhr,
  onSign
}) => {
  if (!isOpen || !dhr) return null;

  const [signerName, setSignerName] = useState('Anand Deshmukh');
  const [signerEmail, setSignerEmail] = useState('anand.deshmukh@flowops.internal');
  const [signerRole, setSignerRole] = useState('Lead Quality Assurance Manager');
  const [signerUserId, setSignerUserId] = useState('usr-qc-01');
  const [intent, setIntent] = useState<SignatureIntent>('quality_approved');
  const [securityPin, setSecurityPin] = useState('••••');
  const [reasonStatement, setReasonStatement] = useState(
    'I have reviewed all compiled materials, machine operations, and CMM quality test data, and certify full compliance with engineering drawings and AS9100/ISO 13485 standards.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setSubmitting(true);
    try {
      await onSign({
        dhrId: dhr.id,
        signerName,
        signerEmail,
        signerRole,
        signerUserId,
        intent,
        reasonStatement
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>21 CFR Part 11 Electronic Signature</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40">
                  Legally Binding
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Batch Record: {dhr.dhrNumber} &bull; {dhr.partName}
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
          <div className="p-3 bg-teal-950/20 border border-teal-700/30 rounded-xl flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-teal-200/90 leading-relaxed">
              This signature will be cryptographically sealed into the batch record audit trail. Once executed, it cannot be altered or removed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Signer Full Name</label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Signer Role / Title</label>
              <input
                type="text"
                value={signerRole}
                onChange={e => setSignerRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Employee User ID</label>
              <input
                type="text"
                value={signerUserId}
                onChange={e => setSignerUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Signer Email</label>
              <input
                type="email"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Signature Intent / Meaning</label>
            <select
              value={intent}
              onChange={e => setIntent(e.target.value as SignatureIntent)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
            >
              <option value="quality_approved">Quality Assurance Final Approval (QA Review)</option>
              <option value="released_for_distribution">Released for Commercial Distribution (Final Release)</option>
              <option value="verified_by">Verified By (Production Supervision Review)</option>
              <option value="performed_by">Performed By (Manufacturing Operations Execution)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Reason / Attestation Statement</label>
            <textarea
              rows={3}
              value={reasonStatement}
              onChange={e => setReasonStatement(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 leading-relaxed focus:border-teal-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Electronic PIN / Password Re-Authentication</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={securityPin}
                onChange={e => setSecurityPin(e.target.value)}
                placeholder="Enter password to sign"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono tracking-widest focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Legal Compliance Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
              />
              <span className="text-[10px] text-slate-300 leading-tight">
                I hereby declare that this electronic signature is the legally binding equivalent of my handwritten signature under FDA 21 CFR Part 11 and EU Annex 11 regulations.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !agreeTerms}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing Digitally...' : 'Apply 21 CFR Part 11 Signature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
