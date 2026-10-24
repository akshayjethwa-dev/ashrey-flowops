// src/components/defect-pareto/DefectDetailModal.tsx

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Crosshair,
  Factory,
  User,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { DefectRecord } from '../../types/defectPareto';
import { defectParetoService, DEFECT_CLASSIFICATION_INFO } from '../../services/defectParetoService';

interface DefectDetailModalProps {
  defect: DefectRecord | null;
  onClose: () => void;
  onNcrCreated?: (ncrNumber: string) => void;
  onNavigateToNcr?: (ncrNumber: string) => void;
}

export const DefectDetailModal: React.FC<DefectDetailModalProps> = ({
  defect,
  onClose,
  onNcrCreated,
  onNavigateToNcr
}) => {
  const [isCreatingNcr, setIsCreatingNcr] = useState<boolean>(false);
  const [ncrFeedback, setNcrFeedback] = useState<string | null>(null);

  if (!defect) return null;

  const classInfo = DEFECT_CLASSIFICATION_INFO[defect.defectClassification] || {
    label: defect.defectClassification,
    color: '#ef4444'
  };

  const totalCost = defect.scrapCost + defect.reworkCost;

  const handleCreateAutoNcr = () => {
    setIsCreatingNcr(true);
    try {
      const res = defectParetoService.createNcrFromDefect(defect.id, 'QA Manager');
      if (res.success && res.ncrNumber) {
        setNcrFeedback(`Auto-NCR ${res.ncrNumber} created and linked successfully!`);
        if (onNcrCreated) onNcrCreated(res.ncrNumber);
      } else {
        setNcrFeedback(res.message);
      }
    } catch (e: any) {
      setNcrFeedback(`Error: ${e.message}`);
    } finally {
      setIsCreatingNcr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                {defect.defectNumber}
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                defect.severity === 'critical'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : defect.severity === 'major'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {defect.severity}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Batch: {defect.batchNumber}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{defect.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Part: <strong className="text-slate-200">{defect.partName}</strong> ({defect.partSku})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Feedback Banner if NCR created */}
          {ncrFeedback && (
            <div className="bg-emerald-950/80 border border-emerald-700/80 rounded-xl p-3 flex items-center gap-3 text-emerald-200 text-xs">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{ncrFeedback}</span>
            </div>
          )}

          {/* Spatial Anatomical Coordinates Callout */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Crosshair size={14} />
              <span>Part Spatial Localization & Anatomical Zone</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Anatomical Zone:</span>
                <span className="font-bold text-white">{defect.spatialLocation.zoneName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Coordinates (X, Y):</span>
                <span className="font-bold text-amber-300">X: {defect.spatialLocation.x}% · Y: {defect.spatialLocation.y}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">3D Depth (Z):</span>
                <span className="font-bold text-sky-300">Z: {defect.spatialLocation.z || 0}mm</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Detection Stage:</span>
                <span className="font-bold text-slate-200">{defect.detectionStage}</span>
              </div>
            </div>
          </div>

          {/* Attribution: Machine, Operator, Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Factory size={13} className="text-indigo-400" />
                <span>Manufacturing Machine</span>
              </div>
              <div className="text-sm font-bold text-white">{defect.machineName}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{defect.machineId}</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <User size={13} className="text-cyan-400" />
                <span>Operator Logged</span>
              </div>
              <div className="text-sm font-bold text-white">{defect.operatorName}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{defect.operatorId}</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock size={13} className="text-amber-400" />
                <span>Work Shift</span>
              </div>
              <div className="text-sm font-bold text-white">{defect.shiftLabel}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {new Date(defect.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Tolerance & Metrology Variance */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Metrology Spec vs Actual Variance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Drawing Tolerance Spec:</span>
                <span className="font-semibold text-slate-200">{defect.toleranceSpec || 'Not specified'}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Measured CMM/Gage Value:</span>
                <span className="font-bold text-rose-400">{defect.measuredValue || 'Visual flaw'}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Calculated Variance:</span>
                <span className="font-bold text-amber-300">{defect.variance || 'Non-conforming'}</span>
              </div>
            </div>
          </div>

          {/* Financial Impact & Defective Units */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Total Financial Impact (COPQ):</span>
              <div className="text-xl font-bold font-mono text-amber-300 flex items-center gap-1 mt-0.5">
                <DollarSign size={18} />
                <span>${totalCost.toLocaleString()}</span>
                <span className="text-xs font-normal text-slate-400 ml-2 font-sans">
                  (${defect.scrapCost} scrap + ${defect.reworkCost} rework)
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Defective Units Impacted:</span>
              <span className="text-lg font-bold font-mono text-cyan-300">
                {defect.defectiveUnitsCount} parts
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Root-Cause Observation Notes
            </h4>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              {defect.notes}
            </p>
          </div>

          {/* Linked Quality Documents (NCR / CAPA) */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Traceability & Corrective Action Links
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              {defect.linkedNcrNumber ? (
                <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                  <ShieldAlert size={14} className="text-rose-400" />
                  <span className="text-rose-200">Linked to NCR:</span>
                  <span className="font-mono font-bold text-white">{defect.linkedNcrNumber}</span>
                  {onNavigateToNcr && (
                    <button
                      onClick={() => onNavigateToNcr(defect.linkedNcrNumber!)}
                      className="ml-2 text-rose-300 hover:text-white underline font-semibold flex items-center gap-1"
                    >
                      Open NCR <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCreateAutoNcr}
                  disabled={isCreatingNcr}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldAlert size={14} />
                  <span>{isCreatingNcr ? 'Creating Auto-NCR...' : 'Generate Auto-NCR & MRB Containment'}</span>
                </button>
              )}

              {defect.linkedCapaNumber && (
                <div className="bg-sky-950/60 border border-sky-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                  <Sparkles size={14} className="text-sky-400" />
                  <span className="text-sky-200">Linked CAPA:</span>
                  <span className="font-mono font-bold text-white">{defect.linkedCapaNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/95">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
