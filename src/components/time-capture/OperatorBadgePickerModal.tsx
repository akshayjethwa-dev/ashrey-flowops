// src/components/time-capture/OperatorBadgePickerModal.tsx

import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Search,
  BadgeCheck,
  Building2,
  Clock
} from 'lucide-react';
import { OperatorProfile } from '../../types/timeCapture';

interface OperatorBadgePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: OperatorProfile[];
  currentOperator: OperatorProfile;
  onSelectOperator: (operator: OperatorProfile) => void;
}

export const OperatorBadgePickerModal: React.FC<OperatorBadgePickerModalProps> = ({
  isOpen,
  onClose,
  operators,
  currentOperator,
  onSelectOperator
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = operators.filter(
    op =>
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.badgeNumber.toLowerCase().includes(search.toLowerCase()) ||
      op.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-600 rounded-lg text-white">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Operator Station Authentication</h3>
              <p className="text-[11px] text-slate-400">Select active operator or scan badge barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, badge # (e.g. EMP-7041), or role..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
          </div>
        </div>

        {/* Operator Roster List */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {filtered.map(op => {
            const isSelected = op.badgeNumber === currentOperator.badgeNumber;
            return (
              <button
                key={op.id}
                onClick={() => {
                  onSelectOperator(op);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-cyan-50 border-cyan-500 ring-1 ring-cyan-500/50 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {op.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{op.name}</span>
                      <span className="font-mono text-[10px] text-cyan-700 bg-cyan-100 px-1.5 py-0.2 rounded font-semibold">
                        {op.badgeNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{op.role}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {op.primaryStation} · {op.shift}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 size={18} className="text-cyan-600 shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Select</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
