// src/components/suppliers/SupplierCompareModal.tsx

import React from 'react';
import {
  X,
  Scale,
  Award,
  Clock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SupplierWithMetrics } from '../../types/supplierScorecard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierWithMetrics[];
}

export const SupplierCompareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  suppliers
}) => {
  if (!isOpen || suppliers.length < 2) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Best performer per metric
  const bestComposite = Math.max(...suppliers.map(s => s.metrics.compositeScore));
  const bestOtd = Math.max(...suppliers.map(s => s.metrics.onTimeDeliveryRatePct));
  const bestQuality = Math.max(...suppliers.map(s => s.metrics.qualityAcceptanceRatePct));
  const bestLeadTime = Math.min(...suppliers.map(s => s.leadTimeDays));

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl shadow-2xl text-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Comparative Supplier Sourcing Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Data-driven evaluation of {suppliers.length} vendors for strategic PO allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-3 text-slate-400 font-mono uppercase text-[11px] w-48">
                    Evaluation Dimension
                  </th>
                  {suppliers.map(s => (
                    <th key={s.id} className="p-3 font-mono">
                      <div className="text-sm font-bold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.code} • {s.category.replace('_', ' ')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                
                {/* Composite Score */}
                <tr className="bg-slate-950/40">
                  <td className="p-3 font-bold text-white flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-400" />
                    Composite Score
                  </td>
                  {suppliers.map(s => {
                    const isWinner = s.metrics.compositeScore === bestComposite;
                    return (
                      <td key={s.id} className="p-3 font-bold text-base">
                        <span className={`px-2.5 py-1 rounded-xl ${
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300'
                        }`}>
                          {s.metrics.compositeScore} / 100
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* AVL Tier */}
                <tr>
                  <td className="p-3 text-slate-400">AVL Ranking & Tier</td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-3">
                      <span className="font-bold text-indigo-300 uppercase">
                        Rank #{s.metrics.rank} ({s.tier.replace('_', ' ')})
                      </span>
                    </td>
                  ))}
                </tr>

                {/* On-Time Delivery */}
                <tr>
                  <td className="p-3 font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-sky-400" />
                    On-Time Delivery (OTD %)
                  </td>
                  {suppliers.map(s => {
                    const isWinner = s.metrics.onTimeDeliveryRatePct === bestOtd;
                    return (
                      <td key={s.id} className="p-3">
                        <span className={`font-bold ${isWinner ? 'text-sky-400 font-black' : 'text-slate-300'}`}>
                          {s.metrics.onTimeDeliveryRatePct}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Avg Delay: {s.metrics.avgDelayDays}d
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Quality Acceptance Rate */}
                <tr>
                  <td className="p-3 font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Quality Acceptance Rate
                  </td>
                  {suppliers.map(s => {
                    const isWinner = s.metrics.qualityAcceptanceRatePct === bestQuality;
                    return (
                      <td key={s.id} className="p-3">
                        <span className={`font-bold ${isWinner ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                          {s.metrics.qualityAcceptanceRatePct}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {s.metrics.ppmDefectRate} PPM
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Responsiveness */}
                <tr>
                  <td className="p-3 text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    Responsiveness SLA
                  </td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-3 text-slate-200">
                      {s.metrics.responsivenessScorePct}%
                    </td>
                  ))}
                </tr>

                {/* Nominal Lead Time */}
                <tr>
                  <td className="p-3 text-slate-400">Nominal Lead Time</td>
                  {suppliers.map(s => {
                    const isFastest = s.leadTimeDays === bestLeadTime;
                    return (
                      <td key={s.id} className="p-3">
                        <span className={isFastest ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {s.leadTimeDays} Days
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Payment Terms */}
                <tr>
                  <td className="p-3 text-slate-400">Payment Terms</td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-3 text-slate-300">
                      {s.paymentTerms}
                    </td>
                  ))}
                </tr>

                {/* Historical Spend */}
                <tr>
                  <td className="p-3 text-slate-400">Total Spend Fulfilled</td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-3 font-bold text-white">
                      {formatCurrency(s.metrics.totalSpend)}
                    </td>
                  ))}
                </tr>

                {/* Certifications */}
                <tr>
                  <td className="p-3 text-slate-400">Quality Certifications</td>
                  {suppliers.map(s => (
                    <td key={s.id} className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {s.certifications.map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
