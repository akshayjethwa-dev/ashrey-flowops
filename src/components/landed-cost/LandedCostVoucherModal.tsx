// src/components/landed-cost/LandedCostVoucherModal.tsx

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Ship,
  Scale,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calculator,
  AlertCircle
} from 'lucide-react';
import {
  LandedCostVoucher,
  LandedCostCharge,
  LandedCostLotLine,
  LandedCostComponentType,
  LandedCostAllocationRule
} from '../../types/landedCost';
import { landedCostService, COMPONENT_LABELS, ALLOCATION_RULES_METADATA } from '../../services/landedCostService';

interface LandedCostVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Partial<LandedCostVoucher>, andPost?: boolean) => void;
  initialVoucher?: LandedCostVoucher | null;
}

// Pre-seeded selectable candidate lots from POs/GRNs for ease of allocation
const PRESET_CANDIDATE_LOTS: Omit<LandedCostLotLine, 'id' | 'allocatedChargeAmount' | 'allocatedCostPerUnit' | 'trueLandedCostPerUnit' | 'landedMarkupPercent'>[] = [
  {
    lotNumber: 'LOT-2026-RM-0412',
    itemId: 'ITEM-RM-001',
    itemCode: 'RM-1018-001',
    itemName: 'Steel Wire Rod 12.5mm SAE 1018',
    category: 'raw_material',
    grnNumber: 'GRN-2026-0412',
    poNumber: 'PO-2026-0891',
    vendorName: 'ArcelorMittal Europe Long Products',
    quantity: 10.0,
    uom: 'Tonnes',
    weightKg: 10000,
    baseUnitCost: 68500,
    baseTotalValue: 685000
  },
  {
    lotNumber: 'LOT-2026-RM-0365',
    itemId: 'ITEM-RM-001',
    itemCode: 'RM-1018-001',
    itemName: 'Steel Wire Rod 12.5mm SAE 1018',
    category: 'raw_material',
    grnNumber: 'GRN-2026-0365',
    poNumber: 'PO-2026-0891',
    vendorName: 'ArcelorMittal Europe Long Products',
    quantity: 5.8,
    uom: 'Tonnes',
    weightKg: 5800,
    baseUnitCost: 68500,
    baseTotalValue: 397300
  },
  {
    lotNumber: 'LOT-2026-RM-0301',
    itemId: 'ITEM-RM-001',
    itemCode: 'RM-1018-001',
    itemName: 'Steel Wire Rod 12.5mm SAE 1018',
    category: 'raw_material',
    grnNumber: 'GRN-2026-0301',
    poNumber: 'PO-2026-0810',
    vendorName: 'ArcelorMittal Europe Long Products',
    quantity: 2.0,
    uom: 'Tonnes',
    weightKg: 2000,
    baseUnitCost: 68475,
    baseTotalValue: 136950
  },
  {
    lotNumber: 'LOT-2025-SP-0012',
    itemId: 'ITEM-SPR-001',
    itemCode: 'SPR-DIE-001',
    itemName: 'Cold Forging Die Block Hardened D2',
    category: 'spare',
    grnNumber: 'GRN-2026-0511',
    poNumber: 'PO-2026-0940',
    vendorName: 'Bohler Bleche GmbH',
    quantity: 8,
    uom: 'Pcs',
    weightKg: 240,
    baseUnitCost: 28000,
    baseTotalValue: 224000
  },
  {
    lotNumber: 'LOT-2026-SP-0025',
    itemId: 'ITEM-SPR-002',
    itemCode: 'SPR-INS-044',
    itemName: 'Carbide Chamfer Inserts TiAlN Coated',
    category: 'spare',
    grnNumber: 'GRN-2026-0520',
    poNumber: 'PO-2026-0940',
    vendorName: 'Bohler Bleche GmbH',
    quantity: 40,
    uom: 'Pcs',
    weightKg: 20,
    baseUnitCost: 4000,
    baseTotalValue: 160000
  },
  {
    lotNumber: 'LOT-2026-RM-0480',
    itemId: 'ITEM-RM-004',
    itemCode: 'RM-EN8-040',
    itemName: 'Forging Quality Round Bar EN8 40mm',
    category: 'raw_material',
    grnNumber: 'GRN-2026-0601',
    poNumber: 'PO-2026-1020',
    vendorName: 'Tata Steel Long Products',
    quantity: 12.0,
    uom: 'Tonnes',
    weightKg: 12000,
    baseUnitCost: 52000,
    baseTotalValue: 624000
  },
  {
    lotNumber: 'LOT-2026-RM-0481',
    itemId: 'ITEM-RM-005',
    itemCode: 'RM-20MN-050',
    itemName: 'Case Hardening Steel 20MnCr5 50mm',
    category: 'raw_material',
    grnNumber: 'GRN-2026-0602',
    poNumber: 'PO-2026-1020',
    vendorName: 'Tata Steel Long Products',
    quantity: 4.0,
    uom: 'Tonnes',
    weightKg: 4000,
    baseUnitCost: 54000,
    baseTotalValue: 216000
  }
];

export const LandedCostVoucherModal: React.FC<LandedCostVoucherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVoucher
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [voucherNumber, setVoucherNumber] = useState(initialVoucher?.voucherNumber || '');
  const [voucherDate, setVoucherDate] = useState(initialVoucher?.voucherDate || new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState(initialVoucher?.title || '');
  const [shipmentRef, setShipmentRef] = useState(initialVoucher?.shipmentRef || '');
  const [customsDocRef, setCustomsDocRef] = useState(initialVoucher?.customsDocRef || '');
  const [carrierName, setCarrierName] = useState(initialVoucher?.carrierName || '');
  const [originLocation, setOriginLocation] = useState(initialVoucher?.originLocation || 'Nhava Sheva Port, Mumbai');
  const [destinationPlant, setDestinationPlant] = useState(initialVoucher?.destinationPlant || 'Main Automotive Forging Plant (Unit 1)');
  const [defaultAllocationRule, setDefaultAllocationRule] = useState<LandedCostAllocationRule>(
    initialVoucher?.defaultAllocationRule || 'by_weight'
  );
  const [notes, setNotes] = useState(initialVoucher?.notes || '');

  // Charges
  const [charges, setCharges] = useState<LandedCostCharge[]>(
    initialVoucher?.charges || [
      {
        id: `chg-${Date.now()}-1`,
        componentType: 'ocean_freight',
        description: 'Container Sea Freight & Ocean Carrier Charges',
        vendorName: 'Maersk Logistics India',
        invoiceNumber: 'INV-MSK-901',
        invoiceDate: new Date().toISOString().split('T')[0],
        currency: 'INR',
        amount: 65000,
        taxAmount: 0,
        totalAmount: 65000
      },
      {
        id: `chg-${Date.now()}-2`,
        componentType: 'customs_duty',
        description: 'Basic Customs Duty (BCD) & SWS',
        vendorName: 'CBIC Customs Department',
        invoiceNumber: 'BOE-E-PAY-441',
        invoiceDate: new Date().toISOString().split('T')[0],
        currency: 'INR',
        amount: 42000,
        taxAmount: 0,
        totalAmount: 42000
      }
    ]
  );

  // Lots
  const [lotLines, setLotLines] = useState<LandedCostLotLine[]>(
    initialVoucher?.lotLines || [
      {
        ...PRESET_CANDIDATE_LOTS[0],
        id: `line-${Date.now()}-1`,
        allocatedChargeAmount: 0,
        allocatedCostPerUnit: 0,
        trueLandedCostPerUnit: PRESET_CANDIDATE_LOTS[0].baseUnitCost,
        landedMarkupPercent: 0
      },
      {
        ...PRESET_CANDIDATE_LOTS[1],
        id: `line-${Date.now()}-2`,
        allocatedChargeAmount: 0,
        allocatedCostPerUnit: 0,
        trueLandedCostPerUnit: PRESET_CANDIDATE_LOTS[1].baseUnitCost,
        landedMarkupPercent: 0
      }
    ]
  );

  // New Custom Lot Form
  const [showAddCustomLot, setShowAddCustomLot] = useState(false);
  const [customLot, setCustomLot] = useState({
    lotNumber: '',
    itemCode: '',
    itemName: '',
    quantity: 1,
    uom: 'Tonnes',
    weightKg: 1000,
    baseUnitCost: 60000
  });

  // Calculate live allocations whenever charges, lotLines, or rule changes
  const calculatedLines = useMemo(() => {
    return landedCostService.calculateAllocations(charges, lotLines, defaultAllocationRule);
  }, [charges, lotLines, defaultAllocationRule]);

  const totalChargesAmount = useMemo(() => {
    return charges.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
  }, [charges]);

  const totalBaseValue = useMemo(() => {
    return calculatedLines.reduce((sum, l) => sum + (Number(l.baseTotalValue) || 0), 0);
  }, [calculatedLines]);

  const effectiveMarkup = totalBaseValue > 0 ? (totalChargesAmount / totalBaseValue) * 100 : 0;

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleAddCharge = () => {
    const newCharge: LandedCostCharge = {
      id: `chg-${Date.now()}`,
      componentType: 'road_freight',
      description: '',
      vendorName: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      currency: 'INR',
      amount: 10000,
      totalAmount: 10000
    };
    setCharges([...charges, newCharge]);
  };

  const handleUpdateCharge = (id: string, updates: Partial<LandedCostCharge>) => {
    setCharges(
      charges.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        if (updates.amount !== undefined) {
          updated.totalAmount = Number(updates.amount) || 0;
        }
        return updated;
      })
    );
  };

  const handleRemoveCharge = (id: string) => {
    setCharges(charges.filter((c) => c.id !== id));
  };

  const handleSelectPresetLot = (preset: typeof PRESET_CANDIDATE_LOTS[0]) => {
    const exists = lotLines.some((l) => l.lotNumber === preset.lotNumber);
    if (exists) return;

    const newLine: LandedCostLotLine = {
      ...preset,
      id: `line-${Date.now()}-${Math.random()}`,
      allocatedChargeAmount: 0,
      allocatedCostPerUnit: 0,
      trueLandedCostPerUnit: preset.baseUnitCost,
      landedMarkupPercent: 0
    };
    setLotLines([...lotLines, newLine]);
  };

  const handleAddCustomLot = () => {
    if (!customLot.lotNumber || !customLot.itemName) return;
    const newLine: LandedCostLotLine = {
      id: `line-custom-${Date.now()}`,
      lotNumber: customLot.lotNumber.toUpperCase().trim(),
      itemId: `ITEM-CUSTOM-${Date.now()}`,
      itemCode: customLot.itemCode || 'CUSTOM-MAT',
      itemName: customLot.itemName,
      category: 'raw_material',
      quantity: Number(customLot.quantity) || 1,
      uom: customLot.uom,
      weightKg: Number(customLot.weightKg) || 0,
      baseUnitCost: Number(customLot.baseUnitCost) || 0,
      baseTotalValue: (Number(customLot.quantity) || 1) * (Number(customLot.baseUnitCost) || 0),
      allocatedChargeAmount: 0,
      allocatedCostPerUnit: 0,
      trueLandedCostPerUnit: Number(customLot.baseUnitCost) || 0,
      landedMarkupPercent: 0
    };
    setLotLines([...lotLines, newLine]);
    setShowAddCustomLot(false);
    setCustomLot({
      lotNumber: '',
      itemCode: '',
      itemName: '',
      quantity: 1,
      uom: 'Tonnes',
      weightKg: 1000,
      baseUnitCost: 60000
    });
  };

  const handleRemoveLot = (id: string) => {
    setLotLines(lotLines.filter((l) => l.id !== id));
  };

  const handleSaveVoucher = (andPost: boolean = false) => {
    const voucherPayload: Partial<LandedCostVoucher> = {
      id: initialVoucher?.id,
      voucherNumber: voucherNumber || undefined,
      voucherDate,
      title: title || `Landed Cost Allocation - ${voucherNumber || 'New'}`,
      status: andPost ? 'posted' : (initialVoucher?.status || 'draft'),
      shipmentRef,
      customsDocRef,
      carrierName,
      originLocation,
      destinationPlant,
      defaultAllocationRule,
      charges,
      lotLines: calculatedLines,
      notes
    };
    onSave(voucherPayload, andPost);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialVoucher ? `Edit Landed Cost Voucher ${initialVoucher.voucherNumber}` : 'Create Landed Cost Allocation Voucher'}
              </h2>
              <p className="text-xs text-slate-400">
                Allocate logistics, customs, and port charges into inventory lot valuation (GAAP / Ind AS 2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 text-xs">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 font-medium ${step === 1 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>1</span>
              Logistics Metadata
            </button>
            <span className="text-slate-600">→</span>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 font-medium ${step === 2 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>2</span>
              Charges ({charges.length})
            </button>
            <span className="text-slate-600">→</span>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 font-medium ${step === 3 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>3</span>
              Target Lots ({lotLines.length})
            </button>
            <span className="text-slate-600">→</span>
            <button
              onClick={() => setStep(4)}
              className={`flex items-center gap-1.5 font-medium ${step === 4 ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 4 ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>4</span>
              Allocation Preview
            </button>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Charges: <strong className="text-white">{formatCurrency(totalChargesAmount)}</strong>
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Logistics & Header Metadata */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Voucher Number
                  </label>
                  <input
                    type="text"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    placeholder="Auto (e.g. LCV-2026-004)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Voucher Date *
                  </label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Default Allocation Rule *
                  </label>
                  <select
                    value={defaultAllocationRule}
                    onChange={(e) => setDefaultAllocationRule(e.target.value as LandedCostAllocationRule)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="by_weight">By Weight (MT / kg) [Recommended for Freight]</option>
                    <option value="by_value">By Value (Invoice Amount) [Recommended for Duties]</option>
                    <option value="by_quantity">By Quantity (Units / Pcs)</option>
                    <option value="manual">Custom / Specific Distribution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Voucher Title / Description *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sea Freight & Customs Clearance for Wire Rod Consignment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Origin Port / Consignment Source
                  </label>
                  <input
                    type="text"
                    value={originLocation}
                    onChange={(e) => setOriginLocation(e.target.value)}
                    placeholder="e.g. Rotterdam Port / Jamshedpur Works"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Receiving Manufacturing Plant
                  </label>
                  <input
                    type="text"
                    value={destinationPlant}
                    onChange={(e) => setDestinationPlant(e.target.value)}
                    placeholder="e.g. Main Automotive Forging Plant (Unit 1)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Bill of Lading / AWB / LR #
                  </label>
                  <input
                    type="text"
                    value={shipmentRef}
                    onChange={(e) => setShipmentRef(e.target.value)}
                    placeholder="e.g. BL-MAEU-9812401"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Customs Bill of Entry (BoE) #
                  </label>
                  <input
                    type="text"
                    value={customsDocRef}
                    onChange={(e) => setCustomsDocRef(e.target.value)}
                    placeholder="e.g. BOE-JNPT-2026-8812"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Carrier / Shipping Line
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. Maersk Sealand Logistics"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Audit Notes & Commercial References
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Supporting commercial documentation, surveyor reports, customs assessment notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Incurred Landed Charges */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Incurred Landed Cost Charges</h3>
                  <p className="text-xs text-slate-400">
                    Add invoices for freight, import duty, port handling, and transit insurance to be allocated
                  </p>
                </div>
                <button
                  onClick={handleAddCharge}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Charge Item
                </button>
              </div>

              <div className="space-y-3">
                {charges.map((charge, idx) => (
                  <div
                    key={charge.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                        Charge #{idx + 1}
                      </span>
                      {charges.length > 1 && (
                        <button
                          onClick={() => handleRemoveCharge(charge.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded"
                          title="Remove charge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Component Type *</label>
                        <select
                          value={charge.componentType}
                          onChange={(e) => handleUpdateCharge(charge.id, { componentType: e.target.value as LandedCostComponentType })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                        >
                          {Object.keys(COMPONENT_LABELS).map((key) => (
                            <option key={key} value={key}>
                              {COMPONENT_LABELS[key as LandedCostComponentType].label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Vendor / Transporter *</label>
                        <input
                          type="text"
                          value={charge.vendorName}
                          onChange={(e) => handleUpdateCharge(charge.id, { vendorName: e.target.value })}
                          placeholder="e.g. Maersk Logistics"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Total Amount (INR) *</label>
                        <input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => handleUpdateCharge(charge.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={charge.invoiceNumber}
                          onChange={(e) => handleUpdateCharge(charge.id, { invoiceNumber: e.target.value })}
                          placeholder="e.g. MSK-IN-908"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={charge.invoiceDate}
                          onChange={(e) => handleUpdateCharge(charge.id, { invoiceDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                        <input
                          type="text"
                          value={charge.description}
                          onChange={(e) => handleUpdateCharge(charge.id, { description: e.target.value })}
                          placeholder="40ft Container Freight"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Incurred Charges:</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatCurrency(totalChargesAmount)}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Target Material Lots */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">Target Material Lots for Capitalization</h3>
                  <p className="text-xs text-slate-400">
                    Select lots received in this consignment that will absorb the landed charges
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddCustomLot(!showAddCustomLot)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Custom Lot
                  </button>
                </div>
              </div>

              {/* Quick Select from Received Inventory */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Select Candidate Lots (Recent GRNs / PO Receipts):
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CANDIDATE_LOTS.map((p) => {
                    const isSelected = lotLines.some((l) => l.lotNumber === p.lotNumber);
                    return (
                      <button
                        key={p.lotNumber}
                        disabled={isSelected}
                        onClick={() => handleSelectPresetLot(p)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700 hover:border-cyan-500/50'
                        }`}
                      >
                        <span className="font-mono font-semibold">{p.lotNumber}</span>
                        <span className="text-slate-400 font-sans">({p.itemName.split(' ')[0]})</span>
                        {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Lot Modal/Form */}
              {showAddCustomLot && (
                <div className="p-4 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400">Add Custom Material Lot</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Lot Number *</label>
                      <input
                        type="text"
                        value={customLot.lotNumber}
                        onChange={(e) => setCustomLot({ ...customLot, lotNumber: e.target.value })}
                        placeholder="LOT-2026-RM-XXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Material Name *</label>
                      <input
                        type="text"
                        value={customLot.itemName}
                        onChange={(e) => setCustomLot({ ...customLot, itemName: e.target.value })}
                        placeholder="Material description"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={customLot.quantity}
                        onChange={(e) => setCustomLot({ ...customLot, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Net Weight (kg)</label>
                      <input
                        type="number"
                        value={customLot.weightKg}
                        onChange={(e) => setCustomLot({ ...customLot, weightKg: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddCustomLot(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCustomLot}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                    >
                      Add Lot to List
                    </button>
                  </div>
                </div>
              )}

              {/* Current Lot List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 uppercase font-semibold">
                      <th className="py-2 px-3">Lot Number</th>
                      <th className="py-2 px-3">Material Description</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Weight (kg)</th>
                      <th className="py-2 px-3 text-right">Base Unit Cost</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {lotLines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-semibold text-cyan-300">{line.lotNumber}</td>
                        <td className="py-2 px-3 font-sans text-slate-200">{line.itemName}</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {line.quantity} {line.uom}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {line.weightKg.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(line.baseUnitCost)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveLot(line.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Remove lot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Live Allocation Engine Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Capitalized Valuation Preview ({ALLOCATION_RULES_METADATA[defaultAllocationRule]?.name})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review each lot's true landed cost before committing to inventory valuation
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Allocation Rule:</span>
                  <select
                    value={defaultAllocationRule}
                    onChange={(e) => setDefaultAllocationRule(e.target.value as LandedCostAllocationRule)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  >
                    <option value="by_weight">By Weight (MT / kg)</option>
                    <option value="by_value">By Value (INR)</option>
                    <option value="by_quantity">By Quantity (Units)</option>
                  </select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Base Purchase Value
                  </span>
                  <span className="text-lg font-bold text-white font-mono">
                    {formatCurrency(totalBaseValue)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 uppercase font-semibold block mb-0.5">
                    Landed Surcharges Incurred
                  </span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">
                    +{formatCurrency(totalChargesAmount)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-0.5">
                    True Landed Inventory Value
                  </span>
                  <span className="text-lg font-bold text-emerald-200 font-mono">
                    {formatCurrency(totalBaseValue + totalChargesAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
                    +{effectiveMarkup.toFixed(2)}% Landed Markup
                  </span>
                </div>
              </div>

              {/* Calculated Matrix Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 uppercase font-semibold">
                        <th className="py-2.5 px-3">Lot Number</th>
                        <th className="py-2.5 px-3">Material Description</th>
                        <th className="py-2.5 px-3 text-right">Base Cost</th>
                        <th className="py-2.5 px-3 text-right">Allocated Surcharge</th>
                        <th className="py-2.5 px-3 text-right">True Landed Cost/Unit</th>
                        <th className="py-2.5 px-3 text-right">Landed Total Value</th>
                        <th className="py-2.5 px-3 text-right">Markup %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {calculatedLines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-cyan-300">{line.lotNumber}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="text-slate-200 font-medium block">{line.itemName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {line.quantity} {line.uom} ({line.weightKg.toLocaleString()} kg)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {formatCurrency(line.baseUnitCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                            +{formatCurrency(line.allocatedCostPerUnit)}/{line.uom}
                            <span className="text-[10px] text-slate-500 block font-normal">
                              Total: {formatCurrency(line.allocatedChargeAmount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white bg-slate-900/60">
                            {formatCurrency(line.trueLandedCostPerUnit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                            {formatCurrency(line.trueLandedCostPerUnit * line.quantity)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">
                            +{line.landedMarkupPercent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSaveVoucher(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveVoucher(true)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save & Capitalize into Inventory
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
