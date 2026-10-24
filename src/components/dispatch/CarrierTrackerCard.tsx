// src/components/dispatch/CarrierTrackerCard.tsx

import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  PhoneCall, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Navigation,
  FileCheck,
  User,
  ExternalLink,
  X
} from 'lucide-react';
import { CarrierDetails, ShipmentMilestone } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';

interface CarrierTrackerCardProps {
  dispatch: Dispatch;
  carrierDetails: CarrierDetails;
  onUpdateCarrier: (updated: CarrierDetails) => void;
}

export const CarrierTrackerCard: React.FC<CarrierTrackerCardProps> = ({
  dispatch,
  carrierDetails,
  onUpdateCarrier
}) => {
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newStatus, setNewStatus] = useState('In Transit (Highway Checkpoint)');
  const [newLocation, setNewLocation] = useState('Pune Highway Bypass');
  const [newNote, setNewNote] = useState('Vehicle moving on schedule with unbroken cargo seals.');
  const [updatedBy, setUpdatedBy] = useState('Dispatch Supervisor');

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.trim() || !newLocation.trim()) return;

    const newMilestone: ShipmentMilestone = {
      id: `ms_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: newStatus.trim(),
      location: newLocation.trim(),
      note: newNote.trim(),
      updatedBy: updatedBy.trim() || 'Logistics Officer'
    };

    const updated: CarrierDetails = {
      ...carrierDetails,
      milestones: [...(carrierDetails.milestones || []), newMilestone]
    };

    onUpdateCarrier(updated);
    setShowAddMilestoneModal(false);
    setNewNote('');
  };

  const stages = [
    { key: 'planned', label: '1. Planned', active: true },
    { key: 'packed', label: '2. Packed & Weighed', active: true },
    { key: 'loaded', label: '3. Gate Cleared', active: (carrierDetails.milestones || []).length >= 2 },
    { key: 'transit', label: '4. In Transit', active: dispatch.status === 'Dispatched' || (carrierDetails.milestones || []).length >= 3 },
    { key: 'delivered', label: '5. Delivered', active: dispatch.status === 'Delivered' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6 font-sans">
      
      {/* Header & Carrier Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black">
                LOGISTICS CARRIER & FLEET CONTROLLER
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                GPS Verified
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {carrierDetails.transporter || 'SafeExpress Logistics India'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Vehicle: <strong className="text-slate-900 uppercase font-black">{carrierDetails.vehicleNumber || 'MH-12-PQ-9876'}</strong> ({carrierDetails.vehicleType || '14ft Closed Container'})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddMilestoneModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Milestone Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Visual Transit Progress Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-3">
          CONSIGNMENT LOGISTICS PROGRESSION:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          {stages.map((stg, sIdx) => (
            <div key={stg.key} className="flex flex-col items-center space-y-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                stg.active 
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs' 
                  : 'bg-white border-slate-300 text-slate-400'
              }`}>
                {stg.active ? <CheckCircle2 className="h-4 w-4" /> : sIdx + 1}
              </div>
              <span className={`text-[10px] font-bold uppercase ${stg.active ? 'text-indigo-950 font-black' : 'text-slate-400'}`}>
                {stg.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver & Bay Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono">
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">DRIVER OPERATOR</span>
          <strong className="text-slate-900 block font-sans text-sm">{carrierDetails.driverName || 'Sukhdev Singh'}</strong>
          {carrierDetails.driverPhone && (
            <a 
              href={`tel:${carrierDetails.driverPhone}`}
              className="text-indigo-650 hover:underline text-[11px] font-bold inline-flex items-center space-x-1 mt-0.5"
            >
              <PhoneCall className="h-3 w-3" />
              <span>Call: {carrierDetails.driverPhone}</span>
            </a>
          )}
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">DRIVING LICENSE (DL)</span>
          <strong className="text-slate-800 block">{carrierDetails.driverDlNumber || 'MH12 20180045920'}</strong>
          <span className="text-[10px] text-slate-400 block">Verified on Sarathi</span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">DISPATCH DOCK BAY</span>
          <strong className="text-slate-800 block">{carrierDetails.dispatchBay || 'Dock Bay #3 (North)'}</strong>
          <span className="text-[10px] text-slate-400 block">Gate Pass: GP-9014</span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase block">ESTIMATED ARRIVAL (ETA)</span>
          <strong className="text-indigo-900 block text-sm">{carrierDetails.etaDate || 'Tomorrow 11:00 AM'}</strong>
          <span className="text-[10px] text-slate-400 block">Seal: {carrierDetails.sealNumber || 'SEAL-2026-91'}</span>
        </div>
      </div>

      {/* Timeline Checkpoints */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center space-x-1.5">
          <Navigation className="h-4 w-4 text-indigo-600" />
          <span>Real-time Transit Milestones & Telematics Trail ({(carrierDetails.milestones || []).length} logged)</span>
        </h4>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(carrierDetails.milestones || []).map((ms, mIdx) => (
            <div key={ms.id || mIdx} className="relative group">
              {/* Dot */}
              <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                mIdx === (carrierDetails.milestones || []).length - 1 
                  ? 'bg-indigo-600 ring-4 ring-indigo-100' 
                  : 'bg-slate-400'
              }`} />

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 font-sans text-sm">{ms.status}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(ms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    · {new Date(ms.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-indigo-700 text-xs font-mono font-semibold">
                  <MapPin className="h-3 w-3" />
                  <span>{ms.location}</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px] leading-relaxed pt-1">
                  {ms.note}
                </p>
                <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                  <span>Logged by: {ms.updatedBy}</span>
                  <span>Checkpoint #{mIdx + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Navigation className="h-5 w-5 text-indigo-600" />
                <span>Log New Transit Milestone</span>
              </h4>
              <button onClick={() => setShowAddMilestoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Milestone Status Title:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                >
                  <option value="Cartons Weighed & Staged">Cartons Weighed & Staged at Bay</option>
                  <option value="Loaded on Transit Vehicle">Loaded on Transit Vehicle</option>
                  <option value="Security Gate Cleared (Gate Pass Issued)">Security Gate Cleared (Gate Pass Issued)</option>
                  <option value="In Transit (Highway Checkpoint)">In Transit (Highway Checkpoint)</option>
                  <option value="Arrived at Regional Logistics Hub">Arrived at Regional Logistics Hub</option>
                  <option value="Out for Final Destination Delivery">Out for Final Destination Delivery</option>
                  <option value="Delivered & Proof of Delivery (POD) Signed">Delivered & Proof of Delivery (POD) Signed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Location / Checkpoint Node:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Express Toll Plaza, Km 48"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Logistics Observations / Driver Remarks:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Vehicle passed weighbridge check. All carton seals intact without damage."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Authorized Officer / Logger:
                </label>
                <input
                  type="text"
                  required
                  value={updatedBy}
                  onChange={(e) => setUpdatedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
