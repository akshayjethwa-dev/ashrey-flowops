// src/components/traceability/InitiateRecallModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Building2,
  Package,
  Layers,
  Truck,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import {
  LotRecord,
  RecallDefectType,
  RecallSeverity
} from '../../types/traceability';
import { useAuth } from '../../context/AuthContext';

interface InitiateRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: LotRecord[];
  initialLotNumber?: string;
  onSubmit: (params: {
    suspectLotNumber: string;
    title: string;
    defectCategory: RecallDefectType;
    severity: RecallSeverity;
    rootCauseFindings: string;
    correctiveActionPlan: string;
    initiatedBy: string;
    initiatedByName: string;
    qualityManagerSignOff: string;
    notes?: string;
  }) => Promise<any>;
}

export const InitiateRecallModal: React.FC<InitiateRecallModalProps> = ({
  isOpen,
  onClose,
  lots,
  initialLotNumber = '',
  onSubmit
}) => {
  const { profile } = useAuth();

  const [suspectLotNumber, setSuspectLotNumber] = useState<string>(initialLotNumber);
  const [title, setTitle] = useState<string>('');
  const [defectCategory, setDefectCategory] = useState<RecallDefectType>('surface_crack_inclusion');
  const [severity, setSeverity] = useState<RecallSeverity>('critical');
  const [rootCauseFindings, setRootCauseFindings] = useState<string>(
    'Ultrasonic and metallographic examination revealed micro-inclusion silicate stringers from supplier ladle degassing anomaly.'
  );
  const [correctiveActionPlan, setCorrectiveActionPlan] = useState<string>(
    '1. Quarantine physical raw material coils at current warehouse bin.\n2. Halt downstream Work Orders in machining/forging cells.\n3. Issue formal 8D customer notification bulletin to OEM automotive clients.\n4. Mandate 100% spectrometer recast audit from supplying mill.'
  );
  const [qualitySignOff, setQualitySignOff] = useState<string>(
    `Digitally Certified by: ${profile?.name || 'Lead Quality Manager'} (CQE / ASQ Auditor)`
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialLotNumber) {
      setSuspectLotNumber(initialLotNumber);
    } else if (lots.length > 0 && !suspectLotNumber) {
      setSuspectLotNumber(lots[0].lotNumber);
    }
  }, [initialLotNumber, lots, suspectLotNumber]);

  const selectedLot = lots.find(l => l.lotNumber === suspectLotNumber);

  useEffect(() => {
    if (selectedLot && !title) {
      setTitle(`Containment Notice: Quality Defect on ${selectedLot.stockItemName} [${selectedLot.lotNumber}]`);
    }
  }, [selectedLot, title]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectLotNumber) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        suspectLotNumber,
        title: title.trim(),
        defectCategory,
        severity,
        rootCauseFindings: rootCauseFindings.trim(),
        correctiveActionPlan: correctiveActionPlan.trim(),
        initiatedBy: profile?.uid || 'usr-qc',
        initiatedByName: profile?.name || 'Quality Assurance Manager',
        qualityManagerSignOff: qualitySignOff.trim(),
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to initiate recall containment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/30 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight">Initiate Quality Recall & Containment Hold</h3>
                <span className="bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  8D CAPA Action
                </span>
              </div>
              <p className="text-rose-200/80 text-xs mt-0.5">
                Instantly locks affected warehouse inventory, halts connected Work Orders, and calculates OEM customer exposure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Target Lot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Suspect Lot Number <span className="text-rose-500">*</span>
            </label>
            <select
              value={suspectLotNumber}
              onChange={e => {
                setSuspectLotNumber(e.target.value);
                const l = lots.find(x => x.lotNumber === e.target.value);
                if (l) setTitle(`Containment Notice: Quality Defect on ${l.stockItemName} [${l.lotNumber}]`);
              }}
              className="w-full text-sm font-mono font-semibold rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2 bg-slate-50"
            >
              {lots.map(l => (
                <option key={l.id} value={l.lotNumber}>
                  {l.lotNumber} — {l.stockItemName} ({l.lotType.toUpperCase()} | On-Hand: {l.currentQty} {l.unit} | Heat: {l.heatNumber || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Immediate Exposure Preview Box */}
          {selectedLot && (
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900 uppercase">
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Immediate Automated Lockdown Impact</span>
                </span>
                <span className="text-[11px] bg-rose-200/60 text-rose-800 px-2 py-0.5 rounded font-mono">
                  Bin: {selectedLot.binCode}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <span className="text-slate-400 block text-[10px]">Warehouse Stock</span>
                  <span className="font-bold text-slate-900">{selectedLot.currentQty} {selectedLot.unit}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <span className="text-slate-400 block text-[10px]">WIP Consumed</span>
                  <span className="font-bold text-purple-700">{selectedLot.consumedQty} {selectedLot.unit}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <span className="text-slate-400 block text-[10px]">Supplier Origin</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedLot.supplierName || 'Internal'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                  <span className="text-slate-400 block text-[10px]">Heat / Cast #</span>
                  <span className="font-bold font-mono text-amber-700">{selectedLot.heatNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Defect Classification & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Category</label>
              <select
                value={defectCategory}
                onChange={e => setDefectCategory(e.target.value as RecallDefectType)}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2"
              >
                <option value="surface_crack_inclusion">Surface Crack / Micro-Inclusions</option>
                <option value="chemical_out_of_spec">Chemical Composition Out-of-Spec (Spectrometer Fail)</option>
                <option value="hardness_failure">Hardness Failure (HRC / Brinell)</option>
                <option value="dimensional_variation">Dimensional Variation / Out of Tolerance</option>
                <option value="contamination">Foreign Material Contamination</option>
                <option value="supplier_safety_alert">Supplier Critical Safety Bulletin</option>
                <option value="customer_assembly_failure">Customer Field / Assembly Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Containment Severity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['critical', 'major', 'minor'] as RecallSeverity[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      severity === s
                        ? s === 'critical'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : s === 'major'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recall Bulletin Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm font-semibold rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Root-Cause Analysis Findings (5-Why / Metallurgical Analysis)
            </label>
            <textarea
              rows={3}
              required
              value={rootCauseFindings}
              onChange={e => setRootCauseFindings(e.target.value)}
              className="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 p-2.5 font-sans leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              8D Corrective & Preventive Action Plan (CAPA)
            </label>
            <textarea
              rows={4}
              required
              value={correctiveActionPlan}
              onChange={e => setCorrectiveActionPlan(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 p-2.5 leading-relaxed bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quality Manager Electronic Sign-Off & Verification Stamp
            </label>
            <input
              type="text"
              required
              value={qualitySignOff}
              onChange={e => setQualitySignOff(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 px-3 py-2 bg-indigo-50/30"
            />
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <div className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>This action immediately sets suspect lots to RECALLED status.</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-rose-600/20 flex items-center space-x-2 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isSubmitting ? 'Applying Hold...' : 'Execute Containment Hold'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
