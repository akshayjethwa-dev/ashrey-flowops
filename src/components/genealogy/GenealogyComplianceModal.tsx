// src/components/genealogy/GenealogyComplianceModal.tsx

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Award,
  Hash,
  QrCode,
  Building2,
  Calendar,
  Layers,
  Cpu,
  User,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { ProductionGenealogyRecord } from '../../types/genealogy';
import { productionGenealogyService } from '../../services/productionGenealogyService';

interface GenealogyComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProductionGenealogyRecord | null;
  onSignedOff?: (updated: ProductionGenealogyRecord) => void;
}

export const GenealogyComplianceModal: React.FC<GenealogyComplianceModalProps> = ({
  isOpen,
  onClose,
  record,
  onSignedOff
}) => {
  const [inspectorName, setInspectorName] = useState('Anand Deshmukh (Lead Met. Inspector)');
  const [isSigning, setIsSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvContent = productionGenealogyService.exportCsv([record]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Genealogy_Traveler_${record.identifier}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonContent = productionGenealogyService.exportDigitalThreadJson(record);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Digital_Thread_${record.identifier}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOff = async () => {
    if (!inspectorName.trim()) return;
    setIsSigning(true);
    try {
      const updated = await productionGenealogyService.signOffCompliance(record.id, inspectorName);
      setSignSuccess(true);
      if (onSignedOff) onSignedOff(updated);
      setTimeout(() => setSignSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* ── Modal Header & Action Bar ────────────────────────────── */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Compliance Traveler &amp; Certificate of Conformance
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40">
                  AS9100 / IATF 16949 / ISO 9001
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Unit/Batch digital thread certificate, chemical MTR trace, and operator sign-offs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
              title="Download CSV Traveler"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
              title="Download JSON Digital Thread"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON Thread</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Certificate Preview Body (Print Formatted) ────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/40 text-slate-100 font-sans print:bg-white print:text-black">
          {/* Company Letterhead & Document Meta */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 shadow-sm print:border-black print:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-sm font-bold tracking-wider text-slate-200 uppercase print:text-black">
                    PRECISION AEROSPACE &amp; AUTOMOTIVE MANUFACTURING
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-100 mt-1 print:text-black">
                  DIGITAL PRODUCTION TRAVELER &amp; CERTIFICATE OF CONFORMANCE
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5 print:text-gray-600">
                  Document ID: COC-GEN-{record.identifier} &bull; Spec Standard: ISO 9001:2015 / IATF 16949 / FDA 21 CFR Part 11
                </p>
              </div>

              {/* QR Code and Identifier Box */}
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 print:bg-gray-100 print:border-black">
                {record.qrCodeUrl && (
                  <img
                    src={record.qrCodeUrl}
                    alt="QR Verification"
                    className="w-16 h-16 rounded bg-white p-1"
                  />
                )}
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">TRACKING ID</div>
                  <div className="text-xs font-mono font-bold text-teal-300 print:text-black">
                    {record.identifier}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {record.trackingLevel === 'unit' ? 'Serial Unit' : `Batch Size: ${record.batchQuantity} ${record.unitOfMeasure}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Order & Part Information Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Part Description</span>
                <span className="font-semibold text-slate-200 print:text-black">{record.partName}</span>
                <div className="text-[11px] font-mono text-slate-400">{record.partNumber} ({record.revision})</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Work Order &amp; Sales Order</span>
                <span className="font-mono font-semibold text-slate-200 print:text-black">{record.workOrderNumber}</span>
                <div className="text-[11px] font-mono text-slate-400">{record.salesOrderNumber || 'Internal Run'}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Customer &amp; PO</span>
                <span className="font-semibold text-slate-200 print:text-black">{record.customerName}</span>
                <div className="text-[11px] font-mono text-slate-400">{record.customerPoNumber || 'Standard PO'}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Drawing &amp; Revision</span>
                <span className="font-mono font-semibold text-slate-200 print:text-black">{record.drawingNumber}</span>
                <div className="text-[11px] font-mono text-slate-400">Approved for Production</div>
              </div>
            </div>
          </div>

          {/* Upstream Raw Material & Heat Verification */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2 print:text-black">
              <span>Section 1: Raw Material Metallurgy &amp; Chemical Heat Traceability</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="text-[10px] text-slate-400 block">Mill Cast / Heat #</span>
                <span className="text-amber-300 font-bold print:text-black">{record.rawMaterialSummary.heatNumber}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="text-[10px] text-slate-400 block">Material Grade</span>
                <span className="text-slate-200 font-bold print:text-black">{record.rawMaterialSummary.materialGrade}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="text-[10px] text-slate-400 block">Mill Test Report (MTR) #</span>
                <span className="text-cyan-300 font-bold print:text-black">{record.rawMaterialSummary.mtrNumber}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 print:bg-gray-50 print:border-black">
                <span className="text-[10px] text-slate-400 block">Approved Mill Supplier</span>
                <span className="text-slate-200 font-bold print:text-black">{record.rawMaterialSummary.supplierName}</span>
              </div>
            </div>
          </div>

          {/* Operations Shop Floor Execution Matrix */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider mb-3 flex items-center gap-2 print:text-black">
              <span>Section 2: Operation-by-Operation Audit Trail (Machine + Operator + Timestamps)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Seq</th>
                    <th className="py-2 px-2.5">Operation Description</th>
                    <th className="py-2 px-2.5">Machine ID &amp; Station</th>
                    <th className="py-2 px-2.5">Certified Operator</th>
                    <th className="py-2 px-2.5">Timestamp (In &rarr; Out)</th>
                    <th className="py-2 px-2.5 text-right">Cycle Time</th>
                    <th className="py-2 px-2.5 text-center">QC Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {record.operations.map(op => (
                    <tr key={op.stepId} className="hover:bg-slate-850/40">
                      <td className="py-2 px-2.5 font-mono font-bold text-cyan-400 print:text-black">
                        {op.sequence}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200 print:text-black">{op.operationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{op.workCenterName}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono">
                        <div className="text-slate-200 print:text-black">{op.machineCode}</div>
                        <div className="text-[10px] text-slate-400">{op.machineName}</div>
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="text-slate-200 print:text-black">{op.operatorName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono print:text-black">Badge #{op.operatorBadge}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-slate-300 print:text-black">
                        <div>{op.startedAt ? new Date(op.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}</div>
                        <div className="text-slate-400">{op.completedAt ? new Date(op.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In-Progress'}</div>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-200 print:text-black">
                        {op.durationMinutes ? `${op.durationMinutes} min` : 'Running'}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 print:text-black print:border-black">
                          {op.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Final Inspection & Digital Sign-off */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider mb-3 print:text-black">
              Section 3: Quality Conformance Sign-Off &amp; Non-Repudiation Seal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              <div>
                <p className="text-xs text-slate-300 print:text-black leading-relaxed">
                  We hereby certify that the above referenced item has been manufactured, inspected, and tested in accordance with all applicable drawings, engineering specifications, and customer purchase order requirements. Chemical and physical test reports are on permanent file.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="Enter Inspector Name & Title"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                  <button
                    onClick={handleSignOff}
                    disabled={isSigning}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition cursor-pointer"
                  >
                    {isSigning ? 'Signing...' : 'Sign Certificate'}
                  </button>
                </div>
                {signSuccess && (
                  <p className="text-xs text-teal-400 mt-1 font-mono">
                    ✓ Certificate signed and recorded with cryptographical hash!
                  </p>
                )}
              </div>

              {/* Official Seal / Signature Box */}
              <div className="p-4 rounded-xl border border-teal-500/40 bg-teal-950/20 text-center relative overflow-hidden print:border-black print:bg-gray-100">
                <div className="text-[11px] font-mono uppercase tracking-widest text-teal-400 font-bold print:text-black">
                  APPROVED QUALITY ASSURANCE SEAL
                </div>
                <div className="text-sm font-bold text-slate-100 mt-2 font-serif italic print:text-black">
                  {record.finalQcInspector || inspectorName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Signed: {record.finalQcDate ? new Date(record.finalQcDate).toLocaleString() : 'Pending Official Stamp'}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] font-mono text-slate-500 break-all">
                  SHA-256 HASH: {record.complianceHash}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Compliant with FDA 21 CFR Part 11 electronic records and ISO 9001:2015 auditability.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
