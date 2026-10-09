// src/components/routings/OperationMasterModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Layers, 
  Building2, 
  Clock, 
  Award, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { 
  OperationMasterItem, 
  WorkCenter, 
  OperationType, 
  SkillLevel 
} from '../../types/routing';

interface OperationMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (op: OperationMasterItem) => void;
  existingItem?: OperationMasterItem | null;
  workCenters: WorkCenter[];
}

export const OperationMasterModal: React.FC<OperationMasterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingItem,
  workCenters
}) => {
  const isEditing = Boolean(existingItem);

  const [operationCode, setOperationCode] = useState('');
  const [name, setName] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('machining');
  const [defaultWorkCenterId, setDefaultWorkCenterId] = useState('');
  const [defaultSetupTimeMinutes, setDefaultSetupTimeMinutes] = useState<number>(30);
  const [defaultCycleTimeMinutes, setDefaultCycleTimeMinutes] = useState<number>(10);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('skilled_operator');
  const [certifications, setCertifications] = useState('');
  const [minCrewSize, setMinCrewSize] = useState<number>(1);
  const [requiredPpe, setRequiredPpe] = useState('Safety Glasses, Cut-Resistant Gloves');
  const [standardInstructions, setStandardInstructions] = useState('');
  const [qualityCheckpoints, setQualityCheckpoints] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingItem) {
      setOperationCode(existingItem.operationCode);
      setName(existingItem.name);
      setOperationType(existingItem.operationType);
      setDefaultWorkCenterId(existingItem.defaultWorkCenterId);
      setDefaultSetupTimeMinutes(existingItem.defaultSetupTimeMinutes);
      setDefaultCycleTimeMinutes(existingItem.defaultCycleTimeMinutes);
      setSkillLevel(existingItem.skillRequirement.level);
      setCertifications((existingItem.skillRequirement.certifications || []).join(', '));
      setMinCrewSize(existingItem.skillRequirement.minCrewSize || 1);
      setRequiredPpe((existingItem.skillRequirement.requiredPpe || []).join(', '));
      setStandardInstructions(existingItem.standardInstructions);
      setQualityCheckpoints((existingItem.qualityCheckpoints || []).join('; '));
      setSafetyNotes(existingItem.safetyNotes || '');
    } else {
      setOperationCode('');
      setName('');
      setOperationType('machining');
      setDefaultWorkCenterId(workCenters[0]?.id || '');
      setDefaultSetupTimeMinutes(30);
      setDefaultCycleTimeMinutes(10);
      setSkillLevel('skilled_operator');
      setCertifications('');
      setMinCrewSize(1);
      setRequiredPpe('Safety Glasses, Safety Footwear');
      setStandardInstructions('');
      setQualityCheckpoints('');
      setSafetyNotes('');
    }
    setErrors({});
  }, [existingItem, isOpen, workCenters]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!operationCode.trim()) errs.operationCode = 'Operation code is required';
    if (!name.trim()) errs.name = 'Operation title is required';
    if (!defaultWorkCenterId) errs.defaultWorkCenterId = 'Work center is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedWc = workCenters.find(w => w.id === defaultWorkCenterId);

    const masterItem: OperationMasterItem = {
      id: existingItem?.id || `op_master_${Date.now()}`,
      operationCode: operationCode.trim().toUpperCase(),
      name: name.trim(),
      operationType,
      defaultWorkCenterId,
      defaultWorkCenterName: matchedWc?.name || 'Default Work Center',
      defaultSetupTimeMinutes: Number(defaultSetupTimeMinutes) || 0,
      defaultCycleTimeMinutes: Number(defaultCycleTimeMinutes) || 0,
      skillRequirement: {
        level: skillLevel,
        certifications: certifications ? certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
        minCrewSize: Number(minCrewSize) || 1,
        requiredPpe: requiredPpe ? requiredPpe.split(',').map(s => s.trim()).filter(Boolean) : []
      },
      standardInstructions: standardInstructions.trim(),
      qualityCheckpoints: qualityCheckpoints ? qualityCheckpoints.split(';').map(s => s.trim()).filter(Boolean) : [],
      safetyNotes: safetyNotes.trim(),
      updatedAt: new Date().toISOString()
    };

    onSave(masterItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Master Operation' : 'Create Standard Master Operation'}
              </h3>
              <p className="text-xs text-slate-400">
                Define reusable operation template for manufacturing routings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operation Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={operationCode}
                onChange={(e) => setOperationCode(e.target.value)}
                placeholder="e.g. OP-CUT-01"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Process Type</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cutting">Cutting & Blanking</option>
                <option value="welding">Welding & Fabrication</option>
                <option value="turning">CNC Turning</option>
                <option value="milling">VMC Milling</option>
                <option value="machining">General Machining</option>
                <option value="heat_treatment">Heat Treatment</option>
                <option value="surface_treatment">Surface Treatment</option>
                <option value="inspection">Inspection & Quality</option>
                <option value="assembly">Assembly</option>
                <option value="packing">Preservation & Packing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operation Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Multi-Pass TIG/MIG Structural Welding"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Work Center</label>
              <select
                value={defaultWorkCenterId}
                onChange={(e) => setDefaultWorkCenterId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {workCenters.map(wc => (
                  <option key={wc.id} value={wc.id}>
                    {wc.code} — {wc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Setup (mins)</label>
              <input
                type="number"
                min="0"
                value={defaultSetupTimeMinutes}
                onChange={(e) => setDefaultSetupTimeMinutes(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Cycle / Pc (mins)</label>
              <input
                type="number"
                min="0"
                value={defaultCycleTimeMinutes}
                onChange={(e) => setDefaultCycleTimeMinutes(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Required Skill Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="helper">Helper</option>
                <option value="semi_skilled">Semi-Skilled</option>
                <option value="skilled_operator">Skilled Operator</option>
                <option value="senior_technician">Senior Technician</option>
                <option value="certified_welder">Certified Welder</option>
                <option value="certified_inspector">Certified Inspector</option>
                <option value="cnc_programmer">CNC Programmer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Certifications Required</label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g. AWS D1.1, Fanuc Level II"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Standard Work Instructions (SOP)</label>
            <textarea
              rows={3}
              value={standardInstructions}
              onChange={(e) => setStandardInstructions(e.target.value)}
              placeholder="Detailed operating instructions for shopfloor operators..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Quality Checkpoints (semicolon separated)
            </label>
            <input
              type="text"
              value={qualityCheckpoints}
              onChange={(e) => setQualityCheckpoints(e.target.value)}
              placeholder="e.g. 100% check fillet throat ≥ 8mm; zero porosity; Dye Penetrant Test"
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
              <span>Save Master Operation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
