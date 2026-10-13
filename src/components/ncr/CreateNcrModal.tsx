// src/components/ncr/CreateNcrModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  ShieldAlert,
  AlertTriangle,
  Layers,
  MapPin,
  Building2,
  Calendar,
  Camera,
  DollarSign
} from 'lucide-react';
import {
  NcrRecord,
  NcrSource,
  NcrSeverity,
  DefectCategory
} from '../../types/ncr';

interface CreateNcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNcr: (data: Partial<NcrRecord>) => void;
}

export const CreateNcrModal: React.FC<CreateNcrModalProps> = ({
  isOpen,
  onClose,
  onCreateNcr
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [source, setSource] = useState<NcrSource>('shopfloor');
  const [partSku, setPartSku] = useState('GEAR-SPUR-M4');
  const [partName, setPartName] = useState('Forged Steel Spur Gear (Mod 4, 32T)');
  const [lotNumber, setLotNumber] = useState(`LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [workOrderNumber, setWorkOrderNumber] = useState(`WO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [defectCategory, setDefectCategory] = useState<DefectCategory>('dimension');
  const [severity, setSeverity] = useState<NcrSeverity>('major');
  const [affectedQuantity, setAffectedQuantity] = useState<number>(20);
  const [defectiveQuantity, setDefectiveQuantity] = useState<number>(2);
  const [defectDescription, setDefectDescription] = useState('');
  const [immediateContainment, setImmediateContainment] = useState(
    'Halted production run. Suspect lot segregated and red tagged into MRB quarantine rack.'
  );
  const [quarantineLocation, setQuarantineLocation] = useState('MRB Holding Bay - Shelf 02');
  const [customerName, setCustomerName] = useState('General Industrial Client');
  const [reportedBy, setReportedBy] = useState('Quality Inspector');
  const [financialImpactCopq, setFinancialImpactCopq] = useState<number>(250);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !defectDescription.trim()) return;

    onCreateNcr({
      title: title.trim(),
      source,
      partSku: partSku.trim().toUpperCase(),
      partName: partName.trim(),
      lotNumber: lotNumber.trim(),
      workOrderNumber: workOrderNumber.trim(),
      customerName: customerName.trim(),
      reportedBy: reportedBy.trim(),
      defectCategory,
      severity,
      affectedQuantity,
      defectiveQuantity,
      defectDescription: defectDescription.trim(),
      immediateContainment: immediateContainment.trim(),
      quarantineLocation: quarantineLocation.trim(),
      financialImpactCopq,
      capaRequired: severity === 'critical' || defectiveQuantity >= 5
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log Non-Conformance Report (NCR)</h2>
              <p className="text-xs text-slate-400">
                Register quality deviation, isolate non-conforming lot, and trigger MRB quarantine
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Non-Conformance Title / Issue Summary *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Flange Mounting Bore Oversize on CNC Machine 04"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Source, Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Origin Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as NcrSource)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="shopfloor">Shopfloor Production</option>
                <option value="ipqc">In-Process (IPQC)</option>
                <option value="iqc">Incoming Goods (IQC)</option>
                <option value="fqc">Final Quality (FQC)</option>
                <option value="spc">SPC Out-of-Control</option>
                <option value="customer_complaint">Customer RMA / Claim</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Defect Category</label>
              <select
                value={defectCategory}
                onChange={e => setDefectCategory(e.target.value as DefectCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="dimension">Dimensional Deviation</option>
                <option value="visual">Visual Defect / Burrs</option>
                <option value="surface_finish">Surface Roughness Ra</option>
                <option value="hardness_heat_treat">Hardness / Heat Treat</option>
                <option value="assembly">Assembly / Fastener</option>
                <option value="functional_leak">Functional / Pressure Leak</option>
                <option value="packaging_label">Packaging / Barcode</option>
                <option value="material_chemical">Material / Metallurgy</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Defect Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as NcrSeverity)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none font-bold"
              >
                <option value="critical" className="text-rose-400">Critical (Automatic CAPA)</option>
                <option value="major" className="text-amber-400">Major</option>
                <option value="minor" className="text-slate-300">Minor</option>
              </select>
            </div>
          </div>

          {/* Part SKU, Name, Lot, WO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-850/60 p-3 rounded-xl border border-slate-750">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Part SKU *</label>
              <input
                type="text"
                required
                value={partSku}
                onChange={e => setPartSku(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Part Description *</label>
              <input
                type="text"
                required
                value={partName}
                onChange={e => setPartName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Lot / Heat Number *</label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={e => setLotNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Work Order #</label>
              <input
                type="text"
                value={workOrderNumber}
                onChange={e => setWorkOrderNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Quantities & Financial Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Total Batch Quantity</label>
              <input
                type="number"
                required
                value={affectedQuantity}
                onChange={e => setAffectedQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Defective Units Count *</label>
              <input
                type="number"
                required
                value={defectiveQuantity}
                onChange={e => setDefectiveQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Est. COPQ Financial Loss ($)</label>
              <input
                type="number"
                value={financialImpactCopq}
                onChange={e => setFinancialImpactCopq(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Detailed Technical Defect Description *</label>
            <textarea
              rows={2}
              required
              value={defectDescription}
              onChange={e => setDefectDescription(e.target.value)}
              placeholder="State measured dimensions vs specification, frequency of failure, tooling condition..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none text-xs"
            />
          </div>

          {/* Quarantine & Containment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Immediate Containment Action *</label>
              <input
                type="text"
                required
                value={immediateContainment}
                onChange={e => setImmediateContainment(e.target.value)}
                placeholder="e.g. Lot red tagged and quarantined to MRB cage"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Quarantine Physical Location *</label>
              <input
                type="text"
                required
                value={quarantineLocation}
                onChange={e => setQuarantineLocation(e.target.value)}
                placeholder="e.g. MRB Cage Rack B-02"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Reporter & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Reported By *</label>
              <input
                type="text"
                required
                value={reportedBy}
                onChange={e => setReportedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Client / Customer Context</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-rose-600/25 transition active:scale-95"
            >
              Log NCR & Lock Quarantine
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
