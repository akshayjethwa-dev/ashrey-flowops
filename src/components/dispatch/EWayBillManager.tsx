// src/components/dispatch/EWayBillManager.tsx

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  AlertTriangle, 
  Truck, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Edit3,
  Ban
} from 'lucide-react';
import { EWayBillDetails, EWayBillVehicleHistory } from '../../types/dispatchManagement';
import { Dispatch } from '../../types';
import { packingDispatchService } from '../../services/packingDispatchService';

interface EWayBillManagerProps {
  dispatch: Dispatch;
  ewayBill: EWayBillDetails;
  onUpdateEWayBill: (updated: EWayBillDetails) => void;
}

export const EWayBillManager: React.FC<EWayBillManagerProps> = ({
  dispatch,
  ewayBill,
  onUpdateEWayBill
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [showUpdatePartBModal, setShowUpdatePartBModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Update Part B form state
  const [newVehicleNumber, setNewVehicleNumber] = useState(ewayBill.vehicleNumber || '');
  const [fromPlace, setFromPlace] = useState(ewayBill.fromAddress.split(',')[0] || 'Vadodara Plant');
  const [fromState, setFromState] = useState(ewayBill.fromState || 'Gujarat');
  const [reasonForChange, setReasonForChange] = useState<'transshipment' | 'breakdown' | 'others'>('transshipment');
  const [changeRemarks, setChangeRemarks] = useState('');

  // Cancel E-Way Bill state
  const [cancelReasonCode, setCancelReasonCode] = useState('2'); // 1-Duplicate, 2-Order Cancelled, 3-Data Entry, 4-Others
  const [cancelRemarks, setCancelRemarks] = useState('');

  const currentStatus = packingDispatchService.getEWayBillStatus(ewayBill.validUntil, ewayBill.status === 'cancelled');

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'active':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'ACTIVE / VALID ON NIC PORTAL'
        };
      case 'expiring_soon':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500 animate-pulse',
          label: 'EXPIRING SOON (<8 HOURS)'
        };
      case 'expired':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          label: 'VALIDITY EXPIRED'
        };
      case 'cancelled':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          label: 'CANCELLED IN 24H WINDOW'
        };
    }
  };

  const statusBadge = getStatusBadge();

  // Handle NIC JSON Download
  const handleDownloadNicJson = () => {
    const jsonPayload = packingDispatchService.generateNicEwbJson(dispatch, ewayBill);
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EWB_NIC_${ewayBill.ewayBillNumber.replace(/\s+/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const jsonPayload = packingDispatchService.generateNicEwbJson(dispatch, ewayBill);
    navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // Submit Part-B Update
  const handleSavePartB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleNumber.trim()) return;

    const historyEntry: EWayBillVehicleHistory = {
      vehicleNumber: newVehicleNumber.toUpperCase().trim(),
      fromPlace,
      fromState,
      userEnteredDate: new Date().toISOString(),
      reasonForChange,
      remarks: changeRemarks || 'Vehicle changed during transit stage'
    };

    const updated: EWayBillDetails = {
      ...ewayBill,
      vehicleNumber: newVehicleNumber.toUpperCase().trim(),
      vehicleUpdates: [...(ewayBill.vehicleUpdates || []), historyEntry]
    };

    onUpdateEWayBill(updated);
    setShowUpdatePartBModal(false);
  };

  // Submit Cancel E-Way Bill
  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonLabels: Record<string, string> = {
      '1': 'Duplicate E-Way Bill generated',
      '2': 'Order cancelled by customer',
      '3': 'Data entry clerical error',
      '4': 'Other operational justification'
    };

    const updated: EWayBillDetails = {
      ...ewayBill,
      status: 'cancelled',
      cancelReason: `${reasonLabels[cancelReasonCode]} - ${cancelRemarks}`,
      cancelledAt: new Date().toISOString()
    };

    onUpdateEWayBill(updated);
    setShowCancelModal(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6 font-sans">
      
      {/* Top Banner & Number */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-black">
              INDIAN GST E-WAY BILL SYSTEM · NIC PORTAL INTEGRATION
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${statusBadge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
              <span>{statusBadge.label}</span>
            </span>
          </div>

          <div className="flex items-baseline space-x-3 mt-1.5">
            <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {ewayBill.ewayBillNumber}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              (12-Digit Statutory GST Identifier)
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Generated on <strong className="font-mono text-slate-700">{new Date(ewayBill.generatedDate).toLocaleDateString()}</strong> · Valid until <strong className="font-mono text-slate-800">{new Date(ewayBill.validUntil).toLocaleString()}</strong> ({ewayBill.distanceKm} km allocated)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
            title="Print standard GST E-Way Bill slip with barcode"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print E-Way Slip</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
            title="Copy NIC schema JSON to clipboard"
          >
            {copiedJson ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadNicJson}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            title="Download JSON ready to upload on ewaybillgst.gov.in"
          >
            <Download className="h-3.5 w-3.5 text-slate-300" />
            <span>NIC Portal JSON</span>
          </button>

          {currentStatus !== 'cancelled' && (
            <>
              <button
                onClick={() => setShowUpdatePartBModal(true)}
                className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
                title="Update Vehicle / Transporter Details"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Update Part-B</span>
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="p-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Cancel E-Way Bill (within 24h window)"
              >
                <Ban className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {ewayBill.status === 'cancelled' && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-xs text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <strong className="block font-mono uppercase">E-Way Bill Cancelled on {new Date(ewayBill.cancelledAt || Date.now()).toLocaleString()}</strong>
            <span>Reason: {ewayBill.cancelReason}</span>
          </div>
        </div>
      )}

      {/* Two-Part Grid: PART-A and PART-B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PART-A: Consignor, Consignee & Item Values */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-xs font-mono font-bold uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>PART-A: Consignment & Value Details</span>
            </span>
            <span className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
              Doc: {ewayBill.docNumber} ({ewayBill.docType.replace('_', ' ').toUpperCase()})
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            {/* Consignor */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-slate-400 uppercase font-black block">FROM (SUPPLIER):</span>
              <p className="font-bold text-slate-900">{ewayBill.fromTradeName}</p>
              <div className="flex justify-between font-mono text-[11px] text-slate-600">
                <span>GSTIN: <strong>{ewayBill.fromGstin}</strong></span>
                <span>Pin: <strong>{ewayBill.fromPincode}</strong> ({ewayBill.fromState})</span>
              </div>
            </div>

            {/* Consignee */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
              <span className="text-[9px] font-mono text-indigo-700 uppercase font-black block">TO (RECIPIENT):</span>
              <p className="font-bold text-slate-900">{ewayBill.toTradeName}</p>
              <div className="flex justify-between font-mono text-[11px] text-slate-600">
                <span>GSTIN: <strong>{ewayBill.toGstin}</strong></span>
                <span>Pin: <strong>{ewayBill.toPincode}</strong> ({ewayBill.toState})</span>
              </div>
            </div>

            {/* Valuation & Tax Breakdown */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">HSN Tariff Chapter:</span>
                <strong className="text-slate-900">{ewayBill.hsnCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxable Cargo Amount:</span>
                <strong className="text-slate-900">₹{ewayBill.taxableAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>CGST (9%) + SGST (9%):</span>
                <span>₹{(ewayBill.cgstAmount + ewayBill.sgstAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 text-sm font-bold">
                <span className="text-slate-700">Total Invoice Value:</span>
                <span className="text-indigo-900 font-black">₹{ewayBill.totalInvoiceValue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PART-B: Vehicle, Transporter & Transit Milestones */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-xs font-mono font-bold uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              <span>PART-B: Vehicle & Transporter Details</span>
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">
              Mode: {ewayBill.transportMode}
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            {/* Active Vehicle */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-black">ACTIVE TRANSIT VEHICLE:</span>
                <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                  {ewayBill.vehicleType} Cargo
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 text-white font-mono font-black text-sm uppercase rounded tracking-wider">
                  {ewayBill.vehicleNumber}
                </div>
                <div className="text-xs font-mono text-slate-600">
                  <span className="block font-bold text-slate-800">{ewayBill.transporterName}</span>
                  <span className="text-[10px] text-slate-400">Transporter GSTIN: {ewayBill.transporterId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Consignment Document (LR / GR) */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Transporter Doc (LR/GR) No:</span>
                <strong className="text-indigo-700">{ewayBill.transDocNo || 'LR-890122'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doc Date:</span>
                <strong className="text-slate-800">{ewayBill.transDocDate || ewayBill.docDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Declared Transit Distance:</span>
                <strong className="text-slate-900">{ewayBill.distanceKm} KM</strong>
              </div>
            </div>

            {/* Vehicle Update History (Transshipment audit) */}
            {ewayBill.vehicleUpdates && ewayBill.vehicleUpdates.length > 0 && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1.5 font-mono">
                <span className="text-[9px] uppercase font-black text-amber-800 block">
                  VEHICLE UPDATE AUDIT (TRANSSHIPMENT LOG):
                </span>
                {ewayBill.vehicleUpdates.map((vu, vuIdx) => (
                  <div key={vuIdx} className="text-[11px] text-amber-900 border-l-2 border-amber-400 pl-2">
                    <strong>{vu.vehicleNumber}</strong> changed at {vu.fromPlace} ({new Date(vu.userEnteredDate).toLocaleTimeString()}) - Reason: {vu.reasonForChange}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Part-B Update Modal */}
      {showUpdatePartBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <span>Update Part-B (Change Vehicle / Carrier)</span>
              </h4>
              <button onClick={() => setShowUpdatePartBModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartB} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  New Vehicle Registration Plate Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">From Place / Hub:</label>
                  <input
                    type="text"
                    required
                    value={fromPlace}
                    onChange={(e) => setFromPlace(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">State:</label>
                  <input
                    type="text"
                    required
                    value={fromState}
                    onChange={(e) => setFromState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Reason for Vehicle Change (Rule 138):
                </label>
                <select
                  value={reasonForChange}
                  onChange={(e) => setReasonForChange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                >
                  <option value="transshipment">Transshipment at Logistics Hub</option>
                  <option value="breakdown">Vehicle Mechanical Breakdown / Accidental</option>
                  <option value="others">Other Legitimate Transport Transition</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Remarks / Note:</label>
                <input
                  type="text"
                  placeholder="e.g. Transferred cargo at Surat bypass hub due to axle issue"
                  value={changeRemarks}
                  onChange={(e) => setChangeRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUpdatePartBModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save & Update Part-B
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel E-Way Bill Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 border border-rose-200">
            <div className="flex justify-between items-center pb-2 border-b border-rose-200">
              <h4 className="text-base font-bold text-rose-900 flex items-center space-x-2">
                <Ban className="h-5 w-5 text-rose-600" />
                <span>Cancel E-Way Bill (Within 24 Hours)</span>
              </h4>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Under GST provisions, an E-Way Bill can be cancelled within 24 hours of generation provided the consignment is not transit-verified by GST enforcement squads.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Reason Code for Cancellation:
                </label>
                <select
                  value={cancelReasonCode}
                  onChange={(e) => setCancelReasonCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                >
                  <option value="1">1 - Duplicate E-Way Bill Generated</option>
                  <option value="2">2 - Order Cancelled by Customer</option>
                  <option value="3">3 - Data Entry Clerical Error</option>
                  <option value="4">4 - Others</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Detailed Operational Remarks:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter reason details..."
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm E-Way Bill Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Standard Print Slip Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl no-print">
              <span className="font-bold text-slate-900 text-sm">Official E-Way Bill Standard Print Slip</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-white font-sans text-slate-900 printable-document">
              {/* Slip Content */}
              <div className="border-2 border-slate-900 p-6 space-y-4">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">e-Way Bill System</h2>
                    <p className="text-xs text-slate-600">Government of India · National Informatics Centre (NIC)</p>
                  </div>
                  <div className="text-right">
                    {/* Simulated 2D QR Code */}
                    <div className="w-16 h-16 border-2 border-slate-900 p-1 grid grid-cols-4 gap-0.5 ml-auto">
                      {Array.from({ length: 16 }).map((_, qIdx) => (
                        <div key={qIdx} className={qIdx % 2 === 0 || qIdx % 3 === 0 ? 'bg-slate-900' : 'bg-transparent'} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">E-WAY BILL NO:</span>
                    <strong className="text-base text-slate-900">{ewayBill.ewayBillNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">GENERATED DATE & VALIDITY:</span>
                    <strong className="text-slate-900">{new Date(ewayBill.generatedDate).toLocaleDateString()} to {new Date(ewayBill.validUntil).toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* Part A Table */}
                <div className="space-y-1">
                  <h5 className="font-mono font-bold text-xs uppercase bg-slate-100 p-1.5">PART-A</h5>
                  <table className="w-full text-xs font-mono border border-slate-200">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 bg-slate-50 w-1/3 text-slate-500">GSTIN of Supplier</td>
                        <td className="p-1.5 font-bold">{ewayBill.fromGstin} - {ewayBill.fromTradeName}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Place of Dispatch</td>
                        <td className="p-1.5">{ewayBill.fromAddress} ({ewayBill.fromPincode})</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">GSTIN of Recipient</td>
                        <td className="p-1.5 font-bold">{ewayBill.toGstin} - {ewayBill.toTradeName}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Place of Delivery</td>
                        <td className="p-1.5">{ewayBill.toAddress} ({ewayBill.toPincode})</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Document No. & Date</td>
                        <td className="p-1.5 font-bold">{ewayBill.docNumber} Dt. {ewayBill.docDate}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Value of Goods / Taxable</td>
                        <td className="p-1.5 font-bold">₹{ewayBill.taxableAmount.toLocaleString('en-IN')} (Tot: ₹{ewayBill.totalInvoiceValue.toLocaleString('en-IN')})</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">HSN Code & Reason</td>
                        <td className="p-1.5">{ewayBill.hsnCode} / Supply</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Part B Table */}
                <div className="space-y-1 pt-2">
                  <h5 className="font-mono font-bold text-xs uppercase bg-slate-100 p-1.5">PART-B (Vehicle Details)</h5>
                  <table className="w-full text-xs font-mono border border-slate-200">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 bg-slate-50 w-1/3 text-slate-500">Mode of Transport</td>
                        <td className="p-1.5 uppercase font-bold">{ewayBill.transportMode}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Vehicle / Vessel No.</td>
                        <td className="p-1.5 font-black uppercase text-indigo-900">{ewayBill.vehicleNumber}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Transporter Doc No & Date</td>
                        <td className="p-1.5">{ewayBill.transDocNo} Dt. {ewayBill.transDocDate || ewayBill.docDate}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-50 text-slate-500">Transporter Name</td>
                        <td className="p-1.5">{ewayBill.transporterName}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-[10px] font-mono text-slate-500 text-center">
                  This is a computer generated statutory document under Rule 138 of Central Goods and Services Tax Rules, 2017.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
