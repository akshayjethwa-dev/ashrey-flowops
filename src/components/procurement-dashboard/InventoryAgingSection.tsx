// src/components/procurement-dashboard/InventoryAgingSection.tsx

import React, { useState } from 'react';
import { InventoryAgingSummary, InventoryAgingBucketData } from '../../types/procurementDashboard';
import { 
  Package, 
  IndianRupee, 
  AlertCircle, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface InventoryAgingSectionProps {
  agingSummary: InventoryAgingSummary;
}

export const InventoryAgingSection: React.FC<InventoryAgingSectionProps> = ({
  agingSummary
}) => {
  const [selectedBucket, setSelectedBucket] = useState<InventoryAgingBucketData>(
    agingSummary.buckets[agingSummary.buckets.length - 1]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Inventory Aging & Working Capital Exposure Report
            </h3>
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
              FIFO Aging Layers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Segmented stock valuation across aging cohorts to release trapped capital and avoid inventory obsolescence.
          </p>
        </div>

        {/* Financial Overview Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono self-start sm:self-center">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
            Total Capital: <strong className="text-slate-900">₹{(agingSummary.totalHoldingCapitalInr / 100000).toFixed(1)}L</strong>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800">
            Risk &gt;60d: <strong>₹{(agingSummary.excessCapitalAtRiskInr / 100000).toFixed(1)}L</strong>
          </div>
        </div>
      </div>

      {/* Visual Aging Bucket Stacked Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
          <span>Capital Allocation by Holding Duration</span>
          <span>Monthly Holding Cost: ~₹{(agingSummary.carryingCostMonthlyInr / 1000).toFixed(1)}k</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
          {agingSummary.buckets.map((b) => {
            let color = 'bg-emerald-500';
            if (b.bucketKey === '31_60') color = 'bg-sky-500';
            if (b.bucketKey === '61_90') color = 'bg-amber-500';
            if (b.bucketKey === '90_plus') color = 'bg-rose-500';

            return (
              <div
                key={b.bucketKey}
                style={{ width: `${b.percentageOfTotal}%` }}
                title={`${b.label}: ${b.percentageOfTotal}%`}
                className={`h-full transition-all duration-300 ${color}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>0-30d ({agingSummary.buckets[0]?.percentageOfTotal}%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
            <span>31-60d ({agingSummary.buckets[1]?.percentageOfTotal}%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
            <span>61-90d ({agingSummary.buckets[2]?.percentageOfTotal}%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            <span>90+d Dead ({agingSummary.buckets[3]?.percentageOfTotal}%)</span>
          </span>
        </div>
      </div>

      {/* Cohort Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {agingSummary.buckets.map((bucket) => {
          const isSelected = selectedBucket.bucketKey === bucket.bucketKey;
          const isDead = bucket.bucketKey === '90_plus';
          const isSlow = bucket.bucketKey === '61_90';

          return (
            <div
              key={bucket.bucketKey}
              onClick={() => setSelectedBucket(bucket)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono uppercase text-slate-600">
                  {bucket.label.split(' ')[0]} {bucket.label.split(' ')[1]} {bucket.label.split(' ')[2]}
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isDead ? 'bg-rose-100 text-rose-800' : isSlow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {bucket.percentageOfTotal}%
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xl font-black font-display text-slate-900 tracking-tight">
                  ₹{(bucket.capitalValueInr / 100000).toFixed(1)} Lakhs
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {bucket.itemCount} distinct SKU lines
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Aging Cohort Resolution Playbook */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4.5 space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Cohort Action Playbook: {selectedBucket.label}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Valuation: <strong className="text-white">₹{selectedBucket.capitalValueInr.toLocaleString('en-IN')}</strong> ({selectedBucket.percentageOfTotal}% of total)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Working Capital Profile</span>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {selectedBucket.riskDescription}
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <span className="text-[10px] text-sky-400 uppercase font-mono block font-bold">Recommended Procurement Strategy</span>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {selectedBucket.liquidationAction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
