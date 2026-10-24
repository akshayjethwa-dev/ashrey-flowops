// src/components/executive-dashboard/ExecutiveTrendsSection.tsx

import React, { useState } from 'react';
import { MonthlyTrendPoint } from '../../types/executiveDashboard';
import { 
  TrendingUp, 
  BarChart3, 
  Layers, 
  Truck, 
  DollarSign, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  trends: MonthlyTrendPoint[];
}

export const ExecutiveTrendsSection: React.FC<Props> = ({ trends }) => {
  const [activeMetric, setActiveMetric] = useState<'revenue_margin' | 'backlog_wip' | 'otd'>('revenue_margin');

  const maxRevenue = Math.max(...trends.map(t => Math.max(t.revenue, t.targetRevenue))) * 1.1;
  const maxBacklog = Math.max(...trends.map(t => Math.max(t.backlogValue, t.wipValue))) * 1.15;

  const formatLakhs = (val: number) => {
    return `₹${(val / 100000).toFixed(1)}L`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4 font-sans">
      
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Executive Strategic Performance Trends (6-Month Rolling Horizon)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics synthesized from ERP sales invoices, cost rollups, dispatch notes, and WIP tracking.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg font-mono text-xs">
          <button
            onClick={() => setActiveMetric('revenue_margin')}
            className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              activeMetric === 'revenue_margin'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue & Margin %
          </button>

          <button
            onClick={() => setActiveMetric('backlog_wip')}
            className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              activeMetric === 'backlog_wip'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Backlog vs WIP Capital
          </button>

          <button
            onClick={() => setActiveMetric('otd')}
            className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              activeMetric === 'otd'
                ? 'bg-white text-slate-900 shadow-3xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            On-Time Delivery %
          </button>
        </div>
      </div>

      {/* CHART 1: REVENUE & GROSS MARGIN */}
      {activeMetric === 'revenue_margin' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-600 rounded-sm inline-block"></span>
                <span>Recognized Revenue (₹)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-300 rounded-sm inline-block"></span>
                <span>Monthly Budget Target</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                <span>Gross Margin % Realized</span>
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              ● +20.4% Revenue Expansion since May
            </span>
          </div>

          {/* Responsive Visual SVG / CSS Bar Chart */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-64 items-end pt-6 pb-2 px-2 border-b border-slate-100">
            {trends.map((t) => {
              const revHeight = (t.revenue / maxRevenue) * 100;
              const targetHeight = (t.targetRevenue / maxRevenue) * 100;

              return (
                <div key={t.month} className="flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Floating Margin Tag */}
                  <div className="mb-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-3xs whitespace-nowrap">
                    {t.grossMarginPct}% GM
                  </div>

                  {/* Dual Bar (Actual vs Target) */}
                  <div className="flex items-end space-x-1.5 w-full justify-center max-w-[64px] h-[160px]">
                    {/* Target Bar */}
                    <div 
                      style={{ height: `${targetHeight}%` }}
                      className="w-1/2 bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300 relative"
                      title={`Target: ${formatLakhs(t.targetRevenue)}`}
                    ></div>

                    {/* Actual Revenue Bar */}
                    <div 
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-emerald-600 rounded-t-sm transition-all group-hover:bg-emerald-500 shadow-sm relative"
                      title={`Actual: ${formatLakhs(t.revenue)}`}
                    ></div>
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      {t.month}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {formatLakhs(t.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Best Margin Month</span>
              <strong className="text-slate-800 text-sm">October (28.6% Realized)</strong>
              <div className="text-[10px] text-emerald-600 mt-0.5">High precision CNC gear ring mix</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Margin Variance Target</span>
              <strong className="text-slate-800 text-sm">+3.6% Over 25.0% Benchmark</strong>
              <div className="text-[10px] text-indigo-600 mt-0.5">Scrap rework reduction impact</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Total Realized GP (MTD)</span>
              <strong className="text-slate-800 text-sm">₹40.64 Lakhs</strong>
              <div className="text-[10px] text-slate-500 mt-0.5">Net contribution after overhead</div>
            </div>
          </div>
        </div>
      )}

      {/* CHART 2: BACKLOG VS WIP CAPITAL */}
      {activeMetric === 'backlog_wip' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block"></span>
                <span>Committed Order Backlog (₹)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-purple-600 rounded-sm inline-block"></span>
                <span>Active Shopfloor WIP Value (₹)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-600 font-bold">
              Ratio Backlog/WIP: <strong className="text-slate-900 font-mono">2.35x</strong> (Healthy Throughput)
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-64 items-end pt-6 pb-2 px-2 border-b border-slate-100">
            {trends.map((t) => {
              const backlogH = (t.backlogValue / maxBacklog) * 100;
              const wipH = (t.wipValue / maxBacklog) * 100;

              return (
                <div key={t.month} className="flex flex-col items-center h-full justify-end group relative">
                  <div className="flex items-end space-x-1.5 w-full justify-center max-w-[64px] h-[175px]">
                    <div 
                      style={{ height: `${backlogH}%` }}
                      className="w-1/2 bg-amber-500 rounded-t-sm transition-all group-hover:bg-amber-400 shadow-sm"
                      title={`Backlog: ${formatLakhs(t.backlogValue)}`}
                    ></div>
                    <div 
                      style={{ height: `${wipH}%` }}
                      className="w-1/2 bg-purple-600 rounded-t-sm transition-all group-hover:bg-purple-500 shadow-sm"
                      title={`WIP: ${formatLakhs(t.wipValue)}`}
                    ></div>
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      {t.month}
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono block font-bold">
                      {formatLakhs(t.backlogValue)}
                    </span>
                    <span className="text-[9px] text-purple-700 font-mono block">
                      {formatLakhs(t.wipValue)} WIP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200">
              <span className="text-amber-800 block text-[10px] uppercase font-bold">Total Committed Backlog</span>
              <strong className="text-amber-950 text-sm">₹58.40 Lakhs (18 Orders)</strong>
              <div className="text-[10px] text-amber-700 mt-0.5">Average cycle: 9.4 days to promise date</div>
            </div>
            <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-200">
              <span className="text-purple-800 block text-[10px] uppercase font-bold">Active Shopfloor WIP</span>
              <strong className="text-purple-950 text-sm">₹24.80 Lakhs (12 Batches)</strong>
              <div className="text-[10px] text-purple-700 mt-0.5">No aging WIP stalled &gt; 14 days</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Working Capital Velocity</span>
              <strong className="text-slate-800 text-sm">4.8 Days Lead Time</strong>
              <div className="text-[10px] text-emerald-600 mt-0.5">Industry benchmark: 6.2 days</div>
            </div>
          </div>
        </div>
      )}

      {/* CHART 3: ON-TIME DELIVERY (OTD %) */}
      {activeMetric === 'otd' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-sky-500 rounded-sm inline-block"></span>
                <span>Fleet On-Time Delivery Compliance (%)</span>
              </span>
              <span className="text-slate-400">Target Line: ≥ 95.0%</span>
            </div>
            <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-bold">
              Current MTD: 95.8% (Target Exceeded)
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-64 items-end pt-6 pb-2 px-2 border-b border-slate-100">
            {trends.map((t) => {
              const otdHeight = (t.otdPct / 100) * 100;
              const isTargetMet = t.otdPct >= 95.0;

              return (
                <div key={t.month} className="flex flex-col items-center h-full justify-end group relative">
                  <div className="mb-2 bg-sky-50 border border-sky-200 text-sky-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-3xs">
                    {t.otdPct}%
                  </div>

                  <div className="w-full max-w-[48px] h-[175px] flex items-end justify-center">
                    <div 
                      style={{ height: `${otdHeight}%` }}
                      className={`w-full rounded-t-md transition-all shadow-sm ${
                        isTargetMet ? 'bg-sky-600 group-hover:bg-sky-500' : 'bg-amber-500 group-hover:bg-amber-400'
                      }`}
                      title={`${t.month} OTD: ${t.otdPct}%`}
                    ></div>
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      {t.month}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {isTargetMet ? 'Pass' : 'Warning'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
              <span className="text-sky-800 block text-[10px] uppercase font-bold">Total Consignments</span>
              <strong className="text-sky-950 text-sm">48 Dispatched Shipments</strong>
              <div className="text-[10px] text-sky-700 mt-0.5">46 On-Time • 2 Delayed by border check</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">OTIF Compliance</span>
              <strong className="text-slate-800 text-sm">94.6% On-Time In-Full</strong>
              <div className="text-[10px] text-emerald-600 mt-0.5">Zero line shortages recorded</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Top Performing Carrier</span>
              <strong className="text-slate-800 text-sm">SafeExpress Logistics (100% OTD)</strong>
              <div className="text-[10px] text-slate-500 mt-0.5">24/24 deliveries verified on-time</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
