// src/pages/quality/NonConformancePage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Award,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Clock,
  RotateCcw,
  Sparkles,
  FileCheck2,
  Trash2,
  Wrench,
  CheckCircle2,
  Truck,
  Activity,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useNcr } from '../../hooks/useNcr';
import {
  NcrRecord,
  CapaRecord,
  NcrStatus,
  NcrSeverity,
  NcrDispositionType
} from '../../types/ncr';
import { NcrDispositionModal } from '../../components/ncr/NcrDispositionModal';
import { CreateNcrModal } from '../../components/ncr/CreateNcrModal';
import { CapaWorkbenchModal } from '../../components/ncr/CapaWorkbenchModal';
import { NcrAgingDashboard } from '../../components/ncr/NcrAgingDashboard';

export const NonConformancePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    ncrs,
    capas,
    aging,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    createNcr,
    recordDisposition,
    createCapa,
    updateCapa,
    verifyAndCloseCapa,
    exportCsv
  } = useNcr();

  const [activeTab, setActiveTab] = useState<'ncrs' | 'capas' | 'aging'>('ncrs');

  // Modals state
  const [selectedDispositionNcr, setSelectedDispositionNcr] = useState<NcrRecord | null>(null);
  const [isCreateNcrOpen, setIsCreateNcrOpen] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<CapaRecord | null>(null);

  const handleLaunchCapaFromNcr = (ncr: NcrRecord) => {
    const newCapa = createCapa({
      title: `${ncr.partSku} - ${ncr.title}`,
      linkedNcrIds: [ncr.id],
      linkedNcrNumbers: [ncr.ncrNumber],
      partSku: ncr.partSku,
      partName: ncr.partName,
      problemStatement: ncr.defectDescription,
      ownerName: 'Lead Quality Engineer'
    });
    setSelectedCapa(newCapa);
  };

  const getSeverityBadge = (sev: NcrSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase">
            Critical
          </span>
        );
      case 'major':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
            Major
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
            Minor
          </span>
        );
    }
  };

  const getDispositionBadge = (disp: NcrDispositionType) => {
    switch (disp) {
      case 'rework':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
            <Wrench className="w-3 h-3" />
            Rework
          </span>
        );
      case 'scrap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
            <Trash2 className="w-3 h-3" />
            Scrap
          </span>
        );
      case 'use_as_is':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            Use-As-Is
          </span>
        );
      case 'return_to_vendor':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" />
            RTV
          </span>
        );
      case 'sort_segregate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit">
            <Layers className="w-3 h-3" />
            Sort/Screen
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit animate-pulse">
            <Clock className="w-3 h-3" />
            Pending MRB
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Non-Conformance (NCR) & CAPA
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  ISO 9001 Section 8.7 &bull; MRB Disposition &bull; 8D CAPA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated NCR logging, MRB disposition workflow (rework/scrap/use-as-is), and 8D root cause investigation
              </p>
            </div>
          </div>
        </div>

        {/* Global Page Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateNcrOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log Non-Conformance (NCR)
          </button>

          <button
            onClick={() => {
              const newCapa = createCapa({
                title: 'New Root Cause Investigation',
                partSku: 'GENERAL-PLANT',
                partName: 'Systemic Process Investigation'
              });
              setSelectedCapa(newCapa);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-xl text-xs font-medium transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            New 8D CAPA
          </button>

          <button
            onClick={() => navigate('/quality-holds')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-medium transition"
            title="Manage Quality Holds and Dispatch Gates"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Quality Holds
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Download CSV Audit Ledger"
          >
            <Download className="w-4 h-4" />
            Export Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total NCRs */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total NCRs</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{kpis.totalNcrs}</span>
            <span className="text-xs text-slate-400 ml-1.5">Logged</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">All recorded deviations</span>
        </div>

        {/* Pending MRB Disposition */}
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>Pending Disposition</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {kpis.dispositionPendingCount}
            </span>
            <span className="text-xs text-amber-400/80 ml-1.5">Awaiting MRB</span>
          </div>
          <span className="text-[11px] text-amber-400/70 mt-1 block">Rework / Scrap decision</span>
        </div>

        {/* Active 8D CAPAs */}
        <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
            <span>Active 8D CAPAs</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {kpis.activeCapas}
            </span>
            <span className="text-xs text-cyan-400/80 ml-1.5">Investigations</span>
          </div>
          <span className="text-[11px] text-cyan-400/70 mt-1 block">Root cause prevention</span>
        </div>

        {/* Overdue Items */}
        <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
            <span>Overdue Actions</span>
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {kpis.overdueCount}
            </span>
            <span className="text-xs text-rose-400/80 ml-1.5">Overdue</span>
          </div>
          <span className="text-[11px] text-rose-400/70 mt-1 block">SLA threshold exceeded</span>
        </div>

        {/* Total Scrap & Rework Cost */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total COPQ Loss</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-200 font-mono">
              ${(kpis.totalScrapCost + kpis.totalReworkCost).toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Scrap + Rework Machining</span>
        </div>

      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('ncrs')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'ncrs' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Non-Conformance Ledger & Dispositions ({ncrs.length})
          {activeTab === 'ncrs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-400 shadow-sm shadow-rose-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('capas')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'capas' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          8D CAPA Investigations ({capas.length})
          {activeTab === 'capas' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === 'aging' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Aging Report & COPQ Analysis
          {activeTab === 'aging' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-sm shadow-amber-400" />
          )}
        </button>
      </div>

      {/* TAB 1: NCR Ledger & Dispositions */}
      {activeTab === 'ncrs' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by NCR #, Part SKU, Lot #, Customer, or Supplier..."
                  value={filter.searchQuery || ''}
                  onChange={e => setFilter({ ...filter, searchQuery: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Severity Filter */}
              <select
                value={filter.severity || 'all'}
                onChange={e => setFilter({ ...filter, severity: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>

              {/* Disposition Filter */}
              <select
                value={filter.dispositionType || 'all'}
                onChange={e => setFilter({ ...filter, dispositionType: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Dispositions</option>
                <option value="pending">Pending MRB</option>
                <option value="rework">Rework</option>
                <option value="scrap">Scrap</option>
                <option value="use_as_is">Use-As-Is (Concession)</option>
                <option value="return_to_vendor">Return to Vendor (RTV)</option>
              </select>

              {/* Source Filter */}
              <select
                value={filter.source || 'all'}
                onChange={e => setFilter({ ...filter, source: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Sources</option>
                <option value="ipqc">In-Process (IPQC)</option>
                <option value="fqc">Final Quality (FQC)</option>
                <option value="iqc">Incoming Goods (IQC)</option>
                <option value="spc">SPC Control Drift</option>
                <option value="shopfloor">Shopfloor</option>
              </select>
            </div>

            <button
              onClick={() => setFilter({ searchQuery: '', severity: 'all', dispositionType: 'all', source: 'all' })}
              className="text-slate-400 hover:text-white px-2 py-1 rounded transition text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* NCR Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">NCR # & Origin</th>
                    <th className="p-3.5">Part SKU & Lot #</th>
                    <th className="p-3.5">Defect Description</th>
                    <th className="p-3.5">Qty Defective</th>
                    <th className="p-3.5">MRB Disposition</th>
                    <th className="p-3.5">Quarantine Area</th>
                    <th className="p-3.5">Aging</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ncrs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p className="text-sm">Zero non-conformances matching active filter.</p>
                      </td>
                    </tr>
                  ) : (
                    ncrs.map(n => (
                      <tr key={n.id} className="hover:bg-slate-850/50 transition">
                        
                        {/* NCR # & Origin */}
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-rose-400 block">
                            {n.ncrNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">
                            Src: {n.source}
                          </span>
                          {n.sourceReferenceId && (
                            <span className="text-[10px] text-slate-500 block font-mono">
                              Ref: {n.sourceReferenceId}
                            </span>
                          )}
                        </td>

                        {/* Part SKU & Lot */}
                        <td className="p-3.5">
                          <strong className="text-slate-200 block">{n.partSku}</strong>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                            {n.partName}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Lot: {n.lotNumber}
                          </span>
                        </td>

                        {/* Defect Description */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            {getSeverityBadge(n.severity)}
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {n.defectCategory}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                            {n.defectDescription}
                          </p>
                        </td>

                        {/* Qty Defective */}
                        <td className="p-3.5 font-mono">
                          <span className="font-bold text-rose-400 block">
                            {n.defectiveQuantity} pcs
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            of {n.affectedQuantity} lot
                          </span>
                        </td>

                        {/* MRB Disposition */}
                        <td className="p-3.5">
                          {getDispositionBadge(n.disposition.dispositionType)}
                          {n.disposition.dispositionedBy && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              By {n.disposition.dispositionedBy}
                            </span>
                          )}
                        </td>

                        {/* Quarantine Area */}
                        <td className="p-3.5">
                          <span className="font-mono text-amber-300 font-semibold block text-[11px]">
                            {n.quarantineLocation}
                          </span>
                          {n.financialImpactCopq > 0 && (
                            <span className="text-[10px] text-slate-500 block font-mono">
                              COPQ: ${n.financialImpactCopq}
                            </span>
                          )}
                        </td>

                        {/* Aging */}
                        <td className="p-3.5 font-mono">
                          <span className={`font-bold block ${
                            n.agingDays > 14 ? 'text-rose-400' : n.agingDays > 7 ? 'text-amber-400' : 'text-slate-300'
                          }`}>
                            {n.agingDays} days
                          </span>
                          {n.isOverdue && (
                            <span className="text-[9px] uppercase font-bold text-rose-400 block animate-pulse">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDispositionNcr(n)}
                              className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-medium border border-amber-700/60 transition flex items-center gap-1"
                              title="Material Review Board disposition decision"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              Disposition
                            </button>

                            {n.linkedCapaId ? (
                              <button
                                onClick={() => {
                                  const c = capas.find(item => item.id === n.linkedCapaId);
                                  if (c) setSelectedCapa(c);
                                }}
                                className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 rounded-lg text-xs font-medium border border-cyan-700/60 transition flex items-center gap-1"
                                title="View linked 8D CAPA"
                              >
                                <Award className="w-3.5 h-3.5" />
                                8D CAPA
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLaunchCapaFromNcr(n)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                                title="Escalate to 8D CAPA Investigation"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                +CAPA
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 8D CAPA Investigations */}
      {activeTab === 'capas' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">
                Active 8D Corrective & Preventive Action (CAPA) Investigations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured root cause analysis via 5-Whys, Ishikawa fishbone diagrams, and effectiveness verification audits
              </p>
            </div>

            <button
              onClick={() => {
                const newCapa = createCapa({
                  title: 'New Root Cause Investigation',
                  partSku: 'GENERAL-PLANT',
                  partName: 'Systemic Process Investigation'
                });
                setSelectedCapa(newCapa);
              }}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              New 8D CAPA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capas.map(capa => {
              const completedActions = capa.correctiveActions.filter(a => a.status === 'completed').length;
              const totalActions = capa.correctiveActions.length;

              return (
                <div
                  key={capa.id}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                        {capa.capaNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        capa.status === 'closed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {capa.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{capa.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                      {capa.problemStatement}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Part:</span>
                        <span className="font-mono text-cyan-300">{capa.partSku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ishikawa Category:</span>
                        <span className="font-mono text-slate-200 uppercase">{capa.ishikawaCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Corrective Actions:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {completedActions} of {totalActions} Implemented
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Closure:</span>
                        <span className="font-mono text-slate-200">{capa.targetClosureDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Owner: <strong>{capa.ownerName}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedCapa(capa)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>8D Workbench</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Aging Report & COPQ Analysis */}
      {activeTab === 'aging' && (
        <NcrAgingDashboard
          aging={aging}
          kpis={kpis}
          ncrs={ncrs}
          capas={capas}
          onSelectNcr={n => setSelectedDispositionNcr(n)}
          onFilterBracket={bracket => {
            setFilter({ ...filter, agingBracket: bracket });
            setActiveTab('ncrs');
          }}
        />
      )}

      {/* DISPOSITION MODAL */}
      {selectedDispositionNcr && (
        <NcrDispositionModal
          ncr={selectedDispositionNcr}
          isOpen={Boolean(selectedDispositionNcr)}
          onClose={() => setSelectedDispositionNcr(null)}
          onSubmitDisposition={(ncrId, data) => {
            recordDisposition(ncrId, data);
          }}
          onLaunchCapa={n => handleLaunchCapaFromNcr(n)}
        />
      )}

      {/* CREATE NCR MODAL */}
      {isCreateNcrOpen && (
        <CreateNcrModal
          isOpen={isCreateNcrOpen}
          onClose={() => setIsCreateNcrOpen(false)}
          onCreateNcr={data => {
            createNcr(data);
          }}
        />
      )}

      {/* CAPA WORKBENCH MODAL */}
      {selectedCapa && (
        <CapaWorkbenchModal
          capa={selectedCapa}
          isOpen={Boolean(selectedCapa)}
          onClose={() => setSelectedCapa(null)}
          onSaveCapa={(id, updates) => {
            updateCapa(id, updates);
          }}
          onVerifyAndClose={(id, verificationData) => {
            verifyAndCloseCapa(id, verificationData);
          }}
        />
      )}

    </div>
  );
};
