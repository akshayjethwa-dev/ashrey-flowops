// src/components/spc/AddSubgroupModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Clock,
  User,
  Cpu
} from 'lucide-react';
import { SpcStudy, SubgroupSample } from '../../types/spc';

interface AddSubgroupModalProps {
  study: SpcStudy;
  onClose: () => void;
  onSubmit: (subgroupData: Omit<SubgroupSample, 'id' | 'violations' | 'mean' | 'range' | 'stdDev'>) => void;
}

export const AddSubgroupModal: React.FC<AddSubgroupModalProps> = ({
  study,
  onClose,
  onSubmit
}) => {
  const n = study.subgroupSize || (study.chartType === 'I_MR' ? 1 : 5);
  const isVariable = study.chartType === 'XBar_R' || study.chartType === 'I_MR' || study.chartType === 'XBar_S';

  const [batchOrLotNumber, setBatchOrLotNumber] = useState<string>(`LOT-2026-${study.subgroups.length + 101}`);
  const [operatorName, setOperatorName] = useState<string>('Alex Rivera (Machinist)');
  const [machineId, setMachineId] = useState<string>('CNC-HAAS-01');
  const [notes, setNotes] = useState<string>('');

  // Variable measurements
  const [measurements, setMeasurements] = useState<number[]>(
    Array(n).fill(study.nominalValue)
  );

  // Attribute inputs
  const [defectivesCount, setDefectivesCount] = useState<number>(3);
  const [totalInspected, setTotalInspected] = useState<number>(study.subgroupSize || 200);
  const [defectsCount, setDefectsCount] = useState<number>(4);

  // Quick fill helper
  const handleSimulateInSpec = () => {
    const tol = study.usl - study.lsl;
    const stdEst = tol / 10;
    const randomized = measurements.map(() => {
      const val = study.nominalValue + (Math.random() - 0.5) * stdEst * 1.5;
      return Number(val.toFixed(3));
    });
    setMeasurements(randomized);
  };

  const handleSimulateHighOutlier = () => {
    const randomized = measurements.map(() => {
      const val = study.usl + 0.005 + Math.random() * 0.008;
      return Number(val.toFixed(3));
    });
    setMeasurements(randomized);
  };

  // Live mean & range
  const liveMean = isVariable
    ? measurements.reduce((a, b) => a + b, 0) / measurements.length
    : 0;
  const liveRange = isVariable
    ? Math.max(...measurements) - Math.min(...measurements)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      subgroupNumber: study.subgroups.length + 1,
      timestamp: new Date().toISOString(),
      batchOrLotNumber,
      operatorName,
      machineId,
      measurements: isVariable ? measurements : [],
      sampleSize: isVariable ? measurements.length : totalInspected,
      defectivesCount: !isVariable ? defectivesCount : undefined,
      totalInspected: !isVariable ? totalInspected : undefined,
      defectsCount: !isVariable ? defectsCount : undefined,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Subgroup #{study.subgroups.length + 1}</h3>
              <p className="text-xs text-slate-400">{study.studyName} &bull; {study.characteristicName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Lot / Batch Number</label>
              <input
                type="text"
                required
                value={batchOrLotNumber}
                onChange={(e) => setBatchOrLotNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Operator Name</label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Machine Asset</label>
              <input
                type="text"
                required
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Variable Measurements Matrix */}
          {isVariable ? (
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-blue-400" />
                  Subgroup Sample Measurements (n = {n})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateInSpec}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> In-Spec Random
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateHighOutlier}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    High Outlier
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {measurements.map((val, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Sample #{idx + 1}</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={val}
                      onChange={(e) => {
                        const updated = [...measurements];
                        updated[idx] = parseFloat(e.target.value) || 0;
                        setMeasurements(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-center text-white font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              {/* Subgroup calculated preview */}
              <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Subgroup Average (X̄)</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">{liveMean.toFixed(4)} {study.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Subgroup Range (R)</span>
                  <span className="text-sm font-bold font-mono text-purple-400">{liveRange.toFixed(4)} {study.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tolerance Check</span>
                  <span className={`text-xs font-bold ${liveMean <= study.usl && liveMean >= study.lsl ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {liveMean <= study.usl && liveMean >= study.lsl ? 'Within Spec' : 'Out of Spec!'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Attribute Inputs */
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 grid grid-cols-2 gap-4">
              {study.chartType === 'p_chart' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Defective Units Count</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={defectivesCount}
                      onChange={(e) => setDefectivesCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Total Inspected Lot Units</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalInspected}
                      onChange={(e) => setTotalInspected(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </>
              )}
              {study.chartType === 'c_chart' && (
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Total Nonconformities / Defects Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={defectsCount}
                    onChange={(e) => setDefectsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Operator Notes / Observations</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. After 2 hours continuous run, coolant refractometer reading 7.5%"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Plot Subgroup
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
