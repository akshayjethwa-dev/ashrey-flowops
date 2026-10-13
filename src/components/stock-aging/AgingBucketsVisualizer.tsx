// src/components/stock-aging/AgingBucketsVisualizer.tsx

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Layers,
  TrendingDown,
  Filter
} from 'lucide-react';
import { StockAgingSummary, AgingBucketKey, ValuationMethod } from '../../types/stockAgingValuation';

interface AgingBucketsVisualizerProps {
  summary: StockAgingSummary;
  selectedBucket: string;
  onSelectBucket: (bucketKey: string) => void;
  valuationMethod: ValuationMethod;
}

export const AgingBucketsVisualizer: React.FC<AgingBucketsVisualizerProps> = ({
  summary,
  selectedBucket,
  onSelectBucket,
  valuationMethod
}) => {
  const { buckets, effectiveTotalValuation } = summary;

  const bucketConfig: Array<{
    key: AgingBucketKey;
    title: string;
    sublabel: string;
    icon: React.ElementType;
    borderActive: string;
    bgActive: string;
    barColor: string;
    textColor: string;
    tagBg: string;
    tagText: string;
    healthTag: string;
  }> = [
    {
      key: 'bucket_0_30',
      title: '0 - 30 Days',
      sublabel: 'Fresh / Active Turnover',
      icon: CheckCircle2,
      borderActive: 'border-emerald-500 ring-2 ring-emerald-400/30',
      bgActive: 'bg-emerald-500/10',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      tagBg: 'bg-emerald-500/10',
      tagText: 'text-emerald-400',
      healthTag: 'Healthy Velocity'
    },
    {
      key: 'bucket_31_60',
      title: '31 - 60 Days',
      sublabel: 'Standard Buffer',
      icon: Clock,
      borderActive: 'border-sky-500 ring-2 ring-sky-400/30',
      bgActive: 'bg-sky-500/10',
      barColor: 'bg-sky-500',
      textColor: 'text-sky-400',
      tagBg: 'bg-sky-500/10',
      tagText: 'text-sky-400',
      healthTag: 'Normal'
    },
    {
      key: 'bucket_61_90',
      title: '61 - 90 Days',
      sublabel: 'Watchlist / Slowing',
      icon: AlertTriangle,
      borderActive: 'border-amber-500 ring-2 ring-amber-400/30',
      bgActive: 'bg-amber-500/10',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-400',
      tagBg: 'bg-amber-500/10',
      tagText: 'text-amber-400',
      healthTag: 'Watchlist'
    },
    {
      key: 'bucket_90_plus',
      title: '90+ Days',
      sublabel: 'Aged & Stagnant',
      icon: AlertOctagon,
      borderActive: 'border-rose-500 ring-2 ring-rose-400/30',
      bgActive: 'bg-rose-500/10',
      barColor: 'bg-rose-500',
      textColor: 'text-rose-400',
      tagBg: 'bg-rose-500/10',
      tagText: 'text-rose-400',
      healthTag: 'Capital Trapped'
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              Inventory Aging Buckets Matrix
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified by receipt age. Click any bucket to filter the ledger items below.
          </p>
        </div>

        {selectedBucket !== 'all' && (
          <button
            onClick={() => onSelectBucket('all')}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Clear Filter (Show All Buckets)
          </button>
        )}
      </div>

      {/* Segmented Cumulative Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {bucketConfig.map(({ key, barColor }) => {
            const pct = buckets[key]?.percentage || 0;
            if (pct <= 0) return null;
            return (
              <div
                key={key}
                style={{ width: `${pct}%` }}
                className={`${barColor} transition-all duration-300 relative group cursor-pointer`}
                onClick={() => onSelectBucket(key)}
                title={`${buckets[key]?.label}: ${pct}% (${formatCurrency(
                  valuationMethod === 'fifo' ? buckets[key]?.valueFifo : buckets[key]?.valueWac
                )})`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>0 Days (Recent Inward)</span>
          <span>90+ Days (Stagnant Risk)</span>
        </div>
      </div>

      {/* The 4 Bucket Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {bucketConfig.map(
          ({
            key,
            title,
            sublabel,
            icon: Icon,
            borderActive,
            bgActive,
            textColor,
            tagBg,
            tagText,
            healthTag
          }) => {
            const b = buckets[key];
            const isSelected = selectedBucket === key;
            const value = valuationMethod === 'fifo' ? b?.valueFifo : b?.valueWac;
            const percentage = b?.percentage || 0;

            return (
              <div
                key={key}
                onClick={() => onSelectBucket(key)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? `${borderActive} ${bgActive} bg-slate-900/90`
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {/* Active indicator dot */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Active Filter
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${tagBg} ${textColor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                    <p className="text-[10px] text-slate-400">{sublabel}</p>
                  </div>
                </div>

                {/* Valuation Amount */}
                <div className="mt-3">
                  <div className="text-xl font-extrabold text-white tracking-tight font-mono">
                    {formatCurrency(value || 0)}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-400">
                      {b?.itemCount || 0} items ({b?.totalQty || 0} units)
                    </span>
                    <span className={`font-semibold font-mono ${textColor}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Subtag badge */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${tagBg} ${tagText}`}
                  >
                    {healthTag}
                  </span>
                  {key === 'bucket_90_plus' && value > 0 && (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                      <TrendingDown className="w-3 h-3" />
                      Risk
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};
