// src/components/mrp/MrpScheduleModal.tsx

import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  Bell,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { MrpScheduleConfig, MrpHorizon } from '../../types/mrp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: MrpScheduleConfig | null;
  onSave: (config: MrpScheduleConfig) => Promise<any>;
}

export const MrpScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [frequency, setFrequency] = useState<'daily' | 'shift' | 'weekly'>(
    config?.frequency || 'daily'
  );
  const [timeOfDay, setTimeOfDay] = useState(config?.timeOfDay || '06:00');
  const [horizonDays, setHorizonDays] = useState<MrpHorizon>(config?.horizonDays || 30);
  const [autoNotify, setAutoNotify] = useState(config?.autoNotifyProcurement ?? true);
  const [notifyEmail, setNotifyEmail] = useState(config?.notifyEmail || 'procurement@flowops.com');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSave({
        enabled,
        frequency,
        timeOfDay,
        horizonDays,
        plantId: 'all',
        autoNotifyProcurement: autoNotify,
        notifyEmail,
        lastRunAt: config?.lastRunAt,
        nextRunAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        safetyStockMultiplier: 1.0
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Automated MRP Engine Scheduler
              </h2>
              <p className="text-xs text-slate-400">
                Configure background calculation cycles & notification alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Main Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div>
              <h4 className="text-sm font-bold text-white">
                Enable Automated Background MRP
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically recalculates net requirements and alerts buyers to stockout risks
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Schedule Frequency */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-2">
              Execution Frequency *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'daily', label: 'Daily (Every Morning)', sub: 'Recommended at 06:00' },
                { val: 'shift', label: 'Shift Handover', sub: 'Every 8 hours' },
                { val: 'weekly', label: 'Weekly', sub: 'Sunday Night' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setFrequency(item.val as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    frequency === item.val
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          {frequency === 'daily' && (
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
                Daily Run Execution Time
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Scheduled runs execute before morning shift start so buyers start the day with fresh purchase lists.
              </p>
            </div>
          )}

          {/* Horizon */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-300 font-bold block mb-1.5">
              Automated Planning Horizon
            </label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value) as MrpHorizon)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value={7}>7 Days (Tactical Short-Term)</option>
              <option value={14}>14 Days (Bi-Weekly)</option>
              <option value={30}>30 Days (Standard Monthly - Recommended)</option>
              <option value={60}>60 Days (Two Months)</option>
              <option value={90}>90 Days (Quarterly Strategic)</option>
            </select>
          </div>

          {/* Notification Alert Settings */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 font-bold">
              <input
                type="checkbox"
                checked={autoNotify}
                onChange={(e) => setAutoNotify(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <Bell className="h-4 w-4 text-indigo-400" />
              Notify Procurement Team on Critical Stockout Risks
            </label>

            {autoNotify && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Recipient Dispatch Email / Group
                </label>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Next Run Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Last Automated Run:</span>
            <span className="text-slate-200 font-bold">
              {config?.lastRunAt ? new Date(config.lastRunAt).toLocaleString('en-IN') : 'None yet'}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Saving Configuration...' : 'Save Automation Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
