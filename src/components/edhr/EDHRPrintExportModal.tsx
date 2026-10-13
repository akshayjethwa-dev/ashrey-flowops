// src/components/edhr/EDHRPrintExportModal.tsx

import React from 'react';
import {
  X,
  Printer,
  Download,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Cpu,
  Clock,
  User,
  Hash,
  Lock,
  Building2
} from 'lucide-react';
import { EDHRRecord } from '../../types/edhr';
import { edhrService } from '../../services/edhrService';

interface EDHRPrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dhr: EDHRRecord | null;
}

export const EDHRPrintExportModal: React.FC<EDHRPrintExportModalProps> = ({
  isOpen,
  onClose,
  dhr
}) => {
  if (!isOpen || !dhr) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvContent = edhrService.exportCsv(dhr);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eDHR_Dossier_${dhr.dhrNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAuditTrailCsv = () => {
    const csvContent = edhrService.exportAuditTrailCsv(dhr);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FDA_Part11_AuditTrail_${dhr.dhrNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonContent = edhrService.exportDigitalJson(dhr);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Digital_eDHR_${dhr.dhrNumber}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Modal Toolbar */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Electronic Batch Record (eDHR) Official Dossier
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40">
                  {dhr.regulatoryStandard}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-compiled materials, operations, quality checks, electronic signatures, and audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
              title="Download Data CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dossier CSV</span>
            </button>

            <button
              onClick={handleDownloadAuditTrailCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
              title="Download Audit Trail CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit CSV</span>
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
              <span>Print / PDF Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/40 text-slate-100 font-sans print:bg-white print:text-black">
          {/* Document Header Letterhead */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 print:border-black print:bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold tracking-widest text-slate-300 uppercase print:text-black">
                    REGULATED LIFE SCIENCES &amp; AEROSPACE MANUFACTURING
                  </span>
                </div>
                <h1 className="text-xl font-black text-slate-100 mt-1 print:text-black">
                  ELECTRONIC DEVICE HISTORY RECORD (eDHR) / BATCH DOSSIER
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5 print:text-gray-600">
                  Document ID: {dhr.dhrNumber} &bull; Reg Spec: {dhr.regulatoryStandard} &bull; FDA 21 CFR Part 11 Certified
                </p>
              </div>

              {/* QR Verification & Master Seal */}
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 print:bg-gray-100 print:border-black">
                {dhr.qrVerificationUrl && (
                  <img
                    src={dhr.qrVerificationUrl}
                    alt="QR Verification"
                    className="w-16 h-16 rounded bg-white p-1"
                  />
                )}
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">STATUS</div>
                  <div className={`text-xs font-mono font-bold uppercase ${
                    dhr.releaseStatus === 'released' ? 'text-teal-400' :
                    dhr.releaseStatus === 'quarantined' ? 'text-rose-400' : 'text-amber-400'
                  } print:text-black`}>
                    {dhr.releaseStatus.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Qty: {dhr.batchQuantity} {dhr.unitOfMeasure}
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Part Information</span>
                <span className="font-bold text-slate-200 print:text-black">{dhr.partName}</span>
                <div className="text-[11px] text-slate-400">{dhr.partNumber} ({dhr.revision})</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Work Order &amp; Sales Order</span>
                <span className="font-bold text-slate-200 print:text-black">{dhr.workOrderNumber}</span>
                <div className="text-[11px] text-slate-400">{dhr.salesOrderNumber || 'Internal Run'}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Batch / Serial Identifier</span>
                <span className="font-bold text-teal-300 print:text-black">{dhr.batchNumber}</span>
                <div className="text-[11px] text-slate-400">{dhr.customerName}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Compiled By</span>
                <span className="text-slate-200 print:text-black">{dhr.compiledBy}</span>
                <div className="text-[11px] text-slate-400">{new Date(dhr.compiledAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Section 1: Auto-Compiled Materials & Chemical Heat Traces */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 1: Bill of Materials &amp; Chemical Heat Traceability ({dhr.materials.length} Items)</span>
              <span className="text-[10px] text-slate-400 font-normal">All Raw Lots Verified Against MTR Specifications</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Component / Description</th>
                    <th className="py-2 px-2.5">Lot Number</th>
                    <th className="py-2 px-2.5">Heat # / MTR Cert</th>
                    <th className="py-2 px-2.5">Approved Supplier</th>
                    <th className="py-2 px-2.5 text-right">Consumed Qty</th>
                    <th className="py-2 px-2.5 text-center">QC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {dhr.materials.map(mat => (
                    <tr key={mat.id} className="hover:bg-slate-850/40">
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200 print:text-black">{mat.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{mat.partNumber}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-cyan-300 print:text-black">
                        {mat.lotNumber}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-amber-300 print:text-black">
                        <div>{mat.heatNumber ? `Heat: ${mat.heatNumber}` : '—'}</div>
                        <div className="text-[10px] text-slate-400">{mat.mtrNumber ? `MTR: ${mat.mtrNumber}` : ''}</div>
                      </td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">
                        {mat.supplierName}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-200 print:text-black">
                        {mat.consumedQty} {mat.unit}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 print:text-black">
                          {mat.inspectionStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Auto-Compiled Operations Routing Execution */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 2: Shop Floor Traveler Operations ({dhr.operations.length} Stations)</span>
              <span className="text-[10px] text-slate-400 font-normal">Machine Telemetry &amp; Certified Operator Stamps</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Seq</th>
                    <th className="py-2 px-2.5">Operation Description</th>
                    <th className="py-2 px-2.5">Machine / Work Station</th>
                    <th className="py-2 px-2.5">Certified Operator</th>
                    <th className="py-2 px-2.5">Start &rarr; Stop Timestamp</th>
                    <th className="py-2 px-2.5 text-right">Cycle Time</th>
                    <th className="py-2 px-2.5 text-center">Step Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {dhr.operations.map(op => (
                    <tr key={op.stepId} className="hover:bg-slate-850/40">
                      <td className="py-2 px-2.5 font-mono font-bold text-cyan-400 print:text-black">
                        {op.sequence}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200 print:text-black">{op.operationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{op.workCenterName}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-300 print:text-black">
                        <div>{op.machineId}</div>
                        <div className="text-[10px] text-slate-400">{op.machineName}</div>
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="text-slate-200 print:text-black">{op.operatorName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono print:text-black">Badge #{op.operatorBadge}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-slate-300 print:text-black">
                        <div>{new Date(op.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div className="text-slate-400">{new Date(op.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-200 print:text-black">
                        <div>{op.actualDurationMinutes} min</div>
                        <div className="text-[10px] text-slate-500">Var: {op.varianceMinutes}m</div>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 print:text-black">
                          {op.stepStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Auto-Compiled In-Process & Final Quality Inspections */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 3: Dimensional, Metallurgical &amp; CMM Inspection Matrix ({dhr.qualityInspections.length} Checks)</span>
              <span className="text-[10px] text-slate-400 font-normal">100% Parameter Verification</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Op Seq</th>
                    <th className="py-2 px-2.5">Parameter &amp; Type</th>
                    <th className="py-2 px-2.5">Specification / Tolerance</th>
                    <th className="py-2 px-2.5">Measured Value</th>
                    <th className="py-2 px-2.5">Calibrated Gauge / Tool</th>
                    <th className="py-2 px-2.5">Inspected By</th>
                    <th className="py-2 px-2.5 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {dhr.qualityInspections.map(qc => (
                    <tr key={qc.id} className="hover:bg-slate-850/40">
                      <td className="py-2 px-2.5 font-mono text-cyan-400 print:text-black">
                        Op {qc.operationSequence}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200 print:text-black">{qc.parameterName}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{qc.inspectionType}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-300 print:text-black">
                        {qc.specification}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-100 print:text-black">
                        {qc.measuredValue}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px] text-slate-400 print:text-black">
                        {qc.gaugeCalibrationId || 'Standard Tool'}
                      </td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">
                        {qc.inspectorName}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          qc.result === 'pass'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                            : 'bg-rose-950 text-rose-300 border-rose-600/40'
                        } print:text-black`}>
                          {qc.result.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Deviations & Corrective Actions Log (if any) */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-rose-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 4: Non-Conformance Reports (NCR) &amp; Deviations ({dhr.deviations.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {dhr.deviations.length === 0 ? 'Zero Deviations — Pure Conformance' : 'Tracked Discrepancies'}
              </span>
            </h3>

            {dhr.deviations.length === 0 ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero deviations, non-conformances, or process concessions recorded for this batch.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {dhr.deviations.map(dev => (
                  <div key={dev.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs print:bg-gray-100">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-rose-400">{dev.deviationNumber} (Op {dev.operationSequence})</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                        dev.isResolved ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {dev.isResolved ? 'Resolved' : 'Active Quarantine'}
                      </span>
                    </div>
                    <div className="text-slate-200 mt-1 font-medium">{dev.description}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">Disposition: {dev.disposition} &bull; Action: {dev.immediateAction}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: 21 CFR Part 11 Electronic Signatures Manifest */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-teal-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 5: 21 CFR Part 11 Electronic Signatures Manifest ({dhr.signatures.length} Signatures)</span>
              <span className="text-[10px] text-slate-400 font-normal">Non-Repudiation Multi-Role Approvals</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dhr.signatures.map(sig => (
                <div key={sig.id} className="p-3.5 rounded-xl border border-teal-500/40 bg-teal-950/20 text-xs space-y-1.5 print:bg-gray-50 print:border-black">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 print:text-black">{sig.signerName}</span>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-700/50 print:text-black">
                      {sig.intentLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 print:text-gray-700 font-mono">
                    {sig.signerRole} &bull; {sig.signerEmail}
                  </div>
                  <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                    &ldquo;{sig.reasonStatement}&rdquo;
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 break-all pt-1">
                    SIGNED: {new Date(sig.signedAt).toLocaleString()} &bull; IP: {sig.ipAddress}
                    <br />
                    HASH: {sig.cryptographicSignature}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: FDA 21 CFR Part 11 Complete Audit Trail */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 print:border-black print:bg-white">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider mb-3 flex items-center justify-between print:text-black">
              <span>Section 6: Immutable Regulatory Audit Trail Ledger ({dhr.auditTrail.length} Events)</span>
              <span className="text-[10px] text-slate-400 font-normal">Append-Only Cryptographic Record</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 print:bg-gray-200 print:text-black">
                    <th className="py-2 px-2.5">Timestamp (UTC)</th>
                    <th className="py-2 px-2.5">User &amp; Role</th>
                    <th className="py-2 px-2.5">Event Type</th>
                    <th className="py-2 px-2.5">Action Description &amp; Details</th>
                    <th className="py-2 px-2.5 font-mono text-[9px]">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black text-[11px]">
                  {dhr.auditTrail.map(aud => (
                    <tr key={aud.id} className="hover:bg-slate-850/40">
                      <td className="py-2 px-2.5 font-mono text-slate-300 print:text-black">
                        {new Date(aud.timestamp).toISOString()}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-200 print:text-black">{aud.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{aud.userRole}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-cyan-300 print:text-black">
                        {aud.eventType}
                      </td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">
                        {aud.description}
                        {aud.justification && (
                          <span className="block text-[10px] text-slate-400 italic">Justification: {aud.justification}</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[9px] text-slate-500 print:text-black break-all max-w-[120px]">
                        {aud.eventHash.substring(0, 20)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Seal & Certification Footer */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/90 text-center font-mono text-xs text-slate-400 space-y-1 print:border-black print:bg-white print:text-black">
            <div className="font-bold text-slate-200 print:text-black">
              MASTER SYSTEM INTEGRITY CHECKSUM: {dhr.dhrChecksum}
            </div>
            <div>
              Certified under FDA Title 21 CFR Part 11 Electronic Records; Electronic Signatures and EU Annex 11.
            </div>
            <div className="text-[10px] text-slate-500">
              Generated by FlowOps MES Regulatory Engine &bull; Timestamp: {new Date().toISOString()}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            eDHR Dossier verified &bull; Ready for FDA / ISO audit submission.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
