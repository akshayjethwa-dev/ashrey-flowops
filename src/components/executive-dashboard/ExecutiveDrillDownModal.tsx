// src/components/executive-dashboard/ExecutiveDrillDownModal.tsx

import React from 'react';
import { 
  BacklogDrillDownItem, 
  WipDrillDownItem, 
  OtdDrillDownShipment 
} from '../../types/executiveDashboard';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  ShoppingBag, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  FileText, 
  Download 
} from 'lucide-react';

interface Props {
  drillDownType: 'revenue' | 'margin' | 'otd' | 'backlog' | 'wip' | null;
  onClose: () => void;
  backlogItems: BacklogDrillDownItem[];
  wipItems: WipDrillDownItem[];
  otdShipments: OtdDrillDownShipment[];
}

export const ExecutiveDrillDownModal: React.FC<Props> = ({
  drillDownType,
  onClose,
  backlogItems,
  wipItems,
  otdShipments
}) => {
  if (!drillDownType) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getModalTitle = () => {
    switch (drillDownType) {
      case 'revenue':
      case 'margin':
        return {
          title: 'Order-by-Order Revenue & Gross Margin Profitability Audit',
          subtitle: 'Live realized contract revenue, actual material/labor/machine COGS, and profit margins.',
          icon: <DollarSign className="h-5 w-5 text-emerald-600" />
        };
      case 'otd':
        return {
          title: 'On-Time Delivery (OTD) Fleet Shipments Audit',
          subtitle: 'Consignment-level logistics tracking, carrier delivery compliance, and delay root causes.',
          icon: <Truck className="h-5 w-5 text-sky-600" />
        };
      case 'backlog':
        return {
          title: 'Committed Customer Order Backlog Register',
          subtitle: 'Unfulfilled customer orders scheduled in production with promised delivery windows.',
          icon: <ShoppingBag className="h-5 w-5 text-amber-600" />
        };
      case 'wip':
        return {
          title: 'Work-in-Progress (WIP) Capital Distribution by Cell',
          subtitle: 'Active shopfloor working capital tied up across operational routing stations.',
          icon: <Layers className="h-5 w-5 text-purple-600" />
        };
    }
  };

  const headerInfo = getModalTitle();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-slate-800 rounded-xl">
              {headerInfo.icon}
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {headerInfo.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Table Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          
          {/* 1. REVENUE & MARGIN DRILL-DOWN */}
          {(drillDownType === 'revenue' || drillDownType === 'margin') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Total Recognized MTD</span>
                  <div className="text-lg font-bold text-emerald-950 mt-1">₹1.42 Cr</div>
                  <span className="text-[10px] text-emerald-700">+14.2% Growth vs Last Month</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  <span className="text-[10px] text-indigo-800 uppercase font-bold">Average Gross Margin</span>
                  <div className="text-lg font-bold text-indigo-950 mt-1">28.6% Realized</div>
                  <span className="text-[10px] text-indigo-700">Target Benchmark: 25.0%</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Realized Profit</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">₹40.64 Lakhs</div>
                  <span className="text-[10px] text-slate-500">Across 24 Finished Batches</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Product Part</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Revenue</th>
                        <th className="py-2.5 px-3 text-right">Gross Profit</th>
                        <th className="py-2.5 px-3 text-right">Margin %</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backlogItems.map((item, idx) => {
                        const gp = item.totalValue * 0.286;
                        const marginPct = 28.6;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {item.orderNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-sans font-bold whitespace-nowrap">
                              {item.customerName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-sans">
                              {item.partDescription}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                              {item.quantity} pcs
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(item.totalValue)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-bold whitespace-nowrap">
                              {formatCurrency(gp)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                              {marginPct}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                Healthy
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. ON-TIME DELIVERY (OTD) DRILL-DOWN */}
          {drillDownType === 'otd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                  <span className="text-[10px] text-sky-800 uppercase font-bold">Fleet OTD Rate</span>
                  <div className="text-lg font-bold text-sky-950 mt-1">95.8% Compliance</div>
                  <span className="text-[10px] text-sky-700">Target: ≥ 95.0%</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">On-Time Dispatches</span>
                  <div className="text-lg font-bold text-emerald-950 mt-1">46 / 48 Consignments</div>
                  <span className="text-[10px] text-emerald-700">Zero Shopfloor Production Delays</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] text-amber-800 uppercase font-bold">Transit Delays</span>
                  <div className="text-lg font-bold text-amber-950 mt-1">2 Consignments Delayed</div>
                  <span className="text-[10px] text-amber-700">Average Transit Delay: 1.8 Days</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Dispatch #</th>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Customer & Destination</th>
                        <th className="py-2.5 px-3">Transporter & LR #</th>
                        <th className="py-2.5 px-3">Promised Date</th>
                        <th className="py-2.5 px-3">Delivery Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Root Cause / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {otdShipments.map((ship) => (
                        <tr key={ship.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {ship.dispatchNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {ship.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <strong className="text-slate-800 block">{ship.customerName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">{ship.destination}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="text-slate-800">{ship.transporterName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{ship.lrNumber}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {ship.promisedDate}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                            {ship.actualDeliveryDate || 'In Transit'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              ship.status === 'on_time' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              ship.status === 'delayed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {ship.status === 'on_time' ? 'On-Time' : ship.status === 'delayed' ? 'Delayed' : 'In Transit'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-sans max-w-xs truncate" title={ship.rootCause}>
                            {ship.rootCause || 'Delivered strictly on scheduled gate pass'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. COMMITTED BACKLOG DRILL-DOWN */}
          {drillDownType === 'backlog' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] text-amber-800 uppercase font-bold">Total Committed Backlog</span>
                  <div className="text-lg font-bold text-amber-950 mt-1">₹58.40 Lakhs</div>
                  <span className="text-[10px] text-amber-700">18 Production Orders</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Aging: &lt; 15 Days</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">₹38.50 Lakhs (66%)</div>
                  <span className="text-[10px] text-slate-500">Immediate Shopfloor Queue</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Aging: &gt; 30 Days</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">₹5.70 Lakhs (9.7%)</div>
                  <span className="text-[10px] text-slate-500">Scheduled Staggered Batches</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Component Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Backlog Value</th>
                        <th className="py-2.5 px-3">Promised Date</th>
                        <th className="py-2.5 px-3 text-center">Days Left</th>
                        <th className="py-2.5 px-3 text-center">Risk Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backlogItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {item.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-800 whitespace-nowrap">
                            {item.customerName}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600">
                            {item.partDescription}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                            {item.quantity} pcs
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(item.totalValue)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {item.committedDate}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              item.daysRemaining <= 3 ? 'bg-rose-100 text-rose-800' :
                              item.daysRemaining <= 7 ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {item.daysRemaining} days
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.riskTier === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              item.riskTier === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {item.riskTier} Risk
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. WIP CAPITAL DRILL-DOWN */}
          {drillDownType === 'wip' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <span className="text-[10px] text-purple-800 uppercase font-bold">Total Floor WIP Capital</span>
                  <div className="text-lg font-bold text-purple-950 mt-1">₹24.80 Lakhs</div>
                  <span className="text-[10px] text-purple-700">12 Active Work Orders</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Largest Tied-up Stage</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">CNC Rough Turning (₹7.8L)</div>
                  <span className="text-[10px] text-amber-600 font-bold">Active Congestion Point</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Lead Time Velocity</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">4.8 Days Average</div>
                  <span className="text-[10px] text-emerald-600">Zero Stagnant Stock &gt; 14 Days</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Routing Operation Stage</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3 text-right">Batches</th>
                        <th className="py-2.5 px-3 text-right">Pieces</th>
                        <th className="py-2.5 px-3 text-right">Tied-Up Capital</th>
                        <th className="py-2.5 px-3 text-right">Avg Cycle</th>
                        <th className="py-2.5 px-3">Active Work Orders</th>
                        <th className="py-2.5 px-3 text-center">Stage Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wipItems.map((stg) => (
                        <tr key={stg.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                            {stg.stageName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {stg.operationCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                            {stg.batchCount} batches
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {stg.unitCount} pcs
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-700 whitespace-nowrap">
                            {formatCurrency(stg.tiedUpValue)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {stg.avgLeadTimeHours} hrs
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {stg.activeWorkOrders.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              stg.status === 'congested' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              stg.status === 'clear' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {stg.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Real-time live aggregation from Ashrey FlowOps ERP telemetry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Close Drill-Down
          </button>
        </div>

      </div>
    </div>
  );
};
