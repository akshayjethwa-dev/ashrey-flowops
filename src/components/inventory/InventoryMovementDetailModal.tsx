// src/components/inventory/InventoryMovementDetailModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRightLeft, 
  Package, 
  FileCode, 
  Zap, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Boxes,
  MapPin,
  Calendar,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { InventoryMovementSyncRecord } from '../../types/inventoryMovementSync';
import { inventoryMovementSyncService } from '../../services/inventoryMovementSyncService';
import { useToast } from '../../context/ToastContext';

interface InventoryMovementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InventoryMovementSyncRecord | null;
  tenantId: string;
  onUpdated: () => void;
}

export const InventoryMovementDetailModal: React.FC<InventoryMovementDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  tenantId,
  onUpdated
}) => {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'payload' | 'error_log'>('details');
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const config = inventoryMovementSyncService.getConfig(tenantId);
  const payloadText = record.payloadSnapshot || (
    record.erpSystem === 'tally' 
      ? inventoryMovementSyncService.generateTallyVoucherXml(record, config)
      : record.erpSystem === 'oracle'
      ? inventoryMovementSyncService.generateOracleInventoryTxnJson(record, config)
      : inventoryMovementSyncService.generateSapMaterialDocumentJson(record, config)
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    toastInfo('Copied to Clipboard', 'ERP movement payload copied successfully.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetrySync = async () => {
    setRetrying(true);
    try {
      await inventoryMovementSyncService.retryFailedMovement(tenantId, record.id);
      toastSuccess('ERP Synchronized', `Movement ${record.movementNumber} successfully pushed to ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
      onClose();
    } catch (e: any) {
      toastError('Retry Failed', e.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleImmediateSync = async () => {
    setRetrying(true);
    try {
      await inventoryMovementSyncService.syncSingleMovement(tenantId, record.id);
      toastSuccess('Movement Synchronized', `Pushed ${record.movementNumber} to ${record.erpSystem.toUpperCase()}.`);
      onUpdated();
      onClose();
    } catch (e: any) {
      toastError('Sync Failed', e.message);
    } finally {
      setRetrying(false);
    }
  };

  const getMovementTypeBadge = () => {
    if (record.type === 'goods_receipt') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold text-[10px] uppercase font-mono">
          <ArrowDownLeft className="h-3.5 w-3.5" />
          <span>Goods Receipt (GRN)</span>
        </span>
      );
    }
    if (record.type === 'material_issue') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase font-mono">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Material Issue (WIP)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase font-mono">
        <Package className="h-3.5 w-3.5" />
        <span>Finished Goods Receipt</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-mono text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              {getMovementTypeBadge()}
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 text-[11px] uppercase">
                {record.erpSystem.toUpperCase()} ERP Movement
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
              <span>{record.movementNumber}</span>
              <span className="text-slate-400 font-normal">({record.itemName})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-b border-slate-200 px-4 bg-slate-50/70 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'details' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Movement Details
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'payload' ? 'border-indigo-650 text-indigo-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ERP Payload ({record.erpSystem === 'tally' ? 'XML' : 'JSON'})
          </button>
          {record.lastError && (
            <button
              onClick={() => setActiveTab('error_log')}
              className={`py-2.5 px-3 font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === 'error_log' ? 'border-rose-600 text-rose-800 bg-rose-50/40' : 'border-transparent text-rose-600 hover:text-rose-800'
              }`}
            >
              Error Diagnostics (1)
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Failure Alert Banner */}
              {record.status === 'failed' && record.lastError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Sync Failure ({record.lastError.errorCode}): {record.lastError.errorMessage}</span>
                  </div>
                  <p className="text-[11px] text-rose-800 pl-6">
                    <strong>Suggested Fix:</strong> {record.lastError.suggestedFix}
                  </p>
                </div>
              )}

              {/* Status & Timing Grid */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sync Status</span>
                  <span className={`inline-flex items-center space-x-1 mt-0.5 text-xs font-bold uppercase ${
                    record.status === 'synced' ? 'text-emerald-700' :
                    record.status === 'failed' ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {record.status === 'synced' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    <span>{record.status.toUpperCase()}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Transmission Mode</span>
                  <strong className="text-slate-900 block mt-0.5 uppercase">
                    {record.syncMode === 'real_time' ? 'Instant Real-Time' : 'Scheduled Batch'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ERP Voucher Number</span>
                  <strong className="text-indigo-950 block mt-0.5">
                    {record.erpVoucherNumber || 'Pending Transmission'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Logged At</span>
                  <span className="text-slate-700 block mt-0.5 text-[11px]">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Physical Material Logistics Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Stock SKU Master</span>
                    <strong className="text-sm text-slate-900 block">{record.itemName}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">Code: {record.itemCode} · Category: {record.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Movement Quantity</span>
                    <strong className="text-sm text-slate-900 block font-mono">
                      {record.quantity} {record.uom}
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ₹{record.totalValueINR.toLocaleString('en-IN')} (@ ₹{record.unitCostINR}/{record.uom})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Source Origin</span>
                    <strong className="text-slate-800 block text-xs mt-0.5">{record.sourceLocation}</strong>
                    <span className="text-[10px] text-slate-500 block mt-1">Lot / Heat #: <strong>{record.lotNumber}</strong></span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Destination</span>
                    <strong className="text-slate-800 block text-xs mt-0.5">{record.targetLocation}</strong>
                    <span className="text-[10px] text-slate-500 block mt-1">Reference: <strong>{record.referenceNumber}</strong></span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Store Operator: <strong>{record.operatorName}</strong> ({record.operatorId})</span>
                  <span>Plant: <strong>{record.plantName}</strong></span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ERP PAYLOAD */}
          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Generated {record.erpSystem.toUpperCase()} Payload for Movement {record.movementNumber}
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[350px] leading-relaxed select-text">
                {payloadText}
              </pre>
            </div>
          )}

          {/* TAB 3: ERROR LOG */}
          {activeTab === 'error_log' && record.lastError && (
            <div className="space-y-3">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-950">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                    Error Code: {record.lastError.errorCode}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Attempt {record.lastError.attemptNumber} of {record.maxRetries}
                  </span>
                </div>

                <p className="font-bold text-xs">{record.lastError.errorMessage}</p>

                <div className="pt-2 border-t border-rose-200 text-[11px]">
                  <strong className="block text-rose-900 mb-0.5">Recommended Remediation:</strong>
                  <span>{record.lastError.suggestedFix}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {record.syncedAt ? (
              <span>Synchronized on {new Date(record.syncedAt).toLocaleString()}</span>
            ) : (
              <span className="text-amber-700 font-bold">Unconfirmed in ERP ledger</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs uppercase transition cursor-pointer"
            >
              Close
            </button>

            {record.status === 'failed' && (
              <button
                onClick={handleRetrySync}
                disabled={retrying}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Retrying...' : 'Retry ERP Sync'}</span>
              </button>
            )}

            {record.status === 'pending' && (
              <button
                onClick={handleImmediateSync}
                disabled={retrying}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs uppercase transition shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                <span>{retrying ? 'Posting...' : 'Push to ERP Now'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
