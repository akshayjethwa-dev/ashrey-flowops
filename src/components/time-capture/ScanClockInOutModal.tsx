// src/components/time-capture/ScanClockInOutModal.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ScanLine,
  Camera,
  Keyboard,
  User,
  Zap,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  CameraScanner,
  createHardwareScannerListener,
  parseScan,
  ScanResult
} from '../../services/scannerService';
import { OperatorProfile, OperationTimeLog } from '../../types/timeCapture';
import { timeCaptureService } from '../../services/timeCaptureService';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useAuth } from '../../context/AuthContext';

interface ScanClockInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOperator: OperatorProfile;
  onClockInSubmit: (params: {
    workOrderId: string;
    workOrderNumber: string;
    operationId: string;
    operationSequence: number;
    operationName: string;
    partNumber: string;
    partName: string;
    workCenterName: string;
    workCenterCode: string;
    standardTimeMinutes: number;
  }) => void;
  onClockOutTrigger: (log: OperationTimeLog) => void;
}

export const ScanClockInOutModal: React.FC<ScanClockInOutModalProps> = ({
  isOpen,
  onClose,
  activeOperator,
  onClockInSubmit,
  onClockOutTrigger
}) => {
  const { tenant } = useAuth();
  const { workOrders } = useWorkOrders(tenant?.id);

  const [mode, setMode] = useState<'camera' | 'manual' | 'touchscreen'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Video scanner ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<CameraScanner | null>(null);

  // Selected for start prompt
  const [pendingStart, setPendingStart] = useState<{
    workOrder: any;
    operation: any;
  } | null>(null);

  const handleScanRaw = useCallback((scannedText: string) => {
    setFeedback(null);
    setPendingStart(null);

    const resolution = timeCaptureService.resolveScanForTimeCapture(scannedText);

    if (resolution.actionType === 'switch_operator' && resolution.operator) {
      setFeedback({
        type: 'success',
        message: `Identified Operator: ${resolution.operator.name} (${resolution.operator.badgeNumber})`
      });
      return;
    }

    if (resolution.actionType === 'stop' && resolution.matchedLog) {
      // Direct trigger to stop/clock-out
      onClose();
      onClockOutTrigger(resolution.matchedLog);
      return;
    }

    if (resolution.actionType === 'start' && resolution.workOrderNumber) {
      // Find matching work order
      const wo = workOrders.find(
        w => w.orderNumber.toUpperCase() === resolution.workOrderNumber!.toUpperCase()
      );
      if (wo) {
        // If specific operation was in composite scan
        if (resolution.operationCode) {
          const cleanCode = resolution.operationCode.toLowerCase();
          const targetOp = wo.operations.find(
            o => o.id.toLowerCase() === cleanCode ||
                 o.name.toLowerCase().includes(cleanCode) ||
                 cleanCode.includes(String(o.sequence))
          ) || wo.operations[0];

          setPendingStart({ workOrder: wo, operation: targetOp });
          setFeedback({
            type: 'info',
            message: `Matched ${wo.orderNumber} · ${targetOp.name}. Confirm to start clock.`
          });
          return;
        }

        // Just WO scanned, pick next pending operation
        const nextOp = wo.operations.find(o => o.status !== 'completed') || wo.operations[0];
        setPendingStart({ workOrder: wo, operation: nextOp });
        setFeedback({
          type: 'info',
          message: `Scanned ${wo.orderNumber}. Next stage: ${nextOp.name}. Confirm to start.`
        });
        return;
      }
    }

    setFeedback({
      type: 'error',
      message: resolution.description
    });
  }, [workOrders, onClose, onClockOutTrigger]);

  // Camera scanner hook
  useEffect(() => {
    if (!isOpen || mode !== 'camera' || !videoRef.current) return;

    const scanner = new CameraScanner();
    scannerRef.current = scanner;

    scanner.start(videoRef.current, (result) => {
      handleScanRaw(result.raw);
    }).catch(() => {
      setMode('manual');
      setFeedback({
        type: 'info',
        message: 'Camera not available. Enter barcode manually or select from touchscreen.'
      });
    });

    return () => scanner.stop();
  }, [isOpen, mode, handleScanRaw]);

  // Hardware scanner listener
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = createHardwareScannerListener((result) => {
      handleScanRaw(result.raw);
    });
    return cleanup;
  }, [isOpen, handleScanRaw]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanRaw(manualInput.trim());
      setManualInput('');
    }
  };

  const handleConfirmStart = () => {
    if (!pendingStart) return;
    const { workOrder, operation } = pendingStart;

    onClockInSubmit({
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.orderNumber,
      operationId: operation.id,
      operationSequence: operation.sequence,
      operationName: operation.name,
      partNumber: workOrder.partCode || 'PART-01',
      partName: workOrder.partName,
      workCenterName: operation.workCenterName || 'CNC Machine Center',
      workCenterCode: operation.workCenterId || 'WC-GEN-01',
      standardTimeMinutes: operation.standardTimeMinutes || 60
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-600 rounded-lg text-white">
              <ScanLine size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Barcode Clock-In / Clock-Out Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                Scan Work Order traveler, operation barcode, or operator badge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Operator Banner */}
        <div className="px-5 py-2 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <User size={14} className="text-cyan-400" />
            <span className="text-slate-400">Clocking as:</span>
            <span className="font-bold text-white">{activeOperator.name}</span>
            <span className="font-mono text-cyan-300">({activeOperator.badgeNumber})</span>
          </div>
          <span className="text-[10px] text-slate-400">{activeOperator.shift}</span>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'camera'
                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={14} />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'manual'
                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard size={14} />
            <span>Manual Barcode</span>
          </button>
          <button
            onClick={() => setMode('touchscreen')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'touchscreen'
                ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Touch Selector</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`px-5 py-2 text-xs flex items-center gap-2 border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : feedback.type === 'info'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
              : 'bg-rose-950/80 text-rose-300 border-rose-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          {/* Mode 1: Camera Scanner */}
          {mode === 'camera' && (
            <div className="relative aspect-video max-h-56 w-full bg-black rounded-xl overflow-hidden border border-slate-700 mx-auto flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Aiming Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-cyan-400/80 rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-cyan-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-cyan-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-cyan-400" />
                  <div className="absolute left-0 right-0 h-0.5 bg-cyan-400/80 animate-pulse top-1/2" />
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Manual Barcode Entry */}
          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Type Barcode or Scan with USB/Bluetooth Handheld Scanner:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    placeholder="e.g. WO-2026-0001, WO-2026-0001/OP-20, EMP-7041"
                    className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition"
                  >
                    Lookup
                  </button>
                </div>
              </div>

              {/* Quick sample barcodes clickable tags */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-400 mb-1.5">Quick Test Barcodes:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'WO-2026-0001/OP-20',
                    'WO-2026-0001',
                    'WO-2026-0002/OP-10',
                    'EMP-7041',
                    'EMP-3021'
                  ].map(sample => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleScanRaw(sample)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-[11px] font-mono transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Mode 3: Touchscreen Selector (No scanner needed) */}
          {mode === 'touchscreen' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-300 mb-2">
                Touch an operation below to clock in:
              </div>
              {workOrders.map(wo => (
                <div key={wo.id} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="font-mono text-cyan-300">{wo.orderNumber}</span>
                    <span>{wo.partName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {wo.operations.map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setPendingStart({ workOrder: wo, operation: op })}
                        className="p-2 bg-slate-900 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-left transition"
                      >
                        <div className="font-mono text-[10px] text-slate-400">
                          Seq {op.sequence} · {op.standardTimeMinutes}m
                        </div>
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {op.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Start Confirmation Card */}
          {pendingStart && (
            <div className="mt-4 p-4 bg-cyan-950/60 border border-cyan-500/80 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-cyan-300">
                  Ready to Clock In: {pendingStart.workOrder.orderNumber}
                </span>
                <span className="text-slate-400 font-mono">
                  Std: {pendingStart.operation.standardTimeMinutes || 60} min
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                Seq {pendingStart.operation.sequence}: {pendingStart.operation.name}
              </div>
              <div className="text-xs text-slate-300">
                Part: {pendingStart.workOrder.partName} ({pendingStart.workOrder.partCode}) · Operator: {activeOperator.name}
              </div>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-md"
              >
                <PlayCircle size={16} />
                <span>Confirm & Start Cycle Clock</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
