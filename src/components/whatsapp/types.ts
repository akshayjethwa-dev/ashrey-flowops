// src/components/whatsapp/types.ts

export type ApprovalRequestType = 'purchase_order' | 'quote' | 'discount';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revised';
export type ApprovalUrgency = 'normal' | 'urgent' | 'critical';

export interface WhatsAppQuickButton {
  id: string;
  label: string;
  action: 'approve' | 'reject' | 'revise';
  style: 'primary' | 'destructive' | 'secondary';
}

export interface WhatsAppApprovalRequest {
  id: string;
  tenantId: string;
  requestType: ApprovalRequestType;
  referenceId: string;          // e.g., 'PO-2026-902', 'QT-2026-0812', 'DISC-REQ-104'
  title: string;                // e.g., 'High-Value Raw Material Purchase Order'
  entityName: string;           // Customer or Supplier Name
  amount: number;
  discountPercent?: number;     // For quotes / discount approvals (e.g. 18%)
  requestedBy: {
    name: string;
    role: string;
    phone: string;
    email?: string;
  };
  approverRole: 'manager' | 'management' | 'admin';
  approverName: string;
  approverPhone: string;
  urgency: ApprovalUrgency;
  justification: string;
  status: ApprovalStatus;
  wamid: string;
  quickActionButtons: WhatsAppQuickButton[];
  actionTakenAt?: string;
  actionTakenBy?: {
    name: string;
    role: string;
    phone: string;
  };
  actionComments?: string;
  createdAt: string;
}

export interface WhatsAppApprovalAuditEntry {
  id: string;
  tenantId: string;
  requestId: string;
  requestType: ApprovalRequestType;
  referenceId: string;
  title: string;
  amount: number;
  approverName: string;
  approverPhone: string;
  approverRole: string;
  action: 'approved' | 'rejected' | 'revised';
  channel: 'whatsapp_interactive_button' | 'whatsapp_command_reply' | 'web_override';
  timestamp: string;
  comments: string;
  wamid: string;
  auditHash: string;
}

export interface WhatsAppApprovalStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalApprovedValue: number;
  avgResponseTimeMinutes: number;
  responseRatePercent: number;
}

// ── Document Sharing Types ──────────────────────────────────────────

export type SharedDocType = 'tax_invoice' | 'delivery_note' | 'quality_certificate';
export type DocDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppSharedDocument {
  id: string;
  tenantId: string;
  docType: SharedDocType;
  docNumber: string;            // e.g. 'INV-2026-0914', 'DN-2026-0442', 'QC-2026-0182'
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderNumber?: string;
  totalAmount?: number;
  itemCount: number;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;    // e.g. '142 KB'
  pdfDataUrl?: string;
  status: DocDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  downloadCount: number;
  wamid: string;
  notes?: string;
  meta: Record<string, any>;     // Document-specific payload (transporter, heatNumber, etc.)
}

export interface WhatsAppDocSharingStats {
  totalSent: number;
  invoicesCount: number;
  deliveryNotesCount: number;
  qualityCertsCount: number;
  deliveredRatePercent: number;
  readRatePercent: number;
  avgDeliverySeconds: number;
}
