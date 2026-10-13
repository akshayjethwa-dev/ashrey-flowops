// src/components/purchaseOrders/PurchaseOrderPrintModal.tsx

import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileCheck,
  Building2,
  Calendar,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { PurchaseOrder } from '../../types/purchaseOrder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

function SvgBarcode({ code, width = 240, height = 50 }: { code: string; width?: number; height?: number }) {
  const hash = code.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const maxWidth = width - 20;

  for (let i = 0; i < code.length * 4 && currentX < maxWidth - 10; i++) {
    const isBar = i % 2 === 0;
    const barWidth = 1 + ((hash + i * 5) % 3);
    if (isBar) {
      bars.push({ x: currentX, w: barWidth });
    }
    currentX += barWidth + (1 + ((hash + i * 2) % 2));
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 20}`}
      className="w-full max-w-[220px] h-auto mx-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={width} height={height + 20} fill="#ffffff" />
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y="4"
          width={bar.w}
          height={height}
          fill="#0f172a"
        />
      ))}
      <text
        x={width / 2}
        y={height + 16}
        textAnchor="middle"
        className="font-mono text-[10px] font-bold fill-slate-900 tracking-widest"
        fontSize="10"
      >
        {code}
      </text>
    </svg>
  );
}

export const PurchaseOrderPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-bold">Purchase Order Print Station</span>
            <span className="text-xs font-mono text-slate-400">• {order.poNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable PO Sheet */}
        <div className="p-8 overflow-y-auto bg-slate-50 flex justify-center">
          <div
            id="printable-po-document"
            className="w-full max-w-2xl bg-white border border-slate-300 p-8 shadow-md rounded-xl text-slate-900 space-y-6 text-xs"
          >
            {/* 1. Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-black text-xs tracking-wider">
                    FLOWOPS
                  </span>
                  <span className="font-extrabold text-base tracking-tight">ASHREY PRECISION FORGINGS</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Plot #48, Chakan MIDC Phase II, Pune, Maharashtra 410501
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  GSTIN: 27AABCA4821N1ZY • CIN: U28910MH2018PTC304819
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black font-mono tracking-tight block">
                  PURCHASE ORDER
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 block">
                  {order.poNumber}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Date: {formatDate(order.orderDate)}
                </span>
              </div>
            </div>

            {/* 2. Vendor & Ship-To Details */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                  VENDOR / SUPPLIER DETAILS:
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  {order.supplierName}
                </h4>
                {order.supplierGstin && (
                  <p className="text-[11px] font-mono text-slate-600">
                    GSTIN: {order.supplierGstin}
                  </p>
                )}
                {order.supplierPhone && (
                  <p className="text-[11px] text-slate-600">
                    Contact: {order.supplierPhone}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  {order.supplierEmail || 'vendor@portal.com'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                  SHIP TO / BILLING LOCATION:
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  {order.plantName}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {order.shipToAddress || 'Inward Receiving Bay, Main Plant Facility'}
                </p>
                <p className="text-[11px] text-slate-700 font-mono font-bold mt-1">
                  Expected Delivery: {formatDate(order.expectedDeliveryDate)}
                </p>
              </div>
            </div>

            {/* 3. Commercial Terms */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Payment Terms:</span>
                <span className="font-bold text-slate-800">{order.paymentTerms}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Delivery Terms:</span>
                <span className="font-bold text-slate-800">{order.deliveryTerms}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Source Trigger:</span>
                <span className="font-bold text-slate-800">
                  {order.sourceTrigger === 'reorder_level_breach' ? 'Auto-Reorder Level' : 'MRP Explosion'}
                </span>
              </div>
            </div>

            {/* 4. Line Items Table */}
            <div>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-mono text-[10px] text-slate-600 uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-300">#</th>
                    <th className="py-2 px-3 border-r border-slate-300">Item Code & Name</th>
                    <th className="py-2 px-3 border-r border-slate-300">HSN</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Qty</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Rate (INR)</th>
                    <th className="py-2 px-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {order.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{it.stockItemCode}</div>
                        <div className="font-sans text-[11px] text-slate-600">{it.stockItemName}</div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">{it.hsnCode || '7213.91'}</td>
                      <td className="py-2.5 px-3 text-right font-bold border-r border-slate-200">
                        {it.orderedQty} {it.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {formatCurrency(it.orderedQty * it.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-3">
                <div className="w-64 space-y-1 text-xs font-mono text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span>{formatCurrency(order.totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Barcode & Signatures */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-center">
                <SvgBarcode code={order.poNumber} />
                <span className="text-[9px] text-slate-500 font-mono block mt-1">
                  Scan at Receiving Dock for Automated Inwarding
                </span>
              </div>

              <div className="text-right space-y-4">
                <p className="text-[10px] text-slate-500 font-mono">
                  Authorized Signatory for Ashrey Precision Forgings
                </p>
                <div className="font-bold text-xs font-mono text-slate-900 pt-6 border-t border-slate-300">
                  {order.createdByName} (Procurement Dept.)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
