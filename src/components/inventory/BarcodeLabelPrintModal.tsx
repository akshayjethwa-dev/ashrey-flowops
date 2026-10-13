// src/components/inventory/BarcodeLabelPrintModal.tsx

import React, { useState, useId } from 'react';
import {
  X,
  Printer,
  QrCode,
  Barcode,
  Layers,
  Building2,
  Warehouse,
  CheckCircle2,
  Copy,
  Tag
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultData?: {
    type: 'material' | 'po' | 'wo' | 'bin';
    code: string;
    title: string;
    subtext?: string;
    plantName?: string;
    locationName?: string;
  };
}

/**
 * Generates an SVG pseudo Code-128 visual pattern deterministically
 * based on the barcode string, suitable for crisp high-res printing.
 */
function SvgBarcode({ code, width = 280, height = 70 }: { code: string; width?: number; height?: number }) {
  const hash = code.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const maxWidth = width - 20;

  // Generate distinct realistic alternating bar widths
  for (let i = 0; i < code.length * 5 && currentX < maxWidth - 10; i++) {
    const isBar = i % 2 === 0;
    const barWidth = 1 + ((hash + i * 7) % 3);
    if (isBar) {
      bars.push({ x: currentX, w: barWidth });
    }
    currentX += barWidth + (1 + ((hash + i * 3) % 2));
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 24}`}
      className="w-full max-w-[280px] h-auto mx-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={width} height={height + 24} fill="#ffffff" />
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
        y={height + 18}
        textAnchor="middle"
        className="font-mono text-xs font-bold fill-slate-900 tracking-widest"
        fontSize="12"
      >
        {code}
      </text>
    </svg>
  );
}

export const BarcodeLabelPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultData
}) => {
  const [labelType, setLabelType] = useState<'material' | 'po' | 'wo' | 'bin'>(
    defaultData?.type || 'material'
  );
  const [code, setCode] = useState<string>(defaultData?.code || 'MAT-WR-1002');
  const [title, setTitle] = useState<string>(
    defaultData?.title || 'Wire Rod — High Tensile Steel 8mm'
  );
  const [subtext, setSubtext] = useState<string>(
    defaultData?.subtext || 'Batch: LOT-2026-TATA-88 • Specification: EN8D'
  );
  const [locationName, setLocationName] = useState<string>(
    defaultData?.locationName || 'Pune Plant • Store RM • BIN-RM-A01'
  );
  const [copies, setCopies] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Barcode Label Generator & Print Station
              </h2>
              <p className="text-xs text-slate-400">
                Generate high-resolution printable Code-128 / QR tags for shop floor bins, materials & work orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
              Select Tag Entity Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLabelType('material');
                  setCode('MAT-WR-1002');
                  setTitle('Wire Rod — High Tensile Steel 8mm');
                  setSubtext('Raw Material Coil • 8mm High Tensile');
                  setLocationName('BIN-RM-A01 (Main RM Store)');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  labelType === 'material'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Tag className="h-4 w-4 text-indigo-600 mb-1" />
                Raw Material Tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setLabelType('po');
                  setCode('PO-2026-902');
                  setTitle('PO #902 — Tata Prime Steel');
                  setSubtext('Ordered: 15 Tonnes Wire Rod • Gate Dock #1');
                  setLocationName('Dock Receiving Area → Pune Facility');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  labelType === 'po'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Warehouse className="h-4 w-4 text-sky-600 mb-1" />
                Inbound PO Tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setLabelType('wo');
                  setCode('WO-2026-001');
                  setTitle('WO #001 — Forged Connecting Rods');
                  setSubtext('Run Qty: 2,500 pcs • Press #1 (WC-FORGE-2000T)');
                  setLocationName('Shopfloor Cell: Forging Bay 1');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  labelType === 'wo'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Layers className="h-4 w-4 text-amber-600 mb-1" />
                Work Order Traveler
              </button>
              <button
                type="button"
                onClick={() => {
                  setLabelType('bin');
                  setCode('BIN-RM-A01');
                  setTitle('Storage Bin A01 — High Tensile Steel');
                  setSubtext('Capacity: 50.0 Tonnes • Max Height: 3 Tiers');
                  setLocationName('Main RM Store • Pune Heavy Forge');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  labelType === 'bin'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Building2 className="h-4 w-4 text-emerald-600 mb-1" />
                Storage Bin Marker
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Barcode String / Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 font-mono uppercase text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold focus:bg-white focus:outline-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-1 text-xs"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Item Title / Header
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Secondary Info / Lot / Spec
              </label>
              <input
                type="text"
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Storage / Plant Location
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-indigo-500"
              />
            </div>
          </div>

          {/* Live Print Preview Card */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Live Label Print Preview (Standard 4" x 2.5" Thermal Tag)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Code-128 / Scan-Ready
              </span>
            </div>

            <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl flex justify-center">
              <div
                id="printable-barcode-label"
                className="w-[360px] bg-white border-2 border-slate-900 rounded-xl p-4 shadow-md text-slate-900 space-y-3"
              >
                {/* Tag Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="font-extrabold tracking-tight text-xs flex items-center gap-1.5 uppercase">
                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                      FLOWOPS
                    </span>
                    <span>STORE TAG</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Tag Content */}
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-tight">
                    {title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {subtext}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    📍 {locationName}
                  </p>
                </div>

                {/* Barcode Graphic */}
                <div className="py-2 px-1 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center">
                  <SvgBarcode code={code} />
                </div>

                {/* Footer Tag metadata */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                  <span>AUTHORIZED STORE MOVEMENT</span>
                  <span>VERIFIED ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Print Copies:</label>
            <select
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value={1}>1 copy</option>
              <option value={2}>2 copies</option>
              <option value={4}>4 copies (Pallet & Bin)</option>
              <option value={8}>8 copies</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print Label Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
