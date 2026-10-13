// src/components/spc/OocAlertsDrawer.tsx

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  Search,
  Filter,
  Check,
  X,
  FileCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SpcOocAlert, AlertSeverity } from '../../types/spc';

interface OocAlertsDrawerProps {
  alerts: SpcOocAlert[];
  onAcknowledge: (alertId: string, acknowledgedBy: string, rootCause?: string, correctiveAction?: string) => void;
}

export const OocAlertsDrawer: React.FC<OocAlertsDrawerProps> = ({
  alerts,
  onAcknowledge
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'active'>('active');
  const [activeModalAlert, setActiveModalAlert] = useState<SpcOocAlert | null>(null);

  // Form states for CAPA dialog
  const [engineerName, setEngineerName] = useState<string>('Marcus Vance (Quality Engineer)');
  const [rootCause, setRootCause] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'active') return !a.acknowledged;
    if (filterSeverity === 'critical') return a.severity === 'critical';
    if (filterSeverity === 'warning') return a.severity === 'warning';
    return true;
  });

  const handleOpenAcknowledge = (alert: SpcOocAlert) => {
    setActiveModalAlert(alert);
    setRootCause(alert.rootCause || 'Carbide tool insert edge wear on finish pass');
    setCorrectiveAction(alert.correctiveAction || 'Indexed tool insert to edge #2, updated machine work offset');
  };

  const handleConfirmAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalAlert) return;
    onAcknowledge(activeModalAlert.id, engineerName, rootCause, correctiveAction);
    setActiveModalAlert(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Out-of-Control SPC Alerts &amp; CAPA</h3>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {alerts.filter(a => !a.acknowledged).length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automated Western Electric &amp; Nelson Rule anomaly detection log with corrective actions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setFilterSeverity('active')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterSeverity === 'active' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({alerts.filter(a => !a.acknowledged).length})
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterSeverity === 'critical' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterSeverity === 'warning' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-md transition ${
              filterSeverity === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">No active out-of-control alerts!</p>
            <p className="text-xs text-slate-500 mt-1">All monitored processes are running within Western Electric control limits.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.acknowledged
                    ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                    : isCritical
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : 'bg-amber-950/20 border-amber-500/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg border ${
                    alert.acknowledged
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isCritical
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {alert.acknowledged ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{alert.ruleName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCritical ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Subgroup #{alert.subgroupNumber} &bull; Obs: {alert.observedValue.toFixed(4)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      {alert.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">{alert.studyName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {alert.acknowledged && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved by {alert.acknowledgedBy}
                        </span>
                      )}
                    </div>

                    {alert.rootCause && (
                      <div className="mt-2 text-[11px] bg-slate-900/60 rounded-lg p-2 border border-slate-800 text-slate-300">
                        <span className="text-slate-400 font-semibold">Root Cause: </span>
                        {alert.rootCause}
                        <br />
                        <span className="text-slate-400 font-semibold">CAPA Action: </span>
                        {alert.correctiveAction}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="sm:self-center shrink-0">
                  {alert.acknowledged ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      CAPA Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenAcknowledge(alert)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg active:scale-95"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Acknowledge &amp; CAPA
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Acknowledge & Corrective Action Modal */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log SPC Corrective Action (CAPA)</h3>
                  <p className="text-xs text-slate-400">{activeModalAlert.ruleName} &bull; Subgroup #{activeModalAlert.subgroupNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAcknowledge} className="flex flex-col gap-4 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/80">
                <span className="text-slate-400 font-semibold">Violation Summary:</span>
                <p className="text-white mt-1">{activeModalAlert.description}</p>
                <div className="mt-2 text-slate-400">
                  Observed Value: <span className="font-mono text-white font-bold">{activeModalAlert.observedValue.toFixed(4)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Quality Engineer / Sign-off Name</label>
                <input
                  type="text"
                  required
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Identified Root Cause</label>
                <textarea
                  rows={2}
                  required
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Carbide insert flank wear, temperature drift, fixture deflection"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Corrective Action Taken (CAPA)</label>
                <textarea
                  rows={2}
                  required
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="e.g. Insert replaced, machine offset re-calibrated, verified 3 subsequent test pieces"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalAlert(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sign-off &amp; Resolve Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
