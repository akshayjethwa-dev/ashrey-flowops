// src/components/cost-rollup/OverheadConfigModal.tsx

import React, { useState } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react';
import {
  OverheadAllocationConfig,
  OverheadAllocationMethod
} from '../../types/costRollup';
import { costRollupService } from '../../services/costRollupService';

interface OverheadConfigModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export const OverheadConfigModal: React.FC<OverheadConfigModalProps> = ({
  onClose,
  onSaved
}) => {
  const configs = costRollupService.getOverheadConfigs();
  const activeConfig = costRollupService.getActiveOverheadConfig();

  const [selectedId, setSelectedId] = useState(activeConfig.id);
  const [editingConfig, setEditingConfig] = useState<OverheadAllocationConfig>({ ...activeConfig });

  const handleSelectRule = (id: string) => {
    setSelectedId(id);
    const found = configs.find(c => c.id === id);
    if (found) {
      setEditingConfig({ ...found });
    }
  };

  const handleSaveAndApply = () => {
    costRollupService.updateOverheadConfig(editingConfig);
    costRollupService.setActiveOverheadConfig(editingConfig.id);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="text-indigo-400" size={18} />
            <h3 className="text-base font-bold text-white">
              Overhead Allocation Rules Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-start gap-2">
            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Overhead absorption rules determine how indirect factory costs (supervision, plant rent, depreciation, shop power) and SG&A are applied to each Work Order to roll up total job cost and actual gross margin.
            </span>
          </div>

          {/* Allocation Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200">
              Select Active Allocation Strategy:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {configs.map((cfg) => {
                const isSelected = selectedId === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => handleSelectRule(cfg.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{cfg.name}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {cfg.notes}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300 uppercase mt-2">
                      Method: {cfg.method.replace(/_/g, ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Tuning Inputs */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/70 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={13} className="text-indigo-400" />
              Rule Parameters: {editingConfig.name}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Labor Overhead Absorption (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={editingConfig.laborOverheadPercent}
                  onChange={(e) => setEditingConfig({ ...editingConfig, laborOverheadPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">% of Direct Operator Labor cost</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Machine Hour Overhead (₹/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingConfig.machineHourOverheadRate}
                  onChange={(e) => setEditingConfig({ ...editingConfig, machineHourOverheadRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Fixed rate applied per machine runtime hour</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fixed Per-Unit Fee (₹/unit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingConfig.factoryFixedRatePerUnit}
                  onChange={(e) => setEditingConfig({ ...editingConfig, factoryFixedRatePerUnit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Coolant, tooling maintenance, cleaning</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SG&A Overhead (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={editingConfig.generalAdminSgaPercent}
                  onChange={(e) => setEditingConfig({ ...editingConfig, generalAdminSgaPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">% for Executive, Sales & ERP administration</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Strategy Notes & Justification
              </label>
              <textarea
                rows={2}
                value={editingConfig.notes || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Apply to All Work Orders
          </button>
        </div>

      </div>
    </div>
  );
};
