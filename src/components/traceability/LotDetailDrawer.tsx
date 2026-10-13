// src/components/traceability/LotDetailDrawer.tsx

import React, { useState } from 'react';
import {
  X,
  QrCode,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  Truck,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  GitBranch,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { LotRecord } from '../../types/traceability';

interface LotDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lot: LotRecord | null;
  onExploreTrace: (lotNumber: string, direction: 'forward' | 'backward') => void;
  onIssueToWo: (lot: LotRecord) => void;
  onInitiateRecall: (lotNumber: string) => void;
}

export const LotDetailDrawer: React.FC<LotDetailDrawerProps> = ({
  isOpen,
  onClose,
  lot,
  onExploreTrace,
  onIssueToWo,
  onInitiateRecall
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'consumption' | 'dispatches'>('overview');

  if (!isOpen || !lot) return null;

  const isRecalled = lot.status === 'recalled' || lot.isRecalled;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className={`px-6 py-5 text-white flex items-center justify-between border-b ${
          isRecalled
            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-800'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isRecalled
                ? 'bg-rose-500/20 border-rose-400/30'
                : 'bg-indigo-500/20 border-indigo-400/30'
            }`}>
              <QrCode className={`w-6 h-6 ${isRecalled ? 'text-rose-300' : 'text-indigo-300'}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-bold tracking-tight">{lot.lotNumber}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  isRecalled
                    ? 'bg-rose-600 text-white'
                    : lot.status === 'released'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {lot.status.toUpperCase()}
                </span>
              </div>
              <div className="text-slate-300 text-xs mt-0.5 font-medium">{lot.stockItemName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Specifications
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'quality'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            QC Inspection & Mill MTR
          </button>
          <button
            onClick={() => setActiveTab('consumption')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'consumption'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Work Order Links ({lot.workOrderLinks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('dispatches')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'dispatches'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Dispatches ({lot.dispatchedToCustomers?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {/* Active Recall Warning Banner */}
          {isRecalled && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-1 text-rose-900">
              <div className="flex items-center space-x-2 font-bold text-sm text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <span>Active Quality Recall & Containment Lockdown</span>
              </div>
              <p className="text-xs text-rose-800">
                This lot is flagged under recall bulletin <strong>{lot.recallId || 'ACTIVE-RCL'}</strong>. Physical quarantine is in effect at bin {lot.binCode}. No further issuance into production is permitted.
              </p>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Inventory Quantities & Valuation Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Inventory Balance & Valuation
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">On-Hand Available</span>
                    <span className="text-base font-bold text-slate-900">{lot.currentQty} {lot.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Initial Receipt</span>
                    <span className="text-base font-bold text-slate-700">{lot.initialQty} {lot.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Consumed in WIP</span>
                    <span className="text-base font-bold text-purple-700">{lot.consumedQty} {lot.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Value</span>
                    <span className="text-base font-bold text-indigo-700">₹{lot.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Physical Location Hierarchy */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Physical Storage Location</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Plant Facility</span>
                    <span className="font-semibold text-slate-800">{lot.plantName}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Store Room</span>
                    <span className="font-semibold text-slate-800">{lot.storeName}</span>
                  </div>
                  <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-indigo-500 block text-[10px]">Assigned Storage Bin</span>
                    <span className="font-mono font-bold text-indigo-900">{lot.binCode}</span>
                  </div>
                </div>
              </div>

              {/* Metallurgical / Origin Details */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Metallurgical Specification & Traceability Attributes
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Mill Heat / Cast #</span>
                    <span className="font-mono font-bold text-amber-700">{lot.heatNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Material Grade</span>
                    <span className="font-semibold text-slate-800">{lot.materialGrade || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Supplier Name</span>
                    <span className="font-semibold text-slate-800">{lot.supplierName || 'Internal Production'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Inbound PO #</span>
                    <span className="font-mono text-slate-700">{lot.poNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">GRN Dock Inward #</span>
                    <span className="font-mono text-slate-700">{lot.grnNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Vendor Challan #</span>
                    <span className="font-mono text-slate-700">{lot.vendorChallanNo || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Inspection Verification & Certification</div>
                  <div className="text-slate-500 text-xs">
                    Disposition: <strong className="uppercase text-emerald-700">{lot.inspectionRecord?.disposition || lot.inspectionStatus}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {lot.inspectionRecord?.mtrNumber ? `MTR: ${lot.inspectionRecord.mtrNumber}` : 'Standard Receiving Check'}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Inspected by {lot.inspectionRecord?.inspectorName || lot.receivedByName}
                  </div>
                </div>
              </div>

              {lot.inspectionRecord?.parameters && lot.inspectionRecord.parameters.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 uppercase text-[10px] text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">Test Parameter</th>
                        <th className="p-3">Nominal Specification</th>
                        <th className="p-3">Measured Result</th>
                        <th className="p-3 text-right">Disposition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lot.inspectionRecord.parameters.map((param, i) => (
                        <tr key={i}>
                          <td className="p-3 font-semibold text-slate-800">{param.name}</td>
                          <td className="p-3 text-slate-500">{param.specification}</td>
                          <td className="p-3 font-mono font-medium text-slate-700">{param.measuredValue}</td>
                          <td className="p-3 text-right">
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                              {param.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  No individual metallurgical spectrometry parameters recorded for this lot.
                </div>
              )}

              {lot.inspectionRecord?.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                  <strong>Inspector Notes:</strong> {lot.inspectionRecord.notes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'consumption' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Linked Work Orders (Material Consumed in Production)
                </span>
                <button
                  onClick={() => onIssueToWo(lot)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Issue into New WO</span>
                </button>
              </div>

              {lot.workOrderLinks && lot.workOrderLinks.length > 0 ? (
                <div className="space-y-3">
                  {lot.workOrderLinks.map(link => (
                    <div key={link.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-700 text-sm">{link.workOrderNumber}</span>
                        <span className="font-bold text-slate-900">{link.consumedQty} {link.unit} consumed</span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">{link.partName}</div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                        <span>Operation: {link.operationName || `Seq ${link.operationSequence}`}</span>
                        <span>Work Center: {link.workCenterName || 'Primary Machine'}</span>
                        <span>Operator: {link.consumedByOperator}</span>
                      </div>
                      {link.resultingFgLotNumber && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Spawned Finished Goods Lot:</span>
                          <span className="font-mono font-bold text-emerald-700">{link.resultingFgLotNumber}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  This lot has not yet been issued to any active Work Orders.
                </div>
              )}
            </div>
          )}

          {activeTab === 'dispatches' && (
            <div className="space-y-4">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Finished Goods Customer Shipments
              </div>

              {lot.dispatchedToCustomers && lot.dispatchedToCustomers.length > 0 ? (
                <div className="space-y-3">
                  {lot.dispatchedToCustomers.map(dsp => (
                    <div key={dsp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{dsp.customerName}</span>
                        <span className="font-bold text-rose-700">{dsp.dispatchedQty} {dsp.unit}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-4">
                        <span>Invoice: <strong className="font-mono">{dsp.invoiceNumber}</strong></span>
                        <span>Sales Order: <strong className="font-mono">{dsp.salesOrderNumber}</strong></span>
                        <span>Dispatch Date: {dsp.dispatchDate.split('T')[0]}</span>
                      </div>
                      {dsp.trackingNumber && (
                        <div className="text-[11px] text-slate-500">
                          Tracking / LR #: <strong className="font-mono">{dsp.trackingNumber}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                  No direct customer dispatches recorded against this lot.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExploreTrace(lot.lotNumber, 'forward')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Trace Forward (Containment)</span>
            </button>
            <button
              onClick={() => onExploreTrace(lot.lotNumber, 'backward')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Trace Backward (Root-Cause)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {!isRecalled && (
              <button
                onClick={() => onInitiateRecall(lot.lotNumber)}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Initiate Recall Hold</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
