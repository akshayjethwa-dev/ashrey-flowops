// src/components/quality-holds/PlaceQualityHoldModal.tsx

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  ShieldAlert,
  Layers,
  MapPin,
  User,
  Hash,
  AlertTriangle,
  Building2,
  FileText
} from 'lucide-react';
import {
  QualityHoldTargetType,
  QualityHoldSeverity,
  QualityHoldReasonCategory,
  QualityHoldRecord
} from '../../types/qualityHold';
import { useAuth } from '../../hooks/useAuth';

interface PlaceQualityHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: Parameters<typeof import('../../services/qualityHoldService').qualityHoldService.placeHold>[0]) => void;
  prefill?: {
    targetType?: QualityHoldTargetType;
    targetId?: string;
    targetNumber?: string;
    partName?: string;
    partCode?: string;
    customerName?: string;
    quantity?: number;
    unit?: string;
    salesOrderId?: string;
    salesOrderNumber?: string;
    workOrderNumber?: string;
    batchNumber?: string;
    inspectionRef?: string;
    ncrId?: string;
    defaultReason?: string;
  };
}

export const PlaceQualityHoldModal: React.FC<PlaceQualityHoldModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefill
}) => {
  const { profile } = useAuth();

  const [targetType, setTargetType] = useState<QualityHoldTargetType>(prefill?.targetType || 'work_order');
  const [targetNumber, setTargetNumber] = useState(prefill?.targetNumber || prefill?.workOrderNumber || 'WO-2026-0001');
  const [targetId, setTargetId] = useState(prefill?.targetId || 'target-01');
  const [partName, setPartName] = useState(prefill?.partName || 'Gear Blank — 42T');
  const [partCode, setPartCode] = useState(prefill?.partCode || 'GB-42T');
  const [customerName, setCustomerName] = useState(prefill?.customerName || 'Tata Motors');
  const [quantity, setQuantity] = useState<number>(prefill?.quantity || 50);
  const [unit, setUnit] = useState(prefill?.unit || 'pcs');

  const [severity, setSeverity] = useState<QualityHoldSeverity>('critical');
  const [holdReasonCategory, setHoldReasonCategory] = useState<QualityHoldReasonCategory>('dimensional_deviation');
  const [holdReason, setHoldReason] = useState(prefill?.defaultReason || 'Pitch circle diameter runout exceeds drawing tolerance by +0.045mm.');
  const [holdDescription, setHoldDescription] = useState(
    'Coordinate measuring machine (CMM) inspection detected out-of-tolerance runout on PCD. All parts in this lot flagged for quarantine containment to prevent downstream assembly and dispatch.'
  );
  const [location, setLocation] = useState('Quarantine Bay 03 — Red Tag Cage');
  const [placedBy, setPlacedBy] = useState(profile?.name || 'Rajesh Varma');
  const [placedByRole, setPlacedByRole] = useState(profile?.role ? `${profile.role.toUpperCase()} (Quality Team)` : 'Senior Quality Inspector');
  const [inspectionRef, setInspectionRef] = useState(prefill?.inspectionRef || '');
  const [ncrId, setNcrId] = useState(prefill?.ncrId || '');
  const [preventProductionProgression, setPreventProductionProgression] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNumber.trim() || !holdReason.trim() || !location.trim()) {
      alert('Please fill in all mandatory fields (Target identifier, reason, location).');
      return;
    }

    onSubmit({
      targetType,
      targetId: targetId || targetNumber,
      targetNumber: targetNumber.trim(),
      partName: partName.trim(),
      partCode: partCode.trim() || undefined,
      customerName: customerName.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'pcs',
      severity,
      holdReasonCategory,
      holdReason: holdReason.trim(),
      holdDescription: holdDescription.trim(),
      location: location.trim(),
      placedBy: placedBy.trim(),
      placedByRole: placedByRole.trim(),
      inspectionRef: inspectionRef.trim() || undefined,
      ncrId: ncrId.trim() || undefined,
      preventProductionProgression,
      workOrderNumber: targetType === 'work_order' ? targetNumber : undefined,
      batchNumber: targetType === 'batch' ? targetNumber : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 p-5 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/40">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Enact Quality Hold &amp; Containment</h2>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700">
                  Dispatch Lockout Gate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ISO 9001:2015 §8.7 &amp; IATF 16949 compliant quarantine: Flags batch/WO and halts logistics release.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Top Banner Alert */}
          <div className="bg-rose-950/40 border border-rose-900/70 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <span className="font-bold">Strict Dispatch Gate Enforcement:</span> Placing this hold will immediately
              freeze dispatch creation and logistics shipping for this batch/WO. It can only be unlocked through a formal
              digital sign-off by an authorized Quality Manager.
            </div>
          </div>

          {/* Target Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Entity Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as QualityHoldTargetType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              >
                <option value="work_order">Work Order (WO)</option>
                <option value="batch">Manufacturing Batch / Lot</option>
                <option value="lot">Raw Material Heat / Lot</option>
                <option value="sales_order">Sales Order (SO)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Identifier / Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={targetNumber}
                onChange={e => {
                  setTargetNumber(e.target.value);
                  setTargetId(e.target.value);
                }}
                placeholder="e.g. WO-2026-0001, BATCH-92"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity on Hold <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                  className="w-2/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="pcs"
                  className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Part & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Part / Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={partName}
                onChange={e => setPartName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Part SKU / Code
              </label>
              <input
                type="text"
                value={partCode}
                onChange={e => setPartCode(e.target.value)}
                placeholder="e.g. GB-42T"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Reason & Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hold Severity Level <span className="text-rose-400">*</span>
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as QualityHoldSeverity)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="critical">🔴 CRITICAL (Immediate Stop / Customer Safety)</option>
                <option value="major">🟠 MAJOR (Functionality / Tolerancing Out)</option>
                <option value="moderate">🟡 MODERATE (Cosmetic / Minor Drawing Deviation)</option>
                <option value="minor">⚪ MINOR (Packaging / Labeling / Paperwork)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hold Reason Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={holdReasonCategory}
                onChange={e => setHoldReasonCategory(e.target.value as QualityHoldReasonCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="dimensional_deviation">Dimensional Deviation (Out of Tolerance)</option>
                <option value="inspection_failure">Final / In-Process Inspection Checklist Failure</option>
                <option value="material_chemistry">Material Chemistry / Hardness Failure</option>
                <option value="visual_defect">Visual / Surface Defect (Cracks, Burrs, Porosity)</option>
                <option value="surface_finish">Surface Finish (Ra Roughness / Coating)</option>
                <option value="expired_gage_calibration">Expired Gage Calibration Used</option>
                <option value="open_ncr_capa">Pending Open NCR / CAPA Investigation</option>
                <option value="process_parameter_drift">Shopfloor CNC Parameter Drift</option>
                <option value="customer_hold">Customer Requested Hold / Revision Change</option>
                <option value="containment_investigation">Containment &amp; Suspect Lot Screening</option>
              </select>
            </div>
          </div>

          {/* Short Reason & Technical Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hold Reason Summary <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={holdReason}
              onChange={e => setHoldReason(e.target.value)}
              placeholder="e.g. Concentricity runout on bearing seat exceeds +0.035mm limit"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Technical Non-Conformance Description &amp; Defect Notes
            </label>
            <textarea
              rows={3}
              value={holdDescription}
              onChange={e => setHoldDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          {/* Containment Location & Authority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Containment Location <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Quarantine Bay 03 — Red Tag Cage"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Flagged By Inspector / Authority
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={placedBy}
                  onChange={e => setPlacedBy(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Traceability references */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Associated NCR ID (Optional)
              </label>
              <input
                type="text"
                value={ncrId}
                onChange={e => setNcrId(e.target.value)}
                placeholder="e.g. NCR-2026-0104"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Inspection Ref / Order # (Optional)
              </label>
              <input
                type="text"
                value={inspectionRef}
                onChange={e => setInspectionRef(e.target.value)}
                placeholder="e.g. FQC-2026-0088 or IPQC-TASK-12"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Safety Checkbox */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="haltShopfloor"
                checked={preventProductionProgression}
                onChange={e => setPreventProductionProgression(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded border-slate-600 focus:ring-rose-500 bg-slate-900"
              />
              <label htmlFor="haltShopfloor" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white">Halt Machine Progression:</span> Freeze all subsequent shopfloor CNC/assembly steps for this lot
              </label>
            </div>
            <span className="text-[10px] text-rose-400 font-mono uppercase font-bold tracking-wider">
              Enforced Containment
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase font-extrabold tracking-wider px-5 py-2.5 rounded-lg shadow-lg shadow-rose-900/40 flex items-center gap-2 transition"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Lock Quality Hold &amp; Block Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
