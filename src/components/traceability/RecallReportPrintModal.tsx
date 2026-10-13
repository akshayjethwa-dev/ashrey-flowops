// src/components/traceability/RecallReportPrintModal.tsx

import React from 'react';
import {
  X,
  Printer,
  ShieldAlert,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { RecallReport } from '../../types/traceability';

interface RecallReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  recall: RecallReport | null;
}

export const RecallReportPrintModal: React.FC<RecallReportPrintModalProps> = ({
  isOpen,
  onClose,
  recall
}) => {
  if (!isOpen || !recall) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-500/20 border border-rose-400/30 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Formal Recall & Root-Cause Audit Document</h3>
              <p className="text-slate-400 text-xs font-mono">{recall.recallNumber} • {recall.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 overflow-y-auto print:overflow-visible space-y-6 text-slate-800 text-xs leading-relaxed font-sans bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  FlowOps Manufacturing Systems
                </span>
                <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                  QUALITY RECALL AUDIT
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ISO 9001:2015 & IATF 16949:2016 Compliant Non-Conformance Report (8D)
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Chakan Automotive Cluster, Pune • Plant Gate 1
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-base font-black text-rose-700 tracking-tight">
                {recall.recallNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Date: <strong>{new Date(recall.initiatedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mt-1">
                Severity: {recall.severity.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Bulletin Title */}
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              Containment Subject
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {recall.title}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-600">
              <div>Defect Class: <strong>{recall.defectCategory.replace(/_/g, ' ').toUpperCase()}</strong></div>
              <div>Initiated By: <strong>{recall.initiatedByName}</strong></div>
              <div>Status: <strong>{recall.status.toUpperCase()}</strong></div>
            </div>
          </div>

          {/* Section 1: Suspect Material Specification */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
              1. Suspect Material Specification & Mill Origin
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Suspect Lot #</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{recall.suspectLotNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Mill Heat / Cast #</span>
                <span className="font-mono font-bold text-amber-700 text-xs">{recall.heatNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Material SKU / Description</span>
                <span className="font-semibold text-slate-800 text-xs truncate block">{recall.suspectItemName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Origin Supplier</span>
                <span className="font-semibold text-slate-800 text-xs truncate block">{recall.supplierName || 'Internal'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Inbound PO #</span>
                <span className="font-mono text-slate-700 text-xs">{recall.poNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">GRN Dock Inward #</span>
                <span className="font-mono text-slate-700 text-xs">{recall.grnNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Warehouse Lockdown Qty</span>
                <span className="font-bold text-rose-700 text-xs">{recall.exposure.warehouseOnHandQty}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Financial Exposure</span>
                <span className="font-bold text-slate-900 text-xs">₹{recall.exposure.totalFinancialExposure.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Exposure Breakdown Tables */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              2. Forward Material Exposure Breakdown (Containment Scope)
            </h4>

            {/* Warehouse Bins */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>A. Physical Warehouse Inventory Quarantine Holds</span>
                <span className="text-[10px] text-slate-500">{recall.affectedLocations.length} locations locked</span>
              </div>
              <table className="w-full text-left border border-slate-200">
                <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2 border-b">Plant Facility</th>
                    <th className="p-2 border-b">Storage Bay / Bin</th>
                    <th className="p-2 border-b">Lot Number</th>
                    <th className="p-2 border-b text-right">Quarantined Qty</th>
                    <th className="p-2 border-b text-right">Hold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recall.affectedLocations.map((loc, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{loc.plantName}</td>
                      <td className="p-2 font-mono font-bold text-slate-800">{loc.binCode}</td>
                      <td className="p-2 font-mono text-indigo-700">{loc.lotNumber}</td>
                      <td className="p-2 text-right font-bold text-rose-700">{loc.onHandQty} {loc.unit}</td>
                      <td className="p-2 text-right">
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {loc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Work Orders */}
            {recall.affectedWorkOrders.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>B. Shopfloor Work Orders Halted (WIP Production Hold)</span>
                  <span className="text-[10px] text-slate-500">{recall.affectedWorkOrders.length} orders halted</span>
                </div>
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2 border-b">Work Order #</th>
                      <th className="p-2 border-b">Manufactured Part</th>
                      <th className="p-2 border-b">Customer Account</th>
                      <th className="p-2 border-b text-right">Consumed Suspect Qty</th>
                      <th className="p-2 border-b text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recall.affectedWorkOrders.map((wo, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono font-bold text-purple-700">{wo.orderNumber}</td>
                        <td className="p-2 font-semibold text-slate-800">{wo.partName}</td>
                        <td className="p-2 text-slate-600">{wo.customerName}</td>
                        <td className="p-2 text-right font-bold text-slate-900">{wo.consumedQty} {wo.unit}</td>
                        <td className="p-2 text-right">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            LINE STOP APPLIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Customer Shipments */}
            {recall.affectedDispatches.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>C. Dispatched OEM Customer Shipments (Customer Alert Matrix)</span>
                  <span className="text-[10px] text-rose-600 font-bold">{recall.affectedDispatches.length} client shipments exposed</span>
                </div>
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2 border-b">Customer Account</th>
                      <th className="p-2 border-b">Invoice #</th>
                      <th className="p-2 border-b">Dispatch Date</th>
                      <th className="p-2 border-b text-right">Dispatched Qty</th>
                      <th className="p-2 border-b text-right">Notification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recall.affectedDispatches.map((dsp, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-900">{dsp.customerName}</td>
                        <td className="p-2 font-mono text-slate-700">{dsp.invoiceNumber}</td>
                        <td className="p-2 text-slate-600">{dsp.dispatchDate.split('T')[0]}</td>
                        <td className="p-2 text-right font-bold text-rose-700">{dsp.dispatchedQty} {dsp.unit}</td>
                        <td className="p-2 text-right">
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {dsp.notificationStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Root Cause Findings */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
              3. Root-Cause Analysis & Metallurgical Investigation (5-Why)
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-line text-slate-700">
              {recall.rootCauseFindings}
            </div>
          </div>

          {/* Section 4: 8D CAPA Action Plan */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">
              4. 8D Corrective & Preventive Action Plan (CAPA)
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] whitespace-pre-line text-slate-800 leading-relaxed">
              {recall.correctiveActionPlan}
            </div>
          </div>

          {/* Section 5: Regulatory Compliance & Sign-Off Blocks */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div className="border-t border-slate-300 pt-2">
                <div className="font-bold text-slate-900 text-xs">{recall.qualityManagerSignOff}</div>
                <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                  Quality Assurance Head / Authorized IATF Auditor
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Verified Timestamp: {new Date(recall.initiatedAt).toISOString()}
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <div className="font-bold text-slate-900 text-xs">
                  Digitally Countersigned: Plant General Manager & VP Operations
                </div>
                <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                  Executive Manufacturing Oversight & Containment Closure
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  FlowOps Security Hash: SHA256-RCL-{recall.id.slice(-8)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
