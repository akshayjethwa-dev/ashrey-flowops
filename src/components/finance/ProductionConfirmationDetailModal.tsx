// src/components/finance/ProductionConfirmationDetailModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Package, 
  FileCode, 
  Zap, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  Scale,
  DollarSign,
  Boxes,
  Factory
} from 'lucide-react';
import { ProductionConfirmationRecord } from '../../types/productionConfirmationSync';
import { productionConfirmationSyncService } from '../../services/productionConfirmationSyncService';
import { useToast } from '../../context/ToastContext';

interface ProductionConfirmationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProductionConfirmationRecord | null;
  tenantId: string;
  onUpdated: () => void;
}

export const ProductionConfirmationDetailModal: React.FC<ProductionConfirmationDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  tenantId,
  onUpdated
}) => {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'scrap' | 'quality' | 'payload'>('overview');
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const config = productionConfirmationSyncService.getConfig(tenantId);

  // Generate current payload representation
  const erpPayload = record.erpPayloadXmlOrJson || (
    record.erpSystem === 'tally' 
      ? productionConfirmationSyncService.generateTallyMfgJournalXml(record, config)
      : record.erpSystem === 'oracle'
      ? productionConfirmationSyncService.generateOracleWipTxnJson(record, config)
      : productionConfirmationSyncService.generateSapGoodsReceiptJson(record, config)
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(erpPayload);
    setCopied(true);
    toastInfo('Copied to Clipboard', 'ERP sync payload copied successfully.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Master push
  const handlePushFull = async () => {
    setSubmittingAction('full');
    try {
      await productionConfirmationSyncService.pushFullProductionConfirmation(tenantId, record.id);
      toastSuccess('ERP Synchronized', `Pushed completion, materials, scrap, and quality for ${record.workOrderNumber} to ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
      onClose();
    } catch (e: any) {
      toastError('ERP Sync Failed', e.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  // Push individual pillars
  const handlePushCompletion = async () => {
    setSubmittingAction('completion');
    try {
      await productionConfirmationSyncService.pushProductionCompletion(tenantId, record.id);
      toastSuccess('FG Completion Pushed', `Posted Finished Goods receipt to ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
    } catch (e: any) {
      toastError('Push Failed', e.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handlePushMaterials = async () => {
    setSubmittingAction('materials');
    try {
      await productionConfirmationSyncService.pushMaterialConsumption(tenantId, record.id);
      toastSuccess('Materials Backflushed', `Relieved raw materials and credited stock in ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
    } catch (e: any) {
      toastError('Push Failed', e.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handlePushScrap = async () => {
    setSubmittingAction('scrap');
    try {
      await productionConfirmationSyncService.pushScrapRework(tenantId, record.id);
      toastSuccess('Scrap Posted', `Debited scrap loss to cost center in ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
    } catch (e: any) {
      toastError('Push Failed', e.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handlePushQuality = async () => {
    setSubmittingAction('quality');
    try {
      await productionConfirmationSyncService.pushQualityResults(tenantId, record.id);
      toastSuccess('Quality Transmitted', `FQC CoC #${record.qualityResultsSync.cocNumber} posted to ERP.`);
      onUpdated();
    } catch (e: any) {
      toastError('Push Failed', e.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-mono text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                record.erpSystem === 'tally' ? 'bg-amber-400 text-slate-950' :
                record.erpSystem === 'oracle' ? 'bg-sky-400 text-slate-950' : 'bg-purple-300 text-slate-950'
              }`}>
                {record.erpSystem.toUpperCase()} ERP INTEGRATION
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 text-xs">Work Order Confirmation</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
              <span>{record.workOrderNumber}</span>
              <span className="text-slate-400 font-normal">({record.partName})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pillar Status Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 border-b border-slate-200 text-center divide-x divide-slate-200 shrink-0">
          {/* Pillar 1 */}
          <div className="p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">1. FG Receipt</span>
            <span className={`inline-flex items-center space-x-1 mt-0.5 text-[11px] font-bold ${
              record.completionSync.status === 'posted' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {record.completionSync.status === 'posted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span>{record.completionSync.status === 'posted' ? 'Posted' : 'Pending'}</span>
            </span>
          </div>

          {/* Pillar 2 */}
          <div className="p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">2. Materials Issue</span>
            <span className={`inline-flex items-center space-x-1 mt-0.5 text-[11px] font-bold ${
              record.materialConsumptionSync.status === 'posted' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {record.materialConsumptionSync.status === 'posted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span>{record.materialConsumptionSync.status === 'posted' ? 'Relieved' : 'Pending'}</span>
            </span>
          </div>

          {/* Pillar 3 */}
          <div className="p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">3. Scrap & Rework</span>
            <span className={`inline-flex items-center space-x-1 mt-0.5 text-[11px] font-bold ${
              record.scrapReworkSync.status === 'posted' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {record.scrapReworkSync.status === 'posted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span>{record.scrapReworkSync.status === 'posted' ? 'Posted' : 'Pending'}</span>
            </span>
          </div>

          {/* Pillar 4 */}
          <div className="p-2.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">4. Quality (FQC)</span>
            <span className={`inline-flex items-center space-x-1 mt-0.5 text-[11px] font-bold ${
              record.qualityResultsSync.status === 'posted' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {record.qualityResultsSync.status === 'posted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span>{record.qualityResultsSync.status === 'posted' ? 'Transmitted' : 'Pending'}</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-b border-slate-200 px-4 bg-slate-50/70 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'overview' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            FG Completion
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'materials' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Material Backflush ({record.materialConsumptionSync.materials.length})
          </button>
          <button
            onClick={() => setActiveTab('scrap')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'scrap' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Scrap & Rework
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'quality' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Quality & CoC
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'payload' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ERP Payload ({record.erpSystem === 'tally' ? 'XML' : 'JSON'})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: OVERVIEW & FG COMPLETION */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Finished Good Part</span>
                  <strong className="text-slate-900 block mt-0.5">{record.partName}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Code: {record.partCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer PO & Reference</span>
                  <strong className="text-slate-900 block mt-0.5">{record.customerPoNumber}</strong>
                  <span className="text-[10px] text-slate-500">{record.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Manufacturing Plant</span>
                  <strong className="text-slate-900 block mt-0.5">{record.plantName}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Plant ID: {record.plantId}</span>
                </div>
              </div>

              {/* FG Financials Box */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Production Completion Details (Receipt into Stock)
                    </span>
                    <h3 className="text-sm font-bold text-indigo-950 mt-0.5">
                      {record.quantityCompleted} {record.uom} Completed @ ₹{record.completionSync.fgCostPerUnit.toLocaleString('en-IN')}/unit
                    </h3>
                  </div>
                  <strong className="text-lg font-black text-indigo-900 font-mono">
                    ₹{record.completionSync.fgValuationINR.toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-200 text-[11px]">
                  <div>
                    <span className="text-[10px] text-indigo-600 block uppercase">Target Godown / Bin</span>
                    <strong className="text-indigo-950">{record.completionSync.targetSubinventory}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-600 block uppercase">Completion Date</span>
                    <strong className="text-indigo-950">{record.completionDate}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-600 block uppercase">ERP Voucher Ref</span>
                    <strong className="text-indigo-950">{record.completionSync.voucherNumber || 'Unassigned (Pending Push)'}</strong>
                  </div>
                </div>

                {record.completionSync.status !== 'posted' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handlePushCompletion}
                      disabled={submittingAction === 'completion'}
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>{submittingAction === 'completion' ? 'Posting...' : 'Push FG Completion Voucher'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MATERIAL CONSUMPTION */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">BOM Component Backflushing & Inventory Relief</span>
                  <span className="text-[11px] text-slate-500 block">
                    Calculates actual raw material usage, scrap factor %, and credit to Godown bins.
                  </span>
                </div>
                <strong className="text-slate-900 text-sm">
                  Total RM: ₹{record.materialConsumptionSync.totalMaterialCostINR.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Component / Raw Material</th>
                      <th className="py-2.5 px-3">BOM Req / Actual Consumed</th>
                      <th className="py-2.5 px-3">Scrap Factor</th>
                      <th className="py-2.5 px-3">Lot # / Source Godown</th>
                      <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {record.materialConsumptionSync.materials.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block">{m.itemName}</strong>
                          <span className="text-[10px] text-slate-400">Code: {m.itemCode}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-500 block">Req: {m.bomRequiredQty} {m.uom}</span>
                          <strong className="text-slate-900 block">Actual: {m.actualConsumedQty} {m.uom}</strong>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {m.scrapFactorPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-900 block font-bold">{m.lotNumber}</span>
                          <span className="text-[10px] text-slate-400 block">{m.sourceWarehouse}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <strong className="text-slate-900 block">₹{m.totalCostINR.toLocaleString('en-IN')}</strong>
                          <span className="text-[10px] text-slate-400 block">@ ₹{m.unitCostINR}/{m.uom}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {record.materialConsumptionSync.status !== 'posted' && (
                <div className="flex justify-end">
                  <button
                    onClick={handlePushMaterials}
                    disabled={submittingAction === 'materials'}
                    className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Boxes className="h-3.5 w-3.5 text-amber-300" />
                    <span>{submittingAction === 'materials' ? 'Relieving...' : 'Backflush & Push Material Issue'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCRAP & REWORK */}
          {activeTab === 'scrap' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertOctagon className="h-5 w-5 text-rose-600" />
                    <div>
                      <h4 className="font-bold text-rose-950">Scrap & Defect Cost Allocation</h4>
                      <span className="text-[11px] text-rose-800">
                        Units discarded during CNC cutting or machining stages.
                      </span>
                    </div>
                  </div>
                  <strong className="text-lg font-black text-rose-900 font-mono">
                    ₹{record.scrapReworkSync.scrapLossAmountINR.toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-rose-200 text-[11px]">
                  <div>
                    <span className="text-[10px] text-rose-600 block uppercase">Scrapped Quantity</span>
                    <strong className="text-rose-950">{record.scrapReworkSync.quantityScrapped} {record.uom}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 block uppercase">Root Cause Code</span>
                    <strong className="text-rose-950 font-mono">{record.scrapReworkSync.scrapReasonCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 block uppercase">Debit Cost Center</span>
                    <strong className="text-rose-950">{record.scrapReworkSync.costCenterDebit}</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-rose-200 rounded-lg text-[11px] text-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Incident Description:</span>
                  <span>{record.scrapReworkSync.scrapReasonDescription}</span>
                </div>
              </div>

              {/* Rework Section */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 font-bold uppercase block">Rework & Labor Variance</span>
                  <span className="text-xs font-bold text-amber-950 block mt-0.5">
                    {record.scrapReworkSync.reworkHours} machine rework hours logged
                  </span>
                  <span className="text-[11px] text-slate-500">Debited to machine overhead & labor variance ledger.</span>
                </div>
                <strong className="text-sm font-black text-amber-900 font-mono">
                  ₹{record.scrapReworkSync.reworkLaborCostINR.toLocaleString('en-IN')}
                </strong>
              </div>

              {record.scrapReworkSync.status !== 'posted' && (
                <div className="flex justify-end">
                  <button
                    onClick={handlePushScrap}
                    disabled={submittingAction === 'scrap'}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Scale className="h-3.5 w-3.5 text-white" />
                    <span>{submittingAction === 'scrap' ? 'Posting...' : 'Push Scrap & Rework Expense'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUALITY & FQC RESULTS */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-emerald-950">Final Quality Check (FQC) & Conformance Release</h4>
                      <span className="text-[11px] text-emerald-800">
                        Signed off by QA Inspector {record.qualityResultsSync.inspectorBadgeId}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] uppercase">
                    {record.qualityResultsSync.overallResult.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 text-[11px]">
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase">FQC Order #</span>
                    <strong className="text-emerald-950 font-mono">{record.qualityResultsSync.fqcNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase">Certificate of Conformance</span>
                    <strong className="text-emerald-950 font-mono">{record.qualityResultsSync.cocNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase">Passed / Rejected</span>
                    <strong className="text-emerald-950">{record.qualityResultsSync.passedQuantity} Pass / {record.qualityResultsSync.rejectedQuantity} Rej</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase">Quality Hold State</span>
                    <strong className="text-emerald-950 uppercase">{record.qualityResultsSync.qualityHoldStatus}</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-emerald-200 rounded-lg text-[11px] text-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Inspection Remarks:</span>
                  <span>{record.qualityResultsSync.tallyQualityRemarks}</span>
                </div>
              </div>

              {record.qualityResultsSync.status !== 'posted' && (
                <div className="flex justify-end">
                  <button
                    onClick={handlePushQuality}
                    disabled={submittingAction === 'quality'}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    <span>{submittingAction === 'quality' ? 'Transmitting...' : 'Push Quality Results to ERP'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ERP PAYLOAD INSPECTOR */}
          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Generated {record.erpSystem.toUpperCase()} XML / JSON Voucher Payload for Work Order {record.workOrderNumber}
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[380px] leading-relaxed select-text">
                {erpPayload}
              </pre>
            </div>
          )}

        </div>

        {/* Footer Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {record.lastSyncedAt ? (
              <span>Last pushed on {new Date(record.lastSyncedAt).toLocaleString()} by {record.syncedBy}</span>
            ) : (
              <span className="text-amber-700 font-bold">Unsynchronized with corporate ERP</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs uppercase transition cursor-pointer"
            >
              Close
            </button>

            {record.status !== 'confirmed' && (
              <button
                onClick={handlePushFull}
                disabled={submittingAction === 'full'}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-extrabold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                <span>{submittingAction === 'full' ? 'Pushing to ERP...' : 'Push Full Confirmation to ERP'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
