// src/components/edhr/AutoCompileEDHRModal.tsx

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AutoCompileEDHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompile: (params: {
    workOrderNumber: string;
    batchNumber?: string;
    compiledBy: string;
    regulatoryStandard: 'FDA_21CFR_PART_820' | 'ISO_13485' | 'AS9100D' | 'IATF_16949';
  }) => Promise<void>;
}

export const AutoCompileEDHRModal: React.FC<AutoCompileEDHRModalProps> = ({
  isOpen,
  onClose,
  onCompile
}) => {
  if (!isOpen) return null;

  const [workOrderNumber, setWorkOrderNumber] = useState('WO-2026-001');
  const [batchNumber, setBatchNumber] = useState(`SN-2026-ENG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [compiledBy, setCompiledBy] = useState('Anand Deshmukh (Lead Quality Manager)');
  const [regulatoryStandard, setRegulatoryStandard] = useState<'FDA_21CFR_PART_820' | 'ISO_13485' | 'AS9100D' | 'IATF_16949'>('AS9100D');
  const [compiling, setCompiling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    try {
      await onCompile({
        workOrderNumber,
        batchNumber,
        compiledBy,
        regulatoryStandard
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Auto-Compile Electronic Batch Record</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically assemble materials, machine telemetry, operations, and QC data.
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Compilation Pipeline Preview Card */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
              Auto-Compilation Pipeline (Zero Paper MES Integration)
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Materials
                </div>
                <div className="text-slate-400 mt-0.5">Pulls heat #, MTR certs &amp; vendor lots</div>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="font-bold text-indigo-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Operations
                </div>
                <div className="text-slate-400 mt-0.5">Captures machine IDs &amp; operator stamps</div>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Quality &amp; QC
                </div>
                <div className="text-slate-400 mt-0.5">Extracts CMM tolerances &amp; tests</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Source Work Order</label>
            <select
              value={workOrderNumber}
              onChange={e => setWorkOrderNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="WO-2026-001">WO-2026-001 (Forged Crankshaft — 4-Cylinder Turbo)</option>
              <option value="WO-2026-002">WO-2026-002 (Transmission Helical Gear 42T)</option>
              <option value="WO-2026-003">WO-2026-003 (Overhead Camshaft — HCV)</option>
              <option value="WO-2026-004">WO-2026-004 (Titanium Aerospace Flange)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Batch / Serial Unit Identifier</label>
            <input
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Regulatory Standard</label>
              <select
                value={regulatoryStandard}
                onChange={e => setRegulatoryStandard(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="AS9100D">AS9100 Rev D (Aerospace)</option>
                <option value="FDA_21CFR_PART_820">FDA 21 CFR Part 820 (Medical Device)</option>
                <option value="ISO_13485">ISO 13485:2016 (MedTech QMS)</option>
                <option value="IATF_16949">IATF 16949:2016 (Automotive)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Compiling Quality Engineer</label>
              <input
                type="text"
                value={compiledBy}
                onChange={e => setCompiledBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={compiling}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{compiling ? 'Compiling Dossier...' : 'Synthesize & Generate eDHR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
