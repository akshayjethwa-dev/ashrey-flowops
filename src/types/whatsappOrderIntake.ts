// src/types/whatsappOrderIntake.ts

export type ParsingMethod = 'structured_kv' | 'nlp_conversational' | 'hybrid';

export type WhatsAppIntakeStatus = 
  | 'received' 
  | 'parsed' 
  | 'auto_order_created' 
  | 'requires_review' 
  | 'rejected';

export type ConfirmationReplyStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface WhatsAppOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string; // 'pcs' | 'nos' | 'sets' | 'kg' | 'meters'
  unitPrice: number;
  lineTotal: number;
  gstRatePct: number;
  specs?: string;
  matchedStockItemId?: string;
}

export interface ExtractedEntities {
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerPoNumber?: string;
  requestedDeliveryDate?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  specialInstructions?: string;
  itemsCount: number;
}

export interface WhatsAppParsedOrderData {
  poNumber: string;
  customerCode?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  contactPerson?: string;
  shippingAddress: string;
  billingAddress: string;
  requestedDeliveryDate: string;
  paymentTerms: string;
  priority: 'normal' | 'high' | 'urgent';
  items: WhatsAppOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string; // 'INR'
  confidenceScore: number; // 0 - 100
  parsingMethod: ParsingMethod;
  entitiesExtracted: ExtractedEntities;
  parsingNotes: string[];
}

export interface WhatsAppConfirmationReply {
  status: ConfirmationReplyStatus;
  sentAt?: string;
  deliveredAt?: string;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  trackingUrl?: string;
  whatsappMessageId?: string;
  templateName?: string;
}

export interface WhatsAppOrderMessage {
  id: string;
  tenantId: string;
  fromPhone: string;
  senderName: string;
  customerId?: string;
  customerName: string;
  rawText: string;
  receivedAt: string;
  status: WhatsAppIntakeStatus;
  
  // Parsed representation
  parsedData: WhatsAppParsedOrderData;

  // Generated FlowOps Sales Order reference
  salesOrderId?: string;
  salesOrderNumber?: string;
  workOrderIds?: string[];
  autoCreated: boolean;
  reviewedBy?: string;
  reviewedAt?: string;

  // Automated Confirmation Reply back to Customer WhatsApp
  confirmationReply: WhatsAppConfirmationReply;

  // Meta Webhook Diagnostics
  webhookPayload?: Record<string, any>;
}

export interface WhatsAppBusinessApiConfig {
  provider: 'meta_cloud_api' | 'aisensy' | 'interakt' | 'twilio';
  phoneNumberId: string;
  businessAccountId: string;
  senderPhoneNumber: string;
  apiToken: string;
  webhookCallbackUrl: string;
  webhookVerifyToken: string;
  appSecret: string;
  isWebhookActive: boolean;
  
  // Automation settings
  autoOrderCreationEnabled: boolean;
  autoApproveConfidenceThreshold: number; // e.g. 80
  autoSendConfirmationReply: boolean;
  defaultPlantId: string;
  defaultPaymentTerms: string;
  alertOnHighPriorityOrders: boolean;
  itAdminAlertPhone: string;
  
  // Reply Template
  confirmationMessageTemplate: string;
}

export interface WhatsAppIntakeStats {
  totalInboundMessages: number;
  autoCreatedOrdersCount: number;
  pendingReviewCount: number;
  averageConfidenceScore: number;
  totalOrderValueINR: number;
  repliesDeliveredCount: number;
}
