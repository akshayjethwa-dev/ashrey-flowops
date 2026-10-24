// src/components/procurement-dashboard/OpenPoListSection.tsx

import React, { useState } from 'react';
import { OpenPurchaseOrderItem, PoRiskTag } from '../../types/procurementDashboard';
import { 
  ShoppingBag, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';

interface OpenPoListSectionProps {
  poList: OpenPurchaseOrderItem[];
  onExpediteWhatsApp: (poId: string, phone: string) => void;
}

export const OpenPoListSection: React.FC<OpenPoListSectionProps> = ({
  poList,
  onExpediteWhatsApp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | PoRiskTag>('all');

  const filteredPos = poList.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.keyItemSummary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'all' || po.riskTag === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (riskTag: PoRiskTag, days: number) => {
    switch (riskTag) {
      case 'critical_delayed':
        return (
          <span className="inline-flex items-center text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200 uppercase">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {Math.abs(days)}d Overdue
          </span>
        );
      case 'approaching_due':
        return (
          <span className="inline-flex items-center text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 uppercase">
            <Clock className="w-3 h-3 mr-1" />
            Due in {days}d
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            On Track ({days}d)
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              Open Purchase Orders & Fulfillment Tracking
            </h3>
            <span className="text-[10px] font-mono uppercase bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded border border-sky-200">
              {poList.length} Active Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline tracking committed supplier deliveries, promised milestones, and production work order linkages.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center text-xs">
          <button
            onClick={() => setRiskFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              riskFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRiskFilter('critical_delayed')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              riskFilter === 'critical_delayed'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setRiskFilter('approaching_due')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              riskFilter === 'approaching_due'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Due Soon
          </button>
          <button
            onClick={() => setRiskFilter('on_track')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              riskFilter === 'on_track'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            On Track
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by PO number, supplier, or material description..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
        />
      </div>

      {/* PO Table / Cards */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase bg-slate-50/50">
              <th className="py-2.5 px-3">PO Reference</th>
              <th className="py-2.5 px-3">Supplier & Material</th>
              <th className="py-2.5 px-3 text-right">Value (INR)</th>
              <th className="py-2.5 px-3">Promised Delivery</th>
              <th className="py-2.5 px-3">Status & Risk</th>
              <th className="py-2.5 px-3 text-center">Linked Jobs</th>
              <th className="py-2.5 px-3 text-right">Expedite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPos.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-mono font-bold text-sky-700">{po.poNumber}</div>
                  <span className="text-[10px] text-slate-400 font-mono">Issued {po.orderDate}</span>
                </td>

                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{po.supplierName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{po.keyItemSummary}</div>
                </td>

                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{po.totalValueInr.toLocaleString('en-IN')}
                </td>

                <td className="py-3 px-3 font-mono">
                  <span className="block font-medium text-slate-700">{po.promisedDeliveryDate}</span>
                </td>

                <td className="py-3 px-3">
                  {getRiskBadge(po.riskTag, po.daysRemainingOrOverdue)}
                </td>

                <td className="py-3 px-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {po.linkedWorkOrders.map((wo) => (
                      <span key={wo} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                        {wo}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onExpediteWhatsApp(po.id, po.supplierPhone)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </td>
              </tr>
            ))}

            {filteredPos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs text-slate-400 font-mono">
                  No matching purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
