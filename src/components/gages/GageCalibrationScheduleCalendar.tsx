// src/components/gages/GageCalibrationScheduleCalendar.tsx

import React from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Award,
  Layers
} from 'lucide-react';
import { GageInstrument } from '../../types/gageCalibration';

interface GageCalibrationScheduleCalendarProps {
  gages: GageInstrument[];
  onSelectGage: (gage: GageInstrument) => void;
  onRecordCalibration: (gage: GageInstrument) => void;
}

export const GageCalibrationScheduleCalendar: React.FC<GageCalibrationScheduleCalendarProps> = ({
  gages,
  onSelectGage,
  onRecordCalibration
}) => {
  // Sort gages by expiration date ascending (expired first)
  const sorted = [...gages].sort((a, b) => {
    return new Date(a.nextCalibrationDueDate).getTime() - new Date(b.nextCalibrationDueDate).getTime();
  });

  const expiredList = sorted.filter(g => g.daysRemaining < 0 && g.calibrationStatus !== 'out_of_service');
  const due7DaysList = sorted.filter(g => g.daysRemaining >= 0 && g.daysRemaining <= 7);
  const due30DaysList = sorted.filter(g => g.daysRemaining > 7 && g.daysRemaining <= 30);
  const dueLaterList = sorted.filter(g => g.daysRemaining > 30 && g.calibrationStatus !== 'out_of_service');
  const outOfServiceList = sorted.filter(g => g.calibrationStatus === 'out_of_service' || g.calibrationStatus === 'scrapped');

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col gap-6 text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Calibration Schedule &amp; Expiration Timeline</h3>
            <p className="text-xs text-slate-400">
              Proactive metrology planning to prevent shopfloor inspection stoppages
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Gages: <strong className="text-white">{gages.length}</strong>
        </div>
      </div>

      {/* Timeline Schedule Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Column 1: Overdue & Expired (BLOCKED) */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5 uppercase font-mono">
              <ShieldAlert className="w-4 h-4" />
              Expired ({expiredList.length})
            </span>
            <span className="text-[10px] text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded">
              BLOCKED
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Inspection locked until recalibrated</p>

          <div className="space-y-2 mt-1">
            {expiredList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">No expired instruments!</div>
            ) : (
              expiredList.map(g => (
                <div
                  key={g.id}
                  className="bg-slate-900/80 border border-rose-500/40 rounded-lg p-3 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{g.assetTag}</span>
                    <span className="text-rose-400 font-bold font-mono text-[10px]">
                      {Math.abs(g.daysRemaining)}d Overdue
                    </span>
                  </div>
                  <span className="text-slate-300 line-clamp-1">{g.name}</span>
                  <span className="text-[10px] text-slate-400">{g.location}</span>
                  <button
                    onClick={() => onRecordCalibration(g)}
                    className="mt-1 w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] transition shadow"
                  >
                    Calibrate Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Due in 7 Days (Urgent) */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase font-mono">
              <AlertTriangle className="w-4 h-4" />
              Due 7 Days ({due7DaysList.length})
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              URGENT
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Upcoming expiration this week</p>

          <div className="space-y-2 mt-1">
            {due7DaysList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">None due this week</div>
            ) : (
              due7DaysList.map(g => (
                <div
                  key={g.id}
                  className="bg-slate-900/80 border border-amber-500/40 rounded-lg p-3 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{g.assetTag}</span>
                    <span className="text-amber-400 font-bold font-mono text-[10px]">
                      {g.daysRemaining}d Left
                    </span>
                  </div>
                  <span className="text-slate-300 line-clamp-1">{g.name}</span>
                  <span className="text-[10px] text-slate-400">Due: {g.nextCalibrationDueDate}</span>
                  <button
                    onClick={() => onRecordCalibration(g)}
                    className="mt-1 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] transition shadow"
                  >
                    Schedule Cal
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Due in 30 Days (Scheduled) */}
        <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5 uppercase font-mono">
              <Clock className="w-4 h-4" />
              Due 30 Days ({due30DaysList.length})
            </span>
            <span className="text-[10px] text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded">
              NEXT UP
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Calibration scheduled this month</p>

          <div className="space-y-2 mt-1">
            {due30DaysList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">None due within 30 days</div>
            ) : (
              due30DaysList.map(g => (
                <div
                  key={g.id}
                  className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{g.assetTag}</span>
                    <span className="text-blue-400 font-mono text-[10px]">{g.daysRemaining}d Left</span>
                  </div>
                  <span className="text-slate-300 line-clamp-1">{g.name}</span>
                  <span className="text-[10px] text-slate-400">Due: {g.nextCalibrationDueDate}</span>
                  <button
                    onClick={() => onSelectGage(g)}
                    className="mt-1 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-[11px] transition"
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: In-Calibration & Out-of-Service */}
        <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 uppercase font-mono">
              <CheckCircle2 className="w-4 h-4" />
              Valid (&gt;30d: {dueLaterList.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              OOS: {outOfServiceList.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Active and certified metrology tools</p>

          <div className="space-y-2 mt-1 max-h-[360px] overflow-y-auto pr-1">
            {dueLaterList.map(g => (
              <div
                key={g.id}
                onClick={() => onSelectGage(g)}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 flex flex-col gap-1 text-xs cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-[11px]">{g.assetTag}</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{g.daysRemaining}d</span>
                </div>
                <span className="text-slate-300 text-[11px] truncate">{g.name}</span>
              </div>
            ))}

            {outOfServiceList.map(g => (
              <div
                key={g.id}
                onClick={() => onSelectGage(g)}
                className="bg-slate-950/70 border border-rose-900/40 rounded-lg p-2.5 flex flex-col gap-1 text-xs cursor-pointer opacity-75"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-400 text-[11px]">{g.assetTag}</span>
                  <span className="text-rose-400 font-mono text-[10px] uppercase">{g.calibrationStatus}</span>
                </div>
                <span className="text-slate-400 text-[11px] truncate">{g.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
