// src/components/quality-holds/PrintHoldTagModal.tsx

import React, { useRef } from 'react';
import {
  X,
  Printer,
  AlertOctagon,
  QrCode,
  ShieldAlert,
  Building2,
  Calendar,
  User,
  MapPin,
  Stamp
} from 'lucide-react';
import { QualityHoldRecord } from '../../types/qualityHold';

interface PrintHoldTagModalProps {
  isOpen: boolean;
  hold: QualityHoldRecord | null;
  onClose: () => void;
}

export const PrintHoldTagModal: React.FC<PrintHoldTagModalProps> = ({
  isOpen,
  hold,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !hold) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-100">
              Print Physical Shopfloor Quarantine Tag
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase font-extrabold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Placard</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Placard Container */}
        <div className="p-6 bg-slate-950 flex justify-center overflow-x-auto">
          <div
            ref={printRef}
            className="w-full max-w-lg bg-white text-slate-900 p-6 rounded-lg border-4 border-rose-600 shadow-xl space-y-4 print:m-0 print:border-4"
          >
            {/* Top Red Header Warning */}
            <div className="bg-rose-600 text-white text-center py-2.5 px-4 rounded font-black tracking-widest uppercase flex items-center justify-center gap-2">
              <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
              <span className="text-xl">QUALITY HOLD / QUARANTINE</span>
              <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              DO NOT MOVE · DO NOT PROCESS · DISPATCH HARD-BLOCKED
            </div>

            {/* Target ID and Hold ID */}
            <div className="border-2 border-slate-900 p-3 rounded grid grid-cols-2 gap-3 text-center bg-slate-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">HOLD TICKET #</span>
                <span className="text-xl font-mono font-black text-rose-600">{hold.id}</span>
              </div>
              <div className="border-l-2 border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">TARGET WO / BATCH</span>
                <span className="text-lg font-mono font-black text-slate-900">{hold.targetNumber}</span>
              </div>
            </div>

            {/* Part Description & Specs */}
            <div className="space-y-2 text-xs border border-slate-300 p-3 rounded">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-600">Part Name:</span>
                <span className="font-extrabold text-slate-900">{hold.partName}</span>
              </div>
              {hold.partCode && (
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-600">Part SKU:</span>
                  <span className="font-mono font-bold text-slate-800">{hold.partCode}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-600">Customer:</span>
                <span className="font-bold text-slate-800">{hold.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-600">Quarantined Quantity:</span>
                <span className="font-mono font-black text-rose-700 text-sm">{hold.quantity} {hold.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">Containment Bay:</span>
                <span className="font-mono font-extrabold text-slate-900">{hold.location}</span>
              </div>
            </div>

            {/* Non-Conformance Reason */}
            <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded space-y-1">
              <div className="text-[10px] font-black uppercase text-rose-800 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>NON-CONFORMANCE DEFECT REASON:</span>
              </div>
              <p className="text-xs font-bold text-rose-950 leading-snug">
                {hold.holdReason}
              </p>
              <div className="text-[10px] text-slate-600 font-mono pt-1">
                Category: {hold.holdReasonCategory.replace(/_/g, ' ').toUpperCase()} · Severity: {hold.severity.toUpperCase()}
              </div>
            </div>

            {/* Footer with Inspector Signature & Stamp */}
            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">TAGGED BY INSPECTOR</span>
                <span className="font-bold text-slate-900 block">{hold.placedBy}</span>
                <span className="text-[9px] text-slate-600 font-mono block">{new Date(hold.placedAt).toLocaleString()}</span>
              </div>
              <div className="border border-slate-300 p-2.5 rounded flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="border-2 border-dashed border-rose-600 text-rose-600 font-black px-3 py-1 rounded text-[10px] tracking-wider uppercase rotate-[-3deg]">
                    QUARANTINE ENFORCED
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 block mt-1">IATF 16949 / ISO 9001:2015</span>
                </div>
              </div>
            </div>

            {/* Bottom Caution */}
            <div className="text-center text-[9px] text-slate-500 font-mono">
              Removal of this tag without Quality Manager signature is a strict non-conformance violation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
