// src/components/dispatch/CustomerNotificationModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  Truck, 
  PhoneCall, 
  Calendar, 
  User, 
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Dispatch } from '../../types';
import { shipmentTrackingService } from '../../services/shipmentTrackingService';

interface CustomerNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch;
  tenantId: string;
  onDispatchUpdated?: (updated: Dispatch) => void;
}

export const CustomerNotificationModal: React.FC<CustomerNotificationModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  tenantId,
  onDispatchUpdated
}) => {
  const [recipientPhone, setRecipientPhone] = useState(dispatch.driverPhone || '+91 94406 12345');
  const [sendingAlert, setSendingAlert] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery confirmation sub-form inside modal
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [receiverName, setReceiverName] = useState(dispatch.customerName || 'Store In-Charge');
  const [conditionStatus, setConditionStatus] = useState<'intact' | 'damaged' | 'shortage'>('intact');
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  if (!isOpen) return null;

  const publicTrackingUrl = shipmentTrackingService.getPublicTrackingUrl(dispatch);
  const carrierPortalUrl = shipmentTrackingService.resolveCarrierPortalUrl(
    dispatch.transporter,
    dispatch.lrNumber || dispatch.LRNumber || ''
  );

  const customerName = dispatch.customerName || 'Tata Motors Precision CVBU';
  const orderNumber = dispatch.orderId || 'ORD-901';
  const transporter = dispatch.transporter || 'SafeExpress Logistics';
  const lrNumber = dispatch.lrNumber || dispatch.LRNumber || 'LR-890122';
  const vehicleNumber = dispatch.vehicleNumber || 'MH-12-PQ-9876';
  const ewbNumber = dispatch.ewayBill?.ewayBillNumber || '2410 8829 4102';
  const etaDate = dispatch.carrierDetails?.etaDate || dispatch.dispatchDate || 'Tomorrow';

  const previewMessage = `Dear ${customerName}, your order ${orderNumber} has been dispatched via ${transporter}. LR No: ${lrNumber}. Vehicle: ${vehicleNumber}. EWB: ${ewbNumber}. Expected delivery: ${etaDate}. Track live shipment: ${publicTrackingUrl} — Ashrey FlowOps`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicTrackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendNotification = async () => {
    setSendingAlert(true);
    setFeedback(null);
    try {
      const res = await shipmentTrackingService.sendDispatchWhatsAppAlert(
        tenantId,
        dispatch,
        recipientPhone
      );
      setFeedback({
        type: 'success',
        text: `WhatsApp dispatch alert successfully transmitted to ${recipientPhone} (Ref: ${res.messageId}). Tracking link embedded.`
      });
      if (onDispatchUpdated) {
        onDispatchUpdated({
          ...dispatch,
          whatsappSent: true,
          whatsappSentAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `Failed to trigger WhatsApp notification: ${err.message || 'Gateway error'}`
      });
    } finally {
      setSendingAlert(false);
    }
  };

  const handleConfirmDeliveryFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmingDelivery(true);
    try {
      const res = await shipmentTrackingService.confirmDelivery(tenantId, dispatch.id, {
        receiverName,
        receiverPhone: recipientPhone,
        conditionStatus,
        sealsVerified: true,
        confirmedVia: 'sales_manager',
        confirmedBy: 'Sales Manager'
      });
      setFeedback({
        type: 'success',
        text: `Consignment marked Delivered! Automatic confirmation WhatsApp sent to ${recipientPhone}.`
      });
      setShowDeliveryForm(false);
      if (onDispatchUpdated) {
        onDispatchUpdated(res.dispatch);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `Delivery confirmation failed: ${err.message}`
      });
    } finally {
      setConfirmingDelivery(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Shipment Tracking & WhatsApp Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Automated customer updates with live tracking links & delivery confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
          
          {/* Feedback Banner */}
          {feedback && (
            <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button 
                onClick={() => setFeedback(null)} 
                className="text-xs font-bold text-slate-400 hover:text-slate-700 ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* Consignment Quick Metrics Strip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Consignment</span>
              <strong className="text-slate-900">{dispatch.dispatchNumber || dispatch.id}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Carrier / LR</span>
              <strong className="text-indigo-900 truncate block">{lrNumber}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Transit Vehicle</span>
              <span className="text-slate-800 uppercase font-bold">{vehicleNumber}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                dispatch.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {dispatch.status}
              </span>
            </div>
          </div>

          {/* Public Tracking Link Box */}
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Customer Public Tracking Portal Link (No Login Required)
              </label>
              {carrierPortalUrl && (
                <a
                  href={carrierPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-indigo-600 hover:underline flex items-center space-x-1"
                >
                  <span>Carrier Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={publicTrackingUrl}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-mono text-xs font-bold uppercase flex items-center space-x-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={publicTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                title="Preview public tracking page as customer sees it"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* WhatsApp Recipient Phone */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
              Recipient WhatsApp Mobile (Client / Purchasing Manager)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full sm:w-72 p-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                Indian 10-digit mobile or with +91
              </span>
            </div>
          </div>

          {/* Interactive WhatsApp Chat Bubble Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                WhatsApp Message Preview (AiSensy / Wati Registered Template)
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                template: order_dispatched
              </span>
            </div>

            <div className="p-4 bg-[#E5DDD5] rounded-2xl border border-slate-300 relative overflow-hidden font-sans">
              <div className="max-w-md bg-white rounded-xl p-3.5 shadow-sm text-slate-800 text-xs leading-relaxed space-y-2 border border-slate-200 relative">
                <p className="font-semibold text-slate-900">
                  Dear <strong className="text-indigo-900">{customerName}</strong>,
                </p>
                <p>
                  Your order <strong className="font-mono text-slate-900">{orderNumber}</strong> has been dispatched via <strong className="text-slate-900">{transporter}</strong>.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-700 space-y-0.5 border border-slate-100">
                  <div>LR No: <strong>{lrNumber}</strong></div>
                  <div>Vehicle: <strong>{vehicleNumber}</strong></div>
                  <div>E-Way Bill: <strong>{ewbNumber}</strong></div>
                  <div>Expected Delivery: <strong>{etaDate}</strong></div>
                </div>
                <p className="text-[11px] text-slate-600">
                  📦 <strong>Track live shipment:</strong><br />
                  <span className="text-indigo-600 font-mono text-[10px] break-all underline">
                    {publicTrackingUrl}
                  </span>
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>— Ashrey FlowOps</span>
                  <div className="flex items-center space-x-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <Check className="h-3 w-3 text-sky-500 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Confirmation Section */}
          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">
                  Shipment Delivery Confirmation
                </h4>
                <p className="text-[11px] text-slate-500">
                  Record official delivery signoff. Automatically alerts customer with receipt confirmation.
                </p>
              </div>

              {dispatch.status === 'Delivered' ? (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-lg">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Delivered & Acknowledged</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                  className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-mono text-[10px] font-bold uppercase transition cursor-pointer flex items-center space-x-1"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{showDeliveryForm ? 'Hide Form' : 'Mark Delivered (Sales Signoff)'}</span>
                </button>
              )}
            </div>

            {/* Quick Delivery Form */}
            {showDeliveryForm && dispatch.status !== 'Delivered' && (
              <form onSubmit={handleConfirmDeliveryFromModal} className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Condition of Goods
                    </label>
                    <select
                      value={conditionStatus}
                      onChange={e => setConditionStatus(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="intact">Intact & Undamaged</option>
                      <option value="damaged">Damage Reported</option>
                      <option value="shortage">Shortage Reported</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={confirmingDelivery}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg uppercase font-bold text-[10px] tracking-wider transition cursor-pointer"
                  >
                    {confirmingDelivery ? 'Recording...' : 'Confirm Delivery & Send WhatsApp'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            {dispatch.whatsappSent ? (
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Alert sent {dispatch.whatsappSentAt ? new Date(dispatch.whatsappSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}</span>
              </span>
            ) : (
              <span>Customer notification pending dispatch trigger</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-mono text-xs font-bold uppercase cursor-pointer transition"
            >
              Close
            </button>

            <button
              type="button"
              disabled={sendingAlert || !recipientPhone.trim()}
              onClick={handleSendNotification}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingAlert ? 'Sending...' : 'Send WhatsApp Alert'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CustomerNotificationModal;
