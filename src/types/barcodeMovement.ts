// src/types/barcodeMovement.ts

import { StockCategory } from '../types';

export type BarcodeMovementType = 'receive' | 'issue' | 'return';

export interface ScanMovementLog {
  id: string;
  tenantId: string;
  movementNumber: string;       // e.g. "BCM-2026-0042"
  type: BarcodeMovementType;    // 'receive' (inward against PO) | 'issue' (outward against WO) | 'return' (to stock)
  referenceType: 'purchase_order' | 'work_order' | 'manual';
  referenceNumber: string;      // e.g. "PO-2026-902" or "WO-2026-001"
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  category: StockCategory;
  qty: number;
  unit: string;
  unitCost: number;
  totalValue: number;

  // Location Hierarchy Mapping
  plantId: string;
  plantName: string;
  storeId: string;
  storeName: string;
  binId: string;
  binCode: string;

  // Tracking & Verification
  scannedBarcode: string;
  lotNumber?: string;
  issuedTo?: string;            // Machine code (e.g. "WC-CNC-003") or Operator
  returnReason?: 'unused_excess' | 'scrap' | 'quarantine_defect';
  notes?: string;

  operatorId: string;
  operatorName: string;
  timestamp: string;
  status: 'completed' | 'reversed';
}

export interface ScanToReceiveParams {
  poNumber: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  qty: number;
  targetBinId: string;
  lotNumber?: string;
  vendorChallanNo?: string;
  notes?: string;
  scannedBarcode?: string;
  operatorId: string;
  operatorName: string;
}

export interface ScanToIssueParams {
  woNumber: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  qty: number;
  sourceBinId: string;
  issuedToMachineOrOperator?: string;
  notes?: string;
  scannedBarcode?: string;
  operatorId: string;
  operatorName: string;
}

export interface ScanToReturnParams {
  woNumber?: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  qty: number;
  targetBinId: string;
  returnReason: 'unused_excess' | 'scrap' | 'quarantine_defect';
  notes?: string;
  scannedBarcode?: string;
  operatorId: string;
  operatorName: string;
}
