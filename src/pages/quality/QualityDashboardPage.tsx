// src/pages/quality/QualityDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityDashboardService } from '../../services/qualityDashboardService';
import { 
  QualityKpis, 
  FpyDayTrendPoint, 
  ParetoDefectItem, 
  CapaAgingItem, 
  CapaAgingSummary 
} from '../../types/qualityDashboard';
import { QualityKpiGrid } from '../../components/quality-dashboard/QualityKpiGrid';
import { FpyAndScrapTrendSection } from '../../components/quality-dashboard/FpyAndScrapTrendSection';
import { DefectParetoSection } from '../../components/quality-dashboard/DefectParetoSection';
import { CapaAgingSection } from '../../components/quality-dashboard/CapaAgingSection';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Flame, 
  FileCheck,
  Send,
  Sliders,
  ChevronRight
} from 'lucide-react';

export const QualityDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toastSuccess, toastInfo } = useToast();

  const [kpis, setKpis] = useState<QualityKpis>(qualityDashboardService.getQualityKpis());
  const [fpyTrends, setFpyTrends] = useState<FpyDayTrendPoint[]>(qualityDashboardService.getFpyTrend());
  const [paretoData, setParetoData] = useState<ParetoDefectItem[]>(qualityDashboardService.getDefectPareto());
  const [capaList, setCapaList] = useState<CapaAgingItem[]>(qualityDashboardService.getCapaAgingList());
  const [agingSummary, setAgingSummary] = useState<CapaAgingSummary>(qualityDashboardService.getCapaAgingSummary());

  const [activeTab, setActiveTab] = useState<'all' | 'fpy' | 'pareto' | 'capa'>('all');

  const handleRefresh = () => {
    setKpis(qualityDashboardService.getQualityKpis());
    setFpyTrends(qualityDashboardService.getFpyTrend());
    setParetoData(qualityDashboardService.getDefectPareto());
    setCapaList(qualityDashboardService.getCapaAgingList());
    setAgingSummary(qualityDashboardService.getCapaAgingSummary());
    toastInfo('Quality telemetry refreshed from shopfloor QC stations.');
  };

  const handleEscalateWhatsApp = (capaId: string, role: string) => {
    const res = qualityDashboardService.triggerCapaEscalation(capaId, role);
    if (res.success) {
      toastSuccess(res.message);
    }
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Ashrey FlowOps - Quality Dashboard Report'],
      ['Generated On', new Date().toISOString()],
      [''],
      ['Metric', 'Actual Value', 'Benchmark Target / Threshold'],
      ['First-Pass Yield (FPY %)', `${kpis.fpyPct}%`, `${kpis.fpyTargetPct}%`],
      ['Scrap Rate (%)', `${kpis.scrapRatePct}%`, `≤ ${kpis.scrapThresholdPct}%`],
      ['Total Units Inspected', kpis.totalInspectedUnits, ''],
      ['Conforming Passed Units', kpis.passedUnits, ''],
      ['Scrapped Units', kpis.scrappedUnits, ''],
      ['Reworked Units', kpis.reworkedUnits, ''],
      ['Scrap Financial Loss (INR)', `₹${kpis.scrapCostValue}`, ''],
      ['Open Active CAPAs', kpis.openCapaCount, ''],
      ['Overdue CAPAs (>30 Days)', kpis.overdueCapaCount, '0 Tolerated']
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FlowOps_Quality_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Quality KPI report downloaded successfully.');
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="quality-dashboard-root">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-indigo-600 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Operations Cockpit</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Quality Intelligence</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                Quality Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Plant-wide quality control deck tracking First-Pass Yield, Scrap cost trends, 80/20 Defect Pareto, and CAPA resolution aging.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs w-full sm:w-fit font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unified View
        </button>
        <button
          onClick={() => setActiveTab('fpy')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'fpy'
              ? 'bg-white text-emerald-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          FPY & Scrap Trend
        </button>
        <button
          onClick={() => setActiveTab('pareto')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'pareto'
              ? 'bg-white text-amber-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Defect Pareto (80/20)
        </button>
        <button
          onClick={() => setActiveTab('capa')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'capa'
              ? 'bg-white text-rose-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          CAPA Aging Brackets
        </button>
      </div>

      {/* 1. Quality KPI Grid Cards */}
      <QualityKpiGrid
        kpis={kpis}
        onCapaClick={() => setActiveTab('capa')}
        onScrapClick={() => setActiveTab('fpy')}
      />

      {/* 2. FPY & Scrap Trajectory Section */}
      {(activeTab === 'all' || activeTab === 'fpy') && (
        <FpyAndScrapTrendSection trendData={fpyTrends} />
      )}

      {/* 3. Defect Pareto Analysis Section */}
      {(activeTab === 'all' || activeTab === 'pareto') && (
        <DefectParetoSection paretoData={paretoData} />
      )}

      {/* 4. CAPA Aging Section */}
      {(activeTab === 'all' || activeTab === 'capa') && (
        <CapaAgingSection
          capaList={capaList}
          agingSummary={agingSummary}
          onEscalateWhatsApp={handleEscalateWhatsApp}
        />
      )}

      {/* Footer Navigation Shortcuts */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Integrated with Electronic Batch Records (eDHR), IPQC checkpoints, and CMM SPC runs.</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/ipqc')}
            className="text-indigo-600 font-semibold hover:underline cursor-pointer"
          >
            Open IPQC Floor View →
          </button>
          <button 
            onClick={() => navigate('/edhr')}
            className="text-indigo-600 font-semibold hover:underline cursor-pointer"
          >
            eDHR Device History →
          </button>
        </div>
      </div>
    </div>
  );
};
