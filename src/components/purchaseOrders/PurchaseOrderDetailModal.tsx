// src/components/purchaseOrders/PurchaseOrderDetailModal.tsx

import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building2,
  Warehouse,
  Boxes,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  MessageSquare,
  Printer,
  User,
  ShieldCheck,
  Send,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { PurchaseOrder, SupplierAckStatus } from '../../types/purchaseOrder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onApprove: (poId: string, comments?: string) => Promise<any>;
  onReject: (poId: string, reason: string) => Promise<any>;
  onIssuePo: (poId: string, channel: 'whatsapp' | 'email') => Promise<any>;
  onRecordAck: (
    poId: string,
    params: {
      status: SupplierAckStatus;
      confirmedDeliveryDate: string;
      vendorConfirmationRef?: string;
      acknowledgedByName?: string;
      notes?: string;
    }
  ) => Promise<any>;
  onRecordDispatch: (
    poId: string,
    params: {
      trackingCarrier: string;
      lorryReceiptNumber: string;
      dispatchDate: string;
      expectedDeliveryDate?: string;
      notes?: string;
    }
  ) => Promise<any>;
  onOpenPrintModal: (order: PurchaseOrder) => void;
}

export const PurchaseOrderDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order,
  onApprove,
  onReject,
  onIssuePo,
  onRecordAck,
  onRecordDispatch,
  onOpenPrintModal
}) => {
  if (!isOpen || !order) return null;

  const [approveComments, setApproveComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Acknowledgment form state
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [ackStatus, setAckStatus] = useState<SupplierAckStatus>('acknowledged_on_time');
  const [confirmedDate, setConfirmedDate] = useState(order.expectedDeliveryDate.split('T')[0]);
  const [vendorRef, setVendorRef] = useState(order.supplierAck.vendorConfirmationRef || '');
  const [ackNotes, setAckNotes] = useState('');

  // Dispatch form state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [carrier, setCarrier] = useState(order.supplierAck.trackingCarrier || 'TCI Freight Logistics');
  const [lrNumber, setLrNumber] = useState(order.supplierAck.lorryReceiptNumber || 'LR-');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [updatedEta, setUpdatedEta] = useState(order.expectedDeliveryDate.split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  // Delivery status calculation
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const deliveryMs = new Date(order.expectedDeliveryDate).getTime();
  const diffDays = Math.ceil((deliveryMs - todayMs) / 86400000);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await onApprove(order.id, approveComments);
      setActionSuccessMsg('Purchase order approved! Registered in inbound inventory pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setSubmitting(true);
      await onReject(order.id, rejectReason);
      setActionSuccessMsg('Purchase order rejected.');
      setShowRejectInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssue = async (channel: 'whatsapp' | 'email') => {
    try {
      setSubmitting(true);
      await onIssuePo(order.id, channel);
      setActionSuccessMsg(`PO issued to supplier via ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}!`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onRecordAck(order.id, {
        status: ackStatus,
        confirmedDeliveryDate: confirmedDate,
        vendorConfirmationRef: vendorRef,
        notes: ackNotes
      });
      setAckModalOpen(false);
      setActionSuccessMsg('Supplier acknowledgment recorded!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onRecordDispatch(order.id, {
        trackingCarrier: carrier,
        lorryReceiptNumber: lrNumber,
        dispatchDate: dispatchDate,
        expectedDeliveryDate: updatedEta
      });
      setDispatchModalOpen(false);
      setActionSuccessMsg('Shipment dispatch & in-transit tracking logged!');
    } finally {
      setSubmitting(false);
    }
  };

  // Timeline Step Status
  const isCreated = true;
  const isApproved = order.approvalStatus === 'approved';
  const isIssued = ['issued', 'acknowledged', 'in_transit', 'received'].includes(order.status);
  const isAcked = ['acknowledged', 'in_transit', 'received'].includes(order.status);
  const isInTransit = ['in_transit', 'received'].includes(order.status);
  const isReceived = order.status === 'received';

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">
                  {order.poNumber}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    order.status === 'received'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.status === 'in_transit'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : order.status === 'acknowledged'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : order.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : order.status === 'pending_approval'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  {order.sourceTrigger === 'reorder_level_breach'
                    ? '⚡ Auto: Reorder Level Breach'
                    : order.sourceTrigger === 'mrp_engine'
                    ? '⚙️ Auto: MRP Engine'
                    : '👤 Manual Buyer Order'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vendor: <span className="text-slate-200 font-semibold">{order.supplierName}</span> • Plant: {order.plantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPrintModal(order)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 text-indigo-400" />
              Print PO Form
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="px-6 py-2 bg-emerald-950 border-b border-emerald-800 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* ── 1. Procurement Lifecycle Progress Tracker ───────── */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-3">
              Procurement & Delivery Lifecycle Pipeline
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {/* Step 1: Draft / Generated */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isCreated ? 'bg-indigo-950/40 border-indigo-700 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">1. Generated</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">{formatDate(order.orderDate)}</div>
              </div>

              {/* Step 2: Approved */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isApproved ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">2. Approved</span>
                  {isApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{order.approvalStatus}</div>
              </div>

              {/* Step 3: Issued */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isIssued ? 'bg-sky-950/40 border-sky-700 text-sky-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">3. Issued</span>
                  {isIssued ? <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" /> : <Send className="h-3.5 w-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate">To Supplier</div>
              </div>

              {/* Step 4: Acknowledged */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isAcked ? 'bg-purple-950/40 border-purple-700 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">4. Acknowledged</span>
                  {isAcked ? <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> : <Clock className="h-3.5 w-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{order.supplierAck.status.replace(/_/g, ' ')}</div>
              </div>

              {/* Step 5: In-Transit */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isInTransit ? 'bg-amber-950/40 border-amber-700 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">5. In Transit</span>
                  {isInTransit ? <Truck className="h-3.5 w-3.5 text-amber-400" /> : <Truck className="h-3.5 w-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {order.supplierAck.lorryReceiptNumber ? order.supplierAck.lorryReceiptNumber : 'Pending LR'}
                </div>
              </div>

              {/* Step 6: Received at Dock */}
              <div className={`p-2.5 rounded-xl border text-xs font-mono ${isReceived ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">6. Received</span>
                  {isReceived ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Warehouse className="h-3.5 w-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 truncate">Dock Inward</div>
              </div>
            </div>
          </div>

          {/* ── 2. Expected Delivery Date & Early Warning Alert ──── */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                diffDays < 0
                  ? 'bg-rose-500/20 border border-rose-400/40 text-rose-400'
                  : diffDays <= 2
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-400'
                  : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400'
              }`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Expected Dock Delivery Date
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-bold text-white font-mono">
                    {formatDate(order.expectedDeliveryDate)}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    diffDays < 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : diffDays === 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {diffDays < 0
                      ? `OVERDUE BY ${Math.abs(diffDays)} DAYS`
                      : diffDays === 0
                      ? 'DELIVERY DUE TODAY'
                      : `${diffDays} DAYS REMAINING`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Shopfloor Need-By Date: {formatDate(order.needByDate)} • Payment: {order.paymentTerms}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Total PO Financial Value
              </span>
              <div className="text-xl font-black text-white font-mono">
                {formatCurrency(order.totalAmount)}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Subtotal {formatCurrency(order.subtotal)} + GST {formatCurrency(order.totalTax)}
              </div>
            </div>
          </div>

          {/* ── 3. Approval Action Station ───────────────────────── */}
          {order.status === 'pending_approval' && (
            <div className="p-5 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Purchase Order Approval Workflow
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    AWAITING: {order.currentPendingApproverRole || 'PROCUREMENT MANAGER'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Tier: {order.approvalLimitTier === 'executive_level' ? 'Executive (> ₹5,00,000)' : 'Manager (≤ ₹5,00,000)'}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Approver Remarks / Budget Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved against Q3 raw material allocation..."
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {showRejectInput && (
                <div className="space-y-1">
                  <label className="text-xs text-rose-300 font-bold block">
                    Reason for Rejection *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reason for rejecting this PO..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {showRejectInput ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !rejectReason.trim()}
                      onClick={handleReject}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(true)}
                      className="px-4 py-2 border border-rose-800 text-rose-300 hover:bg-rose-950/60 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Reject PO
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleApprove}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Purchase Order
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── 4. Supplier Interaction & Dispatch Station ───────── */}
          {order.approvalStatus === 'approved' && order.status !== 'received' && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono">
                    Supplier Logistics & Delivery Tracking
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Vendor Ack: <span className="text-indigo-300 font-semibold">{order.supplierAck.status.replace(/_/g, ' ')}</span>
                    {order.supplierAck.lorryReceiptNumber && ` • LR: ${order.supplierAck.lorryReceiptNumber}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {order.status === 'approved' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleIssue('whatsapp')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Issue PO to Vendor (WhatsApp)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAckModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Record Supplier Acknowledgment
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Log Lorry Dispatch
                </button>
              </div>
            </div>
          )}

          {/* ── 5. Line Items Table ──────────────────────────────── */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2">
              Purchase Order Line Items
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 font-mono text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">HSN</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">GST</th>
                    <th className="py-2.5 px-3 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {order.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-950/50">
                      <td className="py-3 px-3 font-bold text-sky-400">{it.stockItemCode}</td>
                      <td className="py-3 px-3 font-sans text-white">{it.stockItemName}</td>
                      <td className="py-3 px-3 text-slate-400">{it.hsnCode || '7213.91'}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {it.orderedQty} {it.unit}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-3 px-3 text-right text-slate-400">18% ({formatCurrency(it.taxAmount)})</td>
                      <td className="py-3 px-3 text-right font-black text-white">{formatCurrency(it.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 6. Approvals & Audit History Trail ───────────────── */}
          {order.approvalsHistory.length > 0 && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-2">
                Approval Sign-Off Audit Trail
              </span>
              <div className="space-y-2">
                {order.approvalsHistory.map((appr) => (
                  <div key={appr.id} className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-1.5 last:border-none">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-white font-bold">{appr.stepName}</span>
                      <span className="text-slate-400">by {appr.approverName} ({appr.approverRole})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDate(appr.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-Modal: Record Supplier Acknowledgment ────────── */}
      {ackModalOpen && (
        <div className="fixed inset-0 z-[140] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Record Supplier Acknowledgment</h3>
              <button onClick={() => setAckModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAck} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Acknowledgment Disposition *</label>
                <select
                  value={ackStatus}
                  onChange={(e) => setAckStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="acknowledged_on_time">✓ Confirmed Delivery Date (On-Time)</option>
                  <option value="counter_proposed_date">⚠️ Counter-Proposed New Delivery Date</option>
                  <option value="rejected_by_supplier">✗ Rejected by Supplier (Out of Stock)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Confirmed Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Vendor Order / Confirmation Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. TATA-SO-2026-904"
                  value={vendorRef}
                  onChange={(e) => setVendorRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional vendor remarks..."
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAckModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-700 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  Save Acknowledgment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sub-Modal: Log Lorry Dispatch ────────────────────── */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-[140] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Log Supplier Lorry Dispatch</h3>
              <button onClick={() => setDispatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Freight Carrier / Transporter *</label>
                <input
                  type="text"
                  required
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Lorry Receipt (LR) # or AWB # *</label>
                <input
                  type="text"
                  required
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Updated ETA at Dock</label>
                  <input
                    type="date"
                    required
                    value={updatedEta}
                    onChange={(e) => setUpdatedEta(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-700 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
                >
                  Confirm In-Transit Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
