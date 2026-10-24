// src/services/whatsappDocSharingService.ts

import { 
  WhatsAppSharedDocument, 
  WhatsAppDocSharingStats, 
  SharedDocType, 
  DocDeliveryStatus 
} from './types';
import { 
  TaxInvoiceData, 
  DeliveryNoteData, 
  QualityCertificateData,
  getInvoicePdfDataUrl,
  getDeliveryNotePdfDataUrl,
  getQualityCertPdfDataUrl,
  downloadInvoicePdf,
  downloadDeliveryNotePdf,
  downloadQualityCertPdf
} from './pdfGenerators';
import { sendWhatsAppNotification } from '../../utils/whatsapp';

const STORAGE_KEYS = {
  DOCS: (tenantId: string) => `flowops_wa_shared_docs_${tenantId}`
};

export const SEED_INVOICE_DATA: TaxInvoiceData = {
  invoiceNumber: 'INV-2026-0914',
  invoiceDate: '2026-10-18',
  dueDate: '2026-11-17',
  orderNumber: 'ORD-2026-0812',
  customerName: 'Gujarat Lathe Corporation',
  customerGstin: '24AAACG1928F1ZR',
  customerPan: 'AAACG1928F',
  billingAddress: 'GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad - 382445, Gujarat, India',
  shippingAddress: 'Plot 48, GIDC Sheds, Phase 2, Vatva, Ahmedabad - 382445',
  stateCode: '24 - Gujarat (Interstate IGST)',
  items: [
    {
      itemCode: 'CR-450-EN8',
      description: 'Precision Machined EN8 Normalized Steel Gear Rings Dia 450mm',
      hsnCode: '8483.40.00',
      quantity: 200,
      unit: 'pcs',
      rate: 1850,
      discountPct: 5,
      taxableAmount: 351500,
      gstRate: 18,
      totalAmount: 414770
    },
    {
      itemCode: 'FLG-100-SS',
      description: 'Forged Heavy Duty Carbon Steel Flanges Class 150 ANSI B16.5',
      hsnCode: '7307.21.00',
      quantity: 50,
      unit: 'pcs',
      rate: 2200,
      discountPct: 0,
      taxableAmount: 110000,
      gstRate: 18,
      totalAmount: 129800
    }
  ],
  subtotal: 461500,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 83070,
  totalAmount: 544570,
  notes: 'Payment required within 30 days via RTGS/NEFT. Standard warranties apply.'
};

export const SEED_DELIVERY_NOTE_DATA: DeliveryNoteData = {
  deliveryNoteNumber: 'DN-2026-0442',
  date: '2026-10-19',
  orderNumber: 'ORD-2026-0812',
  customerName: 'Gujarat Lathe Corporation',
  customerPhone: '+91 98201 54321',
  shippingAddress: 'Plot 48, GIDC Sheds, Phase 2, Vatva, Ahmedabad - 382445',
  transporterName: 'V-Trans Express Logistics',
  vehicleNumber: 'MH-12-RN-8842',
  lrNumber: 'LR-VTX-PUN-99418',
  ewayBillNumber: '281099238814',
  packagesCount: 12,
  grossWeightKg: 1450,
  netWeightKg: 1380,
  items: [
    {
      cartonNo: 'BOX-01 to 08',
      itemCode: 'CR-450-EN8',
      description: 'Precision Machined EN8 Normalized Steel Gear Rings',
      quantity: 200,
      unit: 'pcs',
      lotNumber: 'LOT-EN8-2026-881'
    },
    {
      cartonNo: 'BOX-09 to 12',
      itemCode: 'FLG-100-SS',
      description: 'Forged Heavy Duty Carbon Steel Flanges Class 150',
      quantity: 50,
      unit: 'pcs',
      lotNumber: 'LOT-FLG-2026-104'
    }
  ],
  remarks: 'Seals verified intact at Plant Gate #2. Waterproof pallet wrap applied.'
};

export const SEED_QUALITY_CERT_DATA: QualityCertificateData = {
  certificateNumber: 'QC-2026-0182',
  date: '2026-10-18',
  customerName: 'Gujarat Lathe Corporation',
  orderNumber: 'ORD-2026-0812',
  partNumber: 'CR-450-EN8',
  partDescription: 'Precision Machined EN8 Normalized Steel Gear Rings Dia 450mm',
  materialGrade: 'EN8 / AISI 1040 Normalized',
  heatNumber: 'HEAT-TATA-9941',
  lotNumber: 'LOT-EN8-2026-881',
  quantityInspected: 200,
  unit: 'pcs',
  chemicalTests: [
    { element: 'Carbon (C)', specifiedMin: 0.35, specifiedMax: 0.45, observed: 0.392, status: 'pass' },
    { element: 'Manganese (Mn)', specifiedMin: 0.60, specifiedMax: 1.00, observed: 0.784, status: 'pass' },
    { element: 'Silicon (Si)', specifiedMin: 0.10, specifiedMax: 0.35, observed: 0.221, status: 'pass' },
    { element: 'Phosphorus (P)', specifiedMin: 0.00, specifiedMax: 0.05, observed: 0.024, status: 'pass' },
    { element: 'Sulphur (S)', specifiedMin: 0.00, specifiedMax: 0.05, observed: 0.019, status: 'pass' }
  ],
  mechanicalTests: [
    { testParameter: 'Tensile Strength (Rm)', specification: '600 - 750', observed: '675', unit: 'MPa', status: 'pass' },
    { testParameter: 'Yield Strength (Re)', specification: '≥ 320', observed: '385', unit: 'MPa', status: 'pass' },
    { testParameter: 'Elongation (A5)', specification: '≥ 16', observed: '19.4', unit: '%', status: 'pass' },
    { testParameter: 'Hardness', specification: '180 - 225', observed: '205', unit: 'BHN', status: 'pass' }
  ],
  visualAndNdt: {
    visualDefects: 'Zero cracks, burrs, or inclusions detected (100% Visual Level I)',
    ultrasonicTest: 'Class 1 UT Certified as per ASTM A388 (Pass)',
    surfaceRoughnessRa: '1.6 µm (Specified ≤ 2.0 µm)',
    straightness: '< 0.5 mm/m across full face width'
  },
  inspectorName: 'Ramesh Naik (Level II NDT Quality Inspector)',
  qaManagerName: 'Dr. K. S. Deshmukh (Head QA & Metallurgy)',
  disposition: 'PASSED & APPROVED FOR SHIPMENT'
};

export const SEED_SHARED_DOCS: WhatsAppSharedDocument[] = [
  {
    id: 'sdoc-1',
    tenantId: 'demo',
    docType: 'tax_invoice',
    docNumber: 'INV-2026-0914',
    title: 'Tax Invoice: Precision Gear Rings & Flanges',
    customerName: 'Gujarat Lathe Corporation',
    customerPhone: '+91 98201 54321',
    customerEmail: 'accounts@gujaratlathe.com',
    orderNumber: 'ORD-2026-0812',
    totalAmount: 544570,
    itemCount: 2,
    fileName: 'Tax_Invoice_INV-2026-0914.pdf',
    fileSizeBytes: 145400,
    fileSizeFormatted: '142 KB',
    status: 'read',
    sentAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 14 * 3600000 + 4000).toISOString(),
    readAt: new Date(Date.now() - 13 * 3600000).toISOString(),
    downloadCount: 3,
    wamid: 'wamid.HBgMOTkyMDE1NDMyMUC1FhIAEjkwODEx',
    notes: 'Sent upon commercial billing generation. Read by finance controller.',
    meta: {
      subtotal: 461500,
      igst: 83070,
      total: 544570
    }
  },
  {
    id: 'sdoc-2',
    tenantId: 'demo',
    docType: 'delivery_note',
    docNumber: 'DN-2026-0442',
    title: 'Outbound Delivery Challan & Gate Pass (12 Packages)',
    customerName: 'Gujarat Lathe Corporation',
    customerPhone: '+91 98201 54321',
    orderNumber: 'ORD-2026-0812',
    totalAmount: 544570,
    itemCount: 2,
    fileName: 'Delivery_Note_DN-2026-0442.pdf',
    fileSizeBytes: 132000,
    fileSizeFormatted: '129 KB',
    status: 'delivered',
    sentAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 3 * 3600000 + 3500).toISOString(),
    downloadCount: 1,
    wamid: 'wamid.HBgMOTkyMDE1NDMyMUC1FhIAEjkyODk0',
    notes: 'Vehicle MH-12-RN-8842 dispatched. Awaiting final receiving sign-off.',
    meta: {
      transporter: 'V-Trans Express',
      vehicle: 'MH-12-RN-8842',
      lrNumber: 'LR-VTX-PUN-99418'
    }
  },
  {
    id: 'sdoc-3',
    tenantId: 'demo',
    docType: 'quality_certificate',
    docNumber: 'QC-2026-0182',
    title: 'Certificate of Analysis (COA): EN8 Mechanical & Chemical Release',
    customerName: 'Gujarat Lathe Corporation',
    customerPhone: '+91 98201 54321',
    orderNumber: 'ORD-2026-0812',
    itemCount: 1,
    fileName: 'Quality_Certificate_QC-2026-0182.pdf',
    fileSizeBytes: 156000,
    fileSizeFormatted: '152 KB',
    status: 'read',
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 2 * 3600000 + 2800).toISOString(),
    readAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    downloadCount: 2,
    wamid: 'wamid.HBgMOTkyMDE1NDMyMUC1FhIAEjk0MzAy',
    notes: 'Level II NDT and UT Class 1 verified. Read by incoming QC engineer.',
    meta: {
      heatNumber: 'HEAT-TATA-9941',
      lotNumber: 'LOT-EN8-2026-881',
      disposition: 'PASSED'
    }
  }
];

class WhatsAppDocSharingService {
  /**
   * Retrieves all shared documents for tenant
   */
  public getDocuments(tenantId: string): WhatsAppSharedDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCS(tenantId));
      if (!stored) {
        this.saveDocuments(tenantId, SEED_SHARED_DOCS);
        return SEED_SHARED_DOCS;
      }
      return JSON.parse(stored);
    } catch {
      return SEED_SHARED_DOCS;
    }
  }

  /**
   * Saves documents to localStorage
   */
  public saveDocuments(tenantId: string, docs: WhatsAppSharedDocument[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCS(tenantId), JSON.stringify(docs));
  }

  /**
   * Formats the WhatsApp message text sent alongside the PDF attachment
   */
  public formatDocumentWhatsAppMessage(doc: WhatsAppSharedDocument): string {
    const typeLabel = doc.docType === 'tax_invoice' 
      ? '🧾 *OFFICIAL TAX INVOICE*' 
      : doc.docType === 'delivery_note' 
        ? '🚚 *DELIVERY CHALLAN & GATE PASS*' 
        : '🔬 *QUALITY CERTIFICATE (COA)*';

    const amtLine = doc.totalAmount 
      ? `\n• Total Amount: *₹${doc.totalAmount.toLocaleString('en-IN')}*` 
      : '';
    const orderLine = doc.orderNumber ? `\n• Order Ref: *${doc.orderNumber}*` : '';

    return `*${typeLabel}* [Ashrey FlowOps Ltd]
Dear *${doc.customerName}*,

Please find attached your official document:
• Doc No: *${doc.docNumber}*${orderLine}${amtLine}
• Attachment: *${doc.fileName}* (${doc.fileSizeFormatted})
• Status: *Digitally Signed & Validated*

_Tap the PDF below to view, verify, or download to your phone._
Thank you for partnering with FlowOps Manufacturing!`;
  }

  /**
   * Dispatches document via WhatsApp with client-side PDF generation
   */
  public async sendDocument(
    tenantId: string,
    payload: {
      docType: SharedDocType;
      docNumber: string;
      title: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      orderNumber?: string;
      totalAmount?: number;
      itemCount: number;
      meta?: Record<string, any>;
      customInvoiceData?: TaxInvoiceData;
      customDeliveryNoteData?: DeliveryNoteData;
      customQualityCertData?: QualityCertificateData;
    }
  ): Promise<WhatsAppSharedDocument> {
    const id = `sdoc-${Date.now()}`;
    const wamid = `wamid.HBgM${Math.floor(1000000000 + Math.random() * 9000000000)}C1FhIA${Math.random().toString(36).substr(2, 6)}`;
    
    // Generate real PDF Data URL
    let pdfDataUrl = '';
    let fileName = '';
    if (payload.docType === 'tax_invoice') {
      fileName = `Tax_Invoice_${payload.docNumber}.pdf`;
      const invData = payload.customInvoiceData || {
        ...SEED_INVOICE_DATA,
        invoiceNumber: payload.docNumber,
        customerName: payload.customerName,
        totalAmount: payload.totalAmount || SEED_INVOICE_DATA.totalAmount
      };
      pdfDataUrl = getInvoicePdfDataUrl(invData);
    } else if (payload.docType === 'delivery_note') {
      fileName = `Delivery_Note_${payload.docNumber}.pdf`;
      const dnData = payload.customDeliveryNoteData || {
        ...SEED_DELIVERY_NOTE_DATA,
        deliveryNoteNumber: payload.docNumber,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone
      };
      pdfDataUrl = getDeliveryNotePdfDataUrl(dnData);
    } else {
      fileName = `Quality_Certificate_${payload.docNumber}.pdf`;
      const qcData = payload.customQualityCertData || {
        ...SEED_QUALITY_CERT_DATA,
        certificateNumber: payload.docNumber,
        customerName: payload.customerName
      };
      pdfDataUrl = getQualityCertPdfDataUrl(qcData);
    }

    const newDoc: WhatsAppSharedDocument = {
      id,
      tenantId,
      docType: payload.docType,
      docNumber: payload.docNumber,
      title: payload.title,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      orderNumber: payload.orderNumber,
      totalAmount: payload.totalAmount,
      itemCount: payload.itemCount || 1,
      fileName,
      fileSizeBytes: Math.floor(130000 + Math.random() * 30000),
      fileSizeFormatted: `${Math.floor(130 + Math.random() * 30)} KB`,
      pdfDataUrl,
      status: 'sent',
      sentAt: new Date().toISOString(),
      downloadCount: 0,
      wamid,
      notes: 'Dispatched via WhatsApp Document Sharing Hub',
      meta: payload.meta || {}
    };

    // Trigger WhatsApp notification engine
    try {
      await sendWhatsAppNotification({
        recipientName: payload.customerName,
        recipientPhone: payload.customerPhone,
        templateName: payload.docType === 'tax_invoice' ? 'payment_reminder' : 'order_dispatched',
        parameters: {
          docNumber: payload.docNumber,
          customerName: payload.customerName,
          orderNumber: payload.orderNumber || '',
          amount: payload.totalAmount ? String(payload.totalAmount) : ''
        },
        tenantId
      });
    } catch (e) {
      console.warn('WhatsApp Notification dispatch fallback:', e);
    }

    const current = this.getDocuments(tenantId);
    const updated = [newDoc, ...current];
    this.saveDocuments(tenantId, updated);

    // Simulate realistic delivery receipt progression in background
    setTimeout(() => {
      this.updateStatus(tenantId, id, 'delivered');
    }, 2500);

    return newDoc;
  }

  /**
   * Updates delivery receipt status for a document
   */
  public updateStatus(tenantId: string, docId: string, status: DocDeliveryStatus): WhatsAppSharedDocument | null {
    const docs = this.getDocuments(tenantId);
    const target = docs.find(d => d.id === docId);
    if (!target) return null;

    target.status = status;
    if (status === 'delivered' && !target.deliveredAt) {
      target.deliveredAt = new Date().toISOString();
    }
    if (status === 'read' && !target.readAt) {
      target.readAt = new Date().toISOString();
      target.downloadCount += 1;
    }

    this.saveDocuments(tenantId, docs);
    return target;
  }

  /**
   * Increments download count
   */
  public recordDownload(tenantId: string, docId: string): void {
    const docs = this.getDocuments(tenantId);
    const target = docs.find(d => d.id === docId);
    if (target) {
      target.downloadCount += 1;
      if (target.status !== 'read') {
        target.status = 'read';
        target.readAt = new Date().toISOString();
      }
      this.saveDocuments(tenantId, docs);
    }
  }

  /**
   * Triggers download of the underlying document PDF
   */
  public downloadDocPdf(doc: WhatsAppSharedDocument): void {
    this.recordDownload(doc.tenantId, doc.id);
    if (doc.docType === 'tax_invoice') {
      downloadInvoicePdf({
        ...SEED_INVOICE_DATA,
        invoiceNumber: doc.docNumber,
        customerName: doc.customerName,
        totalAmount: doc.totalAmount || SEED_INVOICE_DATA.totalAmount
      }, doc.fileName);
    } else if (doc.docType === 'delivery_note') {
      downloadDeliveryNotePdf({
        ...SEED_DELIVERY_NOTE_DATA,
        deliveryNoteNumber: doc.docNumber,
        customerName: doc.customerName,
        customerPhone: doc.customerPhone
      }, doc.fileName);
    } else {
      downloadQualityCertPdf({
        ...SEED_QUALITY_CERT_DATA,
        certificateNumber: doc.docNumber,
        customerName: doc.customerName
      }, doc.fileName);
    }
  }

  /**
   * Returns aggregated statistics
   */
  public getStats(tenantId: string): WhatsAppDocSharingStats {
    const docs = this.getDocuments(tenantId);
    const totalSent = docs.length;
    const invoicesCount = docs.filter(d => d.docType === 'tax_invoice').length;
    const deliveryNotesCount = docs.filter(d => d.docType === 'delivery_note').length;
    const qualityCertsCount = docs.filter(d => d.docType === 'quality_certificate').length;
    const deliveredCount = docs.filter(d => d.status === 'delivered' || d.status === 'read').length;
    const readCount = docs.filter(d => d.status === 'read').length;

    return {
      totalSent,
      invoicesCount,
      deliveryNotesCount,
      qualityCertsCount,
      deliveredRatePercent: totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100,
      readRatePercent: totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 92,
      avgDeliverySeconds: 3.2
    };
  }
}

export const whatsappDocSharingService = new WhatsAppDocSharingService();
