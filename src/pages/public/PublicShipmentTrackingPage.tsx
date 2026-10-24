// src/pages/public/PublicShipmentTrackingPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  PhoneCall, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  Copy, 
  Layers, 
  Scale, 
  FileText, 
  Building2, 
  ArrowRight,
  UserCheck,
  Sparkles,
  Phone,
  RefreshCw
} from 'lucide-react';
import { shipmentTrackingService } from '../../services/shipmentTrackingService';
import { Dispatch, Tenant } from '../../types';

export const PublicShipmentTrackingPage: React.FC = () => {
  const { trackingRef } = useParams<{ trackingRef: string }>();
  
  const [loading, setLoading] = useState(true);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Confirmation Modal / Form State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [conditionStatus, setConditionStatus] = useState<'intact' | 'damaged' | 'shortage'>('intact');
  const [sealsVerified, setSealsVerified] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState<string | null>(null);

  // Load shipment details
  const loadShipment = async () => {
    if (!trackingRef) return;
    setLoading(true);
    try {
      const res = await shipmentTrackingService.getShipmentByTrackingRef(trackingRef);
      setDispatch(res.dispatch);
      setTenant(res.tenant);
    } catch (err) {
      console.warn('Error loading public shipment tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
    window.addEventListener('dispatch_updated', loadShipment);
    return () => window.removeEventListener('dispatch_updated', loadShipment);
  }, [trackingRef]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Submit delivery confirmation
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatch || !receiverName.trim()) return;

    setSubmittingDelivery(true);
    try {
      const tenantId = dispatch.tenantId || tenant?.id || 'demo';
      const result = await shipmentTrackingService.confirmDelivery(tenantId, dispatch.id, {
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        conditionStatus,
        sealsVerified,
        remarks: remarks.trim(),
        confirmedVia: 'customer_portal'
      });

      setDispatch(result.dispatch);
      setDeliverySuccessMsg(`Delivery confirmed! A confirmation WhatsApp message has been dispatched to ${receiverPhone || 'your mobile'}.`);
      setShowConfirmModal(false);
    } catch (err: any) {
      alert(`Failed to confirm delivery: ${err.message || 'System error'}`);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-mono text-xs">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mb-3" />
        <p className="font-bold uppercase tracking-widest">Resolving Consignment Tracking...</p>
        <span className="text-slate-400 mt-1 text-[11px]">Connecting to Logistics Gateway</span>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-md w-full space-y-3">
          <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Consignment Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            We could not locate shipment reference <strong>"{trackingRef}"</strong>. Please verify the tracking number received in your WhatsApp dispatch alert.
          </p>
        </div>
      </div>
    );
  }

  const isDelivered = dispatch.status === 'Delivered' || dispatch.status === 'delivered';
  const carrierPortalUrl = shipmentTrackingService.resolveCarrierPortalUrl(
    dispatch.transporter, 
    dispatch.lrNumber || dispatch.LRNumber || ''
  );

  // Stepper Calculation
  const steps = [
    { title: 'Packed & Staged', desc: 'Cartons weighed & sealed', done: true },
    { title: 'Dispatched', desc: `Departed ${dispatch.dispatchBay || 'Dock Bay'}`, done: true },
    { title: 'In Transit', desc: `Via ${dispatch.transporter || 'Carrier'}`, done: true },
    { title: 'Delivered', desc: isDelivered ? (dispatch.deliveredAt ? new Date(dispatch.deliveredAt).toLocaleDateString() : 'Received') : 'Pending Arrival', done: isDelivered }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-indigo-500 selection:text-white">
      
      {/* Brand Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block leading-none">
                Live Shipment Portal
              </span>
              <h1 className="text-sm font-bold text-white mt-0.5 leading-tight">
                {tenant?.companyName || tenant?.name || 'Apex Precision Manufacturing Ltd.'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="text-xs font-mono border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              title="Copy tracking link to clipboard"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Success Alert Banner if just confirmed */}
        {deliverySuccessMsg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-200 flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-300 font-sans text-sm">Delivery Receipt Recorded!</strong>
              <p className="mt-0.5">{deliverySuccessMsg}</p>
            </div>
          </div>
        )}

        {/* Hero Status Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  Consignment #{dispatch.dispatchNumber || dispatch.id}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                  {isDelivered ? 'Shipment Delivered & Accepted' : 'Consignment In Transit'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order Ref: <strong className="font-mono text-slate-200">{dispatch.orderId}</strong> · Destination: <strong className="text-slate-200">{dispatch.destination || 'Customer Receiving Plant'}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold uppercase tracking-wider border ${
                  isDelivered 
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                    : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 animate-pulse'
                }`}>
                  {isDelivered ? 'Delivered ✓' : 'In Transit'}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {steps.map((st, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        st.done 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {st.done ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
                      </div>
                      <div className={`h-1 flex-1 rounded-full ${st.done ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${st.done ? 'text-white' : 'text-slate-500'}`}>
                        {st.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {st.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Confirmation Card (Customer Action) */}
        {!isDelivered ? (
          <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-sm font-bold text-emerald-200">
                  Have the goods arrived at your facility?
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Acknowledge delivery to automatically notify dispatch and receive statutory digital goods receipt.
              </p>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0 flex items-center justify-center space-x-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Confirm Delivery & Receipt</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-300">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Delivery Acknowledged & Signed</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-200 px-2.5 py-0.5 rounded font-bold uppercase">
                Receipt Verified
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-emerald-900/60 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Received By</span>
                <strong className="text-white">{dispatch.deliveryConfirmation?.receiverName || dispatch.deliveredBy || 'Store Manager'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Delivered At</span>
                <span className="text-white">{dispatch.deliveredAt ? new Date(dispatch.deliveredAt).toLocaleString() : 'Confirmed'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Cargo Condition</span>
                <span className="text-emerald-400 font-bold uppercase">{dispatch.deliveryConfirmation?.conditionStatus || 'Intact'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Seals Check</span>
                <span className="text-emerald-400 font-bold uppercase">{dispatch.deliveryConfirmation?.sealsVerified ? 'Verified' : 'Bypassed'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Specs: Carrier Details & Logistics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Carrier & Transit Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Truck className="h-4 w-4 text-indigo-400" />
                <span>Carrier & Driver Information</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Transport Rail
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Logistics Carrier:</span>
                <strong className="text-white font-sans text-sm">{dispatch.transporter || 'SafeExpress Logistics'}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Lorry Receipt (LR) No:</span>
                <strong className="text-indigo-300 font-bold">{dispatch.lrNumber || dispatch.LRNumber || 'LR-890122'}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Transit Vehicle:</span>
                <span className="text-white font-bold uppercase">{dispatch.vehicleNumber || 'MH-12-PQ-9876'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Assigned Driver:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white">{dispatch.driverName || 'Sukhdev Singh'}</span>
                  {dispatch.driverPhone && (
                    <a
                      href={`tel:${dispatch.driverPhone}`}
                      className="p-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 transition"
                      title="Call Driver directly"
                    >
                      <Phone className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Dispatch Bay / Gate:</span>
                <span className="text-slate-300">{dispatch.dispatchBay || 'Dock Bay #3 (North)'}</span>
              </div>
            </div>

            {/* Carrier Live Link Button */}
            {carrierPortalUrl && (
              <a
                href={carrierPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2 border border-slate-700"
              >
                <span>Track on {dispatch.transporter || 'Carrier'} Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Card 2: E-Way Bill & Packaging Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Package className="h-4 w-4 text-emerald-400" />
                <span>Packaging & E-Way Bill (India)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                GST Compliant
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">GST E-Way Bill:</span>
                <strong className="text-amber-300 tracking-wider">
                  {dispatch.ewayBill?.ewayBillNumber || '2410 8829 4102'}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">E-Way Bill Validity:</span>
                <span className="text-emerald-400 font-bold">Active / Clear</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Total Packages:</span>
                <span className="text-white font-bold">{dispatch.totalPackages || (dispatch.cartons || []).length || 2} Cartons</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Total Weight:</span>
                <span className="text-white">
                  Gross: <strong>{dispatch.totalGrossWeightKg || 68} kg</strong> · Net: <strong>{dispatch.totalNetWeightKg || 64} kg</strong>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60">
                <span className="text-slate-400">Tamper-Evident Seal:</span>
                <span className="text-indigo-300 font-bold">{dispatch.carrierDetails?.sealNumber || 'SEAL-2026-901'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 font-mono">
              <strong>Consignee Note:</strong> Please verify the tamper-evident seal number with the lorry driver prior to offloading pallets.
            </div>
          </div>

        </div>

        {/* Shipped Manifest Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Consignment Manifest & Shipped Lines</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              {(dispatch.items || []).length || 1} Products Listed
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 font-mono text-xs">
            {dispatch.items && dispatch.items.length > 0 ? (
              dispatch.items.map((itm, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <span className="font-bold text-white font-sans text-sm block">{itm.name}</span>
                    <span className="text-[11px] text-slate-400 block">{itm.specs || 'HSN 84834000 · Precision component'}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-bold block">
                      Qty: {itm.quantity} Nos
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white font-sans text-sm block">Forged Steel Spur Gear (Mod 4, 32T)</span>
                  <span className="text-[11px] text-slate-400 block">HSN 84834000 · Lot LOT-2026-441</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-bold block">
                    Qty: 20 Nos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Milestone Event Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Logistics Transit History</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              GPS & Gate Pass Audits
            </span>
          </div>

          <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {dispatch.carrierDetails?.milestones && dispatch.carrierDetails.milestones.length > 0 ? (
              dispatch.carrierDetails.milestones.map((m) => (
                <div key={m.id} className="relative pl-4 space-y-0.5 text-xs font-mono">
                  <div className="absolute -left-[19px] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900"></div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{m.status}</span>
                    <span className="text-[10px] text-slate-500">· {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">{m.note}</p>
                  <span className="text-[10px] text-slate-500 block">Location: {m.location}</span>
                </div>
              ))
            ) : (
              <div className="relative pl-4 space-y-0.5 text-xs font-mono">
                <div className="absolute -left-[19px] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900"></div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Departed Factory Gate</span>
                  <span className="text-[10px] text-slate-500">· {dispatch.dispatchDate || 'Today'}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Container verified, weighed and gate pass cleared with transporter {dispatch.transporter}.
                </p>
                <span className="text-[10px] text-slate-500 block">Location: Factory Main Gate</span>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* MODAL: Customer Delivery Confirmation Form */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base">Confirm Consignment Receipt</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Receiver Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  placeholder="e.g. Rohit Patil (Warehouse In-Charge)"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-sans text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Receiver Mobile Number (For WhatsApp Confirmation)
                </label>
                <input
                  type="tel"
                  value={receiverPhone}
                  onChange={e => setReceiverPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Cargo Condition on Arrival
                </label>
                <select
                  value={conditionStatus}
                  onChange={e => setConditionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-sans focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="intact">Intact & Undamaged (All Boxes in Good Order)</option>
                  <option value="damaged">Outer Packaging Damaged (Subject to Inspection)</option>
                  <option value="shortage">Partial Shortage Reported</option>
                </select>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sealsVerified}
                    onChange={e => setSealsVerified(e.target.checked)}
                    className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-slate-200 font-bold">
                    I have verified that the container/box seals are intact.
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 block pl-6">
                  Seal Number matches: {dispatch.carrierDetails?.sealNumber || 'SEAL-2026-901'}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Remarks / Dock Inspection Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={2}
                  placeholder="e.g. All 20 cartons offloaded safely at Bay 4."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-sans text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl uppercase font-bold text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery || !receiverName.trim()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl uppercase font-bold text-[10px] tracking-wider cursor-pointer transition shadow-md shadow-emerald-500/20"
                >
                  {submittingDelivery ? 'Confirming...' : 'Sign & Submit Delivery Confirmation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default PublicShipmentTrackingPage;
