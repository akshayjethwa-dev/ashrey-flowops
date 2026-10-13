// src/components/iqc/IqcInspectionWorkbenchModal.tsx

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Upload,
  Ruler,
  FileCheck2,
  Sparkles,
  Trash2,
  Layers,
  Building2,
  Flame,
  Award,
  Plus,
  ShieldAlert,
  Lock,
  ShieldCheck
} from 'lucide-react';
import {
  IqcOrder,
  SampleMeasurement,
  DefectPhoto,
  InspectionOrderParameterResult
} from '../../types/iqc';
import { gageService } from '../../services/gageService';
import { DEFECT_PRESET_IMAGES } from '../../services/iqcService';

interface IqcInspectionWorkbenchModalProps {
  order: IqcOrder;
  onClose: () => void;
  onSaveMeasurements: (
    orderId: string,
    parameterId: string,
    samples: SampleMeasurement[]
  ) => Promise<any>;
  onAddPhoto: (
    orderId: string,
    photoData: Omit<DefectPhoto, 'id' | 'timestamp'>
  ) => Promise<any>;
  onDeletePhoto: (orderId: string, photoId: string) => Promise<any>;
  onOpenDisposition: (order: IqcOrder) => void;
}

export const IqcInspectionWorkbenchModal: React.FC<IqcInspectionWorkbenchModalProps> = ({
  order,
  onClose,
  onSaveMeasurements,
  onAddPhoto,
  onDeletePhoto,
  onOpenDisposition
}) => {
  const [activeTab, setActiveTab] = useState<'measurements' | 'photos' | 'visual_mtr'>('measurements');

  // Local state for active parameter being measured
  const [activeParamId, setActiveParamId] = useState<string>(
    order.parameters[0]?.parameterId || ''
  );

  // Editable sample values per parameter
  const activeParameter = order.parameters.find(p => p.parameterId === activeParamId) || order.parameters[0];

  const [localSamples, setLocalSamples] = useState<SampleMeasurement[]>(
    activeParameter?.samples || []
  );

  const [savingParam, setSavingParam] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Gage calibration verification state
  const [selectedGageTag, setSelectedGageTag] = useState<string>(
    activeParameter?.gaugeOrInstrument || ''
  );

  // Photo capture state
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<DefectPhoto['defectCategory']>('dimensional_variance');
  const [photoSeverity, setPhotoSeverity] = useState<DefectPhoto['severity']>('major');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFECT_PRESET_IMAGES[0].id);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [isAddingPhoto, setIsAddingPhoto] = useState<boolean>(false);

  // When switching active parameter, update local samples and selected gage
  const handleSelectParameter = (param: InspectionOrderParameterResult) => {
    setActiveParamId(param.parameterId);
    setLocalSamples(param.samples.map(s => ({ ...s })));
    setSelectedGageTag(param.gaugeOrInstrument || '');
    setSaveSuccessNotice(null);
  };

  const handleSampleChange = (index: number, valStr: string) => {
    const updated = [...localSamples];
    const num = valStr === '' ? null : parseFloat(valStr);
    const s = { ...updated[index], measuredValue: isNaN(num as any) ? null : num };

    if (activeParameter) {
      if (s.measuredValue !== null && s.measuredValue !== undefined) {
        let outOfSpec = false;
        if (activeParameter.minSpec !== undefined && s.measuredValue < activeParameter.minSpec) {
          outOfSpec = true;
        }
        if (activeParameter.maxSpec !== undefined && s.measuredValue > activeParameter.maxSpec) {
          outOfSpec = true;
        }
        s.isOutOfSpec = outOfSpec;
        if (activeParameter.nominalValue !== undefined) {
          s.deviationFromNominal = Number((s.measuredValue - activeParameter.nominalValue).toFixed(4));
        }
      } else {
        s.isOutOfSpec = false;
        s.deviationFromNominal = undefined;
      }
    }

    updated[index] = s;
    setLocalSamples(updated);
  };

  const handleVisualToggle = (index: number, isPass: boolean) => {
    const updated = [...localSamples];
    updated[index] = {
      ...updated[index],
      isVisualPass: isPass,
      isOutOfSpec: !isPass
    };
    setLocalSamples(updated);
  };

  // Quick helper to fill simulated values
  const handleAutofillNominal = () => {
    if (!activeParameter || activeParameter.nominalValue === undefined) return;
    const nom = activeParameter.nominalValue;
    const tol = (activeParameter.maxSpec ?? nom + 0.1) - (activeParameter.minSpec ?? nom - 0.1);
    const updated = localSamples.map((s) => {
      // Small random jitter within ± 25% of tolerance
      const jitter = (Math.random() - 0.48) * (tol * 0.25);
      const val = Number((nom + jitter).toFixed(3));
      return {
        ...s,
        measuredValue: val,
        isOutOfSpec: false,
        deviationFromNominal: Number((val - nom).toFixed(3))
      };
    });
    setLocalSamples(updated);
  };

  const handleSaveCurrentParam = async () => {
    if (!activeParameter) return;
    try {
      setSavingParam(true);
      await onSaveMeasurements(order.id, activeParameter.parameterId, localSamples);
      setSaveSuccessNotice(`Saved measurements for "${activeParameter.parameterName}"`);
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingParam(false);
    }
  };

  const handleAddPresetPhoto = async () => {
    try {
      setIsAddingPhoto(true);
      const chosenPreset = DEFECT_PRESET_IMAGES.find(p => p.id === selectedPresetId) || DEFECT_PRESET_IMAGES[0];
      const urlToUse = customPhotoUrl.trim() || chosenPreset.dataUrl;

      await onAddPhoto(order.id, {
        caption: photoCaption.trim() || `${chosenPreset.label} captured during IQC inspection`,
        defectCategory: photoCategory,
        severity: photoSeverity,
        url: urlToUse
      });

      setPhotoCaption('');
      setCustomPhotoUrl('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingPhoto(false);
    }
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCustomPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono tracking-tight">
                  {order.orderNumber}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-slate-800 text-slate-300 border-slate-700">
                  {order.inspectionPlanCode}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  order.overallResult === 'pass'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : order.overallResult === 'fail'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Result: {order.overallResult}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{order.partName} ({order.partSku})</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{order.supplierName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenDisposition(order)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <FileCheck2 className="w-4 h-4" />
              Disposition Lot
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Metadata Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">PO Reference</span>
            <span className="text-slate-200 font-medium font-mono">{order.poNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">GRN Inward #</span>
            <span className="text-slate-200 font-medium font-mono">{order.grnNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">Heat / Lot #</span>
            <span className="text-amber-300 font-medium font-mono flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {order.heatLotNumber}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">Received Lot Size</span>
            <span className="text-slate-200 font-bold">{order.receivedQty} {order.unit}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">Sample Size</span>
            <span className="text-blue-300 font-bold">{order.sampleSize} Units (ISO 2859)</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-mono text-[10px]">Assigned Inspector</span>
            <span className="text-slate-200">{order.inspectorName || 'Anita Desai (QC-408)'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6">
          <button
            onClick={() => setActiveTab('measurements')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'measurements'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Measurement Matrix ({order.parameters.length} Parameters)
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'photos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Defect Photos & Evidence ({order.defectPhotos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('visual_mtr')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
              activeTab === 'visual_mtr'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            MTR & Certifications
          </button>
        </div>

        {/* Tab 1: Measurements Matrix */}
        {activeTab === 'measurements' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
            
            {/* Left: Parameter Sidebar selector */}
            <div className="w-full lg:w-80 flex flex-col gap-2 shrink-0">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold mb-1">
                Inspection Parameters
              </span>
              {order.parameters.map((param) => {
                const isSelected = param.parameterId === activeParamId;
                return (
                  <button
                    key={param.parameterId}
                    onClick={() => handleSelectParameter(param)}
                    className={`text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {param.parameterName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        param.parameterStatus === 'pass'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : param.parameterStatus === 'fail'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {param.parameterStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{param.characteristicType}</span>
                      <span>•</span>
                      {param.toleranceType === 'two_sided' && (
                        <span>
                          {param.minSpec} ~ {param.maxSpec} {param.unit}
                        </span>
                      )}
                      {param.toleranceType === 'pass_fail' && (
                        <span>Attributive</span>
                      )}
                    </div>

                    {param.cpk !== undefined && (
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>Cpk: <strong className={param.cpk >= 1.33 ? 'text-emerald-400' : 'text-amber-400'}>{param.cpk}</strong></span>
                        <span>OOS: <strong className={param.outOfSpecCount > 0 ? 'text-rose-400' : 'text-slate-300'}>{param.outOfSpecCount}</strong></span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Active Parameter Sample Measurement Sheet */}
            {activeParameter && (
              <div className="flex-1 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {activeParameter.parameterName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {activeParameter.criticality}
                      </span>
                    </div>

                    {/* Gage Selection & Live Calibration Check */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400">Gage:</span>
                      <select
                        value={selectedGageTag}
                        onChange={(e) => setSelectedGageTag(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      >
                        <option value={activeParameter.gaugeOrInstrument}>
                          {activeParameter.gaugeOrInstrument} (Plan Default)
                        </option>
                        {gageService.getGages().map(g => (
                          <option key={g.id} value={g.assetTag}>
                            {g.assetTag}: {g.name} ({g.calibrationStatus.toUpperCase()})
                          </option>
                        ))}
                      </select>

                      {/* Verification Status Badge */}
                      {(() => {
                        const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                        return check.isValid ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Calibrated {check.gage ? `(Due: ${check.gage.nextCalibrationDueDate})` : 'Verified'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            BLOCKED: EXPIRED GAGE
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Nominal and Tolerance Badge */}
                  <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Min Spec</span>
                      <span className="font-bold text-slate-300">
                        {activeParameter.minSpec !== undefined ? `${activeParameter.minSpec} ${activeParameter.unit}` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-slate-600 font-bold">|</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Nominal</span>
                      <span className="font-bold text-blue-400">
                        {activeParameter.nominalValue !== undefined ? `${activeParameter.nominalValue} ${activeParameter.unit}` : 'Target'}
                      </span>
                    </div>
                    <div className="text-slate-600 font-bold">|</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Max Spec</span>
                      <span className="font-bold text-slate-300">
                        {activeParameter.maxSpec !== undefined ? `${activeParameter.maxSpec} ${activeParameter.unit}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Autofill Tools */}
                <div className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-slate-400">
                    Sample measurements for Lot <strong>{order.heatLotNumber}</strong> (AQL Sample Size: {localSamples.length})
                  </div>
                  {activeParameter.toleranceType !== 'pass_fail' && (
                    <button
                      type="button"
                      onClick={handleAutofillNominal}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition border border-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Simulate In-Spec Readings
                    </button>
                  )}
                </div>

                {/* Out of Calibration Blocking Alert */}
                {(() => {
                  const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                  if (check.isValid) return null;
                  return (
                    <div className="mb-3 p-3.5 bg-rose-950/60 border border-rose-500/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                        <div>
                          <strong className="text-white block font-bold text-sm">
                            INSPECTION BLOCKED: Gage is Out-of-Calibration!
                          </strong>
                          <span className="text-rose-300 text-[11px]">{check.blockedReason}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-rose-900 text-rose-200 font-bold uppercase text-[10px] shrink-0 font-mono">
                        LOCKED
                      </span>
                    </div>
                  );
                })()}

                {/* Samples Table */}
                <div className="overflow-x-auto flex-1 my-2">
                  <table className="w-full text-left text-xs border border-slate-700/60 rounded-xl overflow-hidden">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3">Sample #</th>
                        {activeParameter.toleranceType === 'pass_fail' ? (
                          <th className="p-3">Attributive Check</th>
                        ) : (
                          <>
                            <th className="p-3">Actual Value ({activeParameter.unit})</th>
                            <th className="p-3">Deviation from Nominal</th>
                            <th className="p-3">Spec Status</th>
                          </>
                        )}
                        <th className="p-3">Inspector Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {localSamples.map((sample, idx) => (
                        <tr key={sample.sampleNumber} className="hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-300">
                            Sample #{sample.sampleNumber}
                          </td>

                          {activeParameter.toleranceType === 'pass_fail' ? (
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleVisualToggle(idx, true)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    sample.isVisualPass === true
                                      ? 'bg-emerald-600 text-white shadow-md'
                                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVisualToggle(idx, false)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    sample.isVisualPass === false
                                      ? 'bg-rose-600 text-white shadow-md'
                                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Fail
                                </button>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="p-3">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={sample.measuredValue ?? ''}
                                  onChange={(e) => handleSampleChange(idx, e.target.value)}
                                  placeholder="Enter value"
                                  className={`w-32 px-3 py-1.5 rounded-lg border text-sm font-bold bg-slate-900 transition focus:outline-none focus:ring-2 ${
                                    sample.isOutOfSpec
                                      ? 'border-rose-500 text-rose-300 focus:ring-rose-500/40 bg-rose-950/20'
                                      : sample.measuredValue !== null && sample.measuredValue !== undefined
                                      ? 'border-emerald-500 text-emerald-300 focus:ring-emerald-500/40'
                                      : 'border-slate-700 text-white focus:ring-blue-500/40'
                                  }`}
                                />
                              </td>
                              <td className="p-3">
                                {sample.deviationFromNominal !== undefined ? (
                                  <span className={sample.deviationFromNominal === 0 ? 'text-slate-400' : sample.deviationFromNominal > 0 ? 'text-amber-400' : 'text-blue-400'}>
                                    {sample.deviationFromNominal > 0 ? `+${sample.deviationFromNominal}` : sample.deviationFromNominal} {activeParameter.unit}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                {sample.measuredValue === null || sample.measuredValue === undefined ? (
                                  <span className="text-slate-500">Pending</span>
                                ) : sample.isOutOfSpec ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    OUT OF SPEC
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    IN SPEC
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          <td className="p-3">
                            <input
                              type="text"
                              value={sample.remarks || ''}
                              onChange={(e) => {
                                const updated = [...localSamples];
                                updated[idx] = { ...updated[idx], remarks: e.target.value };
                                setLocalSamples(updated);
                              }}
                              placeholder="Optional note"
                              className="w-full max-w-xs px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-slate-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Real-time Statistical Summary */}
                {activeParameter.toleranceType !== 'pass_fail' && (
                  <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Sample Mean (μ)</span>
                      <span className="font-bold text-white">
                        {activeParameter.meanValue !== undefined ? `${activeParameter.meanValue} ${activeParameter.unit}` : 'Calculating...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Range (R)</span>
                      <span className="font-bold text-white">
                        {activeParameter.rangeValue !== undefined ? `${activeParameter.rangeValue} ${activeParameter.unit}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Std Dev (σ)</span>
                      <span className="font-bold text-white">
                        {activeParameter.stdDev !== undefined ? activeParameter.stdDev : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Capability (Cpk)</span>
                      <span className={`font-bold ${
                        (activeParameter.cpk ?? 0) >= 1.33
                          ? 'text-emerald-400'
                          : (activeParameter.cpk ?? 0) >= 1.0
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {activeParameter.cpk !== undefined ? activeParameter.cpk : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Out of Spec #</span>
                      <span className={`font-bold ${
                        activeParameter.outOfSpecCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {activeParameter.outOfSpecCount} Defective
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                  {saveSuccessNotice ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {saveSuccessNotice}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Changes auto-recalculate capability indices upon saving
                    </span>
                  )}

                  {(() => {
                    const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                    const isBlocked = !check.isValid;
                    return (
                      <button
                        type="button"
                        onClick={handleSaveCurrentParam}
                        disabled={savingParam || isBlocked}
                        className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase shadow-md transition flex items-center gap-2 ${
                          isBlocked
                            ? 'bg-rose-900/60 border border-rose-500/50 text-rose-300 cursor-not-allowed opacity-80'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isBlocked && <Lock className="w-3.5 h-3.5" />}
                        {savingParam
                          ? 'Saving...'
                          : isBlocked
                          ? 'Inspection Blocked (Gage Expired)'
                          : `Save ${activeParameter.parameterName} Measurements`}
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Defect Photos & Visual Evidence */}
        {activeTab === 'photos' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Photo Capture / Upload Panel */}
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Capture or Attach Defect Photo
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Record visual non-conformances, surface cracks, rust, damaged threads, or calibration gauge readouts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Defect Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Defect Category
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="dimensional_variance">Dimensional Non-Conformance</option>
                    <option value="surface_crack">Surface Micro-Crack / Fissure</option>
                    <option value="rust_oxidation">Rust / Environmental Oxidation</option>
                    <option value="thread_damage">Thread Burr / Pitch Damage</option>
                    <option value="porosity_voids">Casting Porosity / Blowholes</option>
                    <option value="dents_scratches">Deep Dents / Transit Gouges</option>
                    <option value="burrs_flashing">Excess Flashing / Heavy Burrs</option>
                    <option value="packaging_damage">Damaged Packaging / Seal Breach</option>
                    <option value="other">Other Visual Defect</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Defect Severity
                  </label>
                  <select
                    value={photoSeverity}
                    onChange={(e) => setPhotoSeverity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="critical">Critical (0 Defect Tolerance)</option>
                    <option value="major">Major (Functional Impact)</option>
                    <option value="minor">Minor (Cosmetic)</option>
                  </select>
                </div>

                {/* Industrial Defect Preset Simulation */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Simulated Camera Defect Preset
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => {
                      setSelectedPresetId(e.target.value);
                      const p = DEFECT_PRESET_IMAGES.find(x => x.id === e.target.value);
                      if (p) {
                        setPhotoCategory(p.category);
                        setPhotoCaption(p.label);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {DEFECT_PRESET_IMAGES.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Caption & Custom Upload */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Inspector Caption & Non-Conformance Description
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Under-thickness micrometer reading 2.36mm vs min spec 2.45mm on corner gauge point"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddPresetPhoto}
                    disabled={isAddingPhoto}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Attach Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery of Attached Defect Photos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Attached Visual Records ({order.defectPhotos?.length || 0})
                </h4>
              </div>

              {(!order.defectPhotos || order.defectPhotos.length === 0) ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  No defect photos captured yet for this lot.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.defectPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col group shadow-lg"
                    >
                      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover transition group-hover:scale-105 duration-300"
                        />
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          photo.severity === 'critical'
                            ? 'bg-rose-600/90 text-white'
                            : photo.severity === 'major'
                            ? 'bg-amber-600/90 text-white'
                            : 'bg-blue-600/90 text-white'
                        }`}>
                          {photo.severity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeletePhoto(order.id, photo.id)}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <div>
                          <span className="text-[10px] text-blue-400 font-mono uppercase font-semibold block mb-1">
                            {photo.defectCategory.replace(/_/g, ' ')}
                          </span>
                          <p className="text-xs text-slate-200 line-clamp-2">
                            {photo.caption}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-mono">
                          {new Date(photo.timestamp).toLocaleDateString()} {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Visual & MTR Inspection Checks */}
        {activeTab === 'visual_mtr' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Mill Test Report (MTR) & Raw Material Chemical Verification
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Verify manufacturer test certificate against material specification (IS / ASTM / EN standards).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                    Manufacturer Heat Certificate
                  </span>
                  <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    {order.mtrNumber || 'MTR-CERT-NOT-SPECIFIED'}
                  </div>
                  <div className="mt-3 text-xs text-slate-300 space-y-1">
                    <div>Supplier: <strong>{order.supplierName}</strong></div>
                    <div>Heat / Melt #: <strong>{order.heatLotNumber}</strong></div>
                    <div>Receipt GRN: <strong>{order.grnNumber}</strong></div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                    Regulatory & Standard Compliance
                  </span>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-blue-600" />
                      <span>Heat number physically stamped on bar ends / tags matches MTR</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-blue-600" />
                      <span>Chemical element composition limits verified within tolerance</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-800 text-blue-600" />
                      <span>Material free from radioactive contamination or hazardous substances</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Routing & Storage Bin info */}
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Inward Logistics & Storage Bin Allocation
              </h3>
              <p className="text-xs text-slate-400">
                Upon disposition release, stock balance will be automatically booked into assigned warehouse storage bin:
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Target Bin: {order.disposition?.targetBinCode || 'BIN-RAW-01 (Heavy Bar Storage)'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ERP Stock Ledger: Inward Pending Inspection Clearance
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Inspector: <strong>{order.inspectorName || 'Anita Desai'}</strong></span>
            <span>•</span>
            <span>Inspected on: <strong>{new Date(order.receiptDate).toLocaleDateString()}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
            >
              Close Workbench
            </button>
            <button
              onClick={() => onOpenDisposition(order)}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <FileCheck2 className="w-4 h-4" />
              Apply Final Disposition
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
