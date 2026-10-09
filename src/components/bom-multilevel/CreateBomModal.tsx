// src/components/bom-multilevel/CreateBomModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Save, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

interface CreateBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    assemblyPartNumber: string;
    assemblyName: string;
    description: string;
    category: string;
    unitCost?: number;
  }) => Promise<any>;
}

export const CreateBomModal: React.FC<CreateBomModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [assemblyPartNumber, setAssemblyPartNumber] = useState('');
  const [assemblyName, setAssemblyName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Power Transmission & Gearboxes');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assemblyPartNumber.trim() || !assemblyName.trim()) {
      setError('Part number and assembly name are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreate({
        assemblyPartNumber: assemblyPartNumber.trim().toUpperCase(),
        assemblyName: assemblyName.trim(),
        description: description.trim(),
        category,
        unitCost: Number(unitCost) || 0
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create BOM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Multi-Level BOM</h3>
              <p className="text-xs text-slate-400">Initialize top-level product structure and Rev A.0 draft</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assembly Part Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={assemblyPartNumber}
              onChange={(e) => setAssemblyPartNumber(e.target.value)}
              placeholder="e.g. ASM-HYD-CYL-80"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assembly Name / Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={assemblyName}
              onChange={(e) => setAssemblyName(e.target.value)}
              placeholder="e.g. Heavy Duty Hydraulic Cylinder 80mm Bore"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Power Transmission & Gearboxes">Power Transmission & Gearboxes</option>
                <option value="High Pressure Pumps">High Pressure Pumps</option>
                <option value="Hydraulic Systems">Hydraulic Systems</option>
                <option value="Fabrications & Base Skids">Fabrications & Base Skids</option>
                <option value="Precision Assemblies">Precision Assemblies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assembly Direct Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Engineering Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary specifications, operating pressures, capacity..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Create BOM Structure'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
