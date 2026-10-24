// src/components/sync/MasterDataConflictModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeftRight, 
  Database, 
  Cpu, 
  Check, 
  Save, 
  FileText,
  UserCheck
} from 'lucide-react';
import { MasterDataConflict } from '../../types/masterDataSync';

interface MasterDataConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: MasterDataConflict | null;
  onResolved: (resolution: 'flowops' | 'erp' | 'custom_merged', notes?: string) => void;
}

export const MasterDataConflictModal: React.FC<MasterDataConflictModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolved
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'flowops' | 'erp' | 'custom_merged'>('flowops');
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'flowops' | 'erp'>>({});
  const [adminNotes, setAdminNotes] = useState('Reconciled during IT master data audit cycle.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !conflict) return null;

  const handleFieldToggle = (fieldName: string, choice: 'flowops' | 'erp') => {
    setFieldSelections(prev => ({
      ...prev,
      [fieldName]: choice
    }));
    setSelectedResolution('custom_merged');
  };

  const handleConfirmResolution = () => {
    setSubmitting(true);
    onResolved(selectedResolution, adminNotes);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block">
                MASTER DATA RECONCILIATION & CONFLICT RESOLUTION
              </span>
              <h2 className="text-base font-bold text-white mt-0.5 flex items-center space-x-2">
                <span>{conflict.entityIdentifier}</span>
                <span className="text-slate-400 font-normal">·</span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {conflict.entityType.toUpperCase()} Discrepancy
                </span>
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs font-mono text-slate-700 max-h-[75vh] overflow-y-auto">
          
          {/* Warning Banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center space-x-2.5 text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong>Bi-directional divergence detected:</strong> Both FlowOps shopfloor and the ERP have modified attributes for this record independently. Choose an authoritative resolution source or merge field-by-field.
            </div>
          </div>

          {/* Quick Resolution Quick-Picks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <button
              type="button"
              onClick={() => setSelectedResolution('flowops')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                selectedResolution === 'flowops'
                  ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-[11px]">FlowOps Authoritative</span>
                <Database className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                Keep shopfloor engineering master; push and overwrite ERP records.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedResolution('erp')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                selectedResolution === 'erp'
                  ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-[11px]">ERP Authoritative</span>
                <Cpu className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                Accept Tally / Oracle corporate master; overwrite FlowOps values.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedResolution('custom_merged')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                selectedResolution === 'custom_merged'
                  ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-[11px]">Field-by-Field Merge</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                Select individual values below to build a synthesized master.
              </p>
            </button>

          </div>

          {/* Side-by-Side Diff Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[10px] uppercase">
                  <th className="py-2.5 px-4 w-1/3">Attribute / Field</th>
                  <th className="py-2.5 px-4 w-1/3 text-indigo-900 bg-indigo-50/50">FlowOps Value</th>
                  <th className="py-2.5 px-4 w-1/3 text-amber-900 bg-amber-50/50">ERP System Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conflict.differingFields.map(diff => {
                  const currentSelection = fieldSelections[diff.field] || (selectedResolution === 'erp' ? 'erp' : 'flowops');

                  return (
                    <tr key={diff.field} className="hover:bg-slate-50/50">
                      
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <span>{diff.label}</span>
                        <span className="block text-[9px] text-slate-400 font-normal uppercase">{diff.field}</span>
                      </td>

                      {/* FlowOps cell */}
                      <td 
                        onClick={() => handleFieldToggle(diff.field, 'flowops')}
                        className={`py-3 px-4 cursor-pointer transition ${
                          currentSelection === 'flowops' 
                            ? 'bg-indigo-50/90 text-indigo-950 font-bold border-l-2 border-indigo-600' 
                            : 'text-slate-500 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{String(diff.flowOpsValue)}</span>
                          {currentSelection === 'flowops' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-200/70 text-indigo-900 uppercase">
                              Active Choice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ERP cell */}
                      <td 
                        onClick={() => handleFieldToggle(diff.field, 'erp')}
                        className={`py-3 px-4 cursor-pointer transition ${
                          currentSelection === 'erp' 
                            ? 'bg-amber-50/90 text-amber-950 font-bold border-l-2 border-amber-600' 
                            : 'text-slate-500 hover:bg-amber-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{String(diff.erpValue)}</span>
                          {currentSelection === 'erp' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200/70 text-amber-900 uppercase">
                              Active Choice
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Audit Notes */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              IT Administrator Reconciliation Note / Justification
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

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
            onClick={handleConfirmResolution}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-mono uppercase font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Apply Resolution & Sync</span>
          </button>
        </div>

      </div>
    </div>
  );
};
