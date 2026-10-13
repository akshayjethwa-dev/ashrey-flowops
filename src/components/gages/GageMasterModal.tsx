// src/components/gages/GageMasterModal.tsx

import React, { useState } from 'react';
import {
  X,
  Plus,
  Sliders,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Barcode
} from 'lucide-react';
import { GageInstrument, GageInstrumentType } from '../../types/gageCalibration';

interface GageMasterModalProps {
  gage?: GageInstrument | null;
  onClose: () => void;
  onSave: (gageData: Partial<GageInstrument>) => void;
}

export const GageMasterModal: React.FC<GageMasterModalProps> = ({
  gage,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(gage);
  const todayStr = new Date().toISOString().slice(0, 10);

  const [assetTag, setAssetTag] = useState<string>(
    gage?.assetTag || `GAG-MIC-${Math.floor(10 + Math.random() * 90)}`
  );
  const [name, setName] = useState<string>(gage?.name || 'Mitutoyo External Micrometer 25-50mm');
  const [instrumentType, setInstrumentType] = useState<GageInstrumentType>(
    gage?.instrumentType || 'micrometer'
  );
  const [manufacturer, setManufacturer] = useState<string>(gage?.manufacturer || 'Mitutoyo');
  const [modelNumber, setModelNumber] = useState<string>(gage?.modelNumber || '293-241-30');
  const [serialNumber, setSerialNumber] = useState<string>(
    gage?.serialNumber || `SN-MT-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [location, setLocation] = useState<string>(gage?.location || 'Metrology Lab - Cabinet B');
  const [department, setDepartment] = useState<string>(gage?.department || 'Quality Assurance');
  const [measurementRange, setMeasurementRange] = useState<string>(gage?.measurementRange || '25.000 - 50.000 mm');
  const [resolution, setResolution] = useState<string>(gage?.resolution || '0.001 mm');
  const [accuracy, setAccuracy] = useState<string>(gage?.accuracy || '± 0.002 mm');
  const [calibrationFrequencyMonths, setCalibrationFrequencyMonths] = useState<number>(
    gage?.calibrationFrequencyMonths || 6
  );
  const [lastCalibrationDate, setLastCalibrationDate] = useState<string>(
    gage?.lastCalibrationDate || todayStr
  );
  const [nextCalibrationDueDate, setNextCalibrationDueDate] = useState<string>(
    gage?.nextCalibrationDueDate ||
      (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().slice(0, 10);
      })()
  );
  const [assignedTo, setAssignedTo] = useState<string>(gage?.assignedTo || 'Alex Rivera');
  const [masterStandardRef, setMasterStandardRef] = useState<string>(
    gage?.masterStandardRef || 'Grade 0 Ceramic Gage Block Set NIST #821/2839'
  );
  const [notes, setNotes] = useState<string>(gage?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: gage?.id,
      assetTag,
      name,
      instrumentType,
      manufacturer,
      modelNumber,
      serialNumber,
      location,
      department,
      measurementRange,
      resolution,
      accuracy,
      calibrationFrequencyMonths,
      lastCalibrationDate,
      nextCalibrationDueDate,
      assignedTo,
      masterStandardRef,
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Edit Instrument: ${gage?.assetTag}` : 'Register New Measuring Instrument'}
              </h3>
              <p className="text-xs text-slate-400">Add to Gage Master with calibration frequency and NIST traceability</p>
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
              <label className="block text-slate-300 font-medium mb-1">Asset Control Tag / Barcode</label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="e.g. GAG-MIC-014"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Instrument Category</label>
              <select
                value={instrumentType}
                onChange={(e) => setInstrumentType(e.target.value as GageInstrumentType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="micrometer">Micrometer (External / Internal / Depth)</option>
                <option value="bore_gauge">Bore Micrometer / 3-Point Hole Gauge</option>
                <option value="caliper">Vernier / Digital Caliper</option>
                <option value="hardness_tester">Rockwell / Brinell Hardness Tester</option>
                <option value="roughness_tester">Surface Roughness Profilometer (Ra)</option>
                <option value="plug_thread_gauge">Go / No-Go Thread Plug &amp; Ring Gauge</option>
                <option value="height_gauge">Digital Height Gauge</option>
                <option value="dial_indicator">Dial Indicator / Lever Probe</option>
                <option value="cmm_probe">CMM Probe Head / Stylus</option>
                <option value="torque_wrench">Precision Torque Wrench</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Instrument Description / Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mitutoyo 3-Point Internal Bore Micrometer 50-75mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Manufacturer</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Mitutoyo, Starrett, Fowler, Buehler"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Model #</label>
              <input
                type="text"
                required
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Serial Number (S/N)</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Storage Location / Cell</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Metrology Lab, CNC HAAS-01 Cell"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Measurement Range</label>
              <input
                type="text"
                required
                value={measurementRange}
                onChange={(e) => setMeasurementRange(e.target.value)}
                placeholder="e.g. 50.000 - 75.000 mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Resolution &amp; Accuracy</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Res: 0.001 mm"
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <input
                  type="text"
                  required
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  placeholder="Acc: ±0.002 mm"
                  className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Calibration Cycle (Months)</label>
              <select
                value={calibrationFrequencyMonths}
                onChange={(e) => {
                  const months = parseInt(e.target.value) || 12;
                  setCalibrationFrequencyMonths(months);
                  const d = new Date(lastCalibrationDate);
                  d.setMonth(d.getMonth() + months);
                  setNextCalibrationDueDate(d.toISOString().slice(0, 10));
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value={3}>3 Months (High Wear / Sensitive)</option>
                <option value={6}>6 Months (Standard Shopfloor)</option>
                <option value={12}>12 Months (Metrology Lab / Low Wear)</option>
                <option value={24}>24 Months (Reference Setting Standards)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Calibration Due Date</label>
              <input
                type="date"
                required
                value={nextCalibrationDueDate}
                onChange={(e) => setNextCalibrationDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Master Standard Reference</label>
              <input
                type="text"
                value={masterStandardRef}
                onChange={(e) => setMasterStandardRef(e.target.value)}
                placeholder="e.g. Mitutoyo Setting Ring Ø50.000mm #SR-50"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Custodian / Assigned Operator</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Alex Rivera (Lead Machinist)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Operating Notes / Restrictions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dedicated to CNC Cell HAAS-01 for precision bore finishing"
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
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Update Instrument' : 'Register Instrument'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
