// src/components/gages/RecordCalibrationModal.tsx

import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  FileCheck2,
  Thermometer,
  DollarSign
} from 'lucide-react';
import { GageInstrument, CalibrationRecord } from '../../types/gageCalibration';

interface RecordCalibrationModalProps {
  gage: GageInstrument;
  onClose: () => void;
  onSubmit: (gageId: string, recordData: Omit<CalibrationRecord, 'id'>) => void;
}

export const RecordCalibrationModal: React.FC<RecordCalibrationModalProps> = ({
  gage,
  onClose,
  onSubmit
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Calculate next due date default
  const defaultDueDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + (gage.calibrationFrequencyMonths || 12));
    return d.toISOString().slice(0, 10);
  };

  const [calibrationDate, setCalibrationDate] = useState<string>(todayStr);
  const [nextDueDate, setNextDueDate] = useState<string>(defaultDueDate());
  const [certificateNumber, setCertificateNumber] = useState<string>(
    `CERT-CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [agencyOrLab, setAgencyOrLab] = useState<string>('In-House Metrology Lab ISO/IEC 17025');
  const [calibratedBy, setCalibratedBy] = useState<string>('Sarah Jenkins, Certified Metrologist');
  const [passFail, setPassFail] = useState<'passed' | 'adjusted_passed' | 'failed_rejected'>('passed');
  const [asFoundCondition, setAsFoundCondition] = useState<string>('Within tolerance (+0.0005 mm deviation)');
  const [asLeftCondition, setAsLeftCondition] = useState<string>('Calibrated to nominal zero error (±0.0002 mm)');
  const [calibrationStandardUsed, setCalibrationStandardUsed] = useState<string>(
    gage.masterStandardRef || 'Mitutoyo Grade 0 Gage Block Set NIST #821/2839'
  );
  const [measurementUncertainty, setMeasurementUncertainty] = useState<string>('U = 0.0008 mm (k=2)');
  const [temperatureC, setTemperatureC] = useState<number>(20.0);
  const [humidityPct, setHumidityPct] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(gage.id, {
      gageId: gage.id,
      calibrationDate,
      nextDueDate,
      certificateNumber,
      agencyOrLab,
      calibratedBy,
      passFail,
      asFoundCondition,
      asLeftCondition,
      calibrationStandardUsed,
      measurementUncertainty,
      temperatureC,
      humidityPct,
      signedBy: calibratedBy,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Calibration Certificate</h3>
              <p className="text-xs text-slate-400">
                {gage.assetTag} &bull; {gage.name} (S/N: {gage.serialNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Calibration Date</label>
              <input
                type="date"
                required
                value={calibrationDate}
                onChange={(e) => {
                  setCalibrationDate(e.target.value);
                  const d = new Date(e.target.value);
                  d.setMonth(d.getMonth() + (gage.calibrationFrequencyMonths || 12));
                  setNextDueDate(d.toISOString().slice(0, 10));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Next Expiration Due Date (+{gage.calibrationFrequencyMonths} Mo)
              </label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Calibration Certificate #</label>
              <input
                type="text"
                required
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Calibration Disposition</label>
              <select
                value={passFail}
                onChange={(e) => setPassFail(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="passed">Passed (In-Spec as found)</option>
                <option value="adjusted_passed">Adjusted &amp; Passed (Offset adjusted to zero)</option>
                <option value="failed_rejected">Failed / Rejected (Quarantined out of service)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Accredited Calibration Lab / Agency</label>
              <input
                type="text"
                required
                value={agencyOrLab}
                onChange={(e) => setAgencyOrLab(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Metrologist / Technician Sign-off</label>
              <input
                type="text"
                required
                value={calibratedBy}
                onChange={(e) => setCalibratedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Condition as found and as left */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">As-Found Condition / Error</label>
              <input
                type="text"
                required
                value={asFoundCondition}
                onChange={(e) => setAsFoundCondition(e.target.value)}
                placeholder="e.g. +0.001 mm offset across span"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">As-Left Condition / Error</label>
              <input
                type="text"
                required
                value={asLeftCondition}
                onChange={(e) => setAsLeftCondition(e.target.value)}
                placeholder="e.g. Zero error ±0.0002 mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Master Standard Reference (NIST / ISO 17025)</label>
            <input
              type="text"
              required
              value={calibrationStandardUsed}
              onChange={(e) => setCalibrationStandardUsed(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
            />
          </div>

          {/* Lab Environment Strip */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-3 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Measurement Uncertainty</label>
              <input
                type="text"
                value={measurementUncertainty}
                onChange={(e) => setMeasurementUncertainty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Lab Ambient Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperatureC}
                onChange={(e) => setTemperatureC(parseFloat(e.target.value) || 20)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Lab Relative Humidity (%)</label>
              <input
                type="number"
                value={humidityPct}
                onChange={(e) => setHumidityPct(parseInt(e.target.value) || 45)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Metrology Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleaned anvil, lubricated thimble spindle, new calibration sticker attached"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
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
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Certificate &amp; Reset Due Date
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
