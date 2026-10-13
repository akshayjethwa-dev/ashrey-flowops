// src/components/iqc/IqcPlanEditorModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck2,
  Ruler,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  InspectionPlan,
  InspectionPlanParameter,
  CharacteristicType,
  ToleranceType,
  InspectionCriticality
} from '../../types/iqc';

interface IqcPlanEditorModalProps {
  plan?: InspectionPlan | null;
  onClose: () => void;
  onSavePlan: (planData: any) => Promise<any>;
}

export const IqcPlanEditorModal: React.FC<IqcPlanEditorModalProps> = ({
  plan,
  onClose,
  onSavePlan
}) => {
  const isEditing = !!plan;

  const [planCode, setPlanCode] = useState<string>(plan?.planCode || `IP-PART-${Math.floor(100 + Math.random() * 900)}`);
  const [title, setTitle] = useState<string>(plan?.title || '');
  const [supplierName, setSupplierName] = useState<string>(plan?.supplierName || '');
  const [partSku, setPartSku] = useState<string>(plan?.partSku || '');
  const [partName, setPartName] = useState<string>(plan?.partName || '');
  const [category, setCategory] = useState<string>(plan?.category || 'Raw Materials');
  const [aqlLevel, setAqlLevel] = useState<InspectionPlan['aqlLevel']>(plan?.aqlLevel || '0.65');
  const [samplingStandard, setSamplingStandard] = useState<InspectionPlan['samplingStandard']>(
    plan?.samplingStandard || 'ISO_2859_1_NORMAL'
  );
  const [preparedBy, setPreparedBy] = useState<string>(plan?.preparedBy || 'Anita Desai (QA Metrologist)');
  const [approvedBy, setApprovedBy] = useState<string>(plan?.approvedBy || 'Dr. Anand Verma (QA VP)');

  const [parameters, setParameters] = useState<InspectionPlanParameter[]>(
    plan?.parameters || [
      {
        id: `p-${Date.now()}-1`,
        parameterName: 'Critical Dimension / OD',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 50.0,
        lowerTolerance: 49.9,
        upperTolerance: 50.1,
        gaugeOrInstrument: 'Digital Vernier Caliper (0.01mm)',
        criticality: 'critical',
        defaultSampleSize: 5
      },
      {
        id: `p-${Date.now()}-2`,
        parameterName: 'Visual Surface Integrity',
        characteristicType: 'visual',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Visual Inspection 1000 Lux',
        criticality: 'major',
        defaultSampleSize: 5
      }
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAddParameter = () => {
    const newParam: InspectionPlanParameter = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      parameterName: 'New Characteristic',
      characteristicType: 'dimensional',
      toleranceType: 'two_sided',
      unit: 'mm',
      nominalValue: 10.0,
      lowerTolerance: 9.9,
      upperTolerance: 10.1,
      gaugeOrInstrument: 'Digital Vernier Caliper',
      criticality: 'major',
      defaultSampleSize: 5
    };
    setParameters([...parameters, newParam]);
  };

  const handleRemoveParameter = (id: string) => {
    setParameters(parameters.filter(p => p.id !== id));
  };

  const handleUpdateParameter = (id: string, updates: Partial<InspectionPlanParameter>) => {
    setParameters(parameters.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parameters.length === 0) {
      alert('Please add at least one inspection parameter to the plan.');
      return;
    }

    try {
      setIsSubmitting(true);
      const planPayload = {
        planCode,
        title: title.trim() || `${partName || partSku} Incoming Inspection Protocol`,
        supplierName: supplierName.trim() || 'All Contracted Suppliers (*)',
        partSku: partSku.trim() || 'RAW-GENERAL-01',
        partName: partName.trim() || 'Custom Incoming Part',
        category,
        version: plan ? plan.version + 1 : 1,
        status: 'active' as const,
        parameters,
        aqlLevel,
        samplingStandard,
        preparedBy,
        approvedBy
      };

      await onSavePlan(planPayload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Inspection Plan: ${plan.planCode}` : 'Create Supplier / Part Inspection Plan'}
              </h2>
              <p className="text-xs text-slate-400">
                Define tolerances, instruments, AQL sampling rates, and acceptance criteria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Metadata Grid */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Plan Code</label>
              <input
                type="text"
                required
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                placeholder="e.g. IP-STEEL-EN8"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Plan Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cold Rolled Sheet 2.5mm Quality Protocol"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Part SKU / Item Code</label>
              <input
                type="text"
                required
                value={partSku}
                onChange={(e) => setPartSku(e.target.value)}
                placeholder="e.g. RAW-STEEL-EN8-45"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Part Description</label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. EN8 Carbon Steel Round Bar Dia 45mm"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Scope</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Specific Supplier or * for all"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">AQL Sampling Level</label>
              <select
                value={aqlLevel}
                onChange={(e) => setAqlLevel(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="0.40">AQL 0.40 (Critical Components)</option>
                <option value="0.65">AQL 0.65 (Standard Precision)</option>
                <option value="1.0">AQL 1.0 (Normal Industrial)</option>
                <option value="1.5">AQL 1.5 (Minor Hardware)</option>
                <option value="2.5">AQL 2.5 (Bulk Raw Materials)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sampling Standard</label>
              <select
                value={samplingStandard}
                onChange={(e) => setSamplingStandard(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="ISO_2859_1_NORMAL">ISO 2859-1 Level II Normal</option>
                <option value="FIXED_SAMPLES">Fixed 5 Samples / Lot</option>
                <option value="100_PERCENT">100% Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Approved By (QA Head)</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Parameters Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-400" />
                Inspection Parameters & Tolerances ({parameters.length})
              </h3>
              <button
                type="button"
                onClick={handleAddParameter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Parameter
              </button>
            </div>

            <div className="space-y-3">
              {parameters.map((param, index) => (
                <div
                  key={param.id}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParameter(param.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Remove parameter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-0.5">Parameter Name</label>
                      <input
                        type="text"
                        value={param.parameterName}
                        onChange={(e) => handleUpdateParameter(param.id, { parameterName: e.target.value })}
                        placeholder="e.g. Outer Diameter (OD)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Type</label>
                      <select
                        value={param.characteristicType}
                        onChange={(e) => handleUpdateParameter(param.id, { characteristicType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="dimensional">Dimensional</option>
                        <option value="visual">Visual</option>
                        <option value="hardness">Hardness</option>
                        <option value="chemical_mtr">Chemical / MTR</option>
                        <option value="thread_pitch">Thread Pitch</option>
                        <option value="functional">Functional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Criticality</label>
                      <select
                        value={param.criticality}
                        onChange={(e) => handleUpdateParameter(param.id, { criticality: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="critical">Critical (0 Defect)</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                    </div>
                  </div>

                  {/* Tolerances row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Tolerance Mode</label>
                      <select
                        value={param.toleranceType}
                        onChange={(e) => handleUpdateParameter(param.id, { toleranceType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="two_sided">Two-Sided (Min/Nom/Max)</option>
                        <option value="pass_fail">Pass/Fail Attributive</option>
                      </select>
                    </div>

                    {param.toleranceType === 'two_sided' && (
                      <>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Min Spec</label>
                          <input
                            type="number"
                            step="0.001"
                            value={param.lowerTolerance ?? ''}
                            onChange={(e) => handleUpdateParameter(param.id, { lowerTolerance: parseFloat(e.target.value) || undefined })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-blue-400 mb-0.5">Nominal</label>
                          <input
                            type="number"
                            step="0.001"
                            value={param.nominalValue ?? ''}
                            onChange={(e) => handleUpdateParameter(param.id, { nominalValue: parseFloat(e.target.value) || undefined })}
                            className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">Max Spec</label>
                          <input
                            type="number"
                            step="0.001"
                            value={param.upperTolerance ?? ''}
                            onChange={(e) => handleUpdateParameter(param.id, { upperTolerance: parseFloat(e.target.value) || undefined })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Unit</label>
                      <input
                        type="text"
                        value={param.unit}
                        onChange={(e) => handleUpdateParameter(param.id, { unit: e.target.value })}
                        placeholder="mm, HRC..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Instrument & Gauge */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Measuring Gauge / Calibration Instrument</label>
                    <input
                      type="text"
                      value={param.gaugeOrInstrument}
                      onChange={(e) => handleUpdateParameter(param.id, { gaugeOrInstrument: e.target.value })}
                      placeholder="e.g. Digital Vernier Caliper (0.01mm) Mitutoyo #CAL-VC-014"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving Plan...' : isEditing ? 'Update Plan' : 'Save Inspection Plan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
