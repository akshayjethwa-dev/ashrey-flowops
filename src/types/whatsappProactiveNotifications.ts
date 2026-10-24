// src/types/whatsappProactiveNotifications.ts

export type ProactiveMilestone = 
  | 'order_confirmed'
  | 'production_started'
  | 'qc_passed'
  | 'dispatched'
  | 'delivered';

export type MessageReceiptStatus = 
  | 'queued' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed';

export interface TemplateInteractiveButton {
  type: 'URL' | 'QUICK_REPLY';
  label: string;
  value: string;
}

export interface WhatsAppNotificationTemplate {
  id: string;
  milestone: ProactiveMilestone;
  name: string;
  code: string;
  language: 'en' | 'hi';
  headerText?: string;
  bodyTemplate: string;
  footerText?: string;
  buttons?: TemplateInteractiveButton[];
  variables: string[];
  isActive: boolean;
  sampleParameters: Record<string, string>;
}

export interface ProactiveNotificationLog {
  id: string;
  wamid: string;
  tenantId: string;
  milestone: ProactiveMilestone;
  orderId: string;
  orderNumber: string;
  customerName: string;
  recipientPhone: string;
  templateCode: string;
  templateName: string;
  renderedMessage: string;
  receiptStatus: MessageReceiptStatus;
  queuedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  failureReason?: string;
  parameters: Record<string, any>;
  sourceTrigger: 'event' | 'manual_test' | 'api';
}

export interface ProactiveNotificationConfig {
  tenantId: string;
  enabledMilestones: Record<ProactiveMilestone, boolean>;
  autoSimulateReceipts: boolean;
  deliveryDelaySeconds: number;
  readDelaySeconds: number;
  defaultSender: string;
  defaultLanguage: 'en' | 'hi';
  webhookSecret: string;
  sendDeliveryConfirmationWithPhoto: boolean;
}

export interface ProactiveNotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number; // percentage (0 - 100)
  readRate: number;     // percentage (0 - 100)
  avgTimeToReadSeconds: number;
  byMilestone: Record<ProactiveMilestone, number>;
  byStatus: Record<MessageReceiptStatus, number>;
}

export interface MilestoneEventPayload {
  tenantId: string;
  milestone: ProactiveMilestone;
  orderId: string;
  orderNumber: string;
  customerName: string;
  recipientPhone?: string;
  customerId?: string;
  parameters: {
    productSummary?: string;
    stageName?: string;
    stationName?: string;
    inspectorName?: string;
    qcScore?: string | number;
    cocNumber?: string;
    transporter?: string;
    lrNumber?: string;
    vehicleNumber?: string;
    expectedDelivery?: string;
    deliveryDate?: string;
    trackingUrl?: string;
    receivedBy?: string;
    deliveryRemarks?: string;
    companyName?: string;
    totalAmount?: string | number;
    [key: string]: any;
  };
  sourceTrigger?: 'event' | 'manual_test' | 'api';
}
