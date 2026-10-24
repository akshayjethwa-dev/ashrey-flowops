// src/components/landed-cost/LandedCostDetailDrawer.tsx

import React from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Download,
  Edit3,
  Ship,
  MapPin,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';
import { LandedCostVoucher } from '../../types/landedCost';
import { COMPONENT_LABELS, ALLOCATION_RULES_METADATA } from '../../services/landedCostService';

interface LandedCostDetailDrawerProps {
  voucher: LandedCostVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  onPostVoucher: (id: string) => void;
  onReverseVoucher: (id: string) => void;
  onEditVoucher: (voucher: LandedCostVoucher) => void;
  onExportCsv: () => void;
}

export const LandedCostDetailDrawer: React.FC<LandedCostDetailDrawerProps> = ({
  voucher,
  isOpen,
  onClose,
  onPostVoucher,
  onReverseVoucher,
  onEditVoucher,
  onExportCsv
}) => {
  if (!isOpen || !voucher) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isPosted = voucher.status === 'posted';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 sticky top-0 z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                <FileCheck className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-mono">{voucher.voucherNumber}</h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                      isPosted
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        : voucher.status === 'reversed'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                    }`}
                  >
                    {isPosted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Capitalized in Inventory
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> {voucher.status.toUpperCase()}
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{voucher.title}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Origin Location</span>
              <div className="font-semibold text-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {voucher.originLocation}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Receiving Facility</span>
              <div className="font-semibold text-slate-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                {voucher.destinationPlant}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Voucher Date</span>
              <div className="font-semibold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                {voucher.voucherDate}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Allocation Rule</span>
              <div className="font-semibold text-cyan-300 font-mono">
                {ALLOCATION_RULES_METADATA[voucher.defaultAllocationRule]?.name}
              </div>
            </div>
          </div>

          {/* Shipment & Customs Details */}
          {(voucher.shipmentRef || voucher.customsDocRef || voucher.carrierName) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs font-mono">
              {voucher.shipmentRef && (
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Shipment / B/L Reference</span>
                  <span className="text-slate-300 font-semibold">{voucher.shipmentRef}</span>
                </div>
              )}
              {voucher.customsDocRef && (
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Customs Bill of Entry (BoE)</span>
                  <span className="text-amber-300 font-semibold">{voucher.customsDocRef}</span>
                </div>
              )}
              {voucher.carrierName && (
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Carrier / Transporter</span>
                  <span className="text-slate-300 font-semibold">{voucher.carrierName}</span>
                </div>
              )}
            </div>
          )}

          {/* Financial Totals Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Base Purchase Value
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {formatCurrency(voucher.totalBaseValue)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-cyan-400 uppercase font-semibold block mb-1">
                Landed Surcharges
              </span>
              <span className="text-lg font-bold text-cyan-300 font-mono">
                +{formatCurrency(voucher.totalLandedCharges)}
              </span>
            </div>
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">
                True Landed Capitalized
              </span>
              <span className="text-lg font-bold text-emerald-200 font-mono">
                {formatCurrency(voucher.totalLandedValue)}
              </span>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-amber-400 uppercase font-semibold block mb-1">
                Effective Cost Markup
              </span>
              <span className="text-lg font-bold text-amber-300 font-mono flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{voucher.effectiveMarkupPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Charges List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Incurred Landed Cost Charges ({voucher.charges.length})
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Component Type</th>
                    <th className="py-2.5 px-3">Vendor / Service Provider</th>
                    <th className="py-2.5 px-3">Invoice No & Date</th>
                    <th className="py-2.5 px-3 text-right">Tax / GST</th>
                    <th className="py-2.5 px-3 text-right">Total Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {voucher.charges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-slate-200 block">
                          {COMPONENT_LABELS[charge.componentType]?.label || charge.componentType}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono line-clamp-1">
                          {charge.description}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{charge.vendorName}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {charge.invoiceNumber}
                        <span className="text-[10px] text-slate-500 block">{charge.invoiceDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {charge.taxAmount ? formatCurrency(charge.taxAmount) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatCurrency(charge.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocated Material Lots */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Allocated Inventory Lots & Capitalized Rates ({voucher.lotLines.length})
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Lot Number</th>
                      <th className="py-2.5 px-3">Material Description</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Base Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Landed Share</th>
                      <th className="py-2.5 px-3 text-right">True Landed Cost</th>
                      <th className="py-2.5 px-3 text-right">Markup %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {voucher.lotLines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-semibold text-cyan-300">{line.lotNumber}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-semibold text-slate-200 block">{line.itemName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {line.itemCode} {line.grnNumber && `• ${line.grnNumber}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {line.quantity} {line.uom}
                          {line.weightKg && (
                            <span className="text-[10px] text-slate-500 block">
                              {line.weightKg.toLocaleString()} kg
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {formatCurrency(line.baseUnitCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                          +{formatCurrency(line.allocatedCostPerUnit)}/{line.uom}
                          <span className="text-[10px] text-slate-500 block font-normal">
                            Total: {formatCurrency(line.allocatedChargeAmount)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white bg-slate-900/60">
                          {formatCurrency(line.trueLandedCostPerUnit)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">
                          +{line.landedMarkupPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Audit Trail & Posting Info */}
          {voucher.postedAt && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Financial Audit Trail Information
              </span>
              <p>
                Posted and locked into General Ledger & Inventory Valuation on{' '}
                <strong className="text-white">{new Date(voucher.postedAt).toLocaleString()}</strong> by{' '}
                <strong className="text-slate-200">{voucher.postedBy || 'Authorized Officer'}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Export Audit CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isPosted && (
              <>
                <button
                  onClick={() => onEditVoucher(voucher)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Voucher
                </button>
                <button
                  onClick={() => onPostVoucher(voucher.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Post & Capitalize to Inventory
                </button>
              </>
            )}

            {isPosted && (
              <button
                onClick={() => onReverseVoucher(voucher.id)}
                className="px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Revert Allocation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
