// src/components/time-capture/LiveClockStopwatch.tsx

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  StopCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Gauge,
  CheckCircle2,
  User,
  Zap
} from 'lucide-react';
import { OperationTimeLog } from '../../types/timeCapture';

interface LiveClockStopwatchProps {
  log: OperationTimeLog;
  onClockOut: (log: OperationTimeLog) => void;
  onPause: (log: OperationTimeLog) => void;
  onResume: (log: OperationTimeLog) => void;
  isCompact?: boolean;
}

export const LiveClockStopwatch: React.FC<LiveClockStopwatchProps> = ({
  log,
  onClockOut,
  onPause,
  onResume,
  isCompact = false
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const startMs = new Date(log.startedAt).getTime();

    const calculateElapsed = () => {
      if (log.status === 'paused' && log.pausedAt) {
        // Freeze at pause time
        const pauseMs = new Date(log.pausedAt).getTime();
        return Math.max(0, Math.floor((pauseMs - startMs) / 1000));
      }
      return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    };

    setElapsedSeconds(calculateElapsed());

    if (log.status === 'running') {
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [log.startedAt, log.status, log.pausedAt]);

  const elapsedMinutes = Math.round((elapsedSeconds / 60) * 10) / 10;
  const standardMinutes = log.standardTimeMinutes || 60;
  const standardSeconds = standardMinutes * 60;

  // Pace & Variance
  const varianceMinutes = Math.round((elapsedMinutes - standardMinutes) * 10) / 10;
  const progressRatio = Math.min(2, elapsedSeconds / (standardSeconds || 1));
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  const isOverrun = elapsedSeconds > standardSeconds;
  const isNearLimit = !isOverrun && progressRatio >= 0.85;

  // Format HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
          log.status === 'paused'
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : isOverrun
            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        }`}>
          <Clock size={12} className={log.status === 'running' ? 'animate-spin' : ''} />
          <span>{formatTime(elapsedSeconds)}</span>
        </span>
        <button
          onClick={() => onClockOut(log)}
          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded"
        >
          Stop
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all shadow-md ${
      log.status === 'paused'
        ? 'bg-amber-50/70 border-amber-200'
        : isOverrun
        ? 'bg-rose-50/70 border-rose-200 ring-1 ring-rose-300'
        : 'bg-white border-slate-200 hover:border-cyan-300'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-900 text-cyan-300 px-2 py-0.5 rounded">
              {log.workOrderNumber}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Seq {log.operationSequence}
            </span>
            {log.status === 'paused' ? (
              <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                PAUSED
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>RUNNING</span>
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
            {log.operationName}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {log.partName} <span className="font-mono text-slate-400">({log.partNumber})</span>
          </p>
        </div>

        {/* Work Center */}
        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-slate-500 block">
            {log.workCenterCode}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {log.workCenterName}
          </span>
        </div>
      </div>

      {/* Main Big Timer Display */}
      <div className="bg-slate-950 text-white rounded-xl p-3.5 mb-3.5 flex items-center justify-between shadow-inner">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Actual Elapsed Time
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-cyan-400">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Standard Target
          </div>
          <div className="text-sm font-mono font-bold text-slate-200">
            {standardMinutes} min
          </div>
          <div className={`text-[11px] font-mono font-bold ${
            isOverrun
              ? 'text-rose-400'
              : isNearLimit
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}>
            {isOverrun ? `+${varianceMinutes}m OVER` : `-${Math.abs(varianceMinutes)}m AHEAD`}
          </div>
        </div>
      </div>

      {/* Actual vs Standard Visual Progress Bar */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>0m</span>
          <span className="font-semibold text-slate-700">Pace: {progressPercent}% of Std</span>
          <span>Target: {standardMinutes}m</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverrun
                ? 'bg-rose-500'
                : isNearLimit
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Operator Attribution */}
      <div className="flex items-center justify-between text-xs text-slate-600 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
            {log.operatorName.charAt(0)}
          </div>
          <span className="font-medium text-slate-800">{log.operatorName}</span>
          <span className="text-[11px] font-mono text-slate-400">({log.operatorBadgeNumber})</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          In: {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Touch Action Buttons */}
      <div className="flex items-center gap-2">
        {log.status === 'running' ? (
          <button
            onClick={() => onPause(log)}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Pause operation for maintenance, setup, or tea break"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={() => onResume(log)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Resume running operation"
          >
            <Play size={14} />
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={() => onClockOut(log)}
          className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
        >
          <StopCircle size={16} />
          <span>Scan to Stop / Clock Out</span>
        </button>
      </div>
    </div>
  );
};
