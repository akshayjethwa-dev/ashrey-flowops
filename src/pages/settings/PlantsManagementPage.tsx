// src/pages/settings/PlantsManagementPage.tsx

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlants } from '../../hooks/usePlants';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Building 
} from 'lucide-react';
import { TextField } from '../../components/ui/TextField';
import { ProductionStageConfig } from '../../types';

const PUNE_STAGES_PRESET: ProductionStageConfig[] = [
  { id: 'p_cut', name: 'Material Cutting', color: 'indigo', isFinalStage: false, order: 0 },
  { id: 'p_weld', name: 'Pre-Heating & Welding', color: 'blue', isFinalStage: false, order: 1 },
  { id: 'p_cnc', name: 'Precision CNC Machining', color: 'amber', isFinalStage: false, order: 2 },
  { id: 'p_ass', name: 'Shopfloor Assembly', color: 'purple', isFinalStage: false, order: 3 },
  { id: 'p_qc', name: 'NDT & Quality Check', color: 'pink', isFinalStage: false, order: 4 },
  { id: 'p_disp', name: 'Ready for Dispatch', color: 'green', isFinalStage: true, order: 5 }
];

const VADODARA_STAGES_PRESET: ProductionStageConfig[] = [
  { id: 'v_raw', name: 'Raw Material Intake', color: 'indigo', isFinalStage: false, order: 0 },
  { id: 'v_cast', name: 'Casting & Molding', color: 'blue', isFinalStage: false, order: 1 },
  { id: 'v_fett', name: 'Fettling & Grinding', color: 'amber', isFinalStage: false, order: 2 },
  { id: 'v_heat', name: 'Heat Treatment', color: 'purple', isFinalStage: false, order: 3 },
  { id: 'v_ndt', name: 'NDT Testing', color: 'pink', isFinalStage: false, order: 4 },
  { id: 'v_pack', name: 'Packaging & Ready', color: 'green', isFinalStage: true, order: 5 }
];

export const PlantsManagementPage: React.FC = () => {
  const { tenant, activePlantId, setActivePlantId, refreshPlants } = useAuth();
  const { plants, loading, error, addPlant, updatePlant, deletePlant, isAdmin } = usePlants(tenant?.id);

  // Form States
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [gstin, setGstin] = useState('');
  const [presetType, setPresetType] = useState<'pune' | 'vadodara'>('pune');

  // Edit State
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);

  // Operational State Feedbacks
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const resetForm = () => {
    setName('');
    setLocation('');
    setGstin('');
    setEditingPlantId(null);
    setFormError(null);
  };

  const handleStartEdit = (p: any) => {
    setEditingPlantId(p.id);
    setName(p.name);
    setLocation(p.location);
    setGstin(p.gstin || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Edit clearance denied. Admin privileges are required to manage plants.');
      return;
    }

    if (!name.trim() || !location.trim()) {
      setFormError('Please enter a valid plant name and physical address.');
      return;
    }

    setProcessing(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      if (editingPlantId) {
        // Update Plant
        const success = await updatePlant(editingPlantId, {
          name: name.trim(),
          location: location.trim(),
          gstin: gstin.trim()
        });

        if (success) {
          setSuccessMsg(`Plant "${name}" has been successfully updated.`);
          resetForm();
          refreshPlants();
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setFormError('Failed to update the plant in the database.');
        }
      } else {
        // Add Plant
        const stages = presetType === 'pune' ? PUNE_STAGES_PRESET : VADODARA_STAGES_PRESET;
        const success = await addPlant(name, location, gstin, stages);

        if (success) {
          setSuccessMsg(`Plant facility "${name}" successfully registered!`);
          resetForm();
          refreshPlants();
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setFormError('Failed to register the plant. Check if a similar name exists.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the plant.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (plantId: string, plantName: string) => {
    if (!isAdmin) return;
    const warning = `Are you absolutely sure you want to decommission and delete "${plantName}"?\nThis action is irreversible and might disrupt active production jobs assigned to this facility.`;
    if (!window.confirm(warning)) return;

    setProcessing(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const success = await deletePlant(plantId);
      if (success) {
        setSuccessMsg(`Facility "${plantName}" has been successfully decommissioned.`);
        if (activePlantId === plantId) {
          setActivePlantId('all');
        }
        refreshPlants();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setFormError('Failed to delete the plant from database.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while deleting the plant.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetActive = (plantId: string) => {
    setActivePlantId(plantId);
    setSuccessMsg('Active workspace scope switched successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Retrieving factory network map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-widest block leading-none">
          Enterprise Logistics & Nodes
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight block mt-1">
          Manage Plants & Facilities
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Establish and orchestrate multi-plant dispatch yards, assign production workflows, and toggle active workspace scopes.
        </p>
      </div>

      {(error || formError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start space-x-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider font-mono">Operations Error</h5>
            <p className="text-xs text-rose-600 mt-1 leading-relaxed">{error || formError}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">Success</h5>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: List of Existing Plants */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Active Plant Infrastructure ({plants.length})
            </h4>
            <button
              onClick={refreshPlants}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
              title="Refresh local network state"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plants.map((p) => {
              const isActive = activePlantId === p.id;
              return (
                <div 
                  key={p.id}
                  className={`bg-white border rounded-lg p-5 shadow-2xs flex flex-col justify-between transition-all relative ${
                    isActive 
                      ? 'border-indigo-500 ring-1 ring-indigo-500/25 bg-indigo-50/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
                      ACTIVE WORKSPACE
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2.5">
                      <Building className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wide">
                          ID: {p.id}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-start space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{p.location}</span>
                      </div>
                      {p.gstin && (
                        <div className="flex items-center space-x-1.5 font-mono text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-400">GSTIN:</span>
                          <span className="font-bold">{p.gstin}</span>
                        </div>
                      )}
                    </div>

                    {/* Process stage indicator dots */}
                    {p.processStages && p.processStages.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Workstage Milestones ({p.processStages.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.processStages.map((stage: any) => (
                            <span 
                              key={stage.id}
                              className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {stage.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!isActive ? (
                      <button
                        onClick={() => handleSetActive(p.id)}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition cursor-pointer"
                      >
                        Select Workspace
                      </button>
                    ) : (
                      <span className="text-[10px] text-indigo-650 font-mono font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-650 shrink-0" />
                        <span>Scope Active</span>
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-slate-450 hover:text-slate-800 hover:bg-slate-50 rounded transition cursor-pointer"
                          title="Edit facility credentials"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={processing}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded transition cursor-pointer"
                          title="Decommission plant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add / Edit Facility Form */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs h-fit">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {editingPlantId ? 'Modify Facility Node' : 'Register New Plant'}
              </h4>
            </div>
            {!isAdmin && (
              <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-1 border border-amber-200/50 rounded flex items-center space-x-1 uppercase font-mono">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Locked</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              id="plant-name"
              label="Plant Facility Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!isAdmin}
              placeholder="e.g. Chennai Casting Works"
              helperText="Branded title of the physical plant (appears in dispatch sheets)"
            />

            <TextField
              id="plant-location"
              label="Physical Site Address *"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={!isAdmin}
              placeholder="Plot No, Industrial Area, City, State"
              helperText="Full street address for transport logistics mapping"
            />

            <TextField
              id="plant-gstin"
              label="Facility GSTIN (Optional)"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              disabled={!isAdmin}
              placeholder="e.g. 33AAACB1234F1Z3"
              helperText="Plant-specific GSTIN if separate from company baseline"
            />

            {!editingPlantId && isAdmin && (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 font-mono">
                  Production Stages Preset *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPresetType('pune')}
                    className={`p-3 border rounded-lg text-left transition cursor-pointer ${
                      presetType === 'pune' 
                        ? 'border-indigo-500 bg-indigo-50/20 text-indigo-950 font-semibold' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span>Forging Preset</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 font-normal leading-normal">
                      6 checkpoints: Material Cutting, Heating, CNC Machining, Assembly, QC, Dispatch.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPresetType('vadodara')}
                    className={`p-3 border rounded-lg text-left transition cursor-pointer ${
                      presetType === 'vadodara' 
                        ? 'border-indigo-500 bg-indigo-50/20 text-indigo-950 font-semibold' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span>Foundry Preset</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 font-normal leading-normal">
                      6 checkpoints: Raw Material, Casting, Fettling, Heat Treatment, NDT, Ready.
                    </p>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Seed initial shopfloor stages configuration automatically.
                </span>
              </div>
            )}

            {isAdmin && (
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-2.5">
                {editingPlantId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-slate-600 hover:text-slate-900 border border-slate-200 bg-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded h-11 flex items-center justify-center transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-350 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded h-11 flex items-center justify-center transition cursor-pointer"
                >
                  {processing ? 'Processing...' : editingPlantId ? 'Save Credential Updates' : 'Establish Plant Facility'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security / Audit System Info Panel */}
        <div className="lg:col-span-3 bg-slate-900 text-slate-300 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-white">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Consolidated Ledger Security</h4>
            </div>
            <p className="text-[11px] text-slate-400 max-w-3xl leading-relaxed">
              Plant additions are logged automatically inside active factory audit journals. Only designated administrators hold permissions to configure multi-plant assets, assign staff access constraints, or decommission operational facilities.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};