// src/components/routings/CreateRoutingModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { ProductRouting } from '../../types/routing';

interface CreateRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (routingData: Partial<ProductRouting>) => void;
}

export const CreateRoutingModal: React.FC<CreateRoutingModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [routingNumber, setRoutingNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Machined Components');
  const [targetBatchSize, setTargetBatchSize] = useState<number>(50);
  const [revision, setRevision] = useState('Rev 1.0');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [drawingRevision, setDrawingRevision] = useState('A.0');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!routingNumber.trim()) errs.routingNumber = 'Routing number is required';
    if (!partNumber.trim()) errs.partNumber = 'Part number is required';
    if (!partName.trim()) errs.partName = 'Part name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onCreate({
      routingNumber: routingNumber.trim().toUpperCase(),
      partNumber: partNumber.trim().toUpperCase(),
      partName: partName.trim(),
      description: description.trim(),
      category,
      targetBatchSize: Number(targetBatchSize) || 50,
      revision: revision.trim(),
      status: 'draft',
      drawingNumber: drawingNumber.trim(),
      drawingRevision: drawingRevision.trim(),
      notes: notes.trim(),
      operations: []
    });

    onClose();
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
              <h3 className="text-base font-bold text-white">Create New Process Routing</h3>
              <p className="text-xs text-slate-400">Define manufacturing operation sequence plan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Routing Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="e.g. RT-SFT-45-01"
                className={`w-full bg-slate-800 border ${
                  errors.routingNumber ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Linked Part Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. PRT-SFT-45MM"
                className={`w-full bg-slate-800 border ${
                  errors.partNumber ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Part Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g. Precision Drive Shaft 45mm Diameter"
              className={`w-full bg-slate-800 border ${
                errors.partName ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
                <option value="Machined Components">Machined Components</option>
                <option value="Welded Assemblies">Welded Assemblies</option>
                <option value="Gearboxes & Transmissions">Gearboxes & Transmissions</option>
                <option value="High Pressure Pumps">High Pressure Pumps</option>
                <option value="Fabrications & Skids">Fabrications & Skids</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Batch Size</label>
              <input
                type="number"
                min="1"
                value={targetBatchSize}
                onChange={(e) => setTargetBatchSize(parseInt(e.target.value) || 50)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Drawing Number</label>
              <input
                type="text"
                value={drawingNumber}
                onChange={(e) => setDrawingNumber(e.target.value)}
                placeholder="DWG-SFT-45"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Revision</label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="Rev 1.0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Process Plan Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard manufacturing process with in-house induction hardening..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Create Routing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
