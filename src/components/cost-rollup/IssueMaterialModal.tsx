// src/components/cost-rollup/IssueMaterialModal.tsx

import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Layers,
  MapPin,
  DollarSign
} from 'lucide-react';
import { costRollupService } from '../../services/costRollupService';
import { MaterialIssueInput } from '../../types/costRollup';

interface IssueMaterialModalProps {
  workOrderId: string;
  workOrderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const IssueMaterialModal: React.FC<IssueMaterialModalProps> = ({
  workOrderId,
  workOrderNumber,
  onClose,
  onSuccess
}) => {
  const [materialCode, setMaterialCode] = useState('RM-EN353-RD140');
  const [materialName, setMaterialName] = useState('EN353 Forged Round Billet Ø140mm');
  const [lotNumber, setLotNumber] = useState('LOT-2026-EN353-904');
  const [storeLocation, setStoreLocation] = useState('Pune Heavy Forge — Main Raw Materials Store');
  const [binCode, setBinCode] = useState('ST-RM01 / Bin A-04-14');
  const [qtyToIssue, setQtyToIssue] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [unitCost, setUnitCost] = useState<number>(865);
  const [operatorName, setOperatorName] = useState('Anand V. (Stores)');
  const [grnNumber, setGrnNumber] = useState('GRN-2026-0428');
  const [notes, setNotes] = useState('Supplemental issue for setup bar-ends and tool test pieces.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyToIssue <= 0 || unitCost <= 0) return;

    const input: MaterialIssueInput = {
      workOrderId,
      bomItemId: `bom-supp-${Date.now()}`,
      materialCode,
      materialName,
      lotNumber,
      storeLocation,
      binCode,
      qtyToIssue: Number(qtyToIssue),
      unit,
      unitCost: Number(unitCost),
      operatorName,
      grnNumber,
      notes
    };

    costRollupService.issueMaterialToWorkOrder(input);
    onSuccess();
    onClose();
  };

  const totalCost = (qtyToIssue || 0) * (unitCost || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="text-indigo-400" size={18} />
            <h3 className="text-base font-bold text-white">
              Issue Material from Inventory
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
            Issuing direct inventory stock to Work Order <strong className="font-mono text-white">{workOrderNumber}</strong>. Material costs roll up into actual job margin in real-time.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Material Item Code
              </label>
              <input
                type="text"
                required
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stock Lot / Heat #
              </label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Material Description
            </label>
            <input
              type="text"
              required
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Location
              </label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bin Location
              </label>
              <input
                type="text"
                value={binCode}
                onChange={(e) => setBinCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Qty to Issue
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={qtyToIssue}
                onChange={(e) => setQtyToIssue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Incremental Cost Addition:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              ₹{totalCost.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Issue Reason / Scrapping Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              Confirm Material Issue
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
