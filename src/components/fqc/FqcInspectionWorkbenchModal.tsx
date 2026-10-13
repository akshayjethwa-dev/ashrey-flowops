// src/components/fqc/FqcInspectionWorkbenchModal.tsx

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Ruler,
  Camera,
  Layers,
  Award,
  Clock,
  User,
  Barcode,
  Package,
  FileCheck2,
  Plus,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import {
  FqcInspectionOrder,
  FqcChecklistItem,
  FqcItemCategory,
  FqcItemResult
} from '../../types/fqc';
import { gageService } from '../../services/gageService';

interface FqcInspectionWorkbenchModalProps {
  order: FqcInspectionOrder;
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (itemId: string, updates: Partial<FqcChecklistItem>) => void;
  onSubmitForSignOff: (order: FqcInspectionOrder) => void;
  onOpenSignOffModal: (order: FqcInspectionOrder) => void;
}

export const FqcInspectionWorkbenchModal: React.FC<FqcInspectionWorkbenchModalProps> = ({
  order,
  isOpen,
  onClose,
  onSaveItem,
  onOpenSignOffModal
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | FqcItemCategory>('all');
  const [photoInput, setPhotoInput] = useState('');
  const [packagingSealed, setPackagingSealed] = useState(order.packagingSealed);
  const [barcodeVerified, setBarcodeVerified] = useState(order.barcodeVerified);
  const [inspectorNotes, setInspectorNotes] = useState(order.notes || '');

  // Master gages from gageService for validation
  const gages = gageService.getGages();

  if (!isOpen) return null;

  const categories: { key: 'all' | FqcItemCategory; label: string }[] = [
    { key: 'all', label: 'All Items' },
    { key: 'dimension', label: 'Dimensions' },
    { key: 'visual', label: 'Visual & Finish' },
    { key: 'functional', label: 'Functional & Hardness' },
    { key: 'cleanliness', label: 'Cleanliness & Surface' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'documentation', label: 'Documentation' }
  ];

  const filteredItems = order.items.filter(
    item => activeCategory === 'all' || item.category === activeCategory
  );

  const pendingCount = order.items.filter(it => it.result === 'pending').length;
  const passedCount = order.items.filter(it => it.result === 'pass').length;
  const failedCount = order.items.filter(it => it.result === 'fail').length;

  const handleResultChange = (itemId: string, newResult: FqcItemResult) => {
    onSaveItem(itemId, { result: newResult });
  };

  const handleMeasuredChange = (item: FqcChecklistItem, valueStr: string) => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) {
      onSaveItem(item.id, { measuredValue: undefined, result: 'pending' });
      return;
    }

    // Auto-calculate pass/fail if tolerances exist
    let pass = true;
    if (item.targetNominal !== undefined) {
      const upper = item.targetNominal + (item.upperTolerance ?? 0);
      const lower = item.targetNominal + (item.lowerTolerance ?? 0);
      pass = val >= lower && val <= upper;
    }

    onSaveItem(item.id, {
      measuredValue: val,
      result: pass ? 'pass' : 'fail'
    });
  };

  const handleGageChange = (itemId: string, gageTag: string) => {
    onSaveItem(itemId, { gageAssetTag: gageTag });
  };

  const handlePassAllVisual = () => {
    order.items.forEach(it => {
      if (it.category === 'visual' || it.category === 'packaging' || it.category === 'documentation') {
        if (it.result === 'pending') {
          onSaveItem(it.id, { result: 'pass' });
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Final Quality Control (FQC) Workbench
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  {order.fqcNumber}
                </span>
                {order.holdStatus === 'on_hold' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Quality Auto-Hold Active
                  </span>
                ) : order.holdStatus === 'released' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Cleared for Dispatch
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Quarantined
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured final pre-dispatch inspection checklist &bull; Gatekeeper for Finished Goods release
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Metadata Banner */}
        <div className="px-6 py-3 bg-slate-850/60 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Customer</span>
            <span className="font-semibold text-slate-200 truncate block">{order.customerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Part SKU & Name</span>
            <span className="font-semibold text-cyan-300 truncate block">{order.partSku}</span>
            <span className="text-[11px] text-slate-400 truncate block">{order.partName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Lot # / Batch Qty</span>
            <span className="font-mono font-bold text-slate-200">{order.lotNumber}</span>
            <span className="text-slate-400 block text-[11px]">{order.batchQuantity} pcs (Sample: {order.sampleSize})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Linked Order / WO</span>
            <span className="font-mono text-slate-300 block">{order.orderNumber}</span>
            <span className="font-mono text-[11px] text-slate-400">{order.workOrderNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Inspector</span>
            <span className="font-medium text-slate-200 block">{order.inspectorName}</span>
            <span className="text-[11px] text-slate-400">{order.inspectionDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Checklist Progress</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono font-bold text-emerald-400">{passedCount}P</span>
              <span className="text-slate-600">/</span>
              <span className="font-mono font-bold text-rose-400">{failedCount}F</span>
              <span className="text-slate-600">/</span>
              <span className="font-mono font-bold text-amber-400">{pendingCount}Pend</span>
            </div>
          </div>
        </div>

        {/* Category Tabs and Quick Actions */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategory === cat.key
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePassAllVisual}
              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pass All Visual & Packaging
            </button>
          </div>
        </div>

        {/* Scrollable Checklist Items Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No checklist items in this category.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              // Check gage validity if instrument assigned
              const gageCheck = item.gageAssetTag ? gageService.checkGageValidity(item.gageAssetTag) : null;
              const isGageBlocked = gageCheck && !gageCheck.isValid;

              const isPass = item.result === 'pass';
              const isFail = item.result === 'fail';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFail
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                      : isPass
                      ? 'bg-slate-850/70 border-emerald-500/30'
                      : 'bg-slate-850/50 border-slate-750'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    
                    {/* Item Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">#{idx + 1}</span>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            item.criticalLevel === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : item.criticalLevel === 'major'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                          }`}
                        >
                          {item.criticalLevel}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                        {item.criteria}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                          Method: {item.inspectionMethod}
                        </span>

                        {/* Gage Calibration Selection & Blocking Warning */}
                        {item.isMeasurement && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">Gage:</span>
                            <select
                              value={item.gageAssetTag || ''}
                              onChange={e => handleGageChange(item.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                            >
                              <option value="">Select Gage</option>
                              {gages.map(g => (
                                <option key={g.id} value={g.assetTag}>
                                  {g.assetTag} - {g.name} ({g.calibrationStatus})
                                </option>
                              ))}
                            </select>

                            {gageCheck && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                                  gageCheck.isValid
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                }`}
                              >
                                {gageCheck.isValid ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3" />
                                    Calibrated
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="w-3 h-3" />
                                    EXPIRED GAGE (BLOCKED)
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Out of Calibration Blocking Banner */}
                      {isGageBlocked && (
                        <div className="mt-2 p-2 bg-rose-950/60 border border-rose-500/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            <strong>INSPECTION BLOCKED:</strong> Instrument {item.gageAssetTag} is overdue for calibration! Please switch to a certified gage from Metrology.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Measurement Entry or Pass/Fail Toggles */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                      {item.isMeasurement && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">
                              Spec: {item.targetNominal} {item.unit}
                              {item.upperTolerance !== undefined && (
                                <span className="text-slate-500 text-[11px] ml-1">
                                  (+{item.upperTolerance} / {item.lowerTolerance ?? 0})
                                </span>
                              )}
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.001"
                                disabled={Boolean(isGageBlocked)}
                                value={item.measuredValue !== undefined ? item.measuredValue : ''}
                                onChange={e => handleMeasuredChange(item, e.target.value)}
                                placeholder="Measure"
                                className={`w-28 bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-mono text-right text-white focus:outline-none transition ${
                                  isGageBlocked
                                    ? 'opacity-40 cursor-not-allowed border-rose-600'
                                    : isFail
                                    ? 'border-rose-500 bg-rose-950/30'
                                    : isPass
                                    ? 'border-emerald-500 bg-emerald-950/20'
                                    : 'border-slate-700 focus:border-cyan-500'
                                }`}
                              />
                              <span className="absolute right-2 top-1 text-[10px] text-slate-500 pointer-events-none">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Result Buttons */}
                      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                        <button
                          onClick={() => handleResultChange(item.id, 'pass')}
                          disabled={Boolean(isGageBlocked)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            item.result === 'pass'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-emerald-300'
                          } ${isGageBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pass
                        </button>
                        <button
                          onClick={() => handleResultChange(item.id, 'fail')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            item.result === 'fail'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Fail
                        </button>
                        <button
                          onClick={() => handleResultChange(item.id, 'na')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            item.result === 'na'
                              ? 'bg-slate-600 text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Packaging Sealing & Barcode Verification Card */}
          <div className="p-4 bg-slate-850/80 border border-slate-750 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition">
              <input
                type="checkbox"
                checked={packagingSealed}
                onChange={e => setPackagingSealed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  Packaging & Anti-Rust VCI Sealed
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Finished parts packaged in vapor corrosion inhibitor bags with silica gel pouches and clean outer carton labeling.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition">
              <input
                type="checkbox"
                checked={barcodeVerified}
                onChange={e => setBarcodeVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                  2D DataMatrix & Shipping Label Verified
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Optical scanner confirmed 100% readability of Part SKU, Serial / Lot number, and Customer PO barcode tags.
                </p>
              </div>
            </label>
          </div>

          {/* Inspector Notes */}
          <div className="p-4 bg-slate-850/50 border border-slate-750 rounded-xl">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Inspector Notes & Remarks
            </label>
            <textarea
              rows={2}
              value={inspectorNotes}
              onChange={e => setInspectorNotes(e.target.value)}
              placeholder="Enter visual observations, tool wear notes, or sampling specifics..."
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            {order.defectSummary.critical > 0 ? (
              <span className="text-rose-400 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-4 h-4" />
                {order.defectSummary.critical} Critical Defects Detected!
              </span>
            ) : pendingCount > 0 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {pendingCount} items remaining to inspect
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                100% Checklist Items Conforming
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Exit Workbench
            </button>

            {/* Quality Authority Sign-Off Button */}
            <button
              onClick={() => onOpenSignOffModal(order)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition active:scale-95"
            >
              <Award className="w-4 h-4" />
              Quality Authority Sign-Off & Release Gate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
