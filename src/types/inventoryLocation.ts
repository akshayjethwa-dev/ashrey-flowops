// src/types/inventoryLocation.ts

import { StockCategory } from '../types';

/**
 * Storage Store / Warehouse within a Plant
 * Hierarchy Level 2: Plant → [Store] → Bin
 */
export interface StorageStore {
  id: string;
  tenantId: string;
  plantId: string;
  plantName?: string;
  code: string;                 // e.g. "ST-RM01", "ST-FG01", "ST-SP01"
  name: string;                 // e.g. "Main Raw Materials Store"
  description?: string;
  type: 'raw_materials' | 'finished_goods' | 'wip_buffer' | 'spares_tooling' | 'consumables' | 'quarantine';
  managerName?: string;
  contactNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Physical Storage Bin, Rack, Pallet Bay, or Shelf within a Store
 * Hierarchy Level 3: Plant → Store → [Bin]
 */
export interface StorageBin {
  id: string;
  tenantId: string;
  plantId: string;
  storeId: string;
  storeName?: string;
  storeCode?: string;
  code: string;                 // e.g. "BIN-RM-A01", "RACK-FG-B04"
  name: string;                 // e.g. "Heavy Rod Bay A1", "High-Bay Pallet 04"
  aisle?: string;               // e.g. "Aisle 01"
  rack?: string;                // e.g. "Rack A"
  shelf?: string;               // e.g. "Tier 2"
  binType: 'pallet_bay' | 'heavy_rack' | 'cantilever' | 'shelf_bin' | 'safe_cabinet' | 'floor_staging';
  maxCapacityQty?: number;
  maxWeightKg?: number;
  currentOccupancyPct?: number; // 0 - 100
  isLocked?: boolean;           // Maintenance or quarantine lock
  lockReason?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Real-Time Inventory Record scoped to a specific Storage Bin
 * Provides the live distinction: On-Hand, Reserved, Available, On-Order, and Value
 */
export interface BinStockRecord {
  id: string;
  tenantId: string;
  stockItemId: string;          // Master SKU ID
  stockItemCode: string;        // e.g. "WR-1002"
  stockItemName: string;        // e.g. "Wire Rod — High Tensile Steel 8mm"
  category: StockCategory;
  
  // Location Hierarchy Mapping
  plantId: string;
  plantName: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  binId: string;
  binCode: string;
  binName: string;

  // Real-Time Quantities (Core Acceptance Criteria)
  onHandQty: number;            // Physical stock in bin
  reservedQty: number;          // Allocated to Work Orders / Sales Orders
  availableQty: number;         // Free to commit (onHandQty - reservedQty)
  onOrderQty: number;           // Inbound from approved POs / suppliers
  unit: string;                 // e.g. 'tonnes', 'units', 'litres', 'kg'

  // Financial Valuation (Acceptance Criteria)
  unitCost: number;             // Standard or weighted average cost in ₹
  onHandValue: number;          // onHandQty * unitCost
  reservedValue: number;        // reservedQty * unitCost
  availableValue: number;       // availableQty * unitCost
  onOrderValue: number;         // onOrderQty * unitCost

  // Safety & Stock Level Thresholds
  reorderLevel: number;
  minSafeQty?: number;
  maxSafeQty?: number;

  // Batch / Tracking
  lotNumber?: string;
  batchHeatNo?: string;
  expiryDate?: string;
  lastAuditedAt?: string;

  updatedAt: string;
  updatedBy?: string;
  updatedByName?: string;
}

/**
 * Material Reservation breakdown (Work Orders, Sales Orders, Subcontracting)
 */
export interface StockReservation {
  id: string;
  tenantId: string;
  binStockId: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  orderType: 'work_order' | 'sales_order' | 'subcontract_dispatch' | 'maintenance_hold';
  orderId: string;
  orderNumber: string;          // e.g. "WO-2026-001" or "SO-4819"
  targetPlantName?: string;
  reservedQty: number;
  unit: string;
  reservedBy: string;
  reservedByName: string;
  reservedAt: string;
  requiredDate?: string;
  status: 'active' | 'fulfilled' | 'released';
  notes?: string;
}

/**
 * Expected Inbound Purchase Orders (On-Order Breakdown)
 */
export interface StockInboundOrder {
  id: string;
  tenantId: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  poNumber: string;             // e.g. "PO-2026-902"
  supplierName: string;
  orderedQty: number;
  unit: string;
  unitCost: number;
  targetPlantId: string;
  targetPlantName: string;
  targetStoreId: string;
  targetStoreName: string;
  targetBinId?: string;
  targetBinCode?: string;
  expectedDeliveryDate: string;
  status: 'confirmed' | 'in_transit' | 'customs' | 'arrived_dock';
  createdDate: string;
}

/**
 * Inter-Location Stock Movement Audit Log (Transfers between Bins / Stores / Plants)
 */
export interface StockTransferRecord {
  id: string;
  tenantId: string;
  transferNumber: string;       // e.g. "TRF-2026-0042"
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  category: StockCategory;
  
  // Source Location
  sourcePlantId: string;
  sourcePlantName: string;
  sourceStoreId: string;
  sourceStoreName: string;
  sourceBinId: string;
  sourceBinCode: string;

  // Destination Location
  targetPlantId: string;
  targetPlantName: string;
  targetStoreId: string;
  targetStoreName: string;
  targetBinId: string;
  targetBinCode: string;

  qty: number;
  unit: string;
  unitCost: number;
  totalValue: number;

  reason: 'line_feed' | 'bin_optimization' | 'quarantine_move' | 'inter_plant_rebalance' | 'replenishment' | 'other';
  notes?: string;
  transferredBy: string;
  transferredByName: string;
  timestamp: string;
  status: 'completed' | 'in_transit' | 'cancelled';
}

/**
 * Aggregated Inventory Valuation and Quantities for a SKU across All Locations
 */
export interface SkuMultiLocationSummary {
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  category: StockCategory;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  
  // Aggregated totals across all locations
  totalOnHandQty: number;
  totalReservedQty: number;
  totalAvailableQty: number;
  totalOnOrderQty: number;

  // Financial values
  totalOnHandValue: number;
  totalReservedValue: number;
  totalAvailableValue: number;
  totalOnOrderValue: number;

  // Locations breakdown
  binRecords: BinStockRecord[];
  plantCount: number;
  storeCount: number;
  binCount: number;
  primaryLocationCode?: string;
  alertStatus: 'healthy' | 'warning' | 'critical' | 'overstock';
}

/**
 * Multi-Location Search & Hierarchy Filter Parameters
 */
export interface MultiLocationFilterParams {
  plantId?: string;             // 'all' or specific
  storeId?: string;             // 'all' or specific
  binId?: string;               // 'all' or specific
  category?: StockCategory | 'all';
  searchQuery?: string;
  availabilityStatus?: 'all' | 'in_stock' | 'low_available' | 'out_of_stock' | 'has_reserved' | 'has_on_order';
  sortBy?: 'name' | 'code' | 'value_desc' | 'available_asc' | 'on_hand_desc';
}

/**
 * Key Performance Indicators across the active location view
 */
export interface LocationInventoryKPIs {
  totalSkusCount: number;
  totalOnHandValue: number;
  totalReservedValue: number;
  totalAvailableValue: number;
  totalOnOrderValue: number;
  totalActiveLocationsCount: number;
  criticalAvailabilityCount: number;
  fullyAvailableCount: number;
  activeReservationsCount: number;
  pendingInboundPosCount: number;
}
