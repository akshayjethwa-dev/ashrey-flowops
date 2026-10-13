// src/components/work-instructions/StepSignOffModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  PenTool,
  Clock,
  Wifi,
  WifiOff,
  User,
  Sliders,
  Sparkles,
  Eraser,
  Lock,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  WorkInstructionStep,
  StepSignOffRecord,
  SignOffType
} from '../../types/workInstruction';
import { workInstructionService } from '../../services/workInstructionService';

interface StepSignOffModalProps {
  step: WorkInstructionStep;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  currentUserId: string;
  currentUserName: string;
  existingSignOff?: StepSignOffRecord;
  onClose: () => void;
  onSuccess: (record: StepSignOffRecord) => void;
}

export const StepSignOffModal: React.FC<StepSignOffModalProps> = ({
  step,
  workOrderId,
  workOrderNumber,
  operationId,
  operationName,
  currentUserId,
  currentUserName,
  existingSignOff,
  onClose,
  onSuccess
}) => {
  const isOnline = workInstructionService.isEffectiveOnline();

  // Form states
  const [operatorName, setOperatorName] = useState(
    existingSignOff?.operatorName || currentUserName || 'Ramesh K. (Operator)'
  );
  const [operatorBadge, setOperatorBadge] = useState(
    existingSignOff?.operatorBadgeNumber || 'EMP-7041'
  );

  // Measurement state
  const defaultMeasured = existingSignOff?.measuredValue !== undefined
    ? String(existingSignOff.measuredValue)
    : step.measurementConfig
    ? String(step.measurementConfig.nominalValue + 0.012) // pre-populate with nominal mid
    : '';
  const [measuredInput, setMeasuredInput] = useState(defaultMeasured);

  // Checklist state
  const [checklistValues, setChecklistValues] = useState<Record<string, boolean>>(() => {
    if (existingSignOff?.checklistCompleted) {
      return existingSignOff.checklistCompleted;
    }
    const init: Record<string, boolean> = {};
    step.checklistItems?.forEach(item => {
      init[item.id] = false;
    });
    return init;
  });

  // Supervisor override state (if measurement out of tolerance)
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorBadge, setSupervisorBadge] = useState('');
  const [notes, setNotes] = useState(existingSignOff?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Canvas Signature Pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawnSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Measurement Tolerance Math
  const numVal = parseFloat(measuredInput);
  const hasValidNum = !isNaN(numVal);
  let isMeasurementInTolerance = true;
  let devFromNominal = 0;
  let minAcceptable = 0;
  let maxAcceptable = 0;

  if (step.measurementConfig && hasValidNum) {
    const { nominalValue, upperTolerance, lowerTolerance } = step.measurementConfig;
    minAcceptable = nominalValue + lowerTolerance;
    maxAcceptable = nominalValue + upperTolerance;
    isMeasurementInTolerance = numVal >= minAcceptable && numVal <= maxAcceptable;
    devFromNominal = numVal - nominalValue;
  }

  // Checklist completion check
  const allMandatoryChecked = step.checklistItems
    ? step.checklistItems.filter(c => c.mandatory).every(c => checklistValues[c.id])
    : true;

  // Validation before submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!operatorName.trim() || !operatorBadge.trim()) {
      setErrorMsg('Operator Name and Badge ID are mandatory.');
      return;
    }

    if (step.signOffType === 'measurement') {
      if (!hasValidNum) {
        setErrorMsg('Please enter a valid numeric gauge measurement reading.');
        return;
      }
      if (!isMeasurementInTolerance && !supervisorName.trim()) {
        setErrorMsg('Reading is OUT OF TOLERANCE. Quality Inspector / Supervisor authorization is required to approve this step.');
        return;
      }
    }

    if (step.signOffType === 'checklist' && !allMandatoryChecked) {
      setErrorMsg('All mandatory verification criteria must be checked before sign-off.');
      return;
    }

    // Save signature SVG or data URL
    let signatureSvg: string | undefined;
    if (canvasRef.current && hasDrawnSignature) {
      signatureSvg = canvasRef.current.toDataURL('image/png');
    }

    const res = workInstructionService.recordStepSignOff({
      step,
      workOrderId,
      workOrderNumber,
      operationId,
      operationName,
      operatorId: currentUserId || 'usr-op-01',
      operatorName: operatorName.trim(),
      operatorBadgeNumber: operatorBadge.trim(),
      measuredValue: hasValidNum ? numVal : undefined,
      checklistCompleted: checklistValues,
      notes: notes.trim(),
      signatureSvg,
      supervisorName: supervisorName.trim() || undefined,
      supervisorBadgeNumber: supervisorBadge.trim() || undefined
    });

    if (res.success) {
      onSuccess(res.record);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 rounded-lg text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/50">
                  STEP {step.stepNumber} SIGN-OFF
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-mono">{workOrderNumber}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Network & Offline Status Banner */}
        <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
          isOnline
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-900 border-amber-200'
        }`}>
          <div className="flex items-center gap-1.5">
            {isOnline ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-amber-600" />}
            <span className="font-medium">
              {isOnline ? 'Online Sync Active' : 'Offline Mode Active (Sign-off will queue locally)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {operationName}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Measurement Entry Section (If Step Type == Measurement) */}
          {step.signOffType === 'measurement' && step.measurementConfig && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Gauge Reading: {step.measurementConfig.parameterName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Instrument: {step.measurementConfig.gaugeToolRequired}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-300">
                    Nominal: {step.measurementConfig.nominalValue.toFixed(3)} {step.measurementConfig.unit}
                  </span>
                </div>
              </div>

              {/* Input & Unit */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.001"
                    value={measuredInput}
                    onChange={e => setMeasuredInput(e.target.value)}
                    placeholder="Enter calibrated gauge reading..."
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <span className="absolute right-3 top-3 text-sm font-semibold text-slate-400">
                    {step.measurementConfig.unit}
                  </span>
                </div>
              </div>

              {/* Visual Tolerance Bar */}
              {hasValidNum && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Min: {minAcceptable.toFixed(3)}</span>
                    <span className="text-slate-800 font-bold">Target: {step.measurementConfig.nominalValue.toFixed(3)}</span>
                    <span>Max: {maxAcceptable.toFixed(3)}</span>
                  </div>

                  <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                    {/* Tolerance Window in green */}
                    <div className="absolute inset-y-0 bg-emerald-300/80 left-0 right-0" />
                    {/* Position marker */}
                    <div
                      className={`absolute top-0 bottom-0 w-2.5 rounded-full shadow-md transition-all ${
                        isMeasurementInTolerance ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                      style={{
                        left: `${Math.max(
                          2,
                          Math.min(
                            96,
                            50 + ((numVal - step.measurementConfig.nominalValue) / (step.measurementConfig.upperTolerance || 0.05)) * 40
                          )
                        )}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      isMeasurementInTolerance ? 'text-emerald-700' : 'text-rose-700 font-bold'
                    }`}>
                      {isMeasurementInTolerance ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>PASS — In Tolerance ({devFromNominal >= 0 ? `+${devFromNominal.toFixed(3)}` : devFromNominal.toFixed(3)} {step.measurementConfig.unit})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="text-rose-600" />
                          <span>OUT OF TOLERANCE ({devFromNominal >= 0 ? `+${devFromNominal.toFixed(3)}` : devFromNominal.toFixed(3)} {step.measurementConfig.unit})</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tol: +{step.measurementConfig.upperTolerance} / {step.measurementConfig.lowerTolerance}
                    </span>
                  </div>
                </div>
              )}

              {/* Quality Out-of-Tolerance Gate */}
              {!isMeasurementInTolerance && hasValidNum && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 mt-2">
                  <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-700" />
                    <span>Supervisor / Quality Gate Override Required</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    This measured value is outside the drawing limits. Enter Supervisor credentials to grant conditional MRB concession.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Supervisor Name"
                      value={supervisorName}
                      onChange={e => setSupervisorName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Supervisor Badge #"
                      value={supervisorBadge}
                      onChange={e => setSupervisorBadge(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Checklist Criteria Section */}
          {step.checklistItems && step.checklistItems.length > 0 && (
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                <span>Mandatory Step Verification Checklist</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {Object.values(checklistValues).filter(Boolean).length} of {step.checklistItems.length} verified
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {step.checklistItems.map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100/60 cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checklistValues[item.id] || false}
                      onChange={e =>
                        setChecklistValues(prev => ({
                          ...prev,
                          [item.id]: e.target.checked
                        }))
                      }
                      className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-tight">
                      {item.label}
                      {item.mandatory && (
                        <span className="text-rose-500 font-bold ml-1">*</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 3. Operator Credentials & Badge ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="e.g. Ramesh K."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator Badge # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={operatorBadge}
                onChange={e => setOperatorBadge(e.target.value)}
                placeholder="e.g. EMP-7041"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          {/* 4. Digital Signature Pad (Canvas Touch & Stylus) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <PenTool size={13} className="text-cyan-600" />
                <span>Operator Touch Signature (Tablet / Stylus)</span>
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <Eraser size={12} />
                <span>Clear Canvas</span>
              </button>
            </div>
            <div className="border border-slate-300 rounded-xl bg-slate-50/70 p-1 flex justify-center">
              <canvas
                ref={canvasRef}
                width={480}
                height={95}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-24 bg-white rounded-lg border border-dashed border-slate-300 cursor-crosshair touch-none"
              />
            </div>
            <div className="text-[11px] text-slate-400 text-center">
              Sign with finger or stylus to authenticate step completion.
            </div>
          </div>

          {/* 5. Notes / Deviations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shopfloor Notes / Machine Observation (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Flange face cleaned with degreaser; slight swarf on jaw 2 removed before cut..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Lock Step Sign-off</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
