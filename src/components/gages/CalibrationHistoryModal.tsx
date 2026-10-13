// src/components/gages/CalibrationHistoryModal.tsx

import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck2,
  ShieldCheck,
  Thermometer,
  Printer,
  History,
  AlertTriangle
} from 'lucide-react';
import { GageInstrument } from '../../types/gageCalibration';

interface CalibrationHistoryModalProps {
  gage: GageInstrument;
  onClose: () => void;
  onRecordNewCalibration: (gage: GageInstrument) => void;
}

export const CalibrationHistoryModal: React.FC<CalibrationHistoryModalProps> = ({
  gage,
  onClose,
  onRecordNewCalibration
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Calibration History &amp; Audit Trail</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {gage.assetTag}
                </span>
              </div>
              <p className="text-xs text-slate-400">{gage.name} &bull; S/N: {gage.serialNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instrument Quick Stats Card */}
        <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Status</span>
            <span className={`font-bold uppercase ${
              gage.calibrationStatus === 'in_calibration'
                ? 'text-emerald-400'
                : gage.calibrationStatus === 'due_soon'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {gage.calibrationStatus.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Current Due Date</span>
            <span className="font-mono font-bold text-white">{gage.nextCalibrationDueDate}</span>
            <span className="text-[10px] text-slate-400 block">
              {gage.daysRemaining >= 0 ? `${gage.daysRemaining} days left` : `${Math.abs(gage.daysRemaining)} days OVERDUE`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Frequency</span>
            <span className="text-white font-medium">Every {gage.calibrationFrequencyMonths} Months</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Location</span>
            <span className="text-slate-300 truncate block">{gage.location}</span>
          </div>
        </div>

        {/* Certificate History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Certified Calibration Events ({gage.history?.length || 0})
            </h4>
            <button
              onClick={() => {
                onClose();
                onRecordNewCalibration(gage);
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              + Record New Calibration
            </button>
          </div>

          {(!gage.history || gage.history.length === 0) ? (
            <div className="py-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
              <p className="text-xs">No prior calibration certificates logged in system.</p>
            </div>
          ) : (
            gage.history.map((rec, index) => (
              <div
                key={rec.id || index}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {rec.certificateNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {rec.passFail.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>Cal: {rec.calibrationDate}</span>
                    <span>&bull;</span>
                    <span>Next Due: {rec.nextDueDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">As-Found Condition:</span>
                    <span className="text-slate-300">{rec.asFoundCondition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">As-Left Condition:</span>
                    <span className="text-emerald-300">{rec.asLeftCondition}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-700/40">
                  <div>
                    <span>Standard: </span>
                    <span className="text-slate-300">{rec.calibrationStandardUsed}</span>
                  </div>
                  <div>
                    <span>Lab / Metrologist: </span>
                    <span className="text-slate-300">{rec.agencyOrLab || rec.calibratedBy}</span>
                  </div>
                  {rec.measurementUncertainty && (
                    <div>
                      <span>Uncertainty: </span>
                      <span className="font-mono text-cyan-300">{rec.measurementUncertainty}</span>
                    </div>
                  )}
                  {rec.temperatureC && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-slate-500" />
                      <span>{rec.temperatureC}°C, {rec.humidityPct}% RH</span>
                    </div>
                  )}
                </div>

                {rec.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded-lg">
                    {rec.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
