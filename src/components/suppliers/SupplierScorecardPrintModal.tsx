// src/components/suppliers/SupplierScorecardPrintModal.tsx

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { SupplierWithMetrics } from '../../types/supplierScorecard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithMetrics | null;
}

export const SupplierScorecardPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  supplier
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !supplier) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Modal Controls Bar (Hidden during actual print) */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Official Supplier Scorecard Audit Report
              </h2>
              <p className="text-xs text-slate-400">
                Print or export formal PDF for vendor evaluation and quality audits
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Scorecard Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 text-slate-900">
          <div
            ref={printRef}
            className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-300 space-y-6 print:shadow-none print:border-none print:p-0"
          >
            {/* Formal Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif uppercase">
                  Ashrey FlowOps Industrial
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Procurement & Quality Engineering Division • Corporate Operations
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pune Facility: Chakan Industrial Phase II, Pune 410501 • GSTIN: 27AAACA9001P1Z5
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded">
                  VENDOR AUDIT SCORECARD
                </span>
                <p className="text-[11px] text-slate-600 mt-2">Audit Date: {todayStr}</p>
                <p className="text-[11px] text-slate-600">Period: Rolling 6-Month Review</p>
              </div>
            </div>

            {/* Supplier Master Info Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                  Vendor Name & Address
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{supplier.legalName || supplier.name}</h3>
                <p className="text-slate-600 font-mono text-[11px] mt-0.5">Supplier Code: {supplier.code}</p>
                <p className="text-slate-600 mt-1">
                  {supplier.address.street}, {supplier.address.city}, {supplier.address.state} — {supplier.address.pinCode}
                </p>
                <p className="text-slate-600 font-mono text-[11px] mt-0.5">GSTIN: {supplier.gstin}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                  AVL Classification & Key Contact
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 text-white">
                    {supplier.tier.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-slate-800">Rank #{supplier.metrics.rank}</span>
                </div>
                <p className="text-slate-700 mt-2 font-medium">
                  Rep: {supplier.contactPerson} ({supplier.role})
                </p>
                <p className="text-slate-600 text-[11px]">{supplier.email} • {supplier.phone}</p>
                <p className="text-slate-600 text-[11px] mt-1 font-mono">
                  Certifications: {supplier.certifications.join(', ')}
                </p>
              </div>
            </div>

            {/* Performance Metrics Summary Table */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
                Executive Sourcing Performance Summary
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700 uppercase">
                  <tr>
                    <th className="p-2.5">Evaluation Parameter</th>
                    <th className="p-2.5 text-center">Score / Rate</th>
                    <th className="p-2.5 text-center">Target SLA</th>
                    <th className="p-2.5">Audit Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  <tr>
                    <td className="p-2.5 font-bold">Composite Performance Score</td>
                    <td className="p-2.5 text-center font-black font-mono text-sm text-slate-900">
                      {supplier.metrics.compositeScore} / 100
                    </td>
                    <td className="p-2.5 text-center font-mono">≥ 85</td>
                    <td className="p-2.5">
                      <span className="font-semibold text-emerald-700">
                        {supplier.metrics.compositeScore >= 85 ? 'Exceeds Expectations' : 'Needs Corrective Action'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">On-Time Delivery (OTD %)</td>
                    <td className="p-2.5 text-center font-bold font-mono">{supplier.metrics.onTimeDeliveryRatePct}%</td>
                    <td className="p-2.5 text-center font-mono">≥ 95%</td>
                    <td className="p-2.5 text-slate-600">
                      Avg delay {supplier.metrics.avgDelayDays} days against {supplier.leadTimeDays}d nominal lead time
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Quality Acceptance Rate (QAR %)</td>
                    <td className="p-2.5 text-center font-bold font-mono">{supplier.metrics.qualityAcceptanceRatePct}%</td>
                    <td className="p-2.5 text-center font-mono">≥ 98%</td>
                    <td className="p-2.5 text-slate-600">
                      Defect rate: {supplier.metrics.ppmDefectRate} PPM at incoming inward dock
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Commercial Responsiveness SLA</td>
                    <td className="p-2.5 text-center font-bold font-mono">{supplier.metrics.responsivenessScorePct}%</td>
                    <td className="p-2.5 text-center font-mono">≥ 90%</td>
                    <td className="p-2.5 text-slate-600">PO acknowledgment and RFQ response turnarounds</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Price Stability & Variance Index</td>
                    <td className="p-2.5 text-center font-bold font-mono">±{supplier.metrics.priceVariancePct}%</td>
                    <td className="p-2.5 text-center font-mono">≤ ±2.5%</td>
                    <td className="p-2.5 text-slate-600">Total Fulfilled Value: {formatCurrency(supplier.metrics.totalSpend)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6-Month Rolling Fulfillment Table */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
                6-Month Delivery & Quality Log
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[10px] text-slate-700 uppercase">
                  <tr>
                    <th className="p-2">Month</th>
                    <th className="p-2 text-right">Orders Fulfilled</th>
                    <th className="p-2 text-right">OTD %</th>
                    <th className="p-2 text-right">Quality %</th>
                    <th className="p-2 text-right">PPM</th>
                    <th className="p-2 text-right">Spend (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {supplier.metrics.monthlyTrends.map(m => (
                    <tr key={m.month}>
                      <td className="p-2 font-bold">{m.monthLabel}</td>
                      <td className="p-2 text-right">{m.ordersCount}</td>
                      <td className="p-2 text-right font-bold">{m.otdRatePct}%</td>
                      <td className="p-2 text-right font-bold">{m.qualityAcceptancePct}%</td>
                      <td className="p-2 text-right">{m.ppmDefectRate}</td>
                      <td className="p-2 text-right">{formatCurrency(m.spendAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sourcing Committee Recommendation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Procurement Committee Evaluation Remarks
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {supplier.metrics.compositeScore >= 90
                  ? `RECOMMENDATION: QUALIFIED TIER-1 PARTNER. Excellent delivery performance and high defect-free quality rating. Re-qualified for automatic allocation in MRP planning and fast-track receiving without quarantine delays.`
                  : supplier.metrics.compositeScore >= 80
                  ? `RECOMMENDATION: APPROVED TIER-2 SUPPLIER. Maintains satisfactory quality and responsiveness. Continued inclusion in RFQ bidding and active production purchase orders approved.`
                  : `RECOMMENDATION: CONDITIONAL STATUS. Supplier required to submit 8D CAPA root cause report for recent non-conformances. Inward lot sampling increased to Level II 100% inspection.`}
              </p>
            </div>

            {/* Sign-off signatures */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 font-mono">
              <div>
                <div className="border-b border-slate-400 pb-8 font-serif italic text-slate-800">
                  Sanjay Sharma
                </div>
                <p className="mt-1 font-bold text-slate-900">Procurement Manager</p>
                <p className="text-[10px] text-slate-500">Ashrey FlowOps</p>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-8 font-serif italic text-slate-800">
                  Amit Joshi
                </div>
                <p className="mt-1 font-bold text-slate-900">Head of Quality Assurance</p>
                <p className="text-[10px] text-slate-500">QA / QC Department</p>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-8 font-serif italic text-slate-800">
                  {supplier.contactPerson}
                </div>
                <p className="mt-1 font-bold text-slate-900">Supplier Authorized Signatory</p>
                <p className="text-[10px] text-slate-500">{supplier.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
