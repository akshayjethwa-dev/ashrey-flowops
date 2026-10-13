// src/types/stockAgingValuation.ts

import { StockCategory } from '../types';

export type AgingBucketKey = 'bucket_0_30' | 'bucket_31_60' | 'bucket_61_90' | 'bucket_90_plus';

export type ValuationMethod = 'fifo' | 'weighted_average';

export type SlowMovingStatus =
  | 'fast_moving'     // Healthy velocity, high turnover (DOH < 30 days)
  | 'normal'          // Balanced consumption (DOH 30 - 60 days)
  | 'slow_moving'     // Infrequent movement, elevated inventory (DOH 61 - 90 days)
  | 'non_moving'      // Zero consumption in 90+ days
  | 'obsolete';       // Inactive > 180 days or engineering superseded

export type ExpiryRiskLevel =
  | 'critical'        // Expired or expiring within <= 15 days
  | 'warning'         // Expiring within 16 - 45 days
  | 'monitored'       // Expiring within 46 - 90 days
  | 'good'            // Safe (> 90 days shelf-life)
  | 'no_expiry';      // Non-perishable / infinite shelf-life

export type LiquidationAction =
  | 'clearance_discount'
  | 'rework_into_standard'
  | 'vendor_return_claim'
  | 'scrap_reserve'
  | 'priority_bom_allocation'
  | 'hold_audit';

export interface FifoReceiptLayer {
  layerId: string;
  receiptDate: string;
  lotNumber?: string;
  grnNumber?: string;
  poNumber?: string;
  vendorName?: string;
  initialQty: number;
  remainingQty: number;
  unitCost: number;       // ₹ per unit
  totalValue: number;     // remainingQty * unitCost
  ageDays: number;
  bucket: AgingBucketKey;
  expiryDate?: string;
  daysToExpiry?: number;
  expiryRiskLevel: ExpiryRiskLevel;
}

export interface BucketStats {
  label: string;
  daysRange: string;
  minDays: number;
  maxDays: number;
  itemCount: number;
  totalQty: number;
  valueFifo: number;
  valueWac: number;
  percentage: number;
}

export interface ItemStockValuationRecord {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: StockCategory;
  plantId: string;
  plantName: string;
  storeName?: string;
  binCode?: string;
  totalOnHandQty: number;
  reservedQty: number;
  availableQty: number;
  unit: string;
  reorderLevel: number;
  lastMovementDate: string;
  daysSinceLastMovement: number;

  // Valuation metrics
  fifoUnitCost: number;             // Latest layer unit cost under FIFO
  fifoTotalValuation: number;       // Sum of all FIFO layers remaining
  weightedAvgUnitCost: number;      // Dynamic weighted average unit cost
  weightedAvgTotalValuation: number; // totalOnHandQty * weightedAvgUnitCost
  valuationVariance: number;        // fifoTotalValuation - weightedAvgTotalValuation
  valuationVariancePercent: number;

  // Aging distribution
  primaryAgingBucket: AgingBucketKey;
  averageStockAgeDays: number;
  agingBreakdown: Record<AgingBucketKey, {
    qty: number;
    valueFifo: number;
    valueWac: number;
  }>;

  // Velocity & Slow-Moving metrics
  slowMovingStatus: SlowMovingStatus;
  slowMovingReason?: string;
  daysOfInventoryOnHand: number;     // DOH
  turnoverRatio: number;             // Annualized turns
  monthlyCarryingCostEstimate: number; // Estimated holding cost (1.8%/mo)
  stagnantQty: number;              // Qty aged > 60 days
  stagnantValue: number;

  // Expiry Risk
  earliestExpiryDate?: string;
  daysToEarliestExpiry?: number;
  expiryRiskLevel: ExpiryRiskLevel;
  expiringQty: number;
  expiringValueAtRisk: number;

  // Receipt Layers & Lots
  constituentLotsCount: number;
  layers: FifoReceiptLayer[];

  // Finance Actions
  liquidationAction?: LiquidationAction;
  provisionWriteDownRate?: number;   // 0 to 100%
  carryingNotes?: string;
}

export interface StockAgingSummary {
  tenantId: string;
  lastCalculatedAt: string;
  totalItemsCount: number;
  totalUnitsCount: number;

  // Valuation
  valuationMethod: ValuationMethod;
  effectiveTotalValuation: number;
  totalValuationFifo: number;
  totalValuationWac: number;
  valuationVariance: number;
  valuationVariancePercent: number;

  // Working Capital & Risk
  workingCapitalLocked90Plus: number;
  workingCapitalLocked60Plus: number;
  slowMovingTotalValue: number;
  slowMovingItemsCount: number;
  nonMovingItemsCount: number;
  expiringTotalValueAtRisk: number;
  expiringLotsCount: number;
  criticalExpiryItemsCount: number;
  monthlyCarryingCostTotal: number;

  // Acceptance Criteria Aging Buckets
  buckets: Record<AgingBucketKey, BucketStats>;

  // Breakdowns
  categoryDistribution: Array<{
    category: StockCategory;
    label: string;
    itemCount: number;
    totalQty: number;
    valueFifo: number;
    valueWac: number;
    percentage: number;
  }>;

  plantDistribution: Array<{
    plantId: string;
    plantName: string;
    itemCount: number;
    valueFifo: number;
    valueWac: number;
  }>;
}

export interface StockAgingFilterParams {
  plantId: string;
  category: string;
  agingBucket: string;
  valuationMethod: ValuationMethod;
  slowMovingOnly: boolean;
  expiryAlertsOnly: boolean;
  searchQuery: string;
}

export interface WorkingCapitalTargetSimulation {
  targetLiquidationPercent90Plus: number; // e.g. 50%
  targetLiquidationPercent60Plus: number; // e.g. 25%
  estimatedWorkingCapitalFreed: number;
  estimatedCarryingCostSavedMonthly: number;
}
