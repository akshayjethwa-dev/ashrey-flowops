// src/types/inventoryMovementSync.ts

export type InventoryMovementType = 
  | 'goods_receipt'          // Inward from supplier PO / GRN
  | 'material_issue'         // Outward to shopfloor Work Order / machine
  | 'finished_goods_receipt' // Completed production inward into FG Godown
  | 'stock_transfer';        // Inter-godown / inter-plant transfer

export type MovementSyncStatus = 
  | 'synced' 
  | 'pending' 
  | 'failed' 
  | 'retrying';

export type MovementSyncMode = 'real_time' | 'scheduled_batch';

export type InventoryErpSystem = 'tally' | 'oracle' | 'sap';

export interface MovementSyncError {
  errorCode: string;
  errorMessage: string;
  timestamp: string;
  attemptNumber: number;
  suggestedFix: string;
  canRetry: boolean;
}

export interface InventoryMovementSyncRecord {
  id: string;
  tenantId: string;
  movementNumber: string;        // e.g. "GRN-2026-0104", "ISS-2026-0812", "FGR-2026-0033"
  type: InventoryMovementType;
  referenceType: 'purchase_order' | 'work_order' | 'dispatch' | 'transfer' | 'manual';
  referenceNumber: string;       // e.g. "PO-2026-902", "WO-2026-0001", "TR-2026-0012"
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  uom: string;
  unitCostINR: number;
  totalValueINR: number;
  plantId: string;
  plantName: string;
  sourceLocation: string;        // e.g. "Vendor Inward Receiving Bay", "RM-MAIN-STORE", "WIP-CNC-01"
  targetLocation: string;        // e.g. "RM-BIN-104", "WIP-ASSEMBLY-BAY", "FG-CENTRAL-GODOWN"
  lotNumber: string;
  operatorName: string;
  operatorId: string;
  timestamp: string;
  erpSystem: InventoryErpSystem;
  status: MovementSyncStatus;
  syncMode: MovementSyncMode;
  
  // ERP Voucher reconciliation
  erpVoucherNumber?: string;     // e.g. "TALLY-RCPT-2026-9901", "ORA-INV-TXN-4410", "SAP-MATDOC-5000129"
  erpVoucherType?: string;       // e.g. "Receipt Note", "Material Issue", "Stock Journal", "Goods Receipt 101"
  syncedAt?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: MovementSyncError;
  payloadSnapshot?: string;      // XML or JSON payload snapshot
}

export interface InventoryMovementSyncStats {
  totalMovements: number;
  syncedCount: number;
  pendingCount: number;
  failedCount: number;
  totalValueSyncedINR: number;
  avgSyncLatencyMs: number;
  syncSuccessRatePct: number;
}

export interface InventoryMovementSyncConfig {
  syncMode: MovementSyncMode;
  batchIntervalMinutes: number;   // 15, 30, 60, 240 (shift-end)
  autoRetryFailed: boolean;
  maxAutoRetries: number;
  retryBackoffSeconds: number;
  erpSystem: InventoryErpSystem;
  notifyOnError: boolean;
  tallyGodownDefault: string;
  oracleSubinventoryDefault: string;
  sapStorageLocationDefault: string;
}
