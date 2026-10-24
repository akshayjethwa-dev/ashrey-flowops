// src/components/dispatch/DispatchNoteModal.tsx

import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { DispatchNote } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';

interface DispatchNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchNote: DispatchNote;
  dispatch: Dispatch;
}

export const DispatchNoteModal: React.FC<DispatchNoteModalProps> = ({
  isOpen,
  onClose,
  dispatchNote,
  dispatch
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Challan Number',
      'Challan Date',
      'PO Number',
      'PO Date',
      'Consignor GSTIN',
      'Consignee Name',
      'Consignee GSTIN',
      'Carrier',
      'Vehicle Number',
      'LR Number',
      'Item No',
      'Item Name',
      'HSN Code',
      'Quantity',
      'UOM',
      'Rate',
      'Taxable Value',
      'CGST Amount',
      'SGST Amount',
      'Total Amount'
    ];

    const rows = dispatchNote.items.map(itm => [
      dispatchNote.challanNumber,
      dispatchNote.challanDate,
      dispatchNote.poNumber || '',
      dispatchNote.poDate || '',
      dispatchNote.consignor.gstin,
      `"${dispatchNote.consignee.tradeName.replace(/"/g, '""')}"`,
      dispatchNote.consignee.gstin,
      `"${dispatchNote.transporter.replace(/"/g, '""')}"`,
      dispatchNote.vehicleNumber,
      dispatchNote.lrNumber,
      itm.itemNumber.toString(),
      `"${itm.itemName.replace(/"/g, '""')}"`,
      itm.hsnCode,
      itm.quantity.toString(),
      itm.uom,
      itm.unitRate.toString(),
      itm.taxableValue.toString(),
      itm.cgstAmount.toString(),
      itm.sgstAmount.toString(),
      itm.totalAmount.toString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DispatchNote_${dispatchNote.challanNumber}_${dispatchNote.challanDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] border border-slate-200">
        
        {/* Modal Top Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Dispatch Note / Delivery Challan
              </h3>
              <p className="text-xs text-slate-500">
                Statutory transit document compliant with Rule 55 of Central Goods & Services Tax (CGST) Rules
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Challan</span>
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

          {/* Document Header & Statutory Banner */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-black block">
                  ORIGINAL FOR CONSIGNEE / DUPLICATE FOR TRANSPORTER
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  DELIVERY CHALLAN / DISPATCH NOTE
                </h1>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  (Issued under Rule 55 of Central Goods & Services Tax Rules, 2017)
                </p>
              </div>

              {/* Challan Meta Box */}
              <div className="text-right font-mono text-xs">
                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-left space-y-1 inline-block">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">CHALLAN NO:</span>
                    <strong className="text-slate-950 font-black">{dispatchNote.challanNumber}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">CHALLAN DATE:</span>
                    <strong className="text-slate-800">{dispatchNote.challanDate}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 text-[10px] uppercase">CUSTOMER PO:</span>
                    <strong className="text-indigo-700">{dispatchNote.poNumber}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consignor & Consignee Two-Column Layout */}
          <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
            {/* Consignor Details */}
            <div className="space-y-1.5 border-r border-slate-200 pr-4">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 block">
                CONSIGNOR (SUPPLIER / MANUFACTURER):
              </span>
              <p className="font-bold text-sm text-slate-900">{dispatchNote.consignor.tradeName}</p>
              <p className="text-slate-600 leading-relaxed">{dispatchNote.consignor.address}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <p><span className="text-slate-400">GSTIN:</span> <strong>{dispatchNote.consignor.gstin}</strong></p>
                <p><span className="text-slate-400">State:</span> {dispatchNote.consignor.state} ({dispatchNote.consignor.stateCode})</p>
                <p><span className="text-slate-400">PAN:</span> {dispatchNote.consignor.pan}</p>
                <p><span className="text-slate-400">Phone:</span> {dispatchNote.consignor.phone}</p>
              </div>
            </div>

            {/* Consignee Details */}
            <div className="space-y-1.5 pl-2">
              <span className="text-[10px] font-mono uppercase font-black text-indigo-700 block">
                CONSIGNEE (BUYER / RECIPIENT):
              </span>
              <p className="font-bold text-sm text-slate-900">{dispatchNote.consignee.tradeName}</p>
              <p className="text-slate-600 leading-relaxed"><span className="text-slate-400">Delivery Address:</span> {dispatchNote.consignee.shippingAddress}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <p><span className="text-slate-400">GSTIN:</span> <strong>{dispatchNote.consignee.gstin}</strong></p>
                <p><span className="text-slate-400">State:</span> {dispatchNote.consignee.state} ({dispatchNote.consignee.stateCode})</p>
                <p><span className="text-slate-400">Contact:</span> {dispatchNote.consignee.contactPerson || 'Stores Dept'}</p>
                <p><span className="text-slate-400">Dispatch Bay:</span> {dispatchNote.dispatchBay}</p>
              </div>
            </div>
          </div>

          {/* Transport & Carrier Details Strip */}
          <div className="grid grid-cols-4 gap-4 py-3 border-b-2 border-slate-900 bg-slate-50 -mx-8 px-8 font-mono text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">TRANSPORTER</span>
              <strong className="text-slate-900 block truncate">{dispatchNote.transporter}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">VEHICLE NUMBER</span>
              <strong className="text-slate-950 uppercase block">{dispatchNote.vehicleNumber}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">LORRY RECEIPT (LR/GR)</span>
              <strong className="text-indigo-700 block">{dispatchNote.lrNumber} ({dispatchNote.lrDate})</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">DRIVER & DL NO</span>
              <strong className="text-slate-900 block truncate">{dispatchNote.driverName} ({dispatchNote.driverPhone})</strong>
            </div>
          </div>

          {/* Itemized Goods Table */}
          <div className="py-4 space-y-3">
            <h4 className="text-xs uppercase font-mono font-black text-slate-700 tracking-wider">
              Particulars of Goods Dispatched
            </h4>

            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="p-2.5 pl-3">Sr</th>
                    <th className="p-2.5">Description of Industrial Goods</th>
                    <th className="p-2.5">HSN Code</th>
                    <th className="p-2.5 text-center">Qty / UOM</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Taxable Val (₹)</th>
                    <th className="p-2.5 text-right">CGST (9%)</th>
                    <th className="p-2.5 text-right">SGST (9%)</th>
                    <th className="p-2.5 text-right pr-3">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {dispatchNote.items.map((itm, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 pl-3 font-mono font-bold text-slate-500">
                        {itm.itemNumber}
                      </td>
                      <td className="p-2.5">
                        <strong className="text-slate-900 block">{itm.itemName}</strong>
                        <span className="text-[11px] text-slate-500">{itm.description}</span>
                        {itm.cartonRef && (
                          <span className="text-[10px] font-mono text-indigo-700 ml-2">[{itm.cartonRef}]</span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">
                        {itm.hsnCode}
                      </td>
                      <td className="p-2.5 font-mono text-center font-bold text-slate-900">
                        {itm.quantity} {itm.uom}
                      </td>
                      <td className="p-2.5 font-mono text-right text-slate-700">
                        {itm.unitRate.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono text-right font-bold text-slate-900">
                        {itm.taxableValue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono text-right text-slate-600">
                        {itm.cgstAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono text-right text-slate-600">
                        {itm.sgstAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono text-right pr-3 font-black text-slate-950">
                        {itm.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="p-2.5 pl-3 uppercase">Total Goods Value:</td>
                    <td className="p-2.5 text-center font-black">{dispatchNote.totalQuantity} Nos</td>
                    <td></td>
                    <td className="p-2.5 text-right font-black">₹{dispatchNote.totalTaxableValue.toLocaleString('en-IN')}</td>
                    <td colSpan={2} className="p-2.5 text-right text-slate-600">Total GST: ₹{dispatchNote.totalTaxValue.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right pr-3 font-black text-indigo-950 text-sm">
                      ₹{dispatchNote.grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Statutory Terms & Conditions */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-200 text-[11px] text-slate-600">
            <div>
              <span className="font-mono uppercase font-black text-slate-500 block mb-1">
                TERMS & CONDITIONS:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                {dispatchNote.termsAndConditions.map((term, tIdx) => (
                  <li key={tIdx} className="leading-tight">{term}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
              <span className="uppercase font-black text-slate-500 block">INSURANCE & FREIGHT:</span>
              <p>{dispatchNote.insuranceDetails}</p>
              <p><span className="text-slate-400">Freight Terms:</span> <strong className="uppercase">{dispatchNote.freightTerms.replace('_', ' ')}</strong></p>
              <p><span className="text-slate-400">Remarks:</span> {dispatchNote.remarks}</p>
            </div>
          </div>

          {/* Signatures Dual Block */}
          <div className="grid grid-cols-2 gap-8 pt-10 border-t-2 border-slate-900 text-xs">
            <div className="space-y-8">
              <span className="text-[10px] font-mono uppercase font-black text-slate-500 block">
                FOR CONSIGNOR (APEX INDUSTRIAL PRECISION SYSTEMS):
              </span>
              <div className="border-t border-slate-300 pt-2 font-mono">
                <p className="font-bold text-slate-900">{dispatchNote.authorizedSignatory}</p>
                <p className="text-[10px] text-slate-500">Authorized Signatory & Plant Dispatch In-Charge</p>
              </div>
            </div>

            <div className="space-y-8 pl-4 border-l border-slate-200">
              <span className="text-[10px] font-mono uppercase font-black text-indigo-700 block">
                CONSIGNEE ACKNOWLEDGEMENT & RECEIPT:
              </span>
              <div className="border-t border-slate-300 pt-2 font-mono">
                <p className="text-[11px] text-slate-700 italic">"Received the above items in sound condition with unbroken carton seals."</p>
                <p className="text-[10px] text-slate-400 mt-1">Signature / Date / Company Rubber Stamp</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl no-print">
          <span className="text-xs font-mono text-slate-500">
            Rule 55 CGST Delivery Challan verified and indexed with Invoice #{dispatch.invoiceNumber}
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
