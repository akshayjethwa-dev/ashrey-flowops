// src/components/defect-pareto/LogDefectModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Crosshair,
  Factory,
  User,
  Clock,
  Layers,
  AlertTriangle,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  PartDefinition,
  DefectRecord,
  DefectSpatialPoint,
  DefectClassification,
  DefectSeverityLevel,
  ShiftType
} from '../../types/defectPareto';
import { defectParetoService, DEFECT_CLASSIFICATION_INFO } from '../../services/defectParetoService';

interface LogDefectModalProps {
  parts: PartDefinition[];
  activePart: PartDefinition;
  initialSpatialPoint?: DefectSpatialPoint | null;
  onClose: () => void;
  onDefectLogged: (defect: DefectRecord) => void;
}

export const LogDefectModal: React.FC<LogDefectModalProps> = ({
  parts,
  activePart,
  initialSpatialPoint,
  onClose,
  onDefectLogged
}) => {
  const [selectedPartSku, setSelectedPartSku] = useState<string>(activePart.sku);
  const part = parts.find(p => p.sku === selectedPartSku) || activePart;

  const [title, setTitle] = useState<string>('');
  const [classification, setClassification] = useState<DefectClassification>('dimension_out_of_spec');
  const [severity, setSeverity] = useState<DefectSeverityLevel>('major');
  const [zoneId, setZoneId] = useState<string>(
    initialSpatialPoint ? initialSpatialPoint.zoneId : part.zones[0]?.id || ''
  );
  const [xPct, setXPct] = useState<number>(initialSpatialPoint ? initialSpatialPoint.x : 50);
  const [yPct, setYPct] = useState<number>(initialSpatialPoint ? initialSpatialPoint.y : 50);

  const [machineId, setMachineId] = useState<string>('MC-CNC-04');
  const [operatorName, setOperatorName] = useState<string>('Frank Dubois');
  const [shift, setShift] = useState<ShiftType>('shift_b');
  const [batchNumber, setBatchNumber] = useState<string>('BATCH-2026-092');
  const [workOrderNumber, setWorkOrderNumber] = useState<string>('WO-2026-0001');

  const [defectiveUnitsCount, setDefectiveUnitsCount] = useState<number>(1);
  const [measuredValue, setMeasuredValue] = useState<string>('');
  const [toleranceSpec, setToleranceSpec] = useState<string>('');
  const [variance, setVariance] = useState<string>('');
  const [scrapCost, setScrapCost] = useState<number>(150);
  const [reworkCost, setReworkCost] = useState<number>(60);
  const [detectionStage, setDetectionStage] = useState<any>('IPQC');
  const [notes, setNotes] = useState<string>('');

  const machines = [
    { id: 'MC-CNC-04', name: 'Haas VF-4SS 4-Axis VMC' },
    { id: 'MC-CNC-01', name: 'Doosan Lynx 2100LSY CNC Lathe' },
    { id: 'MC-CNC-02', name: 'Mazak Quick Turn 250' },
    { id: 'MC-CST-04', name: 'Bühler 800T Die Casting Cell' },
    { id: 'MC-LSR-02', name: 'Trumpf TruLaser 3030 Fiber' },
    { id: 'MC-GRN-01', name: 'Studer S33 CNC Cylindrical Grinder' }
  ];

  const operators = [
    { id: 'op-01', name: 'Frank Dubois', role: 'Senior CNC Machinist' },
    { id: 'op-02', name: 'Sarah Jenkins', role: 'Quality Inspector / Laser Op' },
    { id: 'op-03', name: 'Marcus Vance', role: 'CNC Turning Specialist' },
    { id: 'op-04', name: 'Elena Rostova', role: '5-Axis VMC Lead' },
    { id: 'op-05', name: 'David Kim', role: 'Foundry & Die Cast Specialist' },
    { id: 'op-06', name: 'Aisha Patel', role: 'SMT Assembly & Metrology Tech' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedZone = part.zones.find(z => z.id === zoneId) || part.zones[0];
    const selectedMachine = machines.find(m => m.id === machineId) || machines[0];
    const selectedOp = operators.find(o => o.name === operatorName) || operators[0];
    const classInfo = DEFECT_CLASSIFICATION_INFO[classification];

    const shiftLabels: Record<ShiftType, string> = {
      shift_a: 'Shift A (Morning)',
      shift_b: 'Shift B (Afternoon)',
      shift_c: 'Shift C (Night)'
    };

    const newDefect = defectParetoService.logDefect({
      title: title || `${classInfo.label} on ${selectedZone.name}`,
      partSku: part.sku,
      partName: part.name,
      batchNumber,
      workOrderNumber,
      defectClassification: classification,
      defectCategoryLabel: classInfo.label,
      severity,
      machineId: selectedMachine.id,
      machineName: selectedMachine.name,
      operatorId: selectedOp.id,
      operatorName: selectedOp.name,
      shift,
      shiftLabel: shiftLabels[shift],
      spatialLocation: {
        x: xPct,
        y: yPct,
        z: selectedZone.zCoordinate || 0,
        viewAngle: 'top',
        zoneId: selectedZone.id,
        zoneName: selectedZone.name
      },
      measuredValue: measuredValue || undefined,
      toleranceSpec: toleranceSpec || undefined,
      variance: variance || undefined,
      scrapCost: Number(scrapCost) || 0,
      reworkCost: Number(reworkCost) || 0,
      defectiveUnitsCount: Number(defectiveUnitsCount) || 1,
      detectionStage,
      notes: notes || 'Defect logged during QA inspection.'
    });

    onDefectLogged(newDefect);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair size={18} className="text-rose-400" />
              <span>Log Part Defect & Spatial Coordinate Pinpoint</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record a non-conformance with precise anatomical part location to update Pareto & heat maps.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Part Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Part
              </label>
              <select
                value={selectedPartSku}
                onChange={(e) => setSelectedPartSku(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {parts.map(p => (
                  <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Anatomical Zone
              </label>
              <select
                value={zoneId}
                onChange={(e) => {
                  const z = part.zones.find(zn => zn.id === e.target.value);
                  setZoneId(e.target.value);
                  if (z) {
                    setXPct(z.xPct);
                    setYPct(z.yPct);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {part.zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Spatial Coordinates Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block font-mono">X Coordinate (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={xPct}
                onChange={(e) => setXPct(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block font-mono">Y Coordinate (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={yPct}
                onChange={(e) => setYPct(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono mt-1"
              />
            </div>
          </div>

          {/* Defect Title & Classification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Defect Description / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Bore inner diameter out-of-round, heavy tool chatter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Classification (Pareto Category)
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as DefectClassification)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              >
                {Object.entries(DEFECT_CLASSIFICATION_INFO).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DefectSeverityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="critical">Critical (Scrap / Stop Line)</option>
                <option value="major">Major (Rework Required)</option>
                <option value="minor">Minor (Visual / Cosmetic)</option>
              </select>
            </div>
          </div>

          {/* Attribution: Machine, Operator, Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Machine Cell
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operator
              </label>
              <select
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {operators.map(o => (
                  <option key={o.id} value={o.name}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="shift_a">Shift A (Morning)</option>
                <option value="shift_b">Shift B (Afternoon)</option>
                <option value="shift_c">Shift C (Night)</option>
              </select>
            </div>
          </div>

          {/* Measurements & Financial Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Defective Units
              </label>
              <input
                type="number"
                min="1"
                value={defectiveUnitsCount}
                onChange={(e) => setDefectiveUnitsCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Scrap Loss ($)
              </label>
              <input
                type="number"
                min="0"
                value={scrapCost}
                onChange={(e) => setScrapCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rework Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={reworkCost}
                onChange={(e) => setReworkCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono"
              />
            </div>
          </div>

          {/* Metrology details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Drawing Spec
              </label>
              <input
                type="text"
                placeholder="e.g. 32.000 ± 0.008 mm"
                value={toleranceSpec}
                onChange={(e) => setToleranceSpec(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Measured Value
              </label>
              <input
                type="text"
                placeholder="e.g. 32.025 mm"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Variance
              </label>
              <input
                type="text"
                placeholder="e.g. +0.017 mm over tolerance"
                value={variance}
                onChange={(e) => setVariance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Inspection Notes / Root Cause Hints
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observation details regarding tooling, setup, coolant or material..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log Defect & Update Pareto/Heatmap</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
