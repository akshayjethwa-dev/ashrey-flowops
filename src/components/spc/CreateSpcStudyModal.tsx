// src/components/spc/CreateSpcStudyModal.tsx

import React, { useState } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  TrendingUp,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { SpcStudy, SpcChartType, WesternElectricRuleId } from '../../types/spc';

interface CreateSpcStudyModalProps {
  onClose: () => void;
  onSave: (study: SpcStudy) => void;
}

export const CreateSpcStudyModal: React.FC<CreateSpcStudyModalProps> = ({
  onClose,
  onSave
}) => {
  const [studyName, setStudyName] = useState<string>('CNC Shaft Outer Diameter (X-bar & R)');
  const [partNumber, setPartNumber] = useState<string>('PART-SFT-320');
  const [partName, setPartName] = useState<string>('Precision Stepped Motor Shaft 32mm');
  const [operationCode, setOperationCode] = useState<string>('OP-CNC-04');
  const [operationName, setOperationName] = useState<string>('High-Speed Cylindrical Grinding');
  const [characteristicName, setCharacteristicName] = useState<string>('Journal Bearing Diameter Ø32.000');
  const [unit, setUnit] = useState<string>('mm');
  const [chartType, setChartType] = useState<SpcChartType>('XBar_R');
  const [subgroupSize, setSubgroupSize] = useState<number>(5);
  const [nominalValue, setNominalValue] = useState<number>(32.000);
  const [usl, setUsl] = useState<number>(32.015);
  const [lsl, setLsl] = useState<number>(31.985);

  const [activeRules, setActiveRules] = useState<WesternElectricRuleId[]>([
    'WE_RULE_1',
    'WE_RULE_2',
    'WE_RULE_3',
    'WE_RULE_4',
    'NELSON_5'
  ]);

  const toggleRule = (ruleId: WesternElectricRuleId) => {
    if (activeRules.includes(ruleId)) {
      setActiveRules(activeRules.filter(r => r !== ruleId));
    } else {
      setActiveRules([...activeRules, ruleId]);
    }
  };

  const handleChartTypeChange = (ct: SpcChartType) => {
    setChartType(ct);
    if (ct === 'I_MR') {
      setSubgroupSize(1);
    } else if (ct === 'p_chart') {
      setSubgroupSize(200);
      setUnit('Fraction');
      setNominalValue(0.02);
      setUsl(0.05);
      setLsl(0.00);
    } else if (ct === 'c_chart') {
      setSubgroupSize(1);
      setUnit('Defects');
      setNominalValue(3);
      setUsl(10);
      setLsl(0);
    } else {
      setSubgroupSize(5);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate initial baseline 5 subgroups with in-spec random measurements
    const initialSubgroups = [];
    const n = subgroupSize || 5;
    const isVariable = chartType === 'XBar_R' || chartType === 'I_MR' || chartType === 'XBar_S';
    const stdEst = (usl - lsl) / 10 || 0.002;

    for (let i = 1; i <= 6; i++) {
      const measurements = isVariable
        ? Array(n).fill(0).map(() => Number((nominalValue + (Math.random() - 0.5) * stdEst * 1.4).toFixed(3)))
        : [];
      const mean = isVariable
        ? measurements.reduce((a, b) => a + b, 0) / measurements.length
        : nominalValue;
      const range = isVariable
        ? Math.max(...measurements) - Math.min(...measurements)
        : 0;

      initialSubgroups.push({
        id: `sg-${i}`,
        subgroupNumber: i,
        timestamp: new Date(Date.now() - (6 - i) * 3600 * 1000).toISOString(),
        batchOrLotNumber: `LOT-BL-${i}`,
        operatorName: 'Alex Rivera',
        machineId: 'GRIND-01',
        measurements,
        sampleSize: n,
        mean: Number(mean.toFixed(4)),
        range: Number(range.toFixed(4)),
        stdDev: Number((range / 2.326).toFixed(4)),
        defectivesCount: !isVariable ? Math.round(nominalValue * n) : undefined,
        totalInspected: !isVariable ? n : undefined,
        defectsCount: chartType === 'c_chart' ? Math.round(nominalValue) : undefined,
        violations: []
      });
    }

    const newStudy: SpcStudy = {
      id: `spc-study-${Date.now()}`,
      studyName,
      partNumber,
      partName,
      operationCode,
      operationName,
      characteristicName,
      unit,
      chartType,
      subgroupSize,
      nominalValue,
      usl,
      lsl,
      activeRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subgroups: initialSubgroups
    };

    onSave(newStudy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New SPC Control Study</h3>
              <p className="text-xs text-slate-400">Configure control charts, sampling rationales, and Western Electric rules</p>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Study Name / Title</label>
              <input
                type="text"
                required
                value={studyName}
                onChange={(e) => setStudyName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Control Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => handleChartTypeChange(e.target.value as SpcChartType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <optgroup label="Variable Charts (Continuous Measurements)">
                  <option value="XBar_R">X̄ and R Chart (Subgroup Mean &amp; Range, n=2..9)</option>
                  <option value="I_MR">I-MR Chart (Individual &amp; Moving Range, n=1)</option>
                  <option value="XBar_S">X̄ and S Chart (Subgroup Mean &amp; Std Dev, n≥10)</option>
                </optgroup>
                <optgroup label="Attribute Charts (Counts &amp; Defectives)">
                  <option value="p_chart">p-Chart (Fraction Defective / Nonconforming)</option>
                  <option value="c_chart">c-Chart (Total Nonconformities / Defects count)</option>
                  <option value="u_chart">u-Chart (Defects per Unit inspection)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Subgroup Sample Size (n)</label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={subgroupSize}
                onChange={(e) => setSubgroupSize(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Part SKU / Number</label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Part Description</label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Routing Operation Code</label>
              <input
                type="text"
                required
                value={operationCode}
                onChange={(e) => setOperationCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Operation Name</label>
              <input
                type="text"
                required
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Characteristic / Critical Quality Attribute</label>
              <input
                type="text"
                required
                value={characteristicName}
                onChange={(e) => setCharacteristicName(e.target.value)}
                placeholder="e.g. Journal Bearing Diameter Ø32.000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Specification Limits Row */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Lower Spec Limit (LSL)</label>
              <input
                type="number"
                step="0.001"
                required
                value={lsl}
                onChange={(e) => setLsl(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Nominal / Target</label>
              <input
                type="number"
                step="0.001"
                required
                value={nominalValue}
                onChange={(e) => setNominalValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Upper Spec Limit (USL)</label>
              <input
                type="number"
                step="0.001"
                required
                value={usl}
                onChange={(e) => setUsl(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Engineering Unit</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mm, µm, Fraction"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Western Electric & Nelson Rules Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Automated Out-of-Control Rules to Enable:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'WE_RULE_1', label: 'Rule 1: Point Beyond 3σ (Control Limits)' },
                { id: 'WE_RULE_2', label: 'Rule 2: 2 of 3 points in Zone A (> 2σ)' },
                { id: 'WE_RULE_3', label: 'Rule 3: 4 of 5 points in Zone B (> 1σ)' },
                { id: 'WE_RULE_4', label: 'Rule 4: 8 consecutive points on same side of CL' },
                { id: 'NELSON_5', label: 'Nelson 5: 6 points steadily increasing or decreasing (Trend)' },
                { id: 'NELSON_6', label: 'Nelson 6: 14 points alternating up and down (Oscillation)' }
              ].map(r => (
                <label key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={activeRules.includes(r.id as any)}
                    onChange={() => toggleRule(r.id as any)}
                    className="rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="text-[11px] text-slate-300">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
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
              Initialize SPC Study
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
