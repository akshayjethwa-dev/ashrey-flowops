// src/components/quality-dashboard/DefectParetoSection.tsx

import React, { useState } from 'react';
import { ParetoDefectItem } from '../../types/qualityDashboard';
import { 
  BarChart2, 
  Flame, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  Filter,
  IndianRupee,
  HelpCircle
} from 'lucide-react';

interface DefectParetoSectionProps {
  paretoData: ParetoDefectItem[];
}

export const DefectParetoSection: React.FC<DefectParetoSectionProps> = ({
  paretoData
}) => {
  const [selectedDefect, setSelectedDefect] = useState<ParetoDefectItem | null>(paretoData[0] || null);

  const totalDefectOccurrences = paretoData.reduce((sum, item) => sum + item.count, 0);
  const totalFinancialLoss = paretoData.reduce((sum, item) => sum + item.financialLossInr, 0);
  const maxCount = Math.max(...paretoData.map(d => d.count), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Defect Pareto Analysis (80/20 Principle)
            </h3>
            <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
              Root Cause Stratification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritizes the "Vital Few" defect categories causing 80% of quality rejections and scrap cost.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600">
            Total Rejections: <strong className="text-slate-900">{totalDefectOccurrences}</strong>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 text-rose-700">
            Loss: <strong>₹{(totalFinancialLoss / 1000).toFixed(1)}k</strong>
          </div>
        </div>
      </div>

      {/* Pareto Visual Graph with Bars and Cumulative Curve */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
          <span>Defect Frequency & Cumulative Rejection %</span>
          <span className="text-indigo-600 font-bold">80% Threshold Line</span>
        </div>

        {/* Visual Bar-List with Pareto Curve Overlay */}
        <div className="space-y-2.5">
          {paretoData.map((item, index) => {
            const barWidthPct = Math.round((item.count / maxCount) * 100);
            const isSelected = selectedDefect?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDefect(item)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400'
                    : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      item.isVitalFew 
                        ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      [{item.defectCode}]
                    </span>
                    {item.isVitalFew && (
                      <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase tracking-wider">
                        Vital Few (80%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono self-end sm:self-center">
                    <span className="text-slate-600 font-semibold">{item.count} pcs ({item.frequencyPct}%)</span>
                    <span className="text-indigo-600 font-bold">Cumul: {item.cumulativePct}%</span>
                    <span className="text-rose-600 font-semibold">₹{item.financialLossInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="mt-2 w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex relative">
                  {/* 80% marker */}
                  <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-indigo-600 z-10" />

                  <div
                    style={{ width: `${barWidthPct}%` }}
                    className={`h-full transition-all duration-500 rounded-full ${
                      item.isVitalFew ? 'bg-rose-500' : 'bg-slate-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Defect Root Cause Drill-Down Card */}
      {selectedDefect && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-4.5 space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Defect Drill-Down: {selectedDefect.category}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
              {selectedDefect.count} Occurrences ({selectedDefect.frequencyPct}% of rejections)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Primary Work Center</span>
              <strong className="text-slate-100 text-xs mt-0.5 block">{selectedDefect.primaryMachine}</strong>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Primary Affected Part</span>
              <strong className="text-slate-100 text-xs mt-0.5 block">{selectedDefect.primaryPart}</strong>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Cumulative Financial Loss</span>
              <strong className="text-rose-400 text-xs mt-0.5 block font-mono">
                ₹{selectedDefect.financialLossInr.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              Recommendation: Standardize setup tooling and conduct mandatory 5-Why root cause audit on {selectedDefect.primaryMachine}.
            </span>
            <span className="text-indigo-400 font-mono">Pareto rank #1-2 contributes 65%+</span>
          </div>
        </div>
      )}
    </div>
  );
};
