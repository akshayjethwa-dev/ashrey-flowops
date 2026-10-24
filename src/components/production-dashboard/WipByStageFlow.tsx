// src/components/production-dashboard/WipByStageFlow.tsx

import React from 'react';
import { WipOperationStage } from '../../types/productionDashboard';
import { 
  Layers, 
  ArrowRight, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  DollarSign,
  Activity
} from 'lucide-react';

interface Props {
  stages: WipOperationStage[];
  onSelectStage?: (stage: WipOperationStage) => void;
}

export const WipByStageFlow: React.FC<Props> = ({ stages, onSelectStage }) => {
  const totalWipPieces = stages.reduce((acc, s) => acc + s.totalPieces, 0);
  const totalWipValue = stages.reduce((acc, s) => acc + s.wipValue, 0);

  const formatCurrency = (val: number) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Work-in-Progress (WIP) by Routing Operation Stage
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shopfloor inventory buffers, batch queues, and stage transition velocity.
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className="text-slate-500">
            Total WIP: <strong className="text-slate-900">{totalWipPieces.toLocaleString()} pcs</strong>
          </span>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold">
            {formatCurrency(totalWipValue)} Value
          </span>
        </div>
      </div>

      {/* Visual Funnel / Grid Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
        {stages.map((stg, index) => {
          const isChoked = stg.status === 'choked' || stg.isBottleneck;
          const isAccumulating = stg.status === 'accumulating';

          return (
            <div
              key={stg.id}
              onClick={() => onSelectStage && onSelectStage(stg)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isChoked 
                  ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20' 
                  : isAccumulating
                    ? 'bg-amber-50/30 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top Badge & Sequence */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {stg.operationCode}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isChoked ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' :
                    isAccumulating ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isChoked ? '🚨 Bottleneck' : isAccumulating ? 'Accumulating' : 'Smooth Flow'}
                  </span>
                </div>

                {/* Stage Title & Machine */}
                <div className="mt-2.5">
                  <h4 className="text-xs font-bold text-slate-900 font-sans">{stg.stageName}</h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" title={stg.workCenterName}>
                    {stg.workCenterName}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Queue Units</span>
                    <strong className="text-slate-900 text-sm font-mono">{stg.totalPieces} pcs</strong>
                    <span className="text-[10px] text-slate-400 block font-mono">({stg.batchCount} batches)</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Tied-Up Capital</span>
                    <strong className="text-purple-700 text-sm font-mono">{formatCurrency(stg.wipValue)}</strong>
                    <span className="text-[10px] text-slate-400 block font-mono">{stg.avgCycleMinutes}m cycle/pc</span>
                  </div>
                </div>
              </div>

              {/* Progress bar representing relative volume */}
              <div className="mt-3 pt-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min((stg.totalPieces / 700) * 100, 100)}%` }}
                    className={`h-full rounded-full ${
                      isChoked ? 'bg-rose-500' : isAccumulating ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
