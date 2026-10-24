// src/services/executiveDashboardService.ts

import { 
  ExecutiveKpis, 
  ExecutiveTimeframe, 
  MonthlyTrendPoint, 
  BacklogDrillDownItem, 
  WipDrillDownItem, 
  OtdDrillDownShipment 
} from '../types/executiveDashboard';
import { marginAnalysisService } from './marginAnalysisService';

export const SEED_MONTHLY_TRENDS: MonthlyTrendPoint[] = [
  {
    month: 'May',
    revenue: 11800000,
    targetRevenue: 11000000,
    grossProfit: 3186000,
    grossMarginPct: 27.0,
    otdPct: 93.4,
    backlogValue: 4200000,
    wipValue: 1950000
  },
  {
    month: 'Jun',
    revenue: 12400000,
    targetRevenue: 11500000,
    grossProfit: 3410000,
    grossMarginPct: 27.5,
    otdPct: 94.1,
    backlogValue: 4600000,
    wipValue: 2100000
  },
  {
    month: 'Jul',
    revenue: 12900000,
    targetRevenue: 12000000,
    grossProfit: 3586200,
    grossMarginPct: 27.8,
    otdPct: 94.8,
    backlogValue: 5100000,
    wipValue: 2280000
  },
  {
    month: 'Aug',
    revenue: 13300000,
    targetRevenue: 12500000,
    grossProfit: 3750600,
    grossMarginPct: 28.2,
    otdPct: 95.2,
    backlogValue: 5400000,
    wipValue: 2350000
  },
  {
    month: 'Sep',
    revenue: 13750000,
    targetRevenue: 13000000,
    grossProfit: 3918750,
    grossMarginPct: 28.5,
    otdPct: 95.5,
    backlogValue: 5650000,
    wipValue: 2420000
  },
  {
    month: 'Oct (MTD)',
    revenue: 14210000,
    targetRevenue: 13500000,
    grossProfit: 4064060,
    grossMarginPct: 28.6,
    otdPct: 95.8,
    backlogValue: 5840000,
    wipValue: 2480000
  }
];

export const SEED_BACKLOG_ITEMS: BacklogDrillDownItem[] = [
  {
    id: 'backlog-1',
    orderNumber: 'ORD-2026-9041',
    customerName: 'Tata Motors Precision CVBU',
    partDescription: 'Forged Steel Spur Gear (Mod 4, 32T)',
    quantity: 450,
    totalValue: 1845000,
    committedDate: '2026-10-28',
    daysRemaining: 7,
    status: 'in_production',
    riskTier: 'low'
  },
  {
    id: 'backlog-2',
    orderNumber: 'ORD-2026-9048',
    customerName: 'Kirloskar Heavy Transmission Systems',
    partDescription: 'Precision CNC Flange Housing (AISI 4140)',
    quantity: 240,
    totalValue: 1425000,
    committedDate: '2026-10-31',
    daysRemaining: 10,
    status: 'in_production',
    riskTier: 'low'
  },
  {
    id: 'backlog-3',
    orderNumber: 'ORD-2026-9055',
    customerName: 'Bharat Precision Automotives Ltd.',
    partDescription: 'Hardened Camshaft Shaft Assemblies',
    quantity: 180,
    totalValue: 980000,
    committedDate: '2026-10-25',
    daysRemaining: 4,
    status: 'ready_for_dispatch',
    riskTier: 'low'
  },
  {
    id: 'backlog-4',
    orderNumber: 'ORD-2026-9062',
    customerName: 'Mahindra & Mahindra Tier-1 Hub',
    partDescription: 'Differential Pinion Gears EN19 Normalized',
    quantity: 320,
    totalValue: 890000,
    committedDate: '2026-11-04',
    daysRemaining: 14,
    status: 'scheduled',
    riskTier: 'medium'
  },
  {
    id: 'backlog-5',
    orderNumber: 'ORD-2026-9071',
    customerName: 'Gujarat Lathe Corporation',
    partDescription: 'Precision Machined Gear Rings Dia 450mm',
    quantity: 200,
    totalValue: 700000,
    committedDate: '2026-10-24',
    daysRemaining: 3,
    status: 'delayed',
    riskTier: 'high'
  }
];

export const SEED_WIP_ITEMS: WipDrillDownItem[] = [
  {
    id: 'wip-1',
    stageName: 'Op 10: Raw Material Sizing & Cold Cut',
    operationCode: 'OP-CUT-10',
    batchCount: 3,
    unitCount: 420,
    tiedUpValue: 320000,
    avgLeadTimeHours: 4.2,
    activeWorkOrders: ['WO-2026-0081', 'WO-2026-0084'],
    status: 'normal'
  },
  {
    id: 'wip-2',
    stageName: 'Op 20: CNC Rough Machining & Turning',
    operationCode: 'OP-CNC-20',
    batchCount: 6,
    unitCount: 680,
    tiedUpValue: 780000,
    avgLeadTimeHours: 8.5,
    activeWorkOrders: ['WO-2026-0072', 'WO-2026-0075', 'WO-2026-0079'],
    status: 'congested'
  },
  {
    id: 'wip-3',
    stageName: 'Op 30: Heat Treatment & Carburizing',
    operationCode: 'OP-HT-30',
    batchCount: 2,
    unitCount: 340,
    tiedUpValue: 410000,
    avgLeadTimeHours: 12.0,
    activeWorkOrders: ['WO-2026-0068', 'WO-2026-0071'],
    status: 'normal'
  },
  {
    id: 'wip-4',
    stageName: 'Op 40: Precision Cylindrical Finish Grinding',
    operationCode: 'OP-GRD-40',
    batchCount: 4,
    unitCount: 510,
    tiedUpValue: 640000,
    avgLeadTimeHours: 6.8,
    activeWorkOrders: ['WO-2026-0063', 'WO-2026-0065'],
    status: 'normal'
  },
  {
    id: 'wip-5',
    stageName: 'Op 50: Subcontract Anti-Corrosion Coating',
    operationCode: 'OP-SUB-50',
    batchCount: 2,
    unitCount: 180,
    tiedUpValue: 150000,
    avgLeadTimeHours: 24.0,
    activeWorkOrders: ['WO-2026-0059'],
    status: 'normal'
  },
  {
    id: 'wip-6',
    stageName: 'Op 60: Final Quality Inspection (FQC Gate)',
    operationCode: 'OP-FQC-60',
    batchCount: 2,
    unitCount: 140,
    tiedUpValue: 180000,
    avgLeadTimeHours: 2.5,
    activeWorkOrders: ['WO-2026-0056'],
    status: 'clear'
  }
];

export const SEED_OTD_SHIPMENTS: OtdDrillDownShipment[] = [
  {
    id: 'otd-1',
    dispatchNumber: 'DSP-2026-0412',
    orderNumber: 'ORD-2026-8910',
    customerName: 'Tata Motors Precision CVBU',
    destination: 'Pune MIDC Gate #4',
    transporterName: 'SafeExpress Logistics Ltd.',
    lrNumber: 'LR-SFX-PUN-9921',
    promisedDate: '2026-10-18',
    actualDeliveryDate: '2026-10-18',
    status: 'on_time'
  },
  {
    id: 'otd-2',
    dispatchNumber: 'DSP-2026-0415',
    orderNumber: 'ORD-2026-8914',
    customerName: 'Kirloskar Heavy Transmission',
    destination: 'Sangli Heavy Machining Yard',
    transporterName: 'VRL Logistics Express',
    lrNumber: 'LR-VRL-PUN-7729',
    promisedDate: '2026-10-19',
    actualDeliveryDate: '2026-10-19',
    status: 'on_time'
  },
  {
    id: 'otd-3',
    dispatchNumber: 'DSP-2026-0419',
    orderNumber: 'ORD-2026-8920',
    customerName: 'Gujarat Lathe Corporation',
    destination: 'Ahmedabad GIDC Phase 2',
    transporterName: 'TCI Freight Logistics',
    lrNumber: 'LR-TCI-PUN-5541',
    promisedDate: '2026-10-17',
    actualDeliveryDate: '2026-10-19',
    status: 'delayed',
    delayDays: 2,
    rootCause: 'Interstate highway monsoon checkpoint delay at Vapi border'
  },
  {
    id: 'otd-4',
    dispatchNumber: 'DSP-2026-0422',
    orderNumber: 'ORD-2026-8928',
    customerName: 'Bharat Forge Precision Cell',
    destination: 'Mundhwa Forging Works, Pune',
    transporterName: 'Direct Dedicated Fleet Truck',
    lrNumber: 'LR-DIR-PUN-0012',
    promisedDate: '2026-10-20',
    actualDeliveryDate: '2026-10-20',
    status: 'on_time'
  },
  {
    id: 'otd-5',
    dispatchNumber: 'DSP-2026-0425',
    orderNumber: 'ORD-2026-8935',
    customerName: 'Sundram Fasteners Tier-1 Hub',
    destination: 'Hosur Plant Gate 2',
    transporterName: 'Blue Dart Aviation Freight',
    lrNumber: 'LR-BDT-PUN-4401',
    promisedDate: '2026-10-21',
    status: 'in_transit'
  }
];

class ExecutiveDashboardService {
  /**
   * Generates real-time Executive KPIs
   */
  public getExecutiveKpis(tenantId: string, timeframe: ExecutiveTimeframe = 'mtd'): ExecutiveKpis {
    // Multi-period multipliers for realistic live modeling
    let mult = 1.0;
    if (timeframe === 'today') mult = 0.04;
    else if (timeframe === 'this_week') mult = 0.25;
    else if (timeframe === 'qtd') mult = 1.0;
    else if (timeframe === 'ytd') mult = 3.6;

    const baseRevenue = 14210000 * mult;
    const baseTarget = 13500000 * mult;
    const baseProfit = baseRevenue * 0.286;

    return {
      revenueActual: Math.round(baseRevenue),
      revenueTarget: Math.round(baseTarget),
      revenueGrowthPct: 14.2,
      revenueStatus: 'above_target',

      grossMarginPct: 28.6,
      grossMarginTargetPct: 25.0,
      grossProfitValue: Math.round(baseProfit),
      marginDilutionPct: 1.2,
      marginHealth: 'healthy',

      otdPct: 95.8,
      otdTargetPct: 95.0,
      totalShipments: Math.max(Math.round(48 * mult), 4),
      onTimeShipments: Math.max(Math.round(46 * mult), 4),
      delayedShipments: Math.round(2 * mult),
      otifPct: 94.6,

      backlogTotalValue: 5840000,
      backlogOrderCount: 18,
      backlogAvgDaysRemaining: 9.4,
      backlogAging: {
        under15Days: 3850000,
        days15To30: 1420000,
        over30Days: 570000
      },

      wipTotalValue: 2480000,
      wipActiveOrdersCount: 12,
      wipAverageCycleDays: 4.8,
      wipLeadTimeBufferHealth: 'healthy'
    };
  }

  /**
   * Returns monthly trend points
   */
  public getMonthlyTrends(): MonthlyTrendPoint[] {
    return SEED_MONTHLY_TRENDS;
  }

  /**
   * Returns Backlog drill-down records
   */
  public getBacklogItems(): BacklogDrillDownItem[] {
    return SEED_BACKLOG_ITEMS;
  }

  /**
   * Returns WIP by stage drill-down
   */
  public getWipItems(): WipDrillDownItem[] {
    return SEED_WIP_ITEMS;
  }

  /**
   * Returns OTD shipments drill-down
   */
  public getOtdShipments(): OtdDrillDownShipment[] {
    return SEED_OTD_SHIPMENTS;
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();
