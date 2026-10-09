// src/components/bom-multilevel/BomNodeEditorModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Layers, 
  Boxes, 
  Tag, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { MultiLevelBomNode, BomItemType } from '../../types/multiLevelBom';

interface BomNodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeData: Partial<MultiLevelBomNode>) => void;
  parentNode?: MultiLevelBomNode | null;
  existingNode?: MultiLevelBomNode | null;
  isReadOnly?: boolean;
}

export const BomNodeEditorModal: React.FC<BomNodeEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parentNode,
  existingNode,
  isReadOnly = false
}) => {
  const isEditing = Boolean(existingNode);

  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<BomItemType>('manufactured');
  const [quantityPerParent, setQuantityPerParent] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [materialGrade, setMaterialGrade] = useState('');
  const [scrapFactorPercent, setScrapFactorPercent] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(1);
  const [workCenterOrSupplier, setWorkCenterOrSupplier] = useState('');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [drawingRevision, setDrawingRevision] = useState('A');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingNode) {
      setPartNumber(existingNode.partNumber || '');
      setPartName(existingNode.partName || '');
      setDescription(existingNode.description || '');
      setItemType(existingNode.itemType || 'manufactured');
      setQuantityPerParent(existingNode.quantityPerParent || 1);
      setUnit(existingNode.unit || 'pcs');
      setMaterialGrade(existingNode.materialGrade || '');
      setScrapFactorPercent(existingNode.scrapFactorPercent || 0);
      setUnitCost(existingNode.unitCost || 0);
      setLeadTimeDays(existingNode.leadTimeDays || 1);
      setWorkCenterOrSupplier(existingNode.workCenterOrSupplier || '');
      setDrawingNumber(existingNode.drawingNumber || '');
      setDrawingRevision(existingNode.drawingRevision || 'A');
      setEffectiveFrom(existingNode.effectiveFrom || '');
      setEffectiveTo(existingNode.effectiveTo || '');
      setNotes(existingNode.notes || '');
    } else {
      // New child node defaults
      setPartNumber('');
      setPartName('');
      setDescription('');
      setItemType(parentNode ? 'manufactured' : 'assembly');
      setQuantityPerParent(1);
      setUnit('pcs');
      setMaterialGrade('');
      setScrapFactorPercent(0);
      setUnitCost(100);
      setLeadTimeDays(3);
      setWorkCenterOrSupplier('');
      setDrawingNumber('');
      setDrawingRevision('A.0');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setEffectiveTo('');
      setNotes('');
    }
    setErrors({});
  }, [existingNode, parentNode, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!partNumber.trim()) errs.partNumber = 'Part number is required';
    if (!partName.trim()) errs.partName = 'Part / component name is required';
    if (quantityPerParent <= 0) errs.quantityPerParent = 'Quantity must be greater than 0';
    if (unitCost < 0) errs.unitCost = 'Unit cost cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validate()) return;

    onSave({
      partNumber: partNumber.trim().toUpperCase(),
      partName: partName.trim(),
      description: description.trim(),
      itemType,
      quantityPerParent: Number(quantityPerParent),
      unit,
      materialGrade: materialGrade.trim(),
      scrapFactorPercent: Number(scrapFactorPercent),
      unitCost: Number(unitCost),
      leadTimeDays: Number(leadTimeDays),
      workCenterOrSupplier: workCenterOrSupplier.trim(),
      drawingNumber: drawingNumber.trim(),
      drawingRevision: drawingRevision.trim(),
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: effectiveTo || undefined,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isEditing ? 'Edit BOM Node' : 'Add Child Component'}
                {parentNode && !isEditing && (
                  <span className="text-xs font-normal text-slate-400">
                    under <span className="font-mono text-indigo-300 font-semibold">{parentNode.partNumber}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {isReadOnly ? 'Viewing component specifications (Read-Only)' : 'Configure component specifications, effectivity, unit costing & work center'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Core Part Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Part / Item Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. PRT-CAR-FLG-01"
                className={`w-full bg-slate-800/90 border ${
                  errors.partNumber ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              {errors.partNumber && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.partNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Component / Item Type <span className="text-rose-400">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={itemType}
                onChange={(e) => setItemType(e.target.value as BomItemType)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="assembly">Top Assembly (Tier 0)</option>
                <option value="sub_assembly">Sub-Assembly (Tier 1/2)</option>
                <option value="manufactured">Manufactured Part (In-house)</option>
                <option value="raw_material">Raw Material (Bar / Plate / Billet)</option>
                <option value="bought_out">Bought-Out Component (Bearings/Motors)</option>
                <option value="hardware">Standard Hardware (Fasteners/Seals/Shims)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Part Name / Label <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g. Planetary Carrier Flange"
              className={`w-full bg-slate-800/90 border ${
                errors.partName ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            {errors.partName && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.partName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Engineering specifications, surface treatment, hardening, or tolerance..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Section 2: Quantities, Cost, and Scrap */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Quantities & Cost Parameters
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Qty / Parent <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  disabled={isReadOnly}
                  value={quantityPerParent}
                  onChange={(e) => setQuantityPerParent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs, kg, m, set"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  disabled={isReadOnly}
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Scrap Factor (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={isReadOnly}
                  value={scrapFactorPercent}
                  onChange={(e) => setScrapFactorPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Material Grade / Alloy
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={materialGrade}
                  onChange={(e) => setMaterialGrade(e.target.value)}
                  placeholder="e.g. EN24T Alloy / EN-GJS-500-7"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Center or Supplier
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={workCenterOrSupplier}
                  onChange={(e) => setWorkCenterOrSupplier(e.target.value)}
                  placeholder="e.g. VMC 5-Axis #01 or SKF Bearings"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Engineering Drawings & Effectivity Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                Drawing Reference
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Drawing #</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={drawingNumber}
                    onChange={(e) => setDrawingNumber(e.target.value)}
                    placeholder="DWG-CAR-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Dwg Rev</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={drawingRevision}
                    onChange={(e) => setDrawingRevision(e.target.value)}
                    placeholder="B.1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  min="0"
                  disabled={isReadOnly}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Effectivity Date Range
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Effective From</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Effective To <span className="text-slate-500 font-normal">(Leave blank for ongoing)</span>
                </label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Engineering Notes / Revision Comments
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scalloped pockets for weight reduction per ECO-2026-0031"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            Cancel
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md hover:shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Add to BOM'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
