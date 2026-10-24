// src/components/procurement-dashboard/SupplierPerformanceSection.tsx

import React, { useState } from 'react';
import { SupplierPerformanceItem } from '../../types/procurementDashboard';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  ShieldCheck, 
  Phone, 
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';

interface SupplierPerformanceSectionProps {
  suppliers: SupplierPerformanceItem[];
}

export const SupplierPerformanceSection: React.FC<SupplierPerformanceSectionProps> = ({
  suppliers
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');

  const filteredSuppliers = suppliers.filter(s => {
    if (selectedTier === 'all') return true;
    return s.tier === selectedTier;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Supplier Performance & Risk Scorecards
            </h3>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Vendor Rating Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audits supplier compliance on delivery schedules, incoming quality acceptance, and lead time variance.
          </p>
        </div>

        {/* Tier filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-center">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTier === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            All Tiers
          </button>
          <button
            onClick={() => setSelectedTier('tier_1')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTier === 'tier_1' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            Tier 1 (Strategic)
          </button>
          <button
            onClick={() => setSelectedTier('tier_3')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTier === 'tier_3' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            Watch-List
          </button>
        </div>
      </div>

      {/* Supplier Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className={`rounded-xl border p-4.5 space-y-3.5 transition-all ${
              sup.riskScore === 'high'
                ? 'border-rose-200 bg-rose-50/20'
                : sup.riskScore === 'moderate'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  {sup.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {sup.supplierName}
                </h4>
              </div>
              <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded border ${
                sup.status === 'preferred'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : sup.status === 'approved'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {sup.status.replace('_', ' ')}
              </span>
            </div>

            {/* Metric Bars */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-mono">On-Time %</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className={`text-base font-bold font-mono ${
                    sup.otdPct >= 95 ? 'text-emerald-600' : sup.otdPct >= 85 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {sup.otdPct}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-mono">Quality Yield</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="text-base font-bold font-mono text-emerald-600">
                    {sup.qualityAcceptancePct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-1 text-xs text-slate-600 font-sans border-t border-slate-200/80 pt-2.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">YTD Spend:</span>
                <strong className="text-slate-800 font-mono">₹{(sup.totalSpendYtdInr / 100000).toFixed(1)}L</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Lead Time Variance:</span>
                <span className={`font-mono font-semibold ${sup.leadTimeVarianceDays > 1.5 ? 'text-rose-600' : 'text-slate-700'}`}>
                  +{sup.leadTimeVarianceDays} days
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Contact:</span>
                <span className="text-slate-700 truncate">{sup.primaryContact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
