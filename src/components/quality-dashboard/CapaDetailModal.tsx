// src/components/quality-dashboard/CapaDetailModal.tsx

import React from 'react';
import { CapaAgingItem } from '../../types/qualityDashboard';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  User, 
  Send, 
  ExternalLink,
  Calendar,
  FileText
} from 'lucide-react';

interface CapaDetailModalProps {
  capa: CapaAgingItem | null;
  onClose: () => void;
  onEscalateWhatsApp: (capaId: string, role: string) => void;
}

export const CapaDetailModal: React.FC<CapaDetailModalProps> = ({
  capa,
  onClose,
  onEscalateWhatsApp
}) => {
  if (!capa) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
              capa.isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-sky-400">{capa.capaNumber}</span>
                <span className="text-[10px] text-slate-400 font-mono">Linked {capa.ncrRef}</span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-0.5 line-clamp-1">
                {capa.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Key Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Aging</span>
              <strong className={`text-sm font-bold font-mono ${capa.isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                {capa.agingDays} Days ({capa.agingBracket})
              </strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Severity</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                capa.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                capa.severity === 'major' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {capa.severity}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Lead</span>
              <strong className="text-xs font-semibold text-slate-900 block truncate">{capa.ownerName}</strong>
              <span className="text-[10px] text-slate-500 block truncate">{capa.ownerRole}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Date</span>
              <strong className="text-xs font-mono font-bold text-slate-900 block">
                {new Date(capa.targetClosureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </strong>
            </div>
          </div>

          {/* Root Cause & Actions */}
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase font-mono text-slate-900 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                5-Why Root Cause Findings
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
                {capa.rootCauseSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase font-mono text-amber-800 block">
                  D3: Immediate Containment
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {capa.containmentAction}
                </p>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase font-mono text-emerald-800 block">
                  D5/D6: Permanent Corrective Action
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {capa.permanentAction}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Prevention Metric */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-indigo-950 block">Annualized Defect Prevention Saving</span>
              <span className="text-indigo-700 text-[11px]">Calculated based on scrap prevention in future batches</span>
            </div>
            <span className="text-base font-bold font-mono text-indigo-900">
              ₹{capa.preventiveImpactInr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Status: <strong className="uppercase text-slate-700">{capa.status.replace('_', ' ')}</strong>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEscalateWhatsApp(capa.id, capa.ownerRole)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Escalate via WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
