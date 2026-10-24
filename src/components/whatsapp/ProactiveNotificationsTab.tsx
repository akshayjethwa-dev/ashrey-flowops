// src/components/whatsapp/ProactiveNotificationsTab.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProactiveMilestone, 
  MessageReceiptStatus, 
  WhatsAppNotificationTemplate, 
  ProactiveNotificationLog, 
  ProactiveNotificationConfig, 
  ProactiveNotificationStats, 
  MilestoneEventPayload 
} from '../../types/whatsappProactiveNotifications';
import { 
  proactiveNotificationService, 
  DEFAULT_TEMPLATES 
} from '../../services/proactiveNotificationService';
import { useToast } from '../../context/ToastContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  Send, 
  Play, 
  RefreshCw, 
  Filter, 
  Search, 
  Settings, 
  Sliders, 
  FileText, 
  Smartphone, 
  ShieldCheck, 
  Truck, 
  Package, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  ExternalLink, 
  Copy, 
  Eye, 
  ChevronRight, 
  ArrowUpRight, 
  AlertCircle, 
  Save, 
  RotateCcw,
  Activity,
  Layers,
  Wrench,
  Award,
  Radio,
  User,
  Phone,
  Calendar,
  X
} from 'lucide-react';

interface ProactiveNotificationsTabProps {
  tenantId: string;
}

const MILESTONES_META: Record<ProactiveMilestone, {
  label: string;
  shortDesc: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}> = {
  order_confirmed: {
    label: 'Order Confirmed',
    shortDesc: 'Triggered when PO is scheduled & confirmed into production',
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    accentColor: '#10b981'
  },
  production_started: {
    label: 'Production Started',
    shortDesc: 'Triggered when batch moves to active CNC/molding line station',
    icon: Wrench,
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-200',
    accentColor: '#0284c7'
  },
  qc_passed: {
    label: 'QC Passed (FQC / CoC)',
    shortDesc: 'Triggered upon final quality sign-off & Certificate of Conformance',
    icon: Award,
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    accentColor: '#9333ea'
  },
  dispatched: {
    label: 'Consignment Dispatched',
    shortDesc: 'Triggered when LR issued, lorry loaded & vehicle departs factory',
    icon: Truck,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    accentColor: '#d97706'
  },
  delivered: {
    label: 'Consignment Delivered',
    shortDesc: 'Triggered when customer signs e-PoD gate inward delivery slip',
    icon: Package,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderColor: 'border-teal-200',
    accentColor: '#0d9488'
  }
};

const SAMPLE_ORDERS = [
  {
    orderId: 'ord-101',
    orderNumber: 'PO-BFL-2026-9905',
    customerName: 'Bharat Forge Ltd',
    phone: '+91 98201 12345',
    productSummary: 'SS 316 Flange Class 150 (300 pcs)',
    totalAmount: '4,52,000',
    stationName: 'CNC Flange Turning Cell 01',
    stageName: 'Milling & Facing',
    qcScore: 'Passed (Runout <0.01mm)',
    inspectorName: 'Suresh Patil (Lead QA)',
    cocNumber: 'COC-2026-9905',
    transporter: 'VRL Logistics',
    lrNumber: 'VRL-PUN-88412',
    vehicleNumber: 'MH-12-QW-9912',
    expectedDelivery: '25-Nov-2026',
    receivedBy: 'Ramesh Sawant (Stores In-Charge)',
    deliveryRemarks: 'Seal Intact, 300 pcs inwarded'
  },
  {
    orderId: 'ord-102',
    orderNumber: 'PO-TATA-2026-902',
    customerName: 'Tata Motors Precision CVBU',
    phone: '+91 98765 43210',
    productSummary: '500 pcs CNC Bushing BS-4022',
    totalAmount: '2,75,000',
    stationName: 'CNC Milling Center 02',
    stageName: 'Bushing Turn & Bore',
    qcScore: '100% Zero Defect',
    inspectorName: 'Anand Shinde',
    cocNumber: 'COC-2026-9020',
    transporter: 'Gati KWE Surface',
    lrNumber: 'GATI-EXP-44012',
    vehicleNumber: 'MH-14-AZ-2001',
    expectedDelivery: '02-Dec-2026',
    receivedBy: 'Anil Kumar (Gate 2)',
    deliveryRemarks: 'Verified and signed'
  },
  {
    orderId: 'ord-103',
    orderNumber: 'PO-KOEL-4480',
    customerName: 'Kirloskar Oil Engines Ltd',
    phone: '+91 98111 22334',
    productSummary: '600 pcs Flywheel Ring Gear RG-320',
    totalAmount: '6,90,000',
    stationName: 'Induction Hardening Cell',
    stageName: 'Gear Hobbing & Heat Treatment',
    qcScore: 'Passed Metallurgy Check',
    inspectorName: 'R. K. Gupta',
    cocNumber: 'COC-2026-4480',
    transporter: 'SafeXpress Supply Chain',
    lrNumber: 'SAFE-MH-9910',
    vehicleNumber: 'MH-09-BC-4480',
    expectedDelivery: '10-Dec-2026',
    receivedBy: 'Rajesh Deshmukh',
    deliveryRemarks: 'Unloaded safely at Kolhapur plant'
  }
];

export const ProactiveNotificationsTab: React.FC<ProactiveNotificationsTabProps> = ({ tenantId }) => {
  const { toastSuccess, toastInfo, toastError } = useToast();

  // State
  const [logs, setLogs] = useState<ProactiveNotificationLog[]>([]);
  const [templates, setTemplates] = useState<WhatsAppNotificationTemplate[]>([]);
  const [config, setConfig] = useState<ProactiveNotificationConfig>(proactiveNotificationService.getConfig(tenantId));
  const [stats, setStats] = useState<ProactiveNotificationStats>(proactiveNotificationService.getStats(tenantId));
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'simulator' | 'journal' | 'templates' | 'policy'>('events');

  // Filter state for journal
  const [filterMilestone, setFilterMilestone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator Form State
  const [selectedMilestone, setSelectedMilestone] = useState<ProactiveMilestone>('order_confirmed');
  const [selectedOrderIdx, setSelectedOrderIdx] = useState<number>(0);
  const [simCustomerName, setSimCustomerName] = useState(SAMPLE_ORDERS[0].customerName);
  const [simPhone, setSimPhone] = useState(SAMPLE_ORDERS[0].phone);
  const [simOrderNumber, setSimOrderNumber] = useState(SAMPLE_ORDERS[0].orderNumber);
  const [simProductSummary, setSimProductSummary] = useState(SAMPLE_ORDERS[0].productSummary);
  const [simStationName, setSimStationName] = useState(SAMPLE_ORDERS[0].stationName);
  const [simStageName, setSimStageName] = useState(SAMPLE_ORDERS[0].stageName);
  const [simQcScore, setSimQcScore] = useState(SAMPLE_ORDERS[0].qcScore);
  const [simInspector, setSimInspector] = useState(SAMPLE_ORDERS[0].inspectorName);
  const [simTransporter, setSimTransporter] = useState(SAMPLE_ORDERS[0].transporter);
  const [simLrNumber, setSimLrNumber] = useState(SAMPLE_ORDERS[0].lrNumber);
  const [simVehicle, setSimVehicle] = useState(SAMPLE_ORDERS[0].vehicleNumber);
  const [simExpectedDelivery, setSimExpectedDelivery] = useState(SAMPLE_ORDERS[0].expectedDelivery);
  const [simReceivedBy, setSimReceivedBy] = useState(SAMPLE_ORDERS[0].receivedBy);
  const [isFiringSimulator, setIsFiringSimulator] = useState(false);
  const [lastFiredLog, setLastFiredLog] = useState<ProactiveNotificationLog | null>(null);

  // Template Editor State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-order-confirmed-en');
  const [editedBody, setEditedBody] = useState<string>('');
  const [editedHeader, setEditedHeader] = useState<string>('');
  const [editedFooter, setEditedFooter] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppNotificationTemplate | null>(null);

  // Modal State for viewing raw payload
  const [viewLogModal, setViewLogModal] = useState<ProactiveNotificationLog | null>(null);

  // Load data
  const refreshData = () => {
    const currentLogs = proactiveNotificationService.getLogs(tenantId);
    setLogs(currentLogs);
    setTemplates(proactiveNotificationService.getTemplates(tenantId));
    setConfig(proactiveNotificationService.getConfig(tenantId));
    setStats(proactiveNotificationService.getStats(tenantId));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      // Periodic refresh to pick up receipt status transitions (delivered -> read)
      refreshData();
    }, 2000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Update simulator fields when sample order changes
  const handleSelectSampleOrder = (idx: number) => {
    setSelectedOrderIdx(idx);
    const ord = SAMPLE_ORDERS[idx];
    setSimCustomerName(ord.customerName);
    setSimPhone(ord.phone);
    setSimOrderNumber(ord.orderNumber);
    setSimProductSummary(ord.productSummary);
    setSimStationName(ord.stationName);
    setSimStageName(ord.stageName);
    setSimQcScore(ord.qcScore);
    setSimInspector(ord.inspectorName);
    setSimTransporter(ord.transporter);
    setSimLrNumber(ord.lrNumber);
    setSimVehicle(ord.vehicleNumber);
    setSimExpectedDelivery(ord.expectedDelivery);
    setSimReceivedBy(ord.receivedBy);
  };

  // Sync template editor when selection changes
  useEffect(() => {
    const tmpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (tmpl) {
      setEditingTemplate(tmpl);
      setEditedBody(tmpl.bodyTemplate);
      setEditedHeader(tmpl.headerText || '');
      setEditedFooter(tmpl.footerText || '');
    }
  }, [selectedTemplateId, templates]);

  // Toggle milestone in config
  const handleToggleMilestone = (milestone: ProactiveMilestone) => {
    const currentStatus = config.enabledMilestones[milestone] ?? true;
    const updated = proactiveNotificationService.saveConfig(tenantId, {
      enabledMilestones: {
        ...config.enabledMilestones,
        [milestone]: !currentStatus
      }
    });
    setConfig(updated);
    toastInfo(`Milestone notification "${MILESTONES_META[milestone].label}" ${!currentStatus ? 'Enabled' : 'Disabled'}.`);
  };

  // Test Fire Simulator Notification
  const handleFireSimulator = async () => {
    setIsFiringSimulator(true);
    try {
      const payload: MilestoneEventPayload = {
        tenantId,
        milestone: selectedMilestone,
        orderId: SAMPLE_ORDERS[selectedOrderIdx].orderId,
        orderNumber: simOrderNumber,
        customerName: simCustomerName,
        recipientPhone: simPhone,
        parameters: {
          productSummary: simProductSummary,
          stationName: simStationName,
          stageName: simStageName,
          qcScore: simQcScore,
          inspectorName: simInspector,
          cocNumber: `COC-2026-${simOrderNumber.replace(/\D/g, '') || '9905'}`,
          transporter: simTransporter,
          lrNumber: simLrNumber,
          vehicleNumber: simVehicle,
          expectedDelivery: simExpectedDelivery,
          deliveryDate: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          receivedBy: simReceivedBy,
          deliveryRemarks: 'Seal verified intact, consignment signed off',
          companyName: 'Ashrey FlowOps Ltd',
          totalAmount: SAMPLE_ORDERS[selectedOrderIdx].totalAmount,
          trackingUrl: typeof window !== 'undefined' ? `${window.location.origin}/track/${simOrderNumber}` : `https://flowops.internal/track/${simOrderNumber}`
        },
        sourceTrigger: 'manual_test'
      };

      const newLog = await proactiveNotificationService.triggerMilestoneNotification(payload);
      if (newLog) {
        setLastFiredLog(newLog);
        refreshData();
        toastSuccess(`WhatsApp milestone alert "${MILESTONES_META[selectedMilestone].label}" dispatched to ${simCustomerName}!`);
      } else {
        toastError(`Could not fire: Milestone "${MILESTONES_META[selectedMilestone].label}" is disabled in settings.`);
      }
    } catch (e: any) {
      toastError(e.message || 'Error triggering notification.');
    } finally {
      setIsFiringSimulator(false);
    }
  };

  // Simulate Webhook Receipt Status Update
  const handleSimulateWebhook = (wamid: string, targetStatus: 'sent' | 'delivered' | 'read' | 'failed') => {
    const res = proactiveNotificationService.processReceiptWebhook(
      tenantId,
      wamid,
      targetStatus,
      new Date().toISOString(),
      targetStatus === 'failed' ? 'ERR_INVALID_DESTINATION_NUMBER_OR_OPTED_OUT' : undefined
    );
    if (res.success) {
      refreshData();
      if (lastFiredLog && lastFiredLog.wamid === wamid) {
        setLastFiredLog(res.log || null);
      }
      toastSuccess(`Webhook processed: Message marked as "${targetStatus.toUpperCase()}".`);
    } else {
      toastError('Could not locate message record for webhook update.');
    }
  };

  // Save template edit
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    const updated: WhatsAppNotificationTemplate = {
      ...editingTemplate,
      bodyTemplate: editedBody,
      headerText: editedHeader,
      footerText: editedFooter
    };
    const newTemplates = proactiveNotificationService.saveTemplate(tenantId, updated);
    setTemplates(newTemplates);
    setEditingTemplate(updated);
    toastSuccess(`Template "${updated.name}" saved successfully!`);
  };

  // Reset templates
  const handleResetTemplates = () => {
    const res = proactiveNotificationService.resetTemplates(tenantId);
    setTemplates(res);
    toastInfo('All WhatsApp milestone templates reset to factory default standards.');
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchMilestone = filterMilestone === 'all' || log.milestone === filterMilestone;
      const matchStatus = filterStatus === 'all' || log.receiptStatus === filterStatus;
      const matchSearch = !searchQuery || 
        log.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.recipientPhone.includes(searchQuery) ||
        log.renderedMessage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMilestone && matchStatus && matchSearch;
    });
  }, [logs, filterMilestone, filterStatus, searchQuery]);

  // Live Preview Message for simulator
  const simPreviewMessage = useMemo(() => {
    const template = proactiveNotificationService.getActiveTemplateForMilestone(selectedMilestone, tenantId, config.defaultLanguage);
    return proactiveNotificationService.renderTemplate(template, {
      customerName: simCustomerName,
      orderNumber: simOrderNumber,
      productSummary: simProductSummary,
      stationName: simStationName,
      stageName: simStageName,
      qcScore: simQcScore,
      inspectorName: simInspector,
      cocNumber: `COC-2026-${simOrderNumber.replace(/\D/g, '') || '9905'}`,
      transporter: simTransporter,
      lrNumber: simLrNumber,
      vehicleNumber: simVehicle,
      expectedDelivery: simExpectedDelivery,
      deliveryDate: 'Today at 15:30 PM',
      receivedBy: simReceivedBy,
      deliveryRemarks: 'Seal Intact, verified',
      companyName: 'Ashrey FlowOps Ltd',
      totalAmount: SAMPLE_ORDERS[selectedOrderIdx].totalAmount,
      trackingUrl: `https://flowops.internal/track/${simOrderNumber}`
    });
  }, [selectedMilestone, simCustomerName, simOrderNumber, simProductSummary, simStationName, simStageName, simQcScore, simInspector, simTransporter, simLrNumber, simVehicle, simExpectedDelivery, simReceivedBy, selectedOrderIdx, config.defaultLanguage]);

  return (
    <div className="space-y-6">

      {/* 1. TOP HERO BENTO WITH REAL-TIME RECEIPT KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Milestone Dispatches</span>
            <Send className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.totalSent}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span>Event-driven triggers active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Delivery Rate</span>
            <CheckCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">{stats.deliveryRate}%</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-mono">
            {stats.totalDelivered} of {stats.totalSent} delivered
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Read Rate (Blue Ticks)</span>
            <CheckCheck className="h-4 w-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-700 font-mono">{stats.readRate}%</div>
          <div className="text-[10px] text-sky-600 mt-1 font-mono">
            {stats.totalRead} customer read receipts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Median Read Time</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {Math.floor(stats.avgTimeToReadSeconds / 60)}m {stats.avgTimeToReadSeconds % 60}s
          </div>
          <div className="text-[10px] text-slate-500 mt-1">High customer responsiveness</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Failed / Undelivered</span>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats.totalFailed}</div>
          <div className="text-[10px] text-emerald-600 mt-1">0 blocked numbers</div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'events'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Milestone Triggers</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Live Chat & Receipt Simulator</span>
          </button>

          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'journal'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Outbox & Receipt Journal</span>
            <span className="bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded text-[10px]">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'templates'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Template Engine</span>
          </button>

          <button
            onClick={() => setActiveSubTab('policy')}
            className={`px-3.5 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'policy'
                ? 'border-emerald-600 text-emerald-950 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Webhook & Receipt Policy</span>
          </button>
        </div>

        <button
          onClick={refreshData}
          className="text-slate-400 hover:text-slate-700 p-2 rounded hover:bg-slate-100 transition cursor-pointer"
          title="Refresh All Logs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3. SUBTAB 1: MILESTONE TRIGGERS GRID */}
      {activeSubTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Automatic Proactive Outbound Messaging</span>
              </div>
              <h3 className="text-lg font-bold">5 Key Manufacturing Milestones</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Customers automatically receive verified WhatsApp Business template messages whenever their orders hit crucial shop floor or logistics stages. Delivery and read receipts are captured in real-time.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('simulator')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-lg flex items-center space-x-2 transition cursor-pointer shrink-0"
            >
              <Smartphone className="h-4 w-4" />
              <span>Launch Simulator</span>
            </button>
          </div>

          {/* Cards for the 5 Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {(['order_confirmed', 'production_started', 'qc_passed', 'dispatched', 'delivered'] as ProactiveMilestone[]).map((ms, index) => {
              const meta = MILESTONES_META[ms];
              const isEnabled = config.enabledMilestones[ms] ?? true;
              const count = stats.byMilestone[ms] || 0;
              const tmpl = templates.find(t => t.milestone === ms && t.isActive) || DEFAULT_TEMPLATES.find(t => t.milestone === ms);

              return (
                <div 
                  key={ms}
                  className={`bg-white border rounded-xl p-4 shadow-3xs flex flex-col justify-between transition-all ${
                    isEnabled ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${meta.badgeBg}`}>
                        <meta.icon className={`h-4.5 w-4.5 ${meta.badgeText}`} />
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Step 0{index + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{meta.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{meta.shortDesc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Trigger Count:</span>
                        <span className="font-bold text-slate-800">{count} sent</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Template:</span>
                        <span className="font-bold text-emerald-700 truncate max-w-[100px]" title={tmpl?.code}>
                          {tmpl?.code || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleMilestone(ms)}
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded transition cursor-pointer ${
                        isEnabled 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMilestone(ms);
                        setActiveSubTab('simulator');
                      }}
                      className="text-[10px] font-mono text-sky-600 hover:text-sky-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>Test Fire</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Workflow Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>Event-Driven Lifecycle Integration</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs text-slate-600">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>1. PO Acceptance</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fired immediately when Sales approves an RFQ or when PO is created via WhatsApp intake.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>2. Station Advance</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fired when shopfloor supervisor updates a lot stage on the Production Board or Job Detail.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>3. FQC Sign-off</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fired when QA Manager signs off the Final Quality Inspection with Certificate of Conformance.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>4. Gate Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fired when Dispatch Manager assigns Lorry Receipt (LR) number, driver phone, and vehicle leaves midc gate.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>5. e-PoD Sign-off</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fired when consignee receives the shipment, signs delivery confirmation, and attaches gate receipt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTAB 2: INTERACTIVE LIVE SIMULATOR & RECEIPT TIMELINE */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form: Milestone & Parameter Configuration (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">Event Trigger & Notification Tester</h3>
                  <p className="text-xs text-slate-500">Simulate customer message dispatch and observe live WhatsApp receipt updates.</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  Live Engine
                </span>
              </div>

              {/* Sample Order Preset Chips */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1.5">
                  Load Live Customer & Order Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_ORDERS.map((ord, i) => (
                    <button
                      key={ord.orderId}
                      onClick={() => handleSelectSampleOrder(i)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                        selectedOrderIdx === i 
                          ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600' 
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 truncate">{ord.customerName}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{ord.orderNumber}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone Selector */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1.5">
                  Milestone Trigger Event
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(['order_confirmed', 'production_started', 'qc_passed', 'dispatched', 'delivered'] as ProactiveMilestone[]).map(ms => {
                    const meta = MILESTONES_META[ms];
                    return (
                      <button
                        key={ms}
                        onClick={() => setSelectedMilestone(ms)}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                          selectedMilestone === ms 
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                        }`}
                      >
                        <meta.icon className="h-4 w-4" style={{ color: meta.accentColor }} />
                        <span className="text-[10px] leading-tight">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={simCustomerName}
                    onChange={e => setSimCustomerName(e.target.value)}
                    className="w-full text-xs font-sans border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={e => setSimPhone(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    Order Number (PO#)
                  </label>
                  <input
                    type="text"
                    value={simOrderNumber}
                    onChange={e => setSimOrderNumber(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                    Product Summary
                  </label>
                  <input
                    type="text"
                    value={simProductSummary}
                    onChange={e => setSimProductSummary(e.target.value)}
                    className="w-full text-xs font-sans border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Milestone-specific fields */}
                {selectedMilestone === 'production_started' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Station Name</label>
                      <input
                        type="text"
                        value={simStationName}
                        onChange={e => setSimStationName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Operation Stage</label>
                      <input
                        type="text"
                        value={simStageName}
                        onChange={e => setSimStageName(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}

                {selectedMilestone === 'qc_passed' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Inspection Result</label>
                      <input
                        type="text"
                        value={simQcScore}
                        onChange={e => setSimQcScore(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Lead QA Authority</label>
                      <input
                        type="text"
                        value={simInspector}
                        onChange={e => setSimInspector(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}

                {selectedMilestone === 'dispatched' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Transporter Agency</label>
                      <input
                        type="text"
                        value={simTransporter}
                        onChange={e => setSimTransporter(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Lorry Receipt (LR#)</label>
                      <input
                        type="text"
                        value={simLrNumber}
                        onChange={e => setSimLrNumber(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Vehicle Plate</label>
                      <input
                        type="text"
                        value={simVehicle}
                        onChange={e => setSimVehicle(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Expected Delivery</label>
                      <input
                        type="text"
                        value={simExpectedDelivery}
                        onChange={e => setSimExpectedDelivery(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}

                {selectedMilestone === 'delivered' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Receiver Name / Gate Authority</label>
                      <input
                        type="text"
                        value={simReceivedBy}
                        onChange={e => setSimReceivedBy(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Delivery Timestamp</label>
                      <input
                        type="text"
                        disabled
                        value="Current Timestamp (Live)"
                        className="w-full text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Fire Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Target: <span className="font-mono font-bold text-slate-800">{simPhone}</span>
                </div>
                <button
                  onClick={handleFireSimulator}
                  disabled={isFiringSimulator}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase px-5 py-2.5 rounded-lg flex items-center space-x-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isFiringSimulator ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching WhatsApp Alert...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Trigger Milestone Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Receipt Lifecycle Progression Card (if fired) */}
            {lastFiredLog && (
              <div className="bg-white border border-emerald-300 rounded-xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h4 className="text-xs font-bold text-slate-900 font-mono">Live WhatsApp Receipt Lifecycle</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={lastFiredLog.wamid}>
                    {lastFiredLog.wamid}
                  </span>
                </div>

                {/* Progress Steps: Queued -> Sent -> Delivered -> Read */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase">1. Queued</div>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">
                      {new Date(lastFiredLog.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center justify-center space-x-1 text-[10px] font-mono font-bold text-emerald-800 uppercase">
                      <Check className="h-3.5 w-3.5 text-slate-400" />
                      <span>2. Sent</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">
                      {lastFiredLog.sentAt ? new Date(lastFiredLog.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border transition-all ${
                    lastFiredLog.receiptStatus === 'delivered' || lastFiredLog.receiptStatus === 'read'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-center space-x-1 text-[10px] font-mono font-bold uppercase">
                      <CheckCheck className={`h-3.5 w-3.5 ${lastFiredLog.receiptStatus === 'delivered' || lastFiredLog.receiptStatus === 'read' ? 'text-slate-500' : 'text-slate-300'}`} />
                      <span>3. Delivered</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">
                      {lastFiredLog.deliveredAt ? new Date(lastFiredLog.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'In-transit...'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border transition-all ${
                    lastFiredLog.receiptStatus === 'read'
                      ? 'bg-sky-50 border-sky-300 text-sky-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-center space-x-1 text-[10px] font-mono font-bold uppercase">
                      <CheckCheck className={`h-3.5 w-3.5 ${lastFiredLog.receiptStatus === 'read' ? 'text-sky-500' : 'text-slate-300'}`} />
                      <span>4. Read</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">
                      {lastFiredLog.readAt ? new Date(lastFiredLog.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Awaiting read...'}
                    </div>
                  </div>
                </div>

                {/* Direct Simulation Webhook Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">Simulate Meta Webhook:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSimulateWebhook(lastFiredLog.wamid, 'delivered')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
                    >
                      Force "Delivered"
                    </button>
                    <button
                      onClick={() => handleSimulateWebhook(lastFiredLog.wamid, 'read')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded border border-sky-200 cursor-pointer"
                    >
                      Force "Read" (Blue Ticks)
                    </button>
                    <button
                      onClick={() => handleSimulateWebhook(lastFiredLog.wamid, 'failed')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 cursor-pointer"
                    >
                      Force "Failed"
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Realistic WhatsApp Mobile Phone Simulator (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Phone Speaker & Camera Notch */}
              <div className="flex justify-center mb-2">
                <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                  <div className="w-8 h-1.5 rounded-full bg-slate-800"></div>
                </div>
              </div>

              {/* WhatsApp Screen Body */}
              <div className="bg-[#e5ddd5] rounded-[24px] overflow-hidden flex flex-col h-[560px] shadow-inner relative">
                
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075e54] text-white p-3 flex items-center justify-between shrink-0 shadow">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 border border-white/20 flex items-center justify-center font-bold text-xs">
                      AF
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1">
                        <span>Ashrey FlowOps</span>
                        <ShieldCheck className="h-3 w-3 text-emerald-300" />
                      </div>
                      <div className="text-[9px] text-emerald-200">Official Business Account</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded font-mono">Verified</span>
                </div>

                {/* WhatsApp Chat Messages Stream */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
                  
                  {/* Encryption Notice */}
                  <div className="flex justify-center">
                    <div className="bg-[#fef8b8] text-amber-950 text-[9px] px-2.5 py-1 rounded shadow-3xs max-w-[240px] text-center leading-tight">
                      🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
                    </div>
                  </div>

                  {/* Active Message Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-white rounded-lg rounded-tr-none p-3 shadow max-w-[90%] text-xs space-y-2 border border-slate-200/40">
                      
                      {/* Template Header if present */}
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-100 pb-1">
                        {MILESTONES_META[selectedMilestone].label}
                      </div>

                      {/* Formatted Message Body with Markdown */}
                      <div className="text-[11px] text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                        {simPreviewMessage}
                      </div>

                      {/* Interactive Buttons Preview */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="w-full text-center py-1 bg-slate-50 border border-slate-200 text-sky-700 text-[10px] font-bold rounded flex items-center justify-center space-x-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>Track Live Consignment</span>
                        </div>
                        <div className="w-full text-center py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded">
                          Reply: STATUS {simOrderNumber}
                        </div>
                      </div>

                      {/* Timestamp & Delivery/Read Receipt Ticks */}
                      <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 font-mono pt-1">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {lastFiredLog?.receiptStatus === 'read' ? (
                          <span title="Read (Double Blue Ticks)"><CheckCheck className="h-3.5 w-3.5 text-sky-500" /></span>
                        ) : lastFiredLog?.receiptStatus === 'delivered' ? (
                          <span title="Delivered (Double Grey Ticks)"><CheckCheck className="h-3.5 w-3.5 text-slate-400" /></span>
                        ) : lastFiredLog?.receiptStatus === 'failed' ? (
                          <span title="Failed"><AlertCircle className="h-3.5 w-3.5 text-red-500" /></span>
                        ) : (
                          <span title="Sent (Single Tick)"><Check className="h-3.5 w-3.5 text-slate-400" /></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Chat Input Footer */}
                <div className="bg-[#f0f2f5] p-2 flex items-center space-x-2 border-t border-slate-200 shrink-0">
                  <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                    Type a message...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                </div>

              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-2 text-center">
              Real-time BSP Meta Cloud API Simulation
            </p>
          </div>
        </div>
      )}

      {/* 5. SUBTAB 3: OUTBOX & RECEIPT JOURNAL (AUDIT TRAIL) */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-3xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order #, customer, phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg w-56 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Milestone Filter */}
              <select
                value={filterMilestone}
                onChange={e => setFilterMilestone(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Milestones</option>
                <option value="order_confirmed">Order Confirmed</option>
                <option value="production_started">Production Started</option>
                <option value="qc_passed">QC Passed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="all">All Receipts</option>
                <option value="read">Read (Blue Ticks)</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing <span className="font-bold text-slate-900">{filteredLogs.length}</span> of {logs.length} milestone logs
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Milestone</th>
                    <th className="py-2.5 px-3">Order # & Customer</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Sent At</th>
                    <th className="py-2.5 px-3">Delivered</th>
                    <th className="py-2.5 px-3">Read At</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No milestone notifications match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const meta = MILESTONES_META[log.milestone];

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          {/* Status with Icons */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              {log.receiptStatus === 'read' ? (
                                <span className="flex items-center space-x-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                  <CheckCheck className="h-3 w-3 text-sky-500" />
                                  <span>READ</span>
                                </span>
                              ) : log.receiptStatus === 'delivered' ? (
                                <span className="flex items-center space-x-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                  <CheckCheck className="h-3 w-3 text-slate-500" />
                                  <span>DELIVERED</span>
                                </span>
                              ) : log.receiptStatus === 'failed' ? (
                                <span className="flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  <span>FAILED</span>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px]">
                                  <Check className="h-3 w-3 text-slate-400" />
                                  <span>SENT</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Milestone */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${meta?.badgeBg} ${meta?.badgeText}`}>
                              {meta && <meta.icon className="h-3 w-3" />}
                              <span>{meta?.label || log.milestone}</span>
                            </span>
                          </td>

                          {/* Order & Customer */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 font-mono text-[11px]">{log.orderNumber}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{log.customerName}</div>
                          </td>

                          {/* Phone */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {log.recipientPhone}
                          </td>

                          {/* Sent At */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono text-slate-500">
                            {log.sentAt ? new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>

                          {/* Delivered At */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono text-slate-500">
                            {log.deliveredAt ? new Date(log.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>

                          {/* Read At */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-[10px] font-mono text-sky-700">
                            {log.readAt ? new Date(log.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => setViewLogModal(log)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                                title="View Message Payload"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              
                              {log.receiptStatus !== 'read' && (
                                <button
                                  onClick={() => handleSimulateWebhook(log.wamid, 'read')}
                                  className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 cursor-pointer"
                                  title="Simulate customer reading message"
                                >
                                  Read Webhook
                                </button>
                              )}
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

      {/* 6. SUBTAB 4: TEMPLATE ENGINE & VARIABLE CUSTOMIZER */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Template Selector & Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp Template Editor</h3>
                  <p className="text-xs text-slate-500">Customize WhatsApp Business registered message templates per milestone.</p>
                </div>
                <button
                  onClick={handleResetTemplates}
                  className="text-xs font-mono text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Select Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-2 font-mono bg-white"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - [{t.language.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Header Text */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Header Text (Optional)
                </label>
                <input
                  type="text"
                  value={editedHeader}
                  onChange={e => setEditedHeader(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  placeholder="e.g. 🎉 ORDER CONFIRMED"
                />
              </div>

              {/* Body Template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Message Body (WhatsApp Markdown Supported)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Use {'{{variable}}'}</span>
                </div>
                <textarea
                  rows={8}
                  value={editedBody}
                  onChange={e => setEditedBody(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded p-2.5 focus:outline-none focus:border-emerald-600 leading-relaxed"
                />
              </div>

              {/* Available Variable Chips */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">
                  Insert Variables (Click to copy)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'customerName',
                    'orderNumber',
                    'productSummary',
                    'stationName',
                    'stageName',
                    'qcScore',
                    'inspectorName',
                    'cocNumber',
                    'transporter',
                    'lrNumber',
                    'vehicleNumber',
                    'expectedDelivery',
                    'receivedBy',
                    'deliveryRemarks',
                    'companyName',
                    'trackingUrl'
                  ].map(v => (
                    <button
                      key={v}
                      onClick={() => {
                        setEditedBody(prev => prev + ` {{${v}}}`);
                        toastInfo(`Appended {{${v}}} to template`);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded text-[10px] font-mono text-slate-700 transition cursor-pointer"
                    >
                      +{'{' + '{' + v + '}' + '}'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={editedFooter}
                  onChange={e => setEditedFooter(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-600 font-mono"
                  placeholder="Ashrey FlowOps Logistics Dispatch"
                />
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSaveTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Template Changes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Real-time Template Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#e5ddd5] border border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="text-[10px] font-mono font-bold text-slate-600 uppercase flex items-center space-x-1">
                <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
                <span>Live Template Render Preview</span>
              </div>

              <div className="bg-white rounded-xl p-3.5 shadow-sm space-y-2 border border-slate-200 text-xs">
                {editedHeader && (
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-100 pb-1">
                    {editedHeader}
                  </div>
                )}

                <div className="text-[11px] text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {editingTemplate ? proactiveNotificationService.renderTemplate({
                    ...editingTemplate,
                    bodyTemplate: editedBody
                  }, editingTemplate.sampleParameters) : editedBody}
                </div>

                {editedFooter && (
                  <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1 font-mono">
                    {editedFooter}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400 font-mono pt-1">
                  <span>14:30</span>
                  <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Meta WhatsApp Business Compliance</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All milestone templates conform to WhatsApp Category: <strong>UTILITY</strong>. They carry guaranteed 24-hour customer service window overrides for active orders and delivery transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUBTAB 5: WEBHOOK & RECEIPT POLICY SETTINGS */}
      {activeSubTab === 'policy' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Delivery & Read Receipt Policy</h3>
            <p className="text-xs text-slate-500">Configure Webhook callback secrets and simulated receipt delivery speed.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Auto Simulate Receipts Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800">Auto-Simulate Delivery & Read Receipts</div>
                <div className="text-slate-500 text-[11px]">Automatically transitions messages from Sent ➔ Delivered ➔ Read</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoSimulateReceipts}
                onChange={e => {
                  const updated = proactiveNotificationService.saveConfig(tenantId, { autoSimulateReceipts: e.target.checked });
                  setConfig(updated);
                  toastSuccess(`Receipt auto-progression ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Delays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Delivery Delay (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={config.deliveryDelaySeconds}
                  onChange={e => {
                    const updated = proactiveNotificationService.saveConfig(tenantId, { deliveryDelaySeconds: Number(e.target.value) });
                    setConfig(updated);
                  }}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 font-mono"
                />
                <span className="text-[10px] text-slate-400">Time until double grey tick ✓✓</span>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                  Read Delay (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={config.readDelaySeconds}
                  onChange={e => {
                    const updated = proactiveNotificationService.saveConfig(tenantId, { readDelaySeconds: Number(e.target.value) });
                    setConfig(updated);
                  }}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 font-mono"
                />
                <span className="text-[10px] text-slate-400">Time until double blue tick ✓✓</span>
              </div>
            </div>

            {/* Default Language */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Default Milestone Language
              </label>
              <select
                value={config.defaultLanguage}
                onChange={e => {
                  const updated = proactiveNotificationService.saveConfig(tenantId, { defaultLanguage: e.target.value as 'en' | 'hi' });
                  setConfig(updated);
                  toastInfo(`Language set to ${e.target.value === 'hi' ? 'Hindi / Hinglish' : 'English'}`);
                }}
                className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
              >
                <option value="en">English (Default B2B Standard)</option>
                <option value="hi">Hindi / Hinglish (Regional Shop Floor)</option>
              </select>
            </div>

            {/* Webhook Endpoint */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Inbound Webhook URL (For Meta Cloud API & AiSensy)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/status-webhook` : 'https://flowops.internal/api/whatsapp/status-webhook'}
                  className="flex-1 bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200 rounded px-3 py-2"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/status-webhook`);
                    toastSuccess('Webhook URL copied to clipboard');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                Webhook Verification Token
              </label>
              <input
                type="text"
                value={config.webhookSecret}
                onChange={e => {
                  const updated = proactiveNotificationService.saveConfig(tenantId, { webhookSecret: e.target.value });
                  setConfig(updated);
                }}
                className="w-full font-mono text-xs border border-slate-200 rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW MESSAGE MODAL */}
      {viewLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{viewLogModal.orderNumber}</h4>
                <p className="text-[11px] text-slate-500 font-mono">{viewLogModal.wamid}</p>
              </div>
              <button
                onClick={() => setViewLogModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-[#e5ddd5] p-3 rounded-xl">
              <div className="bg-white p-3 rounded-lg text-xs whitespace-pre-line shadow leading-relaxed font-sans text-slate-800">
                {viewLogModal.renderedMessage}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div>Sent: {viewLogModal.sentAt ? new Date(viewLogModal.sentAt).toLocaleTimeString() : '-'}</div>
              <div>Delivered: {viewLogModal.deliveredAt ? new Date(viewLogModal.deliveredAt).toLocaleTimeString() : '-'}</div>
              <div>Read: {viewLogModal.readAt ? new Date(viewLogModal.readAt).toLocaleTimeString() : '-'}</div>
              <div>Status: {viewLogModal.receiptStatus.toUpperCase()}</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewLogModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
