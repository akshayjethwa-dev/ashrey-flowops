// src/components/routings/RoutingOperationEditorModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Wrench, 
  Clock, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Award, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { 
  RoutingOperation, 
  WorkCenter, 
  OperationMasterItem, 
  OperationType, 
  SkillLevel 
} from '../../types/routing';

interface RoutingOperationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opData: Omit<RoutingOperation, 'id'>) => void;
  existingOperation?: RoutingOperation | null;
  nextSequenceNumber?: number;
  workCenters: WorkCenter[];
  operationMaster: OperationMasterItem[];
}

export const RoutingOperationEditorModal: React.FC<RoutingOperationEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingOperation,
  nextSequenceNumber = 10,
  workCenters,
  operationMaster
}) => {
  const isEditing = Boolean(existingOperation);

  const [sequenceNumber, setSequenceNumber] = useState<number>(nextSequenceNumber);
  const [operationCode, setOperationCode] = useState('');
  const [name, setName] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('machining');
  const [workCenterId, setWorkCenterId] = useState('');
  const [setupTimeMinutes, setSetupTimeMinutes] = useState<number>(30);
  const [cycleTimeMinutes, setCycleTimeMinutes] = useState<number>(10);
  const [queueTimeHours, setQueueTimeHours] = useState<number>(1);
  const [scrapRatePercent, setScrapRatePercent] = useState<number>(0.5);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('skilled_operator');
  const [crewSize, setCrewSize] = useState<number>(1);
  const [certificationsRequired, setCertificationsRequired] = useState('');
  const [instructions, setInstructions] = useState('');
  const [toolingFixtures, setToolingFixtures] = useState('');
  const [qualityInspectionCriteria, setQualityInspectionCriteria] = useState('');
  const [safetyPpe, setSafetyPpe] = useState('Safety Glasses, Safety Footwear');
  const [isSubcontracted, setIsSubcontracted] = useState(false);
  const [subcontractorName, setSubcontractorName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingOperation) {
      setSequenceNumber(existingOperation.sequenceNumber);
      setOperationCode(existingOperation.operationCode);
      setName(existingOperation.name);
      setOperationType(existingOperation.operationType);
      setWorkCenterId(existingOperation.workCenterId);
      setSetupTimeMinutes(existingOperation.setupTimeMinutes || 0);
      setCycleTimeMinutes(existingOperation.cycleTimeMinutes || 0);
      setQueueTimeHours(existingOperation.queueTimeHours || 0);
      setScrapRatePercent(existingOperation.scrapRatePercent || 0);
      setSkillLevel(existingOperation.skillLevel || 'skilled_operator');
      setCrewSize(existingOperation.crewSize || 1);
      setCertificationsRequired((existingOperation.certificationsRequired || []).join(', '));
      setInstructions(existingOperation.instructions || '');
      setToolingFixtures(existingOperation.toolingFixtures || '');
      setQualityInspectionCriteria(existingOperation.qualityInspectionCriteria || '');
      setSafetyPpe((existingOperation.safetyPpe || []).join(', '));
      setIsSubcontracted(existingOperation.isSubcontracted || false);
      setSubcontractorName(existingOperation.subcontractorName || '');
    } else {
      setSequenceNumber(nextSequenceNumber);
      setOperationCode('');
      setName('');
      setOperationType('machining');
      setWorkCenterId(workCenters[0]?.id || '');
      setSetupTimeMinutes(30);
      setCycleTimeMinutes(10);
      setQueueTimeHours(1);
      setScrapRatePercent(0.5);
      setSkillLevel('skilled_operator');
      setCrewSize(1);
      setCertificationsRequired('');
      setInstructions('');
      setToolingFixtures('');
      setQualityInspectionCriteria('');
      setSafetyPpe('Safety Glasses, Safety Footwear');
      setIsSubcontracted(false);
      setSubcontractorName('');
    }
    setErrors({});
  }, [existingOperation, nextSequenceNumber, isOpen, workCenters]);

  if (!isOpen) return null;

  // Handle auto-population from Operation Master item
  const handleSelectMasterOp = (masterId: string) => {
    const item = operationMaster.find(m => m.id === masterId);
    if (!item) return;

    setOperationCode(item.operationCode);
    setName(item.name);
    setOperationType(item.operationType);
    setSetupTimeMinutes(item.defaultSetupTimeMinutes);
    setCycleTimeMinutes(item.defaultCycleTimeMinutes);
    setSkillLevel(item.skillRequirement.level);
    setCrewSize(item.skillRequirement.minCrewSize);
    setCertificationsRequired((item.skillRequirement.certifications || []).join(', '));
    setSafetyPpe((item.skillRequirement.requiredPpe || []).join(', '));
    setInstructions(item.standardInstructions);
    setQualityInspectionCriteria((item.qualityCheckpoints || []).join('; '));

    // Match work center
    const matchedWc = workCenters.find(w => w.id === item.defaultWorkCenterId || w.name === item.defaultWorkCenterName);
    if (matchedWc) {
      setWorkCenterId(matchedWc.id);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Operation title is required';
    if (!operationCode.trim()) errs.operationCode = 'Operation code is required';
    if (!workCenterId) errs.workCenterId = 'Work center assignment is required';
    if (cycleTimeMinutes < 0) errs.cycleTimeMinutes = 'Cycle time cannot be negative';
    if (setupTimeMinutes < 0) errs.setupTimeMinutes = 'Setup time cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const chosenWc = workCenters.find(w => w.id === workCenterId);

    onSave({
      sequenceNumber: Number(sequenceNumber) || 10,
      operationCode: operationCode.trim().toUpperCase(),
      name: name.trim(),
      operationType,
      workCenterId,
      workCenterName: chosenWc?.name || 'Assigned Work Center',
      workCenterCode: chosenWc?.code || 'WC-GEN',
      setupTimeMinutes: Number(setupTimeMinutes) || 0,
      cycleTimeMinutes: Number(cycleTimeMinutes) || 0,
      queueTimeHours: Number(queueTimeHours) || 0,
      scrapRatePercent: Number(scrapRatePercent) || 0,
      skillLevel,
      crewSize: Number(crewSize) || 1,
      certificationsRequired: certificationsRequired ? certificationsRequired.split(',').map(s => s.trim()).filter(Boolean) : [],
      instructions: instructions.trim(),
      toolingFixtures: toolingFixtures.trim(),
      qualityInspectionCriteria: qualityInspectionCriteria.trim(),
      safetyPpe: safetyPpe ? safetyPpe.split(',').map(s => s.trim()).filter(Boolean) : [],
      isSubcontracted,
      subcontractorName: isSubcontracted ? subcontractorName.trim() : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isEditing ? `Edit Operation (Op ${existingOperation?.sequenceNumber})` : 'Add Operation Step'}
              </h3>
              <p className="text-xs text-slate-400">
                Define process sequence, work center assignment, cycle/setup times, and skill criteria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Preset Bar */}
        {!isEditing && operationMaster.length > 0 && (
          <div className="px-6 py-2.5 bg-indigo-950/20 border-b border-indigo-500/20 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-indigo-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Presets from Operation Master:
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) handleSelectMasterOp(e.target.value);
              }}
              defaultValue=""
              className="bg-slate-800 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-xs text-indigo-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>Select Master Operation Template...</option>
              {operationMaster.map(m => (
                <option key={m.id} value={m.id}>
                  {m.operationCode} — {m.name} ({m.defaultCycleTimeMinutes}m cycle)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Sequence & Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sequence # <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(parseInt(e.target.value) || 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operation Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={operationCode}
                onChange={(e) => setOperationCode(e.target.value)}
                placeholder="e.g. OP-CNC-01"
                className={`w-full bg-slate-800 border ${
                  errors.operationCode ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Process / Operation Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cutting">Cutting & Blanking</option>
                <option value="welding">Fabrication & Welding</option>
                <option value="turning">CNC Turning</option>
                <option value="milling">VMC / CNC Milling</option>
                <option value="machining">General Machining</option>
                <option value="heat_treatment">Heat Treatment</option>
                <option value="surface_treatment">Surface Treatment & Coating</option>
                <option value="inspection">Quality Inspection & Metrology</option>
                <option value="assembly">Sub-Assembly / Assembly</option>
                <option value="packing">Preservation & Packing</option>
                <option value="subcontract">Outside Subcontract Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operation Title / Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CNC 4-Axis Turning & Precision Bore Profiling"
              className={`w-full bg-slate-800 border ${
                errors.name ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Section 2: Work Center Assignment */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Work Center & Machine Assignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Work Center <span className="text-rose-400">*</span>
                </label>
                <select
                  value={workCenterId}
                  onChange={(e) => setWorkCenterId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {workCenters.map(wc => (
                    <option key={wc.id} value={wc.id}>
                      {wc.code} — {wc.name} (₹{wc.hourlyMachineRate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isSubcontracted}
                    onChange={(e) => setIsSubcontracted(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Subcontract to Outside Job-Worker</span>
                </label>

                {isSubcontracted && (
                  <input
                    type="text"
                    value={subcontractorName}
                    onChange={(e) => setSubcontractorName(e.target.value)}
                    placeholder="Vendor Name (e.g. Apex Heat Treat)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Times & Productivity */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Standard Process Times & Buffer Allowances
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Setup Time (mins) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={setupTimeMinutes}
                  onChange={(e) => setSetupTimeMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Cycle Time / Pc (mins) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cycleTimeMinutes}
                  onChange={(e) => setCycleTimeMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Queue / Cooling (hrs)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={queueTimeHours}
                  onChange={(e) => setQueueTimeHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Scrap Allowance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scrapRatePercent}
                  onChange={(e) => setScrapRatePercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Skill Requirements & Certifications */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              Skill Requirements & Operator Crew
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Required Skill Level
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="helper">Helper / Material Handler</option>
                  <option value="semi_skilled">Semi-Skilled Operator</option>
                  <option value="skilled_operator">Skilled Operator (CNC/Conventional)</option>
                  <option value="senior_technician">Senior Technician</option>
                  <option value="certified_welder">Certified Welder (AWS / IBR)</option>
                  <option value="certified_inspector">Certified Quality Inspector (CQI)</option>
                  <option value="cnc_programmer">CNC Programmer / Toolsetter</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Crew Size</label>
                <input
                  type="number"
                  min="1"
                  value={crewSize}
                  onChange={(e) => setCrewSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Certifications (comma separated)
                </label>
                <input
                  type="text"
                  value={certificationsRequired}
                  onChange={(e) => setCertificationsRequired(e.target.value)}
                  placeholder="e.g. Fanuc Level II, AWS 3G"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Detailed Shopfloor Instructions & Tooling */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Step-by-Step Operator Instructions (SOP Text)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Load program O1204. Clock face within 0.015mm TIR. Rough OD with CNMG insert, then finish with VNMG..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tooling & Fixtures</label>
              <input
                type="text"
                value={toolingFixtures}
                onChange={(e) => setToolingFixtures(e.target.value)}
                placeholder="e.g. Soft Jaws Ø180mm, Kennametal CNMG 120408"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quality Inspection Checkpoint & Critical Tolerance
              </label>
              <input
                type="text"
                value={qualityInspectionCriteria}
                onChange={(e) => setQualityInspectionCriteria(e.target.value)}
                placeholder="e.g. Check OD 120.000 +0.015/-0.000 mm, Ra 1.6"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Required Safety PPE (comma separated)
            </label>
            <input
              type="text"
              value={safetyPpe}
              onChange={(e) => setSafetyPpe(e.target.value)}
              placeholder="e.g. Safety Glasses, Cut-Resistant Gloves, Ear Protection"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Operation' : 'Add to Routing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
