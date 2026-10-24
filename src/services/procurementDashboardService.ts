// src/services/procurementDashboardService.ts

import {
  ProcurementKpis,
  OpenPurchaseOrderItem,
  SupplierPerformanceItem,
  StockoutAlertItem,
  InventoryAgingSummary
} from '../types/procurementDashboard';

const PROCUREMENT_PO_WHATSAPP_LOG_KEY = 'flowops_procurement_po_whatsapp_logs';

class ProcurementDashboardService {
  /**
   * Get overarching Procurement & Supply Chain KPIs
   */
  getProcurementKpis(): ProcurementKpis {
    return {
      openPoCount: 14,
      openPoTotalValue: 6480000,
      supplierOtdPct: 91.8,
      supplierOtdTargetPct: 95.0,
      criticalStockoutsCount: 3,
      atRiskPartsCount: 5,
      totalInventoryValuation: 8850000,
      deadStockValuation: 1120000,
      avgSupplierLeadTimeDays: 8.4,
      poPendingApprovalCount: 4
    };
  }

  /**
   * Get active Open Purchase Orders
   */
  getOpenPurchaseOrders(): OpenPurchaseOrderItem[] {
    return [
      {
        id: 'po-8801',
        poNumber: 'PO-2026-0881',
        supplierId: 'sup-tata',
        supplierName: 'Tata Prime Steel Ltd.',
        supplierPhone: '+91 98230 11982',
        totalValueInr: 1250000,
        currency: 'INR',
        orderDate: '2026-10-10',
        promisedDeliveryDate: '2026-10-20',
        daysRemainingOrOverdue: -1,
        riskTag: 'critical_delayed',
        lineItemsCount: 4,
        keyItemSummary: 'Forged 8620 Alloy Steel Rounds Ø65mm (14 MT)',
        status: 'acknowledged',
        whatsappSent: true,
        linkedWorkOrders: ['WO-4410', 'WO-4412']
      },
      {
        id: 'po-8802',
        poNumber: 'PO-2026-0882',
        supplierId: 'sup-sandvik',
        supplierName: 'Sandvik Coromant Cutting Tools',
        supplierPhone: '+91 98110 54210',
        totalValueInr: 385000,
        currency: 'INR',
        orderDate: '2026-10-14',
        promisedDeliveryDate: '2026-10-22',
        daysRemainingOrOverdue: 1,
        riskTag: 'approaching_due',
        lineItemsCount: 8,
        keyItemSummary: 'Indexable Milling Inserts & Carbide End Mills',
        status: 'acknowledged',
        whatsappSent: true,
        linkedWorkOrders: ['WO-4415', 'WO-4418']
      },
      {
        id: 'po-8803',
        poNumber: 'PO-2026-0883',
        supplierId: 'sup-cast-forge',
        supplierName: 'Bharat Forge Industrial Castings',
        supplierPhone: '+91 98224 88710',
        totalValueInr: 1840000,
        currency: 'INR',
        orderDate: '2026-10-15',
        promisedDeliveryDate: '2026-10-24',
        daysRemainingOrOverdue: 3,
        riskTag: 'on_track',
        lineItemsCount: 2,
        keyItemSummary: 'Rough Turned Turbine Hub Blanks Grade Ti-6Al-4V',
        status: 'partially_received',
        whatsappSent: true,
        linkedWorkOrders: ['WO-4422']
      },
      {
        id: 'po-8804',
        poNumber: 'PO-2026-0884',
        supplierId: 'sup-fasteners',
        supplierName: 'Sundram Fasteners High-Tensile Division',
        supplierPhone: '+91 98400 33219',
        totalValueInr: 215000,
        currency: 'INR',
        orderDate: '2026-10-18',
        promisedDeliveryDate: '2026-10-26',
        daysRemainingOrOverdue: 5,
        riskTag: 'on_track',
        lineItemsCount: 6,
        keyItemSummary: 'Class 10.9 M16x75 Hex Flange Bolts & Lock Nuts',
        status: 'dispatched_to_vendor',
        whatsappSent: true,
        linkedWorkOrders: ['WO-4425', 'WO-4430']
      },
      {
        id: 'po-8805',
        poNumber: 'PO-2026-0885',
        supplierId: 'sup-lubricants',
        supplierName: 'Castrol Industrial Lubricants India',
        supplierPhone: '+91 98205 11993',
        totalValueInr: 145000,
        currency: 'INR',
        orderDate: '2026-10-19',
        promisedDeliveryDate: '2026-10-25',
        daysRemainingOrOverdue: 4,
        riskTag: 'on_track',
        lineItemsCount: 3,
        keyItemSummary: 'Hysol Semi-Synthetic CNC Coolant (4 Barrels)',
        status: 'pending_approval',
        whatsappSent: false,
        linkedWorkOrders: ['MAINT-SHOP-01']
      },
      {
        id: 'po-8806',
        poNumber: 'PO-2026-0886',
        supplierId: 'sup-indore-wire',
        supplierName: 'Central India Wire Rods & Bars',
        supplierPhone: '+91 94250 87311',
        totalValueInr: 780000,
        currency: 'INR',
        orderDate: '2026-10-08',
        promisedDeliveryDate: '2026-10-18',
        daysRemainingOrOverdue: -3,
        riskTag: 'critical_delayed',
        lineItemsCount: 1,
        keyItemSummary: 'Cold Drawn Bright Bar EN-8 Ø32mm (8 MT)',
        status: 'acknowledged',
        whatsappSent: true,
        linkedWorkOrders: ['WO-4408']
      }
    ];
  }

  /**
   * Get Supplier Performance Scorecards
   */
  getSupplierPerformance(): SupplierPerformanceItem[] {
    return [
      {
        id: 'sup-tata',
        supplierName: 'Tata Prime Steel Ltd.',
        category: 'Raw Materials & Alloy Billets',
        tier: 'tier_1',
        activePoCount: 3,
        totalSpendYtdInr: 4850000,
        otdPct: 94.2,
        qualityAcceptancePct: 98.8,
        leadTimeVarianceDays: 0.8,
        status: 'preferred',
        riskScore: 'low',
        primaryContact: 'Rajesh Kulkarni',
        phone: '+91 98230 11982'
      },
      {
        id: 'sup-sandvik',
        supplierName: 'Sandvik Coromant Cutting Tools',
        category: 'CNC Tooling & Inserts',
        tier: 'tier_1',
        activePoCount: 2,
        totalSpendYtdInr: 1620000,
        otdPct: 97.5,
        qualityAcceptancePct: 99.7,
        leadTimeVarianceDays: 0.2,
        status: 'preferred',
        riskScore: 'low',
        primaryContact: 'Amitabh Sengupta',
        phone: '+91 98110 54210'
      },
      {
        id: 'sup-cast-forge',
        supplierName: 'Bharat Forge Industrial Castings',
        category: 'Forgings & Castings',
        tier: 'tier_1',
        activePoCount: 2,
        totalSpendYtdInr: 3200000,
        otdPct: 88.5,
        qualityAcceptancePct: 96.2,
        leadTimeVarianceDays: 2.4,
        status: 'approved',
        riskScore: 'moderate',
        primaryContact: 'Sanjay Deshpande',
        phone: '+91 98224 88710'
      },
      {
        id: 'sup-fasteners',
        supplierName: 'Sundram Fasteners High-Tensile',
        category: 'Fasteners & Hardware',
        tier: 'tier_2',
        activePoCount: 2,
        totalSpendYtdInr: 890000,
        otdPct: 96.0,
        qualityAcceptancePct: 99.4,
        leadTimeVarianceDays: 0.4,
        status: 'preferred',
        riskScore: 'low',
        primaryContact: 'M. Sridhar',
        phone: '+91 98400 33219'
      },
      {
        id: 'sup-indore-wire',
        supplierName: 'Central India Wire Rods & Bars',
        category: 'Bright Bars & Rods',
        tier: 'tier_3',
        activePoCount: 1,
        totalSpendYtdInr: 1450000,
        otdPct: 76.4,
        qualityAcceptancePct: 92.1,
        leadTimeVarianceDays: 4.8,
        status: 'on_probation',
        riskScore: 'high',
        primaryContact: 'Dinesh Agrawal',
        phone: '+91 94250 87311'
      }
    ];
  }

  /**
   * Get Stockout Alert Items
   */
  getStockoutAlerts(): StockoutAlertItem[] {
    return [
      {
        id: 'stk-01',
        sku: 'MAT-STL-8620-65',
        name: 'Forged 8620 Alloy Steel Rounds Ø65mm',
        category: 'Raw Material Bars',
        currentStock: 0,
        uom: 'MT',
        safetyStock: 3.5,
        reorderLevel: 5.0,
        dailyBurnRate: 1.2,
        daysCoverageRemaining: 0.0,
        stockoutSeverity: 'out_of_stock',
        activeImpactedJobs: ['WO-4410 (Camshaft Batch)', 'WO-4412 (Gear Hubs)'],
        preferredSupplierName: 'Tata Prime Steel Ltd.',
        supplierPhone: '+91 98230 11982',
        unitPriceEstimateInr: 88000,
        suggestedReorderQty: 8.0
      },
      {
        id: 'stk-02',
        sku: 'TOOL-INS-CNMG12',
        name: 'Carbide Turning Inserts CNMG 120408-PM',
        category: 'Cutting Tools',
        currentStock: 4,
        uom: 'pcs',
        safetyStock: 25,
        reorderLevel: 40,
        dailyBurnRate: 6.0,
        daysCoverageRemaining: 0.6,
        stockoutSeverity: 'critical_buffer',
        activeImpactedJobs: ['WO-4415 (Rough Lathe)', 'WO-4418 (Bore Finish)'],
        preferredSupplierName: 'Sandvik Coromant',
        supplierPhone: '+91 98110 54210',
        unitPriceEstimateInr: 420,
        suggestedReorderQty: 100
      },
      {
        id: 'stk-03',
        sku: 'CHEM-COOL-HY50',
        name: 'Hysol Semi-Synthetic CNC Coolant Concentrate',
        category: 'Consumables',
        currentStock: 1,
        uom: 'Barrels (200L)',
        safetyStock: 2,
        reorderLevel: 4,
        dailyBurnRate: 0.4,
        daysCoverageRemaining: 2.5,
        stockoutSeverity: 'low_warning',
        activeImpactedJobs: ['Shopfloor CNC Central Sump #1 & #2'],
        preferredSupplierName: 'Castrol Industrial Lubricants',
        supplierPhone: '+91 98205 11993',
        unitPriceEstimateInr: 36000,
        suggestedReorderQty: 4
      },
      {
        id: 'stk-04',
        sku: 'FAST-BOLT-M16',
        name: 'High Tensile Hex Flange Bolt Grade 10.9 M16x75',
        category: 'Hardware',
        currentStock: 45,
        uom: 'pcs',
        safetyStock: 200,
        reorderLevel: 350,
        dailyBurnRate: 30,
        daysCoverageRemaining: 1.5,
        stockoutSeverity: 'critical_buffer',
        activeImpactedJobs: ['WO-4425 (Flange Assembly)', 'WO-4430 (Sub-assembly)'],
        preferredSupplierName: 'Sundram Fasteners',
        supplierPhone: '+91 98400 33219',
        unitPriceEstimateInr: 45,
        suggestedReorderQty: 500
      }
    ];
  }

  /**
   * Get Inventory Aging Summary & Capital Breakdown
   */
  getInventoryAgingSummary(): InventoryAgingSummary {
    const buckets = [
      {
        bucketKey: '0_30' as const,
        label: '0 - 30 Days (Active Flow)',
        itemCount: 142,
        capitalValueInr: 4850000,
        percentageOfTotal: 54.8,
        riskDescription: 'High turnover fast-moving materials aligned with committed sales orders.',
        liquidationAction: 'Maintain steady JIT re-order cadence.'
      },
      {
        bucketKey: '31_60' as const,
        label: '31 - 60 Days (Normal Buffer)',
        itemCount: 68,
        capitalValueInr: 1980000,
        percentageOfTotal: 22.4,
        riskDescription: 'Standard safety stock buffers for alloy bars and critical machine consumables.',
        liquidationAction: 'Review re-order points against revised Q4 monthly production targets.'
      },
      {
        bucketKey: '61_90' as const,
        label: '61 - 90 Days (Slow-Moving Risk)',
        itemCount: 24,
        capitalValueInr: 900000,
        percentageOfTotal: 10.2,
        riskDescription: 'Over-purchased batch lots from discontinued customer RFQs or cancelled export runs.',
        liquidationAction: 'Substitute in upcoming job work orders or bundle with standard sizes.'
      },
      {
        bucketKey: '90_plus' as const,
        label: '90+ Days (Dead / Dormant Stock)',
        itemCount: 18,
        capitalValueInr: 1120000,
        percentageOfTotal: 12.6,
        riskDescription: 'Obsolete special grade titanium off-cuts and legacy metric fastener bins incurring holding costs.',
        liquidationAction: 'Issue scrap auction notice or scrap melt return with vendor credit note.'
      }
    ];

    const totalHoldingCapital = buckets.reduce((sum, b) => sum + b.capitalValueInr, 0);
    const excessAtRisk = buckets.filter(b => b.bucketKey === '61_90' || b.bucketKey === '90_plus')
      .reduce((sum, b) => sum + b.capitalValueInr, 0);

    return {
      buckets,
      totalHoldingCapitalInr: totalHoldingCapital,
      excessCapitalAtRiskInr: excessAtRisk,
      carryingCostMonthlyInr: Math.round(totalHoldingCapital * 0.015) // ~1.5% monthly carrying cost
    };
  }

  /**
   * Expedite Supplier via WhatsApp
   */
  expediteSupplierViaWhatsApp(poId: string, supplierPhone: string): { success: boolean; message: string; timestamp: string } {
    const po = this.getOpenPurchaseOrders().find(p => p.id === poId);
    const timestamp = new Date().toISOString();

    const saved = localStorage.getItem(PROCUREMENT_PO_WHATSAPP_LOG_KEY);
    const logs = saved ? JSON.parse(saved) : [];
    logs.push({
      poId,
      poNumber: po?.poNumber,
      supplierName: po?.supplierName,
      supplierPhone,
      timestamp
    });
    localStorage.setItem(PROCUREMENT_PO_WHATSAPP_LOG_KEY, JSON.stringify(logs));

    return {
      success: true,
      message: `WhatsApp Expedite dispatch sent to ${po?.supplierName || 'Supplier'} (${supplierPhone}) for ${po?.poNumber}. Transporter dispatch confirmation requested.`,
      timestamp
    };
  }

  /**
   * Trigger Stockout Auto-Reorder PO / RFQ
   */
  triggerStockoutReorder(sku: string, supplierName: string, suggestedQty: number, uom: string): { success: boolean; message: string; poDraftNumber: string } {
    const poDraftNumber = `PO-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      message: `Re-order PO Draft ${poDraftNumber} initialized for ${suggestedQty} ${uom} to ${supplierName}. Notification sent to Procurement Desk.`,
      poDraftNumber
    };
  }
}

export const procurementDashboardService = new ProcurementDashboardService();
