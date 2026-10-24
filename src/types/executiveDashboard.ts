// src/types/executiveDashboard.ts

export type ExecutiveTimeframe = 'today' | 'this_week' | 'mtd' | 'qtd' | 'ytd';

export interface ExecutiveKpis {
  // Revenue
  revenueActual: number;
  revenueTarget: number;
  revenueGrowthPct: number; // vs prior period
  revenueStatus: 'above_target' | 'on_track' | 'below_target';

  // Gross Margin
  grossMarginPct: number;
  grossMarginTargetPct: number;
  grossProfitValue: number;
  marginDilutionPct: number;
  marginHealth: 'healthy' | 'warning' | 'critical';

  // On-Time Delivery
  otdPct: number;
  otdTargetPct: number;
  totalShipments: number;
  onTimeShipments: number;
  delayedShipments: number;
  otifPct: number;

  // Backlog
  backlogTotalValue: number;
  backlogOrderCount: number;
  backlogAvgDaysRemaining: number;
  backlogAging: {
    under15Days: number;
    days15To30: number;
    over30Days: number;
  };

  // WIP Capital Value
  wipTotalValue: number;
  wipActiveOrdersCount: number;
  wipAverageCycleDays: number;
  wipLeadTimeBufferHealth: 'healthy' | 'caution' | 'critical';
}

export interface MonthlyTrendPoint {
  month: string;         // 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
  revenue: number;       // in INR
  targetRevenue: number;
  grossProfit: number;
  grossMarginPct: number;
  otdPct: number;
  backlogValue: number;
  wipValue: number;
}

export interface BacklogDrillDownItem {
  id: string;
  orderNumber: string;
  customerName: string;
  partDescription: string;
  quantity: number;
  totalValue: number;
  committedDate: string;
  daysRemaining: number;
  status: 'scheduled' | 'in_production' | 'ready_for_dispatch' | 'delayed';
  riskTier: 'low' | 'medium' | 'high';
}

export interface WipDrillDownItem {
  id: string;
  stageName: string;
  operationCode: string;
  batchCount: number;
  unitCount: number;
  tiedUpValue: number;
  avgLeadTimeHours: number;
  activeWorkOrders: string[];
  status: 'normal' | 'congested' | 'clear';
}

export interface OtdDrillDownShipment {
  id: string;
  dispatchNumber: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  transporterName: string;
  lrNumber: string;
  promisedDate: string;
  actualDeliveryDate?: string;
  status: 'on_time' | 'delayed' | 'in_transit';
  delayDays?: number;
  rootCause?: string;
}
