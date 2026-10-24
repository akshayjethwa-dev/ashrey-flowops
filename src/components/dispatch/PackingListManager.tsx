// src/components/dispatch/PackingListManager.tsx

import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Printer, 
  Download, 
  Plus, 
  CheckCircle2, 
  Scale, 
  Maximize2, 
  Barcode, 
  ShieldCheck, 
  Truck, 
  Search,
  Check,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { PackageCarton, BoxPackageType } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';
import { packingDispatchService } from '../../services/packingDispatchService';
import { PrintablePackingListModal } from './PrintablePackingListModal';
import { CartonShippingLabelModal } from './CartonShippingLabelModal';

interface PackingListManagerProps {
  dispatch: Dispatch;
  cartons: PackageCarton[];
  onUpdateCartons: (updatedCartons: PackageCarton[]) => void;
}

export const PackingListManager: React.FC<PackingListManagerProps> = ({
  dispatch,
  cartons,
  onUpdateCartons
}) => {
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAddCartonModal, setShowAddCartonModal] = useState(false);

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Carton Form State
  const [newBoxType, setNewBoxType] = useState<BoxPackageType>('corrugated_box');
  const [newLength, setNewLength] = useState(50);
  const [newWidth, setNewWidth] = useState(40);
  const [newHeight, setNewHeight] = useState(35);
  const [newTareWeight, setNewTareWeight] = useState(1.8);
  const [newNetWeight, setNewNetWeight] = useState(15.0);
  const [newSealNumber, setNewSealNumber] = useState(`SEAL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [newHandling, setNewHandling] = useState('FRAGILE · THIS SIDE UP · PRECISION PARTS');

  const stats = packingDispatchService.calculateCartonAggregates(cartons);

  // Toggle carton loaded status
  const handleToggleLoaded = (cartonId: string) => {
    const updated = cartons.map(c => {
      if (c.id === cartonId) {
        const nextStatus = c.status === 'loaded' ? 'packed' : 'loaded';
        return {
          ...c,
          status: nextStatus as any,
          loadedAt: nextStatus === 'loaded' ? new Date().toISOString() : undefined,
          verifiedBy: nextStatus === 'loaded' ? 'Dock Dispatcher' : undefined
        };
      }
      return c;
    });
    onUpdateCartons(updated);
  };

  // Barcode Scan Handler
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toUpperCase();
    if (!query) return;

    const matchedCarton = cartons.find(c => 
      c.barcode.toUpperCase() === query || 
      c.cartonNumber.toUpperCase() === query ||
      c.sealNumber?.toUpperCase() === query
    );

    if (matchedCarton) {
      if (matchedCarton.status === 'loaded') {
        setScanFeedback({
          message: `Notice: Carton ${matchedCarton.cartonNumber} was already verified & loaded on vehicle.`,
          type: 'success'
        });
      } else {
        const updated = cartons.map(c => {
          if (c.id === matchedCarton.id) {
            return {
              ...c,
              status: 'loaded' as const,
              loadedAt: new Date().toISOString(),
              verifiedBy: 'Barcode Scanner Handheld'
            };
          }
          return c;
        });
        onUpdateCartons(updated);
        setScanFeedback({
          message: `SUCCESS: Carton ${matchedCarton.cartonNumber} (${matchedCarton.grossWeightKg} kg) verified & loaded!`,
          type: 'success'
        });
      }
    } else {
      setScanFeedback({
        message: `NO MATCH: Barcode / Carton "${query}" does not belong to this dispatch slip.`,
        type: 'error'
      });
    }

    setScanInput('');
  };

  // Add Custom Carton
  const handleAddCarton = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeq = cartons.length + 1;
    const grossWeight = parseFloat((newNetWeight + newTareWeight).toFixed(2));
    const volumeCbm = parseFloat(((newLength * newWidth * newHeight) / 1000000).toFixed(4));

    const newCarton: PackageCarton = {
      id: `ctn_${Date.now()}_${nextSeq}`,
      cartonNumber: `CTN-${nextSeq.toString().padStart(2, '0')}`,
      boxType: newBoxType,
      dimensions: {
        lengthCm: newLength,
        widthCm: newWidth,
        heightCm: newHeight
      },
      volumeCbm,
      tareWeightKg: newTareWeight,
      netWeightKg: newNetWeight,
      grossWeightKg: grossWeight,
      sealNumber: newSealNumber,
      barcode: `EAN-${Date.now().toString().slice(-5)}${nextSeq.toString().padStart(2, '0')}`,
      status: 'packed',
      handlingInstructions: newHandling,
      items: (dispatch.items || []).slice(0, 1).map(itm => ({
        itemId: itm.id || `itm_${Date.now()}`,
        itemName: itm.name,
        partNumber: `PN-${itm.name.slice(0, 6).toUpperCase()}`,
        batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
        quantity: Math.max(1, Math.min(itm.quantity, 10)),
        uom: 'Nos',
        unitWeightKg: 2.5,
        totalWeightKg: newNetWeight
      }))
    };

    onUpdateCartons([...cartons, newCarton]);
    setShowAddCartonModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6 font-sans">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-black">
            PACKING & CONTAINER MANAGEMENT · ISO 21067
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            Carton Packaging & Dispatch Manifest
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage box packaging, barcode labeling, gross/net weights, tamper seals, and loading dock check-offs.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowScannerModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Barcode className="h-3.5 w-3.5 text-slate-300" />
            <span>Scan & Verify Loading</span>
          </button>

          <button
            onClick={() => setShowLabelsModal(true)}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
            title="Print 4x6 / A6 Carton Shipping Labels with barcodes"
          >
            <Package className="h-3.5 w-3.5 text-slate-500" />
            <span>Carton Labels</span>
          </button>

          <button
            onClick={() => setShowPackingSlipModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            title="Generate & print commercial packing list document"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Print Packing List</span>
          </button>

          <button
            onClick={() => setShowAddCartonModal(true)}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer"
            title="Add additional carton"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-xs">
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">TOTAL PACKAGES</span>
          <strong className="text-base text-slate-900 block font-black">{stats.totalPackages} Cartons</strong>
          <span className="text-[10px] text-slate-500 block">
            {stats.loadedCount} of {stats.totalPackages} loaded on truck
          </span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">TOTAL GROSS WEIGHT</span>
          <strong className="text-base text-slate-900 block font-black">{stats.totalGrossWeightKg} Kg</strong>
          <span className="text-[10px] text-slate-500 block">
            Net: {stats.totalNetWeightKg} Kg · Tare: {(stats.totalGrossWeightKg - stats.totalNetWeightKg).toFixed(2)} Kg
          </span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">TOTAL CARGO VOLUME</span>
          <strong className="text-base text-indigo-700 block font-black">{stats.totalVolumeCbm} CBM</strong>
          <span className="text-[10px] text-slate-500 block">
            Volumetric Wt: {(stats.totalVolumeCbm * 167).toFixed(1)} Kg
          </span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">LOADING DOCK STATUS</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              stats.isFullyLoaded 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {stats.isFullyLoaded ? 'Ready For Gate Pass' : `${stats.packedCount} Pending Loading`}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Bay #{dispatch.dispatchBay || '3 North Dock'}
          </span>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
          <span>Loading Dock Verification Progress</span>
          <span>{stats.loadedCount} of {stats.totalPackages} Verified ({Math.round((stats.loadedCount / Math.max(1, stats.totalPackages)) * 100)}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(stats.loadedCount / Math.max(1, stats.totalPackages)) * 100}%` }}
          />
        </div>
      </div>

      {/* Carton Cards Grid */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider">
          Individual Carton Package Details ({cartons.length} registered)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cartons.map((carton, cIdx) => (
            <div 
              key={carton.id}
              className={`border rounded-xl p-4 transition space-y-3 ${
                carton.status === 'loaded' 
                  ? 'bg-emerald-50/20 border-emerald-200 shadow-2xs' 
                  : 'bg-white border-slate-200 shadow-3xs'
              }`}
            >
              {/* Carton Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {carton.cartonNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 capitalize">
                      {carton.boxType.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Barcode: <strong className="text-slate-700">{carton.barcode}</strong> · Seal: <strong className="text-emerald-700">{carton.sealNumber}</strong>
                  </span>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleLoaded(carton.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold tracking-wider flex items-center space-x-1 transition cursor-pointer border ${
                    carton.status === 'loaded'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                  }`}
                  title={carton.status === 'loaded' ? 'Click to mark pending' : 'Click to mark loaded on vehicle'}
                >
                  {carton.status === 'loaded' ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Loaded</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-3 w-3 text-slate-400" />
                      <span>Mark Loaded</span>
                    </>
                  )}
                </button>
              </div>

              {/* Physical Spec Strip */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">DIMS (L×W×H)</span>
                  <strong>{carton.dimensions.lengthCm}×{carton.dimensions.widthCm}×{carton.dimensions.heightCm} cm</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">GROSS WEIGHT</span>
                  <strong className="text-slate-900">{carton.grossWeightKg} Kg</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">VOLUME (CBM)</span>
                  <strong>{carton.volumeCbm} CBM</strong>
                </div>
              </div>

              {/* Contained Items Table */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-mono uppercase font-black text-slate-400 block">
                  PACKED CONTENTS ({carton.items.length} items):
                </span>
                <div className="space-y-1 text-xs">
                  {carton.items.map((itm, iIdx) => (
                    <div key={iIdx} className="flex justify-between items-center bg-slate-50/50 p-1.5 rounded border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] leading-tight">{itm.itemName}</p>
                        <p className="text-[9px] font-mono text-slate-400">
                          {itm.partNumber && <span>{itm.partNumber} · </span>}
                          {itm.batchNumber && <span>Batch: {itm.batchNumber}</span>}
                        </p>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-black text-indigo-900">
                          Qty: {itm.quantity} {itm.uom}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Handling instruction note */}
              {carton.handlingInstructions && (
                <div className="text-[9px] font-mono text-slate-400 italic">
                  {carton.handlingInstructions}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* Barcode Scanner & Loading Dock Verification Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Barcode className="h-5 w-5 text-indigo-600" />
                <span>Loading Dock Carton Verification</span>
              </h4>
              <button onClick={() => setShowScannerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Scan carton barcode or type Carton Number (e.g. <code>CTN-01</code> or <code>EAN-xxxx</code>) as cartons are loaded into transit vehicle <strong>{dispatch.vehicleNumber}</strong>.
            </p>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                  Barcode Scanner Input / Rapid Input:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Scan or enter barcode..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {scanFeedback && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  scanFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {scanFeedback.message}
                </div>
              )}

              {/* Quick Click Barcodes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Quick Check-Off Cartons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cartons.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setScanInput(c.barcode);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-mono border ${
                        c.status === 'loaded'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c.cartonNumber} {c.status === 'loaded' ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase"
                >
                  Done Scanning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Carton Modal */}
      {showAddCartonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <span>Add Carton to Manifest</span>
              </h4>
              <button onClick={() => setShowAddCartonModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCarton} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Packaging Type:
                </label>
                <select
                  value={newBoxType}
                  onChange={(e) => setNewBoxType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                >
                  <option value="corrugated_box">Corrugated Heavy Duty Box (5-Ply)</option>
                  <option value="wooden_crate">Treated Wooden Crate (ISPM-15)</option>
                  <option value="pallet">Heat-Treated Wooden Pallet</option>
                  <option value="hdpe_drum">HDPE Chemical / Hardware Drum</option>
                  <option value="polybag">Heavy Gauge Industrial Polybag</option>
                  <option value="metal_case">Metal Flight / Transit Case</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Length (cm):</label>
                  <input
                    type="number"
                    min="1"
                    value={newLength}
                    onChange={(e) => setNewLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Width (cm):</label>
                  <input
                    type="number"
                    min="1"
                    value={newWidth}
                    onChange={(e) => setNewWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Height (cm):</label>
                  <input
                    type="number"
                    min="1"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Tare Weight (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newTareWeight}
                    onChange={(e) => setNewTareWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Net Content Wt (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newNetWeight}
                    onChange={(e) => setNewNetWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Security Tamper Seal #:</label>
                <input
                  type="text"
                  value={newSealNumber}
                  onChange={(e) => setNewSealNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Handling Symbols & Instructions:</label>
                <input
                  type="text"
                  value={newHandling}
                  onChange={(e) => setNewHandling(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCartonModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Add Carton
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing List Slip Modal */}
      {showPackingSlipModal && (
        <PrintablePackingListModal
          isOpen={showPackingSlipModal}
          onClose={() => setShowPackingSlipModal(false)}
          cartons={cartons}
          dispatch={dispatch}
        />
      )}

      {/* Carton Shipping Labels Modal */}
      {showLabelsModal && (
        <CartonShippingLabelModal
          isOpen={showLabelsModal}
          onClose={() => setShowLabelsModal(false)}
          cartons={cartons}
          dispatch={dispatch}
        />
      )}

    </div>
  );
};
