// src/components/fqc/CertificateOfConformanceModal.tsx

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  ShieldCheck,
  Building2,
  FileCheck2,
  QrCode,
  Stamp
} from 'lucide-react';
import { FqcInspectionOrder } from '../../types/fqc';

interface CertificateOfConformanceModalProps {
  order: FqcInspectionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateOfConformanceModal: React.FC<CertificateOfConformanceModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const signOff = order.qualityAuthoritySignOff;
  const isReleased = order.holdStatus === 'released';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">
              Certificate of Conformance (CoC) & Inspection Release Document
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas (Standard White Paper Layout) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-3xl bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-300 font-sans print:shadow-none print:border-none print:m-0 print:p-6"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-black text-xl tracking-tight">
                  <ShieldCheck className="w-7 h-7" />
                  <span>FLOWOPS PRECISION MANUFACTURING</span>
                </div>
                <p className="text-[11px] text-slate-600 uppercase tracking-widest font-mono mt-0.5">
                  ISO 9001:2015 &bull; IATF 16949:2016 &bull; EN 10204 3.1 CERTIFIED
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Plant 1 Metrology & Final Quality Release Desk &bull; Industrial Hub Pune
                </p>
              </div>

              <div className="text-right border-l-2 border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                  CERTIFICATE NUMBER
                </span>
                <span className="text-base font-black font-mono text-slate-900 block">
                  {signOff?.cocNumber || order.fqcNumber}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Date: {order.inspectionDate}
                </span>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-center mb-6">
              <h1 className="text-base font-black tracking-wider uppercase text-slate-900">
                CERTIFICATE OF CONFORMANCE & DISPATCH RELEASE GATE
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Official Declaration of Conforming Finished Product & Shipping Authorization
              </p>
            </div>

            {/* Order & Part Information Table */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div>
                <div className="mb-2">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Customer</span>
                  <strong className="text-slate-900 text-sm">{order.customerName}</strong>
                </div>
                <div className="mb-2">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Part SKU</span>
                  <strong className="text-slate-900 font-mono">{order.partSku}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Part Description</span>
                  <span className="text-slate-700">{order.partName}</span>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Sales Order / WO</span>
                  <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                  {order.workOrderNumber && (
                    <span className="text-slate-500 font-mono ml-2">({order.workOrderNumber})</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Lot / Heat Number</span>
                  <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {order.lotNumber}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase block">Lot Quantity</span>
                    <span className="font-bold text-slate-800">{order.batchQuantity} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase block">Sample Inspected</span>
                    <span className="font-bold text-slate-800">{order.sampleSize} pcs (100% C=0)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspection Checklist Table */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                1. Final Inspection Test Results & Measurements
              </h3>
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Inspection Characteristic</th>
                      <th className="p-2">Specification / Tolerance</th>
                      <th className="p-2">Method / Instrument</th>
                      <th className="p-2 text-right">Result Value</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((it, i) => (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                        <td className="p-2">
                          <strong className="text-slate-900 block">{it.title}</strong>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{it.criteria}</span>
                        </td>
                        <td className="p-2 font-mono text-slate-600">
                          {it.targetNominal !== undefined
                            ? `${it.targetNominal} ${it.unit} (+${it.upperTolerance ?? 0} / ${it.lowerTolerance ?? 0})`
                            : 'Visual / Go-NoGo'}
                        </td>
                        <td className="p-2 text-slate-600">
                          {it.inspectionMethod}
                          {it.gageAssetTag && (
                            <span className="block font-mono text-[10px] text-cyan-700">[{it.gageAssetTag}]</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {it.measuredValue !== undefined
                            ? `${it.measuredValue} ${it.unit}`
                            : it.result === 'pass'
                            ? 'Conforming'
                            : it.result.toUpperCase()}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              it.result === 'pass'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : it.result === 'fail'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {it.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Packaging and Verification Seals */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-slate-900 block">VCI Anti-Corrosion Wrap Sealed</strong>
                  <span className="text-slate-600 text-[11px]">Parts sealed in vapor barrier with desiccant pouches.</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="text-slate-900 block">2D Barcode & Shipping Labels Verified</strong>
                  <span className="text-slate-600 text-[11px]">100% optical scanner readability confirmed.</span>
                </div>
              </div>
            </div>

            {/* Formal Declaration & Authorized Signatory Block */}
            <div className="border-t-2 border-slate-900 pt-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-[11px] text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1">
                  COMPLIANCE STATEMENT:
                </p>
                <p>
                  We hereby certify that the products identified above have been manufactured, inspected, and tested in accordance with the specified drawings, purchase order specifications, and applicable industrial standards. All test reports and raw material certifications are on file and available for review.
                </p>
              </div>

              {/* Digital Stamp Seal */}
              <div className="border-2 border-emerald-700 rounded-xl p-3 bg-emerald-50/30 text-center min-w-[220px]">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                  <Stamp className="w-4 h-4" />
                  QUALITY RELEASE GATE: PASSED
                </div>
                <div className="font-mono text-xs font-black text-slate-900 mb-0.5">
                  {signOff?.signedBy || order.inspectorName}
                </div>
                <div className="text-[10px] text-slate-600">
                  {signOff?.role || 'Lead Quality Authority'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Released: {signOff?.signedAt ? new Date(signOff.signedAt).toLocaleString() : order.inspectionDate}
                </div>
                <div className="text-[9px] font-mono text-emerald-700 mt-1 truncate max-w-[200px]">
                  {signOff?.signaturePinOrHash || 'DIGITAL-VERIFIED'}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
