// src/components/iqc/CreateIqcOrderModal.tsx

import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Package,
  Building2,
  Flame,
  Layers,
  Sparkles,
  Barcode
} from 'lucide-react';
import { InspectionPlan } from '../../types/iqc';

interface CreateIqcOrderModalProps {
  plans: InspectionPlan[];
  onClose: () => void;
  onCreateOrder: (params: any) => Promise<any>;
}

export const CreateIqcOrderModal: React.FC<CreateIqcOrderModalProps> = ({
  plans,
  onClose,
  onCreateOrder
}) => {
  const [poNumber, setPoNumber] = useState<string>(`PO-2026-00${Math.floor(10 + Math.random() * 90)}`);
  const [grnNumber, setGrnNumber] = useState<string>(`GRN-2026-0${Math.floor(200 + Math.random() * 800)}`);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const [supplierName, setSupplierName] = useState<string>(activePlan?.supplierName || 'Tata Prime Steel Ltd.');
  const [supplierId] = useState<string>(activePlan?.supplierId || 'sup-tata-01');
  const [partSku, setPartSku] = useState<string>(activePlan?.partSku || 'RAW-STEEL-EN8-45');
  const [partName, setPartName] = useState<string>(activePlan?.partName || 'EN8 Carbon Steel Round Bar Dia 45mm');
  const [category, setCategory] = useState<string>(activePlan?.category || 'Raw Materials');
  const [receivedQty, setReceivedQty] = useState<number>(500);
  const [unit, setUnit] = useState<string>('Kg');
  const [heatLotNumber, setHeatLotNumber] = useState<string>(`HT-${Math.floor(10000 + Math.random() * 90000)}-B`);
  const [mtrNumber, setMtrNumber] = useState<string>(`MTR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [inspectorName, setInspectorName] = useState<string>('Anita Desai (QC-408)');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // When plan changes, sync part and supplier
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const p = plans.find(x => x.id === planId);
    if (p) {
      setSupplierName(p.supplierName || 'Primary Supplier');
      setPartSku(p.partSku);
      setPartName(p.partName);
      setCategory(p.category);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onCreateOrder({
        poNumber,
        grnNumber,
        supplierId,
        supplierName,
        partSku,
        partName,
        category,
        receivedQty,
        unit,
        heatLotNumber,
        mtrNumber,
        inspectorName
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Generate Inward Inspection Order (IQC)
              </h2>
              <p className="text-xs text-slate-400">
                Trigger dock receiving order and bind supplier inspection protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {/* Inspection Plan Selector */}
          <div className="bg-blue-950/30 border border-blue-500/40 rounded-xl p-4">
            <label className="block text-xs font-mono uppercase text-blue-300 font-bold mb-1">
              Select Inspection Plan Template
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.planCode} — {p.title} ({p.partSku})
                </option>
              ))}
            </select>
            {activePlan && (
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <span>AQL: <strong className="text-blue-300">{activePlan.aqlLevel}</strong></span>
                <span>•</span>
                <span>Parameters: <strong className="text-blue-300">{activePlan.parameters.length} checks</strong></span>
                <span>•</span>
                <span>Standard: <strong className="text-blue-300">{activePlan.samplingStandard}</strong></span>
              </div>
            )}
          </div>

          {/* PO & Inward GRN Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Purchase Order Reference
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Goods Receipt Note (GRN #)
              </label>
              <input
                type="text"
                required
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Supplier & Part SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Part SKU / Item Code
              </label>
              <input
                type="text"
                required
                value={partSku}
                onChange={(e) => setPartSku(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Quantity & Units */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Received Lot Size
              </label>
              <input
                type="number"
                min="1"
                required
                value={receivedQty}
                onChange={(e) => setReceivedQty(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Inspector
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Heat Lot & MTR Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Melt / Heat Lot Tracking #
              </label>
              <input
                type="text"
                required
                value={heatLotNumber}
                onChange={(e) => setHeatLotNumber(e.target.value)}
                placeholder="e.g. HT-98421-B"
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mill Test Certificate (MTR #)
              </label>
              <input
                type="text"
                value={mtrNumber}
                onChange={(e) => setMtrNumber(e.target.value)}
                placeholder="e.g. MTR-TATA-2026-7890"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              {isSubmitting ? 'Creating Order...' : 'Generate Inspection Order'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
