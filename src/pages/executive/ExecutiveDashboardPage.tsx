// src/pages/executive/ExecutiveDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { executiveDashboardService } from '../../services/executiveDashboardService';
import { 
  ExecutiveKpis, 
  ExecutiveTimeframe, 
  MonthlyTrendPoint, 
  BacklogDrillDownItem, 
  WipDrillDownItem, 
  OtdDrillDownShipment 
} from '../../types/executiveDashboard';
import { ExecutiveKpiGrid } from '../../components/executive-dashboard/ExecutiveKpiGrid';
import { ExecutiveTrendsSection } from '../../components/executive-dashboard/ExecutiveTrendsSection';
import { ExecutiveDrillDownModal } from '../../components/executive-dashboard/ExecutiveDrillDownModal';
import { useToast } from '../../context/ToastContext';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  RefreshCw, 
  Factory, 
  Truck, 
  DollarSign, 
  Layers, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const ExecutiveDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo } = useToast();
  const tenantId = tenant?.id || 'demo';

  const [timeframe, setTimeframe] = useState<ExecutiveTimeframe>('mtd');
  const [kpis, setKpis] = useState<ExecutiveKpis>(executiveDashboardService.getExecutiveKpis(tenantId, timeframe));
  const [trends, setTrends] = useState<MonthlyTrendPoint[]>(executiveDashboardService.getMonthlyTrends());
  const [drillDownType, setDrillDownType] = useState<'revenue' | 'margin' | 'otd' | 'backlog' | 'wip' | null>(null);

  const backlogItems = executiveDashboardService.getBacklogItems();
  const wipItems = executiveDashboardService.getWipItems();
  const otdShipments = executiveDashboardService.getOtdShipments();

  const handleTimeframeChange = (tf: ExecutiveTimeframe) => {
    setTimeframe(tf);
    setKpis(executiveDashboardService.getExecutiveKpis(tenantId, tf));
    toastInfo(`Executive telemetry loaded for: ${tf.toUpperCase()}`);
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Ashrey FlowOps Executive Dashboard KPI Report'],
      ['Generated On', new Date().toISOString()],
      ['Timeframe', timeframe.toUpperCase()],
      [''],
      ['Metric', 'Actual Value', 'Target Value', 'Variance / Status'],
      ['Recognized Revenue (INR)', kpis.revenueActual, kpis.revenueTarget, `+${kpis.revenueGrowthPct}% MoM`],
      ['Gross Margin (%)', `${kpis.grossMarginPct}%`, `${kpis.grossMarginTargetPct}%`, `+${(kpis.grossMarginPct - kpis.grossMarginTargetPct).toFixed(1)}% Spread`],
      ['Gross Profit Value (INR)', kpis.grossProfitValue, '', 'Profitable Healthy'],
      ['On-Time Delivery (OTD %)', `${kpis.otdPct}%`, `${kpis.otdTargetPct}%`, `${kpis.onTimeShipments}/${kpis.totalShipments} Consignments`],
      ['Order Backlog Value (INR)', kpis.backlogTotalValue, '', `${kpis.backlogOrderCount} Committed Orders`],
      ['Shopfloor WIP Capital (INR)', kpis.wipTotalValue, '', `${kpis.wipActiveOrdersCount} Active Work Orders`]
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Executive_KPI_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Executive KPI Report downloaded successfully!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Executive Business Intelligence Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time live performance metrics synthesizing recognized revenue, gross margin %, on-time delivery compliance, committed order backlog, and shopfloor WIP capital.
          </p>
        </div>

        {/* Timeframe & Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap self-start md:self-center font-mono text-xs">
          {/* Timeframe selector */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200">
            {(['today', 'this_week', 'mtd', 'qtd', 'ytd'] as ExecutiveTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-md font-bold uppercase transition cursor-pointer text-[11px] ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 shadow-3xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Download Executive CSV Report"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigate('/production-dashboard')}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <Factory className="h-3.5 w-3.5 text-indigo-600" />
            <span>Production Hub</span>
          </button>
        </div>
      </div>

      {/* 1. EXECUTIVE KPI CARDS (Acceptance Criteria: KPI cards, drill-down) */}
      <ExecutiveKpiGrid 
        kpis={kpis} 
        onDrillDown={(type) => setDrillDownType(type)} 
      />

      {/* 2. STRATEGIC TREND CHARTS (Acceptance Criteria: Trend charts) */}
      <ExecutiveTrendsSection trends={trends} />

      {/* 3. DRILL-DOWN MODAL (Acceptance Criteria: Drill-down) */}
      <ExecutiveDrillDownModal
        drillDownType={drillDownType}
        onClose={() => setDrillDownType(null)}
        backlogItems={backlogItems}
        wipItems={wipItems}
        otdShipments={otdShipments}
      />

      {/* 4. FOOTER QUICK ACTION LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
        <button
          onClick={() => navigate('/margin-analysis')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">Live P&L Executive Waterfall</strong>
            <span className="text-[10px] text-slate-500">Unit cost breakdown & product margin dilution</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/dispatch')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">Dispatch & Logistics Terminal</strong>
            <span className="text-[10px] text-slate-500">E-Way Bills, ready-to-ship, and carrier tracking</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <button
          onClick={() => navigate('/production-dashboard')}
          className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-3xs transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <strong className="text-slate-800 block">Plant Production & OEE Dashboard</strong>
            <span className="text-[10px] text-slate-500">Machine telemetry, WIP by stage, bottlenecks</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

    </div>
  );
};
