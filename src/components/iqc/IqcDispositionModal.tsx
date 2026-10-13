// src/components/iqc/IqcDispositionModal.tsx

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  Building2,
  PackageCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { IqcOrder, DispositionType, IqcDispositionDetails } from '../../types/iqc';

interface IqcDispositionModalProps {
  order: IqcOrder;
  onClose: () => void;
  onApplyDisposition: (orderId: string, dispositionData: IqcDispositionDetails) => Promise<any>;
}

export const IqcDispositionModal: React.FC<IqcDispositionModalProps> = ({
  order,
  onClose,
  onApplyDisposition
}) => {
  const [disposition, setDisposition] = useState<DispositionType>(
    order.disposition?.disposition !== 'pending'
      ? order.disposition?.disposition || 'accepted'
      : order.overallResult === 'fail'
      ? 'rejected'
      : 'accepted'
  );

  const [acceptedQty, setAcceptedQty] = useState<number>(
    disposition === 'accepted'
      ? order.receivedQty
      : disposition === 'rejected'
      ? 0
      : Math.floor(order.receivedQty * 0.8)
  );

  const [rejectedQty, setRejectedQty] = useState<number>(
    disposition === 'rejected'
      ? order.receivedQty
      : disposition === 'accepted'
      ? 0
      : 0
  );

  const [reworkQty, setReworkQty] = useState<number>(
    disposition === 'rework' ? order.receivedQty : 0
  );

  const [quarantineReason, setQuarantineReason] = useState<string>(
    order.disposition?.quarantineReason ||
    (order.overallResult === 'fail'
      ? 'Non-conforming dimensions / visual defects identified during sample inspection.'
      : '')
  );

  const [rtvDocNumber, setRtvDocNumber] = useState<string>(
    order.disposition?.rtvDocNumber || `RTV-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const [reworkInstructions, setReworkInstructions] = useState<string>(
    order.disposition?.reworkInstructions ||
    'Secondary operation: Manual deburring and edge dress-up at Station #02 before machining.'
  );

  const [mrbApprovalNotes, setMrbApprovalNotes] = useState<string>(
    order.disposition?.mrbApprovalNotes || ''
  );

  const [targetBinCode, setTargetBinCode] = useState<string>(
    disposition === 'accepted'
      ? 'BIN-RAW-01 (Main Warehouse Rack A)'
      : disposition === 'rejected'
      ? 'BIN-RED-QUARANTINE (Dock Bay 4)'
      : 'BIN-REWORK-STAGE-02'
  );

  // Digital Signature
  const [signerName, setSignerName] = useState<string>('Anita Desai');
  const [badgeId, setBadgeId] = useState<string>('QC-408');
  const [role, setRole] = useState<string>('Quality Assurance Inspector');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle disposition change and adjust suggested quantities
  const handleDispositionChange = (newDisp: DispositionType) => {
    setDisposition(newDisp);
    if (newDisp === 'accepted') {
      setAcceptedQty(order.receivedQty);
      setRejectedQty(0);
      setReworkQty(0);
      setTargetBinCode('BIN-RAW-01 (Main Warehouse Rack A)');
    } else if (newDisp === 'rejected') {
      setAcceptedQty(0);
      setRejectedQty(order.receivedQty);
      setReworkQty(0);
      setTargetBinCode('BIN-RED-QUARANTINE (Dock Bay 4)');
    } else if (newDisp === 'rework') {
      setAcceptedQty(0);
      setRejectedQty(0);
      setReworkQty(order.receivedQty);
      setTargetBinCode('BIN-REWORK-STAGE-02');
    } else if (newDisp === 'mrb_review') {
      setTargetBinCode('BIN-MRB-HOLD-01');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const dispositionData: IqcDispositionDetails = {
        disposition,
        decidedBy: 'current-user',
        decidedByName: signerName,
        decidedAt: new Date().toISOString(),
        acceptedQty,
        rejectedQty,
        reworkQty,
        quarantineReason: disposition === 'rejected' ? quarantineReason : undefined,
        rtvDocNumber: disposition === 'rejected' ? rtvDocNumber : undefined,
        reworkInstructions: disposition === 'rework' ? reworkInstructions : undefined,
        mrbApprovalNotes: disposition === 'mrb_review' ? mrbApprovalNotes : undefined,
        targetBinCode,
        digitalSignature: {
          signerName,
          badgeId,
          role,
          timestamp: new Date().toISOString(),
          statement:
            disposition === 'accepted'
              ? `I hereby authorize the release of ${acceptedQty} ${order.unit} into active inventory. Conformance verified.`
              : disposition === 'rejected'
              ? `LOT REJECTED: Tagged with RED HOLD. Material quarantined and Debit Note / RTV document issued.`
              : disposition === 'rework'
              ? `CONDITIONAL RELEASE: Routed to shop-floor for secondary rework under surveillance.`
              : `MRB CONCESSION: Forwarded for Material Review Board engineering sign-off.`
        }
      };

      await onApplyDisposition(order.id, dispositionData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Final Lot Disposition & Stock Release
              </h2>
              <p className="text-xs text-slate-400">
                {order.orderNumber} • {order.partName} ({order.partSku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Disposition Selector Cards */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 font-bold mb-3">
              Select Official Disposition Decision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              
              {/* Accept Card */}
              <button
                type="button"
                onClick={() => handleDispositionChange('accepted')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                  disposition === 'accepted'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    PASS
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Accept & Release</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Release full or sampled lot to production warehouse
                  </div>
                </div>
              </button>

              {/* Reject Card */}
              <button
                type="button"
                onClick={() => handleDispositionChange('rejected')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                  disposition === 'rejected'
                    ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    REJECT
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Quarantine & RTV</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Quarantine lot and initiate Return-To-Vendor voucher
                  </div>
                </div>
              </button>

              {/* Rework Card */}
              <button
                type="button"
                onClick={() => handleDispositionChange('rework')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                  disposition === 'rework'
                    ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    REWORK
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Conditional Rework</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Route lot to deburring, sorting, or machining station
                  </div>
                </div>
              </button>

              {/* MRB Review Card */}
              <button
                type="button"
                onClick={() => handleDispositionChange('mrb_review')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                  disposition === 'mrb_review'
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    MRB
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">MRB Concession</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Escalate to Material Review Board engineering panel
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Quantity Allocation */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold mb-3">
              Quantity Allocation (Total Lot: {order.receivedQty} {order.unit})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-emerald-400 mb-1">
                  Accepted Quantity ({order.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  max={order.receivedQty}
                  value={acceptedQty}
                  onChange={(e) => setAcceptedQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-400 mb-1">
                  Rejected Quantity ({order.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  max={order.receivedQty}
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-rose-500/50 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-400 mb-1">
                  Rework Quantity ({order.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  max={order.receivedQty}
                  value={reworkQty}
                  onChange={(e) => setReworkQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Conditional Fields based on Disposition */}
          {disposition === 'rejected' && (
            <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Return to Vendor (RTV) & Quarantine Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">RTV Document Reference #</label>
                  <input
                    type="text"
                    value={rtvDocNumber}
                    onChange={(e) => setRtvDocNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Quarantine Holding Bin</label>
                  <input
                    type="text"
                    value={targetBinCode}
                    onChange={(e) => setTargetBinCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Defect Reason & Failure Root Cause</label>
                <textarea
                  rows={2}
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  placeholder="Explain why lot was rejected (e.g. dimensional under-tolerance, severe oxidation, burrs)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {disposition === 'rework' && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 space-y-3">
              <label className="block text-xs text-amber-300 font-bold uppercase font-mono">
                Rework Routing & Shop Instructions
              </label>
              <textarea
                rows={2}
                value={reworkInstructions}
                onChange={(e) => setReworkInstructions(e.target.value)}
                placeholder="Specify operations required (e.g. deburring, re-tapping, sandblasting, 100% sorting)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {disposition === 'mrb_review' && (
            <div className="bg-purple-950/20 border border-purple-500/40 rounded-2xl p-4 space-y-3">
              <label className="block text-xs text-purple-300 font-bold uppercase font-mono">
                MRB Engineering Concession Justification
              </label>
              <textarea
                rows={2}
                value={mrbApprovalNotes}
                onChange={(e) => setMrbApprovalNotes(e.target.value)}
                placeholder="Technical justification why slight non-conformance does not impair fit, form, or function..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Digital Signature & Inspector Declaration */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase font-mono">
              <Building2 className="w-4 h-4" />
              Inspector 21 CFR Part 11 Digital Signature
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Inspector Full Name</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Badge ID</label>
                <input
                  type="text"
                  required
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              "By signing this record, I certify under penalty of internal audit sanctions that all measurements, defect captures, and disposition approvals recorded in {order.orderNumber} accurately represent the physical goods inspected."
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 transition disabled:opacity-50 active:scale-95"
            >
              <PackageCheck className="w-4 h-4" />
              {isSubmitting ? 'Committing Disposition...' : 'Commit Official Disposition'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
