// src/components/fqc/FqcTemplateEditorModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  FileText,
  Layers,
  Ruler,
  Award,
  Sparkles
} from 'lucide-react';
import {
  FqcChecklistTemplate,
  FqcChecklistItem,
  FqcItemCategory,
  FqcCriticalLevel
} from '../../types/fqc';

interface FqcTemplateEditorModalProps {
  template: FqcChecklistTemplate | null | 'new';
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: FqcChecklistTemplate) => void;
}

export const FqcTemplateEditorModal: React.FC<FqcTemplateEditorModalProps> = ({
  template,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !template) return null;

  const isNew = template === 'new';

  const [partSku, setPartSku] = useState(isNew ? '' : template.partSku);
  const [partName, setPartName] = useState(isNew ? '' : template.partName);
  const [productFamily, setProductFamily] = useState(isNew ? 'Machined Components' : template.productFamily);
  const [version, setVersion] = useState(isNew ? 'v1.0' : template.version);
  const [sampleSizeRule, setSampleSizeRule] = useState<FqcChecklistTemplate['sampleSizeRule']>(
    isNew ? 'ansi_asq_z1.4_level_ii' : template.sampleSizeRule
  );
  const [aqlLevel, setAqlLevel] = useState(isNew ? '0.65 Critical / 1.5 Major' : template.aqlLevel);
  const [standardReference, setStandardReference] = useState(
    isNew ? 'ISO 9001:2015, IATF 16949 Section 8.6' : template.standardReference
  );

  const [items, setItems] = useState<FqcChecklistItem[]>(
    isNew
      ? [
          {
            id: `item-${Date.now()}-1`,
            title: 'Critical Mounting Bore / Diameter',
            criteria: 'Internal bore within tolerance drawing spec ±0.015mm',
            category: 'dimension',
            criticalLevel: 'critical',
            inspectionMethod: 'Bore Micrometer / Caliper',
            isMeasurement: true,
            targetNominal: 50.0,
            upperTolerance: 0.015,
            lowerTolerance: -0.015,
            unit: 'mm',
            result: 'pending'
          },
          {
            id: `item-${Date.now()}-2`,
            title: 'Visual Surface Finish & Burr Inspection',
            criteria: '100% burr-free, zero scratches, gouges, or oxidation spots',
            category: 'visual',
            criticalLevel: 'major',
            inspectionMethod: 'Visual Inspection 100%',
            isMeasurement: false,
            result: 'pending'
          },
          {
            id: `item-${Date.now()}-3`,
            title: 'Anti-Rust Packaging & Labeling',
            criteria: 'Sealed VCI barrier bag with customer barcode label',
            category: 'packaging',
            criticalLevel: 'major',
            inspectionMethod: 'Visual & Optical Barcode Scanner',
            isMeasurement: false,
            result: 'pending'
          }
        ]
      : template.items
  );

  const handleAddItem = () => {
    const newItem: FqcChecklistItem = {
      id: `item-${Date.now()}`,
      title: 'New Inspection Item',
      criteria: 'Specification requirement description',
      category: 'dimension',
      criticalLevel: 'major',
      inspectionMethod: 'Standard Measurement Instrument',
      isMeasurement: false,
      result: 'pending'
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<FqcChecklistItem>) => {
    setItems(items.map(it => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partSku.trim() || !partName.trim()) return;

    const savedTemplate: FqcChecklistTemplate = {
      id: isNew ? `tmpl-${Date.now()}` : template.id,
      partSku: partSku.trim().toUpperCase(),
      partName: partName.trim(),
      productFamily: productFamily.trim(),
      version: version.trim(),
      sampleSizeRule,
      aqlLevel: aqlLevel.trim(),
      standardReference: standardReference.trim(),
      createdBy: isNew ? 'Lead Quality Engineer' : template.createdBy,
      createdAt: isNew ? new Date().toISOString() : template.createdAt,
      updatedAt: new Date().toISOString(),
      items
    };

    onSave(savedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isNew ? 'Create FQC Checklist Template' : `Edit FQC Checklist: ${template.partSku}`}
              </h2>
              <p className="text-xs text-slate-400">
                Configure SKU-specific final inspection parameters, nominal tolerances, and AQL criteria
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* SKU & Product Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-850/60 p-4 rounded-xl border border-slate-750">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Part SKU / Code *</label>
              <input
                type="text"
                required
                value={partSku}
                onChange={e => setPartSku(e.target.value)}
                placeholder="e.g. GEAR-SPUR-M4"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">Part / Finished Good Name *</label>
              <input
                type="text"
                required
                value={partName}
                onChange={e => setPartName(e.target.value)}
                placeholder="e.g. Forged Steel Spur Gear (Mod 4, 32T)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Product Family</label>
              <input
                type="text"
                value={productFamily}
                onChange={e => setProductFamily(e.target.value)}
                placeholder="e.g. Transmission Assemblies"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Sampling Rule</label>
              <select
                value={sampleSizeRule}
                onChange={e => setSampleSizeRule(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="100%_inspection">100% 1-by-1 Inspection</option>
                <option value="ansi_asq_z1.4_level_ii">ANSI/ASQ Z1.4 Normal Level II</option>
                <option value="sampling_c0">Zero-Defect Sampling (C=0)</option>
                <option value="custom">Custom Fixed Sampling</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">AQL Threshold</label>
              <input
                type="text"
                value={aqlLevel}
                onChange={e => setAqlLevel(e.target.value)}
                placeholder="e.g. 0.65 Critical / 1.5 Major"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Governing Standard</label>
              <input
                type="text"
                value={standardReference}
                onChange={e => setStandardReference(e.target.value)}
                placeholder="e.g. ISO 9001:2015, DIN 3962"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Template Version</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="e.g. v3.2"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Checklist Items Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-sm">
                Checklist Inspection Characteristics ({items.length} items)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Characteristic
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="p-3.5 bg-slate-850 border border-slate-750 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-cyan-400 font-bold text-xs">#{idx + 1}</span>

                    <input
                      type="text"
                      placeholder="Title (e.g. Internal Bore H7)"
                      value={it.title}
                      onChange={e => handleUpdateItem(it.id, { title: e.target.value })}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:border-cyan-500 focus:outline-none"
                    />

                    <select
                      value={it.category}
                      onChange={e => handleUpdateItem(it.id, { category: e.target.value as FqcItemCategory })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="dimension">Dimension</option>
                      <option value="visual">Visual</option>
                      <option value="functional">Functional</option>
                      <option value="cleanliness">Cleanliness</option>
                      <option value="packaging">Packaging</option>
                      <option value="documentation">Documentation</option>
                    </select>

                    <select
                      value={it.criticalLevel}
                      onChange={e => handleUpdateItem(it.id, { criticalLevel: e.target.value as FqcCriticalLevel })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Criteria / Requirement specification"
                    value={it.criteria}
                    onChange={e => handleUpdateItem(it.id, { criteria: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={it.isMeasurement}
                        onChange={e => handleUpdateItem(it.id, { isMeasurement: e.target.checked })}
                        className="rounded text-cyan-600 bg-slate-800 border-slate-700"
                      />
                      <span>Numeric Measurement</span>
                    </label>

                    {it.isMeasurement && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="Nominal"
                          value={it.targetNominal ?? ''}
                          onChange={e => handleUpdateItem(it.id, { targetNominal: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                        />
                        <span className="text-slate-400">+</span>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="+Tol"
                          value={it.upperTolerance ?? ''}
                          onChange={e => handleUpdateItem(it.id, { upperTolerance: parseFloat(e.target.value) || 0 })}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="-Tol"
                          value={it.lowerTolerance ?? ''}
                          onChange={e => handleUpdateItem(it.id, { lowerTolerance: parseFloat(e.target.value) || 0 })}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={it.unit || ''}
                          onChange={e => handleUpdateItem(it.id, { unit: e.target.value })}
                          className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-slate-500">Method:</span>
                      <input
                        type="text"
                        placeholder="e.g. Micrometer"
                        value={it.inspectionMethod}
                        onChange={e => handleUpdateItem(it.id, { inspectionMethod: e.target.value })}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-600/25 transition"
            >
              Save Checklist Template
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
