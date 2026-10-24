// src/components/sync/SyncPayloadInspectorModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  FileCode, 
  Check, 
  Copy, 
  Clock, 
  Cpu, 
  Database,
  ArrowRight
} from 'lucide-react';
import { MasterDataSyncLog } from '../../types/masterDataSync';

interface SyncPayloadInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: MasterDataSyncLog | null;
}

export const SyncPayloadInspectorModal: React.FC<SyncPayloadInspectorModalProps> = ({
  isOpen,
  onClose,
  log
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const currentPayload = activeTab === 'request' 
    ? (log.rawRequestPayload || log.requestPayloadSummary || 'No request payload recorded.') 
    : (log.rawResponsePayload || log.responsePayloadSummary || 'No response payload recorded.');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-800 overflow-hidden font-mono text-slate-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-bold block">
                ERP INTERFACE TELEMETRY & PAYLOAD INSPECTOR
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5 flex items-center space-x-2">
                <span>{log.id}</span>
                <span className="text-slate-500">·</span>
                <span className="text-indigo-400 uppercase">{log.erpSystem.toUpperCase()}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 text-xs font-normal">{log.entityType.toUpperCase()} ({log.direction})</span>
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

        {/* Telemetry Stats Bar */}
        <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Execution Latency</span>
            <strong className="text-emerald-400">{log.durationMs} ms</strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Records Processed</span>
            <strong className="text-white">{log.recordsProcessed} items ({log.recordsUpdated} updated)</strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Status Code</span>
            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
              log.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              log.status === 'conflict' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {log.status === 'success' ? '200 OK' : log.status === 'conflict' ? '409 Conflict' : 'Error'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Triggered By</span>
            <strong className="text-slate-300 truncate block">{log.triggeredBy}</strong>
          </div>
        </div>

        {/* Payload Tabs */}
        <div className="px-6 pt-3 bg-slate-900/30 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('request')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === 'request' ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Request Payload ({log.erpSystem === 'tally' ? 'XML HTTP' : 'JSON REST'})
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === 'response' ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Response Payload (ERP Acknowledgment)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition flex items-center space-x-1 text-xs cursor-pointer"
            title="Copy payload"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code display */}
        <div className="p-6 bg-slate-950 overflow-x-auto max-h-96">
          <pre className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap select-text">
            {currentPayload}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Target Host: {log.erpSystem === 'tally' ? 'http://localhost:9000 (Tally HTTP Gateway)' : 'https://erp.oraclecloud.com'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs uppercase font-bold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
