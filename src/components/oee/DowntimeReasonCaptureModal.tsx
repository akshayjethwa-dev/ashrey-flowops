// src/components/oee/DowntimeReasonCaptureModal.tsx

import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  X,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Layers,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  MachineLiveOee,
  DowntimeReasonCode,
  DowntimeCategoryType
} from '../../types/oee';

interface DowntimeReasonCaptureModalProps {
  machine: MachineLiveOee;
  reasons: DowntimeReasonCode[];
  onConfirmDowntime: (params: {
    machineId: string;
    reasonCodeId: string;
    operatorId: string;
    operatorName: string;
    notes?: string;
  }) => void;
  onClose: () => void;
}

export const DowntimeReasonCaptureModal: React.FC<DowntimeReasonCaptureModalProps> = ({
  machine,
  reasons,
  onConfirmDowntime,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReasonId, setSelectedReasonId] = useState<string>(reasons[0]?.id || '');
  const [operatorName, setOperatorName] = useState('Operator (Station #4)');
  const [operatorId, setOperatorId] = useState('USR-OPR-01');
  const [notes, setNotes] = useState('');

  // Category Tabs
  const categories: { key: string; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = {};
    reasons.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    return [
      { key: 'all', label: 'All Reason Codes', count: reasons.length },
      { key: 'breakdown', label: 'Equipment Breakdown', count: counts['breakdown'] || 0 },
      { key: 'changeover', label: 'Setup & Changeover', count: counts['changeover'] || 0 },
      { key: 'starvation', label: 'Material Starvation', count: counts['starvation'] || 0 },
      { key: 'utilities', label: 'Utilities & Alarms', count: counts['utilities'] || 0 },
      { key: 'operator_rest', label: 'Rest & 5S', count: counts['operator_rest'] || 0 }
    ];
  }, [reasons]);

  // Filter reasons
  const filteredReasons = useMemo(() => {
    return reasons.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchSearch =
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [reasons, selectedCategory, searchQuery]);

  const activeReason = reasons.find(r => r.id === selectedReasonId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReasonId) return;

    onConfirmDowntime({
      machineId: machine.machineId,
      reasonCodeId: selectedReasonId,
      operatorId,
      operatorName,
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl text-white">
        {/* Header Alert Ribbon */}
        <div className="bg-rose-950/90 px-6 py-4 border-b border-rose-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 rounded-xl text-white shadow-md animate-pulse">
              <AlertOctagon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-rose-300 font-bold bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/60">
                  Operator Downtime Prompt
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {machine.machineCode}
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-0.5">
                Machine Stop Detected: Categorize Downtime Reason
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-900/40 rounded-lg transition"
            title="Dismiss prompt"
          >
            <X size={18} />
          </button>
        </div>

        {/* Machine Context Banner */}
        <div className="bg-slate-950/90 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Machine:</span>
            <span className="text-white font-bold">{machine.machineName}</span>
          </div>

          {machine.activeWorkOrderNumber && (
            <div className="flex items-center gap-2 text-cyan-300">
              <Layers size={13} />
              <span>{machine.activeWorkOrderNumber}</span>
              {machine.activePartName && (
                <span className="text-slate-400">· {machine.activePartName}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-amber-400">
            <Clock size={13} />
            <span>Duration Timer Started Live</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Category Filter Pills & Search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Downtime Reason Code <span className="text-rose-400">*</span>
              </label>

              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code or cause..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition flex items-center gap-1.5 ${
                    selectedCategory === cat.key
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Code Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {filteredReasons.map(r => {
              const isSelected = selectedReasonId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReasonId(r.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/50 shadow-md'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded" style={{
                      backgroundColor: `${r.color}22`,
                      color: r.color,
                      border: `1px solid ${r.color}55`
                    }}>
                      {r.code}
                    </span>

                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      r.severity === 'critical'
                        ? 'bg-rose-900/80 text-rose-300'
                        : r.severity === 'high'
                        ? 'bg-amber-900/80 text-amber-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {r.severity}
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {r.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {r.categoryLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Selection Details & Remediation Guidance */}
          {activeReason && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-300">Selected Code:</span>
                <span className="font-mono text-cyan-300 font-bold">{activeReason.code} · {activeReason.label}</span>
              </div>

              {activeReason.suggestedAction && (
                <div className="flex items-start gap-1.5 text-amber-300 text-[11px] pt-1">
                  <Wrench size={13} className="shrink-0 mt-0.5 text-amber-400" />
                  <span><strong>Standard Recovery Procedure:</strong> {activeReason.suggestedAction}</span>
                </div>
              )}

              {activeReason.requiresTechnician && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] pt-0.5 font-semibold">
                  <ShieldAlert size={13} />
                  <span>Maintenance technician sign-off required before line restart</span>
                </div>
              )}
            </div>
          )}

          {/* Operator Identification & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operator Name / Badge ID <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="Operator name"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-rose-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Badge / Employee ID
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={e => setOperatorId(e.target.value)}
                placeholder="USR-OPR-01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Operator Observation Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Broken carbide insert tip, unusual vibration noise before stop..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedReasonId}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase rounded-lg shadow-lg shadow-rose-900/40 transition cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Log Downtime & Start Duration Timer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
