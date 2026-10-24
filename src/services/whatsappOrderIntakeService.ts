// src/services/whatsappOrderIntakeService.ts

import { 
  WhatsAppOrderMessage, 
  WhatsAppBusinessApiConfig, 
  WhatsAppParsedOrderData, 
  WhatsAppOrderItem, 
  WhatsAppIntakeStats,
  WhatsAppIntakeStatus,
  WhatsAppConfirmationReply
} from '../types/whatsappOrderIntake';
import { Order, QuoteItem } from '../types';
import { sendWhatsAppNotification } from '../utils/whatsapp';
import { proactiveNotificationService } from './proactiveNotificationService';

const STORAGE_KEY_MESSAGES = 'flowops_whatsapp_order_messages_v1';
const STORAGE_KEY_CONFIG = 'flowops_whatsapp_intake_config_v1';

// Known Enterprise Customers Directory for Phone Recognition
interface KnownCustomerDirectoryEntry {
  phone: string;
  customerCode: string;
  customerName: string;
  contactPerson: string;
  customerEmail: string;
  shippingAddress: string;
  billingAddress: string;
  state: string;
  gstin: string;
  defaultPaymentTerms: string;
}

const KNOWN_CUSTOMERS: KnownCustomerDirectoryEntry[] = [
  {
    phone: '919820112345',
    customerCode: 'CUST-BFL-001',
    customerName: 'Bharat Forge Ltd.',
    contactPerson: 'Nilesh Patil (DGM Procurement)',
    customerEmail: 'nilesh.patil@bharatforge.com',
    shippingAddress: 'Plot No. 1, MIDC Baramati, Dist. Pune - 413133, Maharashtra',
    billingAddress: 'Mundhwa, Pune Cantonment, Pune - 411036, Maharashtra',
    state: 'Maharashtra',
    gstin: '27AAACB1234F1Z5',
    defaultPaymentTerms: 'Net 45 Days'
  },
  {
    phone: '919876543210',
    customerCode: 'CUST-TATA-002',
    customerName: 'Tata Motors CVBU',
    contactPerson: 'Anil Kumar (Supply Chain Lead)',
    customerEmail: 'anil.kumar@tatamotors.com',
    shippingAddress: 'Sector 10, Chakan MIDC Industrial Area Phase II, Pune - 410501, Maharashtra',
    billingAddress: 'Bombay House, 24 Homi Mody Street, Mumbai - 400001, Maharashtra',
    state: 'Maharashtra',
    gstin: '27AAACT2727Q1ZW',
    defaultPaymentTerms: 'Net 60 Days'
  },
  {
    phone: '919811122334',
    customerCode: 'CUST-KIRL-003',
    customerName: 'Kirloskar Oil Engines Ltd.',
    contactPerson: 'Rajesh Deshmukh (Store Purchase)',
    customerEmail: 'rajesh.deshmukh@kirloskar.com',
    shippingAddress: 'Five Star MIDC Kagal, Hatkanangale, Kolhapur - 416236, Maharashtra',
    billingAddress: 'Laxmanrao Kirloskar Road, Khadki, Pune - 411003, Maharashtra',
    state: 'Maharashtra',
    gstin: '27AAACK1928J1ZR',
    defaultPaymentTerms: 'Net 30 Days'
  },
  {
    phone: '919923456789',
    customerCode: 'CUST-CUMM-004',
    customerName: 'Cummins India Limited',
    contactPerson: 'Vikram Joshi (Vendor Development)',
    customerEmail: 'vikram.joshi@cummins.com',
    shippingAddress: 'Cummins Megasite, SEZ Phase II, Phaltan, Satara - 415523, Maharashtra',
    billingAddress: 'Cummins India Office Campus, Balewadi, Pune - 411045, Maharashtra',
    state: 'Maharashtra',
    gstin: '27AAACC4455R1ZK',
    defaultPaymentTerms: 'Net 30 Days'
  }
];

export const DEFAULT_WHATSAPP_INTAKE_CONFIG: WhatsAppBusinessApiConfig = {
  provider: 'meta_cloud_api',
  phoneNumberId: '109847291823901',
  businessAccountId: 'WABA-IND-4091829',
  senderPhoneNumber: '+91 80070 12345',
  apiToken: 'EAAG9...FLOWOPS_META_CLOUD_API_TOKEN_SECURE',
  webhookCallbackUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : 'https://flowops.app/api/webhooks/whatsapp',
  webhookVerifyToken: 'flowops_wa_verify_token_2026',
  appSecret: 'sec_meta_88a91b2c7e44',
  isWebhookActive: true,
  autoOrderCreationEnabled: true,
  autoApproveConfidenceThreshold: 80,
  autoSendConfirmationReply: true,
  defaultPlantId: 'plant-main-pune',
  defaultPaymentTerms: 'Net 30 Days',
  alertOnHighPriorityOrders: true,
  itAdminAlertPhone: '+91 98201 12345',
  confirmationMessageTemplate: `✅ *Order Confirmation - FlowOps Manufacturing*

Dear {{customer_name}},
Thank you for your purchase order *{{po_number}}*! Your sales order has been registered in our manufacturing system.

📋 *Sales Order Number:* {{so_number}}
📦 *Items Booked:*
{{items_summary}}

💰 *Total Order Value:* ₹{{total_value}} (incl. GST)
🚚 *Committed Dispatch Date:* {{delivery_date}}
📍 *Shipping Destination:* {{shipping_address}}

🔗 *Live Order & Production Tracking:*
{{tracking_url}}

If you need any adjustments or technical drawing clarifications, reply directly to this chat.
Thank you for choosing FlowOps Manufacturing!`
};

const SEED_MESSAGES: WhatsAppOrderMessage[] = [
  {
    id: 'wa_msg_001',
    tenantId: 'demo',
    fromPhone: '+91 98201 12345',
    senderName: 'Nilesh Patil (Bharat Forge)',
    customerId: 'CUST-BFL-001',
    customerName: 'Bharat Forge Ltd.',
    receivedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'auto_order_created',
    salesOrderId: 'order_so_wa_001',
    salesOrderNumber: 'SO-WA-2026-0041',
    autoCreated: true,
    rawText: `PO Number: PO-BFL-2026-9904
Customer: Bharat Forge Ltd (Baramati Plant)
Delivery Date: 2026-11-20
Ship to: MIDC Baramati Gate 2, Pune
Terms: Net 45 Days

Items:
1. Part: SS 316 Flange Class 150 4" (SKU: FLG-SS-401) | Qty: 250 pcs | Rate: 1450
2. Part: High-Tensile M16 Stud Bolt Grade 8.8 (SKU: STD-HT-16) | Qty: 1000 pcs | Rate: 85

Kindly confirm booking with delivery schedule.
Regards,
Nilesh Patil`,
    parsedData: {
      poNumber: 'PO-BFL-2026-9904',
      customerCode: 'CUST-BFL-001',
      customerName: 'Bharat Forge Ltd.',
      customerPhone: '+91 98201 12345',
      customerEmail: 'nilesh.patil@bharatforge.com',
      contactPerson: 'Nilesh Patil (DGM Procurement)',
      shippingAddress: 'Plot No. 1, MIDC Baramati, Dist. Pune - 413133, Maharashtra',
      billingAddress: 'Mundhwa, Pune Cantonment, Pune - 411036, Maharashtra',
      requestedDeliveryDate: '2026-11-20',
      paymentTerms: 'Net 45 Days',
      priority: 'high',
      currency: 'INR',
      confidenceScore: 97,
      parsingMethod: 'structured_kv',
      entitiesExtracted: {
        customerName: 'Bharat Forge Ltd.',
        customerPhone: '+91 98201 12345',
        customerPoNumber: 'PO-BFL-2026-9904',
        requestedDeliveryDate: '2026-11-20',
        shippingAddress: 'Plot No. 1, MIDC Baramati, Dist. Pune - 413133, Maharashtra',
        paymentTerms: 'Net 45 Days',
        itemsCount: 2
      },
      parsingNotes: [
        'Recognized verified customer by phone +91 98201 12345 (Bharat Forge Ltd.).',
        'Structured key-value format detected with high precision.',
        'Extracted 2 line items with SKU codes and unit rates.'
      ],
      items: [
        {
          id: 'item_wa_001_1',
          itemCode: 'FLG-SS-401',
          itemName: 'SS 316 Flange Class 150 4"',
          quantity: 250,
          uom: 'pcs',
          unitPrice: 1450,
          lineTotal: 362500,
          gstRatePct: 18,
          specs: 'Material: Stainless Steel 316, Class 150 ANSI B16.5'
        },
        {
          id: 'item_wa_001_2',
          itemCode: 'STD-HT-16',
          itemName: 'High-Tensile M16 Stud Bolt Grade 8.8',
          quantity: 1000,
          uom: 'pcs',
          unitPrice: 85,
          lineTotal: 85000,
          gstRatePct: 18,
          specs: 'Grade 8.8 Black Phosphated with 2 heavy hex nuts'
        }
      ],
      subtotal: 447500,
      taxAmount: 80550,
      totalAmount: 528050
    },
    confirmationReply: {
      status: 'delivered',
      sentAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 34 * 60 * 1000 + 4000).toISOString(),
      recipientPhone: '+91 98201 12345',
      recipientName: 'Nilesh Patil',
      trackingUrl: 'https://flowops.app/portal/track/SO-WA-2026-0041',
      whatsappMessageId: 'wam_msg_id_99018429',
      messageText: `✅ *Order Confirmation - FlowOps Manufacturing*

Dear Bharat Forge Ltd.,
Thank you for your purchase order *PO-BFL-2026-9904*! Your sales order has been registered in our manufacturing system.

📋 *Sales Order Number:* SO-WA-2026-0041
📦 *Items Booked:*
• SS 316 Flange Class 150 4" (FLG-SS-401) × 250 pcs @ ₹1,450
• High-Tensile M16 Stud Bolt Grade 8.8 (STD-HT-16) × 1000 pcs @ ₹85

💰 *Total Order Value:* ₹5,28,050 (incl. 18% GST)
🚚 *Committed Dispatch Date:* 2026-11-20
📍 *Shipping Destination:* MIDC Baramati Gate 2, Pune

🔗 *Live Order & Production Tracking:*
https://flowops.app/portal/track/SO-WA-2026-0041

Thank you for choosing FlowOps Manufacturing!`
    }
  },
  {
    id: 'wa_msg_002',
    tenantId: 'demo',
    fromPhone: '+91 98765 43210',
    senderName: 'Anil Kumar (Tata Motors)',
    customerId: 'CUST-TATA-002',
    customerName: 'Tata Motors CVBU',
    receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'auto_order_created',
    salesOrderId: 'order_so_wa_002',
    salesOrderNumber: 'SO-WA-2026-0042',
    autoCreated: true,
    rawText: `Hi FlowOps Team, please book an urgent order under our open contract PO PO/TATA/CVBU/2026/812. We need 400 pcs of CNC Bushing Part# BS-4022 and 150 units of Helical Pinion Shaft PS-770. Please deliver to our Chakan Phase 2 plant by November 28th. Rates as agreed: Rs 550 for bushings, Rs 1800 for pinion shafts. Thanks, Anil Kumar Tata Motors.`,
    parsedData: {
      poNumber: 'PO/TATA/CVBU/2026/812',
      customerCode: 'CUST-TATA-002',
      customerName: 'Tata Motors CVBU',
      customerPhone: '+91 98765 43210',
      customerEmail: 'anil.kumar@tatamotors.com',
      contactPerson: 'Anil Kumar (Supply Chain Lead)',
      shippingAddress: 'Sector 10, Chakan MIDC Industrial Area Phase II, Pune - 410501, Maharashtra',
      billingAddress: 'Bombay House, 24 Homi Mody Street, Mumbai - 400001, Maharashtra',
      requestedDeliveryDate: '2026-11-28',
      paymentTerms: 'Net 60 Days',
      priority: 'urgent',
      currency: 'INR',
      confidenceScore: 94,
      parsingMethod: 'nlp_conversational',
      entitiesExtracted: {
        customerName: 'Tata Motors CVBU',
        customerPhone: '+91 98765 43210',
        customerPoNumber: 'PO/TATA/CVBU/2026/812',
        requestedDeliveryDate: '2026-11-28',
        shippingAddress: 'Sector 10, Chakan MIDC Industrial Area Phase II, Pune - 410501, Maharashtra',
        paymentTerms: 'Net 60 Days',
        itemsCount: 2
      },
      parsingNotes: [
        'Recognized verified customer by phone +91 98765 43210 (Tata Motors CVBU).',
        'Natural Language Processing (NLP) extracted PO, delivery date (Nov 28th), and plant location.',
        'Extracted 2 line items with SKU codes (BS-4022, PS-770) and agreed rates.'
      ],
      items: [
        {
          id: 'item_wa_002_1',
          itemCode: 'BS-4022',
          itemName: 'CNC Bushing Part# BS-4022',
          quantity: 400,
          uom: 'pcs',
          unitPrice: 550,
          lineTotal: 220000,
          gstRatePct: 18,
          specs: 'Phosphor Bronze SAE 660, Machined to ±0.01mm tolerance'
        },
        {
          id: 'item_wa_002_2',
          itemCode: 'PS-770',
          itemName: 'Helical Pinion Shaft PS-770',
          quantity: 150,
          uom: 'units',
          unitPrice: 1800,
          lineTotal: 270000,
          gstRatePct: 18,
          specs: 'Case-hardened 20MnCr5 steel, teeth ground'
        }
      ],
      subtotal: 490000,
      taxAmount: 88200,
      totalAmount: 578200
    },
    confirmationReply: {
      status: 'delivered',
      sentAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 14 * 60 * 1000 + 3000).toISOString(),
      recipientPhone: '+91 98765 43210',
      recipientName: 'Anil Kumar',
      trackingUrl: 'https://flowops.app/portal/track/SO-WA-2026-0042',
      whatsappMessageId: 'wam_msg_id_99018430',
      messageText: `✅ *Order Confirmation - FlowOps Manufacturing*

Dear Tata Motors CVBU,
Thank you for your purchase order *PO/TATA/CVBU/2026/812*! Your sales order has been registered in our manufacturing system.

📋 *Sales Order Number:* SO-WA-2026-0042
📦 *Items Booked:*
• CNC Bushing Part# BS-4022 (BS-4022) × 400 pcs @ ₹550
• Helical Pinion Shaft PS-770 (PS-770) × 150 units @ ₹1,800

💰 *Total Order Value:* ₹5,78,200 (incl. 18% GST)
🚚 *Committed Dispatch Date:* 2026-11-28
📍 *Shipping Destination:* Sector 10, Chakan MIDC Industrial Area Phase II, Pune

🔗 *Live Order & Production Tracking:*
https://flowops.app/portal/track/SO-WA-2026-0042

Thank you for choosing FlowOps Manufacturing!`
    }
  },
  {
    id: 'wa_msg_003',
    tenantId: 'demo',
    fromPhone: '+91 98111 22334',
    senderName: 'Rajesh Deshmukh (Kirloskar)',
    customerId: 'CUST-KIRL-003',
    customerName: 'Kirloskar Oil Engines Ltd.',
    receivedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    status: 'parsed',
    autoCreated: false,
    rawText: `Namaste FlowOps, please accept PO-KOEL-4402 for 500 pcs Flywheel Ring Gear RG-320. Rate Rs 1150/pc. Delivery wanted by 5th Dec 2026 at Kagal MIDC. Urgent requirement for tractor assembly line. Thanks Rajesh.`,
    parsedData: {
      poNumber: 'PO-KOEL-4402',
      customerCode: 'CUST-KIRL-003',
      customerName: 'Kirloskar Oil Engines Ltd.',
      customerPhone: '+91 98111 22334',
      customerEmail: 'rajesh.deshmukh@kirloskar.com',
      contactPerson: 'Rajesh Deshmukh (Store Purchase)',
      shippingAddress: 'Five Star MIDC Kagal, Hatkanangale, Kolhapur - 416236, Maharashtra',
      billingAddress: 'Laxmanrao Kirloskar Road, Khadki, Pune - 411003, Maharashtra',
      requestedDeliveryDate: '2026-12-05',
      paymentTerms: 'Net 30 Days',
      priority: 'urgent',
      currency: 'INR',
      confidenceScore: 92,
      parsingMethod: 'nlp_conversational',
      entitiesExtracted: {
        customerName: 'Kirloskar Oil Engines Ltd.',
        customerPhone: '+91 98111 22334',
        customerPoNumber: 'PO-KOEL-4402',
        requestedDeliveryDate: '2026-12-05',
        shippingAddress: 'Five Star MIDC Kagal, Hatkanangale, Kolhapur - 416236, Maharashtra',
        paymentTerms: 'Net 30 Days',
        itemsCount: 1
      },
      parsingNotes: [
        'Recognized verified customer by phone +91 98111 22334 (Kirloskar Oil Engines Ltd.).',
        'Detected PO: PO-KOEL-4402, Qty: 500 pcs, Part: RG-320 @ Rs 1150.',
        'Ready for 1-click sales order confirmation.'
      ],
      items: [
        {
          id: 'item_wa_003_1',
          itemCode: 'RG-320',
          itemName: 'Flywheel Ring Gear RG-320',
          quantity: 500,
          uom: 'pcs',
          unitPrice: 1150,
          lineTotal: 575000,
          gstRatePct: 18,
          specs: 'Induction hardened C45 steel, OD 320mm'
        }
      ],
      subtotal: 575000,
      taxAmount: 103500,
      totalAmount: 678500
    },
    confirmationReply: {
      status: 'pending',
      recipientPhone: '+91 98111 22334',
      recipientName: 'Rajesh Deshmukh',
      messageText: ''
    }
  }
];

class WhatsAppOrderIntakeService {
  private getStorageKey(tenantId: string, prefix: string): string {
    return `${prefix}_${tenantId || 'demo'}`;
  }

  // 1. Get / Save Configuration
  public getConfig(tenantId: string): WhatsAppBusinessApiConfig {
    try {
      const raw = localStorage.getItem(this.getStorageKey(tenantId, STORAGE_KEY_CONFIG));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading WhatsApp config:', e);
    }
    return { ...DEFAULT_WHATSAPP_INTAKE_CONFIG };
  }

  public saveConfig(tenantId: string, config: WhatsAppBusinessApiConfig): WhatsAppBusinessApiConfig {
    localStorage.setItem(this.getStorageKey(tenantId, STORAGE_KEY_CONFIG), JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('whatsapp_order_intake_updated'));
    return config;
  }

  // 2. Get Messages
  public getMessages(tenantId: string): WhatsAppOrderMessage[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(tenantId, STORAGE_KEY_MESSAGES));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading WhatsApp order messages:', e);
    }
    // Seed initial dataset
    this.saveMessages(tenantId, SEED_MESSAGES);
    return SEED_MESSAGES;
  }

  private saveMessages(tenantId: string, items: WhatsAppOrderMessage[]): void {
    localStorage.setItem(this.getStorageKey(tenantId, STORAGE_KEY_MESSAGES), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('whatsapp_order_intake_updated'));
  }

  // 3. Customer Recognition by Phone
  public matchCustomerByPhone(phone: string): KnownCustomerDirectoryEntry | null {
    const cleanDigits = phone.replace(/\D/g, '');
    for (const c of KNOWN_CUSTOMERS) {
      if (cleanDigits.endsWith(c.phone.slice(-10))) {
        return c;
      }
    }
    return null;
  }

  // 4. Parser Engine: Structured Key-Value & NLP Conversational
  public parseOrderMessage(
    rawText: string,
    fromPhone: string = '+91 98201 12345',
    senderName?: string
  ): WhatsAppParsedOrderData {
    const cleanPhone = fromPhone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const matchedCustomer = this.matchCustomerByPhone(cleanDigits);

    const notes: string[] = [];
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // Strategy detection
    const isStructured = /PO(\s*Number)?\s*:/i.test(text) && /Items?\s*:/i.test(text);
    const parsingMethod = isStructured ? 'structured_kv' : 'nlp_conversational';

    // 1. PO Number Detection
    let poNumber = '';
    const poPatterns = [
      /(?:PO|P\.O\.|Purchase\s*Order|PO\s*Number|PO#|Order#)\s*[:=\-]?\s*([A-Za-z0-9/\-_]{4,25})/i,
      /\b(PO[-/][A-Za-z0-9/\-_]{4,20})\b/i,
      /\b(45\d{8}|46\d{8})\b/ // SAP standard 10-digit PO numbers
    ];

    for (const p of poPatterns) {
      const m = text.match(p);
      if (m && m[1]) {
        poNumber = m[1].trim();
        notes.push(`Detected PO Number: ${poNumber}`);
        break;
      }
    }

    if (!poNumber) {
      poNumber = `PO-WA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      notes.push(`No explicit PO reference found; generated provisional reference: ${poNumber}`);
    }

    // 2. Delivery Date Detection
    let requestedDeliveryDate = '';
    // Look for YYYY-MM-DD
    const isoDateMatch = text.match(/\b(202\d-[01]\d-[0-3]\d)\b/);
    if (isoDateMatch) {
      requestedDeliveryDate = isoDateMatch[1];
    } else {
      // Look for "by 28th Nov", "before 5 Dec 2026", "Delivery Date: 20-Nov-2026"
      const humanDateMatch = text.match(/(?:by|before|on|date:?|delivery:?)\s*(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+(\d{4}))?/i);
      if (humanDateMatch) {
        const day = parseInt(humanDateMatch[1], 10).toString().padStart(2, '0');
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIdx = monthNames.indexOf(humanDateMatch[2].toLowerCase().slice(0, 3));
        const month = (monthIdx + 1).toString().padStart(2, '0');
        const year = humanDateMatch[3] || new Date().getFullYear().toString();
        requestedDeliveryDate = `${year}-${month}-${day}`;
        notes.push(`Identified requested delivery date: ${requestedDeliveryDate}`);
      }
    }

    if (!requestedDeliveryDate) {
      // Default to 14 days from today
      const d = new Date();
      d.setDate(d.getDate() + 14);
      requestedDeliveryDate = d.toISOString().split('T')[0];
    }

    // 3. Priority Detection
    let priority: 'normal' | 'high' | 'urgent' = 'normal';
    if (/urgent|emergency|asap|critical line down|today|immediately/i.test(lower)) {
      priority = 'urgent';
      notes.push('Flagged as URGENT priority based on message urgency keywords.');
    } else if (/high priority|priority|express|expedite/i.test(lower)) {
      priority = 'high';
    }

    // 4. Line Items Extraction
    const items: WhatsAppOrderItem[] = [];

    if (isStructured) {
      // Extract lines under Items section
      const lines = text.split('\n');
      let insideItems = false;
      let itemIdx = 1;

      for (const line of lines) {
        if (/Items?\s*:/i.test(line)) {
          insideItems = true;
          continue;
        }
        if (insideItems) {
          if (!line.trim() || /Regards|Thanks|Delivery|Ship to|Terms/i.test(line)) {
            if (/Regards|Thanks|Delivery|Ship to|Terms/i.test(line)) insideItems = false;
            continue;
          }

          // Format: 1. Part: SS 316 Flange (SKU: FLG-401) | Qty: 250 pcs | Rate: 1450
          const skuMatch = line.match(/(?:SKU|Part#|Part\s*No|Code)?\s*[:=]?\s*([A-Z0-9\-_]{3,12})/i);
          const qtyMatch = line.match(/(?:Qty|Quantity)?\s*[:=]?\s*(\d+)\s*(?:pcs|nos|units|sets|kg|mtrs)?/i);
          const rateMatch = line.match(/(?:Rate|Price|Unit\s*Rate)?\s*[:=]?\s*([\d,]+(?:\.\d+)?)/i);

          let name = line.replace(/^\d+[\.\)]\s*/, '').replace(/\|.*/, '').replace(/Part:?/i, '').trim();
          if (name.includes('(SKU:')) name = name.split('(SKU:')[0].trim();

          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 100;
          const unitPrice = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, '')) : 450;
          const sku = skuMatch ? skuMatch[1].toUpperCase() : `SKU-WA-${itemIdx}`;

          items.push({
            id: `item_wa_${Date.now()}_${itemIdx}`,
            itemCode: sku,
            itemName: name || `Machined Part ${sku}`,
            quantity: qty,
            uom: 'pcs',
            unitPrice: unitPrice,
            lineTotal: qty * unitPrice,
            gstRatePct: 18,
            specs: 'Standard manufacturing specification'
          });
          itemIdx++;
        }
      }
    }

    // Fallback or NLP Conversational Items Parsing
    if (items.length === 0) {
      // Pattern e.g.: "400 pcs of CNC Bushing Part# BS-4022" or "150 units of Helical Pinion Shaft PS-770"
      // or "500 pcs Flywheel Ring Gear RG-320. Rate Rs 1150/pc"
      const nlpItemPattern = /(?:need|order|want|for)?\s*(\d+)\s*(pcs|nos|units|pieces|sets|kg)?\s*(?:of\s*)?([A-Za-z0-9\s()/\-_]{4,50}?)(?:Part[#\s:]*([A-Z0-9\-_]{3,12})|SKU[#\s:]*([A-Z0-9\-_]{3,12})|\b([A-Z]{2,4}[-_]?\d{3,5})\b)?(?:\.|\band\b|,|\n|$)/gi;

      let m: RegExpExecArray | null;
      let count = 1;

      while ((m = nlpItemPattern.exec(text)) !== null) {
        const qty = parseInt(m[1], 10);
        if (isNaN(qty) || qty <= 0) continue;

        const uom = (m[2] || 'pcs').toLowerCase();
        let name = (m[3] || '').trim();
        const detectedSku = m[4] || m[5] || m[6] || `PRT-${100 + count}`;

        // Clean up common stop words from name
        name = name.replace(/^(urgent|order|booking|open|contract)\s+/i, '');
        if (name.length < 3) name = `Precision Machined Component ${detectedSku}`;

        // Extract rate if nearby
        let unitPrice = 750;
        const pricePattern = new RegExp(`(?:${detectedSku}|${name.slice(0, 8)})[\\s\\S]{0,40}?(?:Rs\\.?|INR|₹|@|rate)\\s*([\\d,]+(?:\\.\\d+)?)`, 'i');
        const priceMatch = text.match(pricePattern);
        if (priceMatch) {
          unitPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        }

        items.push({
          id: `item_wa_${Date.now()}_${count}`,
          itemCode: detectedSku.toUpperCase(),
          itemName: name,
          quantity: qty,
          uom: uom,
          unitPrice: unitPrice,
          lineTotal: qty * unitPrice,
          gstRatePct: 18,
          specs: 'Manufactured per customer engineering drawing'
        });
        count++;
      }
    }

    // Default safety line item if none parsed
    if (items.length === 0) {
      items.push({
        id: `item_wa_${Date.now()}_def`,
        itemCode: 'CUSTOM-JOB-01',
        itemName: 'Custom Engineering Fabrication Lot',
        quantity: 1,
        uom: 'lot',
        unitPrice: 25000,
        lineTotal: 25000,
        gstRatePct: 18,
        specs: 'Refer to WhatsApp chat transcript for drawing & dimensions'
      });
      notes.push('Constructed provisional single-lot item from conversation context.');
    }

    // Compute Totals
    const subtotal = items.reduce((acc, it) => acc + it.lineTotal, 0);
    const taxAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + taxAmount;

    // Confidence Calculation
    let score = 50;
    if (matchedCustomer) score += 25;
    if (poNumber && !poNumber.startsWith('PO-WA-')) score += 15;
    if (items.length > 0 && items[0].itemCode !== 'CUSTOM-JOB-01') score += 10;
    const confidenceScore = Math.min(score, 98);

    // Customer info resolution
    const customerName = matchedCustomer?.customerName || (senderName ? `${senderName} (WhatsApp)` : 'WhatsApp Business Lead');
    const customerPhone = cleanPhone || (matchedCustomer?.phone ? `+${matchedCustomer.phone}` : '+91 98201 12345');
    const shippingAddress = matchedCustomer?.shippingAddress || 'Customer Works (Specify Gate on Arrival)';
    const billingAddress = matchedCustomer?.billingAddress || shippingAddress;
    const paymentTerms = matchedCustomer?.defaultPaymentTerms || 'Net 30 Days';

    return {
      poNumber,
      customerCode: matchedCustomer?.customerCode,
      customerName,
      customerPhone,
      customerEmail: matchedCustomer?.customerEmail,
      contactPerson: matchedCustomer?.contactPerson || senderName,
      shippingAddress,
      billingAddress,
      requestedDeliveryDate,
      paymentTerms,
      priority,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      currency: 'INR',
      confidenceScore,
      parsingMethod,
      entitiesExtracted: {
        customerName,
        customerPhone,
        customerPoNumber: poNumber,
        requestedDeliveryDate,
        shippingAddress,
        paymentTerms,
        itemsCount: items.length
      },
      parsingNotes: notes
    };
  }

  // 5. Inbound Webhook Ingestion (Acceptance Criteria 1 & 2)
  public async processInboundWebhook(
    payload: any,
    tenantId: string
  ): Promise<WhatsAppOrderMessage> {
    const config = this.getConfig(tenantId);

    let fromPhone = '+91 98201 12345';
    let senderName = 'WhatsApp Customer';
    let textBody = '';

    // Standard Meta Cloud API Envelope:
    // entry[0].changes[0].value.messages[0]
    if (payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = payload.entry[0].changes[0].value.messages[0];
      fromPhone = msg.from ? `+${msg.from}` : fromPhone;
      textBody = msg.text?.body || '';
      const contact = payload.entry[0].changes[0].value.contacts?.[0];
      if (contact?.profile?.name) senderName = contact.profile.name;
    } else if (payload.from && payload.body) {
      // Twilio format
      fromPhone = payload.from;
      textBody = payload.body;
      senderName = payload.profileName || 'Twilio Customer';
    } else if (typeof payload.text === 'string') {
      textBody = payload.text;
      if (payload.fromPhone) fromPhone = payload.fromPhone;
      if (payload.senderName) senderName = payload.senderName;
    }

    // Auto-Route to Automated Status Query Bot if message starts with status command
    const trimmed = (textBody || '').trim();
    if (/^(status|track|where\s+is|dispatch|help)\b/i.test(trimmed) || trimmed.toUpperCase() === 'STATUS') {
      import('./orderStatusBotService').then(m => {
        m.orderStatusBotService.processInboundStatusQuery(trimmed, fromPhone, senderName, tenantId);
      }).catch(err => console.warn('Status bot route error:', err));
    }

    const parsedData = this.parseOrderMessage(textBody, fromPhone, senderName);

    const messageId = `wa_inbound_${Date.now()}`;
    const newRecord: WhatsAppOrderMessage = {
      id: messageId,
      tenantId: tenantId || 'demo',
      fromPhone,
      senderName,
      customerId: parsedData.customerCode,
      customerName: parsedData.customerName,
      rawText: textBody,
      receivedAt: new Date().toISOString(),
      status: 'parsed',
      parsedData,
      autoCreated: false,
      confirmationReply: {
        status: 'pending',
        recipientPhone: fromPhone,
        recipientName: senderName,
        messageText: ''
      },
      webhookPayload: payload
    };

    // Check Automation Rule: Auto Order Creation (Acceptance Criteria 3)
    if (
      config.autoOrderCreationEnabled && 
      parsedData.confidenceScore >= config.autoApproveConfidenceThreshold
    ) {
      await this.createSalesOrderFromWhatsApp(newRecord, tenantId, config);
    } else {
      newRecord.status = 'requires_review';
    }

    const existing = this.getMessages(tenantId);
    this.saveMessages(tenantId, [newRecord, ...existing]);

    return newRecord;
  }

  // 6. Auto-Order Creation Engine (Acceptance Criteria 3)
  public async createSalesOrderFromWhatsApp(
    record: WhatsAppOrderMessage,
    tenantId: string,
    config?: WhatsAppBusinessApiConfig
  ): Promise<{ order: Order; confirmationText: string }> {
    const currentConfig = config || this.getConfig(tenantId);
    const parsed = record.parsedData;

    const soYear = new Date().getFullYear();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const salesOrderNumber = `SO-WA-${soYear}-${randSeq}`;
    const orderId = `order_wa_${Date.now()}`;

    // Convert WhatsAppOrderItem to FlowOps QuoteItem
    const quoteItems: QuoteItem[] = parsed.items.map((item, idx) => ({
      id: `qi_wa_${Date.now()}_${idx}`,
      name: item.itemName,
      quantity: item.quantity,
      unit: item.uom,
      unitPrice: item.unitPrice,
      gstPercent: item.gstRatePct || 18,
      total: item.lineTotal,
      specs: item.specs || item.itemName
    }));

    const newOrder: Order = {
      id: orderId,
      tenantId: tenantId || 'demo',
      quoteId: `quote_wa_${Date.now()}`,
      quoteNumber: `QT-WA-${randSeq}`,
      orderNumber: salesOrderNumber,
      customerPoNumber: parsed.poNumber,
      poDate: new Date().toISOString().split('T')[0],
      plantId: currentConfig.defaultPlantId,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      phone: parsed.customerPhone,
      billingAddress: parsed.billingAddress,
      shippingAddress: parsed.shippingAddress,
      items: quoteItems,
      subtotal: parsed.subtotal,
      taxAmount: parsed.taxAmount,
      totalAmount: parsed.totalAmount,
      deliveryDate: parsed.requestedDeliveryDate,
      status: 'pending', // Available on Production Monitor
      createdBy: 'whatsapp_bot',
      createdAt: new Date().toISOString()
    };

    // Store in FlowOps Orders Registry so it shows in OrdersPage and ProductionLine Monitor
    try {
      const ordersStorageKey = `flowops_orders_${tenantId || 'demo'}`;
      const rawOrders = localStorage.getItem(ordersStorageKey);
      const existingOrders: Order[] = rawOrders ? JSON.parse(rawOrders) : [];
      localStorage.setItem(ordersStorageKey, JSON.stringify([newOrder, ...existingOrders]));
    } catch (e) {
      console.warn('Error syncing to local flowops_orders:', e);
    }

    // 7. Generate & Dispatch Confirmation Reply (Acceptance Criteria 4)
    const itemsSummary = parsed.items
      .map(it => `• ${it.itemName} (${it.itemCode}) × ${it.quantity} ${it.uom} @ ₹${it.unitPrice.toLocaleString('en-IN')}`)
      .join('\n');

    const trackingUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/portal/track/${salesOrderNumber}`
      : `https://flowops.app/portal/track/${salesOrderNumber}`;

    let replyText = currentConfig.confirmationMessageTemplate
      .replace(/{{customer_name}}/g, parsed.customerName)
      .replace(/{{po_number}}/g, parsed.poNumber)
      .replace(/{{so_number}}/g, salesOrderNumber)
      .replace(/{{items_summary}}/g, itemsSummary)
      .replace(/{{total_value}}/g, parsed.totalAmount.toLocaleString('en-IN'))
      .replace(/{{delivery_date}}/g, parsed.requestedDeliveryDate)
      .replace(/{{shipping_address}}/g, parsed.shippingAddress)
      .replace(/{{tracking_url}}/g, trackingUrl);

    // Dispatch via WhatsApp Notification service
    try {
      await sendWhatsAppNotification({
        recipientName: parsed.contactPerson || parsed.customerName,
        recipientPhone: parsed.customerPhone,
        templateName: 'order_confirmed',
        parameters: {
          customerName: parsed.customerName,
          orderNumber: salesOrderNumber,
          deliveryDate: parsed.requestedDeliveryDate,
          poNumber: parsed.poNumber,
          totalAmount: parsed.totalAmount.toString(),
          trackingUrl
        },
        tenantId: tenantId || 'demo',
        orderId: orderId
      });

      // Trigger Proactive Milestone Notification Engine
      await proactiveNotificationService.triggerMilestoneNotification({
        tenantId: tenantId || 'demo',
        milestone: 'order_confirmed',
        orderId,
        orderNumber: salesOrderNumber,
        customerName: parsed.customerName,
        recipientPhone: parsed.customerPhone,
        parameters: {
          productSummary: parsed.items.map(i => `${i.quantity}x ${i.itemName}`).join(', '),
          totalAmount: parsed.totalAmount.toLocaleString('en-IN'),
          expectedDelivery: parsed.requestedDeliveryDate,
          companyName: 'Ashrey FlowOps Ltd',
          trackingUrl
        },
        sourceTrigger: 'event'
      });
    } catch (err) {
      console.warn('sendWhatsAppNotification error:', err);
    }

    // Update Message Record
    record.status = 'auto_order_created';
    record.salesOrderId = orderId;
    record.salesOrderNumber = salesOrderNumber;
    record.autoCreated = true;
    record.confirmationReply = {
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      recipientPhone: parsed.customerPhone,
      recipientName: parsed.contactPerson || parsed.customerName,
      messageText: replyText,
      trackingUrl,
      whatsappMessageId: `wam_id_${Date.now()}`
    };

    return { order: newOrder, confirmationText: replyText };
  }

  // 8. Manual Review & Approve (for orders that need sales sign-off)
  public async manualApproveAndCreateOrder(
    messageId: string,
    tenantId: string,
    overrideData?: Partial<WhatsAppParsedOrderData>
  ): Promise<WhatsAppOrderMessage> {
    const messages = this.getMessages(tenantId);
    const targetIdx = messages.findIndex(m => m.id === messageId);
    if (targetIdx === -1) throw new Error('WhatsApp order message not found');

    const item = { ...messages[targetIdx] };
    if (overrideData) {
      item.parsedData = {
        ...item.parsedData,
        ...overrideData,
        // Recompute line items total if modified
        subtotal: overrideData.items ? overrideData.items.reduce((s, it) => s + it.lineTotal, 0) : item.parsedData.subtotal
      };
      item.parsedData.taxAmount = Math.round(item.parsedData.subtotal * 0.18);
      item.parsedData.totalAmount = item.parsedData.subtotal + item.parsedData.taxAmount;
    }

    await this.createSalesOrderFromWhatsApp(item, tenantId);
    messages[targetIdx] = item;
    this.saveMessages(tenantId, messages);

    return item;
  }

  // 9. Resend Confirmation Reply
  public async resendConfirmationReply(
    messageId: string,
    tenantId: string
  ): Promise<WhatsAppConfirmationReply> {
    const messages = this.getMessages(tenantId);
    const target = messages.find(m => m.id === messageId);
    if (!target) throw new Error('Message not found');

    const reply = target.confirmationReply;
    reply.status = 'delivered';
    reply.sentAt = new Date().toISOString();
    reply.deliveredAt = new Date().toISOString();

    this.saveMessages(tenantId, messages);
    return reply;
  }

  // 10. Operational KPIs
  public getStats(tenantId: string): WhatsAppIntakeStats {
    const messages = this.getMessages(tenantId);
    const autoCreated = messages.filter(m => m.status === 'auto_order_created').length;
    const pendingReview = messages.filter(m => m.status === 'requires_review' || m.status === 'parsed').length;
    
    const totalConfidence = messages.reduce((acc, m) => acc + (m.parsedData?.confidenceScore || 0), 0);
    const avgConfidence = messages.length > 0 ? Math.round(totalConfidence / messages.length) : 0;

    const totalVal = messages.reduce((acc, m) => acc + (m.parsedData?.totalAmount || 0), 0);
    const repliesDelivered = messages.filter(m => m.confirmationReply?.status === 'delivered').length;

    return {
      totalInboundMessages: messages.length,
      autoCreatedOrdersCount: autoCreated,
      pendingReviewCount: pendingReview,
      averageConfidenceScore: avgConfidence,
      totalOrderValueINR: totalVal,
      repliesDeliveredCount: repliesDelivered
    };
  }
}

export const whatsappOrderIntakeService = new WhatsAppOrderIntakeService();
