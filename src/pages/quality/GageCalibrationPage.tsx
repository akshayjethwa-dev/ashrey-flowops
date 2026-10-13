// src/pages/quality/GageCalibrationPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Sliders,
  History,
  Building2,
  Barcode,
  ArrowRight,
  Eye,
  Wrench,
  Ban
} from 'lucide-react';
import { useGageCalibration } from '../../hooks/useGageCalibration';
import { GageInstrument, GageCalibrationStatus, GageInstrumentType } from '../../types/gageCalibration';
import { GageMasterModal } from '../../components/gages/GageMasterModal';
import { RecordCalibrationModal } from '../../components/gages/RecordCalibrationModal';
import { CalibrationHistoryModal } from '../../components/gages/CalibrationHistoryModal';
import { GageCalibrationScheduleCalendar } from '../../components/gages/GageCalibrationScheduleCalendar';

export const GageCalibrationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    gages,
    allGages,
    filter,
    setFilter,
    kpis,
    alerts,
    loading,
    recordCalibration,
    saveGage,
    quarantineGage,
    exportCsv
  } = useGageCalibration();

  const [activeViewTab, setActiveViewTab] = useState<'inventory' | 'schedule'>('inventory');

  // Modals state
  const [editingGage, setEditingGage] = useState<GageInstrument | null | 'new'>(null);
  const [calibratingGage, setCalibratingGage] = useState<GageInstrument | null>(null);
  const [historyGage, setHistoryGage] = useState<GageInstrument | null>(null);

  const handleQuarantine = (gage: GageInstrument) => {
    const reason = prompt(`Enter reason to quarantine gage ${gage.assetTag}:`, 'Visual damage or suspected measurement drift');
    if (reason) {
      quarantineGage(gage.id, reason);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">Gage Calibration Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ISO 17025 &bull; NIST Traceability &bull; Inspection Gate
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track calibration due dates for measuring instruments and automatically block inspections with out-of-calibration gages
              </p>
            </div>
          </div>
        </div>

        {/* Global Page Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setEditingGage('new')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Register Instrument
          </button>

          <button
            onClick={() => navigate('/fqc')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Go to Final Quality (FQC) & Dispatch Release"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Final Quality (FQC)
          </button>

          <button
            onClick={() => navigate('/ncr')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Non-Conformance Reports & CAPA Management"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            NCR & CAPA
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono transition"
            title="Download CSV Audit Ledger"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* CRITICAL ALERT BANNER IF GAGES EXPIRED */}
      {alerts.expired.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">
                {alerts.expired.length} Measuring {alerts.expired.length === 1 ? 'Instrument is' : 'Instruments are'} EXPIRED &amp; BLOCKED FOR INSPECTION!
              </span>
              <p className="text-rose-300 mt-0.5">
                Expired gages: {alerts.expired.map(g => `${g.assetTag} (${g.name})`).join(', ')}. Quality inspections using these instruments are automatically locked to guarantee compliance.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilter({ ...filter, status: 'expired' });
              setActiveViewTab('inventory');
            }}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition text-xs shrink-0 self-start sm:self-center"
          >
            View Blocked Gages
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Total Instruments</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{kpis?.totalInstruments || 0}</span>
            <span className="text-[10px] text-slate-400">Master</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">In-Calibration</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{kpis?.inCalibrationCount || 0}</span>
            <span className="text-[10px] text-emerald-400/80">{kpis?.complianceRatePct || 100}% Valid</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Due in 15 Days</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${(kpis?.dueSoonCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {kpis?.dueSoonCount || 0}
            </span>
            <span className="text-[10px] text-amber-400/80">Schedule cal</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Expired &amp; Blocked</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${(kpis?.expiredBlockedCount || 0) > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {kpis?.expiredBlockedCount || 0}
            </span>
            {(kpis?.expiredBlockedCount || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 animate-pulse">
                LOCKED
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Out of Service</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-400">{kpis?.outOfServiceCount || 0}</span>
            <span className="text-[10px] text-slate-400">Quarantine</span>
          </div>
        </div>
      </div>

      {/* Navigation View Switcher & Cross-Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeViewTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Gage Master Registry ({gages.length})
          </button>

          <button
            onClick={() => setActiveViewTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeViewTab === 'schedule'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calibration Schedule &amp; Timeline
          </button>
        </div>

        {/* Quick Links to IQC & IPQC */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate('/iqc')}
            className="text-slate-400 hover:text-blue-400 flex items-center gap-1 transition"
          >
            Incoming (IQC) <ArrowRight className="w-3 h-3" />
          </button>
          <span className="text-slate-600">&bull;</span>
          <button
            onClick={() => navigate('/ipqc')}
            className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition"
          >
            In-Process (IPQC) <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: GAGE MASTER REGISTRY */}
      {activeViewTab === 'inventory' && (
        <div className="flex flex-col gap-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search asset tag, serial, manufacturer, model, location..."
                value={filter.searchQuery || ''}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter.status || 'all'}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Calibration Statuses</option>
              <option value="in_calibration">In-Calibration (Valid)</option>
              <option value="due_soon">Due Soon (&lt; 15 Days)</option>
              <option value="expired">Expired (BLOCKED)</option>
              <option value="out_of_service">Out of Service / Quarantined</option>
            </select>

            {/* Type Filter */}
            <select
              value={filter.type || 'all'}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Instrument Categories</option>
              <option value="micrometer">Micrometers</option>
              <option value="bore_gauge">Bore Gauges</option>
              <option value="caliper">Calipers</option>
              <option value="hardness_tester">Hardness Testers</option>
              <option value="roughness_tester">Roughness Testers</option>
              <option value="plug_thread_gauge">Plug &amp; Thread Gauges</option>
            </select>
          </div>

          {/* Master Table */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Asset Tag</th>
                    <th className="px-4 py-3">Instrument Details</th>
                    <th className="px-4 py-3">Location &amp; Dept</th>
                    <th className="px-4 py-3">Range &amp; Accuracy</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Next Due Date</th>
                    <th className="px-4 py-3">Calibration Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {gages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No instruments matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    gages.map(gage => {
                      const isExpired = gage.calibrationStatus === 'expired';
                      const isDueSoon = gage.calibrationStatus === 'due_soon';
                      const isOutOfService = gage.calibrationStatus === 'out_of_service';

                      return (
                        <tr
                          key={gage.id}
                          className={`hover:bg-slate-800/30 transition ${
                            isExpired ? 'bg-rose-950/20' : isDueSoon ? 'bg-amber-950/15' : ''
                          }`}
                        >
                          {/* Asset Tag */}
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-white block">{gage.assetTag}</span>
                            <span className="text-[10px] text-slate-400 font-sans uppercase">
                              {gage.instrumentType.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Instrument Details */}
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-200 block">{gage.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {gage.manufacturer} &bull; Mod: {gage.modelNumber} &bull; S/N: {gage.serialNumber}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3 text-slate-300">
                            <span>{gage.location}</span>
                            <span className="block text-[10px] text-slate-400">{gage.department}</span>
                          </td>

                          {/* Range & Accuracy */}
                          <td className="px-4 py-3 font-mono text-slate-300">
                            <span>{gage.measurementRange}</span>
                            <span className="block text-[10px] text-slate-400">Res: {gage.resolution} &bull; {gage.accuracy}</span>
                          </td>

                          {/* Frequency */}
                          <td className="px-4 py-3 text-slate-400 font-mono">
                            {gage.calibrationFrequencyMonths} Mo
                          </td>

                          {/* Next Due Date & Overdue Days */}
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-white block">{gage.nextCalibrationDueDate}</span>
                            <span className={`text-[10px] font-bold ${
                              isExpired
                                ? 'text-rose-400 animate-pulse'
                                : isDueSoon
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}>
                              {gage.daysRemaining >= 0
                                ? `${gage.daysRemaining} days left`
                                : `${Math.abs(gage.daysRemaining)} days OVERDUE`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {isExpired && (
                              <div className="flex flex-col gap-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-fit">
                                  <ShieldAlert className="w-3 h-3" /> EXPIRED
                                </span>
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tight">
                                  BLOCKED FOR INSPECTION
                                </span>
                              </div>
                            )}

                            {isDueSoon && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> DUE SOON
                              </span>
                            )}

                            {gage.calibrationStatus === 'in_calibration' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> IN-CALIBRATION
                              </span>
                            )}

                            {isOutOfService && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-fit">
                                <Ban className="w-3 h-3" /> OUT OF SERVICE
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Calibrate button */}
                              <button
                                onClick={() => setCalibratingGage(gage)}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/40 text-xs font-semibold transition"
                                title="Record New Calibration Certificate"
                              >
                                Calibrate
                              </button>

                              {/* History button */}
                              <button
                                onClick={() => setHistoryGage(gage)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                title="View Calibration History & Certificates"
                              >
                                <History className="w-4 h-4" />
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => setEditingGage(gage)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                title="Edit Instrument Details"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>

                              {/* Quarantine button */}
                              <button
                                onClick={() => handleQuarantine(gage)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                                title="Quarantine Instrument"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: CALIBRATION SCHEDULE & TIMELINE */}
      {activeViewTab === 'schedule' && (
        <GageCalibrationScheduleCalendar
          gages={allGages}
          onSelectGage={(g) => setHistoryGage(g)}
          onRecordCalibration={(g) => setCalibratingGage(g)}
        />
      )}

      {/* MODALS */}
      {editingGage && (
        <GageMasterModal
          gage={editingGage === 'new' ? null : editingGage}
          onClose={() => setEditingGage(null)}
          onSave={saveGage}
        />
      )}

      {calibratingGage && (
        <RecordCalibrationModal
          gage={calibratingGage}
          onClose={() => setCalibratingGage(null)}
          onSubmit={recordCalibration}
        />
      )}

      {historyGage && (
        <CalibrationHistoryModal
          gage={historyGage}
          onClose={() => setHistoryGage(null)}
          onRecordNewCalibration={(g) => {
            setHistoryGage(null);
            setCalibratingGage(g);
          }}
        />
      )}

    </div>
  );
};
