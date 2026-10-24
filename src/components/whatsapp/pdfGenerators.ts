import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DEFAULT_FLOWOPS_HEADER, PoCompanyHeader } from '../../utils/supplierPoPdfGenerator';

export interface InvoiceItemData {
  itemCode: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPct?: number;
  taxableAmount: number;
  gstRate: number; // e.g. 18
  totalAmount: number;
}

export interface TaxInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderNumber: string;
  customerName: string;
  customerGstin: string;
  customerPan?: string;
  billingAddress: string;
  shippingAddress: string;
  stateCode: string; // e.g. "27 - Maharashtra"
  items: InvoiceItemData[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    branch: string;
  };
  notes?: string;
}

export interface DeliveryNoteData {
  deliveryNoteNumber: string;
  date: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  transporterName: string;
  vehicleNumber: string;
  lrNumber: string;
  ewayBillNumber: string;
  packagesCount: number;
  grossWeightKg: number;
  netWeightKg: number;
  items: Array<{
    cartonNo: string;
    itemCode: string;
    description: string;
    quantity: number;
    unit: string;
    lotNumber: string;
  }>;
  remarks: string;
}

export interface QualityCertificateData {
  certificateNumber: string;
  date: string;
  customerName: string;
  orderNumber: string;
  partNumber: string;
  partDescription: string;
  materialGrade: string;
  heatNumber: string;
  lotNumber: string;
  quantityInspected: number;
  unit: string;
  chemicalTests: Array<{
    element: string;
    specifiedMin: number;
    specifiedMax: number;
    observed: number;
    status: 'pass' | 'fail';
  }>;
  mechanicalTests: Array<{
    testParameter: string;
    specification: string;
    observed: string;
    unit: string;
    status: 'pass' | 'fail';
  }>;
  visualAndNdt: {
    visualDefects: string;
    ultrasonicTest: string;
    surfaceRoughnessRa: string;
    straightness: string;
  };
  inspectorName: string;
  qaManagerName: string;
  disposition: 'PASSED & APPROVED FOR SHIPMENT' | 'REJECTED' | 'CONCESSION';
}

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
  if (crore > 0) str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
  if (lakh > 0) str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
  if (thousand > 0) str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (tens > 0) str += (str !== '' ? 'and ' : '') + (tens < 20 ? a[tens] : b[Math.floor(tens / 10)] + ' ' + a[tens % 10]);

  return 'Rupees ' + str.trim() + ' Only';
}

// ────────────────────────────────────────────────────────────────────
// 1. TAX INVOICE PDF GENERATOR
// ────────────────────────────────────────────────────────────────────

export function generateTaxInvoicePdf(
  data: TaxInvoiceData,
  company: PoCompanyHeader = DEFAULT_FLOWOPS_HEADER
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(16, 185, 129); // emerald-500 stripe
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Precision Engineering & Foundry Division • ISO 9001:2015 Certified', 14, 18);
  doc.text(`GSTIN: ${company.gstin} | PAN: ${company.pan} | State: 27-Maharashtra`, 14, 23);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153);
  doc.text(`INV NO: ${data.invoiceNumber}`, pageWidth - 14, 21, { align: 'right' });

  // Invoice & Customer Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 33, pageWidth - 28, 38, 2, 2, 'FD');

  // Left side: Customer Bill To & Ship To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('BILLED & SHIPPED TO:', 18, 40);

  doc.setFontSize(10);
  doc.text(data.customerName, 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`GSTIN: ${data.customerGstin} | State Code: ${data.stateCode}`, 18, 52);
  doc.text(data.billingAddress, 18, 57, { maxWidth: 95 });

  // Right side: Invoice Details
  const rightX = pageWidth - 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE DETAILS:', rightX, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice Date: ${data.invoiceDate}`, rightX, 46);
  doc.text(`Payment Due: ${data.dueDate}`, rightX, 52);
  doc.text(`Purchase Order Ref: ${data.orderNumber}`, rightX, 58);
  doc.text(`Place of Supply: ${data.stateCode}`, rightX, 64);

  // Line items table
  const tableRows = data.items.map((item, index) => [
    index + 1,
    `${item.description}\n[Item: ${item.itemCode}]`,
    item.hsnCode,
    `${item.quantity} ${item.unit}`,
    `₹${item.rate.toLocaleString('en-IN')}`,
    item.discountPct ? `${item.discountPct}%` : '0%',
    `₹${item.taxableAmount.toLocaleString('en-IN')}`,
    `₹${item.totalAmount.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: 75,
    margin: { left: 14, right: 14 },
    head: [['#', 'Item Description', 'HSN/SAC', 'Qty', 'Unit Rate', 'Disc', 'Taxable Val', 'Total (INR)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Financial Summary Breakdown Box
  const summaryBoxWidth = 85;
  const summaryX = pageWidth - 14 - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, summaryBoxWidth, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal (Taxable Value):', summaryX + 4, finalY + 7);
  doc.text(`₹${data.subtotal.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 7, { align: 'right' });

  doc.text('CGST @ 9%:', summaryX + 4, finalY + 14);
  doc.text(`₹${data.cgstAmount.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 14, { align: 'right' });

  doc.text('SGST @ 9%:', summaryX + 4, finalY + 21);
  doc.text(`₹${data.sgstAmount.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 21, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, finalY + 26, pageWidth - 18, finalY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Invoice Value:', summaryX + 4, finalY + 34);
  doc.setTextColor(5, 150, 105);
  doc.text(`₹${data.totalAmount.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 34, { align: 'right' });

  // Amount in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Amount in Words:', 14, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(numberToIndianWords(data.totalAmount), 14, finalY + 13, { maxWidth: summaryX - 20 });

  // Bank & Remittance details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Bank & Remittance Details:', 14, finalY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const bank = data.bankDetails || {
    bankName: 'HDFC Bank Ltd, Industrial Finance Branch',
    accountNo: '50200088912344',
    ifscCode: 'HDFC0000104',
    branch: 'Chakan MIDC Pune'
  };
  doc.text(`Bank: ${bank.bankName} | A/C: ${bank.accountNo}`, 14, finalY + 28);
  doc.text(`IFSC: ${bank.ifscCode} | Branch: ${bank.branch} | UPI: flowops@hdfcbank`, 14, finalY + 33);

  // Digital Signature & Authorization Stamp
  const sigY = 245;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, pageWidth - 14, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms: Payment required strictly within stipulated due date. Interest @ 18% p.a. applicable on delayed settlements.', 14, sigY + 6);
  doc.text('Subject to Pune Jurisdiction only. This is an authentic digitally signed electronic invoice.', 14, sigY + 11);

  // Digital Stamp Box
  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(pageWidth - 72, sigY + 4, 58, 20, 2, 2, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('FOR ASHREY FLOWOPS LTD', pageWidth - 43, sigY + 10, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('DIGITALLY SIGNED & AUTHORIZED', pageWidth - 43, sigY + 16, { align: 'center' });
  doc.setFontSize(6);
  doc.text(`AUTH REF: ${data.invoiceNumber} • 2026`, pageWidth - 43, sigY + 21, { align: 'center' });

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 287, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Ashrey FlowOps Cloud ERP • WhatsApp Instant Document Delivery Hub', pageWidth / 2, 293, { align: 'center' });

  return doc;
}

// ────────────────────────────────────────────────────────────────────
// 2. DELIVERY NOTE / CHALLAN PDF GENERATOR
// ────────────────────────────────────────────────────────────────────

export function generateDeliveryNotePdf(
  data: DeliveryNoteData,
  company: PoCompanyHeader = DEFAULT_FLOWOPS_HEADER
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(59, 130, 246); // blue-500 accent stripe
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Outbound Logistics & Dispatch Center • Plant Gate No. 2 Dock', 14, 18);
  doc.text(`GSTIN: ${company.gstin} | PAN: ${company.pan} | Phone: ${company.phone}`, 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('DELIVERY CHALLAN / NOTE', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253);
  doc.text(`NOTE NO: ${data.deliveryNoteNumber}`, pageWidth - 14, 21, { align: 'right' });

  // Consignee & Dispatch Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 33, pageWidth - 28, 42, 2, 2, 'FD');

  // Consignee details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSIGNEE (DELIVER TO):', 18, 40);

  doc.setFontSize(10);
  doc.text(data.customerName, 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${data.customerPhone}`, 18, 52);
  doc.text(`Delivery Location: ${data.shippingAddress}`, 18, 57, { maxWidth: 90 });

  // Transporter & Vehicle details
  const transX = pageWidth - 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TRANSPORT & MOVEMENT DETAILS:', transX, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Date of Dispatch: ${data.date}`, transX, 46);
  doc.text(`Transporter: ${data.transporterName}`, transX, 51);
  doc.text(`Vehicle Reg No: ${data.vehicleNumber}`, transX, 56);
  doc.text(`LR / Docket No: ${data.lrNumber}`, transX, 61);
  doc.text(`E-Way Bill No: ${data.ewayBillNumber}`, transX, 66);
  doc.text(`Total Packages: ${data.packagesCount} Cartons | Gross Wt: ${data.grossWeightKg} Kg`, transX, 71);

  // Line Items Table
  const tableRows = data.items.map((item, idx) => [
    idx + 1,
    item.cartonNo,
    item.itemCode,
    item.description,
    item.lotNumber,
    `${item.quantity} ${item.unit}`
  ]);

  autoTable(doc, {
    startY: 80,
    margin: { left: 14, right: 14 },
    head: [['#', 'Carton / Pkg #', 'Item Code', 'Description', 'Lot / Batch Ref', 'Dispatched Qty']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 62 },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Remarks & Security inspection box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Dispatch Security & Quality Attestation:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Remarks: ${data.remarks || 'Goods inspected at plant gate. Seals applied intact. Weatherproof shrink wrapping verified.'}`, 18, finalY + 12);
  doc.text(`Tare Weight: ${(data.grossWeightKg - data.netWeightKg).toFixed(1)} Kg | Net Weight: ${data.netWeightKg} Kg | Moisture Barrier Bags: Applied`, 18, finalY + 18);

  // Sign-off columns
  const sigY = 220;
  const colW = (pageWidth - 28) / 3;

  // Signer 1: Security Gate
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, sigY, colW - 4, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DISPATCH OFFICER', 18, sigY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Ashrey FlowOps Plant Gate', 18, sigY + 14);
  doc.text('Signature & Stamp Verified', 18, sigY + 32);

  // Signer 2: Transporter / Driver
  doc.rect(14 + colW, sigY, colW - 4, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TRANSPORTER / DRIVER', 18 + colW, sigY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Driver for: ${data.transporterName}`, 18 + colW, sigY + 14);
  doc.text(`Vehicle: ${data.vehicleNumber}`, 18 + colW, sigY + 20);
  doc.text('Received materials in good order', 18 + colW, sigY + 32);

  // Signer 3: Customer Receiving Acknowledgment
  doc.rect(14 + colW * 2, sigY, colW - 4, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CUSTOMER RECEIVING SIGN-OFF', 18 + colW * 2, sigY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Name: ____________________', 18 + colW * 2, sigY + 18);
  doc.text('Date & Time: ______________', 18 + colW * 2, sigY + 25);
  doc.text('Signature & Company Seal', 18 + colW * 2, sigY + 32);

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 287, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Ashrey FlowOps Cloud ERP • WhatsApp Instant Document Delivery Hub', pageWidth / 2, 293, { align: 'center' });

  return doc;
}

// ────────────────────────────────────────────────────────────────────
// 3. QUALITY CERTIFICATE / COA PDF GENERATOR
// ────────────────────────────────────────────────────────────────────

export function generateQualityCertificatePdf(
  data: QualityCertificateData,
  company: PoCompanyHeader = DEFAULT_FLOWOPS_HEADER
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(139, 92, 246); // purple-500 accent stripe
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Central Metallurgy & Quality Assurance Laboratory • NABL Accredited ISO/IEC 17025', 14, 18);
  doc.text(`GSTIN: ${company.gstin} | PAN: ${company.pan} | Lab Reg: QA-LAB-MH-0819`, 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICATE OF ANALYSIS (COA)', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(196, 181, 253);
  doc.text(`CERT NO: ${data.certificateNumber}`, pageWidth - 14, 21, { align: 'right' });

  // Inspection Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 33, pageWidth - 28, 38, 2, 2, 'FD');

  // Col 1: Part & Customer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CUSTOMER & ORDER SPECIFICATION:', 18, 40);

  doc.setFontSize(9.5);
  doc.text(data.customerName, 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Part: ${data.partDescription} (${data.partNumber})`, 18, 52);
  doc.text(`Order Ref: ${data.orderNumber} | Qty: ${data.quantityInspected} ${data.unit}`, 18, 58);
  doc.text(`Date of Inspection: ${data.date}`, 18, 64);

  // Col 2: Heat & Material Details
  const heatX = pageWidth - 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('METALLURGICAL TRACEABILITY:', heatX, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Material Grade: ${data.materialGrade}`, heatX, 46);
  doc.text(`Melt / Heat No: ${data.heatNumber}`, heatX, 52);
  doc.text(`Inspection Lot No: ${data.lotNumber}`, heatX, 58);
  doc.text(`Sampling Standard: IS 2500 / ISO 2859 Normal Level II`, heatX, 64);

  // Chemical Composition Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Chemical Composition Analysis (% Weight):', 14, 77);

  const chemRows = data.chemicalTests.map(t => [
    t.element,
    `${t.specifiedMin.toFixed(3)}%`,
    `${t.specifiedMax.toFixed(3)}%`,
    `${t.observed.toFixed(3)}%`,
    t.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 80,
    margin: { left: 14, right: 14 },
    head: [['Element', 'Min Specified (%)', 'Max Specified (%)', 'Observed Value (%)', 'Disposition']],
    body: chemRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { fontStyle: 'bold', textColor: [5, 150, 105], halign: 'center' }
    }
  });

  const chemFinalY = (doc as any).lastAutoTable.finalY + 6;

  // Mechanical Properties Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Mechanical & Hardness Test Results:', 14, chemFinalY);

  const mechRows = data.mechanicalTests.map(t => [
    t.testParameter,
    t.specification,
    t.observed,
    t.unit,
    t.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: chemFinalY + 3,
    margin: { left: 14, right: 14 },
    head: [['Test Parameter', 'Required Standard', 'Observed Value', 'Units', 'Disposition']],
    body: mechRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { fontStyle: 'bold', textColor: [5, 150, 105], halign: 'center' }
    }
  });

  const mechFinalY = (doc as any).lastAutoTable.finalY + 6;

  // Visual, Dimensional & NDT Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, mechFinalY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('3. Non-Destructive Testing (NDT) & Surface Finish:', 18, mechFinalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Visual & Dimensional Check: ${data.visualAndNdt.visualDefects}`, 18, mechFinalY + 11);
  doc.text(`• Ultrasonic Testing (UT): ${data.visualAndNdt.ultrasonicTest}`, 18, mechFinalY + 16);
  doc.text(`• Surface Roughness (Ra): ${data.visualAndNdt.surfaceRoughnessRa} | Straightness: ${data.visualAndNdt.straightness}`, 18, mechFinalY + 21);

  // Disposition Banner & Signatures
  const dispY = mechFinalY + 28;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, dispY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text(`FINAL QUALITY DISPOSITION: ${data.disposition}`, pageWidth / 2, dispY + 9, { align: 'center' });

  // Sign-off
  const sigY = dispY + 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, pageWidth - 14, sigY);

  const sigColW = (pageWidth - 28) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('CERTIFIED INSPECTOR (FQC)', 18, sigY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(data.inspectorName || 'Ramesh Naik (Level II NDT Inspector)', 18, sigY + 14);
  doc.text('Digitally Signed & Validated on Shopfloor', 18, sigY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('HEAD OF QUALITY ASSURANCE (QA)', 18 + sigColW, sigY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(data.qaManagerName || 'Dr. K. S. Deshmukh (Head QA & Metallurgy)', 18 + sigColW, sigY + 14);
  doc.text('Official FlowOps Quality Seal Affixed', 18 + sigColW, sigY + 20);

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 287, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically via Ashrey FlowOps Cloud ERP • WhatsApp Instant Document Delivery Hub', pageWidth / 2, 293, { align: 'center' });

  return doc;
}

// ────────────────────────────────────────────────────────────────────
// HELPER EXPORTS (DOWNLOAD & PREVIEW)
// ────────────────────────────────────────────────────────────────────

export function downloadInvoicePdf(data: TaxInvoiceData, filename?: string): void {
  const doc = generateTaxInvoicePdf(data);
  doc.save(filename || `Tax_Invoice_${data.invoiceNumber}.pdf`);
}

export function downloadDeliveryNotePdf(data: DeliveryNoteData, filename?: string): void {
  const doc = generateDeliveryNotePdf(data);
  doc.save(filename || `Delivery_Note_${data.deliveryNoteNumber}.pdf`);
}

export function downloadQualityCertPdf(data: QualityCertificateData, filename?: string): void {
  const doc = generateQualityCertificatePdf(data);
  doc.save(filename || `Quality_Certificate_${data.certificateNumber}.pdf`);
}

export function getInvoicePdfDataUrl(data: TaxInvoiceData): string {
  const doc = generateTaxInvoicePdf(data);
  return doc.output('datauristring');
}

export function getDeliveryNotePdfDataUrl(data: DeliveryNoteData): string {
  const doc = generateDeliveryNotePdf(data);
  return doc.output('datauristring');
}

export function getQualityCertPdfDataUrl(data: QualityCertificateData): string {
  const doc = generateQualityCertificatePdf(data);
  return doc.output('datauristring');
}
