// src/components/procurement-dashboard/StockoutAlertsSection.tsx

import React from 'react';
import { StockoutAlertItem } from '../../types/procurementDashboard';
import { 
  AlertTriangle, 
  Send, 
  Layers, 
  RefreshCw, 
  PackageX, 
  Zap, 
  Clock, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface StockoutAlertsSectionProps {
  alerts: StockoutAlertItem[];
  onTriggerReorder: (item: StockoutAlertItem) => void;
  onSendWhatsappRfq: (item: StockoutAlertItem) => void;
}

export const StockoutAlertsSection: React.FC<StockoutAlertsSectionProps> = ({
  alerts,
  onTriggerReorder,
  onSendWhatsappRfq
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Critical Stockout & Material Buffer Alerts
            </h3>
            <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
              {alerts.length} Items Under Threat
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated shortage watch identifying items breaching minimum safety buffers that threaten shopfloor line stoppages.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 self-start sm:self-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>Real-time Safety Stock Depletion</span>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((item) => {
          const isOutOfStock = item.stockoutSeverity === 'out_of_stock';

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4.5 space-y-3.5 transition-all ${
                isOutOfStock
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-amber-300 bg-amber-50/20'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{item.sku}</span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                      isOutOfStock
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {isOutOfStock ? 'Zero Stock Stoppage' : 'Low Buffer'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {item.name}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Stock Remaining</span>
                  <div className={`text-base font-black font-mono ${
                    isOutOfStock ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {item.currentStock} {item.uom}
                  </div>
                </div>
              </div>

              {/* Depletion & Burn Rate Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Daily Burn Rate</span>
                  <strong className="text-slate-800 font-mono text-xs">{item.dailyBurnRate} {item.uom}/d</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Coverage</span>
                  <strong className={`font-mono text-xs ${item.daysCoverageRemaining <= 1 ? 'text-rose-600 font-bold' : 'text-amber-600'}`}>
                    {item.daysCoverageRemaining} Days
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Safety Buffer</span>
                  <strong className="text-slate-800 font-mono text-xs">{item.safetyStock} {item.uom}</strong>
                </div>
              </div>

              {/* Impacted Jobs */}
              <div className="text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Threatened Production Jobs</span>
                <div className="flex flex-wrap gap-1">
                  {item.activeImpactedJobs.map((job) => (
                    <span key={job} className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                      {job}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-slate-500">
                  Vendor: <strong className="text-slate-700">{item.preferredSupplierName}</strong>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSendWhatsappRfq(item)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp PO</span>
                  </button>

                  <button
                    onClick={() => onTriggerReorder(item)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Re-Order ({item.suggestedReorderQty})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
