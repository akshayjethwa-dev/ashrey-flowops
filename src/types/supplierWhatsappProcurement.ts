// src/types/supplierWhatsappProcurement.ts

export type SupplierRfqStatus = 
  | 'draft' 
  | 'broadcasted' 
  | 'quotes_received' 
  | 'awarded' 
  | 'cancelled';

export interface SupplierRfqItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  materialGrade?: string;
  targetPrice?: number;
  technicalSpecs?: string;
}

export interface SupplierRfqRecipient {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  category?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'quoted' | 'declined';
  broadcastedAt?: string;
  wamid?: string;
}

export interface SupplierParsedQuote {
  id: string;
  rfqId: string;
  rfqNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  rawReplyMessage: string;
  quotedUnitPrice: number;
  quotedTotalAmount: number;
  quotedLeadTimeDays: number;
  promisedDeliveryDate: string;
  moq: number;
  paymentTerms: string;
  taxTerms: string;
  freightTerms: string;
  confidenceScore: number; // 0 - 100%
  parsingMethod: 'structured_command' | 'nlp_regex' | 'manual_review';
  receivedAt: string;
  status: 'received' | 'selected_awarded' | 'rejected';
  notes?: string;
}

export interface SupplierRfq {
  id: string;
  tenantId: string;
  rfqNumber: string; // e.g. "SRFQ-2026-0812"
  title: string;
  category: string;
  targetDeliveryDate: string;
  submissionDeadline: string;
  status: SupplierRfqStatus;
  items: SupplierRfqItem[];
  recipients: SupplierRfqRecipient[];
  quotes: SupplierParsedQuote[];
  awardedSupplierId?: string;
  awardedPoNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPoDeliveryRecord {
  id: string;
  tenantId: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  pdfFileName: string;
  pdfUrl?: string;
  dispatchedAt: string;
  wamid: string;
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'read';
  summaryMessage: string;
  totalAmount: number;
  expectedDeliveryDate: string;
}

export interface SupplierAcknowledgmentRecord {
  id: string;
  tenantId: string;
  poId: string;
  poNumber: string;
  supplierName: string;
  supplierPhone: string;
  rawReplyText: string;
  ackStatus: 'acknowledged_on_time' | 'counter_proposed_date' | 'rejected_by_supplier';
  confirmedDeliveryDate: string;
  vendorConfirmationRef?: string;
  acknowledgedByName: string;
  notes?: string;
  receivedAt: string;
  systemUpdated: boolean;
  replyConfirmationSent: boolean;
}

export interface ProcurementWhatsappStats {
  activeRfqsCount: number;
  broadcastsSentCount: number;
  quotesReceivedCount: number;
  posDispatchedWithPdfCount: number;
  acknowledgmentsCount: number;
  ackRatePercent: number;
  avgQuoteTimeHours: number;
}
