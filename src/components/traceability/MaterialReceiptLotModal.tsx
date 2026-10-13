// src/components/traceability/MaterialReceiptLotModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building2,
  Package,
  Calendar,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';
import {
  LotType,
  CreateMaterialReceiptLotInput,
  QualityTestParameter
} from '../../types/traceability';
import { useAuth } from '../../context/AuthContext';
import { usePlants } from '../../hooks/usePlants';
import { useStockItems } from '../../hooks/useStockInventory';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { PurchaseOrder } from '../../types/purchaseOrder';

interface MaterialReceiptLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMaterialReceiptLotInput) => Promise<any>;
}

export const MaterialReceiptLotModal: React.FC<MaterialReceiptLotModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { tenant, profile } = useAuth();
  const { plants } = usePlants(tenant?.id);
  const { items: stockItems } = useStockItems(tenant?.id);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [lotType, setLotType] = useState<LotType>('raw_material');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [materialGrade, setMaterialGrade] = useState<string>('EN8D (AISI 1045)');
  const [heatNumber, setHeatNumber] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('Tata Prime Steel Ltd.');
  const [vendorChallanNo, setVendorChallanNo] = useState<string>('');
  const [vendorLotNumber, setVendorLotNumber] = useState<string>('');
  const [receivedQty, setReceivedQty] = useState<number>(10);
  const [unit, setUnit] = useState<string>('tonnes');
  const [unitCost, setUnitCost] = useState<number>(68500);

  // Plant & Location
  const [plantId, setPlantId] = useState<string>('plant-pune');
  const [plantName, setPlantName] = useState<string>('Pune Heavy Forge Facility');
  const [storeName, setStoreName] = useState<string>('Main Raw Materials Store');
  const [binCode, setBinCode] = useState<string>('BIN-RM-A01');

  // Inspection
  const [inspectionPassed, setInspectionPassed] = useState<boolean>(true);
  const [mtrNumber, setMtrNumber] = useState<string>('');
  const [testParams, setTestParams] = useState<QualityTestParameter[]>([
    { name: 'Tensile Strength (UTS)', specification: '650 - 750 MPa', measuredValue: '705 MPa', status: 'pass' },
    { name: 'Yield Strength (YS)', specification: '≥ 420 MPa', measuredValue: '450 MPa', status: 'pass' },
    { name: 'Carbon Content (C%)', specification: '0.40 - 0.45%', measuredValue: '0.42%', status: 'pass' },
    { name: 'Diameter Tolerance', specification: '8.00 ± 0.08 mm', measuredValue: '8.02 mm', status: 'pass' }
  ]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (tenant?.id) {
      purchaseOrderService.getPurchaseOrders(tenant.id).then(pos => {
        setPurchaseOrders(pos);
      });
    }
  }, [tenant?.id]);

  useEffect(() => {
    if (plants.length > 0 && !plantId) {
      setPlantId(plants[0].id);
      setPlantName(plants[0].name);
    }
  }, [plants, plantId]);

  useEffect(() => {
    if (stockItems.length > 0 && !selectedStockId) {
      const first = stockItems[0];
      setSelectedStockId(first.id);
      setUnit(first.unit || 'tonnes');
      setUnitCost((first as any).unitPrice || 68500);
    }
  }, [stockItems, selectedStockId]);

  const handlePoSelect = (poNum: string) => {
    setSelectedPoNumber(poNum);
    if (!poNum) return;
    const po = purchaseOrders.find(p => p.poNumber === poNum);
    if (po) {
      setSupplierName(po.supplierName);
      if (po.items && po.items.length > 0) {
        const item = po.items[0];
        const matchStock = stockItems.find(s => s.code === item.stockItemCode);
        if (matchStock) setSelectedStockId(matchStock.id);
        setReceivedQty(item.orderedQty);
        setUnit(item.unit);
        setUnitCost(item.unitPrice);
        if (item.targetBinCode) setBinCode(item.targetBinCode);
        if (item.targetStoreName) setStoreName(item.targetStoreName);
      }
      if (!vendorChallanNo) {
        setVendorChallanNo(`CH-${Math.floor(10000 + Math.random() * 90000)}`);
      }
      if (!heatNumber) {
        setHeatNumber(`HT-${po.supplierName.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
  };

  const handleStockChange = (stockId: string) => {
    setSelectedStockId(stockId);
    const item = stockItems.find(s => s.id === stockId);
    if (item) {
      setUnit(item.unit || 'units');
      setUnitCost((item as any).unitPrice || 100);
    }
  };

  const handlePlantChange = (pId: string) => {
    setPlantId(pId);
    const pl = plants.find(p => p.id === pId);
    if (pl) setPlantName(pl.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentStock = stockItems.find(s => s.id === selectedStockId) || {
      id: 'stock-custom',
      code: 'SKU-INWARD',
      name: 'Direct Inward Material',
      category: 'raw_material' as const
    };

    setIsSubmitting(true);
    try {
      await onSubmit({
        lotType,
        stockItemId: currentStock.id,
        stockItemCode: currentStock.code,
        stockItemName: currentStock.name,
        category: (currentStock.category as any) || 'raw_material',
        materialGrade,
        heatNumber: heatNumber.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        poNumber: selectedPoNumber || undefined,
        vendorChallanNo: vendorChallanNo.trim() || undefined,
        vendorLotNumber: vendorLotNumber.trim() || undefined,
        receivedQty: Number(receivedQty),
        unit,
        unitCost: Number(unitCost),
        plantId,
        plantName,
        storeId: `store-${plantId}`,
        storeName,
        binId: `bin-${binCode.toLowerCase()}`,
        binCode,
        manufactureDate: new Date().toISOString(),
        inspectionPassed,
        mtrNumber: mtrNumber.trim() || undefined,
        testParameters: testParams,
        receivedBy: profile?.uid || 'usr-qc',
        receivedByName: profile?.name || 'Quality Inspector',
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      alert(`Failed to inward material: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <QrCode className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight">Material Receipt & Auto Lot Generation</h3>
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  GRN Dock Inward
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Automatically generate standardized lot barcodes, capture mill heat certificates, and record receiving inspection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Quick PO Autofill Banner */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">
                Link to Inbound Purchase Order (Optional Autofill)
              </label>
              <p className="text-xs text-indigo-700">
                Selecting an active PO auto-populates supplier name, target storage bin, unit cost, and SKU.
              </p>
            </div>
            <div className="w-full md:w-72">
              <select
                value={selectedPoNumber}
                onChange={e => handlePoSelect(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border-indigo-200 bg-white text-indigo-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              >
                <option value="">-- Manual GRN (No PO) --</option>
                {purchaseOrders.map(po => (
                  <option key={po.id} value={po.poNumber}>
                    {po.poNumber} — {po.supplierName} ({po.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 1: Material & Master SKU */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span>1. Material Master & Classification</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Classification</label>
                <select
                  value={lotType}
                  onChange={e => setLotType(e.target.value as LotType)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                >
                  <option value="raw_material">Raw Material (Coil, Bar, Ingot)</option>
                  <option value="sub_assembly">Machined Sub-Assembly</option>
                  <option value="bought_out">Bought-Out Hardware / Fastener</option>
                  <option value="finished_goods">Finished Goods Unit</option>
                  <option value="consumable">Consumable (Tooling, Coolant)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Item / SKU</label>
                <select
                  value={selectedStockId}
                  onChange={e => handleStockChange(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                >
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.code}] {item.name} — ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Grade / Spec</label>
                <input
                  type="text"
                  value={materialGrade}
                  onChange={e => setMaterialGrade(e.target.value)}
                  placeholder="e.g. EN8D, AISI 4140, SS 304"
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mill Heat / Cast # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={heatNumber}
                  onChange={e => setHeatNumber(e.target.value)}
                  placeholder="e.g. HT-TATA-9942"
                  className="w-full text-sm font-mono font-medium rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-amber-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Mill Name</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="e.g. Tata Prime Steel Ltd."
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quantities, Challan & Valuation */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>2. Inward Quantity & Vendor Invoicing</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Received Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={receivedQty}
                  onChange={e => setReceivedQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-semibold rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="tonnes, kg, units"
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landed Cost / Unit (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={unitCost}
                  onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Valuation</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-800">
                  ₹{(receivedQty * unitCost).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Delivery Challan #</label>
                <input
                  type="text"
                  value={vendorChallanNo}
                  onChange={e => setVendorChallanNo(e.target.value)}
                  placeholder="e.g. CH-88219"
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Batch / Coil Tag</label>
                <input
                  type="text"
                  value={vendorLotNumber}
                  onChange={e => setVendorLotNumber(e.target.value)}
                  placeholder="e.g. TAT-COIL-993-B"
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Storage Bin</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Main Raw Materials Store"
                    className="w-full text-xs rounded-lg border-slate-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    value={binCode}
                    onChange={e => setBinCode(e.target.value)}
                    placeholder="BIN-RM-A01"
                    className="w-full text-xs font-mono font-bold text-indigo-700 rounded-lg border-slate-300 px-3 py-2 bg-indigo-50/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Receiving Quality Inspection & MTR */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>3. Receiving Quality Inspection & Mill Test Certificate (MTR)</span>
              </span>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-slate-600">Inspection Disposition:</label>
                <button
                  type="button"
                  onClick={() => setInspectionPassed(true)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    inspectionPassed
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pass & Release
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionPassed(false)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    !inspectionPassed
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Quarantine Hold
                </button>
              </div>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mill Test Report (MTR) / COA Certificate #
                </label>
                <input
                  type="text"
                  value={mtrNumber}
                  onChange={e => setMtrNumber(e.target.value)}
                  placeholder="e.g. MTR-TATA-2026-9942A"
                  className="w-full text-sm font-mono rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Clean surface, ultrasonic scan clear, packaging intact"
                  className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                />
              </div>
            </div>

            {/* Test Parameters Mini-Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Spectrometer & Physical Metallurgical Verification Checklist
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {testParams.map((param, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-800">{param.name}</div>
                      <div className="text-[10px] text-slate-400">Spec: {param.specification}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-700 text-xs font-medium">{param.measuredValue}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        PASS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Standard lot ID format <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700">LOT-2026-RM-XXXX</code> will be generated.
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Inwarding...' : 'Generate Lot & Inward Material'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
