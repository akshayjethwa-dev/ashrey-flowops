// src/services/stockAgingValuationService.ts

import {
  AgingBucketKey,
  ValuationMethod,
  SlowMovingStatus,
  ExpiryRiskLevel,
  LiquidationAction,
  FifoReceiptLayer,
  BucketStats,
  ItemStockValuationRecord,
  StockAgingSummary,
  StockAgingFilterParams,
  WorkingCapitalTargetSimulation
} from '../types/stockAgingValuation';
import { StockCategory } from '../types';

const STORAGE_KEY_PREFIX = 'flowops_stock_aging_actions_';

// Helper to determine bucket from age in days
export function getAgingBucketFromDays(days: number): AgingBucketKey {
  if (days <= 30) return 'bucket_0_30';
  if (days <= 60) return 'bucket_31_60';
  if (days <= 90) return 'bucket_61_90';
  return 'bucket_90_plus';
}

export function getBucketLabel(bucket: AgingBucketKey): string {
  switch (bucket) {
    case 'bucket_0_30':
      return '0 - 30 Days';
    case 'bucket_31_60':
      return '31 - 60 Days';
    case 'bucket_61_90':
      return '61 - 90 Days';
    case 'bucket_90_plus':
      return '90+ Days';
  }
}

export function getExpiryRiskLevel(daysToExpiry?: number): ExpiryRiskLevel {
  if (daysToExpiry === undefined || daysToExpiry === null) return 'no_expiry';
  if (daysToExpiry <= 15) return 'critical';
  if (daysToExpiry <= 45) return 'warning';
  if (daysToExpiry <= 90) return 'monitored';
  return 'good';
}

// Comprehensive seed dataset representing a real-world engineering & manufacturing inventory
const SEED_INVENTORY_VALUATION_ITEMS = (tenantId: string): ItemStockValuationRecord[] => {
  const now = new Date('2026-04-15T00:00:00Z').getTime();

  const makeDate = (daysAgo: number): string => {
    return new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
  };

  const makeFutureDate = (daysAhead: number): string => {
    return new Date(now + daysAhead * 24 * 3600 * 1000).toISOString();
  };

  // Raw Material 1: Wire Rod — High Tensile Steel 8mm
  // Received in 3 layers: Layer 1 (95 days ago, ₹62,000), Layer 2 (45 days ago, ₹65,500), Layer 3 (12 days ago, ₹68,500)
  const rm1Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-wr-1',
      receiptDate: makeDate(98),
      lotNumber: 'LOT-2026-RM-0301',
      grnNumber: 'GRN-2026-0045',
      poNumber: 'PO-2026-810',
      vendorName: 'Tata Prime Steel Ltd.',
      initialQty: 10.0,
      remainingQty: 2.0,
      unitCost: 62000,
      totalValue: 2.0 * 62000,
      ageDays: 98,
      bucket: 'bucket_90_plus',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-wr-2',
      receiptDate: makeDate(42),
      lotNumber: 'LOT-2026-RM-0365',
      grnNumber: 'GRN-2026-0120',
      poNumber: 'PO-2026-865',
      vendorName: 'Tata Prime Steel Ltd.',
      initialQty: 12.0,
      remainingQty: 5.0,
      unitCost: 65500,
      totalValue: 5.0 * 65500,
      ageDays: 42,
      bucket: 'bucket_31_60',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-wr-3',
      receiptDate: makeDate(8),
      lotNumber: 'LOT-2026-RM-0412',
      grnNumber: 'GRN-2026-0182',
      poNumber: 'PO-2026-902',
      vendorName: 'Tata Prime Steel Ltd.',
      initialQty: 15.0,
      remainingQty: 9.0,
      unitCost: 68500,
      totalValue: 9.0 * 68500,
      ageDays: 8,
      bucket: 'bucket_0_30',
      expiryDate: makeFutureDate(345),
      daysToExpiry: 345,
      expiryRiskLevel: 'good'
    }
  ];

  // Raw Material 2: Die Steel Round Bar — EN24 High Nickel
  const rm2Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-db-1',
      receiptDate: makeDate(115),
      lotNumber: 'LOT-2026-RM-0288',
      grnNumber: 'GRN-2026-0021',
      poNumber: 'PO-2026-790',
      vendorName: 'Jindal Steel & Power Ltd.',
      initialQty: 6.0,
      remainingQty: 1.5,
      unitCost: 84000,
      totalValue: 1.5 * 84000,
      ageDays: 115,
      bucket: 'bucket_90_plus',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-db-2',
      receiptDate: makeDate(13),
      lotNumber: 'LOT-2026-RM-0390',
      grnNumber: 'GRN-2026-0144',
      poNumber: 'PO-2026-880',
      vendorName: 'Jindal Steel & Power Ltd.',
      initialQty: 10.0,
      remainingQty: 4.0,
      unitCost: 89000,
      totalValue: 4.0 * 89000,
      ageDays: 13,
      bucket: 'bucket_0_30',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Finished Goods 1: Steering Column Shaft — Spec B3
  const fg1Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-scs-1',
      receiptDate: makeDate(52),
      lotNumber: 'LOT-2026-FG-0062',
      grnNumber: 'PRD-WO-2026-081',
      poNumber: 'WO-2026-081',
      initialQty: 200,
      remainingQty: 30,
      unitCost: 1380,
      totalValue: 30 * 1380,
      ageDays: 52,
      bucket: 'bucket_31_60',
      expiryDate: makeFutureDate(720),
      daysToExpiry: 720,
      expiryRiskLevel: 'good'
    },
    {
      layerId: 'layer-scs-2',
      receiptDate: makeDate(4),
      lotNumber: 'LOT-2026-FG-0089',
      grnNumber: 'PRD-WO-2026-001',
      poNumber: 'WO-2026-001',
      initialQty: 450,
      remainingQty: 150,
      unitCost: 1420,
      totalValue: 150 * 1420,
      ageDays: 4,
      bucket: 'bucket_0_30',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Finished Goods 2: Transmission Gear Pinion — 18T Ground
  const fg2Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-tgp-1',
      receiptDate: makeDate(82),
      lotNumber: 'LOT-2026-FG-0051',
      grnNumber: 'PRD-WO-2025-072',
      poNumber: 'WO-2025-072',
      initialQty: 180,
      remainingQty: 25,
      unitCost: 2750,
      totalValue: 25 * 2750,
      ageDays: 82,
      bucket: 'bucket_61_90',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-tgp-2',
      receiptDate: makeDate(7),
      lotNumber: 'LOT-2026-FG-0074',
      grnNumber: 'PRD-WO-2026-002',
      poNumber: 'WO-2026-002',
      initialQty: 220,
      remainingQty: 40,
      unitCost: 2850,
      totalValue: 40 * 2850,
      ageDays: 7,
      bucket: 'bucket_0_30',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Consumable 1: Industrial Synthetic Cutting Oil — ISO 68 (CRITICAL EXPIRY ALERT)
  const co1Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-oil-1',
      receiptDate: makeDate(175),
      lotNumber: 'LOT-2025-CO-0104',
      grnNumber: 'GRN-2025-0912',
      poNumber: 'PO-2025-610',
      vendorName: 'Castrol Industrial Lubricants',
      initialQty: 80,
      remainingQty: 25,
      unitCost: 320,
      totalValue: 25 * 320,
      ageDays: 175,
      bucket: 'bucket_90_plus',
      expiryDate: makeFutureDate(8), // EXPIRES IN 8 DAYS! CRITICAL
      daysToExpiry: 8,
      expiryRiskLevel: 'critical'
    },
    {
      layerId: 'layer-oil-2',
      receiptDate: makeDate(28),
      lotNumber: 'LOT-2026-CO-0210',
      grnNumber: 'GRN-2026-0158',
      poNumber: 'PO-2026-885',
      vendorName: 'Castrol Industrial Lubricants',
      initialQty: 50,
      remainingQty: 45,
      unitCost: 345,
      totalValue: 45 * 345,
      ageDays: 28,
      bucket: 'bucket_0_30',
      expiryDate: makeFutureDate(180),
      daysToExpiry: 180,
      expiryRiskLevel: 'good'
    }
  ];

  // Consumable 2: Anaerobic High-Temp Retaining Compound / Resin (WARNING EXPIRY ALERT)
  const co2Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-resin-1',
      receiptDate: makeDate(130),
      lotNumber: 'LOT-2025-CO-0199',
      grnNumber: 'GRN-2025-1022',
      poNumber: 'PO-2025-680',
      vendorName: 'Henkel Loctite India',
      initialQty: 40,
      remainingQty: 18,
      unitCost: 890,
      totalValue: 18 * 890,
      ageDays: 130,
      bucket: 'bucket_90_plus',
      expiryDate: makeFutureDate(22), // EXPIRES IN 22 DAYS! WARNING
      daysToExpiry: 22,
      expiryRiskLevel: 'warning'
    }
  ];

  // Spare 1: High-Tensile Socket Head Cap Screws M12x45
  const sp1Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-fast-1',
      receiptDate: makeDate(85),
      lotNumber: 'LOT-2026-BO-0088',
      grnNumber: 'GRN-2026-0091',
      poNumber: 'PO-2026-840',
      vendorName: 'Unbrako Precision Fasteners Ltd.',
      initialQty: 1500,
      remainingQty: 450,
      unitCost: 44,
      totalValue: 450 * 44,
      ageDays: 85,
      bucket: 'bucket_61_90',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-fast-2',
      receiptDate: makeDate(9),
      lotNumber: 'LOT-2026-BO-0112',
      grnNumber: 'GRN-2026-0175',
      poNumber: 'PO-2026-895',
      vendorName: 'Unbrako Precision Fasteners Ltd.',
      initialQty: 2500,
      remainingQty: 2500,
      unitCost: 48,
      totalValue: 2500 * 48,
      ageDays: 9,
      bucket: 'bucket_0_30',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Spare 2: H13 Chromium Hot Work Die Block (SLOW-MOVING / OBSOLETE RISK)
  const sp2Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-die-1',
      receiptDate: makeDate(160),
      lotNumber: 'LOT-2025-SP-0012',
      grnNumber: 'GRN-2025-0810',
      poNumber: 'PO-2025-540',
      vendorName: 'Bharat Forge Specialty Tooling',
      initialQty: 2,
      remainingQty: 1,
      unitCost: 145000,
      totalValue: 1 * 145000,
      ageDays: 160,
      bucket: 'bucket_90_plus',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Raw Material 3: Round Bars - Carbon Steel CS45 40mm (MEDIUM AGING)
  const rm3Layers: FifoReceiptLayer[] = [
    {
      layerId: 'layer-rb-1',
      receiptDate: makeDate(75),
      lotNumber: 'LOT-2026-RM-0341',
      grnNumber: 'GRN-2026-0110',
      poNumber: 'PO-2026-855',
      vendorName: 'JSW Steel Ltd.',
      initialQty: 10.0,
      remainingQty: 3.5,
      unitCost: 56000,
      totalValue: 3.5 * 56000,
      ageDays: 75,
      bucket: 'bucket_61_90',
      expiryRiskLevel: 'no_expiry'
    },
    {
      layerId: 'layer-rb-2',
      receiptDate: makeDate(35),
      lotNumber: 'LOT-2026-RM-0378',
      grnNumber: 'GRN-2026-0138',
      poNumber: 'PO-2026-872',
      vendorName: 'JSW Steel Ltd.',
      initialQty: 8.0,
      remainingQty: 5.0,
      unitCost: 58500,
      totalValue: 5.0 * 58500,
      ageDays: 35,
      bucket: 'bucket_31_60',
      expiryRiskLevel: 'no_expiry'
    }
  ];

  // Helper to construct a full item record
  const buildItemRecord = (
    itemId: string,
    itemCode: string,
    itemName: string,
    category: StockCategory,
    plantId: string,
    plantName: string,
    storeName: string,
    binCode: string,
    unit: string,
    reorderLevel: number,
    layers: FifoReceiptLayer[],
    daysSinceMovement: number,
    slowMovingStatus: SlowMovingStatus,
    doh: number,
    turnover: number,
    slowMovingReason?: string,
    liquidationAction?: LiquidationAction
  ): ItemStockValuationRecord => {
    const totalOnHandQty = layers.reduce((acc, l) => acc + l.remainingQty, 0);
    const reservedQty = Number((totalOnHandQty * 0.15).toFixed(1));
    const availableQty = Math.max(0, totalOnHandQty - reservedQty);

    // FIFO Valuation: sum of remaining layers
    const fifoTotalValuation = layers.reduce((acc, l) => acc + l.totalValue, 0);
    // Under FIFO, the latest layer cost represents current replacement / standard cost
    const latestLayer = layers[layers.length - 1];
    const fifoUnitCost = latestLayer ? latestLayer.unitCost : 0;

    // Weighted Average Cost (WAC)
    // Sum(Qty * Cost) / TotalQty
    const weightedAvgUnitCost = totalOnHandQty > 0
      ? Math.round((fifoTotalValuation / totalOnHandQty) * 100) / 100
      : fifoUnitCost;
    const weightedAvgTotalValuation = Math.round(totalOnHandQty * weightedAvgUnitCost);

    const valuationVariance = Math.round((fifoTotalValuation - weightedAvgTotalValuation) * 100) / 100;
    const valuationVariancePercent = weightedAvgTotalValuation > 0
      ? Number(((valuationVariance / weightedAvgTotalValuation) * 100).toFixed(2))
      : 0;

    // Aging breakdown
    const agingBreakdown: Record<AgingBucketKey, { qty: number; valueFifo: number; valueWac: number }> = {
      bucket_0_30: { qty: 0, valueFifo: 0, valueWac: 0 },
      bucket_31_60: { qty: 0, valueFifo: 0, valueWac: 0 },
      bucket_61_90: { qty: 0, valueFifo: 0, valueWac: 0 },
      bucket_90_plus: { qty: 0, valueFifo: 0, valueWac: 0 }
    };

    let totalWeightedAgeDays = 0;
    let maxAgeBucket: AgingBucketKey = 'bucket_0_30';
    let maxBucketQty = 0;

    layers.forEach((layer) => {
      agingBreakdown[layer.bucket].qty += layer.remainingQty;
      agingBreakdown[layer.bucket].valueFifo += layer.totalValue;
      agingBreakdown[layer.bucket].valueWac += layer.remainingQty * weightedAvgUnitCost;

      totalWeightedAgeDays += layer.remainingQty * layer.ageDays;
      if (agingBreakdown[layer.bucket].qty > maxBucketQty) {
        maxBucketQty = agingBreakdown[layer.bucket].qty;
        maxAgeBucket = layer.bucket;
      }
    });

    const averageStockAgeDays = totalOnHandQty > 0
      ? Math.round(totalWeightedAgeDays / totalOnHandQty)
      : 0;

    // Expiry metrics
    let earliestExpiryDate: string | undefined;
    let daysToEarliestExpiry: number | undefined;
    let worstExpiryRisk: ExpiryRiskLevel = 'no_expiry';
    let expiringQty = 0;
    let expiringValueAtRisk = 0;

    layers.forEach((layer) => {
      if (layer.expiryDate) {
        if (!earliestExpiryDate || new Date(layer.expiryDate) < new Date(earliestExpiryDate)) {
          earliestExpiryDate = layer.expiryDate;
          daysToEarliestExpiry = layer.daysToExpiry;
        }
      }
      if (layer.expiryRiskLevel === 'critical' || layer.expiryRiskLevel === 'warning') {
        worstExpiryRisk = layer.expiryRiskLevel === 'critical' ? 'critical' : worstExpiryRisk === 'critical' ? 'critical' : 'warning';
        expiringQty += layer.remainingQty;
        expiringValueAtRisk += layer.totalValue;
      } else if (layer.expiryRiskLevel === 'monitored' && worstExpiryRisk !== 'critical' && worstExpiryRisk !== 'warning') {
        worstExpiryRisk = 'monitored';
      } else if (layer.expiryRiskLevel === 'good' && worstExpiryRisk === 'no_expiry') {
        worstExpiryRisk = 'good';
      }
    });

    // Stagnant stock (>60 days)
    const stagnantQty = agingBreakdown.bucket_61_90.qty + agingBreakdown.bucket_90_plus.qty;
    const stagnantValue = agingBreakdown.bucket_61_90.valueFifo + agingBreakdown.bucket_90_plus.valueFifo;

    // Monthly carrying cost (standard 1.8% of holding value)
    const monthlyCarryingCostEstimate = Math.round(fifoTotalValuation * 0.018);

    return {
      itemId,
      itemCode,
      itemName,
      category,
      plantId,
      plantName,
      storeName,
      binCode,
      totalOnHandQty: Number(totalOnHandQty.toFixed(2)),
      reservedQty: Number(reservedQty.toFixed(2)),
      availableQty: Number(availableQty.toFixed(2)),
      unit,
      reorderLevel,
      lastMovementDate: makeDate(daysSinceMovement),
      daysSinceLastMovement: daysSinceMovement,
      fifoUnitCost,
      fifoTotalValuation: Math.round(fifoTotalValuation),
      weightedAvgUnitCost,
      weightedAvgTotalValuation: Math.round(weightedAvgTotalValuation),
      valuationVariance,
      valuationVariancePercent,
      primaryAgingBucket: maxAgeBucket,
      averageStockAgeDays,
      agingBreakdown,
      slowMovingStatus,
      slowMovingReason,
      daysOfInventoryOnHand: doh,
      turnoverRatio: turnover,
      monthlyCarryingCostEstimate,
      stagnantQty: Number(stagnantQty.toFixed(2)),
      stagnantValue: Math.round(stagnantValue),
      earliestExpiryDate,
      daysToEarliestExpiry,
      expiryRiskLevel: worstExpiryRisk,
      expiringQty: Number(expiringQty.toFixed(2)),
      expiringValueAtRisk: Math.round(expiringValueAtRisk),
      constituentLotsCount: layers.length,
      layers,
      liquidationAction
    };
  };

  return [
    buildItemRecord(
      'stock-1',
      'WR-1002',
      'Wire Rod — High Tensile Steel 8mm',
      'raw_material',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Main Raw Materials Store',
      'BIN-RM-A01',
      'tonnes',
      10.0,
      rm1Layers,
      8,
      'normal',
      38,
      9.6,
      'Active monthly forging consumption for steering shaft programs.'
    ),
    buildItemRecord(
      'stock-2',
      'DB-2040',
      'Die Steel Round Bar — EN24 High Nickel',
      'raw_material',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Main Raw Materials Store',
      'BIN-RM-A02',
      'tonnes',
      4.0,
      rm2Layers,
      13,
      'normal',
      42,
      8.4,
      'Regular consumption for transmission gear pinions.'
    ),
    buildItemRecord(
      'stock-fg-1',
      'FG-SCS-003',
      'Steering Column Shaft — Spec B3',
      'finished_goods',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Finished Goods Dispatch Store',
      'RACK-FG-B02',
      'units',
      100,
      fg1Layers,
      4,
      'fast_moving',
      18,
      20.2,
      'High velocity tier-1 OEM demand with scheduled JIT dispatches.'
    ),
    buildItemRecord(
      'stock-fg-2',
      'FG-TGP-018',
      'Transmission Gear Pinion — 18T Ground',
      'finished_goods',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Finished Goods Dispatch Store',
      'RACK-FG-B01',
      'units',
      50,
      fg2Layers,
      7,
      'normal',
      29,
      12.5,
      'Scheduled monthly batches for automotive powertrain division.'
    ),
    buildItemRecord(
      'stock-co-1',
      'CO-HO68',
      'Industrial Synthetic Cutting Oil — ISO 68',
      'consumable',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Lubricants & Chemical Holding',
      'BAY-LUB-02',
      'litres',
      40,
      co1Layers,
      28,
      'slow_moving',
      78,
      4.6,
      'Old batch of 25L in barrel nearing chemical shelf-life expiry in 8 days.',
      'priority_bom_allocation'
    ),
    buildItemRecord(
      'stock-co-2',
      'CO-RES-401',
      'High-Temp Retaining Compound Resin',
      'consumable',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Lubricants & Chemical Holding',
      'CAB-CHEM-A',
      'bottles',
      10,
      co2Layers,
      65,
      'slow_moving',
      84,
      4.2,
      'Shelf-life expiry approaching in 22 days. Recommend fast consumption in assembly cell.',
      'clearance_discount'
    ),
    buildItemRecord(
      'stock-sp-1',
      'FAST-M12-01',
      'Socket Head Cap Screws M12x45 (Grade 12.9)',
      'spare',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Hardware & Consumables Store',
      'SHELF-HW-04',
      'units',
      800,
      sp1Layers,
      9,
      'normal',
      34,
      10.8,
      'Consistent usage across toolroom stamping and fixture setups.'
    ),
    buildItemRecord(
      'stock-sp-2',
      'SP-H13-DIE',
      'Forging Die Block — H13 Chromium ESR',
      'spare',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Die & Tooling Vault',
      'VAULT-DIE-01',
      'blocks',
      1,
      sp2Layers,
      160,
      'non_moving',
      180,
      0.8,
      'Legacy tooling block held for over 160 days without maintenance re-turn. Free up working capital.',
      'rework_into_standard'
    ),
    buildItemRecord(
      'stock-rm-3',
      'RB-40CS',
      'Round Bars - Carbon Steel CS45 40mm',
      'raw_material',
      'plant-pune',
      'Pune Heavy Forge Facility',
      'Main Raw Materials Store',
      'BIN-RM-A03',
      'tonnes',
      6.0,
      rm3Layers,
      35,
      'slow_moving',
      68,
      5.3,
      '3.5 tonnes remaining from older batch over 75 days old.'
    )
  ];
};

class StockAgingValuationService {
  private getStorageKey(tenantId: string): string {
    return `${STORAGE_KEY_PREFIX}${tenantId}`;
  }

  // Load custom user overrides (e.g. liquidation actions, write-downs)
  private loadOverrides(tenantId: string): Record<string, { liquidationAction?: LiquidationAction; provisionWriteDownRate?: number; carryingNotes?: string }> {
    try {
      const data = localStorage.getItem(this.getStorageKey(tenantId));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveOverrides(tenantId: string, overrides: Record<string, any>): void {
    try {
      localStorage.setItem(this.getStorageKey(tenantId), JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save stock aging overrides', e);
    }
  }

  // Calculate comprehensive aging and valuation
  public getValuationData(
    tenantId: string,
    filters?: Partial<StockAgingFilterParams>
  ): {
    items: ItemStockValuationRecord[];
    summary: StockAgingSummary;
  } {
    const rawItems = SEED_INVENTORY_VALUATION_ITEMS(tenantId);
    const overrides = this.loadOverrides(tenantId);

    // Apply overrides
    const items = rawItems.map((item) => {
      const override = overrides[item.itemId];
      if (override) {
        return {
          ...item,
          liquidationAction: override.liquidationAction ?? item.liquidationAction,
          provisionWriteDownRate: override.provisionWriteDownRate ?? item.provisionWriteDownRate,
          carryingNotes: override.carryingNotes ?? item.carryingNotes
        };
      }
      return item;
    });

    const valuationMethod: ValuationMethod = filters?.valuationMethod || 'fifo';

    // Compute Summary KPIs
    let totalValuationFifo = 0;
    let totalValuationWac = 0;
    let workingCapitalLocked90Plus = 0;
    let workingCapitalLocked60Plus = 0;
    let slowMovingTotalValue = 0;
    let slowMovingItemsCount = 0;
    let nonMovingItemsCount = 0;
    let expiringTotalValueAtRisk = 0;
    let expiringLotsCount = 0;
    let criticalExpiryItemsCount = 0;
    let totalUnitsCount = 0;
    let monthlyCarryingCostTotal = 0;

    // Acceptance Criteria Aging Buckets
    const buckets: Record<AgingBucketKey, BucketStats> = {
      bucket_0_30: {
        label: '0 - 30 Days (Fresh)',
        daysRange: '0 - 30 days',
        minDays: 0,
        maxDays: 30,
        itemCount: 0,
        totalQty: 0,
        valueFifo: 0,
        valueWac: 0,
        percentage: 0
      },
      bucket_31_60: {
        label: '31 - 60 Days (Normal)',
        daysRange: '31 - 60 days',
        minDays: 31,
        maxDays: 60,
        itemCount: 0,
        totalQty: 0,
        valueFifo: 0,
        valueWac: 0,
        percentage: 0
      },
      bucket_61_90: {
        label: '61 - 90 Days (Watchlist)',
        daysRange: '61 - 90 days',
        minDays: 61,
        maxDays: 90,
        itemCount: 0,
        totalQty: 0,
        valueFifo: 0,
        valueWac: 0,
        percentage: 0
      },
      bucket_90_plus: {
        label: '90+ Days (Aged / Stagnant)',
        daysRange: '90+ days',
        minDays: 91,
        maxDays: 9999,
        itemCount: 0,
        totalQty: 0,
        valueFifo: 0,
        valueWac: 0,
        percentage: 0
      }
    };

    // Category Distribution Map
    const categoryMap = new Map<StockCategory, {
      category: StockCategory;
      label: string;
      itemCount: number;
      totalQty: number;
      valueFifo: number;
      valueWac: number;
    }>();

    // Plant Distribution Map
    const plantMap = new Map<string, {
      plantId: string;
      plantName: string;
      itemCount: number;
      valueFifo: number;
      valueWac: number;
    }>();

    items.forEach((item) => {
      totalValuationFifo += item.fifoTotalValuation;
      totalValuationWac += item.weightedAvgTotalValuation;
      totalUnitsCount += item.totalOnHandQty;
      monthlyCarryingCostTotal += item.monthlyCarryingCostEstimate;

      // Aging buckets breakdown
      (Object.keys(item.agingBreakdown) as AgingBucketKey[]).forEach((bucketKey) => {
        const b = item.agingBreakdown[bucketKey];
        if (b.qty > 0) {
          buckets[bucketKey].totalQty += b.qty;
          buckets[bucketKey].valueFifo += b.valueFifo;
          buckets[bucketKey].valueWac += b.valueWac;
          buckets[bucketKey].itemCount += 1;
        }
      });

      // Locked working capital
      const val90 = item.agingBreakdown.bucket_90_plus[valuationMethod === 'fifo' ? 'valueFifo' : 'valueWac'];
      const val60 = item.agingBreakdown.bucket_61_90[valuationMethod === 'fifo' ? 'valueFifo' : 'valueWac'];
      workingCapitalLocked90Plus += val90;
      workingCapitalLocked60Plus += (val90 + val60);

      // Slow moving
      if (item.slowMovingStatus === 'slow_moving' || item.slowMovingStatus === 'non_moving' || item.slowMovingStatus === 'obsolete') {
        slowMovingItemsCount += 1;
        slowMovingTotalValue += item[valuationMethod === 'fifo' ? 'fifoTotalValuation' : 'weightedAvgTotalValuation'];
        if (item.slowMovingStatus === 'non_moving' || item.slowMovingStatus === 'obsolete') {
          nonMovingItemsCount += 1;
        }
      }

      // Expiry
      if (item.expiryRiskLevel === 'critical' || item.expiryRiskLevel === 'warning') {
        expiringTotalValueAtRisk += item.expiringValueAtRisk;
        if (item.expiryRiskLevel === 'critical') {
          criticalExpiryItemsCount += 1;
        }
      }
      item.layers.forEach((l) => {
        if (l.expiryRiskLevel === 'critical' || l.expiryRiskLevel === 'warning') {
          expiringLotsCount += 1;
        }
      });

      // Category aggregation
      const catKey = item.category;
      if (!categoryMap.has(catKey)) {
        const catLabels: Record<string, string> = {
          raw_material: 'Raw Materials (Coils/Bars)',
          finished_goods: 'Finished Goods',
          bought_out: 'Bought-Out Parts',
          spare: 'Tooling & Spares',
          consumable: 'Consumables & Oils'
        };
        categoryMap.set(catKey, {
          category: catKey,
          label: catLabels[catKey] || catKey,
          itemCount: 0,
          totalQty: 0,
          valueFifo: 0,
          valueWac: 0
        });
      }
      const cEntry = categoryMap.get(catKey)!;
      cEntry.itemCount += 1;
      cEntry.totalQty += item.totalOnHandQty;
      cEntry.valueFifo += item.fifoTotalValuation;
      cEntry.valueWac += item.weightedAvgTotalValuation;

      // Plant aggregation
      if (!plantMap.has(item.plantId)) {
        plantMap.set(item.plantId, {
          plantId: item.plantId,
          plantName: item.plantName,
          itemCount: 0,
          valueFifo: 0,
          valueWac: 0
        });
      }
      const pEntry = plantMap.get(item.plantId)!;
      pEntry.itemCount += 1;
      pEntry.valueFifo += item.fifoTotalValuation;
      pEntry.valueWac += item.weightedAvgTotalValuation;
    });

    const effectiveTotalValuation = valuationMethod === 'fifo' ? totalValuationFifo : totalValuationWac;
    const valuationVariance = Math.round((totalValuationFifo - totalValuationWac) * 100) / 100;
    const valuationVariancePercent = totalValuationWac > 0
      ? Number(((valuationVariance / totalValuationWac) * 100).toFixed(2))
      : 0;

    // Calculate percentages for buckets
    (Object.keys(buckets) as AgingBucketKey[]).forEach((key) => {
      const b = buckets[key];
      const val = valuationMethod === 'fifo' ? b.valueFifo : b.valueWac;
      b.percentage = effectiveTotalValuation > 0
        ? Number(((val / effectiveTotalValuation) * 100).toFixed(1))
        : 0;
    });

    // Category distribution array
    const categoryDistribution = Array.from(categoryMap.values()).map((c) => ({
      ...c,
      percentage: effectiveTotalValuation > 0
        ? Number((((valuationMethod === 'fifo' ? c.valueFifo : c.valueWac) / effectiveTotalValuation) * 100).toFixed(1))
        : 0
    }));

    // Plant distribution array
    const plantDistribution = Array.from(plantMap.values());

    const summary: StockAgingSummary = {
      tenantId,
      lastCalculatedAt: new Date().toISOString(),
      totalItemsCount: items.length,
      totalUnitsCount: Number(totalUnitsCount.toFixed(2)),
      valuationMethod,
      effectiveTotalValuation: Math.round(effectiveTotalValuation),
      totalValuationFifo: Math.round(totalValuationFifo),
      totalValuationWac: Math.round(totalValuationWac),
      valuationVariance,
      valuationVariancePercent,
      workingCapitalLocked90Plus: Math.round(workingCapitalLocked90Plus),
      workingCapitalLocked60Plus: Math.round(workingCapitalLocked60Plus),
      slowMovingTotalValue: Math.round(slowMovingTotalValue),
      slowMovingItemsCount,
      nonMovingItemsCount,
      expiringTotalValueAtRisk: Math.round(expiringTotalValueAtRisk),
      expiringLotsCount,
      criticalExpiryItemsCount,
      monthlyCarryingCostTotal: Math.round(monthlyCarryingCostTotal),
      buckets,
      categoryDistribution,
      plantDistribution
    };

    // Apply Filter constraints
    let filteredItems = [...items];

    if (filters?.plantId && filters.plantId !== 'all') {
      filteredItems = filteredItems.filter((i) => i.plantId === filters.plantId);
    }

    if (filters?.category && filters.category !== 'all') {
      filteredItems = filteredItems.filter((i) => i.category === filters.category);
    }

    if (filters?.agingBucket && filters.agingBucket !== 'all') {
      const targetBucket = filters.agingBucket as AgingBucketKey;
      filteredItems = filteredItems.filter((i) => i.agingBreakdown[targetBucket]?.qty > 0);
    }

    if (filters?.slowMovingOnly) {
      filteredItems = filteredItems.filter(
        (i) => i.slowMovingStatus === 'slow_moving' || i.slowMovingStatus === 'non_moving' || i.slowMovingStatus === 'obsolete'
      );
    }

    if (filters?.expiryAlertsOnly) {
      filteredItems = filteredItems.filter((i) => i.expiryRiskLevel === 'critical' || i.expiryRiskLevel === 'warning');
    }

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      filteredItems = filteredItems.filter(
        (i) =>
          i.itemCode.toLowerCase().includes(q) ||
          i.itemName.toLowerCase().includes(q) ||
          i.storeName?.toLowerCase().includes(q) ||
          i.binCode?.toLowerCase().includes(q) ||
          i.layers.some((l) => l.lotNumber?.toLowerCase().includes(q) || l.vendorName?.toLowerCase().includes(q))
      );
    }

    return {
      items: filteredItems,
      summary
    };
  }

  // Update liquidation recommendation or write-down provision
  public updateItemAction(
    tenantId: string,
    itemId: string,
    action: LiquidationAction,
    provisionRate?: number,
    notes?: string
  ): void {
    const overrides = this.loadOverrides(tenantId);
    overrides[itemId] = {
      liquidationAction: action,
      provisionWriteDownRate: provisionRate !== undefined ? provisionRate : overrides[itemId]?.provisionWriteDownRate,
      carryingNotes: notes ?? overrides[itemId]?.carryingNotes
    };
    this.saveOverrides(tenantId, overrides);
  }

  // Simulate freeing up working capital
  public simulateWorkingCapital(
    summary: StockAgingSummary,
    pct90: number, // 0 to 100
    pct60: number  // 0 to 100
  ): WorkingCapitalTargetSimulation {
    const val90 = summary.workingCapitalLocked90Plus;
    // Value in 61-90 only
    const val61To90 = summary.workingCapitalLocked60Plus - val90;

    const freedFrom90 = (val90 * pct90) / 100;
    const freedFrom60 = (val61To90 * pct60) / 100;
    const totalFreed = Math.round(freedFrom90 + freedFrom60);
    const monthlyHoldingSavings = Math.round(totalFreed * 0.018);

    return {
      targetLiquidationPercent90Plus: pct90,
      targetLiquidationPercent60Plus: pct60,
      estimatedWorkingCapitalFreed: totalFreed,
      estimatedCarryingCostSavedMonthly: monthlyHoldingSavings
    };
  }
}

export const stockAgingValuationService = new StockAgingValuationService();
