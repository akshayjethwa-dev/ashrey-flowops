// src/types/salesOrderErpSync.ts

import { Order } from '../types';
import { WorkOrder } from './workOrder';

export type ErpSoImportStatus = 
  | 'pending_import' 
  | 'imported' 
  | 'wo_generated' 
  | 'cancelled';

export interface ErpSalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  uom: string;
  unitPrice: number;
  gstRatePct: number;
  lineTotal: number;
  matchedStockItemId?: string;
  hasBomInFlowOps: boolean;
  workOrderId?: string;
  workOrderNumber?: string;
}

export interface ErpSalesOrder {
  id: string;
  tenantId: string;
  erpSoNumber: string; // e.g. "SO-TALLY-2026-8810" or "ORA-SO-9041"
  erpSystem: 'tally' | 'oracle' | 'sap' | 'netsuite';
  customerPoNumber: string; // e.g. "PO-TATA-CVBU-8812"
  customerCode: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderDate: string;
  requestedDeliveryDate: string;
  currency: string;
  totalAmount: number;
  taxAmount: number;
  status: ErpSoImportStatus;
  priority: 'normal' | 'high' | 'urgent';
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  plantId?: string;
  items: ErpSalesOrderItem[];
  flowOpsOrderId?: string;
  flowOpsOrderNumber?: string;
  generatedWorkOrderNumbers?: string[];
  pulledAt: string;
  importedAt?: string;
}

export interface SalesOrderMappingResult {
  erpSo: ErpSalesOrder;
  flowOpsOrder: Order;
  matchedCustomer: boolean;
  matchedItemsCount: number;
  bomExploded: boolean;
  workOrdersGenerated: WorkOrder[];
}

export interface SalesOrderSyncStats {
  totalErpOrdersPulled: number;
  pendingImportCount: number;
  importedToFlowOpsCount: number;
  workOrdersGeneratedCount: number;
  totalValueINR: number;
}
