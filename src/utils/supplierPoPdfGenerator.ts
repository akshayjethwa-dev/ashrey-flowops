// src/utils/supplierPoPdfGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseOrder } from '../types/purchaseOrder';

export interface PoCompanyHeader {
  companyName: string;
  cin?: string;
  gstin?: string;
  pan?: string;
  address: string;
  phone: string;
  email: string;
}

export const DEFAULT_FLOWOPS_HEADER: PoCompanyHeader = {
  companyName: 'ASHREY FLOWOPS MANUFACTURING LTD',
  cin: 'U28113MH2026PLC091823',
  gstin: '27AABCU9603R1ZM',
  pan: 'AABCU9603R',
  address: 'Plot No. C-18/2, Chakan Industrial Area, Phase II MIDC, Pune - 410501, Maharashtra, India',
  phone: '+91 2135 684200 / +91 98201 12345',
  email: 'procurement@ashreyflowops.com'
};

/**
 * Converts numeric amount to Indian English currency words
 */
function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  const n = ('000000000' + Math.floor(num)).substr(-9);
  const crore = Number(n.substr(0, 2));
  const lakh = Number(n.substr(2, 2));
  const thousand = Number(n.substr(4, 2));
  const hundred = Number(n.substr(6, 1));
  const tens = Number(n.substr(7, 2));

  let str = '';

  if (crore > 0) {
    str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
  }
  if (lakh > 0) {
    str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
  }
  if (thousand > 0) {
    str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
  }
  if (hundred > 0) {
    str += a[hundred] + 'Hundred ';
  }
  if (tens > 0) {
    str += (str !== '' ? 'and ' : '') + (tens < 20 ? a[tens] : b[Math.floor(tens / 10)] + ' ' + a[tens % 10]);
  }

  return 'Rupees ' + str.trim() + ' Only';
}

/**
 * Builds standard compliant Indian B2B Purchase Order document
 */
export function buildPurchaseOrderPdfDoc(po: PurchaseOrder, company: PoCompanyHeader = DEFAULT_FLOWOPS_HEADER): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // 1. Top Decorative Brand Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500 accent stripe
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Company Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Precision Engineering & Foundry Division • ISO 9001:2015 Certified', 14, 18);
  doc.text(`GSTIN: ${company.gstin} | PAN: ${company.pan} | CIN: ${company.cin}`, 14, 23);

  // Document Title Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('PURCHASE ORDER', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`NO: ${po.poNumber}`, pageWidth - 14, 21, { align: 'right' });

  // 2. Info Boxes: Supplier vs Delivery Details
  const startY = 35;

  // Box A: Vendor / Supplier Info (Left)
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, startY, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('VENDOR / SUPPLIER DETAILS', 18, startY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(po.supplierName, 18, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${po.supplierContactPerson || 'Sales Desk'}`, 18, startY + 17);
  doc.text(`Phone: ${po.supplierPhone || '+91 98201 12345'}`, 18, startY + 22);
  doc.text(`Email: ${po.supplierEmail || 'sales@vendor.com'}`, 18, startY + 27);
  doc.text(`GSTIN: ${po.supplierGstin || '27AAECB2910Q1ZA'}`, 18, startY + 32);

  // Box B: PO Metadata & Delivery Details (Right)
  doc.roundedRect(108, startY, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PO & SHIPPING SPECIFICATIONS', 112, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`PO Date: ${new Date(po.orderDate).toLocaleDateString('en-IN')}`, 112, startY + 12);
  doc.text(`Delivery Date: ${new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')}`, 112, startY + 17);
  doc.text(`Payment Terms: ${po.paymentTerms || 'Net 30 Days from Inward'}`, 112, startY + 22);
  doc.text(`Delivery Terms: ${po.deliveryTerms || 'FOR Plant Destination (Chakan)'}`, 112, startY + 27);
  doc.text(`Delivery Facility: ${po.plantName || 'Plant Gate 1, Chakan MIDC'}`, 112, startY + 32);

  // 3. Line Items Table using autoTable
  const tableRows = po.items.map((item, idx) => [
    idx + 1,
    item.stockItemCode,
    item.stockItemName,
    item.hsnCode || '722830',
    `${item.orderedQty.toLocaleString('en-IN')} ${item.unit}`,
    `₹${item.unitPrice.toLocaleString('en-IN')}`,
    `${item.taxRatePct}%`,
    `₹${item.totalAmount.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: 78,
    margin: { left: 14, right: 14 },
    head: [['#', 'ITEM CODE', 'DESCRIPTION & SPECIFICATION', 'HSN/SAC', 'QTY / UOM', 'RATE (INR)', 'GST %', 'TOTAL (INR)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 54 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Financial Totals & Tax Breakup Box
  const totalsBoxX = 118;
  const totalsBoxW = 78;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, finalY, totalsBoxW, 36, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal (Basic):', totalsBoxX + 4, finalY + 7);
  doc.text(`₹${po.subtotal.toLocaleString('en-IN')}`, totalsBoxX + totalsBoxW - 4, finalY + 7, { align: 'right' });

  doc.text('Integrated GST (18%):', totalsBoxX + 4, finalY + 14);
  doc.text(`₹${po.totalTax.toLocaleString('en-IN')}`, totalsBoxX + totalsBoxW - 4, finalY + 14, { align: 'right' });

  doc.text('Freight / Cartage:', totalsBoxX + 4, finalY + 21);
  doc.text('Included (FOR Destination)', totalsBoxX + totalsBoxW - 4, finalY + 21, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(totalsBoxX + 4, finalY + 24, totalsBoxX + totalsBoxW - 4, finalY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('GRAND TOTAL:', totalsBoxX + 4, finalY + 31);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`₹${po.totalAmount.toLocaleString('en-IN')}`, totalsBoxX + totalsBoxW - 4, finalY + 31, { align: 'right' });

  // Amount in Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('AMOUNT IN WORDS:', 14, finalY + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const words = numberToIndianWords(po.totalAmount);
  doc.text(words, 14, finalY + 12, { maxWidth: 95 });

  // 5. Terms & Conditions
  const tcY = finalY + 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CONDITIONS:', 14, tcY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const terms = [
    '1. Material Test Certificate (MTC) and Inspection Report must accompany each consignment.',
    '2. Delivery accepted at Gate 1 between 08:30 AM and 05:30 PM on scheduled working days.',
    '3. Rejection at IQC / receipt inspection will be notified within 48 hours for immediate replacement.',
    '4. Payment will be released against clean Invoice & approved Inward Inspection Goods Receipt Note (GRN).'
  ];
  terms.forEach((t, i) => {
    doc.text(t, 14, tcY + 5 + i * 4.5);
  });

  // 6. Signature Block
  const sigY = 250;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 70, sigY);
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('VENDOR ACKNOWLEDGMENT', 14, sigY + 5);
  doc.text('FOR ASHREY FLOWOPS MFG LTD', pageWidth - 14, sigY + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signature & Stamp', 14, sigY + 10);
  doc.text('Authorized Signatory (Procurement Head)', pageWidth - 14, sigY + 10, { align: 'right' });

  // Digital Verification Stamp
  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(pageWidth - 68, sigY - 22, 54, 18, 1, 1, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DIGITALLY APPROVED & ISSUED', pageWidth - 41, sigY - 14, { align: 'center' });
  doc.setFontSize(6);
  doc.text(`REF: ${po.poNumber} • FLOWOPS SECURE`, pageWidth - 41, sigY - 8, { align: 'center' });

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 287, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Ashrey FlowOps Cloud ERP • WhatsApp Procurement Desk', pageWidth / 2, 293, { align: 'center' });

  return doc;
}

/**
 * Downloads the PO PDF directly to the browser
 */
export function downloadPurchaseOrderPdf(po: PurchaseOrder, filenamePrefix: string = 'Purchase_Order'): void {
  const doc = buildPurchaseOrderPdfDoc(po);
  const cleanNum = po.poNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${filenamePrefix}_${cleanNum}.pdf`);
}

/**
 * Returns a Data URL for previewing in iframe / modal
 */
export function getPurchaseOrderPdfDataUrl(po: PurchaseOrder): string {
  const doc = buildPurchaseOrderPdfDoc(po);
  return doc.output('datauristring');
}

/**
 * Returns a Blob for attachment handling
 */
export function getPurchaseOrderPdfBlob(po: PurchaseOrder): Blob {
  const doc = buildPurchaseOrderPdfDoc(po);
  return doc.output('blob');
}
