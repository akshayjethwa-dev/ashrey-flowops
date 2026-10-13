// src/components/quality-holds/QualityHoldDetailsModal.tsx

import React from 'react';
import {
  X,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Printer,
  FileCheck2,
  MapPin,
  User,
  Layers,
  Award,
  ChevronRight,
  ExternalLink,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { QualityHoldRecord } from '../../types/qualityHold';
import { QualityHoldBadge } from './QualityHoldBadge';

interface QualityHoldDetailsModalProps {
  isOpen: boolean;
  hold: QualityHoldRecord | null;
  onClose: () => void;
  onOpenReleaseModal: (hold: QualityHoldRecord) => void;
  onOpenPrintModal: (hold: QualityHoldRecord) => void;
}

export const QualityHoldDetailsModal: React.FC<QualityHoldDetailsModalProps> = ({
  isOpen,
  hold,
  onClose,
  onOpenReleaseModal,
  onOpenPrintModal
}) => {
  if (!isOpen || !hold) return null;

  const calculateAging = (placedAt: string) => {
    const diffMs = Date.now() - new Date(placedAt).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-850 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              hold.status === 'active_hold'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : hold.status === 'released'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-red-600/20 text-red-400 border border-red-500/40'
            }`}>
              {hold.status === 'active_hold' ? (
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              ) : hold.status === 'released' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100">Quality Hold Dossier</h2>
                <span className="font-mono text-sm font-extrabold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                  {hold.id}
                </span>
                <QualityHoldBadge status={hold.status} severity={hold.severity} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: {hold.targetType.toUpperCase()} <span className="font-mono text-slate-200">{hold.targetNumber}</span> · Part: {hold.partName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintModal(hold)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print Physical Quarantine Tag"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Print Red Tag</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dispatch Gate Status Banner */}
          {hold.status === 'active_hold' ? (
            <div className="bg-rose-950/40 border border-rose-900/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-rose-200">
                    Dispatch Gate is HARD-LOCKED for this Batch/Work Order
                  </div>
                  <div className="text-xs text-rose-300/90 mt-0.5">
                    Logistics vehicles cannot be assigned and shipping notes cannot be generated until a formal
                    Quality Authority sign-off is completed.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenReleaseModal(hold);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase font-extrabold tracking-wider px-4 py-2 rounded-lg shadow-md shrink-0 flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Release Workflow</span>
              </button>
            </div>
          ) : hold.status === 'released' ? (
            <div className="bg-emerald-950/40 border border-emerald-900/80 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-emerald-200">
                  Hold Formally Released &amp; Dispatch Clearance Granted
                </div>
                <div className="text-xs text-emerald-300/90 mt-0.5 font-mono">
                  Released by {hold.releaseWorkflow?.releasedBy} ({hold.releaseWorkflow?.releasedByRole}) on{' '}
                  {new Date(hold.releaseWorkflow?.releasedAt || '').toLocaleString()} · Sig Token:{' '}
                  {hold.releaseWorkflow?.electronicSignature}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-950/40 border border-red-900/80 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-red-200">
                  Batch Quarantined / Scrapped
                </div>
                <div className="text-xs text-red-300/90 mt-0.5">
                  Consignment held in secure MRB scrap area. Dispatch blocked permanently.
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Quantity on Hold</span>
              <span className="text-lg font-bold font-mono text-amber-400">{hold.quantity} {hold.unit}</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Containment Location</span>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 mt-1 truncate" title={hold.location}>
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{hold.location}</span>
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Hold Aging</span>
              <span className="text-lg font-bold font-mono text-slate-200 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {calculateAging(hold.placedAt)}
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Severity Classification</span>
              <span className="text-xs font-bold font-mono uppercase text-rose-400 mt-1 block">
                {hold.severity} PRIORITY
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-slate-800/40 border border-slate-700/70 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-700/60 pb-2">
              Non-Conformance Details &amp; Root Cause Classification
            </h3>

            <div>
              <div className="text-xs font-semibold text-slate-400">Primary Reason Summary</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">{hold.holdReason}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400">Technical Investigation &amp; Defect Findings</div>
              <div className="text-xs text-slate-300 leading-relaxed mt-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {hold.holdDescription}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Reason Category</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {hold.holdReasonCategory.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Flagged By Inspector</span>
                <span className="font-semibold text-slate-200">{hold.placedBy} ({hold.placedByRole})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Placed Date &amp; Time</span>
                <span className="font-mono text-slate-300">{new Date(hold.placedAt).toLocaleString()}</span>
              </div>
            </div>

            {(hold.ncrId || hold.inspectionRef) && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
                {hold.ncrId && (
                  <div className="flex items-center gap-1.5 font-mono bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800 text-rose-300">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Linked NCR: {hold.ncrId}</span>
                  </div>
                )}
                {hold.inspectionRef && (
                  <div className="flex items-center gap-1.5 font-mono bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800 text-indigo-300">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Inspection Ref: {hold.inspectionRef}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Release Documentation (If Released) */}
          {hold.releaseWorkflow && (
            <div className="bg-emerald-950/20 border border-emerald-900/70 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Quality Authority Release Certification &amp; Sign-Off</span>
                </h3>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {hold.releaseWorkflow.releaseDisposition.toUpperCase().replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400/90">Engineering Release Justification</span>
                <div className="text-xs text-slate-200 mt-1 bg-slate-900/80 p-3 rounded-lg border border-emerald-900/40 leading-relaxed font-sans">
                  {hold.releaseWorkflow.releaseJustification}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Quality Authority Signatory</span>
                  <span className="font-bold text-slate-100">{hold.releaseWorkflow.releasedBy}</span>
                  <span className="text-[11px] text-slate-400 block">{hold.releaseWorkflow.releasedByRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Signatory Credential ID</span>
                  <span className="font-mono text-emerald-300 font-semibold">{hold.releaseWorkflow.authorityCredentials}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase">Digital Cryptographic Token</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate block" title={hold.releaseWorkflow.electronicSignature}>
                    {hold.releaseWorkflow.electronicSignature}
                  </span>
                </div>
              </div>

              {/* Checklist verification tags */}
              <div className="pt-2 border-t border-emerald-900/40">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">Verification Checklist Verification:</span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {Object.entries(hold.releaseWorkflow.verificationChecklist).map(([key, val]) => (
                    <span
                      key={key}
                      className={`px-2 py-0.5 rounded-full border font-mono flex items-center gap-1 ${
                        val
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lifecycle Audit Trail Timeline */}
          <div className="bg-slate-800/40 border border-slate-700/70 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-700/60 pb-2">
              Quality Hold Lifecycle Audit Trail (ISO 9001:2015 Record)
            </h3>
            <div className="space-y-3 pt-2">
              {hold.history.map((ev, idx) => (
                <div key={ev.id || idx} className="flex items-start gap-3 relative">
                  {idx !== hold.history.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-700" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    ev.action === 'placed'
                      ? 'bg-rose-950 border-rose-600 text-rose-400'
                      : ev.action === 'released'
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                      : 'bg-slate-800 border-slate-600 text-slate-400'
                  }`}>
                    {ev.action === 'placed' ? (
                      <AlertOctagon className="w-3.5 h-3.5" />
                    ) : ev.action === 'released' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-200 capitalize">{ev.action.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5 font-medium">
                      By: <span className="text-slate-200">{ev.actorName}</span> ({ev.actorRole})
                    </div>
                    <div className="text-slate-300 mt-1 leading-snug">{ev.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-850 p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Audit Document ID: <strong className="text-slate-300">{hold.id}-REV02</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
