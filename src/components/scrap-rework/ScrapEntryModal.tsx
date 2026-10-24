// src/components/scrap-rework/ScrapEntryModal.tsx

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  Factory,
  Clock,
  User,
  Sliders,
  DollarSign,
  Package,
  Layers,
  Save,
  Info,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import {
  ScrapRecord,
  ShiftType,
  RootCauseCategory
} from '../../types/scrapRework';
import {
  scrapReworkService,
  SCRAP_REASON_CODES
} from '../../services/scrapReworkService';

interface ScrapEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapAdded: (record: ScrapRecord) => void;
  defaultWorkOrderId?: string;
}

export const ScrapEntryModal: React.FC<ScrapEntryModalProps> = ({
  isOpen,
  onClose,
  onScrapAdded,
  defaultWorkOrderId
}) => {
  const workOrders = scrapReworkService.getWorkOrdersList();
  const machines = scrapReworkService.getMachinesList();
  const operators = scrapReworkService.getOperatorsList();

  const [selectedWoId, setSelectedWoId] = useState<string>(
    defaultWorkOrderId || workOrders[0].id
  );
  const activeWo = workOrders.find(w => w.id === selectedWoId) || workOrders[0];

  const [operationCode, setOperationCode] = useState<string>('OP-020');
  const [operationName, setOperationName] = useState<string>('CNC Precision Machining');
  const [operationSequence, setOperationSequence] = useState<number>(20);

  const [machineId, setMachineId] = useState<string>(machines[0].id);
  const [shift, setShift] = useState<ShiftType>('shift_a');
  const [operatorId, setOperatorId] = useState<string>(operators[0].id);

  const [quantityScrapped, setQuantityScrapped] = useState<number>(2);
  const [unit, setUnit] = useState<string>('PCS');

  const [reasonCode, setReasonCode] = useState<string>(SCRAP_REASON_CODES[0].code);

  const [materialUnitCost, setMaterialUnitCost] = useState<number>(
    Number((activeWo.baseCost * 0.55).toFixed(2))
  );
  const [cumulativeOpCostPerUnit, setCumulativeOpCostPerUnit] = useState<number>(
    Number((activeWo.baseCost * 0.45).toFixed(2))
  );
  const [salvageRecoveryUnitValue, setSalvageRecoveryUnitValue] = useState<number>(5.50);

  const [lotNumber, setLotNumber] = useState<string>(`LOT-2026-03${Math.floor(10 + Math.random() * 80)}-A`);
  const [heatNumber, setHeatNumber] = useState<string>('HEAT-HT-8849');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const activeReason = SCRAP_REASON_CODES.find(r => r.code === reasonCode) || SCRAP_REASON_CODES[0];
  const activeMachine = machines.find(m => m.id === machineId) || machines[0];
  const activeOperator = operators.find(o => o.id === operatorId) || operators[0];

  // Live Financial Calculations
  const grossScrapCost = quantityScrapped * (materialUnitCost + cumulativeOpCostPerUnit);
  const totalSalvageCredit = quantityScrapped * salvageRecoveryUnitValue;
  const netScrapCost = Math.max(0, grossScrapCost - totalSalvageCredit);

  const handleWoChange = (newWoId: string) => {
    setSelectedWoId(newWoId);
    const wo = workOrders.find(w => w.id === newWoId);
    if (wo) {
      setMaterialUnitCost(Number((wo.baseCost * 0.55).toFixed(2)));
      setCumulativeOpCostPerUnit(Number((wo.baseCost * 0.45).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantityScrapped <= 0) {
      alert('Quantity scrapped must be greater than 0');
      return;
    }

    const shiftLabelMap: Record<ShiftType, string> = {
      shift_a: 'Shift A (Morning 06:00-14:00)',
      shift_b: 'Shift B (Evening 14:00-22:00)',
      shift_c: 'Shift C (Night 22:00-06:00)'
    };

    const newRecord = scrapReworkService.addScrapRecord({
      workOrderId: activeWo.id,
      workOrderNumber: activeWo.number,
      salesOrderNumber: `SO-2026-${Math.floor(8000 + Math.random() * 999)}`,
      customerName: activeWo.customer,
      partCode: activeWo.part.split(' ')[0],
      partName: activeWo.part,
      operationCode,
      operationName,
      operationSequence,
      machineId: activeMachine.id,
      machineName: activeMachine.name,
      shift,
      shiftLabel: shiftLabelMap[shift],
      operatorId: activeOperator.id,
      operatorName: activeOperator.name,
      quantityScrapped,
      unit,
      reasonCode: activeReason.code,
      reasonName: activeReason.name,
      rootCauseCategory: activeReason.category,
      description: activeReason.description,
      materialUnitCost,
      cumulativeOpCostPerUnit,
      salvageRecoveryUnitValue,
      lotNumber,
      heatNumber,
      recordedBy: 'Shift QC Supervisor / Plant Lead',
      plantId: 'plant-main',
      plantName: 'Apex Precision Manufacturing Facility',
      status: 'confirmed',
      notes
    });

    onScrapAdded(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Record Scrap Event (COPQ)</h2>
              <p className="text-xs text-slate-400">
                Log rejected components with standardized reason codes, machine/shift attribution, and net cost impact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Work Order & Part Header Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-400" />
              <span>Production Job & Component Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Work Order *
                </label>
                <select
                  value={selectedWoId}
                  onChange={(e) => handleWoChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                >
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.number} — {wo.part} ({wo.customer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer & Part Name
                </label>
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-medium truncate">
                  {activeWo.customer} &bull; <span className="text-rose-300">{activeWo.part}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Operation Point *</label>
                <select
                  value={operationCode}
                  onChange={(e) => {
                    setOperationCode(e.target.value);
                    const map: Record<string, string> = {
                      'OP-010': 'Rough CNC Facing & OD Turning',
                      'OP-020': 'CNC Precision Machining & Boring',
                      'OP-030': '5-Axis Milling & Contouring',
                      'OP-040': 'Spline Broach & Hobbing',
                      'OP-050': 'Induction Hardening / Heat Treat',
                      'OP-060': 'Finish Cylindrical Grinding'
                    };
                    setOperationName(map[e.target.value] || 'Precision Machining');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="OP-010">OP-010: Rough CNC Facing</option>
                  <option value="OP-020">OP-020: CNC Machining & Boring</option>
                  <option value="OP-030">OP-030: 5-Axis Blade Milling</option>
                  <option value="OP-040">OP-040: Spline Broaching</option>
                  <option value="OP-050">OP-050: Heat Treatment / Quench</option>
                  <option value="OP-060">OP-060: Finish Cylindrical Grinding</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Lot Number *</label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Heat / Ingot # (Optional)</label>
                <input
                  type="text"
                  value={heatNumber}
                  onChange={(e) => setHeatNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Reason Code & Root Cause Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Standardized Scrap Reason Code & Root Cause Category</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason Code *
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {SCRAP_REASON_CODES.map(rc => (
                    <option key={rc.code} value={rc.code}>
                      [{rc.category}] {rc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Root Cause Category
                </label>
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-amber-400">
                  {activeReason.category}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{activeReason.name}:</span> {activeReason.description}
                <div className="mt-1 text-[11px] text-amber-300/80">
                  <span className="font-semibold text-amber-400">Recommended Action:</span> {activeReason.typicalCorrectiveAction}
                </div>
              </div>
            </div>
          </div>

          {/* Attribution: Machine, Shift, Operator */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-400" />
              <span>Attribution (Machine / Shift / Operator)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Machine *</span>
                </label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (${m.rate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Shift *</span>
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="shift_a">Shift A (Morning 06:00-14:00)</option>
                  <option value="shift_b">Shift B (Evening 14:00-22:00)</option>
                  <option value="shift_c">Shift C (Night 22:00-06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Operator *</span>
                </label>
                <select
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {operators.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quantity & Financial Cost Calculation */}
          <div className="p-4 bg-slate-950/70 border border-rose-500/20 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>Quantity Scrapped & True Cost Calculation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Qty Scrapped *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantityScrapped}
                  onChange={(e) => setQuantityScrapped(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Raw Mat Cost ($/unit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={materialUnitCost}
                  onChange={(e) => setMaterialUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Incurred Op Cost ($/unit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cumulativeOpCostPerUnit}
                  onChange={(e) => setCumulativeOpCostPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Salvage Credit ($/unit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salvageRecoveryUnitValue}
                  onChange={(e) => setSalvageRecoveryUnitValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Live Financial Cost Impact Scorecard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Gross Incurred Loss</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  ${grossScrapCost.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {quantityScrapped} × ${(materialUnitCost + cumulativeOpCostPerUnit).toFixed(2)}
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-emerald-500/20 rounded-lg">
                <div className="text-[10px] text-emerald-400 uppercase font-medium">Salvage Metal Credit</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  -${totalSalvageCredit.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {quantityScrapped} × ${salvageRecoveryUnitValue.toFixed(2)} recovery
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <div className="text-[10px] text-rose-300 uppercase font-bold flex items-center justify-between">
                  <span>Net True Scrap Cost</span>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                  ${netScrapCost.toFixed(2)}
                </div>
                <div className="text-[10px] text-rose-300/80 mt-0.5">
                  Direct debit to Work Order Margin
                </div>
              </div>
            </div>
          </div>

          {/* Shift Supervisor / Inspector Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Root Cause Observations & Containment Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Broken carbide insert detected on finishing pass. Tool wear limit was exceeded by 20 minutes. Machine stopped and quarantined."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/40 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Confirm & Post Scrap Cost</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
