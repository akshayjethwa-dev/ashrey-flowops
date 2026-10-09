// src/components/routings/BatchTimeEstimatorCard.tsx

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Zap, 
  Building2 
} from 'lucide-react';
import { ProductRouting, WorkCenter } from '../../types/routing';
import { calculateBatchEstimate } from '../../services/routingService';

interface BatchTimeEstimatorCardProps {
  routing: ProductRouting;
  workCenters: WorkCenter[];
}

export const BatchTimeEstimatorCard: React.FC<BatchTimeEstimatorCardProps> = ({
  routing,
  workCenters
}) => {
  const [batchQty, setBatchQty] = useState<number>(routing.targetBatchSize || 50);

  const estimate = useMemo(() => {
    return calculateBatchEstimate(routing, batchQty, workCenters);
  }, [routing, batchQty, workCenters]);

  // Identify bottleneck operation (highest cycle time)
  const bottleneckOp = useMemo(() => {
    if (!routing.operations || routing.operations.length === 0) return null;
    return [...routing.operations].sort((a, b) => b.cycleTimeMinutes - a.cycleTimeMinutes)[0];
  }, [routing.operations]);

  const maxPcsPerHour = bottleneckOp && bottleneckOp.cycleTimeMinutes > 0
    ? Math.round((60 / bottleneckOp.cycleTimeMinutes) * 10) / 10
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Batch Time & Shopfloor Production Estimator
            </h3>
            <p className="text-xs text-slate-400">
              Calculate total setup, cycle run hours, shift capacity, and work center processing costs
            </p>
          </div>
        </div>

        {/* Batch Quantity Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 uppercase">Batch Qty:</label>
          <input
            type="number"
            min="1"
            value={batchQty}
            onChange={(e) => setBatchQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
          />
          <span className="text-xs font-mono text-slate-400">pcs</span>
        </div>
      </div>

      {/* Quick Batch Quantity Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase text-slate-500">Quick Batch Sizes:</span>
        {[10, 25, 50, 100, 250, 500, 1000].map(qty => (
          <button
            key={qty}
            type="button"
            onClick={() => setBatchQty(qty)}
            className={`px-2.5 py-1 text-xs rounded-lg font-mono border transition-colors ${
              batchQty === qty
                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {qty} pcs
          </button>
        ))}
      </div>

      {/* Calculated KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Total Setup Time</span>
          <span className="text-lg font-bold font-mono text-white">
            {estimate.totalSetupMinutes} mins
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            ({Math.round((estimate.totalSetupMinutes / 60) * 10) / 10} hrs fixed)
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Total Run Time</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {estimate.totalRunMinutes} mins
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            ({Math.round((estimate.totalRunMinutes / 60) * 10) / 10} hrs production)
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Total Lead Hours</span>
          <span className="text-lg font-bold font-mono text-sky-400">
            {estimate.totalBatchHours} hrs
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            ≈ {estimate.shiftsRequired} shifts (8h)
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5">
          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Estimated Batch Cost</span>
          <span className="text-lg font-bold font-mono text-indigo-400">
            ₹{estimate.estimatedTotalBatchCostINR.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            ₹{estimate.unitCostINR.toLocaleString()} / pc
          </span>
        </div>
      </div>

      {/* Bottleneck Analysis Banner */}
      {bottleneckOp && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span>Production Line Bottleneck: Op {bottleneckOp.sequenceNumber} ({bottleneckOp.name})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Work Center: <strong className="text-slate-300">{bottleneckOp.workCenterName}</strong> • Cycle Time: <strong className="text-white font-mono">{bottleneckOp.cycleTimeMinutes} mins/pc</strong>.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Pace Limit</span>
            <span className="text-xs font-mono font-bold text-white">~{maxPcsPerHour} pcs / hr</span>
          </div>
        </div>
      )}
    </div>
  );
};
