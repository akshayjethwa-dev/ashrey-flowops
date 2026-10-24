// src/components/dispatch/ScheduleDispatchModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Warehouse
} from 'lucide-react';
import { ReadyToShipOrder, DispatchScheduleEvent } from '../../types/dispatchManagement';

interface ScheduleDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOrder?: ReadyToShipOrder | null;
  selectedDate?: string;
  onScheduleCreated: (event: DispatchScheduleEvent) => void;
}

export const ScheduleDispatchModal: React.FC<ScheduleDispatchModalProps> = ({
  isOpen,
  onClose,
  targetOrder,
  selectedDate,
  onScheduleCreated
}) => {
  const [scheduledDate, setScheduledDate] = useState(
    selectedDate || targetOrder?.deliveryDueDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [dockBay, setDockBay] = useState(targetOrder?.assignedDockBay || 'Dock Bay #3 (North)');
  const [transporter, setTransporter] = useState('SafeExpress Logistics Ltd.');
  const [vehicleNumber, setVehicleNumber] = useState('MH-12-PQ-9876');
  const [packagesCount, setPackagesCount] = useState(targetOrder?.itemCount || 3);
  const [totalWeightKg, setTotalWeightKg] = useState(120);
  const [customerName, setCustomerName] = useState(targetOrder?.customerName || 'Tata Motors Precision CVBU');
  const [destination, setDestination] = useState(targetOrder?.destination || 'Pune Manufacturing Plant Gate #4');
  const [orderNumber, setOrderNumber] = useState(targetOrder?.orderNumber || 'ORD-2026-9041');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEvent: DispatchScheduleEvent = {
      id: `ev-sched-${Date.now()}`,
      dispatchNumber: `DS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber,
      customerName,
      destination,
      scheduledDate,
      scheduledTime,
      transporter,
      vehicleNumber,
      dockBay,
      packagesCount,
      totalWeightKg,
      status: 'Planned',
      dispatchObj: {
        id: `disp_${Date.now()}`,
        orderId: targetOrder?.orderId || 'ord_scheduled',
        customerName,
        destination,
        transporter,
        vehicleNumber,
        dispatchBay: dockBay,
        dispatchDate: scheduledDate,
        status: 'Planned'
      }
    };

    onScheduleCreated(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block">
                DISPATCH CALENDAR & DOCK ALLOCATION
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Schedule Outward Truck Consignment
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono text-slate-700">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Order / Reference Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Consignee / Client
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Scheduled Departure Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Target Loading Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Assigned Loading Dock Bay
            </label>
            <select
              value={dockBay}
              onChange={e => setDockBay(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Dock Bay #1 (South)">Dock Bay #1 (South) · Heavy Cranes & Pallets</option>
              <option value="Dock Bay #2 (West)">Dock Bay #2 (West) · Medium Containers</option>
              <option value="Dock Bay #3 (North)">Dock Bay #3 (North) · Express Parcel & Small Truck</option>
              <option value="Special Handling Bay #4">Special Handling Bay #4 · Aviation / Cleanroom Freight</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Transporter / Logistics Carrier
              </label>
              <select
                value={transporter}
                onChange={e => setTransporter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="SafeExpress Logistics Ltd.">SafeExpress Logistics Ltd.</option>
                <option value="VRL Logistics Express">VRL Logistics Express</option>
                <option value="TCI Express Direct Hub">TCI Express Direct Hub</option>
                <option value="Blue Dart Aviation Freight">Blue Dart Aviation Freight</option>
                <option value="Gati-KWE Surface Logistics">Gati-KWE Surface Logistics</option>
                <option value="Delhivery Freight">Delhivery Freight</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                placeholder="MH-12-PQ-9876"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Estimated Packages / Cartons
              </label>
              <input
                type="number"
                value={packagesCount}
                onChange={e => setPackagesCount(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Estimated Gross Weight (Kg)
              </label>
              <input
                type="number"
                value={totalWeightKg}
                onChange={e => setTotalWeightKg(parseFloat(e.target.value) || 10)}
                min="1"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Destination / Unloading Plant
            </label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono uppercase font-bold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-mono uppercase font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>Confirm & Add to Schedule</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
