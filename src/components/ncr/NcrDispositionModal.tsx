// src/components/ncr/NcrDispositionModal.tsx

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Truck,
  Layers,
  FileCheck2,
  DollarSign,
  Stamp,
  User,
  Clock,
  Sparkles,
  Wrench
} from 'lucide-react';
import {
  NcrRecord,
  NcrDispositionDetails,
  NcrDispositionType
} from '../../types/ncr';

interface NcrDispositionModalProps {
  ncr: NcrRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDisposition: (ncrId: string, dispositionData: NcrDispositionDetails) => void;
  onLaunchCapa?: (ncr: NcrRecord) => void;
}

export const NcrDispositionModal: React.FC<NcrDispositionModalProps> = ({
  ncr,
  isOpen,
  onClose,
  onSubmitDisposition,
  onLaunchCapa
}) => {
  if (!isOpen || !ncr) return null;

  const [dispositionType, setDispositionType] = useState<NcrDispositionType>(
    ncr.disposition.dispositionType !== 'pending' ? ncr.disposition.dispositionType : 'rework'
  );
  const [dispositionedBy, setDispositionedBy] = useState(
    ncr.disposition.dispositionedBy || 'Elena Vance'
  );
  const [role, setRole] = useState(ncr.disposition.role || 'Material Review Board Chair');
  const [reason, setReason] = useState(
    ncr.disposition.reason ||
      'Defect reviewed by MRB team. Feasibility assessed against part geometry and drawing specifications.'
  );
  const [reworkInstructions, setReworkInstructions] = useState(
    ncr.disposition.reworkInstructions ||
      'Route to OP-GRN-04 for secondary precision skim cut. Re-inspect 100% on coordinate measuring machine.'
  );
  const [reworkOperationCode, setReworkOperationCode] = useState(
    ncr.disposition.reworkOperationCode || 'OP-RWK-01'
  );
  const [scrapCostEstimate, setScrapCostEstimate] = useState<number>(
    ncr.disposition.scrapCostEstimate || ncr.financialImpactCopq || 850
  );
  const [concessionNumber, setConcessionNumber] = useState(
    ncr.disposition.concessionNumber || `CONC-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [rtvDebitNoteNumber, setRtvDebitNoteNumber] = useState(
    ncr.disposition.rtvDebitNoteNumber || `DBN-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [authorizedSignature, setAuthorizedSignature] = useState(
    ncr.disposition.authorizedSignature || 'E. Vance - MRB-AUTH-09'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispositionedBy.trim()) return;

    const dispositionData: NcrDispositionDetails = {
      dispositionType,
      dispositionedBy: dispositionedBy.trim(),
      role: role.trim(),
      dispositionedAt: new Date().toISOString(),
      reason: reason.trim(),
      reworkInstructions: dispositionType === 'rework' ? reworkInstructions.trim() : undefined,
      reworkOperationCode: dispositionType === 'rework' ? reworkOperationCode.trim() : undefined,
      scrapCostEstimate: dispositionType === 'scrap' ? scrapCostEstimate : undefined,
      concessionNumber: dispositionType === 'use_as_is' ? concessionNumber.trim() : undefined,
      rtvDebitNoteNumber: dispositionType === 'return_to_vendor' ? rtvDebitNoteNumber.trim() : undefined,
      authorizedSignature: authorizedSignature.trim()
    };

    onSubmitDisposition(ncr.id, dispositionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Material Review Board (MRB) Disposition Decision
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                  {ncr.ncrNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official non-conformance material disposition: Rework, Scrap, Concession, or Return
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

        {/* Defect Overview Banner */}
        <div className="px-6 py-3.5 bg-slate-850/70 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Part SKU & Name</span>
            <strong className="text-cyan-300 block truncate">{ncr.partSku}</strong>
            <span className="text-[11px] text-slate-400 truncate block">{ncr.partName}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Lot & Work Order</span>
            <span className="font-mono font-bold text-slate-200 block">{ncr.lotNumber}</span>
            <span className="text-[11px] text-slate-400 block font-mono">{ncr.workOrderNumber || 'Direct Stock'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Defect / Suspect Qty</span>
            <span className="font-mono font-bold text-rose-400 block">
              {ncr.defectiveQuantity} / {ncr.affectedQuantity} pcs
            </span>
            <span className="text-[11px] text-slate-400 block uppercase font-mono">{ncr.severity} severity</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Quarantine Location</span>
            <span className="font-semibold text-amber-300 block truncate">{ncr.quarantineLocation}</span>
            <span className="text-[11px] text-slate-400 block">Aging: {ncr.agingDays} days</span>
          </div>
        </div>

        {/* Defect Description Card */}
        <div className="mx-6 mt-4 p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-1">
          <span className="text-slate-400 font-bold block text-[11px] uppercase font-mono">
            Reported Non-Conformance Finding:
          </span>
          <p className="text-slate-200 leading-relaxed text-xs">
            {ncr.defectDescription}
          </p>
          <div className="pt-1 text-[11px] text-slate-400">
            <strong>Immediate Containment:</strong> {ncr.immediateContainment}
          </div>
        </div>

        {/* Disposition Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Disposition Decision Options */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">
              Select MRB Disposition Decision: *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              
              {/* 1. Rework */}
              <button
                type="button"
                onClick={() => setDispositionType('rework')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  dispositionType === 'rework'
                    ? 'bg-blue-950/60 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-xs">Rework</span>
                <span className="text-[10px] text-slate-400">Secondary processing</span>
              </button>

              {/* 2. Scrap */}
              <button
                type="button"
                onClick={() => setDispositionType('scrap')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  dispositionType === 'scrap'
                    ? 'bg-rose-950/60 border-rose-500 text-white ring-1 ring-rose-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-xs">Scrap</span>
                <span className="text-[10px] text-slate-400">Condemn & decommission</span>
              </button>

              {/* 3. Use-As-Is (Concession) */}
              <button
                type="button"
                onClick={() => setDispositionType('use_as_is')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  dispositionType === 'use_as_is'
                    ? 'bg-amber-950/60 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-xs">Use-As-Is</span>
                <span className="text-[10px] text-slate-400">Engineering concession</span>
              </button>

              {/* 4. Return to Vendor */}
              <button
                type="button"
                onClick={() => setDispositionType('return_to_vendor')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  dispositionType === 'return_to_vendor'
                    ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Truck className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-xs">Return to Vendor</span>
                <span className="text-[10px] text-slate-400">Supplier debit note</span>
              </button>

              {/* 5. Sort & Segregate */}
              <button
                type="button"
                onClick={() => setDispositionType('sort_segregate')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  dispositionType === 'sort_segregate'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white ring-1 ring-cyan-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-xs">Sort / Screen</span>
                <span className="text-[10px] text-slate-400">100% batch sort</span>
              </button>

            </div>
          </div>

          {/* Conditional Disposition Specific Inputs */}
          {dispositionType === 'rework' && (
            <div className="p-4 bg-blue-950/30 border border-blue-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Wrench className="w-4 h-4" />
                <span>Rework Routing & Machining Protocol</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Rework Operation Code</label>
                  <input
                    type="text"
                    value={reworkOperationCode}
                    onChange={e => setReworkOperationCode(e.target.value)}
                    placeholder="e.g. OP-GRN-04"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rework Instructions & Tolerance Goal</label>
                  <input
                    type="text"
                    value={reworkInstructions}
                    onChange={e => setReworkInstructions(e.target.value)}
                    placeholder="e.g. Skim lobe profile by 0.030mm on Studer CNC Grinder"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {dispositionType === 'scrap' && (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Trash2 className="w-4 h-4" />
                <span>Scrap Valuation & Inventory Condemnation</span>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estimated Scrap Financial Loss ($ COPQ)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={scrapCostEstimate}
                    onChange={e => setScrapCostEstimate(parseFloat(e.target.value) || 0)}
                    placeholder="Scrap cost"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white font-mono"
                  />
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Scrapped inventory will be condemned and written off in stock ledger.
                </span>
              </div>
            </div>
          )}

          {dispositionType === 'use_as_is' && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Engineering Deviation / Customer Concession Authorization</span>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Approved Concession / Deviation Reference #</label>
                <input
                  type="text"
                  value={concessionNumber}
                  onChange={e => setConcessionNumber(e.target.value)}
                  placeholder="e.g. CONC-2026-042"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          )}

          {dispositionType === 'return_to_vendor' && (
            <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Truck className="w-4 h-4" />
                <span>Supplier Return to Vendor (RTV) Logistics</span>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supplier Debit Note # / Return Merchandise Authorization</label>
                <input
                  type="text"
                  value={rtvDebitNoteNumber}
                  onChange={e => setRtvDebitNoteNumber(e.target.value)}
                  placeholder="e.g. DBN-2026-088"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Rationale & MRB Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              MRB Technical Justification & Engineering Risk Assessment *
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Signatory Authority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Signatory Name *</label>
              <input
                type="text"
                required
                value={dispositionedBy}
                onChange={e => setDispositionedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Role / Committee *</label>
              <input
                type="text"
                required
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Digital Stamp / Badge ID</label>
              <input
                type="text"
                value={authorizedSignature}
                onChange={e => setAuthorizedSignature(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {onLaunchCapa && !ncr.linkedCapaId && (
              <button
                type="button"
                onClick={() => {
                  onLaunchCapa(ncr);
                  onClose();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Escalate directly to 8D CAPA
              </button>
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-600/25 flex items-center gap-1.5"
              >
                <Stamp className="w-4 h-4" />
                Endorse MRB Disposition
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
