// src/components/scrap-rework/ReworkTrackingModal.tsx

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Factory,
  Clock,
  User,
  Sliders,
  DollarSign,
  Package,
  Layers,
  Save,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  ReworkRecord,
  ShiftType,
  ReworkStatus
} from '../../types/scrapRework';
import {
  scrapReworkService,
  REWORK_REASON_CODES
} from '../../services/scrapReworkService';

interface ReworkTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReworkAdded: (record: ReworkRecord) => void;
  defaultWorkOrderId?: string;
}

export const ReworkTrackingModal: React.FC<ReworkTrackingModalProps> = ({
  isOpen,
  onClose,
  onReworkAdded,
  defaultWorkOrderId
}) => {
  const workOrders = scrapReworkService.getWorkOrdersList();
  const machines = scrapReworkService.getMachinesList();
  const operators = scrapReworkService.getOperatorsList();

  const [selectedWoId, setSelectedWoId] = useState<string>(
    defaultWorkOrderId || workOrders[0].id
  );
  const activeWo = workOrders.find(w => w.id === selectedWoId) || workOrders[0];

  const [originalOperationCode, setOriginalOperationCode] = useState<string>('OP-020');
  const [originalOperationName, setOriginalOperationName] = useState<string>('CNC Machining & Boring');

  const [reworkReasonCode, setReworkReasonCode] = useState<string>(REWORK_REASON_CODES[0].code);
  const activeReason = REWORK_REASON_CODES.find(r => r.code === reworkReasonCode) || REWORK_REASON_CODES[0];

  const [reworkStationCode, setReworkStationCode] = useState<string>(activeReason.defaultSecondaryStation);
  const [reworkStationName, setReworkStationName] = useState<string>('Secondary Finishing & Grinding Cell');

  const [machineId, setMachineId] = useState<string>(machines[1].id);
  const [shift, setShift] = useState<ShiftType>('shift_b');
  const [operatorId, setOperatorId] = useState<string>(operators[0].id);

  const [reworkQuantity, setReworkQuantity] = useState<number>(4);
  const [unit, setUnit] = useState<string>('PCS');

  const [reworkLaborHours, setReworkLaborHours] = useState<number>(activeReason.estimatedHoursTypical || 2.0);
  const [reworkLaborHourlyRate, setReworkLaborHourlyRate] = useState<number>(26.00);

  const [reworkMachineHours, setReworkMachineHours] = useState<number>(1.5);
  const [reworkMachineHourlyRate, setReworkMachineHourlyRate] = useState<number>(45.00);

  const [consumablesCost, setConsumablesCost] = useState<number>(18.00);
  const [secondaryVendorCost, setSecondaryVendorCost] = useState<number>(0);

  const [reworkInstructions, setReworkInstructions] = useState<string>(activeReason.description);
  const [status, setStatus] = useState<ReworkStatus>('in_progress');
  const [technicianNotes, setTechnicianNotes] = useState<string>('');

  if (!isOpen) return null;

  const activeMachine = machines.find(m => m.id === machineId) || machines[0];
  const activeOperator = operators.find(o => o.id === operatorId) || operators[0];

  // Financial Calculations
  const laborCost = reworkLaborHours * reworkLaborHourlyRate;
  const machineCost = reworkMachineHours * reworkMachineHourlyRate;
  const totalReworkCost = laborCost + machineCost + consumablesCost + secondaryVendorCost;

  // Potential Scrap Cost Avoided
  const estimatedCostPerScrappedPiece = activeWo.baseCost;
  const potentialScrapCostAvoided = reworkQuantity * estimatedCostPerScrappedPiece;
  const netCostBenefit = Math.max(0, potentialScrapCostAvoided - totalReworkCost);

  const handleReasonChange = (code: string) => {
    setReworkReasonCode(code);
    const found = REWORK_REASON_CODES.find(r => r.code === code);
    if (found) {
      setReworkStationCode(found.defaultSecondaryStation);
      setReworkLaborHours(found.estimatedHoursTypical);
      setReworkInstructions(found.description);
    }
  };

  const handleMachineChange = (mId: string) => {
    setMachineId(mId);
    const m = machines.find(item => item.id === mId);
    if (m) {
      setReworkMachineHourlyRate(m.rate);
    }
  };

  const handleOperatorChange = (oId: string) => {
    setOperatorId(oId);
    const op = operators.find(item => item.id === oId);
    if (op) {
      setReworkLaborHourlyRate(op.rate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (reworkQuantity <= 0) {
      alert('Rework quantity must be greater than 0');
      return;
    }

    const shiftLabelMap: Record<ShiftType, string> = {
      shift_a: 'Shift A (Morning 06:00-14:00)',
      shift_b: 'Shift B (Evening 14:00-22:00)',
      shift_c: 'Shift C (Night 22:00-06:00)'
    };

    const newRecord = scrapReworkService.addReworkRecord({
      workOrderId: activeWo.id,
      workOrderNumber: activeWo.number,
      salesOrderNumber: `SO-2026-${Math.floor(8000 + Math.random() * 999)}`,
      customerName: activeWo.customer,
      partCode: activeWo.part.split(' ')[0],
      partName: activeWo.part,
      originalOperationCode,
      originalOperationName,
      reworkStationCode,
      reworkStationName,
      machineId: activeMachine.id,
      machineName: activeMachine.name,
      shift,
      shiftLabel: shiftLabelMap[shift],
      operatorId: activeOperator.id,
      operatorName: activeOperator.name,
      reworkQuantity,
      unit,
      reasonCode: activeReason.code,
      reasonName: activeReason.name,
      reworkInstructions,
      reworkLaborHours,
      reworkLaborHourlyRate,
      reworkMachineHours,
      reworkMachineHourlyRate,
      consumablesCost,
      secondaryVendorCost,
      potentialScrapCostAvoided,
      status,
      technicianNotes
    });

    onReworkAdded(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create Rework Ticket</h2>
              <p className="text-xs text-slate-400">
                Track secondary machining, manual correction hours, machine utilization, and parts salvaged vs scrapped
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
          {/* Work Order Header */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Production Job & Work Order</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Work Order *
                </label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
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
                  Customer & Component
                </label>
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-medium truncate">
                  {activeWo.customer} &bull; <span className="text-amber-300">{activeWo.part}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rework Reason & Stations */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Rework Reason Code & Secondary Routing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rework Reason Code *
                </label>
                <select
                  value={reworkReasonCode}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {REWORK_REASON_CODES.map(rc => (
                    <option key={rc.code} value={rc.code}>
                      {rc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Secondary Station / Cell
                </label>
                <input
                  type="text"
                  value={reworkStationName}
                  onChange={(e) => setReworkStationName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rework Technical Instructions
              </label>
              <input
                type="text"
                value={reworkInstructions}
                onChange={(e) => setReworkInstructions(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Attribution: Machine, Shift, Operator */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-400" />
              <span>Assigned Machine, Shift & Operator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Machine
                </label>
                <select
                  value={machineId}
                  onChange={(e) => handleMachineChange(e.target.value)}
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Shift
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Technician
                </label>
                <select
                  value={operatorId}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {operators.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} (${o.rate}/hr)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rework Quantities, Labor, Machine & Cost Calculation */}
          <div className="p-4 bg-slate-950/70 border border-amber-500/20 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Rework Quantity, Time Capture & Cost Impact</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rework Qty (Units) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={reworkQuantity}
                  onChange={(e) => setReworkQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Labor Hours (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={reworkLaborHours}
                  onChange={(e) => setReworkLaborHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Machine Hours (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={reworkMachineHours}
                  onChange={(e) => setReworkMachineHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Consumables ($)
                </label>
                <input
                  type="number"
                  step="1"
                  value={consumablesCost}
                  onChange={(e) => setConsumablesCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Economics Scorecard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900/80 border border-amber-500/20 rounded-lg">
                <div className="text-[10px] text-amber-300 uppercase font-medium">Total Rework Cost</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  ${totalReworkCost.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Labor (${laborCost.toFixed(2)}) + Machining (${machineCost.toFixed(2)}) + Consumables
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase font-medium">Potential Scrap Avoided</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  ${potentialScrapCostAvoided.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {reworkQuantity} pcs × ${estimatedCostPerScrappedPiece.toFixed(2)} gross value
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center justify-between">
                  <span>Net Salvage Savings</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  +${netCostBenefit.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Value preserved for plant
                </div>
              </div>
            </div>
          </div>

          {/* Initial Status Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rework Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReworkStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="pending_rework">Pending Rework (In Queue)</option>
                <option value="in_progress">In Progress (Active on Station)</option>
                <option value="rework_passed">Completed & Passed Quality Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Technician / Batch Notes
              </label>
              <input
                type="text"
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="e.g. Parts staged in bin B-4. Tooling set up."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
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
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Create Rework Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
