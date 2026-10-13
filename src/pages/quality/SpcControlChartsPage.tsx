// src/pages/quality/SpcControlChartsPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  BookOpen,
  Sparkles,
  Layers,
  Sliders,
  RotateCcw,
  Clock,
  User,
  Table,
  Activity,
  ArrowRight,
  Flame,
  ChevronDown
} from 'lucide-react';
import { useSPC } from '../../hooks/useSPC';
import { SpcControlChartViewer } from '../../components/spc/SpcControlChartViewer';
import { ProcessCapabilityCard } from '../../components/spc/ProcessCapabilityCard';
import { OocAlertsDrawer } from '../../components/spc/OocAlertsDrawer';
import { AddSubgroupModal } from '../../components/spc/AddSubgroupModal';
import { CreateSpcStudyModal } from '../../components/spc/CreateSpcStudyModal';
import { WesternElectricRulesGuideModal } from '../../components/spc/WesternElectricRulesGuideModal';

export const SpcControlChartsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    activeStudyData,
    windowedSubgroups,
    subgroupWindow,
    setSubgroupWindow,
    showZones,
    setShowZones,
    alerts,
    kpis,
    loading,
    addSubgroup,
    simulateDrift,
    saveStudy,
    acknowledgeAlert,
    exportCsv
  } = useSPC();

  const [activeTab, setActiveTab] = useState<'chart' | 'capability' | 'alerts' | 'ledger'>('chart');
  const [isAddSubgroupOpen, setIsAddSubgroupOpen] = useState<boolean>(false);
  const [isCreateStudyOpen, setIsCreateStudyOpen] = useState<boolean>(false);
  const [isRulesGuideOpen, setIsRulesGuideOpen] = useState<boolean>(false);
  const [isSimulateMenuOpen, setIsSimulateMenuOpen] = useState<boolean>(false);

  const activeStudy = activeStudyData?.study;
  const activeLimits = activeStudyData?.limits;
  const activeCapability = activeStudyData?.capability;
  const activeHistogram = activeStudyData?.histogram;

  const handleSimulate = (driftOption: 'normal' | 'upward_drift' | 'downward_drift' | 'outlier') => {
    simulateDrift(driftOption);
    setIsSimulateMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">Statistical Process Control (SPC)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  X̄/R &bull; Cp/Cpk &bull; Western Electric
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time variable and attribute control charts with automatic process drift alerts before defects occur
              </p>
            </div>
          </div>
        </div>

        {/* Global Page Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rules Guide */}
          <button
            onClick={() => setIsRulesGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            Western Electric Rules
          </button>

          {/* Simulate Live Telemetry Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSimulateMenuOpen(!isSimulateMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Simulate Live Drift
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {isSimulateMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 flex flex-col gap-1 text-xs">
                <button
                  onClick={() => handleSimulate('normal')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                >
                  <span>Normal In-Spec Variation</span>
                  <span className="text-[10px] text-emerald-400 font-mono">In-Control</span>
                </button>
                <button
                  onClick={() => handleSimulate('upward_drift')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                >
                  <span>Tool Wear / Upward Drift</span>
                  <span className="text-[10px] text-amber-400 font-mono">Trigger Rule 2/5</span>
                </button>
                <button
                  onClick={() => handleSimulate('downward_drift')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                >
                  <span>Downward Center Shift</span>
                  <span className="text-[10px] text-amber-400 font-mono">Trigger Rule 4</span>
                </button>
                <button
                  onClick={() => handleSimulate('outlier')}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-rose-300"
                >
                  <span>Spike Above UCL Outlier</span>
                  <span className="text-[10px] text-rose-400 font-mono font-bold">Rule 1 (&gt;3σ)</span>
                </button>
              </div>
            )}
          </div>

          {/* Log Subgroup Button */}
          {activeStudy && (
            <button
              onClick={() => setIsAddSubgroupOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Log Subgroup
            </button>
          )}

          {/* New Study */}
          <button
            onClick={() => setIsCreateStudyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            + New Study
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Active Studies</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis?.totalStudies || 0}</span>
            <span className="text-[10px] text-slate-400">Charts active</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">In-Control Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {kpis?.totalStudies ? Math.round((kpis.inControlStudiesCount / kpis.totalStudies) * 100) : 100}%
            </span>
            <span className="text-[10px] text-emerald-400/80">Stable</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Fleet Avg Cpk</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${(kpis?.averageCpk || 0) >= 1.33 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {kpis?.averageCpk.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-slate-400">
              {(kpis?.averageCpk || 0) >= 1.33 ? 'Capable' : 'Marginal'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Active OOC Alerts</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${(kpis?.activeAlertsCount || 0) > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {kpis?.activeAlertsCount || 0}
            </span>
            {(kpis?.criticalAlertsCount || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 animate-pulse">
                {kpis?.criticalAlertsCount} Crit
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Total Subgroups</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">{kpis?.totalSubgroupsLogged || 0}</span>
            <span className="text-[10px] text-slate-400">Logged</span>
          </div>
        </div>
      </div>

      {/* Study Selector Row */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 px-2">Select Study:</span>
          {studies.map(s => {
            const isSelected = s.id === selectedStudyId;
            const hasAlerts = s.subgroups.some(sg => sg.violations && sg.violations.length > 0);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudyId(s.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{s.studyName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {s.chartType}
                </span>
                {hasAlerts && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Links to IPQC & IQC */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate('/ipqc')}
            className="text-slate-400 hover:text-blue-400 flex items-center gap-1 transition"
          >
            In-Process (IPQC) <ArrowRight className="w-3 h-3" />
          </button>
          <span className="text-slate-600">&bull;</span>
          <button
            onClick={() => navigate('/iqc')}
            className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
          >
            Incoming (IQC) <ArrowRight className="w-3 h-3" />
          </button>
          <span className="text-slate-600">&bull;</span>
          <button
            onClick={() => navigate('/gages')}
            className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
          >
            Gage Calibration <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'chart'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Control Charts (X̄ &amp; R)
        </button>

        <button
          onClick={() => setActiveTab('capability')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'capability'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Capability Analysis (Cp / Cpk)
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Out-of-Control Alerts ({alerts.filter(a => !a.acknowledged).length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          Subgroup Data Ledger ({activeStudy?.subgroups.length || 0})
        </button>
      </div>

      {/* TAB CONTENT 1: CONTROL CHARTS */}
      {activeTab === 'chart' && activeStudy && activeLimits && (
        <div className="flex flex-col gap-6">
          <SpcControlChartViewer
            study={activeStudy}
            limits={activeLimits}
            subgroups={windowedSubgroups}
            showZones={showZones}
            onToggleZones={() => setShowZones(!showZones)}
            subgroupWindow={subgroupWindow}
            onChangeWindow={setSubgroupWindow}
          />
        </div>
      )}

      {/* TAB CONTENT 2: PROCESS CAPABILITY */}
      {activeTab === 'capability' && activeStudy && activeCapability && activeHistogram && (
        <div className="flex flex-col gap-6">
          <ProcessCapabilityCard
            capability={activeCapability}
            histogram={activeHistogram}
            study={activeStudy}
          />
        </div>
      )}

      {/* TAB CONTENT 3: OUT OF CONTROL ALERTS */}
      {activeTab === 'alerts' && (
        <div className="flex flex-col gap-6">
          <OocAlertsDrawer
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
          />
        </div>
      )}

      {/* TAB CONTENT 4: SUBGROUP DATA LEDGER */}
      {activeTab === 'ledger' && activeStudy && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Subgroup Inspection Ledger</h3>
              <p className="text-xs text-slate-400">
                Raw samples, computed subgroup statistics, and Western Electric rule evaluations
              </p>
            </div>
            <button
              onClick={() => setIsAddSubgroupOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" /> Log Subgroup
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono text-[11px] border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Lot / Batch</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Mean (X̄)</th>
                  <th className="px-4 py-3">Range (R) / MR</th>
                  <th className="px-4 py-3">Measurements</th>
                  <th className="px-4 py-3">Status / Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeStudy.subgroups.map(sg => {
                  const hasViolation = sg.violations && sg.violations.length > 0;
                  const isCrit = sg.violations.some(v => v.severity === 'critical');
                  return (
                    <tr
                      key={sg.id}
                      className={`hover:bg-slate-800/30 transition ${
                        hasViolation ? (isCrit ? 'bg-rose-950/20' : 'bg-amber-950/15') : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-white">#{sg.subgroupNumber}</td>
                      <td className="px-4 py-3 text-slate-400 font-sans">
                        {new Date(sg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{sg.batchOrLotNumber}</td>
                      <td className="px-4 py-3 text-slate-300 font-sans">{sg.operatorName}</td>
                      <td className="px-4 py-3 text-slate-400">{sg.machineId}</td>
                      <td className="px-4 py-3 font-bold text-cyan-400">{sg.mean.toFixed(4)}</td>
                      <td className="px-4 py-3 text-purple-400">
                        {sg.movingRange !== undefined ? sg.movingRange.toFixed(4) : sg.range.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {sg.measurements && sg.measurements.length > 0
                          ? `[${sg.measurements.join(', ')}]`
                          : sg.defectivesCount !== undefined
                          ? `${sg.defectivesCount} / ${sg.totalInspected}`
                          : `${sg.defectsCount} defects`}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        {hasViolation ? (
                          <div className="flex flex-col gap-1">
                            {sg.violations.map((v, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  v.severity === 'critical'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {v.ruleName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> In Control
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddSubgroupOpen && activeStudy && (
        <AddSubgroupModal
          study={activeStudy}
          onClose={() => setIsAddSubgroupOpen(false)}
          onSubmit={addSubgroup}
        />
      )}

      {isCreateStudyOpen && (
        <CreateSpcStudyModal
          onClose={() => setIsCreateStudyOpen(false)}
          onSave={saveStudy}
        />
      )}

      {isRulesGuideOpen && (
        <WesternElectricRulesGuideModal
          onClose={() => setIsRulesGuideOpen(false)}
        />
      )}

    </div>
  );
};
