// src/components/traceability/LotIssueToWoModal.tsx

import React, { useState } from 'react';
import {
  X,
  Layers,
  ArrowRight,
  Package,
  CheckCircle2,
  AlertTriangle,
  User,
  Cpu
} from 'lucide-react';
import { LotRecord } from '../../types/traceability';
import { useAuth } from '../../context/AuthContext';

interface LotIssueToWoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: LotRecord | null;
  onSubmit: (params: {
    workOrderId: string;
    workOrderNumber: string;
    partName: string;
    consumedQty: number;
    unit: string;
    operatorName: string;
    operationSequence?: number;
    operationName?: string;
    workCenterName?: string;
    scrapQty?: number;
    notes?: string;
  }) => Promise<any>;
}

export const LotIssueToWoModal: React.FC<LotIssueToWoModalProps> = ({
  isOpen,
  onClose,
  lot,
  onSubmit
}) => {
  const { profile } = useAuth();

  const [workOrderNumber, setWorkOrderNumber] = useState<string>('WO-2026-001');
  const [partName, setPartName] = useState<string>('Steering Column Shaft — Spec B3');
  const [consumedQty, setConsumedQty] = useState<number>(1.5);
  const [operationSequence, setOperationSequence] = useState<number>(10);
  const [operationName, setOperationName] = useState<string>('Billet Shearing & Induction Forging');
  const [workCenterName, setWorkCenterName] = useState<string>('Forging Cell 1 (1600T Press)');
  const [operatorName, setOperatorName] = useState<string>(profile?.name || 'Shopfloor Machine Operator');
  const [scrapQty, setScrapQty] = useState<number>(0.05);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !lot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (consumedQty <= 0) {
      alert('Issued quantity must be greater than 0');
      return;
    }
    if (consumedQty > lot.currentQty) {
      alert(`Cannot issue ${consumedQty} ${lot.unit}. Only ${lot.currentQty} ${lot.unit} available in lot.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        workOrderId: `wo-${workOrderNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        workOrderNumber: workOrderNumber.trim(),
        partName: partName.trim(),
        consumedQty: Number(consumedQty),
        unit: lot.unit,
        operatorName: operatorName.trim(),
        operationSequence: Number(operationSequence),
        operationName: operationName.trim(),
        workCenterName: workCenterName.trim(),
        scrapQty: Number(scrapQty),
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to issue lot to Work Order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <Layers className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight">Issue Material Lot to Work Order</h3>
                <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  Shopfloor Issuance
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Establish direct genealogical linkage from Raw Material Lot to Work Order line execution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Lot Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {lot.lotNumber}
              </span>
              <span className="font-semibold text-slate-700">
                Available: <strong className="text-emerald-700">{lot.currentQty} {lot.unit}</strong>
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">{lot.stockItemName}</div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
              <span>Heat #: <strong className="font-mono text-amber-700">{lot.heatNumber || 'N/A'}</strong></span>
              <span>Bin: <strong className="font-mono text-slate-700">{lot.binCode}</strong></span>
              <span>Grade: <strong>{lot.materialGrade || 'N/A'}</strong></span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Order Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={workOrderNumber}
                onChange={e => setWorkOrderNumber(e.target.value)}
                placeholder="e.g. WO-2026-001"
                className="w-full text-sm font-mono font-bold rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-purple-50/30 text-purple-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issued / Consumed Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  max={lot.currentQty}
                  required
                  value={consumedQty}
                  onChange={e => setConsumedQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{lot.unit}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Manufactured Part / Assembly</label>
            <input
              type="text"
              required
              value={partName}
              onChange={e => setPartName(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operation Sequence & Name</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={operationSequence}
                  onChange={e => setOperationSequence(parseInt(e.target.value, 10) || 10)}
                  className="w-full text-sm font-mono rounded-lg border-slate-300 px-3 py-2 text-center"
                />
                <input
                  type="text"
                  value={operationName}
                  onChange={e => setOperationName(e.target.value)}
                  className="col-span-2 w-full text-xs rounded-lg border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Center / Machine</label>
              <input
                type="text"
                value={workCenterName}
                onChange={e => setWorkCenterName(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Operator Name</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Scrap / Flash ({lot.unit})</label>
              <input
                type="number"
                step="any"
                value={scrapQty}
                onChange={e => setScrapQty(parseFloat(e.target.value) || 0)}
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Remaining Lot Stock: <strong className="font-semibold text-slate-800">{Math.max(0, lot.currentQty - consumedQty)} {lot.unit}</strong>
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{isSubmitting ? 'Linking...' : 'Issue & Link to Work Order'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
