// src/components/quality-dashboard/CapaAgingSection.tsx

import React, { useState } from 'react';
import { CapaAgingItem, CapaAgingSummary } from '../../types/qualityDashboard';
import { CapaDetailModal } from './CapaDetailModal';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Send, 
  ChevronRight, 
  User, 
  CheckCircle,
  Filter,
  FileCheck2
} from 'lucide-react';

interface CapaAgingSectionProps {
  capaList: CapaAgingItem[];
  agingSummary: CapaAgingSummary;
  onEscalateWhatsApp: (capaId: string, role: string) => void;
}

export const CapaAgingSection: React.FC<CapaAgingSectionProps> = ({
  capaList,
  agingSummary,
  onEscalateWhatsApp
}) => {
  const [selectedBracket, setSelectedBracket] = useState<string>('all');
  const [activeModalCapa, setActiveModalCapa] = useState<CapaAgingItem | null>(null);

  const filteredCapas = capaList.filter(item => {
    if (selectedBracket === 'all') return true;
    if (selectedBracket === 'overdue') return item.isOverdue;
    return item.agingBracket === selectedBracket;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header & Aging Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              CAPA Aging & Resolution Pipeline
            </h3>
            <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
              {agingSummary.totalOverdue} Overdue Escalations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracks Corrective & Preventive Action aging by time bracket to prevent stagnant quality investigations.
          </p>
        </div>

        {/* Total Active counter */}
        <div className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 self-start sm:self-center">
          Total In-Flight: <strong className="text-slate-900">{agingSummary.totalOpen} CAPAs</strong>
        </div>
      </div>

      {/* Bracket Quick Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setSelectedBracket('all')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedBracket === 'all'
              ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-500 block">All Brackets</span>
          <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
            {agingSummary.totalOpen} Active
          </span>
        </button>

        <button
          onClick={() => setSelectedBracket('<7d')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedBracket === '<7d'
              ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-emerald-700 font-semibold block">&lt; 7 Days (Fresh)</span>
          <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
            {agingSummary.bracketUnder7} CAPAs
          </span>
        </button>

        <button
          onClick={() => setSelectedBracket('8-15d')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedBracket === '8-15d'
              ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-500'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-sky-700 font-semibold block">8 - 15 Days</span>
          <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
            {agingSummary.bracket8to15} CAPAs
          </span>
        </button>

        <button
          onClick={() => setSelectedBracket('16-30d')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedBracket === '16-30d'
              ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-amber-700 font-semibold block">16 - 30 Days</span>
          <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
            {agingSummary.bracket16to30} CAPAs
          </span>
        </button>

        <button
          onClick={() => setSelectedBracket('>30d')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedBracket === '>30d'
              ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500'
              : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/60'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-rose-700 font-bold block">&gt; 30 Days (Overdue)</span>
          <span className="text-base font-bold text-rose-700 font-display mt-0.5 block">
            {agingSummary.bracketOver30} Critical
          </span>
        </button>
      </div>

      {/* CAPA Item List */}
      <div className="space-y-3">
        {filteredCapas.map((capa) => (
          <div
            key={capa.id}
            onClick={() => setActiveModalCapa(capa)}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start space-x-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                capa.isOverdue
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : capa.agingBracket === '16-30d'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {capa.agingDays}d
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700">{capa.capaNumber}</span>
                  <span className="text-[10px] text-slate-400 font-mono">[{capa.ncrRef}]</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    capa.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                    capa.severity === 'major' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {capa.severity}
                  </span>
                  {capa.isOverdue && (
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase">
                      Overdue Target
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{capa.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  Part: <strong className="text-slate-700">{capa.partName}</strong> • Lead: <strong className="text-slate-700">{capa.ownerName}</strong> ({capa.ownerRole})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
              <div className="text-right hidden sm:block font-mono text-xs">
                <span className="text-[10px] text-slate-400 block uppercase">Bracket</span>
                <span className="font-bold text-slate-700">{capa.agingBracket}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEscalateWhatsApp(capa.id, capa.ownerRole);
                }}
                title="Send WhatsApp Alert"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModalCapa(capa);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredCapas.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            No active CAPAs found for bracket {selectedBracket}.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <CapaDetailModal
        capa={activeModalCapa}
        onClose={() => setActiveModalCapa(null)}
        onEscalateWhatsApp={(id, role) => {
          onEscalateWhatsApp(id, role);
          setActiveModalCapa(null);
        }}
      />
    </div>
  );
};
