// src/services/proactiveNotificationService.ts

import { 
  ProactiveMilestone, 
  MessageReceiptStatus, 
  WhatsAppNotificationTemplate, 
  ProactiveNotificationLog, 
  ProactiveNotificationConfig, 
  ProactiveNotificationStats, 
  MilestoneEventPayload 
} from '../types/whatsappProactiveNotifications';
import { sendWhatsAppNotification } from '../utils/whatsapp';

const STORAGE_KEYS = {
  LOGS: (tenantId: string) => `proactive_whatsapp_logs_${tenantId}`,
  TEMPLATES: (tenantId: string) => `proactive_whatsapp_templates_${tenantId}`,
  CONFIG: (tenantId: string) => `proactive_whatsapp_config_${tenantId}`
};

export const DEFAULT_TEMPLATES: WhatsAppNotificationTemplate[] = [
  {
    id: 'tmpl-order-confirmed-en',
    milestone: 'order_confirmed',
    name: 'Order Confirmed & Scheduled (English)',
    code: 'order_confirmed_proactive',
    language: 'en',
    headerText: '🎉 ORDER CONFIRMED',
    bodyTemplate: `Dear {{customerName}},\n\nYour Purchase Order *#{{orderNumber}}* for *{{productSummary}}* has been approved and scheduled for manufacturing.\n\n📅 *Est. Dispatch Date:* {{expectedDelivery}}\n🏭 *Production Facility:* Chakan Manufacturing Hub\n💰 *Total Order Value:* ₹{{totalAmount}}\n\nWe will proactively notify you via WhatsApp at every milestone. Track live anytime: Text *STATUS {{orderNumber}}* or click below.\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps Real-Time Dispatch Alert',
    buttons: [
      { type: 'URL', label: 'Track Order', value: '{{trackingUrl}}' },
      { type: 'QUICK_REPLY', label: 'Order Status', value: 'STATUS {{orderNumber}}' }
    ],
    variables: ['customerName', 'orderNumber', 'productSummary', 'expectedDelivery', 'totalAmount', 'companyName', 'trackingUrl'],
    isActive: true,
    sampleParameters: {
      customerName: 'Bharat Forge Ltd',
      orderNumber: 'PO-BFL-2026-9905',
      productSummary: 'SS 316 Flange Class 150 (300 pcs) + Stud Bolts',
      expectedDelivery: '25-Nov-2026',
      totalAmount: '4,52,000',
      companyName: 'Ashrey FlowOps Ltd',
      trackingUrl: 'https://flowops.internal/track/PO-BFL-2026-9905'
    }
  },
  {
    id: 'tmpl-production-started-en',
    milestone: 'production_started',
    name: 'Production Started & Station Update (English)',
    code: 'production_started_proactive',
    language: 'en',
    headerText: '⚙️ PRODUCTION KICKOFF',
    bodyTemplate: `Dear {{customerName}},\n\nWork order for *#{{orderNumber}}* (*{{productSummary}}*) has now commenced production on the shop floor.\n\n📍 *Current Station:* {{stationName}}\n🛠️ *Active Operation:* {{stageName}}\n⏱️ *Shop Floor Status:* Tolerance calibration complete, batch moving through machining.\n\nOur supervisors ensure precision tolerances at every station. Next checkpoint: Final Quality Audit (FQC).\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps Shopfloor Milestone',
    buttons: [
      { type: 'URL', label: 'Live Shopfloor View', value: '{{trackingUrl}}' },
      { type: 'QUICK_REPLY', label: 'Check Progress', value: 'STATUS {{orderNumber}}' }
    ],
    variables: ['customerName', 'orderNumber', 'productSummary', 'stationName', 'stageName', 'companyName', 'trackingUrl'],
    isActive: true,
    sampleParameters: {
      customerName: 'Tata Motors Precision CVBU',
      orderNumber: 'PO-TATA-2026-902',
      productSummary: '500 pcs CNC Bushing BS-4022',
      stationName: 'CNC Milling Center (Line 02)',
      stageName: 'Precision CNC Machining & Heat Treatment',
      companyName: 'Ashrey FlowOps Ltd',
      trackingUrl: 'https://flowops.internal/track/PO-TATA-2026-902'
    }
  },
  {
    id: 'tmpl-qc-passed-en',
    milestone: 'qc_passed',
    name: 'Quality Inspection Passed (FQC / CoC) (English)',
    code: 'qc_passed_proactive',
    language: 'en',
    headerText: '✅ QUALITY AUDIT PASSED',
    bodyTemplate: `Dear {{customerName}},\n\nGreat news! Components for Order *#{{orderNumber}}* have completed final quality audit and successfully passed all dimensional & metallurgy tolerances.\n\n📋 *Inspection Result:* {{qcScore}} (Zero Defect Acceptance)\n👨‍🔬 *Certified By QA:* {{inspectorName}}\n🔖 *Certificate of Conformance:* {{cocNumber}}\n📦 *Release Gate:* Approved for Outbound Staging & Dispatch\n\nYour consignment is staged at the dispatch dock and being packed for safe transit.\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps ISO 9001 Quality System',
    buttons: [
      { type: 'URL', label: 'Download CoC PDF', value: '{{trackingUrl}}' },
      { type: 'QUICK_REPLY', label: 'Dispatch ETA', value: 'STATUS {{orderNumber}}' }
    ],
    variables: ['customerName', 'orderNumber', 'qcScore', 'inspectorName', 'cocNumber', 'companyName', 'trackingUrl'],
    isActive: true,
    sampleParameters: {
      customerName: 'Kirloskar Oil Engines Ltd',
      orderNumber: 'PO-KOEL-4480',
      qcScore: 'Passed 100% (Radial runout <0.012mm TIR)',
      inspectorName: 'Suresh Patil (Lead QA Authority)',
      cocNumber: 'COC-2026-8819',
      companyName: 'Ashrey FlowOps Ltd',
      trackingUrl: 'https://flowops.internal/track/PO-KOEL-4480'
    }
  },
  {
    id: 'tmpl-dispatched-en',
    milestone: 'dispatched',
    name: 'Consignment Dispatched & LR Tracking (English)',
    code: 'dispatched_proactive',
    language: 'en',
    headerText: '🚚 CONSIGNMENT DISPATCHED',
    bodyTemplate: `Dear {{customerName}},\n\nYour consignment for Order *#{{orderNumber}}* has been securely loaded and dispatched from our factory gates.\n\n🚛 *Transporter:* {{transporter}}\n📄 *Lorry Receipt (LR) No:* {{lrNumber}}\n🔢 *Vehicle Plate:* {{vehicleNumber}}\n📅 *Expected Delivery:* {{expectedDelivery}}\n\n📍 *Live Shipment & GPS Tracking:*\n{{trackingUrl}}\n\nOur driver will contact your stores team upon arrival at the gate.\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps Logistics Dispatch',
    buttons: [
      { type: 'URL', label: 'Track Live Lorry', value: '{{trackingUrl}}' },
      { type: 'QUICK_REPLY', label: 'Driver Details', value: 'STATUS {{orderNumber}}' }
    ],
    variables: ['customerName', 'orderNumber', 'transporter', 'lrNumber', 'vehicleNumber', 'expectedDelivery', 'trackingUrl', 'companyName'],
    isActive: true,
    sampleParameters: {
      customerName: 'Cummins India Megasite',
      orderNumber: 'PO-CUMM-8821',
      transporter: 'VRL Logistics Express',
      lrNumber: 'VRL-PN-2026-99120',
      vehicleNumber: 'MH-12-RN-4819',
      expectedDelivery: 'Tomorrow, by 16:30 PM',
      trackingUrl: 'https://flowops.internal/track/PO-CUMM-8821',
      companyName: 'Ashrey FlowOps Ltd'
    }
  },
  {
    id: 'tmpl-delivered-en',
    milestone: 'delivered',
    name: 'Delivery Confirmed & Proof of Delivery (English)',
    code: 'delivered_proactive',
    language: 'en',
    headerText: '📦 CONSIGNMENT DELIVERED',
    bodyTemplate: `Dear {{customerName}},\n\nConsignment for Order *#{{orderNumber}}* has been safely delivered to your designated facility.\n\n👤 *Received By:* {{receivedBy}}\n📝 *Gate Inward Notes:* {{deliveryRemarks}}\n⏰ *Delivered At:* {{deliveryDate}}\n\nThank you for partnering with *{{companyName}}*. To verify your invoice or initiate a re-order, reply to this message or text *HELP*.\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps Electronic Proof of Delivery (e-PoD)',
    buttons: [
      { type: 'URL', label: 'View e-PoD Slip', value: '{{trackingUrl}}' },
      { type: 'QUICK_REPLY', label: 'Rate Quality', value: 'FEEDBACK {{orderNumber}}' }
    ],
    variables: ['customerName', 'orderNumber', 'receivedBy', 'deliveryRemarks', 'deliveryDate', 'companyName', 'trackingUrl'],
    isActive: true,
    sampleParameters: {
      customerName: 'Bharat Forge Ltd',
      orderNumber: 'PO-BFL-2026-9905',
      receivedBy: 'Ramesh Sawant (Stores In-Charge)',
      deliveryRemarks: 'Seal Intact, 300 pcs Flanges verified, Gate Pass #GP-8819',
      deliveryDate: 'Today at 14:15 PM',
      companyName: 'Ashrey FlowOps Ltd',
      trackingUrl: 'https://flowops.internal/track/PO-BFL-2026-9905'
    }
  },
  // Hinglish / Hindi Localized Option
  {
    id: 'tmpl-order-confirmed-hi',
    milestone: 'order_confirmed',
    name: 'Order Confirmed (Hindi / Hinglish)',
    code: 'order_confirmed_proactive_hi',
    language: 'hi',
    headerText: '🎉 ऑर्डर कन्फर्म',
    bodyTemplate: `Namaste {{customerName}},\n\nAapka Purchase Order *#{{orderNumber}}* (*{{productSummary}}*) approve ho chuka hai aur production schedule par hai.\n\n📅 *Anumanit Dispatch:* {{expectedDelivery}}\n🏭 *Manufacturing Hub:* Chakan Plant\n💰 *Order Rakam:* ₹{{totalAmount}}\n\nHar milestone par hum WhatsApp se updates bhejte rahenge. Status janne ke liye *STATUS {{orderNumber}}* text karein.\n\n— {{companyName}}`,
    footerText: 'Ashrey FlowOps Real-Time Alert',
    buttons: [
      { type: 'URL', label: 'Track Order', value: '{{trackingUrl}}' }
    ],
    variables: ['customerName', 'orderNumber', 'productSummary', 'expectedDelivery', 'totalAmount', 'companyName', 'trackingUrl'],
    isActive: false,
    sampleParameters: {
      customerName: 'Gujarat Lathe Corp',
      orderNumber: 'PO-GLC-2026-118',
      productSummary: '200 pcs Casting Gear Ring',
      expectedDelivery: '28-Nov-2026',
      totalAmount: '3,10,000',
      companyName: 'Ashrey FlowOps Ltd',
      trackingUrl: 'https://flowops.internal/track/PO-GLC-2026-118'
    }
  }
];

export const DEFAULT_CONFIG: ProactiveNotificationConfig = {
  tenantId: 'demo',
  enabledMilestones: {
    order_confirmed: true,
    production_started: true,
    qc_passed: true,
    dispatched: true,
    delivered: true
  },
  autoSimulateReceipts: true,
  deliveryDelaySeconds: 2,
  readDelaySeconds: 5,
  defaultSender: '+91 98201 12345 (FlowOps Verified Business)',
  defaultLanguage: 'en',
  webhookSecret: 'whsec_prod_live_sensy_99219',
  sendDeliveryConfirmationWithPhoto: true
};

const SEED_LOGS: ProactiveNotificationLog[] = [
  {
    id: 'pnotif-1',
    wamid: 'wamid.HBgMOTkyMDExMjM0NUC1FhIAEjg4OTEy',
    tenantId: 'demo',
    milestone: 'delivered',
    orderId: 'ord-101',
    orderNumber: 'PO-BFL-2026-9905',
    customerName: 'Bharat Forge Ltd',
    recipientPhone: '+91 98201 12345',
    templateCode: 'delivered_proactive',
    templateName: 'Consignment Delivered & Proof of Delivery (English)',
    renderedMessage: `Dear Bharat Forge Ltd,\n\nConsignment for Order *#PO-BFL-2026-9905* has been safely delivered to your designated facility.\n\n👤 *Received By:* Ramesh Sawant (Stores In-Charge)\n📝 *Gate Inward Notes:* Seal Intact, 300 pcs Flanges verified\n⏰ *Delivered At:* 2026-10-19 14:15 PM\n\nThank you for partnering with *Ashrey FlowOps Ltd*.\n\n— Ashrey FlowOps Ltd`,
    receiptStatus: 'read',
    queuedAt: '2026-10-19T14:15:00.000Z',
    sentAt: '2026-10-19T14:15:01.000Z',
    deliveredAt: '2026-10-19T14:15:03.000Z',
    readAt: '2026-10-19T14:16:42.000Z',
    parameters: {
      customerName: 'Bharat Forge Ltd',
      orderNumber: 'PO-BFL-2026-9905',
      receivedBy: 'Ramesh Sawant (Stores In-Charge)',
      deliveryRemarks: 'Seal Intact, 300 pcs Flanges verified',
      deliveryDate: '2026-10-19 14:15 PM',
      companyName: 'Ashrey FlowOps Ltd'
    },
    sourceTrigger: 'event'
  },
  {
    id: 'pnotif-2',
    wamid: 'wamid.HBgMOTg3NjU0MzIxMUC1FhIAEjkwMjA1',
    tenantId: 'demo',
    milestone: 'dispatched',
    orderId: 'ord-102',
    orderNumber: 'PO-TATA-2026-902',
    customerName: 'Tata Motors Precision CVBU',
    recipientPhone: '+91 98765 43210',
    templateCode: 'dispatched_proactive',
    templateName: 'Consignment Dispatched & LR Tracking (English)',
    renderedMessage: `Dear Tata Motors Precision CVBU,\n\nYour consignment for Order *#PO-TATA-2026-902* has been securely loaded and dispatched.\n\n🚛 *Transporter:* VRL Logistics Express\n📄 *Lorry Receipt (LR) No:* VRL-CHAK-9921\n🔢 *Vehicle Plate:* MH-14-GH-8820\n📅 *Expected Delivery:* Tomorrow 11:00 AM\n\n📍 *Live Shipment:*\nhttps://flowops.internal/track/PO-TATA-2026-902\n\n— Ashrey FlowOps Ltd`,
    receiptStatus: 'read',
    queuedAt: '2026-10-19T16:20:00.000Z',
    sentAt: '2026-10-19T16:20:01.000Z',
    deliveredAt: '2026-10-19T16:20:03.000Z',
    readAt: '2026-10-19T16:22:15.000Z',
    parameters: {
      customerName: 'Tata Motors Precision CVBU',
      orderNumber: 'PO-TATA-2026-902',
      transporter: 'VRL Logistics Express',
      lrNumber: 'VRL-CHAK-9921',
      vehicleNumber: 'MH-14-GH-8820',
      expectedDelivery: 'Tomorrow 11:00 AM',
      companyName: 'Ashrey FlowOps Ltd'
    },
    sourceTrigger: 'event'
  },
  {
    id: 'pnotif-3',
    wamid: 'wamid.HBgMOTgxMTEyMjMzNEM1FhIAEjQ0ODAx',
    tenantId: 'demo',
    milestone: 'qc_passed',
    orderId: 'ord-103',
    orderNumber: 'PO-KOEL-4480',
    customerName: 'Kirloskar Oil Engines Ltd',
    recipientPhone: '+91 98111 22334',
    templateCode: 'qc_passed_proactive',
    templateName: 'Quality Inspection Passed (FQC / CoC) (English)',
    renderedMessage: `Dear Kirloskar Oil Engines Ltd,\n\nComponents for Order *#PO-KOEL-4480* have completed final quality audit and successfully passed all tolerance checks.\n\n📋 *Inspection Result:* Passed 100% (Radial runout <0.012mm)\n👨‍🔬 *Certified By QA:* Suresh Patil\n🔖 *Certificate of Conformance:* COC-2026-8819\n📦 *Release Gate:* Approved for Outbound Staging\n\n— Ashrey FlowOps Ltd`,
    receiptStatus: 'delivered',
    queuedAt: '2026-10-19T17:40:00.000Z',
    sentAt: '2026-10-19T17:40:02.000Z',
    deliveredAt: '2026-10-19T17:40:04.000Z',
    parameters: {
      customerName: 'Kirloskar Oil Engines Ltd',
      orderNumber: 'PO-KOEL-4480',
      qcScore: 'Passed 100%',
      inspectorName: 'Suresh Patil',
      cocNumber: 'COC-2026-8819',
      companyName: 'Ashrey FlowOps Ltd'
    },
    sourceTrigger: 'event'
  },
  {
    id: 'pnotif-4',
    wamid: 'wamid.HBgMOTkyMzQ1Njc4OUM1FhIAEjg4MjEy',
    tenantId: 'demo',
    milestone: 'production_started',
    orderId: 'ord-104',
    orderNumber: 'PO-CUMM-8821',
    customerName: 'Cummins India Megasite',
    recipientPhone: '+91 99234 56789',
    templateCode: 'production_started_proactive',
    templateName: 'Production Started & Station Update (English)',
    renderedMessage: `Dear Cummins India Megasite,\n\nWork order for *#PO-CUMM-8821* (*350 pcs Hydraulic Valve Flanges*) has commenced production.\n\n📍 *Current Station:* CNC Milling Line 03\n🛠️ *Active Operation:* Precision Milling & Port Drilling\n\n— Ashrey FlowOps Ltd`,
    receiptStatus: 'sent',
    queuedAt: '2026-10-19T18:10:00.000Z',
    sentAt: '2026-10-19T18:10:02.000Z',
    parameters: {
      customerName: 'Cummins India Megasite',
      orderNumber: 'PO-CUMM-8821',
      productSummary: '350 pcs Hydraulic Valve Flanges',
      stationName: 'CNC Milling Line 03',
      stageName: 'Precision Milling & Port Drilling',
      companyName: 'Ashrey FlowOps Ltd'
    },
    sourceTrigger: 'event'
  },
  {
    id: 'pnotif-5',
    wamid: 'wamid.HBgMOTQ0MDYxMjM0NUM1FhIAEjExODAy',
    tenantId: 'demo',
    milestone: 'order_confirmed',
    orderId: 'ord-105',
    orderNumber: 'PO-GLC-2026-118',
    customerName: 'Gujarat Lathe Corp',
    recipientPhone: '+91 94406 12345',
    templateCode: 'order_confirmed_proactive',
    templateName: 'Order Confirmed & Scheduled (English)',
    renderedMessage: `Dear Gujarat Lathe Corp,\n\nYour Purchase Order *#PO-GLC-2026-118* for *200 pcs Casting Gear Ring* has been confirmed.\n\n📅 *Est. Dispatch:* 28-Nov-2026\n🏭 *Production Facility:* Chakan Manufacturing Hub\n💰 *Total Order Value:* ₹3,10,000\n\n— Ashrey FlowOps Ltd`,
    receiptStatus: 'read',
    queuedAt: '2026-10-19T18:15:00.000Z',
    sentAt: '2026-10-19T18:15:01.000Z',
    deliveredAt: '2026-10-19T18:15:03.000Z',
    readAt: '2026-10-19T18:17:20.000Z',
    parameters: {
      customerName: 'Gujarat Lathe Corp',
      orderNumber: 'PO-GLC-2026-118',
      productSummary: '200 pcs Casting Gear Ring',
      expectedDelivery: '28-Nov-2026',
      totalAmount: '3,10,000',
      companyName: 'Ashrey FlowOps Ltd'
    },
    sourceTrigger: 'event'
  }
];

class ProactiveNotificationService {
  private activeTimers: Map<string, any[]> = new Map();

  /**
   * Retrieves active configuration for tenant
   */
  public getConfig(tenantId: string = 'demo'): ProactiveNotificationConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG(tenantId));
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored), tenantId };
      }
    } catch (e) {
      console.warn('Failed to load proactive config from localStorage:', e);
    }
    return { ...DEFAULT_CONFIG, tenantId };
  }

  /**
   * Saves updated configuration
   */
  public saveConfig(tenantId: string, update: Partial<ProactiveNotificationConfig>): ProactiveNotificationConfig {
    const current = this.getConfig(tenantId);
    const updated: ProactiveNotificationConfig = {
      ...current,
      ...update,
      tenantId
    };
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG(tenantId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save proactive config:', e);
    }
    return updated;
  }

  /**
   * Retrieves all notification templates for tenant
   */
  public getTemplates(tenantId: string = 'demo'): WhatsAppNotificationTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES(tenantId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load templates from localStorage:', e);
    }
    return DEFAULT_TEMPLATES;
  }

  /**
   * Saves or updates a template
   */
  public saveTemplate(tenantId: string, template: WhatsAppNotificationTemplate): WhatsAppNotificationTemplate[] {
    const templates = this.getTemplates(tenantId);
    const idx = templates.findIndex(t => t.id === template.id);
    let updated: WhatsAppNotificationTemplate[];
    if (idx >= 0) {
      updated = [...templates];
      updated[idx] = template;
    } else {
      updated = [template, ...templates];
    }
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES(tenantId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save templates:', e);
    }
    return updated;
  }

  /**
   * Reset templates to default factory settings
   */
  public resetTemplates(tenantId: string): WhatsAppNotificationTemplate[] {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES(tenantId), JSON.stringify(DEFAULT_TEMPLATES));
    } catch (e) {
      console.error('Failed to reset templates:', e);
    }
    return DEFAULT_TEMPLATES;
  }

  /**
   * Retrieves all proactive notification logs
   */
  public getLogs(tenantId: string = 'demo'): ProactiveNotificationLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS(tenantId));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load proactive logs from localStorage:', e);
    }
    // Seed initial logs if empty
    this.saveLogs(tenantId, SEED_LOGS);
    return SEED_LOGS;
  }

  /**
   * Persist logs to localStorage
   */
  private saveLogs(tenantId: string, logs: ProactiveNotificationLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS(tenantId), JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to write proactive logs:', e);
    }
  }

  /**
   * Render template with provided parameters
   */
  public renderTemplate(template: WhatsAppNotificationTemplate, params: Record<string, any>): string {
    let result = template.bodyTemplate;
    const allParams = { ...template.sampleParameters, ...params };
    
    Object.keys(allParams).forEach(key => {
      const val = allParams[key];
      if (val !== undefined && val !== null) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(val));
      }
    });

    return result;
  }

  /**
   * Find matching active template for milestone
   */
  public getActiveTemplateForMilestone(
    milestone: ProactiveMilestone, 
    tenantId: string = 'demo',
    language: 'en' | 'hi' = 'en'
  ): WhatsAppNotificationTemplate {
    const templates = this.getTemplates(tenantId);
    const match = templates.find(t => t.milestone === milestone && t.isActive && t.language === language)
      || templates.find(t => t.milestone === milestone && t.isActive)
      || DEFAULT_TEMPLATES.find(t => t.milestone === milestone)
      || DEFAULT_TEMPLATES[0];
    return match;
  }

  /**
   * Main Event-Driven Milestone Trigger:
   * Called when orders transition state (order_confirmed, production_started, qc_passed, dispatched, delivered)
   */
  public async triggerMilestoneNotification(payload: MilestoneEventPayload): Promise<ProactiveNotificationLog | null> {
    const { tenantId, milestone, orderId, orderNumber, customerName, parameters, sourceTrigger = 'event' } = payload;
    const config = this.getConfig(tenantId);

    // 1. Verify if this milestone notification is enabled
    if (config.enabledMilestones && config.enabledMilestones[milestone] === false) {
      console.log(`[ProactiveNotificationService] Milestone ${milestone} is toggled OFF in config for tenant ${tenantId}. Skipping.`);
      return null;
    }

    // 2. Select appropriate template
    const template = this.getActiveTemplateForMilestone(milestone, tenantId, config.defaultLanguage);
    
    // 3. Fallback phone number if not supplied
    let recipientPhone = payload.recipientPhone;
    if (!recipientPhone) {
      recipientPhone = this.lookupCustomerPhone(tenantId, customerName, payload.customerId);
    }

    // 4. Render message body
    const renderedMessage = this.renderTemplate(template, {
      ...parameters,
      customerName: customerName || 'Customer',
      orderNumber: orderNumber || 'ORD-REF',
      companyName: parameters.companyName || 'Ashrey FlowOps Ltd',
      trackingUrl: parameters.trackingUrl || (typeof window !== 'undefined' ? `${window.location.origin}/track/${orderNumber}` : `https://flowops.internal/track/${orderNumber}`)
    });

    // 5. Create Outbox Notification Record with WhatsApp Message ID (wamid)
    const now = new Date();
    const wamid = `wamid.HBgM${recipientPhone.replace(/\D/g, '').slice(-10)}C1FhIAE${Date.now().toString(36).toUpperCase()}`;
    const logId = `pnotif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newLog: ProactiveNotificationLog = {
      id: logId,
      wamid,
      tenantId,
      milestone,
      orderId,
      orderNumber,
      customerName,
      recipientPhone,
      templateCode: template.code,
      templateName: template.name,
      renderedMessage,
      receiptStatus: 'sent', // Initially dispatched
      queuedAt: now.toISOString(),
      sentAt: now.toISOString(),
      parameters,
      sourceTrigger
    };

    // 6. Save log
    const currentLogs = this.getLogs(tenantId);
    this.saveLogs(tenantId, [newLog, ...currentLogs]);

    // 7. Also dispatch into core WhatsApp outbox utility for full backward compatibility
    try {
      const templateMapping: Record<ProactiveMilestone, string> = {
        order_confirmed: 'order_confirmed',
        production_started: 'production_update',
        qc_passed: 'production_update',
        dispatched: 'order_dispatched',
        delivered: 'delivery_confirmed'
      };

      const stringifiedParams: Record<string, string> = {};
      Object.keys(parameters || {}).forEach(k => {
        if (parameters[k] !== undefined && parameters[k] !== null) {
          stringifiedParams[k] = String(parameters[k]);
        }
      });
      stringifiedParams.customerName = customerName || '';
      stringifiedParams.orderNumber = orderNumber || '';
      stringifiedParams.orderId = orderId || '';
      stringifiedParams.stage = milestone === 'qc_passed' ? 'Quality Audit Passed (FQC Approved)' : String(parameters.stageName || milestone);

      await sendWhatsAppNotification({
        recipientName: customerName,
        recipientPhone,
        templateName: templateMapping[milestone] || 'production_update',
        parameters: stringifiedParams,
        tenantId,
        orderId,
        customerId: payload.customerId
      });
    } catch (e) {
      console.warn('[ProactiveNotificationService] Outbox sync error (non-fatal):', e);
    }

    // 8. Event-driven Delivery & Read Receipt progression
    if (config.autoSimulateReceipts) {
      this.scheduleReceiptProgression(tenantId, logId, config.deliveryDelaySeconds, config.readDelaySeconds);
    }

    return newLog;
  }

  /**
   * Schedule automatic receipt updates: queued -> sent -> delivered -> read
   */
  private scheduleReceiptProgression(tenantId: string, logId: string, deliveryDelaySec: number = 2, readDelaySec: number = 5): void {
    const timers: any[] = [];

    // Step A: Transition to 'delivered'
    const delTimer = setTimeout(() => {
      this.updateReceiptStatus(tenantId, logId, 'delivered');
    }, Math.max(1000, deliveryDelaySec * 1000));
    timers.push(delTimer);

    // Step B: Transition to 'read' (double blue tick)
    const readTimer = setTimeout(() => {
      this.updateReceiptStatus(tenantId, logId, 'read');
    }, Math.max(2000, (deliveryDelaySec + readDelaySec) * 1000));
    timers.push(readTimer);

    this.activeTimers.set(logId, timers);
  }

  /**
   * Updates receipt status for a specific notification log
   */
  public updateReceiptStatus(
    tenantId: string, 
    logIdOrWamid: string, 
    status: MessageReceiptStatus,
    failureReason?: string
  ): ProactiveNotificationLog | null {
    const logs = this.getLogs(tenantId);
    const idx = logs.findIndex(l => l.id === logIdOrWamid || l.wamid === logIdOrWamid);
    if (idx === -1) return null;

    const existing = logs[idx];
    const now = new Date().toISOString();
    
    const updated: ProactiveNotificationLog = {
      ...existing,
      receiptStatus: status,
      deliveredAt: (status === 'delivered' || status === 'read') ? (existing.deliveredAt || now) : existing.deliveredAt,
      readAt: status === 'read' ? (existing.readAt || now) : existing.readAt,
      failedAt: status === 'failed' ? now : existing.failedAt,
      failureReason: failureReason || existing.failureReason
    };

    logs[idx] = updated;
    this.saveLogs(tenantId, logs);

    // Also update general whatsappLogs in localStorage if matched by phone or text
    this.syncStandardWhatsAppLogStatus(tenantId, updated);

    return updated;
  }

  /**
   * Inbound Webhook Simulator:
   * Process incoming WhatsApp webhook status payload (as from Meta Cloud API or AiSensy)
   */
  public processReceiptWebhook(
    tenantId: string,
    wamid: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
    timestamp?: string,
    errorReason?: string
  ): { success: boolean; log?: ProactiveNotificationLog } {
    const updated = this.updateReceiptStatus(tenantId, wamid, status, errorReason);
    if (updated) {
      return { success: true, log: updated };
    }
    return { success: false };
  }

  /**
   * Calculate aggregated performance & delivery metrics
   */
  public getStats(tenantId: string = 'demo'): ProactiveNotificationStats {
    const logs = this.getLogs(tenantId);
    
    const stats: ProactiveNotificationStats = {
      totalSent: logs.length,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      deliveryRate: 100,
      readRate: 0,
      avgTimeToReadSeconds: 145, // default realistic demo
      byMilestone: {
        order_confirmed: 0,
        production_started: 0,
        qc_passed: 0,
        dispatched: 0,
        delivered: 0
      },
      byStatus: {
        queued: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      }
    };

    let readTimeTotalSec = 0;
    let readCountWithTime = 0;

    logs.forEach(log => {
      // Milestone breakdown
      if (stats.byMilestone[log.milestone] !== undefined) {
        stats.byMilestone[log.milestone]++;
      }

      // Status breakdown
      if (stats.byStatus[log.receiptStatus] !== undefined) {
        stats.byStatus[log.receiptStatus]++;
      }

      if (log.receiptStatus === 'delivered' || log.receiptStatus === 'read') {
        stats.totalDelivered++;
      }
      if (log.receiptStatus === 'read') {
        stats.totalRead++;

        if (log.sentAt && log.readAt) {
          const diff = Math.max(1, (new Date(log.readAt).getTime() - new Date(log.sentAt).getTime()) / 1000);
          readTimeTotalSec += diff;
          readCountWithTime++;
        }
      }
      if (log.receiptStatus === 'failed') {
        stats.totalFailed++;
      }
    });

    if (logs.length > 0) {
      stats.deliveryRate = Math.round((stats.totalDelivered / logs.length) * 100);
      stats.readRate = Math.round((stats.totalRead / logs.length) * 100);
      if (readCountWithTime > 0) {
        stats.avgTimeToReadSeconds = Math.round(readTimeTotalSec / readCountWithTime);
      }
    }

    return stats;
  }

  /**
   * Helper to lookup customer phone from localStorage
   */
  private lookupCustomerPhone(tenantId: string, customerName?: string, customerId?: string): string {
    try {
      const cached = localStorage.getItem(`customers_${tenantId}`);
      if (cached) {
        const customers = JSON.parse(cached);
        const match = customers.find((c: any) => 
          (customerId && c.id === customerId) || 
          (customerName && c.name && c.name.toLowerCase().includes(customerName.toLowerCase()))
        );
        if (match && match.phone) return match.phone;
      }
    } catch (e) {
      // ignore
    }
    return '+91 98201 12345'; // standard default
  }

  /**
   * Keeps standard whatsappLogs status aligned
   */
  private syncStandardWhatsAppLogStatus(tenantId: string, log: ProactiveNotificationLog): void {
    try {
      const key = `whatsapp_logs_${tenantId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const logs = JSON.parse(raw);
      let updated = false;

      for (const l of logs) {
        if (l.recipientPhone && log.recipientPhone && l.recipientPhone.replace(/\D/g, '') === log.recipientPhone.replace(/\D/g, '')) {
          l.receiptStatus = log.receiptStatus;
          l.status = log.receiptStatus === 'failed' ? 'failed' : 'sent';
          l.deliveredAt = log.deliveredAt;
          l.readAt = log.readAt;
          l.wamid = log.wamid;
          updated = true;
          break;
        }
      }

      if (updated) {
        localStorage.setItem(key, JSON.stringify(logs));
      }
    } catch (e) {
      // non-fatal
    }
  }
}

export const proactiveNotificationService = new ProactiveNotificationService();
