// src/components/routings/WorkCenterModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  DollarSign, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { WorkCenter } from '../../types/routing';

interface WorkCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wc: WorkCenter) => void;
  existingItem?: WorkCenter | null;
}

export const WorkCenterModal: React.FC<WorkCenterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingItem
}) => {
  const isEditing = Boolean(existingItem);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Machine Shop');
  const [hourlyMachineRate, setHourlyMachineRate] = useState<number>(850);
  const [hourlyLaborRate, setHourlyLaborRate] = useState<number>(300);
  const [capacityHoursPerDay, setCapacityHoursPerDay] = useState<number>(16);
  const [status, setStatus] = useState<'active' | 'maintenance' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingItem) {
      setCode(existingItem.code);
      setName(existingItem.name);
      setDepartment(existingItem.department);
      setHourlyMachineRate(existingItem.hourlyMachineRate);
      setHourlyLaborRate(existingItem.hourlyLaborRate);
      setCapacityHoursPerDay(existingItem.capacityHoursPerDay || 16);
      setStatus(existingItem.status);
      setNotes(existingItem.notes || '');
    } else {
      setCode('');
      setName('');
      setDepartment('Machine Shop');
      setHourlyMachineRate(850);
      setHourlyLaborRate(300);
      setCapacityHoursPerDay(16);
      setStatus('active');
      setNotes('');
    }
    setErrors({});
  }, [existingItem, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = 'Work center code is required';
    if (!name.trim()) errs.name = 'Work center name is required';
    if (hourlyMachineRate < 0) errs.hourlyMachineRate = 'Rate cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: existingItem?.id || `wc_${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      department,
      hourlyMachineRate: Number(hourlyMachineRate) || 0,
      hourlyLaborRate: Number(hourlyLaborRate) || 0,
      capacityHoursPerDay: Number(capacityHoursPerDay) || 16,
      status,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Work Center' : 'Add New Work Center / Bay'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure machine rates, capabilities & daily shift capacity
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Work Center Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WC-CNC-05"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cutting & Blanking">Cutting & Blanking</option>
                <option value="Fabrication & Welding">Fabrication & Welding</option>
                <option value="Machine Shop">Machine Shop</option>
                <option value="Finish Grinding">Finish Grinding</option>
                <option value="Heat Treatment">Heat Treatment</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Assembly & Dispatch">Assembly & Dispatch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Work Center Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Doosan Puma 2600Y Turning Center"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Machine Rate (₹/hr)
              </label>
              <input
                type="number"
                min="0"
                value={hourlyMachineRate}
                onChange={(e) => setHourlyMachineRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Labor Rate (₹/hr)
              </label>
              <input
                type="number"
                min="0"
                value={hourlyLaborRate}
                onChange={(e) => setHourlyLaborRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Daily Capacity (hrs)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={capacityHoursPerDay}
                onChange={(e) => setCapacityHoursPerDay(parseInt(e.target.value) || 16)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Operational Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active (Available for Shopfloor Allocation)</option>
              <option value="maintenance">Under Maintenance / Calibration</option>
              <option value="inactive">Decommissioned / Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Specifications & Tooling Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spindle power, travel limits, chuck sizes, or inspection capabilities..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Work Center</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
