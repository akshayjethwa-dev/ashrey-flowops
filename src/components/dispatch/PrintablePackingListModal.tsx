// src/components/dispatch/PrintablePackingListModal.tsx

import React from 'react';
import { X, Printer, Download, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PackageCarton } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';

interface PrintablePackingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartons: PackageCarton[];
  dispatch: Dispatch;
}

export const PrintablePackingListModal: React.FC<PrintablePackingListModalProps> = ({
  isOpen,
  onClose,
  cartons,
  dispatch
}) => {
  if (!isOpen) return null;

  const totalGrossWeight = cartons.reduce((acc, c) => acc + (c.grossWeightKg || 0), 0);
  const totalNetWeight = cartons.reduce((acc, c) => acc + (c.netWeightKg || 0), 0);
  const totalVolumeCbm = cartons.reduce((acc, c) => acc + (c.volumeCbm || 0), 0);
  const packingSlipNumber = `PKL-${dispatch.dispatchNumber?.replace(/[^0-9]/g, '') || Date.now().toString().slice(-5)}`;
  const dateStr = dispatch.dispatchDate || new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Carton Number',
      'Box Type',
      'Length (cm)',
      'Width (cm)',
      'Height (cm)',
      'Volume (CBM)',
      'Tare Weight (kg)',
      'Net Weight (kg)',
      'Gross Weight (kg)',
      'Seal Number',
      'Barcode',
      'Status',
      'Item Name',
      'Part Number',
      'Batch Number',
      'Quantity',
      'UOM'
    ];

    const rows: string[][] = [];
    cartons.forEach(c => {
      if (c.items.length === 0) {
        rows.push([
          c.cartonNumber,
          c.boxType,
          c.dimensions.lengthCm.toString(),
          c.dimensions.widthCm.toString(),
          c.dimensions.heightCm.toString(),
          c.volumeCbm.toString(),
          c.tareWeightKg.toString(),
          c.netWeightKg.toString(),
          c.grossWeightKg.toString(),
          c.sealNumber || '',
          c.barcode,
          c.status,
          'Empty Carton',
          '',
          '',
          '0',
          'Nos'
        ]);
      } else {
        c.items.forEach(itm => {
          rows.push([
            c.cartonNumber,
            c.boxType,
            c.dimensions.lengthCm.toString(),
            c.dimensions.widthCm.toString(),
            c.dimensions.heightCm.toString(),
            c.volumeCbm.toString(),
            c.tareWeightKg.toString(),
            c.netWeightKg.toString(),
            c.grossWeightKg.toString(),
            c.sealNumber || '',
            c.barcode,
            c.status,
            `"${itm.itemName.replace(/"/g, '""')}"`,
            itm.partNumber || '',
            itm.batchNumber || '',
            itm.quantity.toString(),
            itm.uom
          ]);
        });
      }
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PackingList_${packingSlipNumber}_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] border border-slate-200">
        
        {/* Modal Top Action Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Shipping Packing List
              </h3>
              <p className="text-xs text-slate-500">
                Itemized container packing slip, dimensional weights, seal numbers & carton breakdown
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
              <span>Print Document</span>
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
                padding: 20px !important;
                margin: 0 !important;
              }
            }
          `}</style>

          {/* Letterhead & Title */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-black block">
                  APEX INDUSTRIAL PRECISION SYSTEMS
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  COMMERCIAL PACKING LIST
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                  Unit 1 Manufacturing Plant, Plot 48 GIDC Industrial Estate, Manjusar, Vadodara, Gujarat 391775 · GSTIN: 24AABCA1234F1Z8
                </p>
              </div>

              <div className="text-right font-mono text-xs space-y-1">
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 inline-block text-left">
                  <p><span className="text-slate-500 uppercase text-[9px] block">PACKING SLIP NO</span> <strong className="text-sm font-black text-slate-900">{packingSlipNumber}</strong></p>
                  <p className="mt-1"><span className="text-slate-500 uppercase text-[9px] block">DATE</span> <strong className="text-slate-800">{dateStr}</strong></p>
                  <p className="mt-1"><span className="text-slate-500 uppercase text-[9px] block">DISPATCH REF</span> <strong className="text-indigo-700">{dispatch.dispatchNumber || dispatch.invoiceNumber}</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Consignor, Consignee & Carrier Meta Grid */}
          <div className="grid grid-cols-3 gap-6 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">CONSIGNEE (SHIP TO):</span>
              <p className="font-bold text-sm text-slate-900">{dispatch.customerName || 'Tata Motors Precision Components Div.'}</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">{dispatch.destination || 'Receiving Dock 4, Pimpri Works, Pune, Maharashtra 411018'}</p>
              <p className="text-[11px] font-mono text-slate-500 mt-1">Order Ref: <strong>{dispatch.orderId}</strong></p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">LOGISTICS & TRANSIT:</span>
              <p className="text-slate-700"><span className="text-slate-400">Carrier:</span> <strong>{dispatch.transporter || 'SafeExpress Logistics'}</strong></p>
              <p className="text-slate-700"><span className="text-slate-400">Vehicle No:</span> <strong className="uppercase">{dispatch.vehicleNumber || 'MH-12-PQ-9876'}</strong></p>
              <p className="text-slate-700"><span className="text-slate-400">LR / GR No:</span> <strong>{dispatch.lrNumber || dispatch.LRNumber || 'LR-890122'}</strong></p>
              <p className="text-slate-700"><span className="text-slate-400">Driver Contact:</span> {dispatch.driverPhone || '9440612345'}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs space-y-1.5">
              <span className="text-[10px] uppercase font-black text-slate-500 block">TOTALS MANIFEST:</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Packages:</span>
                <strong className="text-slate-900">{cartons.length} Cartons</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Weight:</span>
                <strong className="text-slate-900">{totalNetWeight.toFixed(2)} Kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Weight:</span>
                <strong className="text-slate-900 text-sm font-black">{totalGrossWeight.toFixed(2)} Kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Volume:</span>
                <strong className="text-indigo-700">{totalVolumeCbm.toFixed(4)} CBM</strong>
              </div>
            </div>
          </div>

          {/* Itemized Cartons Table */}
          <div className="py-4 space-y-4">
            <h4 className="text-xs uppercase font-mono font-black text-slate-700 tracking-wider">
              Itemized Carton Manifest Breakdown
            </h4>

            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="p-2.5 pl-3">Box #</th>
                    <th className="p-2.5">Pkg Type</th>
                    <th className="p-2.5">Dims (L×W×H cm)</th>
                    <th className="p-2.5">CBM</th>
                    <th className="p-2.5">Gross Wt</th>
                    <th className="p-2.5">Seal / Barcode</th>
                    <th className="p-2.5">Contained Parts & Description</th>
                    <th className="p-2.5 text-right pr-3">Packed Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {cartons.map((carton, cIdx) => (
                    <tr key={carton.id} className={cIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 pl-3 font-mono font-bold text-slate-900">
                        {carton.cartonNumber}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 capitalize">
                        {carton.boxType.replace('_', ' ')}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {carton.dimensions.lengthCm} × {carton.dimensions.widthCm} × {carton.dimensions.heightCm}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {carton.volumeCbm}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {carton.grossWeightKg} kg
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        <span className="text-emerald-800 font-semibold block">{carton.sealNumber}</span>
                        <span className="text-slate-400 text-[10px] block">{carton.barcode}</span>
                      </td>
                      <td className="p-2.5">
                        <div className="space-y-1">
                          {carton.items.map((itm, itmIdx) => (
                            <div key={itmIdx} className="leading-tight">
                              <span className="font-bold text-slate-800">{itm.itemName}</span>
                              <div className="text-[10px] font-mono text-slate-500 space-x-2">
                                {itm.partNumber && <span>PN: {itm.partNumber}</span>}
                                {itm.batchNumber && <span>Batch: {itm.batchNumber}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-right pr-3 font-mono font-black text-slate-900">
                        {carton.items.reduce((s, itm) => s + itm.quantity, 0)} Nos
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="p-2.5 pl-3 uppercase">Total Cargo Aggregates:</td>
                    <td className="p-2.5 font-black text-slate-950">{totalGrossWeight.toFixed(2)} kg</td>
                    <td colSpan={2} className="p-2.5 text-right uppercase text-slate-600">Total Units Shipped:</td>
                    <td className="p-2.5 text-right pr-3 font-black text-indigo-900">
                      {cartons.reduce((s, c) => s + c.items.reduce((is, itm) => is + itm.quantity, 0), 0)} Nos
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Packaging Compliance Declaration */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed font-sans">
            <strong>Packaging & Preservation Certification:</strong> All items listed in this packing list have been thoroughly cleaned, rust-inhibited using industrial grade VCI preservation agents, protected with shock-absorbent cushioning, and sealed in tamper-evident containers meeting transit specifications.
          </div>

          {/* Triplicate Signature Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-xs">
            <div className="space-y-8">
              <span className="text-[9px] font-mono uppercase font-black text-slate-400 block">PACKED BY (STORE KEEPER):</span>
              <div className="border-t border-slate-300 pt-1.5 font-mono">
                <p className="font-bold text-slate-900">Dinesh M. Patel</p>
                <p className="text-[10px] text-slate-500">Warehouse Packaging In-Charge</p>
              </div>
            </div>

            <div className="space-y-8">
              <span className="text-[9px] font-mono uppercase font-black text-slate-400 block">QUALITY INSPECTED (FQC):</span>
              <div className="border-t border-slate-300 pt-1.5 font-mono">
                <p className="font-bold text-slate-900">Santosh Rao (QA Lead)</p>
                <p className="text-[10px] text-emerald-700 font-bold">FQC Release Cleared (ISO 9001)</p>
              </div>
            </div>

            <div className="space-y-8">
              <span className="text-[9px] font-mono uppercase font-black text-slate-400 block">DISPATCH SUPERVISOR / GATE SIGN-OFF:</span>
              <div className="border-t border-slate-300 pt-1.5 font-mono">
                <p className="font-bold text-slate-900">Rajesh K. Varma</p>
                <p className="text-[10px] text-slate-500">Authorized Dispatch Officer</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl no-print">
          <span className="text-xs font-mono text-slate-500">
            Document format compliant with standard commercial logistics export requirements
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-mono font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
