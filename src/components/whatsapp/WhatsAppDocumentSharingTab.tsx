// src/components/whatsapp/WhatsAppDocumentSharingTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  WhatsAppSharedDocument, 
  WhatsAppDocSharingStats, 
  SharedDocType, 
  DocDeliveryStatus 
} from './types';
import { 
  whatsappDocSharingService, 
  SEED_SHARED_DOCS,
  SEED_INVOICE_DATA,
  SEED_DELIVERY_NOTE_DATA,
  SEED_QUALITY_CERT_DATA
} from './docSharingService';
import { 
  getInvoicePdfDataUrl,
  getDeliveryNotePdfDataUrl,
  getQualityCertPdfDataUrl 
} from './pdfGenerators';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, 
  Send, 
  Download, 
  Eye, 
  CheckCheck, 
  Check, 
  Clock, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  ShieldCheck, 
  Copy, 
  FileCheck, 
  Smartphone, 
  X,
  ExternalLink,
  Printer,
  Sparkles,
  Share2
} from 'lucide-react';

interface Props {
  tenantId: string;
}

export const WhatsAppDocumentSharingTab: React.FC<Props> = ({ tenantId }) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  // State
  const [documents, setDocuments] = useState<WhatsAppSharedDocument[]>([]);
  const [stats, setStats] = useState<WhatsAppDocSharingStats>(whatsappDocSharingService.getStats(tenantId));
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SharedDocType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocDeliveryStatus>('all');

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [previewDocRecord, setPreviewDocRecord] = useState<WhatsAppSharedDocument | null>(null);

  // New Document Dispatch Modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<SharedDocType>('tax_invoice');
  const [newDocNum, setNewDocNum] = useState(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newCustomerName, setNewCustomerName] = useState('Gujarat Lathe Corporation');
  const [newCustomerPhone, setNewCustomerPhone] = useState('+91 98201 54321');
  const [newOrderNumber, setNewOrderNumber] = useState('ORD-2026-0812');
  const [newDocTitle, setNewDocTitle] = useState('Tax Invoice: Precision Gear Rings & Flanges');
  const [newDocAmount, setNewDocAmount] = useState(544570);
  const [isSending, setIsSending] = useState(false);

  // Load Data
  const refreshData = () => {
    setDocuments(whatsappDocSharingService.getDocuments(tenantId));
    setStats(whatsappDocSharingService.getStats(tenantId));
  };

  useEffect(() => {
    refreshData();
  }, [tenantId]);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.orderNumber && doc.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || doc.docType === typeFilter;
      const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [documents, searchQuery, typeFilter, statusFilter]);

  // Handle Send Document
  const handleSendDocument = async () => {
    setIsSending(true);
    try {
      const doc = await whatsappDocSharingService.sendDocument(tenantId, {
        docType: newDocType,
        docNumber: newDocNum,
        title: newDocTitle,
        customerName: newCustomerName,
        customerPhone: newCustomerPhone,
        orderNumber: newOrderNumber,
        totalAmount: newDocType === 'tax_invoice' ? Number(newDocAmount) : undefined,
        itemCount: 2
      });

      setSendModalOpen(false);
      refreshData();
      toastSuccess(`${doc.docNumber} (${doc.docType.replace('_', ' ')}) dispatched to ${doc.customerName} via WhatsApp!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch document.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Preview Document
  const handleOpenPreview = (doc: WhatsAppSharedDocument) => {
    let url = doc.pdfDataUrl;
    if (!url) {
      if (doc.docType === 'tax_invoice') {
        url = getInvoicePdfDataUrl({
          ...SEED_INVOICE_DATA,
          invoiceNumber: doc.docNumber,
          customerName: doc.customerName
        });
      } else if (doc.docType === 'delivery_note') {
        url = getDeliveryNotePdfDataUrl({
          ...SEED_DELIVERY_NOTE_DATA,
          deliveryNoteNumber: doc.docNumber,
          customerName: doc.customerName
        });
      } else {
        url = getQualityCertPdfDataUrl({
          ...SEED_QUALITY_CERT_DATA,
          certificateNumber: doc.docNumber,
          customerName: doc.customerName
        });
      }
    }
    setPreviewPdfUrl(url);
    setPreviewDocTitle(doc.title);
    setPreviewDocRecord(doc);
  };

  // Handle Simulate Status Transition
  const handleTransitionStatus = (docId: string, targetStatus: DocDeliveryStatus) => {
    whatsappDocSharingService.updateStatus(tenantId, docId, targetStatus);
    refreshData();
    toastSuccess(`Document delivery status updated to ${targetStatus.toUpperCase()}`);
  };

  // Handle Download PDF
  const handleDownload = (doc: WhatsAppSharedDocument) => {
    whatsappDocSharingService.downloadDocPdf(doc);
    refreshData();
    toastSuccess(`Downloaded ${doc.fileName}`);
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP BENTO KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Total Dispatched</span>
            <Share2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.totalSent}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Instant PDF Deliveries</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Tax Invoices</span>
            <FileText className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.invoicesCount}</div>
          <div className="text-[10px] text-sky-600 mt-0.5">GST Compliant E-Invoices</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Delivery Challans</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.deliveryNotesCount}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">With LR & E-Way Bill</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Quality Certs (COA)</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.qualityCertsCount}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">MTC & Chemical Analysis</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Read Rate</span>
            <CheckCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.readRatePercent}%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Double Blue Tick Verified</div>
        </div>
      </div>

      {/* 2. ACTION CONTROLS & FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doc #, customer name, order ref, or title..."
            className="w-full bg-transparent focus:outline-none text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="all">All Document Types</option>
            <option value="tax_invoice">Tax Invoices</option>
            <option value="delivery_note">Delivery Notes</option>
            <option value="quality_certificate">Quality Certificates</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs focus:outline-none"
          >
            <option value="all">All Delivery States</option>
            <option value="sent">Sent (Single Tick)</option>
            <option value="delivered">Delivered (Double Tick)</option>
            <option value="read">Read (Blue Ticks)</option>
          </select>

          <button
            onClick={refreshData}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setSendModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Send New Document</span>
          </button>
        </div>
      </div>

      {/* 3. DOCUMENT CARDS FEED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          return (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-emerald-300 transition flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      doc.docType === 'tax_invoice' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      doc.docType === 'delivery_note' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {doc.docType === 'tax_invoice' ? 'Invoice' :
                       doc.docType === 'delivery_note' ? 'Delivery Note' : 'Quality Cert'}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      #{doc.docNumber}
                    </span>
                  </div>

                  {/* Delivery Status Indicator */}
                  <div className="flex items-center space-x-1 font-mono text-[10px]">
                    {doc.status === 'sent' && (
                      <span className="flex items-center space-x-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        <Check className="h-3 w-3 text-slate-400" />
                        <span>Sent</span>
                      </span>
                    )}
                    {doc.status === 'delivered' && (
                      <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        <CheckCheck className="h-3 w-3 text-slate-500" />
                        <span>Delivered</span>
                      </span>
                    )}
                    {doc.status === 'read' && (
                      <span className="flex items-center space-x-1 text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-bold">
                        <CheckCheck className="h-3 w-3 text-sky-600" />
                        <span>Read</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Customer */}
                <div className="mt-2.5">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.title}</h4>
                  <div className="text-[11px] text-slate-600 mt-1 font-mono">
                    To: <strong className="text-slate-800">{doc.customerName}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {doc.customerPhone} {doc.orderNumber ? `• Order: ${doc.orderNumber}` : ''}
                  </div>
                </div>

                {/* Attachment Pill */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="p-1 bg-red-50 text-red-600 rounded">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="truncate">
                      <div className="text-slate-800 font-bold truncate text-[11px]">
                        {doc.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {doc.fileSizeFormatted} • Digitally Signed PDF
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold shrink-0 ml-2">
                    {doc.downloadCount > 0 ? `${doc.downloadCount} DLs` : 'Attached'}
                  </span>
                </div>
              </div>

              {/* Action Buttons & Simulation */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    title="View PDF Document"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Preview</span>
                  </button>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    title="Download PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Save</span>
                  </button>
                </div>

                {/* Status Toggle Simulators */}
                <div className="flex items-center space-x-1 text-[10px]">
                  {doc.status !== 'read' ? (
                    <button
                      onClick={() => handleTransitionStatus(doc.id, 'read')}
                      className="text-sky-700 hover:bg-sky-50 border border-sky-200 px-2 py-0.5 rounded transition cursor-pointer font-bold"
                      title="Simulate customer opening the document on WhatsApp"
                    >
                      Mark Read ✓✓
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold text-[10px]">
                      Verified Receipt
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
            No shared documents found matching your filter criteria.
          </div>
        )}
      </div>

      {/* 4. MODAL: SEND NEW DOCUMENT VIA WHATSAPP */}
      {sendModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Send className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Send Official Document via WhatsApp
                </h4>
              </div>
              <button
                onClick={() => setSendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Document Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewDocType('tax_invoice');
                      setNewDocNum(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                      setNewDocTitle('Tax Invoice: Precision Gear Rings & Flanges');
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer ${
                      newDocType === 'tax_invoice'
                        ? 'border-sky-500 bg-sky-50 text-sky-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tax Invoice
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewDocType('delivery_note');
                      setNewDocNum(`DN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                      setNewDocTitle('Delivery Challan & Dispatch Gate Pass');
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer ${
                      newDocType === 'delivery_note'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Delivery Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewDocType('quality_certificate');
                      setNewDocNum(`QC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                      setNewDocTitle('Certificate of Analysis (COA) / QC Release');
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer ${
                      newDocType === 'quality_certificate'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Quality Cert
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Document #
                  </label>
                  <input
                    type="text"
                    value={newDocNum}
                    onChange={(e) => setNewDocNum(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Order Ref #
                  </label>
                  <input
                    type="text"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Recipient Customer
                  </label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    WhatsApp Phone #
                  </label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {newDocType === 'tax_invoice' && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Invoice Amount (₹ INR with GST)
                  </label>
                  <input
                    type="number"
                    value={newDocAmount}
                    onChange={(e) => setNewDocAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-bold focus:outline-none"
                  />
                </div>
              )}

              {/* PDF Preview Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-800 font-sans">
                <strong>Auto-Generated Indian B2B PDF:</strong> FlowOps will automatically compile the official, GST-compliant PDF with digital verification seals, embed it as a WhatsApp document payload, and start receipt tracking.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 font-mono text-xs">
              <button
                onClick={() => setSendModalOpen(false)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDocument}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-3xs disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? 'Generating & Sending...' : 'Dispatch Document via WhatsApp'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL: FULL-SCREEN PDF VIEWER */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold tracking-tight">
                  {previewDocTitle}
                </h4>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                {previewDocRecord && (
                  <button
                    onClick={() => handleDownload(previewDocRecord)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={previewPdfUrl}
                title="Document PDF Preview"
                className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white"
              />
            </div>

            {/* Footer Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Digitally verified via FlowOps Cloud ERP</span>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppDocumentSharingTab;
