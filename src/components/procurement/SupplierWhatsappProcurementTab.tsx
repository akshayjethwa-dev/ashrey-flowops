// src/components/procurement/SupplierWhatsappProcurementTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  SupplierRfq, 
  SupplierRfqItem, 
  SupplierParsedQuote, 
  SupplierPoDeliveryRecord, 
  SupplierAcknowledgmentRecord, 
  ProcurementWhatsappStats 
} from '../../types/supplierWhatsappProcurement';
import { 
  supplierWhatsappProcurementService, 
  REGISTERED_SUPPLIERS 
} from '../../services/supplierWhatsappProcurementService';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { PurchaseOrder } from '../../types/purchaseOrder';
import { downloadPurchaseOrderPdf, getPurchaseOrderPdfDataUrl } from '../../utils/supplierPoPdfGenerator';
import { useToast } from '../../context/ToastContext';
import { 
  FileCheck, 
  Send, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  Layers, 
  Package, 
  Building2, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  TrendingDown, 
  Award, 
  CheckCircle2, 
  Copy, 
  Eye, 
  MessageSquare, 
  Bot, 
  Sliders, 
  Trash2, 
  X,
  Truck,
  DollarSign
} from 'lucide-react';

interface Props {
  tenantId: string;
}

const PRESET_QUOTE_REPLIES = [
  {
    title: 'Tata Steel (Structured Command: EN8 Steel)',
    supplier: 'Tata Steel Industrial Products (+91 98201 12345)',
    phone: '+91 98201 12345',
    rfq: 'SRFQ-2026-0812',
    text: 'QUOTE SRFQ-2026-0812 RATE: 82 LEAD: 6 DAYS TERMS: Net 30 VALID: 30-Nov NOTES: Ready coil stock, MTC included.'
  },
  {
    title: 'Jindal Stainless (Conversational Hinglish: Quick Delivery)',
    supplier: 'Jindal Stainless Ltd (+91 98765 43210)',
    phone: '+91 98765 43210',
    rfq: 'SRFQ-2026-0812',
    text: 'Namaste FlowOps, quote for SRFQ-2026-0812: We can supply 500kg at Rs 85 per kg. Dispatch in 3 days from Pune yard. Payment 45 days. Regards, Amitabh.'
  },
  {
    title: 'Sundram Fasteners (Grade 10.9 Bolts: Discounted Rate)',
    supplier: 'Sundram Fasteners (+91 98111 22334)',
    phone: '+91 98111 22334',
    rfq: 'SRFQ-2026-0815',
    text: 'QUOTE SRFQ-2026-0815 RATE: 25.50 LEAD: 4 DAYS TERMS: Net 30 NOTES: Cold-forged Grade 10.9 black oxide in wooden pallets.'
  }
];

const PRESET_PO_ACKS = [
  {
    title: 'Tata Steel (Accepted on Time + OA Reference)',
    supplier: 'Tata Steel Industrial Products (+91 98201 12345)',
    phone: '+91 98201 12345',
    text: 'ACK PO-2026-1048 ACCEPTED DISPATCH: 22-Nov-2026 REF: OA-TATA-9921'
  },
  {
    title: 'Jindal Stainless (Counter-Proposed Rescheduled Date)',
    supplier: 'Jindal Stainless Ltd (+91 98765 43210)',
    phone: '+91 98765 43210',
    text: 'ACK PO-2026-1048 RESCHEDULE DATE: 26-Nov-2026 REASON: Heat treatment furnace batch slot'
  },
  {
    title: 'Sundram Fasteners (Rejected Due to Capacity)',
    supplier: 'Sundram Fasteners (+91 98111 22334)',
    phone: '+91 98111 22334',
    text: 'ACK PO-2026-1048 REJECTED REASON: Machine overhaul in progress'
  }
];

export const SupplierWhatsappProcurementTab: React.FC<Props> = ({ tenantId }) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'rfqs' | 'parser' | 'po_dispatch' | 'acknowledgments'>('rfqs');
  const [rfqs, setRfqs] = useState<SupplierRfq[]>([]);
  const [deliveries, setDeliveries] = useState<SupplierPoDeliveryRecord[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<SupplierAcknowledgmentRecord[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<ProcurementWhatsappStats>(supplierWhatsappProcurementService.getStats(tenantId));

  // Modals & Selections
  const [createRfqModal, setCreateRfqModal] = useState(false);
  const [selectedRfqForView, setSelectedRfqForView] = useState<SupplierRfq | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>('');

  // Parser Simulator State
  const [parserText, setParserText] = useState(PRESET_QUOTE_REPLIES[0].text);
  const [parserPhone, setParserPhone] = useState(PRESET_QUOTE_REPLIES[0].phone);
  const [lastParsedQuote, setLastParsedQuote] = useState<SupplierParsedQuote | null>(null);
  const [lastConfirmationReply, setLastConfirmationReply] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Acknowledgment Simulator State
  const [ackText, setAckText] = useState(PRESET_PO_ACKS[0].text);
  const [ackPhone, setAckPhone] = useState(PRESET_PO_ACKS[0].phone);
  const [lastAckRecord, setLastAckRecord] = useState<SupplierAcknowledgmentRecord | null>(null);
  const [lastAckReply, setLastAckReply] = useState<string | null>(null);
  const [isProcessingAck, setIsProcessingAck] = useState(false);

  // New RFQ Form State
  const [newRfqTitle, setNewRfqTitle] = useState('Raw Steel Round Bars Replenishment');
  const [newRfqCategory, setNewRfqCategory] = useState('raw_material');
  const [newRfqDeliveryDate, setNewRfqDeliveryDate] = useState('2026-11-28');
  const [newRfqDeadline, setNewRfqDeadline] = useState('2026-10-25 18:00');
  const [newRfqItemCode, setNewRfqItemCode] = useState('TS-EN8-RD45');
  const [newRfqItemDesc, setNewRfqItemDesc] = useState('EN8 Normalized Carbon Steel Round Bar Dia 45mm');
  const [newRfqItemQty, setNewRfqItemQty] = useState(600);
  const [newRfqItemUnit, setNewRfqItemUnit] = useState('kg');
  const [newRfqItemTargetPrice, setNewRfqItemTargetPrice] = useState(85);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(['sup-1', 'sup-2']);

  // Load Data
  const refreshAll = async () => {
    const loadedRfqs = supplierWhatsappProcurementService.getRfqs(tenantId);
    setRfqs(loadedRfqs);
    setDeliveries(supplierWhatsappProcurementService.getDeliveries(tenantId));
    setAcknowledgments(supplierWhatsappProcurementService.getAcknowledgments(tenantId));
    setStats(supplierWhatsappProcurementService.getStats(tenantId));

    try {
      const loadedPos = await purchaseOrderService.getPurchaseOrders(tenantId);
      setPos(loadedPos);
    } catch (e) {
      console.warn('Failed to load purchase orders:', e);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [tenantId]);

  // Handle RFQ WhatsApp Broadcast
  const handleBroadcastRfq = async (rfqId: string) => {
    const target = rfqs.find(r => r.id === rfqId);
    if (!target) return;

    try {
      const recipientIds = target.recipients.map(r => r.supplierId);
      const res = await supplierWhatsappProcurementService.broadcastRfqViaWhatsApp(
        tenantId,
        rfqId,
        recipientIds.length > 0 ? recipientIds : ['sup-1', 'sup-2']
      );

      toastSuccess(`WhatsApp RFQ Broadcast sent to ${res.broadcastCount} registered suppliers!`);
      refreshAll();
    } catch (err: any) {
      toastError(err.message || 'Broadcast failed.');
    }
  };

  // Handle Create New RFQ
  const handleCreateRfq = () => {
    const rfqNumber = `SRFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRfq: SupplierRfq = {
      id: `srfq-${Date.now()}`,
      tenantId,
      rfqNumber,
      title: newRfqTitle,
      category: newRfqCategory,
      targetDeliveryDate: newRfqDeliveryDate,
      submissionDeadline: newRfqDeadline,
      status: 'draft',
      items: [
        {
          id: `item-${Date.now()}`,
          itemCode: newRfqItemCode,
          description: newRfqItemDesc,
          quantity: Number(newRfqItemQty),
          unit: newRfqItemUnit,
          targetPrice: Number(newRfqItemTargetPrice),
          technicalSpecs: 'Standard test certificate (MTC) required.'
        }
      ],
      recipients: selectedSupplierIds.map(id => {
        const s = REGISTERED_SUPPLIERS.find(sup => sup.supplierId === id);
        return {
          supplierId: id,
          supplierName: s?.supplierName || 'Supplier',
          contactPerson: s?.contactPerson || 'Sales Desk',
          phone: s?.phone || '+91 98201 12345',
          category: s?.category || 'raw_material',
          status: 'pending'
        };
      }),
      quotes: [],
      notes: 'Created via WhatsApp Procurement Desk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedRfqs = [newRfq, ...rfqs];
    supplierWhatsappProcurementService.saveRfqs(tenantId, updatedRfqs);
    setRfqs(updatedRfqs);
    setCreateRfqModal(false);
    toastSuccess(`Supplier RFQ ${rfqNumber} created! Ready for WhatsApp broadcast.`);
  };

  // Handle Parse Quote Reply
  const handleParseQuote = () => {
    setIsParsing(true);
    setTimeout(() => {
      const res = supplierWhatsappProcurementService.parseSupplierQuoteReply(
        tenantId,
        parserText,
        parserPhone
      );
      setLastParsedQuote(res.parsedQuote);
      setLastConfirmationReply(res.confirmationReply);
      setIsParsing(false);
      refreshAll();
      toastSuccess(`Quote reply successfully parsed! Recorded rate: ₹${res.parsedQuote?.quotedUnitPrice}/unit.`);
    }, 400);
  };

  // Handle Dispatch PO with PDF via WhatsApp
  const handleDispatchPoWithPdf = async (po: PurchaseOrder) => {
    try {
      const res = await supplierWhatsappProcurementService.dispatchPoWithPdfViaWhatsApp(tenantId, po);
      toastSuccess(`Purchase Order #${po.poNumber} with PDF attachment dispatched to ${po.supplierName} via WhatsApp!`);
      refreshAll();
    } catch (err: any) {
      toastError(err.message || 'PO dispatch failed.');
    }
  };

  // Handle Process Supplier Acknowledgment
  const handleProcessAck = async () => {
    setIsProcessingAck(true);
    try {
      const res = await supplierWhatsappProcurementService.parseSupplierPoAcknowledgment(
        tenantId,
        ackText,
        ackPhone
      );
      setLastAckRecord(res.ackRecord);
      setLastAckReply(res.confirmationReply);
      refreshAll();
      toastSuccess(`Supplier acknowledgment parsed: PO marked as ${res.ackRecord?.ackStatus.toUpperCase()}!`);
    } catch (err: any) {
      toastError(err.message || 'Acknowledgment processing failed.');
    } finally {
      setIsProcessingAck(false);
    }
  };

  // Handle Award Quote
  const handleAwardQuote = async (rfqId: string, quoteId: string) => {
    try {
      const res = await supplierWhatsappProcurementService.awardRfqAndCreatePo(tenantId, rfqId, quoteId);
      toastSuccess(`Quote awarded! Generated Purchase Order #${res.poNumber}. Ready for WhatsApp PDF delivery.`);
      refreshAll();
    } catch (err: any) {
      toastError(err.message || 'Award failed.');
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP HERO BENTO KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Active RFQs</span>
            <FileText className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.activeRfqsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Competitive bidding</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Broadcasts</span>
            <Send className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.broadcastsSentCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">WhatsApp delivery</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Quotes Parsed</span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.quotesReceivedCount}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">NLP auto-extracted</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">POs with PDF</span>
            <FileCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.posDispatchedWithPdfCount}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Verified attachment</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Ack Rate</span>
            <CheckCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">{stats.ackRatePercent}%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Confirmed delivery</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Avg Quote Time</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.avgQuoteTimeHours}h</div>
          <div className="text-[10px] text-slate-400 mt-0.5">85% faster than email</div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('rfqs')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'rfqs'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>RFQ Broadcast & Bid Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('parser')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'parser'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quote Reply Parser Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('po_dispatch')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'po_dispatch'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>PO Delivery with PDF Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('acknowledgments')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'acknowledgments'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Supplier Acknowledgment Bot</span>
          </button>
        </div>

        <button
          onClick={refreshAll}
          className="text-slate-400 hover:text-slate-700 p-2 rounded hover:bg-slate-100 transition cursor-pointer"
          title="Refresh All"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3. TAB 1: RFQ BROADCAST & BID MATRIX */}
      {activeTab === 'rfqs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Supplier RFQs & Multi-Vendor WhatsApp Broadcast</h3>
              <p className="text-xs text-slate-500">Send RFQs simultaneously to approved suppliers and compare quotes in real-time.</p>
            </div>
            <button
              onClick={() => setCreateRfqModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Supplier RFQ</span>
            </button>
          </div>

          {/* RFQ Cards Grid */}
          <div className="space-y-4">
            {rfqs.map(rfq => {
              const lowestQuote = rfq.quotes.length > 0 
                ? [...rfq.quotes].sort((a, b) => a.quotedUnitPrice - b.quotedUnitPrice)[0] 
                : null;

              return (
                <div key={rfq.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {rfq.rfqNumber}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          rfq.status === 'awarded' ? 'bg-emerald-100 text-emerald-800' :
                          rfq.status === 'quotes_received' ? 'bg-purple-100 text-purple-800' :
                          rfq.status === 'broadcasted' ? 'bg-sky-100 text-sky-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {rfq.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-800">{rfq.title}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                        <span>Target Delivery: <strong className="text-slate-700">{new Date(rfq.targetDeliveryDate).toLocaleDateString('en-IN')}</strong></span>
                        <span>Deadline: <strong className="text-slate-700">{rfq.submissionDeadline}</strong></span>
                        <span>Items: <strong className="text-slate-700">{rfq.items.length} line(s)</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      <button
                        onClick={() => handleBroadcastRfq(rfq.id)}
                        className="border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-mono font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
                      >
                        <Send className="h-3 w-3 text-emerald-600" />
                        <span>Broadcast via WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-100 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Items:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rfq.items.map(it => (
                        <div key={it.id} className="bg-white p-2.5 rounded border border-slate-200 flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800">{it.description}</div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">SKU: {it.itemCode} | Grade: {it.materialGrade || 'Standard'}</div>
                            {it.technicalSpecs && <div className="text-[10px] text-slate-500 mt-1 italic">{it.technicalSpecs}</div>}
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-mono font-bold text-slate-900">{it.quantity} {it.unit}</div>
                            <div className="text-[10px] text-slate-500">Target: ₹{it.targetPrice || '-'}/{it.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Broadcast Recipients Status */}
                  <div className="space-y-1.5">
                    <div className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Supplier Recipients ({rfq.recipients.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rfq.recipients.map(r => (
                        <div key={r.supplierId} className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{r.supplierName}</span>
                          <span className="font-mono text-slate-400 text-[10px]">({r.phone})</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            r.status === 'quoted' ? 'bg-purple-100 text-purple-800' :
                            r.status === 'read' ? 'bg-sky-100 text-sky-800' :
                            r.status === 'delivered' ? 'bg-slate-200 text-slate-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bid Evaluation Matrix */}
                  {rfq.quotes.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>Supplier Quotes Received via WhatsApp ({rfq.quotes.length})</span>
                        </div>
                        {lowestQuote && (
                          <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                            <TrendingDown className="h-3 w-3" />
                            <span>L1 Lowest Bid: <strong>₹{lowestQuote.quotedUnitPrice}</strong> ({lowestQuote.supplierName})</span>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-100 text-[10px] font-mono text-slate-600 uppercase">
                            <tr>
                              <th className="p-2">Supplier</th>
                              <th className="p-2">Quoted Unit Rate</th>
                              <th className="p-2">Total Amount</th>
                              <th className="p-2">Lead Time</th>
                              <th className="p-2">Committed Date</th>
                              <th className="p-2">Terms</th>
                              <th className="p-2">Confidence</th>
                              <th className="p-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {rfq.quotes.map(q => {
                              const isL1 = lowestQuote && lowestQuote.id === q.id;

                              return (
                                <tr key={q.id} className={isL1 ? 'bg-emerald-50/30' : ''}>
                                  <td className="p-2">
                                    <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                      <span>{q.supplierName}</span>
                                      {isL1 && (
                                        <span className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                                          L1 WINNER
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400">{q.supplierPhone}</div>
                                  </td>
                                  <td className="p-2 font-mono font-bold text-slate-900">
                                    ₹{q.quotedUnitPrice.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-2 font-mono font-bold text-slate-800">
                                    ₹{q.quotedTotalAmount.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-2 font-mono text-slate-700">
                                    {q.quotedLeadTimeDays} Days
                                  </td>
                                  <td className="p-2 font-mono text-slate-700">
                                    {new Date(q.promisedDeliveryDate).toLocaleDateString('en-IN')}
                                  </td>
                                  <td className="p-2 text-[11px] text-slate-600">
                                    {q.paymentTerms}
                                  </td>
                                  <td className="p-2">
                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                      {q.confidenceScore}% ({q.parsingMethod})
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    {rfq.status === 'awarded' && rfq.awardedSupplierId === q.supplierId ? (
                                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                                        PO AWARDED ({rfq.awardedPoNumber})
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleAwardQuote(rfq.id, q.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded transition cursor-pointer"
                                      >
                                        Award & Issue PO
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: QUOTE REPLY PARSER SIMULATOR */}
      {activeTab === 'parser' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp Quote Reply NLP Parser Simulator</h3>
                  <p className="text-xs text-slate-500">Test how incoming supplier quotation texts are automatically converted into structured bids.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                  Structured & NLP Engine
                </span>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Load Supplier Reply Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_QUOTE_REPLIES.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setParserText(p.text);
                        setParserPhone(p.phone);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left text-xs transition cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 truncate">{p.title}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{p.rfq}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone & Message Body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    Supplier Phone Number
                  </label>
                  <input
                    type="text"
                    value={parserPhone}
                    onChange={e => setParserPhone(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    Target RFQ Hint
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Auto-Detected from Text"
                    className="w-full text-xs bg-slate-50 font-mono text-slate-500 border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Incoming WhatsApp Message Body
                </label>
                <textarea
                  rows={4}
                  value={parserText}
                  onChange={e => setParserText(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded p-2.5 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={handleParseQuote}
                  disabled={isParsing}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs uppercase px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Parse & Record Supplier Bid</span>
                </button>
              </div>
            </div>

            {/* Parsed Result Display */}
            {lastParsedQuote && (
              <div className="bg-white border border-purple-200 rounded-xl p-5 shadow-3xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 font-mono">Parsed Structured Entities</h4>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Confidence: {lastParsedQuote.confidenceScore}% ({lastParsedQuote.parsingMethod})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Quoted Unit Price</div>
                    <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">₹{lastParsedQuote.quotedUnitPrice}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Lead Time</div>
                    <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{lastParsedQuote.quotedLeadTimeDays} Days</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Committed Date</div>
                    <div className="text-xs font-bold text-slate-800 font-mono mt-1">{new Date(lastParsedQuote.promisedDeliveryDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Payment Terms</div>
                    <div className="text-xs font-bold text-slate-800 mt-1">{lastParsedQuote.paymentTerms}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: WhatsApp Chat Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#e5ddd5] border border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="text-[10px] font-mono font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
                <span>Supplier WhatsApp Chat View</span>
              </div>

              {/* Incoming Bubble */}
              <div className="flex justify-start">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%] text-xs space-y-1">
                  <div className="text-[10px] font-bold text-purple-700">{parserPhone}</div>
                  <div className="text-slate-800 font-mono text-[11px] whitespace-pre-line">{parserText}</div>
                  <div className="text-right text-[9px] text-slate-400">10:45 AM</div>
                </div>
              </div>

              {/* Automated Response Bubble */}
              {lastConfirmationReply && (
                <div className="flex justify-end">
                  <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 shadow-sm max-w-[90%] text-xs space-y-1">
                    <div className="text-[10px] font-bold text-emerald-800">Ashrey FlowOps Procurement</div>
                    <div className="text-slate-800 text-[11px] whitespace-pre-line leading-relaxed">{lastConfirmationReply}</div>
                    <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400">
                      <span>10:45 AM</span>
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: PO DELIVERY WITH PDF ATTACHMENT DESK */}
      {activeTab === 'po_dispatch' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Purchase Order Delivery with PDF via WhatsApp</h3>
              <p className="text-xs text-slate-500">Dispatch digitally approved Purchase Orders with full PDF attachments directly to suppliers.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3">Total Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">PDF & WhatsApp Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No purchase orders available.
                      </td>
                    </tr>
                  ) : (
                    pos.map(po => {
                      const delivery = deliveries.find(d => d.poNumber === po.poNumber);

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {po.poNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{po.supplierName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{po.supplierContactPerson || 'Sales Team'}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {po.supplierPhone || '+91 98201 12345'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {po.items.map(i => `${i.orderedQty} ${i.unit} ${i.stockItemName}`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            ₹{po.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                              po.status === 'acknowledged' ? 'bg-emerald-100 text-emerald-800' :
                              po.status === 'issued' ? 'bg-sky-100 text-sky-800' :
                              po.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Preview PDF */}
                              <button
                                onClick={() => {
                                  const url = getPurchaseOrderPdfDataUrl(po);
                                  setPdfPreviewUrl(url);
                                  setPdfPreviewTitle(`Purchase Order #${po.poNumber}`);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                                title="Preview PDF Document"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {/* Download PDF */}
                              <button
                                onClick={() => downloadPurchaseOrderPdf(po)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                                title="Download PDF to PC"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>

                              {/* Dispatch WhatsApp */}
                              <button
                                onClick={() => handleDispatchPoWithPdf(po)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] uppercase rounded-lg flex items-center space-x-1 cursor-pointer transition shadow-3xs"
                              >
                                <Send className="h-3 w-3" />
                                <span>Send WhatsApp PDF</span>
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

      {/* 6. TAB 4: SUPPLIER ACKNOWLEDGMENT BOT & SIMULATOR */}
      {activeTab === 'acknowledgments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Supplier PO Acknowledgment Simulator</h3>
                  <p className="text-xs text-slate-500">Test how incoming supplier PO confirmations automatically update order statuses.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  24/7 Ack Bot
                </span>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Load Supplier Acknowledgment Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_PO_ACKS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAckText(p.text);
                        setAckPhone(p.phone);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left text-xs transition cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 truncate">{p.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Supplier WhatsApp Message
                </label>
                <textarea
                  rows={3}
                  value={ackText}
                  onChange={e => setAckText(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded p-2.5 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={handleProcessAck}
                  disabled={isProcessingAck}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Process Acknowledgment</span>
                </button>
              </div>
            </div>

            {/* Acknowledgment Result */}
            {lastAckRecord && (
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-3xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800">ERP System Status Updated:</span>
                  <span className="font-mono text-emerald-700 font-bold uppercase">{lastAckRecord.ackStatus}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div>Confirmed Delivery: <strong>{lastAckRecord.confirmedDeliveryDate}</strong></div>
                  <div>Supplier Ref: <strong>{lastAckRecord.vendorConfirmationRef || 'N/A'}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Acknowledgment Audit Log */}
          <div className="lg:col-span-6 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Supplier Acknowledgment Audit Trail ({acknowledgments.length})
              </h4>

              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {acknowledgments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No supplier acknowledgments recorded yet.
                  </div>
                ) : (
                  acknowledgments.map(a => (
                    <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-slate-900">{a.poNumber}</span>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">{a.ackStatus}</span>
                      </div>
                      <div className="text-slate-600 font-bold">{a.supplierName} ({a.supplierPhone})</div>
                      <div className="text-[11px] text-slate-500 font-mono italic">"{a.rawReplyText}"</div>
                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        Committed: {a.confirmedDeliveryDate} | Ref: {a.vendorConfirmationRef || 'N/A'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RFQ MODAL */}
      {createRfqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Create Supplier RFQ for WhatsApp Broadcast</h4>
              <button onClick={() => setCreateRfqModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">RFQ Title</label>
                <input
                  type="text"
                  value={newRfqTitle}
                  onChange={e => setNewRfqTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Target Delivery Date</label>
                  <input
                    type="date"
                    value={newRfqDeliveryDate}
                    onChange={e => setNewRfqDeliveryDate(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Submission Deadline</label>
                  <input
                    type="text"
                    value={newRfqDeadline}
                    onChange={e => setNewRfqDeadline(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Item Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-mono text-[10px] font-bold text-slate-700 uppercase">Item Specification:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Item SKU/Code"
                    value={newRfqItemCode}
                    onChange={e => setNewRfqItemCode(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newRfqItemDesc}
                    onChange={e => setNewRfqItemDesc(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newRfqItemQty}
                    onChange={e => setNewRfqItemQty(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Unit (kg, pcs)"
                    value={newRfqItemUnit}
                    onChange={e => setNewRfqItemUnit(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Target Price (INR)"
                    value={newRfqItemTargetPrice}
                    onChange={e => setNewRfqItemTargetPrice(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Suppliers to broadcast */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Select Approved Suppliers for Broadcast:
                </label>
                <div className="space-y-1.5">
                  {REGISTERED_SUPPLIERS.map(sup => (
                    <label key={sup.supplierId} className="flex items-center space-x-2 p-1.5 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.includes(sup.supplierId)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSupplierIds([...selectedSupplierIds, sup.supplierId]);
                          } else {
                            setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== sup.supplierId));
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-bold text-slate-800">{sup.supplierName}</span>
                      <span className="font-mono text-slate-400 text-[10px]">({sup.phone})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCreateRfqModal(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRfq}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase rounded-lg cursor-pointer shadow-3xs"
              >
                Save & Prepare Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">{pdfPreviewTitle}</h4>
              </div>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 pt-2">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded border border-slate-200"
                title="Purchase Order PDF Document Preview"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
