// src/components/genealogy/RegisterUnitBatchModal.tsx

import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Flame,
  CheckCircle2,
  Building2,
  Sparkles,
  Barcode
} from 'lucide-react';
import { TrackingLevel, ProductionGenealogyRecord } from '../../types/genealogy';

interface RegisterUnitBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: Partial<ProductionGenealogyRecord>) => Promise<void>;
}

export const RegisterUnitBatchModal: React.FC<RegisterUnitBatchModalProps> = ({
  isOpen,
  onClose,
  onRegister
}) => {
  if (!isOpen) return null;

  const [trackingLevel, setTrackingLevel] = useState<TrackingLevel>('unit');
  const [identifier, setIdentifier] = useState(`SN-2026-ENG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [workOrderNumber, setWorkOrderNumber] = useState('WO-2026-001');
  const [customerName, setCustomerName] = useState('Bajaj Auto Ltd. — Chakan Plant');
  const [partNumber, setPartNumber] = useState('CRK-8802');
  const [partName, setPartName] = useState('Forged Crankshaft — 4-Cylinder Turbo');
  const [materialGrade, setMaterialGrade] = useState('EN8D (AISI 1045)');
  const [heatNumber, setHeatNumber] = useState('HT-TATA-9942');
  const [supplierName, setSupplierName] = useState('Tata Prime Steel Ltd.');
  const [mtrNumber, setMtrNumber] = useState('MTR-TATA-2026-9942A');
  const [primaryLotNumber, setPrimaryLotNumber] = useState('LOT-2026-RM-0412');
  const [submitting, setSubmitting] = useState(false);

  const handleLevelChange = (lvl: TrackingLevel) => {
    setTrackingLevel(lvl);
    if (lvl === 'unit') {
      setIdentifier(`SN-2026-ENG-${Math.floor(1000 + Math.random() * 9000)}`);
      setBatchQuantity(1);
    } else {
      setIdentifier(`BATCH-2026-LOT-${Math.floor(1000 + Math.random() * 9000)}`);
      setBatchQuantity(250);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRegister({
        trackingLevel,
        identifier,
        batchQuantity,
        unitOfMeasure: 'pcs',
        workOrderNumber,
        customerName,
        partNumber,
        partName,
        rawMaterialSummary: {
          primaryLotNumber,
          materialGrade,
          heatNumber,
          supplierName,
          mtrNumber,
          poNumber: 'PO-2026-902',
          grnNumber: 'GRN-2026-0182'
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Register New Tracked Unit / Batch
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Initialize serialized piece or production lot with upstream heat genealogy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tracking Level Toggle */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Tracking Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLevelChange('unit')}
                className={`py-2 px-3 rounded-lg border text-left transition ${
                  trackingLevel === 'unit'
                    ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unit-Level (Serial)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Individual serial piece tracking (1 pc)</div>
              </button>

              <button
                type="button"
                onClick={() => handleLevelChange('batch')}
                className={`py-2 px-3 rounded-lg border text-left transition ${
                  trackingLevel === 'batch'
                    ? 'bg-indigo-950/60 border-indigo-500/70 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Batch-Level (Lot)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Production job run (e.g. 250 pcs)</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Tracking Identifier</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Batch Qty</label>
              <input
                type="number"
                value={batchQuantity}
                onChange={e => setBatchQuantity(Number(e.target.value))}
                min={1}
                disabled={trackingLevel === 'unit'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Work Order #</label>
              <input
                type="text"
                value={workOrderNumber}
                onChange={e => setWorkOrderNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Part SKU / Code</label>
              <input
                type="text"
                value={partNumber}
                onChange={e => setPartNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Part Description</label>
              <input
                type="text"
                value={partName}
                onChange={e => setPartName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Upstream Raw Material Linkage */}
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Upstream Heat &amp; Raw Material Trace</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">Heat / Cast #</label>
                <input
                  type="text"
                  value={heatNumber}
                  onChange={e => setHeatNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-amber-300 font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Material Grade</label>
                <input
                  type="text"
                  value={materialGrade}
                  onChange={e => setMaterialGrade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">MTR Certificate #</label>
                <input
                  type="text"
                  value={mtrNumber}
                  onChange={e => setMtrNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-cyan-300 font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Mill Supplier</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition cursor-pointer"
            >
              {submitting ? 'Registering...' : 'Register into Genealogy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
