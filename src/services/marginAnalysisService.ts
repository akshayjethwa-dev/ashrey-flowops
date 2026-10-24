// src/services/marginAnalysisService.ts

import { costRollupService } from './costRollupService';
import { scrapReworkService } from './scrapReworkService';
import { WorkOrderCostRollup } from '../types/costRollup';
import {
  TimePeriodOption,
  MarginHealthStatus,
  ProductMarginSummary,
  CustomerMarginSummary,
  OrderMarginSummary,
  PeriodPnLRecord,
  LivePnLSummary,
  TopBottomPerformers,
  MarginFilterParams
} from '../types/marginAnalysis';

// ── Historical Order Dataset for Multi-Period Live P&L Trends ────────
interface HistoricalOrderRecord {
  workOrderId: string;
  workOrderNumber: string;
  salesOrderNumber: string;
  quoteNumber: string;
  customerPoNumber: string;
  customerName: string;
  customerTier: 'Key Account' | 'Tier 1 Strategic' | 'Standard Commercial' | 'Contract Spot';
  partCode: string;
  partName: string;
  category: string;
  quantity: number;
  contractPricePerUnit: number;
  materialCost: number;
  laborCost: number;
  machineCost: number;
  subcontractCost: number;
  overheadCost: number;
  scrapCost: number;
  reworkCost: number;
  quotedMarginPct: number;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'in_progress' | 'dispatched';
}

const HISTORICAL_ORDERS: HistoricalOrderRecord[] = [
  // Current Month (October 2026)
  {
    workOrderId: 'wo_hist_101',
    workOrderNumber: 'WO-2026-0041',
    salesOrderNumber: 'SO-2026-0098',
    quoteNumber: 'Q-9188',
    customerPoNumber: 'PO-BH-4491',
    customerName: 'Bharat Forge Precision Cell',
    customerTier: 'Key Account',
    partCode: 'SH-CR65',
    partName: 'Steering Knuckle Shaft 4140 CrMo',
    category: 'Automotive Powertrain',
    quantity: 180,
    contractPricePerUnit: 3200,
    materialCost: 216000,
    laborCost: 68400,
    machineCost: 75600,
    subcontractCost: 18000,
    overheadCost: 59400,
    scrapCost: 7800,
    reworkCost: 3200,
    quotedMarginPct: 28.5,
    date: '2026-10-12',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_102',
    workOrderNumber: 'WO-2026-0042',
    salesOrderNumber: 'SO-2026-0104',
    quoteNumber: 'Q-9195',
    customerPoNumber: 'PO-MAH-3382',
    customerName: 'Mahindra Defense Aerospace',
    customerTier: 'Tier 1 Strategic',
    partCode: 'BRG-HSG-88',
    partName: 'Titanium Grade 5 Avionics Bearing Cage',
    category: 'Aerospace & Defense',
    quantity: 60,
    contractPricePerUnit: 9800,
    materialCost: 245000,
    laborCost: 62000,
    machineCost: 88000,
    subcontractCost: 31000,
    overheadCost: 64000,
    scrapCost: 14500,
    reworkCost: 6800,
    quotedMarginPct: 32.0,
    date: '2026-10-09',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_103',
    workOrderNumber: 'WO-2026-0043',
    salesOrderNumber: 'SO-2026-0109',
    quoteNumber: 'Q-9201',
    customerPoNumber: 'PO-KIR-1120',
    customerName: 'Kirloskar Oil Engines',
    customerTier: 'Standard Commercial',
    partCode: 'CYL-LIN-95',
    partName: 'Cast Iron Cylinder Liner Ø95mm Honed',
    category: 'Heavy Industrial',
    quantity: 320,
    contractPricePerUnit: 1850,
    materialCost: 268000,
    laborCost: 72000,
    machineCost: 89000,
    subcontractCost: 12000,
    overheadCost: 68000,
    scrapCost: 18200,
    reworkCost: 4500,
    quotedMarginPct: 22.0,
    date: '2026-10-05',
    status: 'completed'
  },
  // September 2026
  {
    workOrderId: 'wo_hist_091',
    workOrderNumber: 'WO-2026-0035',
    salesOrderNumber: 'SO-2026-0081',
    quoteNumber: 'Q-9140',
    customerPoNumber: 'PO-TAT-8290',
    customerName: 'Tata Motors Powertrain Div',
    customerTier: 'Key Account',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    category: 'Automotive Powertrain',
    quantity: 300,
    contractPricePerUnit: 2450,
    materialCost: 285000,
    laborCost: 81000,
    machineCost: 96000,
    subcontractCost: 21000,
    overheadCost: 77000,
    scrapCost: 9200,
    reworkCost: 3800,
    quotedMarginPct: 26.0,
    date: '2026-09-26',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_092',
    workOrderNumber: 'WO-2026-0036',
    salesOrderNumber: 'SO-2026-0085',
    quoteNumber: 'Q-9152',
    customerPoNumber: 'PO-LT-7199',
    customerName: 'Larsen & Toubro Heavy Engineering',
    customerTier: 'Key Account',
    partCode: 'FL-DN80',
    partName: 'Flange Adapter — DN80 PN40 High-Pressure Blind Flange',
    category: 'Pressure Vessels & Oil & Gas',
    quantity: 200,
    contractPricePerUnit: 3850,
    materialCost: 348000,
    laborCost: 96000,
    machineCost: 118000,
    subcontractCost: 28000,
    overheadCost: 92000,
    scrapCost: 34000,
    reworkCost: 12000,
    quotedMarginPct: 24.5,
    date: '2026-09-18',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_093',
    workOrderNumber: 'WO-2026-0037',
    salesOrderNumber: 'SO-2026-0089',
    quoteNumber: 'Q-9160',
    customerPoNumber: 'PO-BOS-5512',
    customerName: 'Bosch Automotive Aftermarket',
    customerTier: 'Tier 1 Strategic',
    partCode: 'VLV-SP-12',
    partName: 'High-Precision Hydraulic Spool Valve Ø12mm',
    category: 'Hydraulics & Fluid Power',
    quantity: 450,
    contractPricePerUnit: 1450,
    materialCost: 210000,
    laborCost: 78000,
    machineCost: 92000,
    subcontractCost: 15000,
    overheadCost: 72000,
    scrapCost: 11000,
    reworkCost: 4200,
    quotedMarginPct: 30.0,
    date: '2026-09-10',
    status: 'completed'
  },
  // August 2026
  {
    workOrderId: 'wo_hist_081',
    workOrderNumber: 'WO-2026-0028',
    salesOrderNumber: 'SO-2026-0065',
    quoteNumber: 'Q-9110',
    customerPoNumber: 'PO-BH-3920',
    customerName: 'Bharat Forge Precision Cell',
    customerTier: 'Key Account',
    partCode: 'SH-CR65',
    partName: 'Steering Knuckle Shaft 4140 CrMo',
    category: 'Automotive Powertrain',
    quantity: 220,
    contractPricePerUnit: 3200,
    materialCost: 260000,
    laborCost: 82000,
    machineCost: 91000,
    subcontractCost: 22000,
    overheadCost: 71000,
    scrapCost: 8500,
    reworkCost: 2900,
    quotedMarginPct: 28.5,
    date: '2026-08-22',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_082',
    workOrderNumber: 'WO-2026-0029',
    salesOrderNumber: 'SO-2026-0070',
    quoteNumber: 'Q-9125',
    customerPoNumber: 'PO-DAN-9011',
    customerName: 'Danfoss Power Solutions',
    customerTier: 'Standard Commercial',
    partCode: 'MAN-AL60',
    partName: 'Pneumatic 5-Port Manifold Block Al6061-T6',
    category: 'Pneumatics & Automation',
    quantity: 120,
    contractPricePerUnit: 2900,
    materialCost: 135000,
    laborCost: 48000,
    machineCost: 56000,
    subcontractCost: 8000,
    overheadCost: 42000,
    scrapCost: 5500,
    reworkCost: 1800,
    quotedMarginPct: 25.0,
    date: '2026-08-14',
    status: 'completed'
  },
  // July 2026
  {
    workOrderId: 'wo_hist_071',
    workOrderNumber: 'WO-2026-0020',
    salesOrderNumber: 'SO-2026-0048',
    quoteNumber: 'Q-9080',
    customerPoNumber: 'PO-TAT-7811',
    customerName: 'Tata Motors Powertrain Div',
    customerTier: 'Key Account',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    category: 'Automotive Powertrain',
    quantity: 280,
    contractPricePerUnit: 2450,
    materialCost: 266000,
    laborCost: 76000,
    machineCost: 90000,
    subcontractCost: 20000,
    overheadCost: 72000,
    scrapCost: 7600,
    reworkCost: 3100,
    quotedMarginPct: 26.0,
    date: '2026-07-28',
    status: 'completed'
  },
  {
    workOrderId: 'wo_hist_072',
    workOrderNumber: 'WO-2026-0021',
    salesOrderNumber: 'SO-2026-0052',
    quoteNumber: 'Q-9092',
    customerPoNumber: 'PO-MAH-2890',
    customerName: 'Mahindra Defense Aerospace',
    customerTier: 'Tier 1 Strategic',
    partCode: 'BRG-HSG-88',
    partName: 'Titanium Grade 5 Avionics Bearing Cage',
    category: 'Aerospace & Defense',
    quantity: 50,
    contractPricePerUnit: 9800,
    materialCost: 202000,
    laborCost: 51000,
    machineCost: 72000,
    subcontractCost: 25000,
    overheadCost: 52000,
    scrapCost: 12000,
    reworkCost: 5000,
    quotedMarginPct: 32.0,
    date: '2026-07-15',
    status: 'completed'
  },
  // June 2026
  {
    workOrderId: 'wo_hist_061',
    workOrderNumber: 'WO-2026-0012',
    salesOrderNumber: 'SO-2026-0030',
    quoteNumber: 'Q-9035',
    customerPoNumber: 'PO-LT-6410',
    customerName: 'Larsen & Toubro Heavy Engineering',
    customerTier: 'Key Account',
    partCode: 'FL-DN80',
    partName: 'Flange Adapter — DN80 PN40 High-Pressure Blind Flange',
    category: 'Pressure Vessels & Oil & Gas',
    quantity: 160,
    contractPricePerUnit: 3850,
    materialCost: 275000,
    laborCost: 78000,
    machineCost: 94000,
    subcontractCost: 22000,
    overheadCost: 73000,
    scrapCost: 29000,
    reworkCost: 9500,
    quotedMarginPct: 24.5,
    date: '2026-06-20',
    status: 'completed'
  },
  // May 2026
  {
    workOrderId: 'wo_hist_051',
    workOrderNumber: 'WO-2026-0005',
    salesOrderNumber: 'SO-2026-0015',
    quoteNumber: 'Q-9008',
    customerPoNumber: 'PO-BOS-4902',
    customerName: 'Bosch Automotive Aftermarket',
    customerTier: 'Tier 1 Strategic',
    partCode: 'VLV-SP-12',
    partName: 'High-Precision Hydraulic Spool Valve Ø12mm',
    category: 'Hydraulics & Fluid Power',
    quantity: 400,
    contractPricePerUnit: 1450,
    materialCost: 185000,
    laborCost: 69000,
    machineCost: 82000,
    subcontractCost: 13000,
    overheadCost: 64000,
    scrapCost: 9500,
    reworkCost: 3500,
    quotedMarginPct: 30.0,
    date: '2026-05-18',
    status: 'completed'
  }
];

class MarginAnalysisService {
  // ── Retrieve Unified Orders (Active Rollups + Historical Datasets) ──
  getUnifiedOrders(): OrderMarginSummary[] {
    const activeRollups = costRollupService.getAllWorkOrderCostRollups();
    const scrapRecords = scrapReworkService.getScrapRecords();
    const reworkRecords = scrapReworkService.getReworkRecords();

    // Map active rollups into OrderMarginSummary
    const activeSummaries: OrderMarginSummary[] = activeRollups.map(r => {
      // Find associated scrap and rework costs
      const orderScrap = scrapRecords
        .filter(s => s.workOrderId === r.workOrderId || s.workOrderNumber === r.workOrderNumber)
        .reduce((sum, s) => sum + s.netScrapCost, 0);

      const orderRework = reworkRecords
        .filter(rw => rw.workOrderId === r.workOrderId || rw.workOrderNumber === r.workOrderNumber)
        .reduce((sum, rw) => sum + rw.totalReworkCost, 0);

      // Quoted standard margin vs actual
      const quotedMargin = r.standardGrossMarginPercent || 25.0;
      const actualMargin = r.actualGrossMarginPercent;
      const marginDilution = Number((quotedMargin - actualMargin).toFixed(1));

      let health: MarginHealthStatus = 'healthy';
      if (actualMargin >= 25.0) health = 'high_margin';
      else if (actualMargin >= 15.0) health = 'healthy';
      else if (actualMargin >= 0.0) health = 'at_risk';
      else health = 'loss_making';

      return {
        workOrderId: r.workOrderId,
        workOrderNumber: r.workOrderNumber,
        salesOrderNumber: r.salesOrderNumber || `SO-2026-00${r.workOrderNumber.slice(-2)}`,
        quoteNumber: r.quoteNumber || `Q-90${r.workOrderNumber.slice(-2)}`,
        customerPoNumber: r.customerPoNumber || `PO-CUST-${r.workOrderNumber.slice(-4)}`,
        customerName: r.customerName || 'Standard Client',
        partCode: r.partCode,
        partName: r.partName,
        quantity: r.quantity,
        quantityCompleted: r.quantityCompleted,
        contractPricePerUnit: r.contractPricePerUnit || 2500,
        totalRevenue: r.totalRevenue,
        standardTotalCost: r.standardTotalCost,
        actualTotalCost: r.actualTotalCost,
        standardGrossProfit: r.standardGrossProfit,
        grossProfit: r.actualGrossProfit,
        standardGrossMarginPercent: quotedMargin,
        actualGrossMarginPercent: actualMargin,
        marginDilutionPercent: marginDilution,
        health,
        status: r.orderStatus,
        dueDate: r.dueDate || new Date().toISOString().slice(0, 10),
        materialCost: r.actualMaterialCost,
        laborCost: r.actualLaborCost,
        machineCost: r.actualMachineCost,
        subcontractCost: r.actualSubcontractCost,
        overheadCost: r.totalOverheadCost,
        scrapCost: orderScrap,
        reworkCost: orderRework
      };
    });

    // Map historical records
    const historicalSummaries: OrderMarginSummary[] = HISTORICAL_ORDERS.map(h => {
      const totalRevenue = h.quantity * h.contractPricePerUnit;
      const actualTotalCost = h.materialCost + h.laborCost + h.machineCost + h.subcontractCost + h.overheadCost;
      const grossProfit = totalRevenue - actualTotalCost;
      const actualGrossMarginPercent = Number(((grossProfit / totalRevenue) * 100).toFixed(1));
      const marginDilution = Number((h.quotedMarginPct - actualGrossMarginPercent).toFixed(1));

      let health: MarginHealthStatus = 'healthy';
      if (actualGrossMarginPercent >= 25.0) health = 'high_margin';
      else if (actualGrossMarginPercent >= 15.0) health = 'healthy';
      else if (actualGrossMarginPercent >= 0.0) health = 'at_risk';
      else health = 'loss_making';

      return {
        workOrderId: h.workOrderId,
        workOrderNumber: h.workOrderNumber,
        salesOrderNumber: h.salesOrderNumber,
        quoteNumber: h.quoteNumber,
        customerPoNumber: h.customerPoNumber,
        customerName: h.customerName,
        partCode: h.partCode,
        partName: h.partName,
        quantity: h.quantity,
        quantityCompleted: h.quantity,
        contractPricePerUnit: h.contractPricePerUnit,
        totalRevenue,
        standardTotalCost: Math.round(totalRevenue * (1 - h.quotedMarginPct / 100)),
        actualTotalCost,
        standardGrossProfit: Math.round(totalRevenue * (h.quotedMarginPct / 100)),
        grossProfit,
        standardGrossMarginPercent: h.quotedMarginPct,
        actualGrossMarginPercent,
        marginDilutionPercent: marginDilution,
        health,
        status: h.status,
        dueDate: h.date,
        completedAt: `${h.date}T16:30:00Z`,
        materialCost: h.materialCost,
        laborCost: h.laborCost,
        machineCost: h.machineCost,
        subcontractCost: h.subcontractCost,
        overheadCost: h.overheadCost,
        scrapCost: h.scrapCost,
        reworkCost: h.reworkCost
      };
    });

    return [...activeSummaries, ...historicalSummaries];
  }

  // ── Filter Orders by Time Period and Attributes ──────────────────
  getFilteredOrders(filters: MarginFilterParams): OrderMarginSummary[] {
    const all = this.getUnifiedOrders();
    const now = new Date('2026-10-14T10:00:00Z'); // anchor time

    return all.filter(o => {
      // Time Period Filter
      if (filters.timePeriod !== 'all_time') {
        const orderDate = new Date(o.dueDate);
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);

        if (filters.timePeriod === 'today') {
          if (diffDays > 1 || diffDays < -1) return false;
        } else if (filters.timePeriod === 'last_7_days') {
          if (diffDays > 7 || diffDays < -7) return false;
        } else if (filters.timePeriod === 'mtd') {
          // Current month is October 2026
          if (orderDate.getFullYear() !== 2026 || orderDate.getMonth() !== 9) return false;
        } else if (filters.timePeriod === 'qtd') {
          // Q4 2026 (Oct, Nov, Dec)
          if (orderDate.getFullYear() !== 2026 || orderDate.getMonth() < 9) return false;
        } else if (filters.timePeriod === 'ytd') {
          // Year 2026
          if (orderDate.getFullYear() !== 2026) return false;
        }
      }

      // Customer Filter
      if (filters.customer && filters.customer !== 'all') {
        if (o.customerName !== filters.customer) return false;
      }

      // Product Filter
      if (filters.product && filters.product !== 'all') {
        if (o.partCode !== filters.product && o.partName !== filters.product) return false;
      }

      // Health Filter
      if (filters.health && filters.health !== 'all') {
        if (o.health !== filters.health) return false;
      }

      // Search Query
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const match =
          o.workOrderNumber.toLowerCase().includes(q) ||
          o.salesOrderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.partCode.toLowerCase().includes(q) ||
          o.partName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  // ── Live P&L Executive Summary ──────────────────────────────────
  getLivePnLSummary(filters: MarginFilterParams): LivePnLSummary {
    const orders = this.getFilteredOrders(filters);

    let totalRevenue = 0;
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalMachineCost = 0;
    let totalSubcontractCost = 0;
    let totalFactoryOverheadCost = 0;
    let totalCopqLosses = 0;
    let totalUnitsProduced = 0;

    let highMarginCount = 0;
    let healthyCount = 0;
    let atRiskCount = 0;
    let lossMakingCount = 0;

    orders.forEach(o => {
      totalRevenue += o.totalRevenue;
      totalMaterialCost += o.materialCost;
      totalLaborCost += o.laborCost;
      totalMachineCost += o.machineCost;
      totalSubcontractCost += o.subcontractCost;
      totalFactoryOverheadCost += o.overheadCost;
      totalCopqLosses += (o.scrapCost + o.reworkCost);
      totalUnitsProduced += o.quantity;

      if (o.health === 'high_margin') highMarginCount++;
      else if (o.health === 'healthy') healthyCount++;
      else if (o.health === 'at_risk') atRiskCount++;
      else if (o.health === 'loss_making') lossMakingCount++;
    });

    // SG&A estimate (7% of manufacturing subtotal)
    const mfgSubtotal = totalMaterialCost + totalLaborCost + totalMachineCost + totalSubcontractCost + totalFactoryOverheadCost;
    const totalSgaCost = Math.round(mfgSubtotal * 0.07);
    const totalCogs = mfgSubtotal + totalSgaCost;

    const grossProfitBeforeCopq = totalRevenue - totalCogs;
    const manufacturingGrossMarginPct = totalRevenue > 0
      ? Number(((grossProfitBeforeCopq / totalRevenue) * 100).toFixed(1))
      : 0;

    const netRealizedProfit = grossProfitBeforeCopq - totalCopqLosses;
    const netRealizedMarginPct = totalRevenue > 0
      ? Number(((netRealizedProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    const targetMarginPct = filters.targetMarginPct || 25.0;
    const marginSpreadPct = Number((netRealizedMarginPct - targetMarginPct).toFixed(1));

    return {
      totalRevenue,
      totalMaterialCost,
      totalLaborCost,
      totalMachineCost,
      totalSubcontractCost,
      totalFactoryOverheadCost,
      totalSgaCost,
      totalCogs,
      grossProfitBeforeCopq,
      manufacturingGrossMarginPct,
      totalCopqLosses,
      netRealizedProfit,
      netRealizedMarginPct,
      targetMarginPct,
      marginSpreadPct,
      totalOrdersCount: orders.length,
      totalUnitsProduced,
      highMarginCount,
      healthyCount,
      atRiskCount,
      lossMakingCount
    };
  }

  // ── Product Margin Summaries ────────────────────────────────────
  getProductMargins(filters: MarginFilterParams): ProductMarginSummary[] {
    const orders = this.getFilteredOrders(filters);
    const productMap = new Map<string, {
      partCode: string;
      partName: string;
      category: string;
      unitsCount: number;
      totalRevenue: number;
      totalCost: number;
      grossProfit: number;
      quotedProfit: number;
      materialCost: number;
      laborCost: number;
      machineCost: number;
      subcontractCost: number;
      overheadCost: number;
      copqCost: number;
      orderCount: number;
      customerTally: Record<string, number>;
    }>();

    orders.forEach(o => {
      const key = o.partCode;
      if (!productMap.has(key)) {
        let category = 'Precision Machined';
        if (key.startsWith('GB')) category = 'Automotive Powertrain';
        else if (key.startsWith('FL')) category = 'Pressure Vessels & Flanges';
        else if (key.startsWith('SH')) category = 'Heavy Automotive Shafts';
        else if (key.startsWith('BRG')) category = 'Aerospace & Defense';
        else if (key.startsWith('CYL')) category = 'Heavy Industrial Castings';
        else if (key.startsWith('VLV')) category = 'Hydraulics & Fluid Power';
        else if (key.startsWith('MAN')) category = 'Pneumatics & Automation';

        productMap.set(key, {
          partCode: o.partCode,
          partName: o.partName,
          category,
          unitsCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          quotedProfit: 0,
          materialCost: 0,
          laborCost: 0,
          machineCost: 0,
          subcontractCost: 0,
          overheadCost: 0,
          copqCost: 0,
          orderCount: 0,
          customerTally: {}
        });
      }

      const p = productMap.get(key)!;
      p.unitsCount += o.quantity;
      p.totalRevenue += o.totalRevenue;
      p.totalCost += o.actualTotalCost;
      p.grossProfit += o.grossProfit;
      p.quotedProfit += o.standardGrossProfit;
      p.materialCost += o.materialCost;
      p.laborCost += o.laborCost;
      p.machineCost += o.machineCost;
      p.subcontractCost += o.subcontractCost;
      p.overheadCost += o.overheadCost;
      p.copqCost += (o.scrapCost + o.reworkCost);
      p.orderCount += 1;
      p.customerTally[o.customerName] = (p.customerTally[o.customerName] || 0) + o.totalRevenue;
    });

    const results: ProductMarginSummary[] = [];

    productMap.forEach(p => {
      const grossMarginPct = p.totalRevenue > 0
        ? Number(((p.grossProfit / p.totalRevenue) * 100).toFixed(1))
        : 0;

      const quotedMarginPct = p.totalRevenue > 0
        ? Number(((p.quotedProfit / p.totalRevenue) * 100).toFixed(1))
        : 25.0;

      const marginVariancePct = Number((grossMarginPct - quotedMarginPct).toFixed(1));

      let health: MarginHealthStatus = 'healthy';
      if (grossMarginPct >= 25.0) health = 'high_margin';
      else if (grossMarginPct >= 15.0) health = 'healthy';
      else if (grossMarginPct >= 0.0) health = 'at_risk';
      else health = 'loss_making';

      // Determine primary cost driver
      const driverCosts = [
        { driver: 'material' as const, cost: p.materialCost },
        { driver: 'labor' as const, cost: p.laborCost },
        { driver: 'machine' as const, cost: p.machineCost },
        { driver: 'overhead' as const, cost: p.overheadCost },
        { driver: 'quality_scrap' as const, cost: p.copqCost }
      ];
      driverCosts.sort((a, b) => b.cost - a.cost);
      const primaryCostDriver = driverCosts[0].driver;

      // Find top customer
      let topCustomer = 'General';
      let maxCustRev = 0;
      Object.entries(p.customerTally).forEach(([cust, rev]) => {
        if (rev > maxCustRev) {
          maxCustRev = rev;
          topCustomer = cust;
        }
      });

      results.push({
        partCode: p.partCode,
        partName: p.partName,
        category: p.category,
        unitsCount: p.unitsCount,
        avgSellingPrice: p.unitsCount > 0 ? Math.round(p.totalRevenue / p.unitsCount) : 0,
        avgUnitCost: p.unitsCount > 0 ? Math.round(p.totalCost / p.unitsCount) : 0,
        totalRevenue: p.totalRevenue,
        totalCost: p.totalCost,
        grossProfit: p.grossProfit,
        grossMarginPct,
        quotedMarginPct,
        marginVariancePct,
        health,
        materialCost: p.materialCost,
        laborCost: p.laborCost,
        machineCost: p.machineCost,
        subcontractCost: p.subcontractCost,
        overheadCost: p.overheadCost,
        copqCost: p.copqCost,
        orderCount: p.orderCount,
        topCustomer,
        primaryCostDriver
      });
    });

    // Sort by Total Revenue descending
    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // ── Customer Margin Summaries ───────────────────────────────────
  getCustomerMargins(filters: MarginFilterParams): CustomerMarginSummary[] {
    const orders = this.getFilteredOrders(filters);
    const liveSummary = this.getLivePnLSummary(filters);
    const totalFactoryProfit = liveSummary.grossProfitBeforeCopq > 0 ? liveSummary.grossProfitBeforeCopq : 1;

    const customerMap = new Map<string, {
      customerName: string;
      tier: 'Key Account' | 'Tier 1 Strategic' | 'Standard Commercial' | 'Contract Spot';
      orderCount: number;
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      grossProfit: number;
      quotedProfit: number;
      productTally: Record<string, number>;
      recentDate: string;
    }>();

    orders.forEach(o => {
      const name = o.customerName;
      if (!customerMap.has(name)) {
        let tier: 'Key Account' | 'Tier 1 Strategic' | 'Standard Commercial' | 'Contract Spot' = 'Standard Commercial';
        if (name.includes('Tata') || name.includes('Bharat') || name.includes('Larsen')) tier = 'Key Account';
        else if (name.includes('Mahindra') || name.includes('Bosch')) tier = 'Tier 1 Strategic';

        customerMap.set(name, {
          customerName: name,
          tier,
          orderCount: 0,
          totalUnits: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          quotedProfit: 0,
          productTally: {},
          recentDate: o.dueDate
        });
      }

      const c = customerMap.get(name)!;
      c.orderCount += 1;
      c.totalUnits += o.quantity;
      c.totalRevenue += o.totalRevenue;
      c.totalCost += o.actualTotalCost;
      c.grossProfit += o.grossProfit;
      c.quotedProfit += o.standardGrossProfit;
      c.productTally[o.partName] = (c.productTally[o.partName] || 0) + o.totalRevenue;
      if (new Date(o.dueDate) > new Date(c.recentDate)) {
        c.recentDate = o.dueDate;
      }
    });

    const results: CustomerMarginSummary[] = [];

    customerMap.forEach(c => {
      const grossMarginPct = c.totalRevenue > 0
        ? Number(((c.grossProfit / c.totalRevenue) * 100).toFixed(1))
        : 0;

      const quotedMarginPct = c.totalRevenue > 0
        ? Number(((c.quotedProfit / c.totalRevenue) * 100).toFixed(1))
        : 25.0;

      const marginContributionPct = Number(((c.grossProfit / totalFactoryProfit) * 100).toFixed(1));

      let health: MarginHealthStatus = 'healthy';
      if (grossMarginPct >= 25.0) health = 'high_margin';
      else if (grossMarginPct >= 15.0) health = 'healthy';
      else if (grossMarginPct >= 0.0) health = 'at_risk';
      else health = 'loss_making';

      // Find top product
      let topProduct = 'Multiple Parts';
      let maxProdRev = 0;
      Object.entries(c.productTally).forEach(([prod, rev]) => {
        if (rev > maxProdRev) {
          maxProdRev = rev;
          topProduct = prod;
        }
      });

      results.push({
        customerId: `cust-${c.customerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        customerName: c.customerName,
        tier: c.tier,
        orderCount: c.orderCount,
        totalUnits: c.totalUnits,
        totalRevenue: c.totalRevenue,
        totalCost: c.totalCost,
        grossProfit: c.grossProfit,
        grossMarginPct,
        quotedMarginPct,
        marginContributionPct,
        health,
        topProduct,
        recentOrderDate: c.recentDate
      });
    });

    // Sort by Total Revenue descending
    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // ── Periodic P&L Time-Series Trends ─────────────────────────────
  getTimePeriodTrend(filters: MarginFilterParams): PeriodPnLRecord[] {
    const orders = this.getUnifiedOrders(); // all orders across history
    // Group orders into monthly buckets
    const monthBuckets: Record<string, {
      label: string;
      dateKey: string;
      orders: OrderMarginSummary[];
    }> = {
      '2026-05': { label: 'May 2026', dateKey: '2026-05-01', orders: [] },
      '2026-06': { label: 'Jun 2026', dateKey: '2026-06-01', orders: [] },
      '2026-07': { label: 'Jul 2026', dateKey: '2026-07-01', orders: [] },
      '2026-08': { label: 'Aug 2026', dateKey: '2026-08-01', orders: [] },
      '2026-09': { label: 'Sep 2026', dateKey: '2026-09-01', orders: [] },
      '2026-10': { label: 'Oct 2026 (MTD)', dateKey: '2026-10-01', orders: [] }
    };

    orders.forEach(o => {
      const monthKey = o.dueDate.slice(0, 7);
      if (monthBuckets[monthKey]) {
        monthBuckets[monthKey].orders.push(o);
      }
    });

    const records: PeriodPnLRecord[] = Object.entries(monthBuckets).map(([key, bucket]) => {
      let revenue = 0;
      let materialCost = 0;
      let laborCost = 0;
      let machineCost = 0;
      let subcontractCost = 0;
      let overheadCost = 0;
      let copqLosses = 0;
      let unitsCount = 0;

      bucket.orders.forEach(o => {
        revenue += o.totalRevenue;
        materialCost += o.materialCost;
        laborCost += o.laborCost;
        machineCost += o.machineCost;
        subcontractCost += o.subcontractCost;
        overheadCost += o.overheadCost;
        copqLosses += (o.scrapCost + o.reworkCost);
        unitsCount += o.quantity;
      });

      const totalCogs = materialCost + laborCost + machineCost + subcontractCost + overheadCost;
      const grossProfit = revenue - totalCogs;
      const grossMarginPct = revenue > 0
        ? Number(((grossProfit / revenue) * 100).toFixed(1))
        : 0;

      return {
        periodId: key,
        periodLabel: bucket.label,
        dateKey: bucket.dateKey,
        revenue,
        materialCost,
        laborCost,
        machineCost,
        subcontractCost,
        overheadCost,
        copqLosses,
        totalCogs,
        grossProfit,
        grossMarginPct,
        orderCount: bucket.orders.length,
        unitsCount
      };
    });

    return records;
  }

  // ── Top & Bottom Performers ─────────────────────────────────────
  getTopBottomPerformers(filters: MarginFilterParams): TopBottomPerformers {
    const products = this.getProductMargins(filters);
    const customers = this.getCustomerMargins(filters);
    const orders = this.getFilteredOrders(filters);

    // Sort products by grossMarginPct descending
    const sortedProductsByMargin = [...products].sort((a, b) => b.grossMarginPct - a.grossMarginPct);
    const topProducts = sortedProductsByMargin.slice(0, 4);
    const bottomProducts = [...sortedProductsByMargin].reverse().slice(0, 4);

    // Sort customers by gross profit and margin
    const sortedCustomersByProfit = [...customers].sort((a, b) => b.grossProfit - a.grossProfit);
    const topCustomers = sortedCustomersByProfit.slice(0, 4);
    const sortedCustomersByMargin = [...customers].sort((a, b) => a.grossMarginPct - b.grossMarginPct);
    const bottomCustomers = sortedCustomersByMargin.slice(0, 4);

    // Sort orders by actualGrossMarginPercent
    const sortedOrders = [...orders].sort((a, b) => b.actualGrossMarginPercent - a.actualGrossMarginPercent);
    const topOrders = sortedOrders.slice(0, 5);
    const bottomOrders = [...sortedOrders].reverse().slice(0, 5);

    return {
      topProducts,
      bottomProducts,
      topCustomers,
      bottomCustomers,
      topOrders,
      bottomOrders
    };
  }

  // ── Filter Options Lookup ───────────────────────────────────────
  getFilterOptions(): {
    customers: string[];
    products: { code: string; name: string }[];
  } {
    const orders = this.getUnifiedOrders();
    const customerSet = new Set<string>();
    const productMap = new Map<string, string>();

    orders.forEach(o => {
      customerSet.add(o.customerName);
      if (!productMap.has(o.partCode)) {
        productMap.set(o.partCode, o.partName);
      }
    });

    return {
      customers: Array.from(customerSet).sort(),
      products: Array.from(productMap.entries()).map(([code, name]) => ({ code, name }))
    };
  }

  // ── Export CSV Utilities ────────────────────────────────────────
  exportSummaryCsv(pnl: LivePnLSummary, filters: MarginFilterParams): void {
    const rows: string[][] = [
      ['REAL-TIME GROSS MARGIN & LIVE P&L STATEMENT'],
      ['Generated On', new Date().toISOString()],
      ['Time Period Filter', filters.timePeriod.toUpperCase()],
      ['Customer Filter', filters.customer || 'ALL'],
      ['Product Filter', filters.product || 'ALL'],
      ['Target Benchmark Margin', `${pnl.targetMarginPct}%`],
      [''],
      ['EXECUTIVE P&L LINE ITEM', 'AMOUNT (INR)', '% OF REVENUE'],
      ['Gross Commercial Revenue', pnl.totalRevenue.toString(), '100.0%'],
      ['Direct Materials Consumed', pnl.totalMaterialCost.toString(), `${((pnl.totalMaterialCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['Direct Shop Floor Labor', pnl.totalLaborCost.toString(), `${((pnl.totalLaborCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['Machine Hourly & Power Rate', pnl.totalMachineCost.toString(), `${((pnl.totalMachineCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['Outside Subcontract Operations', pnl.totalSubcontractCost.toString(), `${((pnl.totalSubcontractCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['Allocated Factory Overhead', pnl.totalFactoryOverheadCost.toString(), `${((pnl.totalFactoryOverheadCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['SG&A Administrative Overhead', pnl.totalSgaCost.toString(), `${((pnl.totalSgaCost / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['TOTAL COST OF GOODS SOLD (COGS)', pnl.totalCogs.toString(), `${((pnl.totalCogs / pnl.totalRevenue) * 100).toFixed(1)}%`],
      [''],
      ['MANUFACTURING GROSS PROFIT', pnl.grossProfitBeforeCopq.toString(), `${pnl.manufacturingGrossMarginPct}%`],
      ['Less: Cost of Poor Quality (COPQ Scrap & Rework)', pnl.totalCopqLosses.toString(), `${((pnl.totalCopqLosses / pnl.totalRevenue) * 100).toFixed(1)}%`],
      ['NET REALIZED GROSS PROFIT', pnl.netRealizedProfit.toString(), `${pnl.netRealizedMarginPct}%`],
      ['Benchmark Variance / Spread', `${pnl.marginSpreadPct}%`, pnl.marginSpreadPct >= 0 ? 'Favorable' : 'Unfavorable']
    ];

    this.downloadCsv(rows, `Live_PnL_Executive_Summary_${filters.timePeriod}.csv`);
  }

  exportProductMarginsCsv(products: ProductMarginSummary[]): void {
    const rows: string[][] = [
      [
        'Part Code',
        'Part Name',
        'Category',
        'Units Sold',
        'Avg Selling Price (INR)',
        'Avg Unit Cost (INR)',
        'Total Revenue (INR)',
        'Total COGS (INR)',
        'Gross Profit (INR)',
        'Gross Margin %',
        'Quoted Margin %',
        'Margin Spread %',
        'Health Status',
        'Top Customer',
        'Primary Cost Driver',
        'COPQ Loss (INR)'
      ],
      ...products.map(p => [
        p.partCode,
        `"${p.partName.replace(/"/g, '""')}"`,
        p.category,
        p.unitsCount.toString(),
        p.avgSellingPrice.toString(),
        p.avgUnitCost.toString(),
        p.totalRevenue.toString(),
        p.totalCost.toString(),
        p.grossProfit.toString(),
        `${p.grossMarginPct}%`,
        `${p.quotedMarginPct}%`,
        `${p.marginVariancePct}%`,
        p.health,
        `"${p.topCustomer}"`,
        p.primaryCostDriver,
        p.copqCost.toString()
      ])
    ];

    this.downloadCsv(rows, `Product_Gross_Margin_Analysis_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportCustomerMarginsCsv(customers: CustomerMarginSummary[]): void {
    const rows: string[][] = [
      [
        'Customer Name',
        'Account Tier',
        'Order Count',
        'Total Units Delivered',
        'Total Revenue (INR)',
        'Total Cost (INR)',
        'Gross Profit (INR)',
        'Gross Margin %',
        'Quoted Margin %',
        'Profit Contribution %',
        'Health Status',
        'Top Product Purchased',
        'Last Order Date'
      ],
      ...customers.map(c => [
        `"${c.customerName.replace(/"/g, '""')}"`,
        c.tier,
        c.orderCount.toString(),
        c.totalUnits.toString(),
        c.totalRevenue.toString(),
        c.totalCost.toString(),
        c.grossProfit.toString(),
        `${c.grossMarginPct}%`,
        `${c.quotedMarginPct}%`,
        `${c.marginContributionPct}%`,
        c.health,
        `"${c.topProduct.replace(/"/g, '""')}"`,
        c.recentOrderDate
      ])
    ];

    this.downloadCsv(rows, `Customer_Gross_Margin_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportOrderMarginsCsv(orders: OrderMarginSummary[]): void {
    const rows: string[][] = [
      [
        'Work Order #',
        'Sales Order #',
        'Customer',
        'Part Code',
        'Part Name',
        'Quantity',
        'Unit Selling Price (INR)',
        'Total Revenue (INR)',
        'Actual COGS (INR)',
        'Gross Profit (INR)',
        'Actual Margin %',
        'Quoted Margin %',
        'Margin Dilution %',
        'Health Status',
        'Status',
        'Due Date',
        'Material Cost',
        'Labor Cost',
        'Machine Cost',
        'Subcontract Cost',
        'Overhead Cost',
        'Scrap Loss',
        'Rework Cost'
      ],
      ...orders.map(o => [
        o.workOrderNumber,
        o.salesOrderNumber,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.partCode,
        `"${o.partName.replace(/"/g, '""')}"`,
        o.quantity.toString(),
        o.contractPricePerUnit.toString(),
        o.totalRevenue.toString(),
        o.actualTotalCost.toString(),
        o.grossProfit.toString(),
        `${o.actualGrossMarginPercent}%`,
        `${o.standardGrossMarginPercent}%`,
        `${o.marginDilutionPercent}%`,
        o.health,
        o.status,
        o.dueDate,
        o.materialCost.toString(),
        o.laborCost.toString(),
        o.machineCost.toString(),
        o.subcontractCost.toString(),
        o.overheadCost.toString(),
        o.scrapCost.toString(),
        o.reworkCost.toString()
      ])
    ];

    this.downloadCsv(rows, `Order_Gross_Margin_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private downloadCsv(rows: string[][], filename: string): void {
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const marginAnalysisService = new MarginAnalysisService();
