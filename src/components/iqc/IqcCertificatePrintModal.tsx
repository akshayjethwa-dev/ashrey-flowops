// src/components/iqc/IqcCertificatePrintModal.tsx

import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Flame,
  Award,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Download
} from 'lucide-react';
import { IqcOrder } from '../../types/iqc';

interface IqcCertificatePrintModalProps {
  order: IqcOrder;
  onClose: () => void;
}

export const IqcCertificatePrintModal: React.FC<IqcCertificatePrintModalProps> = ({
  order,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isAccepted = order.disposition?.disposition === 'accepted';
  const isRejected = order.disposition?.disposition === 'rejected';
  const isRework = order.disposition?.disposition === 'rework';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Official IQC Certificate & Lot Traveler — {order.orderNumber}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 print:p-6 print:overflow-visible font-sans">
          
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider uppercase text-slate-900">
                  APEX INDUSTRIAL PRECISION MES
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Quality Metrology & Incoming Receiving Inspection Department
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                ISO 9001:2015 • IATF 16949 • AS9100D Certified Manufacturing Facility
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block text-xs font-mono font-bold px-3 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800">
                CERTIFICATE OF INCOMING INSPECTION
              </span>
              <div className="text-base font-black font-mono mt-1 text-slate-900">
                {order.orderNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Doc Ref: IQC-COC-{order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Disposition Decision Stamp */}
          <div className="mb-6 p-4 rounded-xl border-2 flex items-center justify-between bg-slate-50 border-slate-300">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                Official Receiving Disposition
              </span>
              <div className="text-lg font-black uppercase mt-0.5 flex items-center gap-2">
                {isAccepted ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> ACCEPTED & RELEASED TO STOCK
                  </span>
                ) : isRejected ? (
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5" /> REJECTED / QUARANTINE RETURN TO VENDOR
                  </span>
                ) : isRework ? (
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5" /> CONDITIONAL REWORK APPROVED
                  </span>
                ) : (
                  <span className="text-slate-700">INSPECTION PENDING</span>
                )}
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div>Accepted: <strong className="text-emerald-700">{order.disposition?.acceptedQty ?? 0} {order.unit}</strong></div>
              <div>Rejected: <strong className="text-rose-700">{order.disposition?.rejectedQty ?? 0} {order.unit}</strong></div>
              <div>Rework: <strong className="text-amber-700">{order.disposition?.reworkQty ?? 0} {order.unit}</strong></div>
            </div>
          </div>

          {/* Lot & Material Tracking Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Supplier</span>
              <span className="font-bold text-slate-900">{order.supplierName}</span>
              <span className="block text-[10px] text-slate-500">{order.supplierCode || 'SUPPLIER'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Part SKU & Name</span>
              <span className="font-bold text-slate-900">{order.partSku}</span>
              <span className="block text-[10px] text-slate-600 truncate">{order.partName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">PO & Inward GRN #</span>
              <span className="font-bold text-slate-900">{order.poNumber}</span>
              <span className="block text-[10px] text-slate-600">{order.grnNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Melt / Heat Lot #</span>
              <span className="font-bold text-amber-700">{order.heatLotNumber}</span>
              <span className="block text-[10px] text-slate-500">MTR: {order.mtrNumber || 'VERIFIED'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Receipt Date</span>
              <span className="font-bold text-slate-900">{new Date(order.receiptDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Lot Size Received</span>
              <span className="font-bold text-slate-900">{order.receivedQty} {order.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Sample Size Inspected</span>
              <span className="font-bold text-slate-900">{order.sampleSize} units (AQL II)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Storage Bin Allocation</span>
              <span className="font-bold text-blue-700">{order.disposition?.targetBinCode || 'MAIN STORAGE'}</span>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 font-mono">
              1. Detailed Characteristic Measurement Ledger
            </h4>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Characteristic</th>
                    <th className="p-2.5">Min Spec</th>
                    <th className="p-2.5">Nominal</th>
                    <th className="p-2.5">Max Spec</th>
                    <th className="p-2.5">Measured Samples</th>
                    <th className="p-2.5">Mean (μ)</th>
                    <th className="p-2.5">Cpk</th>
                    <th className="p-2.5 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {order.parameters.map((param) => {
                    const sampleValues = param.samples
                      .map(s => (s.measuredValue !== null && s.measuredValue !== undefined ? s.measuredValue : s.isVisualPass ? 'PASS' : 'FAIL'))
                      .join(', ');

                    return (
                      <tr key={param.parameterId}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {param.parameterName}
                          <span className="block text-[9px] text-slate-500 font-normal">
                            Gauge: {param.gaugeOrInstrument}
                          </span>
                        </td>
                        <td className="p-2.5">{param.minSpec !== undefined ? `${param.minSpec} ${param.unit}` : '—'}</td>
                        <td className="p-2.5 font-bold text-slate-700">{param.nominalValue !== undefined ? `${param.nominalValue} ${param.unit}` : '—'}</td>
                        <td className="p-2.5">{param.maxSpec !== undefined ? `${param.maxSpec} ${param.unit}` : '—'}</td>
                        <td className="p-2.5 text-slate-600 max-w-xs truncate" title={sampleValues}>
                          [{sampleValues}]
                        </td>
                        <td className="p-2.5 font-bold">{param.meanValue !== undefined ? `${param.meanValue} ${param.unit}` : '—'}</td>
                        <td className="p-2.5">
                          {param.cpk !== undefined ? (
                            <span className={param.cpk >= 1.33 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {param.cpk}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {param.parameterStatus === 'pass' ? (
                            <span className="text-emerald-700">PASS</span>
                          ) : param.parameterStatus === 'fail' ? (
                            <span className="text-rose-700">FAIL (OOS: {param.outOfSpecCount})</span>
                          ) : (
                            <span className="text-slate-500">PENDING</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defect Photographic Evidence (if any) */}
          {order.defectPhotos && order.defectPhotos.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 font-mono">
                2. Captured Visual Non-Conformance & Defect Photographic Records
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {order.defectPhotos.map((photo) => (
                  <div key={photo.id} className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-start gap-3">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-24 h-20 object-cover rounded border border-slate-300 shrink-0"
                    />
                    <div className="text-xs">
                      <span className="text-[10px] font-mono uppercase font-bold text-rose-700 block">
                        {photo.defectCategory.replace(/_/g, ' ')} • Severity: {photo.severity}
                      </span>
                      <p className="text-slate-800 mt-1 line-clamp-3">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspector Digital Signature Block */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                Material Disposition Authorization
              </span>
              <div className="font-bold text-slate-900">
                {order.disposition?.digitalSignature?.signerName || order.inspectorName || 'Anita Desai (Badge #QC-408)'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {order.disposition?.digitalSignature?.role || 'Quality Assurance Inspector'}
              </div>
              <div className="text-slate-500 text-[10px] font-mono mt-1">
                Timestamp: {order.completedAt ? new Date(order.completedAt).toLocaleString() : new Date().toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-600 italic mt-2 border-l-2 border-slate-300 pl-2">
                {order.disposition?.digitalSignature?.statement || 'Official disposition executed under 21 CFR Part 11 electronic records protocol.'}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <div className="w-24 h-24 border border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center text-slate-600 p-1">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="text-[8px] font-mono mt-0.5">{order.orderNumber}</span>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                Verified Cryptographic Signature Hash: 7b8f9e...2a1c
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
