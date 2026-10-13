// src/components/ipqc/IpqcInspectionTaskModal.tsx

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
  Building2,
  Lock,
  Unlock,
  ShieldAlert,
  Pin,
  Flame,
  Plus
} from 'lucide-react';
import {
  IpqcTask,
  Part3DMarker,
  IpqcTaskSampleReading,
  IpqcPartPhoto,
  ViewPerspective
} from '../../types/ipqc';
import { Part3DMarkingViewer } from './Part3DMarkingViewer';
import { IPQC_DEFECT_PHOTOS } from '../../services/ipqcService';
import { gageService } from '../../services/gageService';

interface IpqcInspectionTaskModalProps {
  task: IpqcTask;
  onClose: () => void;
  onSaveMeasurement: (taskId: string, parameterId: string, samples: IpqcTaskSampleReading[]) => Promise<any>;
  onAttachPhoto: (taskId: string, photoData: Omit<IpqcPartPhoto, 'id' | 'timestamp'>) => Promise<any>;
  onDeletePhoto: (taskId: string, photoId: string) => Promise<any>;
  onSignOff: (taskId: string, data: any) => Promise<any>;
}

export const IpqcInspectionTaskModal: React.FC<IpqcInspectionTaskModalProps> = ({
  task,
  onClose,
  onSaveMeasurement,
  onAttachPhoto,
  onDeletePhoto,
  onSignOff
}) => {
  const [activeParamId, setActiveParamId] = useState<string>(task.parameters[0]?.parameterId || '');
  const activeParameter = task.parameters.find(p => p.parameterId === activeParamId) || task.parameters[0];

  const [activeMarkerId, setActiveMarkerId] = useState<string>(activeParameter?.markerId || task.markers[0]?.id || '');
  const [localSamples, setLocalSamples] = useState<IpqcTaskSampleReading[]>(
    activeParameter?.samples || []
  );

  const [savingParam, setSavingParam] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Gage calibration verification state
  const [selectedGageTag, setSelectedGageTag] = useState<string>(
    activeParameter?.gaugeOrInstrument || ''
  );

  // Sign-off state
  const [signOffResult, setSignOffResult] = useState<'pass' | 'hold' | 'fail'>(
    task.overallResult !== 'pending' ? task.overallResult : 'pass'
  );
  const [inspectorName, setInspectorName] = useState<string>(task.inspectorName || 'Anita Desai (QC-408)');
  const [badgeId, setBadgeId] = useState<string>(task.badgeId || 'QC-408');
  const [notes, setNotes] = useState<string>(task.notes || '');
  const [holdReason, setHoldReason] = useState<string>(
    task.holdReason || 'Tool offset adjustment required. Undersize detected on keyway cutter.'
  );
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);

  // Photo attach state
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [defectType, setDefectType] = useState<IpqcPartPhoto['defectType']>('tool_chatter');
  const [photoSeverity, setPhotoSeverity] = useState<IpqcPartPhoto['severity']>('major');
  const [selectedPresetPhotoId, setSelectedPresetPhotoId] = useState<string>(IPQC_DEFECT_PHOTOS[0].id);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  // When changing active parameter
  const handleSelectParam = (paramId: string) => {
    setActiveParamId(paramId);
    const p = task.parameters.find(x => x.parameterId === paramId);
    if (p) {
      setLocalSamples(p.samples.map(s => ({ ...s })));
      setSelectedGageTag(p.gaugeOrInstrument || '');
      setSaveNotice(null);
      if (p.markerId) {
        setActiveMarkerId(p.markerId);
      }
    }
  };

  // When user clicks a 3D marker on canvas
  const handleSelectMarker = (marker: Part3DMarker) => {
    setActiveMarkerId(marker.id);
    const matchingParam = task.parameters.find(p => p.markerId === marker.id);
    if (matchingParam) {
      setActiveParamId(matchingParam.parameterId);
      setLocalSamples(matchingParam.samples.map(s => ({ ...s })));
    }
  };

  const handleSampleChange = (index: number, valStr: string) => {
    const updated = [...localSamples];
    const num = valStr === '' ? null : parseFloat(valStr);
    const s = { ...updated[index], measuredValue: isNaN(num as any) ? null : num };

    if (activeParameter) {
      if (s.measuredValue !== null && s.measuredValue !== undefined) {
        let oos = false;
        if (activeParameter.minSpec !== undefined && s.measuredValue < activeParameter.minSpec) {
          oos = true;
        }
        if (activeParameter.maxSpec !== undefined && s.measuredValue > activeParameter.maxSpec) {
          oos = true;
        }
        s.isOutOfSpec = oos;
        if (activeParameter.nominalValue !== undefined) {
          s.deviation = Number((s.measuredValue - activeParameter.nominalValue).toFixed(4));
        }
      } else {
        s.isOutOfSpec = false;
        s.deviation = undefined;
      }
    }

    updated[index] = s;
    setLocalSamples(updated);
  };

  const handleAutofillNominal = () => {
    if (!activeParameter || activeParameter.nominalValue === undefined) return;
    const nom = activeParameter.nominalValue;
    const min = activeParameter.minSpec ?? nom - 0.05;
    const max = activeParameter.maxSpec ?? nom + 0.05;
    const span = max - min;

    const updated = localSamples.map(s => {
      const jitter = (Math.random() - 0.48) * (span * 0.3);
      const val = Number((nom + jitter).toFixed(3));
      return {
        ...s,
        measuredValue: val,
        isOutOfSpec: false,
        deviation: Number((val - nom).toFixed(3))
      };
    });
    setLocalSamples(updated);
  };

  const handleSaveParam = async () => {
    if (!activeParameter) return;
    try {
      setSavingParam(true);
      await onSaveMeasurement(task.id, activeParameter.parameterId, localSamples);
      setSaveNotice(`Saved ${activeParameter.parameterName}`);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingParam(false);
    }
  };

  const handleAttachPhoto = async () => {
    try {
      const preset = IPQC_DEFECT_PHOTOS.find(p => p.id === selectedPresetPhotoId) || IPQC_DEFECT_PHOTOS[0];
      const url = customPhotoUrl.trim() || preset.url;
      const marker = task.markers.find(m => m.id === activeMarkerId);

      await onAttachPhoto(task.id, {
        caption: photoCaption.trim() || preset.caption,
        defectType,
        severity: photoSeverity,
        markerId: activeMarkerId,
        markerLabel: marker?.label,
        url
      });

      setPhotoCaption('');
      setCustomPhotoUrl('');
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleExecuteSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSigningOff(true);
      await onSignOff(task.id, {
        result: signOffResult,
        inspectorName,
        badgeId,
        notes,
        holdReason: signOffResult === 'hold' ? holdReason : undefined
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningOff(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-6 py-3.5 bg-slate-800/95 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
              task.status === 'passed'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : task.status === 'hold'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
            }`}>
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  {task.taskNumber}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-800 border border-slate-700 text-slate-300">
                  {task.triggerType.replace(/_/g, ' ')}
                </span>
                {task.gateType === 'mandatory_hold' && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Mandatory Hold Gate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {task.workOrderNumber} • Op {task.operationSequence}: {task.operationName} • Machine: <strong>{task.machineCode} ({task.workCenterName})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          
          {/* SECTION 1: 3D Part Model & Surface Coordinate Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            <div className="lg:col-span-7">
              <Part3DMarkingViewer
                modelType={task.partModelType}
                partName={task.partName}
                partNumber={task.partNumber}
                markers={task.markers}
                activeMarkerId={activeMarkerId}
                onSelectMarker={handleSelectMarker}
              />
            </div>

            {/* Active Marker / Parameter Details card */}
            <div className="lg:col-span-5 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  Selected Quality Control Point (QCP)
                </span>
                
                {/* Parameter Selection pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {task.parameters.map((p) => {
                    const isSelected = p.parameterId === activeParamId;
                    return (
                      <button
                        key={p.parameterId}
                        type="button"
                        onClick={() => handleSelectParam(p.parameterId)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                            : p.parameterStatus === 'fail'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                            : p.parameterStatus === 'pass'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        {p.parameterName}
                      </button>
                    );
                  })}
                </div>

                {activeParameter && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">
                          {activeParameter.parameterName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {activeParameter.criticality}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Min Spec</span>
                          <span className="font-bold text-slate-300">{activeParameter.minSpec ?? 'N/A'} {activeParameter.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-blue-400 block uppercase">Nominal</span>
                          <span className="font-bold text-blue-400">{activeParameter.nominalValue ?? 'Target'} {activeParameter.unit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase">Max Spec</span>
                          <span className="font-bold text-slate-300">{activeParameter.maxSpec ?? 'N/A'} {activeParameter.unit}</span>
                        </div>
                      </div>
                      {/* Gage Selector & Calibration Status */}
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] text-slate-400">Gage:</span>
                        <select
                          value={selectedGageTag}
                          onChange={(e) => setSelectedGageTag(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        >
                          <option value={activeParameter.gaugeOrInstrument}>
                            {activeParameter.gaugeOrInstrument} (QCP Default)
                          </option>
                          {gageService.getGages().map(g => (
                            <option key={g.id} value={g.assetTag}>
                              {g.assetTag}: {g.name} ({g.calibrationStatus.toUpperCase()})
                            </option>
                          ))}
                        </select>

                        {/* Live Calibration Status Badge */}
                        {(() => {
                          const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                          return check.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              Calibrated {check.gage ? `(Due: ${check.gage.nextCalibrationDueDate})` : 'Verified'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono animate-pulse">
                              <ShieldAlert className="w-3 h-3" />
                              EXPIRED GAGE &bull; BLOCKED
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Out of Calibration Blocking Alert Banner */}
                    {(() => {
                      const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                      if (check.isValid) return null;
                      return (
                        <div className="mb-2 p-2.5 bg-rose-950/60 border border-rose-500/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                            <div>
                              <strong className="text-white block font-bold text-xs">
                                INSPECTION BLOCKED: Gage is Out-of-Calibration!
                              </strong>
                              <span className="text-rose-300 text-[10px]">{check.blockedReason}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-bold uppercase text-[9px] shrink-0 font-mono">
                            LOCKED
                          </span>
                        </div>
                      );
                    })()}

                    {/* Measurements input table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                          Sample Readings ({localSamples.length})
                        </span>
                        <button
                          type="button"
                          onClick={handleAutofillNominal}
                          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                        >
                          <Sparkles className="w-3 h-3" /> Simulate
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {localSamples.map((sample, idx) => (
                          <div
                            key={sample.sampleNumber}
                            className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/80 text-xs font-mono"
                          >
                            <span className="text-slate-400 font-bold">
                              Sample #{sample.sampleNumber}
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.001"
                                value={sample.measuredValue ?? ''}
                                onChange={(e) => handleSampleChange(idx, e.target.value)}
                                placeholder="Reading"
                                className={`w-28 px-2 py-1 rounded border text-xs font-bold bg-slate-950 focus:outline-none ${
                                  sample.isOutOfSpec
                                    ? 'border-rose-500 text-rose-300 bg-rose-950/30'
                                    : sample.measuredValue !== null && sample.measuredValue !== undefined
                                    ? 'border-emerald-500 text-emerald-300'
                                    : 'border-slate-700 text-white'
                                }`}
                              />
                              {sample.isOutOfSpec ? (
                                <span className="text-[10px] font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/20">
                                  OOS
                                </span>
                              ) : sample.measuredValue !== null && sample.measuredValue !== undefined ? (
                                <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">
                                  PASS
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">—</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {saveNotice && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {saveNotice}
                          </span>
                        )}
                        {(() => {
                          const check = gageService.checkGageValidity(selectedGageTag || activeParameter.gaugeOrInstrument);
                          const isBlocked = !check.isValid;
                          return (
                            <button
                              type="button"
                              onClick={handleSaveParam}
                              disabled={savingParam || isBlocked}
                              className={`ml-auto px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                                isBlocked
                                  ? 'bg-rose-900/60 border border-rose-500 text-rose-300 cursor-not-allowed opacity-80'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                            >
                              {isBlocked && <Lock className="w-3.5 h-3.5" />}
                              {savingParam ? 'Saving...' : isBlocked ? 'Blocked (Gage Expired)' : 'Save Parameter'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SECTION 2: 3D-Anchored Defect Photo Evidence */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Defect Photo Capture Anchored to 3D Part Coordinates ({task.photos.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Defect Category</label>
                <select
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="tool_chatter">Tool Vibration Chatter (Ra Spike)</option>
                  <option value="dimensional_undercut">Dimensional Undercut / Under-tolerance</option>
                  <option value="dimensional_overcut">Dimensional Overcut</option>
                  <option value="surface_burr">Heavy Parting Burr</option>
                  <option value="heat_discoloration">Thermal Burning / Discoloration</option>
                  <option value="acceptable_finish">Acceptable Finish Proof</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Preset Defect Macro</label>
                <select
                  value={selectedPresetPhotoId}
                  onChange={(e) => {
                    setSelectedPresetPhotoId(e.target.value);
                    const p = IPQC_DEFECT_PHOTOS.find(x => x.id === e.target.value);
                    if (p) setPhotoCaption(p.caption);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  {IPQC_DEFECT_PHOTOS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.caption.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Caption / Observation</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Endmill vibration chatter on bore shoulder"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-200">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleAttachPhoto}
                  className="flex-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Pin Photo
                </button>
              </div>
            </div>

            {/* Gallery */}
            {task.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {task.photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
                    <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(task.id, photo.id)}
                      className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-slate-300 rounded transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="p-2 text-[10px] text-slate-300">
                      <span className="text-amber-400 font-bold block">{photo.markerLabel || 'General Pin'}</span>
                      <p className="truncate">{photo.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Official Station Sign-Off & Gate Authorization */}
          <form onSubmit={handleExecuteSignOff} className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-white">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Shopfloor Gate Authorization & Machine Interlock
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSignOffResult('pass')}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  signOffResult === 'pass'
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Pass & Release Gate</div>
                    <div className="text-[10px] text-slate-400">Unlock machine for batch run</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => setSignOffResult('hold')}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  signOffResult === 'hold'
                    ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Hold Machine / Interlock</div>
                    <div className="text-[10px] text-slate-400">Requires tool offset adjustment</div>
                  </div>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => setSignOffResult('fail')}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  signOffResult === 'fail'
                    ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Scrap / Reject Setup</div>
                    <div className="text-[10px] text-slate-400">Log non-conformance ticket</div>
                  </div>
                </div>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {signOffResult === 'hold' && (
              <div>
                <label className="block text-xs text-amber-400 font-bold mb-1">
                  Machine Hold Reason & Corrective Setup Action
                </label>
                <textarea
                  rows={2}
                  required
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="Specify tool offset, insert replacement, or fixture re-clamping required..."
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Signing Inspector</label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Badge ID</label>
                <input
                  type="text"
                  required
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSigningOff}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4" />
                {isSigningOff ? 'Committing Sign-Off...' : 'Commit Gate Decision'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
