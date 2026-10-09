// src/components/scheduling/ShiftPatternManagerModal.tsx

import React, { useState } from 'react';
import {
  Clock,
  Users,
  Calendar,
  Plus,
  CheckCircle2,
  Sliders,
  X,
  UserCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ShiftDefinition, OperatorStaffing } from '../../types/scheduling';
import { WorkCenter, SkillLevel } from '../../types/routing';

interface ShiftPatternManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftDefinition[];
  operators: OperatorStaffing[];
  workCenters: WorkCenter[];
  onSaveShift: (shift: ShiftDefinition) => Promise<void>;
  onSaveOperator: (operator: OperatorStaffing) => Promise<void>;
}

export const ShiftPatternManagerModal: React.FC<ShiftPatternManagerModalProps> = ({
  isOpen,
  onClose,
  shifts,
  operators,
  workCenters,
  onSaveShift,
  onSaveOperator
}) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'operators'>('shifts');

  // Operator form state
  const [opName, setOpName] = useState<string>('');
  const [opCode, setOpCode] = useState<string>('');
  const [opShiftId, setOpShiftId] = useState<string>(shifts[0]?.id || 'sh_morning');
  const [opSkill, setOpSkill] = useState<SkillLevel>('skilled_operator');
  const [opWcId, setOpWcId] = useState<string>(workCenters[0]?.id || '');
  const [opNotes, setOpNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) return;

    setSubmitting(true);
    try {
      const newOp: OperatorStaffing = {
        id: `op_${Date.now()}`,
        name: opName.trim(),
        employeeCode: opCode.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        shiftId: opShiftId,
        primarySkill: opSkill,
        assignedWorkCenterIds: [opWcId],
        isAvailable: true,
        notes: opNotes.trim()
      };

      await onSaveOperator(newOp);
      setOpName('');
      setOpCode('');
      setOpNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateShiftEfficiency = async (shift: ShiftDefinition, newEff: number) => {
    await onSaveShift({
      ...shift,
      efficiencyFactor: newEff
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Shift Patterns &amp; Operator Availability
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define plant shift schedules, OEE efficiency multipliers, and operator staffing by technical skills.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'shifts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Shift Patterns ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab('operators')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'operators'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Operator Staffing Roster ({operators.length})
          </button>
        </div>

        {/* ── Tab 1: Shift Patterns ─────────────────────────────── */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shifts.map(shift => {
                const assignedOps = operators.filter(o => o.shiftId === shift.id);
                return (
                  <div
                    key={shift.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: shift.color }}
                        />
                        <h4 className="font-bold text-slate-100 text-sm">
                          {shift.name}
                        </h4>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {shift.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Timings</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Gross / Break</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {shift.grossHours}h / {shift.breakMinutes}m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Net Hours</span>
                        <span className="font-mono font-semibold text-indigo-300">
                          {shift.netHours} hrs
                        </span>
                      </div>
                    </div>

                    {/* Efficiency Factor Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">OEE Efficiency Factor:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {Math.round(shift.efficiencyFactor * 100)}% ({parseFloat((shift.netHours * shift.efficiencyFactor).toFixed(2))}h effective)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.60"
                        max="1.00"
                        step="0.05"
                        value={shift.efficiencyFactor}
                        onChange={e => handleUpdateShiftEfficiency(shift, parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    {/* Working Days */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 mr-2">Days:</span>
                      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                        const isWork = shift.workingDays.includes(dayIndex);
                        return (
                          <span
                            key={dayIndex}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              isWork 
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold' 
                                : 'bg-slate-900 text-slate-600'
                            }`}
                          >
                            {dayNames[dayIndex]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Operators count */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>Staffed Operators: <strong className="text-slate-200">{assignedOps.length}</strong></span>
                      <span className="text-indigo-400">{shift.shiftType.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 2: Operator Staffing Roster ──────────────────── */}
        {activeTab === 'operators' && (
          <div className="space-y-4">
            {/* Add Operator Form */}
            <form onSubmit={handleAddOperator} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add Operator to Plant Roster
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Operator Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kulkarni"
                    value={opName}
                    onChange={e => setOpName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-0112"
                    value={opCode}
                    onChange={e => setOpCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assigned Shift</label>
                  <select
                    value={opShiftId}
                    onChange={e => setOpShiftId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Primary Skill Level</label>
                  <select
                    value={opSkill}
                    onChange={e => setOpSkill(e.target.value as SkillLevel)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cnc_programmer">CNC Programmer</option>
                    <option value="certified_welder">Certified Welder (AWS D1.1)</option>
                    <option value="certified_inspector">Certified CMM Inspector</option>
                    <option value="skilled_operator">Skilled Machine Operator</option>
                    <option value="senior_technician">Senior Technician</option>
                    <option value="semi_skilled">Semi-Skilled Operator</option>
                    <option value="helper">Shopfloor Helper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Primary Work Center</label>
                  <select
                    value={opWcId}
                    onChange={e => setOpWcId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {workCenters.map(wc => (
                      <option key={wc.id} value={wc.id}>
                        {wc.code} ({wc.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Certifications / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Fanuc 0i-TF certified"
                    value={opNotes}
                    onChange={e => setOpNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Roster
                </button>
              </div>
            </form>

            {/* Operator Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Operator Name</th>
                    <th className="py-2.5 px-3">Shift</th>
                    <th className="py-2.5 px-3">Primary Skill</th>
                    <th className="py-2.5 px-3">Assigned Machines</th>
                    <th className="py-2.5 px-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {operators.map(op => {
                    const shift = shifts.find(s => s.id === op.shiftId);
                    return (
                      <tr key={op.id} className="hover:bg-slate-900">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">
                          {op.employeeCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-100">
                          {op.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                            {shift?.name || 'Shift A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-indigo-300">
                            {op.primarySkill.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {op.assignedWorkCenterIds?.map(id => {
                            const wc = workCenters.find(w => w.id === id);
                            return wc?.code;
                          }).filter(Boolean).join(', ') || 'Any'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 font-semibold">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
