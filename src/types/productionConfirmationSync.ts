// src/types/productionConfirmationSync.ts

export type ProductionConfirmationStatus = 
  | 'pending_confirmation' 
  | 'confirmed' 
  | 'partially_synced' 
  | 'failed';

export type ConfirmationErpSystem = 'tally' | 'oracle' | 'sap';

export interface ConsumedMaterialItem {
  id: string;
  itemCode: string;
  itemName: string;
  bomRequiredQty: number;
  actualConsumedQty: number;
  uom: string;
  scrapFactorPct: number;
  unitCostINR: number;
  totalCostINR: number;
  lotNumber: string;
  sourceWarehouse: string;
  stockRelieved: boolean;
  erpStockItemRef?: string;
}

export interface ScrapReworkPostingDetail {
  scrapVoucherNumber?: string;
  quantityScrapped: number;
  uom: string;
  scrapReasonCode: string;
  scrapReasonDescription: string;
  scrapLossAmountINR: number;
  reworkHours: number;
  reworkLaborCostINR: number;
  costCenterDebit: string; // e.g. "CC-PUNE-MACHINING" or "Manufacturing Scrap Expense A/c"
  status: 'pending' | 'posted';
  postedAt?: string;
}

export interface QualityConfirmationDetail {
  fqcNumber: string;
  inspectionDate: string;
  overallResult: 'pass' | 'fail' | 'conditional_release';
  passedQuantity: number;
  rejectedQuantity: number;
  cocNumber: string; // Certificate of Conformance / Analysis
  inspectorBadgeId: string;
  qualityHoldStatus: 'released' | 'on_hold' | 'quarantined';
  coaDocumentRef?: string;
  tallyQualityRemarks: string;
  status: 'pending' | 'posted';
  postedAt?: string;
}

export interface ProductionConfirmationRecord {
  id: string;
  tenantId: string;
  workOrderId: string;
  workOrderNumber: string; // e.g. "WO-2026-0001"
  salesOrderId?: string;
  salesOrderNumber: string; // e.g. "ORD-2026-0042"
  customerPoNumber: string;
  customerName: string;
  plantId: string;
  plantName: string;
  partCode: string;
  partName: string;
  quantityCompleted: number;
  quantityScrapped: number;
  uom: string;
  completionDate: string;
  erpSystem: ConfirmationErpSystem;
  status: ProductionConfirmationStatus;

  // 1. Production Completion (Finished Goods Receipt)
  completionSync: {
    voucherNumber?: string;
    manufacturingJournalNumber?: string; // Tally
    wipCompletionTxnId?: string;        // Oracle
    sapMaterialDocNumber?: string;       // SAP
    fgStockItemName: string;
    targetSubinventory: string;
    fgValuationINR: number;
    fgCostPerUnit: number;
    status: 'pending' | 'posted';
    postedAt?: string;
  };

  // 2. Material Consumption Backflushing
  materialConsumptionSync: {
    consumptionVoucherNumber?: string;
    materials: ConsumedMaterialItem[];
    totalMaterialCostINR: number;
    status: 'pending' | 'posted';
    postedAt?: string;
  };

  // 3. Scrap & Rework Costing
  scrapReworkSync: ScrapReworkPostingDetail;

  // 4. Quality Results
  qualityResultsSync: QualityConfirmationDetail;

  // Overall financial summary
  totalOrderCostINR: number;
  currency: string;
  erpPayloadXmlOrJson?: string;
  lastSyncedAt?: string;
  syncedBy?: string;
  errorMessage?: string;
  notes?: string;
}

export interface ProductionConfirmationStats {
  pendingConfirmationsCount: number;
  confirmedCount: number;
  totalFgValuationINR: number;
  totalMaterialRelievedINR: number;
  totalScrapBookedINR: number;
  qualityPassedPct: number;
}

export interface ConfirmationPostingConfig {
  erpSystem: ConfirmationErpSystem;
  tallyConfig: {
    mfgJournalVoucherType: string;
    fgLedger: string;
    rawMaterialConsumptionLedger: string;
    scrapExpenseLedger: string;
    reworkLaborLedger: string;
    autoPushOnFqcRelease: boolean;
  };
  oracleConfig: {
    inventoryOrgCode: string;
    wipCompletionSubinventory: string;
    scrapCostCenterAccount: string;
    reworkVarianceAccount: string;
    autoPushOnFqcRelease: boolean;
  };
  sapConfig: {
    plantCode: string;
    storageLocationFg: string;
    storageLocationRm: string;
    costCenterCode: string;
    autoPushOnFqcRelease: boolean;
  };
}
