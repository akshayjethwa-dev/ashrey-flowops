// src/components/finance/PrintableTaxInvoiceModal.tsx

import React from 'react';
import { X, Printer, Download, Receipt, Building2, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types';

interface PrintableTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export const PrintableTaxInvoiceModal: React.FC<PrintableTaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  if (!isOpen) return null;

  const tb = invoice.taxBreakdown;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Due Date',
      'Order Ref',
      'Customer Name',
      'Customer GSTIN',
      'Supplier GSTIN',
      'Dispatch Ref',
      'E-Way Bill',
      'Vehicle Number',
      'Taxable Amount',
      'CGST Amount',
      'SGST Amount',
      'IGST Amount',
      'Round Off',
      'Total Amount'
    ];

    const row = [
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.dueDate,
      invoice.orderNumber || invoice.orderId,
      `"${invoice.customerName.replace(/"/g, '""')}"`,
      tb?.customerGstin || '27AAACG9876K1Z4',
      tb?.supplierGstin || '24AABCA1234F1Z8',
      invoice.dispatchNumber || '',
      invoice.ewayBillNumber || '',
      invoice.vehicleNumber || '',
      invoice.amount.toString(),
      (tb?.cgstAmount || 0).toString(),
      (tb?.sgstAmount || 0).toString(),
      (tb?.igstAmount || 0).toString(),
      (tb?.roundOff || 0).toString(),
      invoice.total.toString()
    ];

    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaxInvoice_${invoice.invoiceNumber}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] border border-slate-200">
        
        {/* Header Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Statutory GST Tax Invoice
              </h3>
              <p className="text-xs text-slate-500">
                Rule 46 CGST Act compliant commercial tax invoice for customer billing & ERP posting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document View */}
        <div className="p-8 overflow-y-auto bg-white font-sans text-slate-900 printable-document">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .no-print {
                display: none !important;
              }
              .printable-document, .printable-document * {
                visibility: visible;
              }
              .printable-document {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 15px !important;
                margin: 0 !important;
              }
            }
          `}</style>

          {/* Letterhead & Rule 46 Banner */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-black block">
                  ORIGINAL FOR RECIPIENT / DUPLICATE FOR TRANSPORTER
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  TAX INVOICE
                </h1>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  (Issued under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017)
                </p>
              </div>

              {/* Invoice Meta Box */}
              <div className="text-right font-mono text-xs">
                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-left space-y-1 inline-block">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">INVOICE NO:</span>
                    <strong className="text-slate-950 font-black">{invoice.invoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">INVOICE DATE:</span>
                    <strong className="text-slate-800">{invoice.invoiceDate}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">PAYMENT DUE:</span>
                    <strong className="text-indigo-700">{invoice.dueDate}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consignor & Consignee Grid */}
          <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
            {/* Supplier / Consignor */}
            <div className="space-y-1.5 border-r border-slate-200 pr-4">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 block">
                SUPPLIER (CONSIGNOR):
              </span>
              <p className="font-bold text-sm text-slate-900">Apex Precision Manufacturing Ltd.</p>
              <p className="text-slate-600 leading-relaxed">Plot 48, GIDC Industrial Estate, Manjusar, Vadodara, Gujarat 391775</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <p><span className="text-slate-400">GSTIN:</span> <strong>{tb?.supplierGstin || '24AABCA1234F1Z8'}</strong></p>
                <p><span className="text-slate-400">State:</span> {tb?.supplierState || 'Gujarat'} (Code: {tb?.supplierStateCode || '24'})</p>
                <p><span className="text-slate-400">PAN:</span> AABCA1234F</p>
                <p><span className="text-slate-400">CIN:</span> U29253GJ2015PLC084920</p>
              </div>
            </div>

            {/* Buyer / Consignee */}
            <div className="space-y-1.5 pl-2">
              <span className="text-[10px] font-mono uppercase font-black text-indigo-700 block">
                BUYER / BILL TO (CONSIGNEE):
              </span>
              <p className="font-bold text-sm text-slate-900">{invoice.customerName}</p>
              <p className="text-slate-600 leading-relaxed">Tata Motors Works, Pimpri Plant Gates, Pune, Maharashtra 411018</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <p><span className="text-slate-400">GSTIN:</span> <strong>{tb?.customerGstin || '27AAACG9876K1Z4'}</strong></p>
                <p><span className="text-slate-400">Place of Supply:</span> {tb?.placeOfSupply || 'Maharashtra (27)'}</p>
                <p><span className="text-slate-400">Customer PO:</span> {invoice.orderNumber || invoice.orderId}</p>
                <p><span className="text-slate-400">Phone:</span> {invoice.customerPhone || '+91 94406 12345'}</p>
              </div>
            </div>
          </div>

          {/* Transport & Dispatch Reference Strip */}
          <div className="grid grid-cols-4 gap-4 py-2.5 border-b-2 border-slate-900 bg-slate-50 -mx-8 px-8 font-mono text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">DISPATCH REF</span>
              <strong className="text-slate-900 block truncate">{invoice.dispatchNumber || invoice.id}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">E-WAY BILL NUMBER</span>
              <strong className="text-indigo-700 block">{invoice.ewayBillNumber || '2410 8829 4102'}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">VEHICLE NUMBER</span>
              <strong className="text-slate-950 uppercase block">{invoice.vehicleNumber || 'MH-12-PQ-9876'}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">CARRIER / LR</span>
              <strong className="text-slate-900 block truncate">{invoice.transporter || 'SafeExpress'} ({invoice.lrNumber || 'LR-890122'})</strong>
            </div>
          </div>

          {/* Itemized Goods Table */}
          <div className="py-4 space-y-3">
            <h4 className="text-xs uppercase font-mono font-black text-slate-700 tracking-wider">
              Itemized Goods & Taxable Valuation
            </h4>

            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="p-2.5 pl-3">Sr</th>
                    <th className="p-2.5">Item Description & Specifications</th>
                    <th className="p-2.5">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Taxable Val (₹)</th>
                    <th className="p-2.5 text-right">CGST</th>
                    <th className="p-2.5 text-right">SGST</th>
                    <th className="p-2.5 text-right">IGST</th>
                    <th className="p-2.5 text-right pr-3">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {(invoice.items && invoice.items.length > 0 ? invoice.items : [
                    { id: '1', name: 'Forged Steel Spur Gear (Mod 4, 32T)', quantity: 20, unitPrice: 4200, total: 84000 }
                  ]).map((itm: any, idx: number) => {
                    const taxable = itm.total || (itm.quantity * itm.unitPrice);
                    const isIntra = tb?.taxType === 'intra_state';
                    const cgst = isIntra ? (taxable * 0.09) : 0;
                    const sgst = isIntra ? (taxable * 0.09) : 0;
                    const igst = !isIntra ? (taxable * 0.18) : 0;
                    const total = taxable + cgst + sgst + igst;

                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2.5 pl-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{itm.name}</strong>
                          <span className="text-[11px] text-slate-500">{itm.specs || 'Precision CNC Machined Sub-Assembly'}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">84834000</td>
                        <td className="p-2.5 font-mono text-center font-bold text-slate-900">{itm.quantity} Nos</td>
                        <td className="p-2.5 font-mono text-right text-slate-700">{itm.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 font-mono text-right font-bold text-slate-900">{taxable.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 font-mono text-right text-slate-600">{cgst ? `₹${cgst.toFixed(0)}` : '-'}</td>
                        <td className="p-2.5 font-mono text-right text-slate-600">{sgst ? `₹${sgst.toFixed(0)}` : '-'}</td>
                        <td className="p-2.5 font-mono text-right text-slate-600">{igst ? `₹${igst.toFixed(0)}` : '-'}</td>
                        <td className="p-2.5 font-mono text-right pr-3 font-black text-slate-950">{total.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={5} className="p-2.5 pl-3 uppercase">Total Taxable Amount:</td>
                    <td className="p-2.5 text-right font-black">₹{invoice.amount.toLocaleString('en-IN')}</td>
                    <td colSpan={3} className="p-2.5 text-right text-slate-600">Total GST: ₹{(invoice.taxAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right pr-3 font-black text-indigo-950 text-sm">
                      ₹{invoice.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bank Account Details & Terms */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-200 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] space-y-1">
              <span className="uppercase font-black text-slate-500 block">BANK REMITTANCE DETAILS (RTGS/NEFT):</span>
              <p><span className="text-slate-400">Bank Name:</span> <strong>State Bank of India</strong></p>
              <p><span className="text-slate-400">Account Name:</span> Apex Precision Manufacturing Ltd.</p>
              <p><span className="text-slate-400">Account No:</span> <strong>389201948201</strong> (Current)</p>
              <p><span className="text-slate-400">IFSC Code:</span> <strong>SBIN0004921</strong> (Manjusar GIDC Branch)</p>
            </div>

            <div className="space-y-1 text-[11px] text-slate-600">
              <span className="font-mono uppercase font-black text-slate-500 block mb-1">
                DECLARATION:
              </span>
              <p>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Interest @ 18% p.a. will be levied if payment is not received within agreed terms.
              </p>
            </div>
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-900 text-xs">
            <div className="space-y-8">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 block">
                CUSTOMER ENDORSEMENT / RECEIVER:
              </span>
              <div className="border-t border-slate-300 pt-2 font-mono">
                <p className="text-[10px] text-slate-400">Authorized Signature & Company Seal</p>
              </div>
            </div>

            <div className="space-y-8 pl-4 border-l border-slate-200">
              <span className="text-[10px] font-mono uppercase font-black text-indigo-700 block">
                FOR APEX PRECISION MANUFACTURING LTD.:
              </span>
              <div className="border-t border-slate-300 pt-2 font-mono">
                <p className="font-bold text-slate-900">{invoice.createdByName || 'Finance Controller'}</p>
                <p className="text-[10px] text-slate-500">Authorized Signatory (Revenue Accounting)</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl no-print">
          <span className="text-xs font-mono text-slate-500">
            Invoice #{invoice.invoiceNumber} recognized into P&L and GST liability schedules
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono font-bold rounded-lg transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
