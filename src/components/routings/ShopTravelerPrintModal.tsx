// src/components/routings/ShopTravelerPrintModal.tsx

import React from 'react';
import { 
  X, 
  Printer, 
  Layers, 
  Building2, 
  Clock, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2 
} from 'lucide-react';
import { ProductRouting } from '../../types/routing';

interface ShopTravelerPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  routing: ProductRouting;
}

export const ShopTravelerPrintModal: React.FC<ShopTravelerPrintModalProps> = ({
  isOpen,
  onClose,
  routing
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const sortedOps = [...routing.operations].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:bg-white print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Shopfloor Routing Traveler & Standard Work Instructions</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Traveler Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-6 print:overflow-visible">
          {/* Header Card */}
          <div className="border-2 border-slate-900 rounded-xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                  Ashrey Precision Engineering MES
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  Manufacturing Process Routing Traveler
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Controlled Shopfloor Standard Operating Procedure (SOP) & Operation Sequence Sheet
                </p>
              </div>

              {/* Barcode / Stamp Block */}
              <div className="text-right flex flex-col items-end">
                <div className="font-mono text-xs font-bold bg-slate-100 border border-slate-300 px-3 py-1 rounded">
                  DOC ID: {routing.routingNumber}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Revision: <strong className="text-slate-900">{routing.revision}</strong> • Status: ACTIVE
                </div>
              </div>
            </div>

            {/* Product Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase text-slate-500 block">Part Number</span>
                <span className="font-bold text-sm text-slate-900">{routing.partNumber}</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase text-slate-500 block">Part Description</span>
                <span className="font-semibold text-slate-800 truncate block">{routing.partName}</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase text-slate-500 block">Drawing Reference</span>
                <span className="font-semibold text-slate-800">
                  {routing.drawingNumber || 'N/A'} (Rev {routing.drawingRevision || '0'})
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-500 block">Target Batch Qty</span>
                <span className="font-bold text-sm text-indigo-700">{routing.targetBatchSize} pcs</span>
              </div>
            </div>
          </div>

          {/* Sequential Operations Table */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-700 w-12 text-center">Seq</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-44">Work Center</th>
                  <th className="py-2.5 px-4 border-r border-slate-700">Operation & SOP Work Instructions</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-24 text-right">Standard Time</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-28 text-center">Operator Sign</th>
                  <th className="py-2.5 px-3 w-28 text-center">QC Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200">
                {sortedOps.map((op) => (
                  <tr key={op.id} className="align-top">
                    <td className="py-3 px-2 font-mono font-bold text-center border-r border-slate-200 bg-slate-50">
                      {op.sequenceNumber}
                    </td>

                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-mono font-bold text-slate-900">{op.workCenterCode}</div>
                      <div className="text-[11px] text-slate-600">{op.workCenterName}</div>
                      <div className="text-[10px] text-indigo-700 font-mono mt-1 capitalize">
                        Skill: {op.skillLevel.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3 px-4 border-r border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{op.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300">
                          {op.operationCode}
                        </span>
                      </div>

                      {op.instructions && (
                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-2 rounded border border-slate-200">
                          {op.instructions}
                        </p>
                      )}

                      <div className="text-[11px] font-mono text-slate-600 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                        {op.toolingFixtures && (
                          <span><strong>Tooling:</strong> {op.toolingFixtures}</span>
                        )}
                        {op.qualityInspectionCriteria && (
                          <span className="text-emerald-700 font-semibold">
                            <strong>QC Check:</strong> {op.qualityInspectionCriteria}
                          </span>
                        )}
                        {op.safetyPpe && op.safetyPpe.length > 0 && (
                          <span><strong>PPE:</strong> {op.safetyPpe.join(', ')}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono border-r border-slate-200">
                      <div className="text-slate-900 font-bold">{op.cycleTimeMinutes}m / pc</div>
                      <div className="text-[10px] text-slate-500">Set: {op.setupTimeMinutes}m</div>
                    </td>

                    {/* Operator Sign-off Blank */}
                    <td className="py-3 px-2 border-r border-slate-200 text-center font-mono text-[10px]">
                      <div className="h-10 border border-dashed border-slate-300 rounded mb-1 flex items-center justify-center text-slate-400">
                        Sign / Date
                      </div>
                      <div className="text-slate-500 text-[9px]">Qty Done: _____</div>
                    </td>

                    {/* QC Stamp Blank */}
                    <td className="py-3 px-2 text-center font-mono text-[10px]">
                      <div className="h-10 border-2 border-dashed border-slate-400 rounded mb-1 flex items-center justify-center text-slate-400">
                        QC Stamp
                      </div>
                      <div className="text-slate-500 text-[9px]">Pass [ ] Rej [ ]</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Signatures Block */}
          <div className="grid grid-cols-3 gap-4 border-2 border-slate-900 rounded-xl p-4 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Manufacturing Engineer</span>
              <div className="h-8 border-b border-slate-300 mt-2" />
              <span className="text-[10px] text-slate-600 block mt-1">Prepared By / Date</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Production Line Supervisor</span>
              <div className="h-8 border-b border-slate-300 mt-2" />
              <span className="text-[10px] text-slate-600 block mt-1">Released for Shopfloor / Date</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Quality Assurance Manager</span>
              <div className="h-8 border-b border-slate-300 mt-2" />
              <span className="text-[10px] text-slate-600 block mt-1">Approved & Verified / Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
