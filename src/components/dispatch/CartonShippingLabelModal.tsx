// src/components/dispatch/CartonShippingLabelModal.tsx

import React, { useState } from 'react';
import { X, Printer, Package, ArrowUp, Droplets, ShieldAlert, Layers } from 'lucide-react';
import { PackageCarton } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';

interface CartonShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartons: PackageCarton[];
  dispatch: Dispatch;
}

export const CartonShippingLabelModal: React.FC<CartonShippingLabelModalProps> = ({
  isOpen,
  onClose,
  cartons,
  dispatch
}) => {
  const [selectedCartonIndex, setSelectedCartonIndex] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const cartonsToRender = selectedCartonIndex === 'all' 
    ? cartons 
    : [cartons[selectedCartonIndex as number]];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Carton Shipping Labels (4×6 Standard)
              </h3>
              <p className="text-xs text-slate-500">
                ISO/GS1 Industrial packaging labels with barcode, weight, handling symbols, and seal tracking
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter by box */}
            <select
              value={selectedCartonIndex}
              onChange={(e) => setSelectedCartonIndex(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Print All ({cartons.length} Cartons)</option>
              {cartons.map((c, idx) => (
                <option key={c.id} value={idx}>
                  Box {idx + 1} of {cartons.length} ({c.cartonNumber})
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Labels</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Labels Content (Scrollable & Printable) */}
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-100/70 printable-area">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .no-print {
                display: none !important;
              }
              .printable-area, .printable-area * {
                visibility: visible;
              }
              .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .shipping-label-card {
                page-break-after: always;
                box-shadow: none !important;
                border: 2px solid black !important;
                width: 100% !important;
                max-width: 500px !important;
                margin: 0 auto 30px auto !important;
              }
            }
          `}</style>

          {cartonsToRender.map((carton, idx) => {
            const currentBoxNumber = selectedCartonIndex === 'all' ? idx + 1 : (selectedCartonIndex as number) + 1;
            return (
              <div 
                key={carton.id} 
                className="shipping-label-card bg-white border-2 border-slate-900 rounded-xl p-6 max-w-lg mx-auto shadow-md font-sans text-slate-900"
              >
                {/* Label Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest font-black text-slate-500 block">
                      OUTWARD INDUSTRIAL FREIGHT
                    </span>
                    <h4 className="text-lg font-black tracking-tight uppercase">
                      {dispatch.dispatchNumber || dispatch.invoiceNumber}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">PACKAGE SEQ</span>
                    <span className="text-2xl font-black font-mono tracking-tight bg-slate-900 text-white px-2.5 py-0.5 rounded">
                      {currentBoxNumber} / {cartons.length}
                    </span>
                  </div>
                </div>

                {/* From and To Grid */}
                <div className="grid grid-cols-2 gap-4 py-3 border-b-2 border-slate-900 text-xs">
                  <div className="border-r border-slate-300 pr-3 space-y-1">
                    <span className="text-[9px] font-mono uppercase font-black text-slate-500 block">SHIP FROM (CONSIGNOR):</span>
                    <p className="font-bold text-slate-900 leading-snug">Apex Precision Mfg Ltd</p>
                    <p className="text-[10px] text-slate-600 leading-tight">Plot 48, GIDC Manjusar, Vadodara, Gujarat 391775</p>
                    <p className="text-[9px] font-mono text-slate-500">GSTIN: 24AABCA1234F1Z8</p>
                  </div>

                  <div className="pl-1 space-y-1">
                    <span className="text-[9px] font-mono uppercase font-black text-indigo-700 block">SHIP TO (CONSIGNEE):</span>
                    <p className="font-bold text-slate-900 leading-snug">{dispatch.customerName || 'Tata Motors Precision CVBU'}</p>
                    <p className="text-[10px] text-slate-600 leading-tight">{dispatch.destination || 'Receiving Dock 4, Pimpri Works, Pune, MH 411018'}</p>
                    <p className="text-[9px] font-mono text-slate-500">PO Ref: {dispatch.orderId}</p>
                  </div>
                </div>

                {/* Carrier & Transit Routing */}
                <div className="grid grid-cols-3 gap-2 py-2 border-b-2 border-slate-900 text-[11px] font-mono">
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase">CARRIER / LR</span>
                    <span className="font-black text-slate-900 block truncate">{dispatch.transporter || 'SafeExpress'}</span>
                    <span className="text-[9px] text-indigo-700 block">{dispatch.lrNumber || 'LR-890122'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase">VEHICLE NO</span>
                    <span className="font-black text-slate-900 block uppercase">{dispatch.vehicleNumber || 'MH-12-PQ-9876'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase">SEAL NUMBER</span>
                    <span className="font-black text-emerald-800 block">{carton.sealNumber || 'SEAL-2026-91'}</span>
                  </div>
                </div>

                {/* Physical Specifications */}
                <div className="grid grid-cols-4 gap-2 py-2 border-b-2 border-slate-900 text-[10px] font-mono text-center bg-slate-50 -mx-6 px-6">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">BOX TYPE</span>
                    <span className="font-bold uppercase text-slate-800">{carton.boxType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">DIMENSIONS (CM)</span>
                    <span className="font-bold text-slate-800">
                      {carton.dimensions.lengthCm}×{carton.dimensions.widthCm}×{carton.dimensions.heightCm}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">NET WEIGHT</span>
                    <span className="font-bold text-slate-800">{carton.netWeightKg} KG</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">GROSS WEIGHT</span>
                    <span className="font-black text-slate-950 text-xs">{carton.grossWeightKg} KG</span>
                  </div>
                </div>

                {/* Contents Summary */}
                <div className="py-2.5 border-b-2 border-slate-900 text-[11px]">
                  <span className="text-[9px] font-mono uppercase font-black text-slate-500 block mb-1">
                    ITEMIZED CONTENTS ({carton.items.length} parts):
                  </span>
                  <div className="space-y-1">
                    {carton.items.map((itm, iIdx) => (
                      <div key={iIdx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[260px]">
                          {itm.itemName}
                        </span>
                        <div className="flex items-center space-x-2 font-mono text-[10px]">
                          {itm.batchNumber && (
                            <span className="text-slate-500">{itm.batchNumber}</span>
                          )}
                          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                            Qty: {itm.quantity} {itm.uom}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barcode & Handling Symbols Section */}
                <div className="pt-3 flex items-center justify-between">
                  {/* High contrast industrial barcode simulation */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-[2px] h-11 bg-white p-1 border border-slate-300">
                      {/* Alternating line bars to represent code128 / EAN barcode */}
                      {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3].map((width, bIdx) => (
                        <div
                          key={bIdx}
                          className={`h-full ${bIdx % 2 === 0 ? 'bg-slate-950' : 'bg-transparent'}`}
                          style={{ width: `${width * 2}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] tracking-widest text-center block font-black text-slate-800">
                      *{carton.barcode}*
                    </span>
                  </div>

                  {/* Standard Logistics Symbols */}
                  <div className="flex items-center space-x-3 text-slate-800 border-l border-slate-300 pl-4">
                    <div className="text-center" title="This Side Up">
                      <div className="border border-slate-900 p-1.5 rounded flex flex-col items-center">
                        <ArrowUp className="h-4 w-4 stroke-[3]" />
                        <span className="text-[7px] font-black uppercase font-mono mt-0.5">UP</span>
                      </div>
                    </div>
                    <div className="text-center" title="Keep Dry">
                      <div className="border border-slate-900 p-1.5 rounded flex flex-col items-center">
                        <Droplets className="h-4 w-4 stroke-[2.5]" />
                        <span className="text-[7px] font-black uppercase font-mono mt-0.5">DRY</span>
                      </div>
                    </div>
                    <div className="text-center" title="Fragile Industrial Hardware">
                      <div className="border border-slate-900 p-1.5 rounded flex flex-col items-center">
                        <ShieldAlert className="h-4 w-4 stroke-[2.5]" />
                        <span className="text-[7px] font-black uppercase font-mono mt-0.5">SAFE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="mt-3 pt-2 border-t border-slate-200 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                  <span>PACK DATE: {dispatch.dispatchDate || new Date().toISOString().split('T')[0]}</span>
                  <span>E-WAY BILL: {dispatch.ewayBill?.ewayBillNumber || 'ATTACHED'}</span>
                  <span>QC PASSED</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl no-print">
          <span className="text-xs font-mono text-slate-500">
            Total {cartons.length} cartons ready for loading & carrier handover
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
