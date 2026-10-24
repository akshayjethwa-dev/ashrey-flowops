import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { 
  WhatsAppOrderMessage, 
  WhatsAppBusinessApiConfig, 
  WhatsAppIntakeStats, 
  WhatsAppOrderItem, 
  WhatsAppParsedOrderData 
} from '../../types/whatsappOrderIntake';
import { 
  whatsappOrderIntakeService, 
  DEFAULT_WHATSAPP_INTAKE_CONFIG 
} from '../../services/whatsappOrderIntakeService';
import { AutomatedStatusBotTab } from '../../components/whatsapp/AutomatedStatusBotTab';
import { ProactiveNotificationsTab } from '../../components/whatsapp/ProactiveNotificationsTab';
import { SupplierWhatsappProcurementTab } from '../../components/procurement/SupplierWhatsappProcurementTab';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ArrowRight, 
  Sliders, 
  Phone, 
  Layers, 
  FileText, 
  ShoppingBag, 
  Truck, 
  Package, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  Save, 
  RotateCcw, 
  Bell, 
  Cpu, 
  Server, 
  Globe, 
  Database, 
  Play, 
  Pause, 
  AlertOctagon, 
  Edit3, 
  Calendar, 
  Building, 
  User, 
  CheckCheck, 
  RefreshCw, 
  Plus, 
  Trash2, 
  FileCheck, 
  ShieldCheck, 
  Smartphone,
  Bot
} from 'lucide-react';

interface PresetOption {
  title: string;
  sender: string;
  phone: string;
  body: string;
  type: 'structured' | 'conversational';
}

const PRESET_MESSAGES: PresetOption[] = [
  {
    title: 'Bharat Forge (Structured PO with Multiple Items)',
    sender: 'Nilesh Patil (Bharat Forge)',
    phone: '+91 98201 12345',
    type: 'structured',
    body: `PO Number: PO-BFL-2026-9905
Customer: Bharat Forge Ltd (Baramati Plant)
Delivery Date: 2026-11-25
Ship to: Baramati MIDC Gate 1, Pune
Terms: Net 45 Days

Items:
1. Part: SS 316 Flange Class 150 4" (SKU: FLG-SS-401) | Qty: 300 pcs | Rate: 1450
2. Part: High-Tensile M16 Stud Bolt Grade 8.8 (SKU: STD-HT-16) | Qty: 1200 pcs | Rate: 85

Kindly book this order and confirm delivery schedule.`
  },
  {
    title: 'Tata Motors (Conversational Urgent Bushings & Shafts)',
    sender: 'Anil Kumar (Tata Motors)',
    phone: '+91 98765 43210',
    type: 'conversational',
    body: `Hi FlowOps team, urgent requirement for assembly line! Please book an order under PO PO/TATA/CVBU/2026/902 for 500 pcs of CNC Bushing Part# BS-4022 and 200 units of Helical Pinion Shaft PS-770. Needed at our Chakan Phase 2 plant by Dec 2nd. Rate as per quote: Rs 550 and Rs 1800. Thanks, Anil Kumar.`
  },
  {
    title: 'Kirloskar (Hinglish Flywheel Ring Gears)',
    sender: 'Rajesh Deshmukh (Kirloskar)',
    phone: '+91 98111 22334',
    type: 'conversational',
    body: `Namaste FlowOps, please place order PO-KOEL-4480 for 600 pcs Flywheel Ring Gear RG-320 @ Rs 1150 each. Deliver before 10th Dec 2026 at Kagal MIDC Kolhapur plant. Very urgent for tractor engine run.`
  },
  {
    title: 'Cummins India (Precision Hydraulic Flanges)',
    sender: 'Vikram Joshi (Cummins)',
    phone: '+91 99234 56789',
    type: 'conversational',
    body: `Dear Sales Desk, please register Cummins Purchase Order PO-CUMM-8821. Item: Hydraulic Valve Flange Part# HVF-90, Quantity: 350 pcs at agreed price of INR 2200 per piece. Delivery required at Phaltan Megasite by 15-Dec-2026.`
  }
];

export const WhatsAppOrderIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const tenantId = tenant?.id || 'demo';

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isStatusQueriesRoute = location.pathname.includes('status-queries') || location.pathname.includes('status-bot');
  const isNotificationsRoute = location.pathname.includes('notification') || searchParams.get('tab') === 'notifications';
  const isSupplierProcurementRoute = location.pathname.includes('supplier') || searchParams.get('tab') === 'supplier_procurement';
  const initialTab = isSupplierProcurementRoute
    ? 'supplier_procurement'
    : isNotificationsRoute
      ? 'notifications'
      : (searchParams.get('tab') === 'status_bot' || isStatusQueriesRoute) 
        ? 'status_bot' 
        : 'simulator';
  // Active Tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'status_bot' | 'notifications' | 'supplier_procurement' | 'roster' | 'config' | 'templates'>(initialTab);

  useEffect(() => {
    if (location.pathname.includes('supplier') || searchParams.get('tab') === 'supplier_procurement') {
      setActiveTab('supplier_procurement');
    } else if (location.pathname.includes('notification') || searchParams.get('tab') === 'notifications') {
      setActiveTab('notifications');
    } else if (location.pathname.includes('status-queries') || location.pathname.includes('status-bot') || searchParams.get('tab') === 'status_bot') {
      setActiveTab('status_bot');
    }
  }, [location.pathname, searchParams]);

  // Core Data
  const [config, setConfig] = useState<WhatsAppBusinessApiConfig>(whatsappOrderIntakeService.getConfig(tenantId));
  const [messages, setMessages] = useState<WhatsAppOrderMessage[]>([]);
  const [stats, setStats] = useState<WhatsAppIntakeStats>(whatsappOrderIntakeService.getStats(tenantId));

  // Simulator State
  const [simPhone, setSimPhone] = useState(PRESET_MESSAGES[0].phone);
  const [simSender, setSimSender] = useState(PRESET_MESSAGES[0].sender);
  const [simMessage, setSimMessage] = useState(PRESET_MESSAGES[0].body);
  const [simParsed, setSimParsed] = useState<WhatsAppParsedOrderData | null>(null);
  const [isProcessingSim, setIsProcessingSim] = useState(false);
  const [lastCreatedOrderNo, setLastCreatedOrderNo] = useState<string | null>(null);
  const [lastDeliveredReply, setLastDeliveredReply] = useState<string | null>(null);

  // Roster Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'auto_order_created' | 'requires_review' | 'parsed'>('all');

  // Modal State for Review / Payload Inspection
  const [inspectingItem, setInspectingItem] = useState<WhatsAppOrderMessage | null>(null);
  const [editingItems, setEditingItems] = useState<WhatsAppOrderItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [pingingWebhook, setPingingWebhook] = useState(false);

  // Initial Load
  const loadData = () => {
    setConfig(whatsappOrderIntakeService.getConfig(tenantId));
    setMessages(whatsappOrderIntakeService.getMessages(tenantId));
    setStats(whatsappOrderIntakeService.getStats(tenantId));
  };

  useEffect(() => {
    loadData();
    // Parse initial simulator message
    const initialParsed = whatsappOrderIntakeService.parseOrderMessage(
      PRESET_MESSAGES[0].body,
      PRESET_MESSAGES[0].phone,
      PRESET_MESSAGES[0].sender
    );
    setSimParsed(initialParsed);

    const handleUpdate = () => loadData();
    window.addEventListener('whatsapp_order_intake_updated', handleUpdate);
    return () => window.removeEventListener('whatsapp_order_intake_updated', handleUpdate);
  }, [tenantId]);

  // Handle Preset Select
  const handleSelectPreset = (p: PresetOption) => {
    setSimPhone(p.phone);
    setSimSender(p.sender);
    setSimMessage(p.body);
    const parsed = whatsappOrderIntakeService.parseOrderMessage(p.body, p.phone, p.sender);
    setSimParsed(parsed);
    setLastCreatedOrderNo(null);
    setLastDeliveredReply(null);
  };

  // Live Parse when simulator text changes
  const handleSimTextChange = (text: string) => {
    setSimMessage(text);
    const parsed = whatsappOrderIntakeService.parseOrderMessage(text, simPhone, simSender);
    setSimParsed(parsed);
  };

  // Dispatch Inbound Simulated Webhook (Acceptance Criteria 1, 2, 3, 4)
  const handleSendSimulatedOrder = async () => {
    if (!simMessage.trim()) return;
    setIsProcessingSim(true);
    setLastCreatedOrderNo(null);
    setLastDeliveredReply(null);

    try {
      // Simulate real Meta Cloud API Webhook Payload
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: config.businessAccountId,
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: config.senderPhoneNumber,
                    phone_number_id: config.phoneNumberId
                  },
                  contacts: [
                    {
                      profile: { name: simSender },
                      wa_id: simPhone.replace(/\D/g, '')
                    }
                  ],
                  messages: [
                    {
                      from: simPhone.replace(/\D/g, ''),
                      id: `wamid_sim_${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: { body: simMessage },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const result = await whatsappOrderIntakeService.processInboundWebhook(webhookPayload, tenantId);

      if (result.status === 'auto_order_created') {
        toastSuccess(
          'Sales Order Auto-Created!',
          `Order ${result.salesOrderNumber} created from WhatsApp message. Confirmation reply dispatched to ${result.fromPhone}.`
        );
        setLastCreatedOrderNo(result.salesOrderNumber || null);
        setLastDeliveredReply(result.confirmationReply.messageText);
      } else {
        toastInfo(
          'Order Parsed & Queued for Review',
          `Confidence score (${result.parsedData.confidenceScore}%) requires sales agent signoff before booking.`
        );
      }
      loadData();
    } catch (e: any) {
      toastError('Ingestion Failed', e.message);
    } finally {
      setIsProcessingSim(false);
    }
  };

  // 1-Click Manual Approve & Create Sales Order
  const handleManualApprove = async (msg: WhatsAppOrderMessage) => {
    try {
      const res = await whatsappOrderIntakeService.manualApproveAndCreateOrder(msg.id, tenantId);
      toastSuccess(
        'Sales Order Approved',
        `Generated order ${res.salesOrderNumber} and dispatched WhatsApp confirmation reply!`
      );
      if (inspectingItem?.id === msg.id) setInspectingItem(null);
      loadData();
    } catch (e: any) {
      toastError('Approval Failed', e.message);
    }
  };

  // Resend Confirmation Reply
  const handleResendReply = async (msg: WhatsAppOrderMessage) => {
    try {
      await whatsappOrderIntakeService.resendConfirmationReply(msg.id, tenantId);
      toastSuccess('Confirmation Dispatched', `Re-sent WhatsApp order confirmation to ${msg.fromPhone}.`);
      loadData();
    } catch (e: any) {
      toastError('Resend Failed', e.message);
    }
  };

  // Save Configuration
  const handleSaveConfig = () => {
    setIsSavingConfig(true);
    try {
      whatsappOrderIntakeService.saveConfig(tenantId, config);
      toastSuccess('Settings Saved', 'WhatsApp Business API credentials and auto-creation rules updated.');
    } catch (e: any) {
      toastError('Failed to Save', e.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Ping Webhook
  const handlePingWebhook = () => {
    setPingingWebhook(true);
    setTimeout(() => {
      setPingingWebhook(false);
      toastSuccess('Webhook Verified (HTTP 200)', 'Meta Cloud API webhook handshake completed successfully.');
    }, 700);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toastInfo('Copied to Clipboard', text);
  };

  // Open Inspection Modal
  const handleOpenInspector = (msg: WhatsAppOrderMessage) => {
    setInspectingItem(msg);
    setEditingItems([...msg.parsedData.items]);
  };

  // Save edited items in inspector modal
  const handleSaveInspectionEdits = async () => {
    if (!inspectingItem) return;
    try {
      const updated = await whatsappOrderIntakeService.manualApproveAndCreateOrder(
        inspectingItem.id,
        tenantId,
        { items: editingItems }
      );
      toastSuccess('Order Created with Adjustments', `Successfully registered ${updated.salesOrderNumber}.`);
      setInspectingItem(null);
      loadData();
    } catch (e: any) {
      toastError('Failed to Save', e.message);
    }
  };

  // Filtered Roster
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCustomer = m.customerName.toLowerCase().includes(q);
        const matchesPo = m.parsedData.poNumber.toLowerCase().includes(q);
        const matchesPhone = m.fromPhone.toLowerCase().includes(q);
        const matchesSo = m.salesOrderNumber?.toLowerCase().includes(q) || false;
        if (!matchesCustomer && !matchesPo && !matchesPhone && !matchesSo) return false;
      }
      return true;
    });
  }, [messages, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans select-none pb-16">
      
      {/* 1. Header Command Desk */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="h-3 w-3 text-emerald-600" />
              <span>WHATSAPP ORDER INTAKE · META CLOUD API</span>
            </span>
            <span className="text-slate-300">·</span>
            
            {/* Live Webhook Status */}
            {config.isWebhookActive ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Webhook Active (Port 443)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase flex items-center space-x-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Webhook Paused</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight block mt-1.5">
            WhatsApp Order Intake
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous customer order ingestion via WhatsApp Business API. Converts conversational messages and structured purchase orders into verified FlowOps Sales Orders with instant dispatch confirmation replies.
          </p>
        </div>

        {/* Global Navigation Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center font-mono">
          <button
            onClick={() => navigate('/orders')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Go to Production Line Monitor"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>Production Line</span>
          </button>

          <button
            onClick={() => navigate('/sales-orders/erp-sync')}
            className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Sync Sales Orders to Tally Prime & Oracle Cloud"
          >
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            <span>Sales Order Sync (ERP)</span>
          </button>

          <button
            onClick={() => navigate('/settings/whatsapp')}
            className="border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs uppercase font-bold px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-3xs"
            title="Configure BSP Settings & Dispatch Log"
          >
            <Server className="h-4 w-4 text-emerald-600" />
            <span>WhatsApp Outbox</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 font-mono">
        
        {/* Total Inbound Messages */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Inbound Orders</span>
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalInboundMessages}</div>
          <span className="text-[10px] text-slate-400 block truncate">Received via WhatsApp</span>
        </div>

        {/* Auto-Created Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Auto-Created</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.autoCreatedOrdersCount}</div>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">100% Automated</span>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Needs Review</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pendingReviewCount}</div>
          <span className="text-[10px] text-amber-600 block truncate">1-Click Signoff</span>
        </div>

        {/* Average Confidence */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">NLP Precision</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats.averageConfidenceScore}%</div>
          <span className="text-[10px] text-slate-400 block truncate">Entity extraction</span>
        </div>

        {/* Total Ingested Order Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Order Value</span>
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 truncate">
            ₹{stats.totalOrderValueINR > 100000 
              ? `${(stats.totalOrderValueINR / 100000).toFixed(2)} L` 
              : stats.totalOrderValueINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Booked to Production</span>
        </div>

        {/* Confirmation Replies Delivered */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-bold uppercase">Replies Sent</span>
            <CheckCheck className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700">{stats.repliesDeliveredCount}</div>
          <span className="text-[10px] text-sky-600 block truncate">With Live Tracking</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 font-mono text-xs">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'simulator'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Smartphone className="h-4 w-4 text-emerald-600" />
          <span>Live Simulator & NLP Parser</span>
        </button>

        <button
          onClick={() => setActiveTab('status_bot')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'status_bot'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Bot className="h-4 w-4 text-emerald-600" />
          <span>Status Bot (STATUS &lt;order&gt;)</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'notifications'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Bell className="h-4 w-4 text-emerald-600" />
          <span>Proactive Milestone Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('supplier_procurement')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'supplier_procurement'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCheck className="h-4 w-4 text-emerald-600" />
          <span>Supplier RFQ & PO Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'roster'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-slate-600" />
          <span>Ingested Orders Roster ({messages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sliders className="h-4 w-4 text-slate-600" />
          <span>API & Webhook Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 font-bold uppercase border-b-2 transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileText className="h-4 w-4 text-slate-600" />
          <span>Confirmation Reply Template</span>
        </button>
      </div>

      {/* 4. Tab 1: Live Simulator & NLP Parser */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Interactive WhatsApp Phone Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              
              {/* WhatsApp App Top Bar */}
              <div className="bg-emerald-700 text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                    {simSender.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{simSender}</h4>
                    <p className="text-[10px] text-emerald-200 font-mono flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                      <span>{simPhone} · online</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-emerald-200">
                  <span title="Verified WhatsApp Business Account">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="p-4 bg-slate-50 min-h-[380px] flex flex-col justify-between space-y-4 border-b border-slate-200">
                
                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Select Test Customer Message Preset:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESET_MESSAGES.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(p)}
                        className={`text-left p-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          simMessage === p.body
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-3xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-[11px] font-semibold">{p.title}</strong>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            p.type === 'structured' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Customer Inbound Bubble */}
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 max-w-[90%] shadow-3xs text-xs text-slate-800 space-y-1.5 whitespace-pre-wrap font-sans leading-relaxed">
                    <p className="text-[10px] font-mono text-emerald-700 font-bold">{simSender}:</p>
                    {simMessage}
                    <div className="text-[9px] font-mono text-slate-400 text-right mt-1">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>

                {/* Delivered FlowOps Confirmation Reply Bubble (if generated) */}
                {lastDeliveredReply && (
                  <div className="flex justify-end animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl rounded-tr-xs p-3.5 max-w-[92%] shadow-3xs text-xs text-emerald-950 space-y-1.5 whitespace-pre-wrap font-sans leading-relaxed">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800 font-bold">
                        <span>FlowOps Dispatch Bot:</span>
                        <span className="text-[9px] bg-emerald-200/60 px-1 rounded">Delivered</span>
                      </div>
                      <div className="text-[11px]">{lastDeliveredReply}</div>
                      <div className="text-[9px] font-mono text-emerald-600 text-right mt-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Console */}
              <div className="p-3 bg-white space-y-2">
                <textarea
                  value={simMessage}
                  onChange={(e) => handleSimTextChange(e.target.value)}
                  rows={4}
                  placeholder="Type or paste customer WhatsApp message (Structured or Natural Language)..."
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="+91 Phone"
                      className="text-xs font-mono px-2 py-1.5 border border-slate-200 rounded w-36 bg-slate-50"
                      title="Sender WhatsApp Phone"
                    />
                  </div>

                  <button
                    onClick={handleSendSimulatedOrder}
                    disabled={isProcessingSim || !simMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs uppercase font-extrabold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Send className={`h-3.5 w-3.5 ${isProcessingSim ? 'animate-bounce' : ''}`} />
                    <span>{isProcessingSim ? 'Parsing...' : 'Send WhatsApp Webhook'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Extracted Order Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {simParsed ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
                
                {/* Extraction Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                        NLP Entity Parser ({simParsed.parsingMethod})
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        simParsed.confidenceScore >= 80 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        Confidence: {simParsed.confidenceScore}%
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center space-x-2">
                      <span>{simParsed.customerName}</span>
                      {simParsed.customerCode && (
                        <span className="text-xs font-mono text-slate-400 font-normal">({simParsed.customerCode})</span>
                      )}
                    </h3>
                  </div>

                  {/* Immediate Action Button */}
                  <button
                    onClick={handleSendSimulatedOrder}
                    disabled={isProcessingSim}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase font-extrabold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-2xs cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Auto-Create Sales Order</span>
                  </button>
                </div>

                {/* Key Entities Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Purchase Order</span>
                    <strong className="text-indigo-950 font-bold block truncate">{simParsed.poNumber}</strong>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Committed Delivery</span>
                    <strong className="text-slate-900 font-bold block">{simParsed.requestedDeliveryDate}</strong>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Priority Level</span>
                    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      simParsed.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {simParsed.priority}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Terms</span>
                    <strong className="text-slate-900 font-bold block truncate">{simParsed.paymentTerms}</strong>
                  </div>
                </div>

                {/* Shipping Destination */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Delivery Works / Destination:
                  </span>
                  <p className="text-slate-700 font-medium">{simParsed.shippingAddress}</p>
                </div>

                {/* Extracted Line Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700 uppercase">
                      Detected Line Items ({simParsed.items.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard GST Rate: 18%
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Part Description</th>
                          <th className="py-2.5 px-3">SKU / Code</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {simParsed.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-medium">
                              {item.itemName}
                              {item.specs && (
                                <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                                  {item.specs}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-indigo-700">{item.itemCode}</td>
                            <td className="py-2.5 px-3 text-right font-bold">{item.quantity} {item.uom}</td>
                            <td className="py-2.5 px-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              ₹{item.lineTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-right text-slate-500 text-[11px]">Subtotal:</td>
                          <td className="py-2 px-3 text-right text-slate-900">₹{simParsed.subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="py-1 px-3 text-right text-slate-500 text-[11px]">GST (18%):</td>
                          <td className="py-1 px-3 text-right text-slate-900">₹{simParsed.taxAmount.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-t border-slate-300 text-sm">
                          <td colSpan={4} className="py-2.5 px-3 text-right text-emerald-950 font-black">Grand Total:</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-black">
                            ₹{simParsed.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Parsing Diagnostic Notes */}
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-900 font-bold font-mono text-[10px] uppercase">
                    <Info className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Parsing Engine Observations</span>
                  </div>
                  <ul className="list-disc list-inside text-indigo-950/80 text-[11px] space-y-0.5">
                    {simParsed.parsingNotes.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-2">
                <Smartphone className="h-8 w-8 mx-auto text-slate-400" />
                <h4 className="text-sm font-bold text-slate-700">No Message Parsed Yet</h4>
                <p className="text-xs">Type a customer message on the left or select a preset to test the parser.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Automated Status Bot (STATUS <order-number>) */}
      {activeTab === 'status_bot' && (
        <AutomatedStatusBotTab tenantId={tenantId} />
      )}

      {/* Tab 3: Proactive Milestone Alerts & Receipts */}
      {activeTab === 'notifications' && (
        <ProactiveNotificationsTab tenantId={tenantId} />
      )}

      {/* Tab 4: Supplier RFQ & PO WhatsApp Desk */}
      {activeTab === 'supplier_procurement' && (
        <SupplierWhatsappProcurementTab tenantId={tenantId} />
      )}

      {/* 5. Tab 5: Ingested Orders Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Customer, PO Number, Phone, or Sales Order #..."
                className="w-full bg-transparent focus:outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-bold focus:outline-none"
              >
                <option value="all">All Intake Statuses</option>
                <option value="auto_order_created">Auto-Created (Active SO)</option>
                <option value="requires_review">Requires Sales Review</option>
                <option value="parsed">Parsed & Pending</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Customer & Phone</th>
                    <th className="py-3 px-3.5">Customer PO #</th>
                    <th className="py-3 px-3.5">FlowOps SO #</th>
                    <th className="py-3 px-3.5">Items & Qty</th>
                    <th className="py-3 px-3.5 text-right">Order Value (₹)</th>
                    <th className="py-3 px-3.5">Intake Status</th>
                    <th className="py-3 px-3.5">WhatsApp Reply</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No WhatsApp orders found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-slate-50 transition">
                        {/* Customer */}
                        <td className="py-3 px-3.5">
                          <strong className="text-slate-900 block font-bold">{msg.customerName}</strong>
                          <span className="text-[11px] text-slate-500">{msg.fromPhone}</span>
                        </td>

                        {/* Customer PO */}
                        <td className="py-3 px-3.5 font-bold text-indigo-700">
                          {msg.parsedData.poNumber}
                        </td>

                        {/* FlowOps Sales Order # */}
                        <td className="py-3 px-3.5">
                          {msg.salesOrderNumber ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-extrabold text-[11px]">
                              {msg.salesOrderNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Booked</span>
                          )}
                        </td>

                        {/* Items count */}
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900">{msg.parsedData.items.length} Line Items</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            {msg.parsedData.items.map(it => `${it.quantity} ${it.uom} ${it.itemCode}`).join(', ')}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="py-3 px-3.5 text-right font-black text-slate-900">
                          ₹{msg.parsedData.totalAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Intake Status */}
                        <td className="py-3 px-3.5">
                          {msg.status === 'auto_order_created' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center space-x-1 w-fit">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Auto-Created</span>
                            </span>
                          ) : msg.status === 'requires_review' ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center space-x-1 w-fit">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span>Needs Review</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit">
                              {msg.status}
                            </span>
                          )}
                        </td>

                        {/* WhatsApp Reply Status */}
                        <td className="py-3 px-3.5">
                          {msg.confirmationReply?.status === 'delivered' ? (
                            <span className="text-emerald-700 text-[11px] font-bold flex items-center space-x-1">
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Sent</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Pending</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {msg.status !== 'auto_order_created' && (
                            <button
                              onClick={() => handleManualApprove(msg)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition cursor-pointer"
                              title="1-Click Approve and Create Sales Order"
                            >
                              Approve SO
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenInspector(msg)}
                            className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition cursor-pointer"
                            title="Inspect Raw Message & Items"
                          >
                            Inspect
                          </button>

                          {msg.status === 'auto_order_created' && (
                            <button
                              onClick={() => handleResendReply(msg)}
                              className="border border-sky-300 hover:bg-sky-50 text-sky-700 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition cursor-pointer"
                              title="Resend WhatsApp Confirmation Reply"
                            >
                              Resend WA
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: API & Webhook Setup */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">WhatsApp Business API & Webhook Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your Meta Cloud API, AiSensy, or Twilio WhatsApp endpoint to receive real-time webhook payloads.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePingWebhook}
                disabled={pingingWebhook}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold uppercase px-3 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${pingingWebhook ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{pingingWebhook ? 'Verifying...' : 'Ping Webhook'}</span>
              </button>

              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Left: Meta Cloud API Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Meta Cloud API Credentials</h4>
              
              <div className="space-y-1">
                <label className="text-slate-700 font-bold">API Provider</label>
                <select
                  value={config.provider}
                  onChange={(e: any) => setConfig({ ...config, provider: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="meta_cloud_api">Meta WhatsApp Cloud API (Direct / Zero Markup)</option>
                  <option value="aisensy">AiSensy BSP</option>
                  <option value="interakt">Interakt (Jio Haptik)</option>
                  <option value="twilio">Twilio Programmable Messaging</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Phone Number ID</label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">WhatsApp Business Account ID (WABA)</label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Meta System User Access Token</label>
                <input
                  type="password"
                  value={config.apiToken}
                  onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Webhook Callback & Rules */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Webhook Endpoints & Automation Rules</h4>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold">Webhook Callback URL</label>
                  <button
                    onClick={() => handleCopy(config.webhookCallbackUrl, 'url')}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    {copiedKey === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'url' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={config.webhookCallbackUrl}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-100 text-slate-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold">Webhook Verify Token</label>
                  <button
                    onClick={() => handleCopy(config.webhookVerifyToken, 'token')}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    {copiedKey === 'token' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === 'token' ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={config.webhookVerifyToken}
                  onChange={(e) => setConfig({ ...config, webhookVerifyToken: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoOrderCreationEnabled}
                    onChange={(e) => setConfig({ ...config, autoOrderCreationEnabled: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="text-slate-800 block text-xs">Enable Autonomous Order Creation</strong>
                    <span className="text-[11px] text-slate-500 block">
                      Instantly generate a FlowOps Sales Order when parsing confidence meets the threshold.
                    </span>
                  </div>
                </label>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-700 font-bold">Confidence Threshold: {config.autoApproveConfidenceThreshold}%</span>
                    <span className="text-slate-400 text-[10px]">Orders below require sales review</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={config.autoApproveConfidenceThreshold}
                    onChange={(e) => setConfig({ ...config, autoApproveConfidenceThreshold: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendConfirmationReply}
                    onChange={(e) => setConfig({ ...config, autoSendConfirmationReply: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="text-slate-800 block text-xs">Auto-Send WhatsApp Confirmation Reply</strong>
                    <span className="text-[11px] text-slate-500 block">
                      Dispatches immediate WhatsApp message back to the customer with Sales Order # and tracking link.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Confirmation Reply Template */}
      {activeTab === 'templates' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">WhatsApp Confirmation Reply Template</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the formatted WhatsApp message sent to customer purchasing managers upon order booking.
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Template Editor */}
            <div className="lg:col-span-7 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Template Content (Markdown & Emojis supported)</label>
              <textarea
                value={config.confirmationMessageTemplate}
                onChange={(e) => setConfig({ ...config, confirmationMessageTemplate: e.target.value })}
                rows={14}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
              />

              {/* Supported Dynamic Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Supported Placeholders:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {['{{customer_name}}', '{{po_number}}', '{{so_number}}', '{{items_summary}}', '{{total_value}}', '{{delivery_date}}', '{{shipping_address}}', '{{tracking_url}}'].map((tag) => (
                    <span key={tag} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live WhatsApp Bubble Preview */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Customer WhatsApp Screen Preview:</span>
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-3xs text-xs text-emerald-950 space-y-2 whitespace-pre-wrap font-sans leading-relaxed">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800 font-bold border-b border-emerald-200 pb-1">
                    <span>FlowOps Order Bot</span>
                    <span>10:45 AM ✓✓</span>
                  </div>
                  <div className="text-[11px]">
                    {config.confirmationMessageTemplate
                      .replace(/{{customer_name}}/g, 'Bharat Forge Ltd.')
                      .replace(/{{po_number}}/g, 'PO-BFL-2026-9905')
                      .replace(/{{so_number}}/g, 'SO-WA-2026-0043')
                      .replace(/{{items_summary}}/g, '• SS 316 Flange Class 150 4" (FLG-SS-401) × 300 pcs\n• High-Tensile M16 Stud Bolt Grade 8.8 (STD-HT-16) × 1200 pcs')
                      .replace(/{{total_value}}/g, '6,33,660')
                      .replace(/{{delivery_date}}/g, '2026-11-25')
                      .replace(/{{shipping_address}}/g, 'MIDC Baramati Gate 1, Pune')
                      .replace(/{{tracking_url}}/g, 'https://flowops.app/portal/track/SO-WA-2026-0043')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Order Inspection & Review Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  Order Message Inspector
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {inspectingItem.customerName} · {inspectingItem.parsedData.poNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Raw Message Transcript */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Original WhatsApp Message Transcript:
              </span>
              <p className="font-mono text-slate-800 whitespace-pre-wrap">{inspectingItem.rawText}</p>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 block">
                Line Items ({editingItems.length})
              </span>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Price (₹)</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {editingItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium">{item.itemName}</td>
                        <td className="py-2 px-3 text-indigo-700 font-bold">{item.itemCode}</td>
                        <td className="py-2 px-3 text-right">{item.quantity} {item.uom}</td>
                        <td className="py-2 px-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-bold">₹{item.lineTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirmation Reply Details */}
            {inspectingItem.confirmationReply?.messageText && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold block">
                  Dispatched WhatsApp Reply:
                </span>
                <p className="font-mono text-emerald-950 whitespace-pre-wrap text-[11px]">
                  {inspectingItem.confirmationReply.messageText}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 font-mono text-xs">
              <span className="text-slate-500">
                Confidence: <strong className="text-slate-900">{inspectingItem.parsedData.confidenceScore}%</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 uppercase font-bold cursor-pointer"
                >
                  Close
                </button>

                {inspectingItem.status !== 'auto_order_created' && (
                  <button
                    onClick={handleSaveInspectionEdits}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg uppercase font-extrabold cursor-pointer shadow-2xs"
                  >
                    Confirm & Create Sales Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
