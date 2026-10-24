// src/components/finance/ErpSyncModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Check, 
  ExternalLink, 
  FileCode, 
  Cpu, 
  Clock, 
  AlertTriangle,
  Building2,
  Scale,
  Send
} from 'lucide-react';
import { Invoice } from '../../types';
import { invoiceErpSyncService } from '../../services/invoiceErpSyncService';
import { ErpSyncLog, TallyIntegrationConfig, OracleSapIntegrationConfig } from '../../types/erpSync';

interface ErpSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  tenantId: string;
  onInvoiceUpdated?: (updated: Invoice) => void;
}

export const ErpSyncModal: React.FC<ErpSyncModalProps> = ({
  isOpen,
  onClose,
  invoice,
  tenantId,
  onInvoiceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'tally' | 'oracle' | 'gst' | 'audit'>('tally');
  const [syncingTally, setSyncingTally] = useState(false);
  const [syncingOracle, setSyncingOracle] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const configs = invoiceErpSyncService.getErpConfig(tenantId);
  const tallyXml = invoiceErpSyncService.generateTallyXml(invoice, configs.tally);
  const oraclePayload = invoiceErpSyncService.generateOracleRestPayload(invoice, configs.oracle);
  const oracleJsonString = JSON.stringify(oraclePayload, null, 2);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([tallyXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tally_SalesVoucher_${invoice.invoiceNumber}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([oracleJsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Oracle_REST_Invoice_${invoice.invoiceNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncToTally = async () => {
    setSyncingTally(true);
    setActionFeedback(null);
    try {
      const result = await invoiceErpSyncService.syncToTallyHttp(
        invoice,
        tenantId,
        'Finance Controller',
        configs.tally
      );
      setActionFeedback(result.message);
      if (onInvoiceUpdated) onInvoiceUpdated(invoice);
    } catch (err: any) {
      setActionFeedback(`Tally Sync Failed: ${err.message || 'Connection error'}`);
    } finally {
      setSyncingTally(false);
    }
  };

  const handleSyncToOracle = async () => {
    setSyncingOracle(true);
    setActionFeedback(null);
    try {
      const result = await invoiceErpSyncService.syncToOracleRest(
        invoice,
        tenantId,
        'Finance Controller',
        configs.oracle
      );
      setActionFeedback(result.message);
      if (onInvoiceUpdated) onInvoiceUpdated(invoice);
    } catch (err: any) {
      setActionFeedback(`Oracle REST Sync Failed: ${err.message || 'API error'}`);
    } finally {
      setSyncingOracle(false);
    }
  };

  const tb = invoice.taxBreakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-black">
                  ERP AUTOMATION & INTEGRATION DESK
                </span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Invoice: {invoice.invoiceNumber}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                ERP Sync & GST Engine (Tally / Oracle Cloud / SAP)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs font-mono">
          <div>
            <span className="text-[9px] text-slate-400 uppercase block font-black">INVOICE VALUATION</span>
            <strong className="text-slate-900 block text-sm">₹{invoice.total.toLocaleString('en-IN')}</strong>
            <span className="text-[10px] text-slate-500 block">Taxable: ₹{invoice.amount.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase block font-black">TALLY PRIME STATUS</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                invoice.tallySyncStatus === 'synced'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {invoice.tallySyncStatus === 'synced' ? 'SYNCED TO TALLY' : 'PENDING SYNC'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block truncate mt-0.5">{invoice.tallySyncRef || 'Port 9000'}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase block font-black">ORACLE / SAP CLOUD</span>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                invoice.oracleSyncStatus === 'synced'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {invoice.oracleSyncStatus === 'synced' ? 'POSTED TO ORACLE' : 'PENDING POST'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block truncate mt-0.5">{invoice.oracleSyncRef || 'REST API'}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase block font-black">DISPATCH LINK</span>
            <strong className="text-indigo-700 block truncate text-xs">{invoice.dispatchNumber || invoice.dispatchId || 'Linked'}</strong>
            <span className="text-[10px] text-slate-500 block">E-Way: {invoice.ewayBillNumber || 'Attached'}</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Tabs Header */}
        <div className="flex border-b border-slate-200 px-6 space-x-4 font-mono text-xs pt-3">
          <button
            onClick={() => setActiveTab('tally')}
            className={`py-2.5 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'tally'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>Tally Prime / ERP 9 (XML)</span>
          </button>

          <button
            onClick={() => setActiveTab('oracle')}
            className={`py-2.5 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'oracle'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Oracle Cloud / SAP (REST JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('gst')}
            className={`py-2.5 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'gst'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>GST & HSN Tax Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Audit Trail ({(invoice.erpSyncLogs || []).length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: Tally Prime XML */}
          {activeTab === 'tally' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Tally Prime Import XML Envelope
                  </h4>
                  <p className="text-xs text-slate-500">
                    Standard Sales Voucher envelope formatted with ledger allocations, GST output ledgers, and buyer details.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(tallyXml)}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
                  >
                    {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPayload ? 'Copied' : 'Copy XML'}</span>
                  </button>

                  <button
                    onClick={handleDownloadXml}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .XML</span>
                  </button>

                  <button
                    onClick={handleSyncToTally}
                    disabled={syncingTally}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    {syncingTally ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>{syncingTally ? 'Pushing to Tally...' : 'Sync to Tally (Port 9000)'}</span>
                  </button>
                </div>
              </div>

              {/* XML Codebox */}
              <div className="relative bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[420px] border border-slate-800">
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {tallyXml}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block uppercase text-[10px]">Tally Import Instructions:</span>
                <p>1. Open Tally Prime → <strong>Import (Alt+O)</strong> → <strong>Transactions</strong> → Select this XML file.</p>
                <p>2. Alternatively, ensure Tally XML Server is running at <code>{configs.tally.serverUrl}</code> to auto-import via HTTP POST.</p>
              </div>
            </div>
          )}

          {/* TAB 2: Oracle Cloud / SAP REST API */}
          {activeTab === 'oracle' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Oracle Cloud Financials REST API Payload
                  </h4>
                  <p className="text-xs text-slate-500">
                    Enterprise Receivables payload compliant with Oracle FSCM and SAP S/4HANA OData schemas.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(oracleJsonString)}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
                  >
                    {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    onClick={handleSyncToOracle}
                    disabled={syncingOracle}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    {syncingOracle ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    <span>{syncingOracle ? 'Posting REST...' : 'Push to Oracle Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* Endpoint banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs flex justify-between items-center text-slate-700">
                <span className="truncate"><strong>POST</strong> {configs.oracle.endpointUrl}</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                  Auth: Bearer Token
                </span>
              </div>

              {/* JSON Codebox */}
              <div className="relative bg-slate-900 text-emerald-400 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800">
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {oracleJsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: GST & Tax Breakdown */}
          {activeTab === 'gst' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">CONSIGNOR (SUPPLIER)</span>
                  <strong className="text-slate-900 block text-sm">Apex Precision Mfg Ltd.</strong>
                  <span className="text-slate-600 block">GSTIN: {tb?.supplierGstin || '24AABCA1234F1Z8'}</span>
                  <span className="text-slate-500 block">State: {tb?.supplierState || 'Gujarat'} ({tb?.supplierStateCode || '24'})</span>
                </div>

                <div>
                  <span className="text-[10px] text-indigo-700 uppercase font-black block">CONSIGNEE (BUYER)</span>
                  <strong className="text-slate-900 block text-sm">{invoice.customerName}</strong>
                  <span className="text-slate-600 block">GSTIN: {tb?.customerGstin || '27AAACG9876K1Z4'}</span>
                  <span className="text-slate-500 block">Place of Supply: {tb?.placeOfSupply || 'Maharashtra (27)'}</span>
                </div>
              </div>

              {/* Tax Type Logic Explainer */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-mono flex items-center justify-between text-indigo-900">
                <span>
                  <strong>Tax Classification:</strong> {tb?.taxType === 'intra_state' 
                    ? 'INTRA-STATE SUPPLY (CGST 9% + SGST 9%) - Same State Trade'
                    : 'INTER-STATE SUPPLY (IGST 18%) - Inter-State Trade'}
                </span>
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  GST Act 2017
                </span>
              </div>

              {/* HSN Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 font-mono text-[10px] uppercase text-slate-600 border-b">
                    <tr>
                      <th className="p-3">HSN Code</th>
                      <th className="p-3">Commodity Description</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">CGST</th>
                      <th className="p-3 text-right">SGST</th>
                      <th className="p-3 text-right">IGST</th>
                      <th className="p-3 text-right pr-4">Total GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {(tb?.hsnSummary || []).map((h, hIdx) => (
                      <tr key={hIdx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{h.hsnCode}</td>
                        <td className="p-3 text-slate-700">{h.description}</td>
                        <td className="p-3 font-mono text-right font-bold text-slate-900">₹{h.taxableValue.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-mono text-right text-slate-600">₹{h.cgstAmount.toLocaleString('en-IN')} ({h.cgstRatePercent}%)</td>
                        <td className="p-3 font-mono text-right text-slate-600">₹{h.sgstAmount.toLocaleString('en-IN')} ({h.sgstRatePercent}%)</td>
                        <td className="p-3 font-mono text-right text-slate-600">₹{h.igstAmount.toLocaleString('en-IN')} ({h.igstRatePercent}%)</td>
                        <td className="p-3 font-mono text-right pr-4 font-black text-indigo-900">₹{h.totalTax.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-mono text-xs font-bold border-t-2 border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={2} className="p-3 uppercase">Total Tax Aggregates:</td>
                      <td className="p-3 text-right">₹{invoice.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">₹{(tb?.cgstAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">₹{(tb?.sgstAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">₹{(tb?.igstAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right pr-4 font-black text-indigo-950">₹{(invoice.taxAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Grand Total Bar */}
              <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl font-mono text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Invoice Grand Total (Rounded):</span>
                  <span className="text-lg font-black">₹{invoice.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Round Off: ₹{tb?.roundOff || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-slate-500 tracking-wider">
                Historical ERP Synchronization Trail
              </h4>

              {(invoice.erpSyncLogs && invoice.erpSyncLogs.length > 0) ? (
                <div className="space-y-2.5">
                  {invoice.erpSyncLogs.map(log => (
                    <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 uppercase">
                            System: {log.system.toUpperCase()}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            Status: {log.status} (Code {log.statusCode || 200})
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Ref Identifier: <strong className="text-indigo-700">{log.referenceId}</strong> · Logged by: {log.syncedBy}
                      </p>
                      {log.responsePayload && (
                        <div className="bg-white p-2 rounded border border-slate-200 text-[10px] text-slate-500 overflow-x-auto">
                          {log.responsePayload}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-400">
                  No automated ERP sync actions recorded yet for this invoice.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl">
          <span className="text-xs font-mono text-slate-500">
            Revenue recognition linked to Indian GST Section 31 & Rule 46
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
