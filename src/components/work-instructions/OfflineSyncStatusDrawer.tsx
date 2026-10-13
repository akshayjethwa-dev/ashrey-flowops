// src/components/work-instructions/OfflineSyncStatusDrawer.tsx

import React, { useState } from 'react';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  DownloadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardDrive,
  Layers,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { OfflineSyncStatus, StepSignOffRecord } from '../../types/workInstruction';
import { workInstructionService } from '../../services/workInstructionService';

interface OfflineSyncStatusDrawerProps {
  status: OfflineSyncStatus;
  queuedSignOffs: StepSignOffRecord[];
  onClose: () => void;
  onRefresh: () => void;
}

export const OfflineSyncStatusDrawer: React.FC<OfflineSyncStatusDrawerProps> = ({
  status,
  queuedSignOffs,
  onClose,
  onRefresh
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleToggleSimulatedOffline = () => {
    const nextState = !status.isSimulatedOffline;
    workInstructionService.setSimulatedOffline(nextState);
    onRefresh();
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await workInstructionService.syncOfflineQueue();
      setSyncFeedback(`Successfully synchronized ${res.syncedCount} queued sign-offs to server.`);
      onRefresh();
    } catch {
      setSyncFeedback('Sync failed. Please check network connectivity.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrecacheAll = () => {
    workInstructionService.cacheWorkOrderForOffline('ALL-ACTIVE');
    setSyncFeedback('All standard work orders, blueprints, and SOP videos pre-cached for offline tablet usage.');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${status.isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              {status.isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Offline Storage & Sync Hub</h2>
              <p className="text-[11px] text-slate-400">
                PWA Local Cache & Shopfloor Deadzone Resilience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {syncFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Current Connectivity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Network Connection</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className={status.isOnline ? 'text-emerald-700' : 'text-amber-700'}>
                  {status.isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
                </span>
              </div>
            </div>

            {/* Offline Simulation Switch */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-800">Simulate Shopfloor Offline Mode</div>
                <div className="text-[10px] text-slate-500">Test offline tablet sign-off without disabling WiFi</div>
              </div>
              <button
                type="button"
                onClick={handleToggleSimulatedOffline}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                  status.isSimulatedOffline
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {status.isSimulatedOffline ? 'Active (Offline)' : 'Disabled (Online)'}
              </button>
            </div>
          </div>

          {/* Offline Sync Action & Stats */}
          <div className="bg-cyan-50/50 border border-cyan-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-cyan-900">Pending Sync Queue</div>
                <div className="text-[11px] text-cyan-700">
                  {queuedSignOffs.length} sign-offs waiting to upload
                </div>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || queuedSignOffs.length === 0 || !status.isOnline}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400" />
              <span>Last synced: {status.lastSyncTimestamp ? new Date(status.lastSyncTimestamp).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>

          {/* Queued Sign-offs List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Queued Sign-off Actions ({queuedSignOffs.length})</span>
            </div>
            {queuedSignOffs.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No pending offline sign-offs. Everything is synced.
              </div>
            ) : (
              <div className="space-y-2">
                {queuedSignOffs.map(q => (
                  <div
                    key={q.id}
                    className="p-2.5 bg-white border border-amber-200 rounded-lg text-xs space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{q.workOrderNumber} · Step {q.stepNumber}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                        QUEUED
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px]">{q.operationName}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Operator: {q.operatorName} ({q.operatorBadgeNumber})</span>
                      <span>{q.offlineTimestamp ? new Date(q.offlineTimestamp).toLocaleTimeString() : 'Offline'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local Storage & Cache Size */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HardDrive size={14} className="text-cyan-600" />
                <span>PWA Offline Cache Usage</span>
              </span>
              <span className="font-mono text-slate-600 font-bold">{status.storageUsageKb} KB</span>
            </div>

            <div className="text-[11px] text-slate-500">
              Cached: 3 Work Orders, 4 SVG Engineering Drawings, 1 HD SOP Video Player.
            </div>

            <button
              onClick={handlePrecacheAll}
              className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <DownloadCloud size={14} className="text-cyan-600" />
              <span>Pre-Cache All Drawings for Shift</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
