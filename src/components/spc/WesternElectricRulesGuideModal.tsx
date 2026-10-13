// src/components/spc/WesternElectricRulesGuideModal.tsx

import React from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';

interface WesternElectricRulesGuideModalProps {
  onClose: () => void;
}

export const WesternElectricRulesGuideModal: React.FC<WesternElectricRulesGuideModalProps> = ({ onClose }) => {
  const rules = [
    {
      id: 'Rule 1',
      name: 'Single Point Beyond 3σ (Control Limits)',
      zones: 'Beyond UCL or LCL',
      prob: 'p ≈ 0.0027 (1 in 370)',
      description: 'Any single point falls outside the 3-sigma control limits (above UCL or below LCL).',
      cause: 'Severe equipment malfunction, operator blunder, broken tool insert, raw material lot mix-up.',
      action: 'Mandatory Hold! Immediately halt machine cycle, segregate parts, inspect cutting tool and datum setup.',
      severity: 'critical'
    },
    {
      id: 'Rule 2',
      name: '2 out of 3 Consecutive Points in Zone A or Beyond',
      zones: 'Zone A (> 2σ on same side)',
      prob: 'p ≈ 0.0023 (1 in 435)',
      description: 'Two out of three consecutive points fall in Zone A (between 2σ and 3σ) or beyond, on the same side of the centerline.',
      cause: 'Tool insert wear, fixture loosening, thermal expansion, change in operator technique.',
      action: 'Warning! Check cutting tool wear offset, inspect fixture torque, verify coolant flow before defect occurs.',
      severity: 'warning'
    },
    {
      id: 'Rule 3',
      name: '4 out of 5 Consecutive Points in Zone B or Beyond',
      zones: 'Zone B (> 1σ on same side)',
      prob: 'p ≈ 0.0028 (1 in 357)',
      description: 'Four out of five consecutive points fall in Zone B (between 1σ and 2σ) or beyond, on the same side of the centerline.',
      cause: 'Small persistent process mean shift, minor calibration drift, ambient room temperature rise.',
      action: 'Early drift detection. Perform fine micrometer re-calibration or check raw material hardness batch change.',
      severity: 'warning'
    },
    {
      id: 'Rule 4',
      name: '8 (or 9) Consecutive Points on Same Side of Centerline',
      zones: 'One side of Centerline',
      prob: 'p ≈ 0.0039 (1 in 256)',
      description: 'Eight or nine consecutive points fall on the same side of the Centerline (all above or all below).',
      cause: 'Process center shift, new raw material supplier, altered machine feed/speed parameter, gauge zero shift.',
      action: 'Process has fundamentally shifted. Recenter machine tool offsets or establish new process baseline.',
      severity: 'warning'
    },
    {
      id: 'Nelson 5',
      name: '6 Consecutive Points Steadily Increasing or Decreasing',
      zones: 'Trend across all zones',
      prob: 'p ≈ 0.0014 (1 in 714)',
      description: 'Continuous continuous upward or downward trend over 6 consecutive subgroup averages.',
      cause: 'Continuous tool wear, coolant concentration degradation, spindle bearing warm-up, cutter degradation.',
      action: 'Index or sharpen cutting tool before points reach upper control limit.',
      severity: 'warning'
    },
    {
      id: 'Nelson 6',
      name: '14 Consecutive Points Alternating Up and Down',
      zones: 'Oscillation pattern',
      prob: 'p ≈ 0.0003',
      description: 'Fourteen points in a row strictly alternating in direction (sawtooth pattern).',
      cause: 'Systematic variation: two operators alternating shifts, two spindle heads, or dual-cavity molds.',
      action: 'Stratify data by spindle, cavity, or operator to isolate the two alternating distributions.',
      severity: 'advisory'
    },
    {
      id: 'Nelson 7',
      name: '15 Consecutive Points in Zone C (< 1σ)',
      zones: 'Zone C (Stratification)',
      prob: 'p ≈ 0.0033',
      description: 'Fifteen consecutive points hugging the Centerline within 1-sigma on either side.',
      cause: 'Control limits calculated incorrectly (overly wide), or mixed data subgroups from different streams.',
      action: 'Audit subgroup sampling strategy; verify rational subgrouping assumptions.',
      severity: 'advisory'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Western Electric &amp; Nelson SPC Rules Guide</h3>
              <p className="text-xs text-slate-400">Statistical rules for detecting unnatural patterns and process drift</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Zone Explainer */}
        <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 text-xs">
          <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Control Chart Sigma Zones Architecture
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="font-bold block">Beyond 3σ</span>
              <span className="text-[10px] text-slate-400">&gt; UCL or &lt; LCL</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="font-bold block">Zone A (2σ to 3σ)</span>
              <span className="text-[10px] text-slate-400">Outer 1-sigma band</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
              <span className="font-bold block">Zone B (1σ to 2σ)</span>
              <span className="text-[10px] text-slate-400">Middle 1-sigma band</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="font-bold block">Zone C (0 to 1σ)</span>
              <span className="text-[10px] text-slate-400">Inner 1-sigma band</span>
            </div>
          </div>
        </div>

        {/* Rules Table Cards */}
        <div className="space-y-3">
          {rules.map((r, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {r.id}
                  </span>
                  <span className="font-bold text-white text-sm">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">{r.zones}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.severity === 'critical' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                  }`}>
                    {r.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{r.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-2 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Likely Root Causes:</span>
                  <span className="text-slate-300">{r.cause}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Standard Corrective Action:</span>
                  <span className="text-emerald-300">{r.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
