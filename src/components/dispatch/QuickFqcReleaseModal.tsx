// src/components/dispatch/QuickFqcReleaseModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Award, 
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { FqcInspectionOrder } from '../../types/fqc';
import { fqcService } from '../../services/fqcService';
import { useNavigate } from 'react-router-dom';

interface QuickFqcReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  fqcOrder: FqcInspectionOrder | null;
  onReleased: () => void;
}

export const QuickFqcReleaseModal: React.FC<QuickFqcReleaseModalProps> = ({
  isOpen,
  onClose,
  fqcOrder,
  onReleased
}) => {
  const navigate = useNavigate();
  const [signedBy, setSignedBy] = useState('Rajesh Sharma');
  const [role, setRole] = useState('Plant Operations & QA Authority');
  const [remarks, setRemarks] = useState('All critical dimensional and metallurgical tolerances verified against drawing. Cleared for packaging & immediate outward dispatch.');
  const [disposition, setDisposition] = useState<'passed' | 'conditional_release'>('passed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !fqcOrder) return null;

  const handleSignOff = () => {
    setSubmitting(true);
    setError(null);
    try {
      fqcService.signOffOrder(fqcOrder.id, {
        signedBy,
        role,
        remarks,
        disposition
      });
      onReleased();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to release FQC order');
      setSubmitting(false);
    }
  };

  const isQuarantined = fqcOrder.holdStatus === 'quarantined' || fqcOrder.status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isQuarantined ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block">
                QUALITY RELEASE GATE & AUTHORIZATION
              </span>
              <h2 className="text-base font-bold text-white flex items-center space-x-2 mt-0.5">
                <span>{fqcOrder.fqcNumber}</span>
                <span className="text-slate-400 font-normal">·</span>
                <span className="text-slate-200">{fqcOrder.partSku}</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Context Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Customer Order</span>
              <strong className="text-slate-900 block truncate">{fqcOrder.orderNumber}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Work Order / Lot</span>
              <strong className="text-slate-900 block truncate">{fqcOrder.lotNumber || 'LOT-2026-X'}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Batch Quantity</span>
              <strong className="text-slate-900 block">{fqcOrder.batchQuantity} Nos</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Hold State</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                fqcOrder.holdStatus === 'released' ? 'bg-emerald-100 text-emerald-800' :
                fqcOrder.holdStatus === 'quarantined' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {fqcOrder.holdStatus === 'released' ? 'Released' : fqcOrder.holdStatus === 'quarantined' ? 'Quarantined' : 'On-Hold'}
              </span>
            </div>
          </div>

          {/* Defect Diagnostics */}
          <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-950 block">Defect Analysis Summary</span>
                <span className="text-[11px] text-amber-800 block">
                  Critical: {fqcOrder.defectSummary.critical} · Major: {fqcOrder.defectSummary.major} · Minor: {fqcOrder.defectSummary.minor}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/fqc');
              }}
              className="text-xs font-mono font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Open FQC Desk</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {/* Checklist Items Peek */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono">
                Mandatory Inspection Criteria ({fqcOrder.items.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Passed: {fqcOrder.items.filter(i => i.result === 'pass').length}/{fqcOrder.items.length}
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto font-mono text-[11px]">
              {fqcOrder.items.map((item, idx) => (
                <div key={item.id || idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-bold">{idx + 1}.</span>
                    <span className="text-slate-800 font-medium">{item.title}</span>
                    <span className="text-[9px] text-slate-400 uppercase">({item.category})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.result === 'pass' ? 'bg-emerald-100 text-emerald-800' :
                    item.result === 'fail' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formal E-Signature & Release Section */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 font-mono">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                Authority E-Signature & Certificate of Conformance (CoC) Release
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Authorizing QA Official
                </label>
                <input
                  type="text"
                  value={signedBy}
                  onChange={e => setSignedBy(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Release Disposition
              </label>
              <div className="flex items-center space-x-4 text-xs font-sans">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="disposition"
                    checked={disposition === 'passed'}
                    onChange={() => setDisposition('passed')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Full Release (100% Cleared)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="disposition"
                    checked={disposition === 'conditional_release'}
                    onChange={() => setDisposition('conditional_release')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-slate-800">Conditional Release (Waiver Granted)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Quality Authority Release Notes
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                placeholder="Include validation notes and drawings compliance references..."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono uppercase font-bold rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSignOff}
            disabled={submitting || isQuarantined}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-mono uppercase font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <Award className="h-4 w-4" />
            <span>{submitting ? 'Signing CoC...' : 'Authorize CoC & Release to Dispatch'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
