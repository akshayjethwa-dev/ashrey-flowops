// src/pages/production/DigitalWorkInstructionsPage.tsx

import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HardDrive,
  Wifi,
  WifiOff,
  Tablet,
  Monitor,
  Printer,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Lock,
  Unlock,
  Wrench,
  AlertOctagon,
  Eye,
  Video,
  FileCheck,
  UserCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { useWorkInstructions } from '../../hooks/useWorkInstructions';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useAuth } from '../../context/AuthContext';
import { EngineeringDrawingViewer } from '../../components/work-instructions/EngineeringDrawingViewer';
import { InstructionVideoPlayer } from '../../components/work-instructions/InstructionVideoPlayer';
import { StepSignOffModal } from '../../components/work-instructions/StepSignOffModal';
import { OfflineSyncStatusDrawer } from '../../components/work-instructions/OfflineSyncStatusDrawer';
import { InstructionMedia, StepSignOffRecord } from '../../types/workInstruction';

export const DigitalWorkInstructionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tenant, profile, user } = useAuth();
  const { workOrders } = useWorkOrders(tenant?.id);

  // Active Work Order selection (defaults to query param or WO-2026-0001)
  const initialWo = searchParams.get('wo') || 'WO-2026-0001';
  const [selectedWoNumber, setSelectedWoNumber] = useState(initialWo);

  const selectedWorkOrder = useMemo(() => {
    return workOrders.find(w => w.orderNumber === selectedWoNumber) || workOrders[0];
  }, [workOrders, selectedWoNumber]);

  const {
    instructions,
    currentInstruction,
    selectedInstructionId,
    setSelectedInstructionId,
    activeStepIndex,
    setActiveStepIndex,
    currentStep,
    currentStepSignOff,
    signOffsForCurrent,
    isStepLocked,
    completedStepsCount,
    totalStepsCount,
    progressPercent,
    offlineStatus,
    setSimulatedOffline
  } = useWorkInstructions(selectedWoNumber);

  // Tablet UI Mode Toggle
  const [isTabletMode, setIsTabletMode] = useState<boolean>(false);
  // Active Media Tab inside Step ('drawing' | 'video' | 'image')
  const [activeMediaTab, setActiveMediaTab] = useState<'drawing' | 'video' | 'image'>('drawing');
  // Modals & Drawers
  const [showSignOffModal, setShowSignOffModal] = useState<boolean>(false);
  const [showOfflineDrawer, setShowOfflineDrawer] = useState<boolean>(false);
  const [showTravelerModal, setShowTravelerModal] = useState<boolean>(false);
  const [precacheToast, setPrecacheToast] = useState<string | null>(null);

  // Find operations for current work order
  const woOperations = selectedWorkOrder?.operations || [
    { id: 'op-1', name: 'Material Cutting & Facing', sequence: 10, status: 'completed' },
    { id: 'op-2', name: 'CNC Turning & OD/ID Roughing', sequence: 20, status: 'in_progress' },
    { id: 'op-3', name: 'Gear Hobbing & Spline Cutting', sequence: 30, status: 'pending' },
    { id: 'op-5', name: 'CMM & Final Inspection', sequence: 50, status: 'pending' }
  ];

  // Map active media item
  const selectedMedia: InstructionMedia | undefined = useMemo(() => {
    if (!currentStep || !currentStep.media || currentStep.media.length === 0) return undefined;
    return currentStep.media.find(m => m.type === activeMediaTab) || currentStep.media[0];
  }, [currentStep, activeMediaTab]);

  // Set default media tab when step changes
  React.useEffect(() => {
    if (currentStep && currentStep.media && currentStep.media.length > 0) {
      setActiveMediaTab(currentStep.media[0].type);
    }
  }, [activeStepIndex, currentStep]);

  const handlePrecache = () => {
    setPrecacheToast(`Pre-cached Work Order ${selectedWoNumber} and CAD drawings for offline shift access.`);
    setTimeout(() => setPrecacheToast(null), 4000);
  };

  const handleNextStep = () => {
    if (activeStepIndex < totalStepsCount - 1 && !isStepLocked(activeStepIndex + 1)) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  const currentStepIsLocked = isStepLocked(activeStepIndex);

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none ${
      isTabletMode ? 'p-2 sm:p-4 text-base' : 'p-4 sm:p-6 text-sm'
    }`}>
      {/* Precache Toast Notification */}
      {precacheToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/80 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{precacheToast}</span>
        </div>
      )}

      {/* Top Application Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/work-orders')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Return to Work Orders Board"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded">
                Shopfloor Tablet Station
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedWorkOrder?.customerName || 'Tata Motors'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Digital Work Instructions</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-slate-800 text-cyan-300 border border-slate-700">
                {currentInstruction?.revision || 'Rev 3.2'}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls & Offline Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Work Order Selector */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400 mr-2 font-mono">WO:</span>
            <select
              value={selectedWoNumber}
              onChange={e => {
                setSelectedWoNumber(e.target.value);
                setSearchParams({ wo: e.target.value });
              }}
              className="bg-transparent text-white font-mono font-semibold focus:outline-none cursor-pointer"
            >
              <option value="WO-2026-0001" className="bg-slate-900 text-white">WO-2026-0001 · Gear Blank 42T</option>
              <option value="WO-2026-0002" className="bg-slate-900 text-white">WO-2026-0002 · Drive Shaft 30mm</option>
              <option value="WO-2026-0003" className="bg-slate-900 text-white">WO-2026-0003 · Coupling Flange 150mm</option>
            </select>
          </div>

          {/* Pre-Cache Offline Button */}
          <button
            onClick={handlePrecache}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Pre-cache CAD blueprints and instructions for offline shift"
          >
            <DownloadCloud size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Pre-Cache Offline</span>
          </button>

          {/* Offline / Online Network Indicator Button */}
          <button
            onClick={() => setShowOfflineDrawer(true)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium border flex items-center gap-1.5 transition active:scale-95 ${
              offlineStatus.isOnline
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
            }`}
          >
            {offlineStatus.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>
              {offlineStatus.isOnline ? 'Online' : 'Offline Mode'}
            </span>
            {offlineStatus.pendingQueueCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold px-1.5 rounded-full text-[10px] ml-1">
                {offlineStatus.pendingQueueCount}
              </span>
            )}
          </button>

          {/* Tablet Mode Toggle */}
          <button
            onClick={() => setIsTabletMode(!isTabletMode)}
            className={`p-1.5 sm:px-3 sm:py-1.5 text-xs rounded-lg border flex items-center gap-1.5 transition ${
              isTabletMode
                ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Large Touchscreen Tablet Mode"
          >
            <Tablet size={15} />
            <span className="hidden md:inline">{isTabletMode ? 'Tablet Touch On' : 'Tablet Mode'}</span>
          </button>

          {/* Print Traveler / SOP */}
          <button
            onClick={() => setShowTravelerModal(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            title="Print Digital SOP Traveler & DHR"
          >
            <Printer size={15} />
            <span className="hidden md:inline">Print DHR</span>
          </button>

          {/* Time Clock Kiosk */}
          <button
            onClick={() => navigate('/time-capture')}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs rounded-lg flex items-center gap-1.5 transition"
            title="Open Operator Time Clock Kiosk"
          >
            <Clock size={15} className="text-emerald-400" />
            <span className="hidden md:inline">Time Clock</span>
          </button>
        </div>
      </header>

      {/* Operation Tabs Navigation (Operation-wise instruction display) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {instructions.map((inst, idx) => {
          const isSelected = inst.id === selectedInstructionId;
          return (
            <button
              key={inst.id}
              onClick={() => {
                setSelectedInstructionId(inst.id);
                setActiveStepIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-900/60 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-700 text-slate-300'
              }`}>
                {inst.operationCode}
              </span>
              <span className="font-semibold">{inst.operationName}</span>
              <span className="text-[11px] text-slate-400">({inst.workCenterCode})</span>
            </button>
          );
        })}
      </div>

      {/* Operation Overview & Safety Specs Ribbon */}
      {currentInstruction && (
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 mb-4 backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-slate-400">Part:</span>{' '}
                <span className="font-semibold text-white">{currentInstruction.partName}</span>{' '}
                <span className="font-mono text-cyan-300">({currentInstruction.partNumber})</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div>
                <span className="text-slate-400">Work Center:</span>{' '}
                <span className="font-medium text-slate-200">{currentInstruction.workCenterName}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div>
                <span className="text-slate-400">Cycle Time:</span>{' '}
                <span className="font-mono text-slate-200">{currentInstruction.estimatedCycleTimeMinutes} min</span>
              </div>
            </div>

            {/* Overall Operation Progress */}
            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-medium">
                Sign-off Progress: {completedStepsCount}/{totalStepsCount} Steps
              </span>
              <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono font-bold text-cyan-300">{progressPercent}%</span>
            </div>
          </div>

          {/* Safety PPE & Fixture Highlights */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck size={13} className="text-cyan-400" />
                <span>MANDATORY PPE:</span>
              </span>
              {currentInstruction.safetyPpeRequired.map((ppe, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
                >
                  {ppe}
                </span>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FileCheck size={13} className="text-emerald-400" />
              <span>Approved by: {currentInstruction.approvedBy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Step Sequencer Bar (Horizontal Stepper) */}
      {currentInstruction && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
          {currentInstruction.steps.map((st, idx) => {
            const isActive = idx === activeStepIndex;
            const locked = isStepLocked(idx);
            const signOff = signOffsForCurrent.find(s => s.stepId === st.id);
            const isCompleted = signOff && (signOff.status === 'passed' || signOff.status === 'override_approved');

            return (
              <button
                key={st.id}
                onClick={() => {
                  if (!locked) setActiveStepIndex(idx);
                }}
                disabled={locked}
                className={`flex-1 min-w-[200px] p-3 rounded-xl border text-left transition-all relative ${
                  isActive
                    ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                    : isCompleted
                    ? 'bg-slate-850 border-emerald-700/60 hover:bg-slate-800'
                    : locked
                    ? 'bg-slate-900/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                    : 'bg-slate-850 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-cyan-300">
                    STEP {st.stepNumber}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800 px-1.5 py-0.5 rounded">
                      <CheckCircle2 size={11} />
                      <span>SIGNED</span>
                    </span>
                  ) : locked ? (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Lock size={11} />
                      <span>LOCKED</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800 px-1.5 py-0.5 rounded font-mono">
                      PENDING
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {st.title}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Step Workspace Area (2 Columns) */}
      {currentStep && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Left Column: Procedural Step Details & Checkpoints (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Step Detail Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 flex-1">
              {/* Step Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                    OPERATION STEP {currentStep.stepNumber} OF {totalStepsCount}
                  </span>
                  {currentStep.signOffRequired && (
                    <span className="text-xs font-semibold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>Sign-off Required</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">
                  {currentStep.title}
                </h2>
              </div>

              {/* Step Description */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-200 text-xs sm:text-sm leading-relaxed">
                {currentStep.description}
              </div>

              {/* Key Operating Points */}
              {currentStep.keyPoints && currentStep.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-cyan-400" />
                    <span>Key Operating Procedures & Critical Tolerances</span>
                  </div>
                  <ul className="space-y-2">
                    {currentStep.keyPoints.map((kp, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-700/40">
                        <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Hazard Warning */}
              {currentStep.safetyWarnings && currentStep.safetyWarnings.length > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertOctagon size={14} className="text-rose-400" />
                    <span>Safety Precautions & Pinch Points</span>
                  </div>
                  {currentStep.safetyWarnings.map((sw, i) => (
                    <div key={i} className="text-xs text-rose-200">
                      {sw}
                    </div>
                  ))}
                </div>
              )}

              {/* Tooling & Gauges */}
              {currentStep.toolingRequired && currentStep.toolingRequired.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Sliders size={13} className="text-cyan-400" />
                    <span>Calibrated Tooling & Fixtures:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentStep.toolingRequired.map((tl, i) => (
                      <span key={i} className="text-[11px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {tl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step Sign-Off Action Card (Bottom of left column) */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
              {currentStepSignOff ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-950/50 border border-emerald-700 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-700 rounded-lg text-white">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-200">
                          Step {currentStep.stepNumber} Successfully Signed Off
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          Operator: {currentStepSignOff.operatorName} ({currentStepSignOff.operatorBadgeNumber}) · {new Date(currentStepSignOff.signedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 border border-emerald-700 text-emerald-200 font-bold">
                      {currentStepSignOff.status.toUpperCase()}
                    </span>
                  </div>

                  {currentStepSignOff.measuredValue !== undefined && (
                    <div className="text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-700 flex justify-between">
                      <span className="text-slate-400">Recorded Measurement:</span>
                      <span className="text-cyan-300 font-bold">{currentStepSignOff.measuredValue.toFixed(3)} mm (PASS)</span>
                    </div>
                  )}

                  {/* Re-sign button */}
                  <button
                    onClick={() => setShowSignOffModal(true)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition"
                  >
                    View / Edit Sign-off Details
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Step Verification Status:</span>
                    <span className="text-amber-400 font-mono font-bold">Pending Sign-off</span>
                  </div>

                  {currentStepIsLocked ? (
                    <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                      <Lock size={16} className="text-slate-500" />
                      <span>Complete previous steps before signing off Step {currentStep.stepNumber}.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignOffModal(true)}
                      className={`w-full py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                        isTabletMode ? 'text-base py-4' : 'text-sm'
                      }`}
                    >
                      <ShieldCheck size={20} />
                      <span>Sign-off Step {currentStep.stepNumber} Now</span>
                    </button>
                  )}
                </div>
              )}

              {/* Prev / Next Navigation buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-700">
                <button
                  onClick={handlePrevStep}
                  disabled={activeStepIndex === 0}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  <ChevronLeft size={16} />
                  <span>Previous Step</span>
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={activeStepIndex >= totalStepsCount - 1 || isStepLocked(activeStepIndex + 1)}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  <span>Next Step</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Media Display (Drawing, Video, Visual Inspection Photo) (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Media Selector Tabs (image/drawing/video support) */}
            <div className="flex items-center justify-between bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveMediaTab('drawing')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    activeMediaTab === 'drawing'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={15} />
                  <span>CAD Engineering Blueprint</span>
                </button>

                <button
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    activeMediaTab === 'video'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video size={15} />
                  <span>SOP Video Guide</span>
                </button>

                <button
                  onClick={() => setActiveMediaTab('image')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    activeMediaTab === 'image'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye size={15} />
                  <span>Visual Defect Standard</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-cyan-300 hidden sm:inline px-2">
                HD Shopfloor Media Engine
              </div>
            </div>

            {/* Media Canvas Body */}
            <div className="flex-1 min-h-[480px]">
              {activeMediaTab === 'drawing' && (
                <EngineeringDrawingViewer
                  media={
                    selectedMedia || {
                      id: 'def-dwg',
                      type: 'drawing',
                      title: 'Standard Component Blueprint',
                      url: 'svg-billet-acceptance',
                      drawingNumber: 'DWG-GB-42T-SHT01',
                      sheetNumber: 'Sheet 1 of 4',
                      cadDetails: [
                        { parameter: 'Bore H7', nominal: 50.0, toleranceUpper: 0.025, toleranceLower: 0.0, unit: 'mm' }
                      ]
                    }
                  }
                  isTabletMode={isTabletMode}
                />
              )}

              {activeMediaTab === 'video' && (
                <InstructionVideoPlayer
                  media={
                    selectedMedia || {
                      id: 'def-vid',
                      type: 'video',
                      title: 'Operator Machining Demonstration',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                      videoDurationSeconds: 45,
                      isVideoSimulated: true
                    }
                  }
                  isTabletMode={isTabletMode}
                />
              )}

              {activeMediaTab === 'image' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[500px]">
                  <img
                    src="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80"
                    alt="Visual Quality Standard"
                    className="max-h-[380px] w-auto object-cover rounded-lg shadow-lg border border-slate-700"
                  />
                  <div className="mt-4 text-center max-w-lg">
                    <div className="text-sm font-bold text-slate-100">
                      Visual Surface Finish Reference: Ra 1.6 vs Burr Defect Guide
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Check workpiece surface finish against reference comparator plate. Reject parts with chatter, tool marks, or chipped entry chamfers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step Sign-Off Modal */}
      {showSignOffModal && currentStep && currentInstruction && (
        <StepSignOffModal
          step={currentStep}
          workOrderId={selectedWorkOrder?.id || 'wo-1'}
          workOrderNumber={selectedWoNumber}
          operationId={currentInstruction.routingOperationId || currentInstruction.operationCode}
          operationName={currentInstruction.operationName}
          currentUserId={profile?.uid || user?.uid || 'usr-op-01'}
          currentUserName={profile?.name || user?.displayName || 'Ramesh K. (Operator)'}
          existingSignOff={currentStepSignOff}
          onClose={() => setShowSignOffModal(false)}
          onSuccess={() => {
            setShowSignOffModal(false);
          }}
        />
      )}

      {/* Offline Sync Status Drawer */}
      {showOfflineDrawer && (
        <OfflineSyncStatusDrawer
          status={offlineStatus}
          queuedSignOffs={signOffsForCurrent.filter(s => !s.synced)}
          onClose={() => setShowOfflineDrawer(false)}
          onRefresh={() => {}}
        />
      )}

      {/* Print Traveler & DHR Modal */}
      {showTravelerModal && currentInstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Shop Traveler & Digital Sign-Off Certificate
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedWoNumber} · {currentInstruction.operationName} ({currentInstruction.operationCode})
                </p>
              </div>
              <button onClick={() => setShowTravelerModal(false)} className="p-1 text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border">
                <div>Part: <strong>{currentInstruction.partName} ({currentInstruction.partNumber})</strong></div>
                <div>Customer: <strong>{selectedWorkOrder?.customerName || 'Tata Motors'}</strong></div>
                <div>Revision: <strong>{currentInstruction.revision}</strong></div>
                <div>Work Center: <strong>{currentInstruction.workCenterName}</strong></div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-semibold">
                    <tr>
                      <th className="p-2">Step</th>
                      <th className="p-2">Task</th>
                      <th className="p-2">Measured</th>
                      <th className="p-2">Operator / Sign-off</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentInstruction.steps.map(st => {
                      const so = signOffsForCurrent.find(s => s.stepId === st.id);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold">Step {st.stepNumber}</td>
                          <td className="p-2">{st.title}</td>
                          <td className="p-2 font-mono">
                            {so?.measuredValue ? `${so.measuredValue.toFixed(3)} mm` : '—'}
                          </td>
                          <td className="p-2">
                            {so ? `${so.operatorName} (${so.operatorBadgeNumber})` : 'Pending'}
                          </td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              so?.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {so?.status || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Traveler / PDF</span>
              </button>
              <button
                onClick={() => setShowTravelerModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
