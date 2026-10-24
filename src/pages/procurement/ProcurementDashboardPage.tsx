// src/pages/procurement/ProcurementDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurementDashboardService } from '../../services/procurementDashboardService';
import { 
  ProcurementKpis, 
  OpenPurchaseOrderItem, 
  SupplierPerformanceItem, 
  StockoutAlertItem, 
  InventoryAgingSummary 
} from '../../types/procurementDashboard';
import { ProcurementKpiGrid } from '../../components/procurement-dashboard/ProcurementKpiGrid';
import { OpenPoListSection } from '../../components/procurement-dashboard/OpenPoListSection';
import { SupplierPerformanceSection } from '../../components/procurement-dashboard/SupplierPerformanceSection';
import { StockoutAlertsSection } from '../../components/procurement-dashboard/StockoutAlertsSection';
import { InventoryAgingSection } from '../../components/procurement-dashboard/InventoryAgingSection';
import { useToast } from '../../context/ToastContext';
import { 
  ShoppingBag, 
  RefreshCw, 
  Download, 
  Truck, 
  AlertTriangle, 
  ArrowLeft, 
  Package, 
  Send,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const ProcurementDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toastSuccess, toastInfo } = useToast();

  const [kpis, setKpis] = useState<ProcurementKpis>(procurementDashboardService.getProcurementKpis());
  const [openPos, setOpenPos] = useState<OpenPurchaseOrderItem[]>(procurementDashboardService.getOpenPurchaseOrders());
  const [suppliers, setSuppliers] = useState<SupplierPerformanceItem[]>(procurementDashboardService.getSupplierPerformance());
  const [stockouts, setStockouts] = useState<StockoutAlertItem[]>(procurementDashboardService.getStockoutAlerts());
  const [agingSummary, setAgingSummary] = useState<InventoryAgingSummary>(procurementDashboardService.getInventoryAgingSummary());

  const [activeTab, setActiveTab] = useState<'all' | 'pos' | 'suppliers' | 'stockouts' | 'aging'>('all');

  const handleRefresh = () => {
    setKpis(procurementDashboardService.getProcurementKpis());
    setOpenPos(procurementDashboardService.getOpenPurchaseOrders());
    setSuppliers(procurementDashboardService.getSupplierPerformance());
    setStockouts(procurementDashboardService.getStockoutAlerts());
    setAgingSummary(procurementDashboardService.getInventoryAgingSummary());
    toastInfo('Supply chain telemetry refreshed from ERP & vendor records.');
  };

  const handleExpediteWhatsApp = (poId: string, phone: string) => {
    const res = procurementDashboardService.expediteSupplierViaWhatsApp(poId, phone);
    if (res.success) {
      toastSuccess(res.message);
    }
  };

  const handleTriggerReorder = (item: StockoutAlertItem) => {
    const res = procurementDashboardService.triggerStockoutReorder(
      item.sku,
      item.preferredSupplierName,
      item.suggestedReorderQty,
      item.uom
    );
    if (res.success) {
      toastSuccess(res.message);
    }
  };

  const handleSendWhatsappRfq = (item: StockoutAlertItem) => {
    toastSuccess(`WhatsApp RFQ Broadcast sent to ${item.preferredSupplierName} (${item.supplierPhone}) for ${item.suggestedReorderQty} ${item.uom} of ${item.name}.`);
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Ashrey FlowOps - Procurement & Supply Chain Dashboard Report'],
      ['Generated On', new Date().toISOString()],
      [''],
      ['KPI Metric', 'Value', 'Status / Benchmark'],
      ['Open Purchase Orders Count', kpis.openPoCount, 'Committed Pipeline'],
      ['Open PO Total Capital (INR)', `₹${kpis.openPoTotalValue}`, 'Working Capital In-transit'],
      ['Supplier On-Time Delivery (OTD %)', `${kpis.supplierOtdPct}%`, `Target ${kpis.supplierOtdTargetPct}%`],
      ['Critical Zero Stock Shortages', kpis.criticalStockoutsCount, 'Immediate Shopfloor Risk'],
      ['Below Safety Buffer SKUs', kpis.atRiskPartsCount, 'Buffer Depleted'],
      ['Total Stock Inventory Valuation', `₹${kpis.totalInventoryValuation}`, 'Current Warehouse Holding'],
      ['Dead Stock Capital (>90 Days)', `₹${kpis.deadStockValuation}`, 'Liquidation Recommended'],
      ['Average Supplier Lead Time', `${kpis.avgSupplierLeadTimeDays} Days`, 'All Vendor Average']
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FlowOps_Procurement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Procurement risk report downloaded successfully.');
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="procurement-dashboard-root">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-sky-600 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Operations Cockpit</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Supply Chain Intelligence</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                Procurement Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Supply chain risk command center managing Open Purchase Orders, Supplier On-Time Delivery %, Critical Stockouts, and Inventory Aging capital.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs w-full sm:w-fit font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unified View
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-white text-sky-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Open Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab('stockouts')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'stockouts'
              ? 'bg-white text-rose-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stockout Alerts
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-white text-emerald-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Supplier Scorecards
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'aging'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Inventory Aging Report
        </button>
      </div>

      {/* 1. Procurement KPI Grid */}
      <ProcurementKpiGrid
        kpis={kpis}
        onOpenPoClick={() => setActiveTab('pos')}
        onStockoutClick={() => setActiveTab('stockouts')}
        onAgingClick={() => setActiveTab('aging')}
      />

      {/* 2. Stockout Alerts (High-priority callout) */}
      {(activeTab === 'all' || activeTab === 'stockouts') && (
        <StockoutAlertsSection
          alerts={stockouts}
          onTriggerReorder={handleTriggerReorder}
          onSendWhatsappRfq={handleSendWhatsappRfq}
        />
      )}

      {/* 3. Open PO List */}
      {(activeTab === 'all' || activeTab === 'pos') && (
        <OpenPoListSection
          poList={openPos}
          onExpediteWhatsApp={handleExpediteWhatsApp}
        />
      )}

      {/* 4. Supplier Performance Scorecards */}
      {(activeTab === 'all' || activeTab === 'suppliers') && (
        <SupplierPerformanceSection suppliers={suppliers} />
      )}

      {/* 5. Inventory Aging Report */}
      {(activeTab === 'all' || activeTab === 'aging') && (
        <InventoryAgingSection agingSummary={agingSummary} />
      )}

      {/* Footer Navigation Shortcuts */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-sky-600" />
          <span>Synchronized with Supplier WhatsApp RFQ/PO, MRP Engine, and Warehouse Stock Inventory.</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/procurement/whatsapp-rfq-po')}
            className="text-sky-600 font-semibold hover:underline cursor-pointer"
          >
            WhatsApp RFQ & PO Desk →
          </button>
          <button 
            onClick={() => navigate('/mrp')}
            className="text-sky-600 font-semibold hover:underline cursor-pointer"
          >
            Automated MRP Engine →
          </button>
        </div>
      </div>
    </div>
  );
};
