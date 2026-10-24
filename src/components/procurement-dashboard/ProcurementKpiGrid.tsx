// src/components/procurement-dashboard/ProcurementKpiGrid.tsx

import React from 'react';
import { ProcurementKpis } from '../../types/procurementDashboard';
import { 
  ShoppingBag, 
  Truck, 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  Clock, 
  IndianRupee,
  CheckCircle2
} from 'lucide-react';

interface ProcurementKpiGridProps {
  kpis: ProcurementKpis;
  onOpenPoClick?: () => void;
  onStockoutClick?: () => void;
  onAgingClick?: () => void;
}

export const ProcurementKpiGrid: React.FC<ProcurementKpiGridProps> = ({
  kpis,
  onOpenPoClick,
  onStockoutClick,
  onAgingClick
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Open Purchase Orders */}
      <div 
        onClick={onOpenPoClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Open PO Commitments
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.openPoCount}
          </span>
          <span className="text-xs text-sky-700 font-bold">
            ₹{(kpis.openPoTotalValue / 100000).toFixed(1)}L total
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 text-[11px]">
          <span>{kpis.poPendingApprovalCount} awaiting approval</span>
          <span className="text-sky-600 font-mono font-medium">Explore List →</span>
        </div>
      </div>

      {/* 2. Supplier On-Time Delivery % */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Supplier OTD %
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.supplierOtdPct}%
          </span>
          <span className="text-xs text-slate-400 font-medium">
            target {kpis.supplierOtdTargetPct}%
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 text-[11px]">
          <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            Avg Lead: {kpis.avgSupplierLeadTimeDays}d
          </span>
          <span>across all active tiers</span>
        </div>
      </div>

      {/* 3. Critical Stockout Watch */}
      <div 
        onClick={onStockoutClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Stockout Shortages
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            {kpis.criticalStockoutsCount}
          </span>
          <span className="text-xs text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
            Zero Stock
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 text-[11px]">
          <span className="text-amber-700 font-medium">
            +{kpis.atRiskPartsCount} below safety buffer
          </span>
          <span className="text-rose-600 font-mono font-medium">Auto-Reorder →</span>
        </div>
      </div>

      {/* 4. Total Inventory Capital & Aging */}
      <div 
        onClick={onAgingClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-slate-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Inventory Capital
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
            ₹{(kpis.totalInventoryValuation / 100000).toFixed(1)}L
          </span>
          <span className="text-xs text-slate-400 font-medium">
            total stock
          </span>
        </div>
        <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-500 text-[11px]">
          <span className="font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
            ₹{(kpis.deadStockValuation / 100000).toFixed(1)}L &gt;90d
          </span>
          <span>dead capital</span>
        </div>
      </div>
    </div>
  );
};
