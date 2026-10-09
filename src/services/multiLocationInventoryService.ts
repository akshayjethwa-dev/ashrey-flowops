// src/services/multiLocationInventoryService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import {
  StorageStore,
  StorageBin,
  BinStockRecord,
  StockReservation,
  StockInboundOrder,
  StockTransferRecord,
  SkuMultiLocationSummary,
  MultiLocationFilterParams,
  LocationInventoryKPIs
} from '../types/inventoryLocation';
import { StockCategory, StockLedgerEntry } from '../types';

// ── DEFAULT SEED DATA FACTORIES ────────────────────────────────

export const SEED_STORAGE_STORES = (tenantId: string): StorageStore[] => [
  {
    id: 'store-pune-rm',
    tenantId,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    code: 'ST-RM01',
    name: 'Main Raw Materials Store',
    description: 'Billet, wire rod, and heavy bar stock warehouse with overhead crane',
    type: 'raw_materials',
    managerName: 'Rajesh Sharma (Store Supv.)',
    contactNumber: '+91 98230 11201',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'store-pune-fg',
    tenantId,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    code: 'ST-FG01',
    name: 'Finished Goods Warehouse',
    description: 'High-bay palletized warehouse for inspected forgings & finished crankshafts',
    type: 'finished_goods',
    managerName: 'Kavita Patil (Dispatch Head)',
    contactNumber: '+91 98230 11202',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'store-pune-sp',
    tenantId,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    code: 'ST-SP01',
    name: 'Tooling & Spares Crib',
    description: 'Secure humidity-controlled tooling vault for forging dies, fasteners & CNC spares',
    type: 'spares_tooling',
    managerName: 'Vikram Joshi (Tool Crib Lead)',
    contactNumber: '+91 98230 11203',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'store-pune-cn',
    tenantId,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    code: 'ST-CN01',
    name: 'Consumables & Lubricants Depot',
    description: 'Bunded fire-rated containment room for hydraulic oils, lubricants & coolants',
    type: 'consumables',
    managerName: 'Sunil Rao (Safety Officer)',
    contactNumber: '+91 98230 11204',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'store-vad-rm',
    tenantId,
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Foundry Works',
    code: 'ST-V-RM01',
    name: 'Foundry Scrap & Pig Iron Yard',
    description: 'Open gantry stockyard for pig iron charges, steel scrap & alloys',
    type: 'raw_materials',
    managerName: 'Bhavin Patel (Foundry Store)',
    contactNumber: '+91 98250 44301',
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  },
  {
    id: 'store-vad-fg',
    tenantId,
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Foundry Works',
    code: 'ST-V-FG01',
    name: 'Casting Dispatch Staging',
    description: 'Covered dispatch area for raw cast iron blocks & annealed components',
    type: 'finished_goods',
    managerName: 'Hitesh Solanki',
    contactNumber: '+91 98250 44302',
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  }
];

export const SEED_STORAGE_BINS = (tenantId: string): StorageBin[] => [
  // Pune Raw Materials Bins
  {
    id: 'bin-pune-rm-01',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-rm',
    storeCode: 'ST-RM01',
    storeName: 'Main Raw Materials Store',
    code: 'BIN-RM-A01',
    name: 'Heavy Rod Bay A1 (Coils & Wire)',
    aisle: 'Aisle 01',
    rack: 'Bay A',
    shelf: 'Ground Floor',
    binType: 'heavy_rack',
    maxCapacityQty: 50,
    maxWeightKg: 50000,
    currentOccupancyPct: 45,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-pune-rm-02',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-rm',
    storeCode: 'ST-RM01',
    storeName: 'Main Raw Materials Store',
    code: 'BIN-RM-A02',
    name: 'Billet Cantilever Rack A2',
    aisle: 'Aisle 01',
    rack: 'Cantilever A2',
    shelf: 'Tier 1 & 2',
    binType: 'cantilever',
    maxCapacityQty: 30,
    maxWeightKg: 30000,
    currentOccupancyPct: 60,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-pune-rm-03',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-rm',
    storeCode: 'ST-RM01',
    storeName: 'Main Raw Materials Store',
    code: 'BIN-RM-C01',
    name: 'Inspection Receiving Bay C1',
    aisle: 'Dock Inward',
    rack: 'Floor Area C',
    shelf: 'Ground',
    binType: 'floor_staging',
    maxCapacityQty: 25,
    maxWeightKg: 25000,
    currentOccupancyPct: 20,
    isLocked: false,
    createdAt: new Date().toISOString()
  },

  // Pune Finished Goods Bins
  {
    id: 'bin-pune-fg-01',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-fg',
    storeCode: 'ST-FG01',
    storeName: 'Finished Goods Warehouse',
    code: 'BIN-FG-H01',
    name: 'High-Bay Pallet Bay HP-01',
    aisle: 'Aisle 04',
    rack: 'High-Bay 1',
    shelf: 'Level 3',
    binType: 'pallet_bay',
    maxCapacityQty: 200,
    currentOccupancyPct: 55,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-pune-fg-02',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-fg',
    storeCode: 'ST-FG01',
    storeName: 'Finished Goods Warehouse',
    code: 'BIN-FG-D02',
    name: 'Dispatch Staging Bay DS-02',
    aisle: 'Outbound Bay',
    rack: 'Dock 2',
    shelf: 'Ground',
    binType: 'floor_staging',
    maxCapacityQty: 100,
    currentOccupancyPct: 30,
    isLocked: false,
    createdAt: new Date().toISOString()
  },

  // Pune Tooling & Spares Bins
  {
    id: 'bin-pune-sp-01',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-sp',
    storeCode: 'ST-SP01',
    storeName: 'Tooling & Spares Crib',
    code: 'BIN-SP-V01',
    name: 'Die Block Heavy Vault D-01',
    aisle: 'Vault Room',
    rack: 'Die Stand 1',
    shelf: 'Base',
    binType: 'heavy_rack',
    maxCapacityQty: 6,
    maxWeightKg: 12000,
    currentOccupancyPct: 40,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-pune-sp-02',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-sp',
    storeCode: 'ST-SP01',
    storeName: 'Tooling & Spares Crib',
    code: 'BIN-SP-H02',
    name: 'Hardware Bin Drawers Tier H-02',
    aisle: 'Drawer Unit 2',
    rack: 'Bin Cabinet',
    shelf: 'Drawer 04',
    binType: 'shelf_bin',
    maxCapacityQty: 2500,
    currentOccupancyPct: 75,
    isLocked: false,
    createdAt: new Date().toISOString()
  },

  // Pune Consumables Bins
  {
    id: 'bin-pune-cn-01',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-cn',
    storeCode: 'ST-CN01',
    storeName: 'Consumables & Lubricants Depot',
    code: 'BIN-CN-S01',
    name: 'Flammables Safe Cabinet SC-01',
    aisle: 'Hazard Zone A',
    rack: 'Safe Cabinet 1',
    shelf: 'Shelf 2',
    binType: 'safe_cabinet',
    maxCapacityQty: 120,
    currentOccupancyPct: 65,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-pune-cn-02',
    tenantId,
    plantId: 'plant-pune',
    storeId: 'store-pune-cn',
    storeCode: 'ST-CN01',
    storeName: 'Consumables & Lubricants Depot',
    code: 'BIN-CN-B02',
    name: 'Bunded Drum Pallet DP-02',
    aisle: 'Hazard Zone B',
    rack: 'Bund 2',
    shelf: 'Ground',
    binType: 'pallet_bay',
    maxCapacityQty: 4,
    currentOccupancyPct: 50,
    isLocked: false,
    createdAt: new Date().toISOString()
  },

  // Vadodara Bins
  {
    id: 'bin-vad-rm-01',
    tenantId,
    plantId: 'plant-vadodara',
    storeId: 'store-vad-rm',
    storeCode: 'ST-V-RM01',
    storeName: 'Foundry Scrap & Pig Iron Yard',
    code: 'BIN-VRM-B01',
    name: 'Pig Iron Bunker B-01',
    aisle: 'Yard A',
    rack: 'Bunker 1',
    shelf: 'Floor',
    binType: 'floor_staging',
    maxCapacityQty: 80,
    currentOccupancyPct: 35,
    isLocked: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bin-vad-fg-01',
    tenantId,
    plantId: 'plant-vadodara',
    storeId: 'store-vad-fg',
    storeCode: 'ST-V-FG01',
    storeName: 'Casting Dispatch Staging',
    code: 'BIN-VFG-D01',
    name: 'Raw Castings Pallet Bay 01',
    aisle: 'Covered Bay',
    rack: 'Rack V1',
    shelf: 'Ground',
    binType: 'pallet_bay',
    maxCapacityQty: 150,
    currentOccupancyPct: 50,
    isLocked: false,
    createdAt: new Date().toISOString()
  }
];

export const SEED_BIN_STOCK_RECORDS = (tenantId: string): BinStockRecord[] => [
  // 1. Wire Rod in Pune Heavy Rod Bay A1
  {
    id: 'binstock-wr-pune-01',
    tenantId,
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeCode: 'ST-RM01',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-01',
    binCode: 'BIN-RM-A01',
    binName: 'Heavy Rod Bay A1 (Coils & Wire)',
    onHandQty: 18.0,
    reservedQty: 6.0,
    availableQty: 12.0,
    onOrderQty: 15.0,
    unit: 'tonnes',
    unitCost: 68500, // ₹68,500 per tonne
    onHandValue: 18.0 * 68500,       // ₹12,33,000
    reservedValue: 6.0 * 68500,     // ₹4,11,000
    availableValue: 12.0 * 68500,   // ₹8,22,000
    onOrderValue: 15.0 * 68500,     // ₹10,27,500
    reorderLevel: 10.0,
    minSafeQty: 5.0,
    maxSafeQty: 40.0,
    lotNumber: 'LOT-2026-TATA-88',
    batchHeatNo: 'HEAT-HTS-992B',
    lastAuditedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Store Keeper'
  },

  // 1b. Wire Rod in Vadodara Bunker
  {
    id: 'binstock-wr-vad-01',
    tenantId,
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Foundry Works',
    storeId: 'store-vad-rm',
    storeCode: 'ST-V-RM01',
    storeName: 'Foundry Scrap & Pig Iron Yard',
    binId: 'bin-vad-rm-01',
    binCode: 'BIN-VRM-B01',
    binName: 'Pig Iron Bunker B-01',
    onHandQty: 7.0,
    reservedQty: 0.0,
    availableQty: 7.0,
    onOrderQty: 0.0,
    unit: 'tonnes',
    unitCost: 68500,
    onHandValue: 7.0 * 68500,
    reservedValue: 0,
    availableValue: 7.0 * 68500,
    onOrderValue: 0,
    reorderLevel: 5.0,
    minSafeQty: 2.0,
    maxSafeQty: 20.0,
    lotNumber: 'LOT-2026-VAD-12',
    lastAuditedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Bhavin Patel'
  },

  // 2. Forged Crankshaft in Pune Finished Goods HP-01
  {
    id: 'binstock-cs-pune-01',
    tenantId,
    stockItemId: 'stock-2',
    stockItemCode: 'CS-FC300',
    stockItemName: 'Forged Crankshaft — FC300 Machined',
    category: 'finished_goods',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-fg',
    storeCode: 'ST-FG01',
    storeName: 'Finished Goods Warehouse',
    binId: 'bin-pune-fg-01',
    binCode: 'BIN-FG-H01',
    binName: 'High-Bay Pallet Bay HP-01',
    onHandQty: 80,
    reservedQty: 45,
    availableQty: 35,
    onOrderQty: 0,
    unit: 'units',
    unitCost: 4800, // ₹4,800 per unit
    onHandValue: 80 * 4800,          // ₹3,84,000
    reservedValue: 45 * 4800,        // ₹2,16,000
    availableValue: 35 * 4800,       // ₹1,68,000
    onOrderValue: 0,
    reorderLevel: 100,
    minSafeQty: 30,
    maxSafeQty: 250,
    lotNumber: 'LOT-2026-FG-CRANK-09',
    lastAuditedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Auditor'
  },

  // 2b. Forged Crankshaft in Vadodara Staging
  {
    id: 'binstock-cs-vad-01',
    tenantId,
    stockItemId: 'stock-2',
    stockItemCode: 'CS-FC300',
    stockItemName: 'Forged Crankshaft — FC300 Machined',
    category: 'finished_goods',
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Foundry Works',
    storeId: 'store-vad-fg',
    storeCode: 'ST-V-FG01',
    storeName: 'Casting Dispatch Staging',
    binId: 'bin-vad-fg-01',
    binCode: 'BIN-VFG-D01',
    binName: 'Raw Castings Pallet Bay 01',
    onHandQty: 40,
    reservedQty: 10,
    availableQty: 30,
    onOrderQty: 50,
    unit: 'units',
    unitCost: 4800,
    onHandValue: 40 * 4800,          // ₹1,92,000
    reservedValue: 10 * 4800,        // ₹48,000
    availableValue: 30 * 4800,       // ₹1,44,000
    onOrderValue: 50 * 4800,         // ₹2,40,000
    reorderLevel: 50,
    lotNumber: 'LOT-2026-VAD-FG-04',
    lastAuditedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Hitesh Solanki'
  },

  // 3. Hydraulic Oil ISO 68 in Pune Safe Cabinet
  {
    id: 'binstock-ho-pune-01',
    tenantId,
    stockItemId: 'stock-3',
    stockItemCode: 'CO-HO68',
    stockItemName: 'Hydraulic Oil ISO 68 Premium',
    category: 'consumable',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-cn',
    storeCode: 'ST-CN01',
    storeName: 'Consumables & Lubricants Depot',
    binId: 'bin-pune-cn-01',
    binCode: 'BIN-CN-S01',
    binName: 'Flammables Safe Cabinet SC-01',
    onHandQty: 45,
    reservedQty: 20,
    availableQty: 25,
    onOrderQty: 100,
    unit: 'litres',
    unitCost: 340, // ₹340 per litre
    onHandValue: 45 * 340,           // ₹15,300
    reservedValue: 20 * 340,         // ₹6,800
    availableValue: 25 * 340,        // ₹8,500
    onOrderValue: 100 * 340,         // ₹34,000
    reorderLevel: 50,
    lotNumber: 'LOT-2026-CASTROL-01',
    lastAuditedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Plant Supervisor'
  },

  // 4. M12 Hex Bolts in Pune Hardware Bin Drawers
  {
    id: 'binstock-sp-pune-01',
    tenantId,
    stockItemId: 'stock-4',
    stockItemCode: 'SP-M12B',
    stockItemName: 'M12 Hex Bolts — Grade 8.8 High S',
    category: 'spare',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-sp',
    storeCode: 'ST-SP01',
    storeName: 'Tooling & Spares Crib',
    binId: 'bin-pune-sp-02',
    binCode: 'BIN-SP-H02',
    binName: 'Hardware Bin Drawers Tier H-02',
    onHandQty: 850,
    reservedQty: 300,
    availableQty: 550,
    onOrderQty: 1000,
    unit: 'units',
    unitCost: 22.50, // ₹22.50 each
    onHandValue: 850 * 22.50,        // ₹19,125
    reservedValue: 300 * 22.50,      // ₹6,750
    availableValue: 550 * 22.50,     // ₹12,375
    onOrderValue: 1000 * 22.50,      // ₹22,500
    reorderLevel: 500,
    lotNumber: 'LOT-2026-UNBRAKO-14',
    lastAuditedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Maintenance Eng.'
  },

  // 5. Forging Die Block H13 in Pune Die Vault
  {
    id: 'binstock-h13-pune-01',
    tenantId,
    stockItemId: 'stock-5',
    stockItemCode: 'SP-H13',
    stockItemName: 'Forging Die Block — H13 Chromium Die',
    category: 'spare',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-sp',
    storeCode: 'ST-SP01',
    storeName: 'Tooling & Spares Crib',
    binId: 'bin-pune-sp-01',
    binCode: 'BIN-SP-V01',
    binName: 'Die Block Heavy Vault D-01',
    onHandQty: 1,
    reservedQty: 1, // Completely reserved! Available = 0
    availableQty: 0,
    onOrderQty: 2,
    unit: 'units',
    unitCost: 145000, // ₹1,45,000 per block
    onHandValue: 1 * 145000,         // ₹1,45,000
    reservedValue: 1 * 145000,       // ₹1,45,000
    availableValue: 0,
    onOrderValue: 2 * 145000,        // ₹2,90,000
    reorderLevel: 2,
    lotNumber: 'DIE-CRANK-H13-2026-01',
    lastAuditedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Die Tooling Head'
  },

  // 6. Round Bars CS45 in Pune Billet Cantilever Rack
  {
    id: 'binstock-rb-pune-01',
    tenantId,
    stockItemId: 'stock-6',
    stockItemCode: 'RB-40CS',
    stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
    category: 'raw_material',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeCode: 'ST-RM01',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-02',
    binCode: 'BIN-RM-A02',
    binName: 'Billet Cantilever Rack A2',
    onHandQty: 8.5,
    reservedQty: 3.5,
    availableQty: 5.0,
    onOrderQty: 10.0,
    unit: 'tonnes',
    unitCost: 62000, // ₹62,000 per tonne
    onHandValue: 8.5 * 62000,        // ₹5,27,000
    reservedValue: 3.5 * 62000,      // ₹2,17,000
    availableValue: 5.0 * 62000,     // ₹3,10,000
    onOrderValue: 10.0 * 62000,      // ₹6,20,000
    reorderLevel: 12.0,
    lotNumber: 'LOT-2026-JSW-44',
    lastAuditedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: 'Procurement Specialist'
  }
];

export const SEED_STOCK_RESERVATIONS = (tenantId: string): StockReservation[] => [
  {
    id: 'res-wr-01',
    tenantId,
    binStockId: 'binstock-wr-pune-01',
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    orderType: 'work_order',
    orderId: 'wo-2026-001',
    orderNumber: 'WO-2026-001',
    targetPlantName: 'Pune Heavy Forge Facility',
    reservedQty: 6.0,
    unit: 'tonnes',
    reservedBy: 'usr-planner',
    reservedByName: 'Anil Deshmukh (Production Planner)',
    reservedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    requiredDate: new Date(Date.now() + 48 * 3600000).toISOString(),
    status: 'active',
    notes: 'Allocated for Front Axle Connecting Rod Forge run'
  },
  {
    id: 'res-cs-01',
    tenantId,
    binStockId: 'binstock-cs-pune-01',
    stockItemId: 'stock-2',
    stockItemCode: 'CS-FC300',
    stockItemName: 'Forged Crankshaft — FC300 Machined',
    orderType: 'sales_order',
    orderId: 'so-4819',
    orderNumber: 'SO-4819',
    targetPlantName: 'Pune Heavy Forge Facility',
    reservedQty: 45,
    unit: 'units',
    reservedBy: 'usr-sales',
    reservedByName: 'Meera Sengupta (Accounts Head)',
    reservedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    requiredDate: new Date(Date.now() + 24 * 3600000).toISOString(),
    status: 'active',
    notes: 'Locked for Tata Motors OEM Scheduled Shipment #89'
  },
  {
    id: 'res-cs-02',
    tenantId,
    binStockId: 'binstock-cs-vad-01',
    stockItemId: 'stock-2',
    stockItemCode: 'CS-FC300',
    stockItemName: 'Forged Crankshaft — FC300 Machined',
    orderType: 'sales_order',
    orderId: 'so-4822',
    orderNumber: 'SO-4822',
    targetPlantName: 'Vadodara Foundry Works',
    reservedQty: 10,
    unit: 'units',
    reservedBy: 'usr-sales',
    reservedByName: 'Meera Sengupta (Accounts Head)',
    reservedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    status: 'active',
    notes: 'Export inspection sample batch for Mahindra Defense'
  },
  {
    id: 'res-ho-01',
    tenantId,
    binStockId: 'binstock-ho-pune-01',
    stockItemId: 'stock-3',
    stockItemCode: 'CO-HO68',
    stockItemName: 'Hydraulic Oil ISO 68 Premium',
    orderType: 'maintenance_hold',
    orderId: 'pm-2026-press3',
    orderNumber: 'PM-PRESS-03',
    targetPlantName: 'Pune Heavy Forge Facility',
    reservedQty: 20,
    unit: 'litres',
    reservedBy: 'usr-maint',
    reservedByName: 'Suresh Patil (Maint. Head)',
    reservedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    status: 'active',
    notes: 'Preventive oil sump flush for 2000T Forging Press'
  },
  {
    id: 'res-h13-01',
    tenantId,
    binStockId: 'binstock-h13-pune-01',
    stockItemId: 'stock-5',
    stockItemCode: 'SP-H13',
    stockItemName: 'Forging Die Block — H13 Chromium Die',
    orderType: 'work_order',
    orderId: 'wo-2026-003',
    orderNumber: 'WO-2026-003',
    targetPlantName: 'Pune Heavy Forge Facility',
    reservedQty: 1,
    unit: 'units',
    reservedBy: 'usr-tooling',
    reservedByName: 'Die Tooling Head',
    reservedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'active',
    notes: 'Mounted on CNC Milling Center for Crankshaft Die Profile Refurbishment'
  },
  {
    id: 'res-rb-01',
    tenantId,
    binStockId: 'binstock-rb-pune-01',
    stockItemId: 'stock-6',
    stockItemCode: 'RB-40CS',
    stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
    orderType: 'work_order',
    orderId: 'wo-2026-002',
    orderNumber: 'WO-2026-002',
    targetPlantName: 'Pune Heavy Forge Facility',
    reservedQty: 3.5,
    unit: 'tonnes',
    reservedBy: 'usr-planner',
    reservedByName: 'Anil Deshmukh (Production Planner)',
    reservedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    status: 'active',
    notes: 'Allocated for Gearbox Shaft Turning batch #4'
  }
];

export const SEED_INBOUND_ORDERS = (tenantId: string): StockInboundOrder[] => [
  {
    id: 'po-in-01',
    tenantId,
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    poNumber: 'PO-2026-902',
    supplierName: 'Tata Prime Steel Ltd.',
    orderedQty: 15.0,
    unit: 'tonnes',
    unitCost: 68500,
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-rm',
    targetStoreName: 'Main Raw Materials Store',
    targetBinId: 'bin-pune-rm-01',
    targetBinCode: 'BIN-RM-A01',
    expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'in_transit',
    createdDate: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'po-in-02',
    tenantId,
    stockItemId: 'stock-3',
    stockItemCode: 'CO-HO68',
    stockItemName: 'Hydraulic Oil ISO 68 Premium',
    poNumber: 'PO-2026-881',
    supplierName: 'Castrol Industrial Lubricants',
    orderedQty: 100,
    unit: 'litres',
    unitCost: 340,
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-cn',
    targetStoreName: 'Consumables & Lubricants Depot',
    targetBinId: 'bin-pune-cn-01',
    targetBinCode: 'BIN-CN-S01',
    expectedDeliveryDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: 'confirmed',
    createdDate: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'po-in-03',
    tenantId,
    stockItemId: 'stock-4',
    stockItemCode: 'SP-M12B',
    stockItemName: 'M12 Hex Bolts — Grade 8.8 High S',
    poNumber: 'PO-2026-773',
    supplierName: 'Unbrako Fasteners India',
    orderedQty: 1000,
    unit: 'units',
    unitCost: 22.50,
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-sp',
    targetStoreName: 'Tooling & Spares Crib',
    targetBinId: 'bin-pune-sp-02',
    targetBinCode: 'BIN-SP-H02',
    expectedDeliveryDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'in_transit',
    createdDate: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'po-in-04',
    tenantId,
    stockItemId: 'stock-5',
    stockItemCode: 'SP-H13',
    stockItemName: 'Forging Die Block — H13 Chromium Die',
    poNumber: 'PO-2026-640',
    supplierName: 'Bharat Forge Tooling Division',
    orderedQty: 2,
    unit: 'units',
    unitCost: 145000,
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-sp',
    targetStoreName: 'Tooling & Spares Crib',
    targetBinId: 'bin-pune-sp-01',
    targetBinCode: 'BIN-SP-V01',
    expectedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'confirmed',
    createdDate: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'po-in-05',
    tenantId,
    stockItemId: 'stock-6',
    stockItemCode: 'RB-40CS',
    stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
    poNumber: 'PO-2026-591',
    supplierName: 'JSW Steel Limited',
    orderedQty: 10.0,
    unit: 'tonnes',
    unitCost: 62000,
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-rm',
    targetStoreName: 'Main Raw Materials Store',
    targetBinId: 'bin-pune-rm-02',
    targetBinCode: 'BIN-RM-A02',
    expectedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'in_transit',
    createdDate: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

export const SEED_TRANSFERS = (tenantId: string): StockTransferRecord[] => [
  {
    id: 'trf-001',
    tenantId,
    transferNumber: 'TRF-2026-0041',
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    sourcePlantId: 'plant-pune',
    sourcePlantName: 'Pune Heavy Forge Facility',
    sourceStoreId: 'store-pune-rm',
    sourceStoreName: 'Main Raw Materials Store',
    sourceBinId: 'bin-pune-rm-03',
    sourceBinCode: 'BIN-RM-C01',
    targetPlantId: 'plant-pune',
    targetPlantName: 'Pune Heavy Forge Facility',
    targetStoreId: 'store-pune-rm',
    targetStoreName: 'Main Raw Materials Store',
    targetBinId: 'bin-pune-rm-01',
    targetBinCode: 'BIN-RM-A01',
    qty: 5.0,
    unit: 'tonnes',
    unitCost: 68500,
    totalValue: 5.0 * 68500,
    reason: 'replenishment',
    notes: 'Moved inspected coil bundle from receiving bay to active crane bay',
    transferredBy: 'usr-store',
    transferredByName: 'Store Keeper',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'completed'
  }
];

// ── SERVICE IMPLEMENTATION ────────────────────────────────────

class MultiLocationInventoryService {
  private getStorageKey(tenantId: string, entity: string): string {
    return `flowops_ml_${entity}_${tenantId}`;
  }

  // ── Stores Management ───────────────────────────────────────
  async getStores(tenantId: string, plantId?: string): Promise<StorageStore[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'stores');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      let list: StorageStore[] = [];
      if (cached) {
        list = JSON.parse(cached);
      } else {
        list = SEED_STORAGE_STORES(tenantId);
        localStorage.setItem(key, JSON.stringify(list));
      }
      return plantId && plantId !== 'all' ? list.filter(s => s.plantId === plantId) : list;
    }

    try {
      const colRef = collection(db, 'tenants', tenantId, 'storageStores');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const seeds = SEED_STORAGE_STORES(tenantId);
        const batch = writeBatch(db);
        for (const s of seeds) {
          batch.set(doc(db, 'tenants', tenantId, 'storageStores', s.id), s);
        }
        await batch.commit();
        return plantId && plantId !== 'all' ? seeds.filter(s => s.plantId === plantId) : seeds;
      }
      const list: StorageStore[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as StorageStore));
      return plantId && plantId !== 'all' ? list.filter(s => s.plantId === plantId) : list;
    } catch (err) {
      console.warn('Firestore getStores error, falling back to local cache', err);
      const cached = localStorage.getItem(key);
      const list = cached ? JSON.parse(cached) : SEED_STORAGE_STORES(tenantId);
      return plantId && plantId !== 'all' ? list.filter((s: StorageStore) => s.plantId === plantId) : list;
    }
  }

  // ── Bins Management ─────────────────────────────────────────
  async getBins(tenantId: string, storeId?: string): Promise<StorageBin[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'bins');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      let list: StorageBin[] = [];
      if (cached) {
        list = JSON.parse(cached);
      } else {
        list = SEED_STORAGE_BINS(tenantId);
        localStorage.setItem(key, JSON.stringify(list));
      }
      return storeId && storeId !== 'all' ? list.filter(b => b.storeId === storeId) : list;
    }

    try {
      const colRef = collection(db, 'tenants', tenantId, 'storageBins');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const seeds = SEED_STORAGE_BINS(tenantId);
        const batch = writeBatch(db);
        for (const b of seeds) {
          batch.set(doc(db, 'tenants', tenantId, 'storageBins', b.id), b);
        }
        await batch.commit();
        return storeId && storeId !== 'all' ? seeds.filter(b => b.storeId === storeId) : seeds;
      }
      const list: StorageBin[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as StorageBin));
      return storeId && storeId !== 'all' ? list.filter(b => b.storeId === storeId) : list;
    } catch (err) {
      console.warn('Firestore getBins error, fallback local', err);
      const cached = localStorage.getItem(key);
      const list = cached ? JSON.parse(cached) : SEED_STORAGE_BINS(tenantId);
      return storeId && storeId !== 'all' ? list.filter((b: StorageBin) => b.storeId === storeId) : list;
    }
  }

  // ── Bin Stock Records (Live Quantities & Valuation) ──────────
  async getBinStockRecords(tenantId: string): Promise<BinStockRecord[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'bin_stock');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
      const seeds = SEED_BIN_STOCK_RECORDS(tenantId);
      localStorage.setItem(key, JSON.stringify(seeds));
      return seeds;
    }

    try {
      const colRef = collection(db, 'tenants', tenantId, 'binStockRecords');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const seeds = SEED_BIN_STOCK_RECORDS(tenantId);
        const batch = writeBatch(db);
        for (const r of seeds) {
          batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', r.id), r);
        }
        await batch.commit();
        return seeds;
      }
      const list: BinStockRecord[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as BinStockRecord));
      return list;
    } catch (err) {
      console.warn('Firestore getBinStockRecords error, fallback local', err);
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : SEED_BIN_STOCK_RECORDS(tenantId);
    }
  }

  // ── Reservations (Locked stock) ─────────────────────────────
  async getReservations(tenantId: string, stockItemId?: string): Promise<StockReservation[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'reservations');

    let list: StockReservation[] = [];
    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) {
        list = JSON.parse(cached);
      } else {
        list = SEED_STOCK_RESERVATIONS(tenantId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } else {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'stockReservations');
        const snap = await getDocs(colRef);
        if (snap.empty) {
          const seeds = SEED_STOCK_RESERVATIONS(tenantId);
          const batch = writeBatch(db);
          for (const res of seeds) {
            batch.set(doc(db, 'tenants', tenantId, 'stockReservations', res.id), res);
          }
          await batch.commit();
          list = seeds;
        } else {
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as StockReservation));
        }
      } catch (err) {
        const cached = localStorage.getItem(key);
        list = cached ? JSON.parse(cached) : SEED_STOCK_RESERVATIONS(tenantId);
      }
    }

    return stockItemId ? list.filter(r => r.stockItemId === stockItemId && r.status === 'active') : list;
  }

  // ── Inbound Orders (On-Order Pipeline) ───────────────────────
  async getInboundOrders(tenantId: string, stockItemId?: string): Promise<StockInboundOrder[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'inbound_orders');

    let list: StockInboundOrder[] = [];
    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) {
        list = JSON.parse(cached);
      } else {
        list = SEED_INBOUND_ORDERS(tenantId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } else {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'stockInboundOrders');
        const snap = await getDocs(colRef);
        if (snap.empty) {
          const seeds = SEED_INBOUND_ORDERS(tenantId);
          const batch = writeBatch(db);
          for (const o of seeds) {
            batch.set(doc(db, 'tenants', tenantId, 'stockInboundOrders', o.id), o);
          }
          await batch.commit();
          list = seeds;
        } else {
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as StockInboundOrder));
        }
      } catch (err) {
        const cached = localStorage.getItem(key);
        list = cached ? JSON.parse(cached) : SEED_INBOUND_ORDERS(tenantId);
      }
    }

    return stockItemId ? list.filter(o => o.stockItemId === stockItemId) : list;
  }

  // ── Transfer Audit History ──────────────────────────────────
  async getTransfers(tenantId: string): Promise<StockTransferRecord[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'transfers');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
      const seeds = SEED_TRANSFERS(tenantId);
      localStorage.setItem(key, JSON.stringify(seeds));
      return seeds;
    }

    try {
      const colRef = collection(db, 'tenants', tenantId, 'stockTransfers');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const seeds = SEED_TRANSFERS(tenantId);
        const batch = writeBatch(db);
        for (const t of seeds) {
          batch.set(doc(db, 'tenants', tenantId, 'stockTransfers', t.id), t);
        }
        await batch.commit();
        return seeds;
      }
      const list: StockTransferRecord[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as StockTransferRecord));
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : SEED_TRANSFERS(tenantId);
    }
  }

  // ── Aggregate SKU Multi-Location Summaries ───────────────────
  aggregateSkuSummaries(records: BinStockRecord[]): SkuMultiLocationSummary[] {
    const map = new Map<string, SkuMultiLocationSummary>();

    for (const r of records) {
      let existing = map.get(r.stockItemId);
      if (!existing) {
        existing = {
          stockItemId: r.stockItemId,
          stockItemCode: r.stockItemCode,
          stockItemName: r.stockItemName,
          category: r.category,
          unit: r.unit,
          unitCost: r.unitCost,
          reorderLevel: r.reorderLevel,
          totalOnHandQty: 0,
          totalReservedQty: 0,
          totalAvailableQty: 0,
          totalOnOrderQty: 0,
          totalOnHandValue: 0,
          totalReservedValue: 0,
          totalAvailableValue: 0,
          totalOnOrderValue: 0,
          binRecords: [],
          plantCount: 0,
          storeCount: 0,
          binCount: 0,
          alertStatus: 'healthy'
        };
        map.set(r.stockItemId, existing);
      }

      existing.totalOnHandQty += r.onHandQty;
      existing.totalReservedQty += r.reservedQty;
      existing.totalAvailableQty += r.availableQty;
      existing.totalOnOrderQty += r.onOrderQty;

      existing.totalOnHandValue += r.onHandValue;
      existing.totalReservedValue += r.reservedValue;
      existing.totalAvailableValue += r.availableValue;
      existing.totalOnOrderValue += r.onOrderValue;

      existing.binRecords.push(r);
    }

    const summaries = Array.from(map.values());
    for (const s of summaries) {
      const plantSet = new Set(s.binRecords.map(b => b.plantId));
      const storeSet = new Set(s.binRecords.map(b => b.storeId));
      s.plantCount = plantSet.size;
      s.storeCount = storeSet.size;
      s.binCount = s.binRecords.length;
      s.primaryLocationCode = s.binRecords[0]?.binCode;

      // Alert status calculation based on available vs reorder
      if (s.totalAvailableQty <= 0) {
        s.alertStatus = 'critical';
      } else if (s.totalAvailableQty <= s.reorderLevel) {
        s.alertStatus = 'warning';
      } else if (s.totalOnHandQty > s.reorderLevel * 4) {
        s.alertStatus = 'overstock';
      } else {
        s.alertStatus = 'healthy';
      }
    }

    return summaries;
  }

  // ── Calculate Live KPIs ───────────────────────────────────────
  calculateKPIs(records: BinStockRecord[], reservations: StockReservation[], inbound: StockInboundOrder[]): LocationInventoryKPIs {
    const skuSet = new Set<string>();
    const binSet = new Set<string>();

    let totalOnHandVal = 0;
    let totalReservedVal = 0;
    let totalAvailableVal = 0;
    let totalOnOrderVal = 0;
    let criticalCount = 0;
    let fullyAvailableCount = 0;

    const skuSummaries = this.aggregateSkuSummaries(records);

    for (const s of skuSummaries) {
      skuSet.add(s.stockItemId);
      totalOnHandVal += s.totalOnHandValue;
      totalReservedVal += s.totalReservedValue;
      totalAvailableVal += s.totalAvailableValue;
      totalOnOrderVal += s.totalOnOrderValue;

      if (s.alertStatus === 'critical' || s.totalAvailableQty <= 0) {
        criticalCount++;
      } else {
        fullyAvailableCount++;
      }
    }

    for (const r of records) {
      binSet.add(r.binId);
    }

    return {
      totalSkusCount: skuSet.size,
      totalOnHandValue: totalOnHandVal,
      totalReservedValue: totalReservedVal,
      totalAvailableValue: totalAvailableVal,
      totalOnOrderValue: totalOnOrderVal,
      totalActiveLocationsCount: binSet.size,
      criticalAvailabilityCount: criticalCount,
      fullyAvailableCount: fullyAvailableCount,
      activeReservationsCount: reservations.filter(x => x.status === 'active').length,
      pendingInboundPosCount: inbound.length
    };
  }

  // ── Filter and Search Engine ────────────────────────────────
  filterRecords(records: BinStockRecord[], params: MultiLocationFilterParams): BinStockRecord[] {
    return records.filter(r => {
      if (params.plantId && params.plantId !== 'all' && r.plantId !== params.plantId) {
        return false;
      }
      if (params.storeId && params.storeId !== 'all' && r.storeId !== params.storeId) {
        return false;
      }
      if (params.binId && params.binId !== 'all' && r.binId !== params.binId) {
        return false;
      }
      if (params.category && params.category !== 'all' && r.category !== params.category) {
        return false;
      }
      if (params.searchQuery && params.searchQuery.trim()) {
        const query = params.searchQuery.toLowerCase().trim();
        const matches =
          r.stockItemCode.toLowerCase().includes(query) ||
          r.stockItemName.toLowerCase().includes(query) ||
          r.binCode.toLowerCase().includes(query) ||
          r.binName.toLowerCase().includes(query) ||
          r.storeName.toLowerCase().includes(query) ||
          r.storeCode.toLowerCase().includes(query) ||
          (r.lotNumber && r.lotNumber.toLowerCase().includes(query));
        if (!matches) return false;
      }
      if (params.availabilityStatus && params.availabilityStatus !== 'all') {
        if (params.availabilityStatus === 'in_stock' && r.availableQty <= 0) return false;
        if (params.availabilityStatus === 'low_available' && (r.availableQty <= 0 || r.availableQty > r.reorderLevel)) return false;
        if (params.availabilityStatus === 'out_of_stock' && r.availableQty > 0) return false;
        if (params.availabilityStatus === 'has_reserved' && r.reservedQty <= 0) return false;
        if (params.availabilityStatus === 'has_on_order' && r.onOrderQty <= 0) return false;
      }
      return true;
    });
  }

  // ── Inter-Location Stock Transfer Execution ──────────────────
  async executeTransfer(
    tenantId: string,
    params: {
      stockItemId: string;
      sourceBinId: string;
      targetBinId: string;
      qty: number;
      reason: StockTransferRecord['reason'];
      notes?: string;
      userId: string;
      userName: string;
    }
  ): Promise<{ success: boolean; transfer: StockTransferRecord }> {
    if (params.qty <= 0) {
      throw new Error('Transfer quantity must be greater than zero.');
    }
    if (params.sourceBinId === params.targetBinId) {
      throw new Error('Source and destination bins must be different.');
    }

    const records = await this.getBinStockRecords(tenantId);
    const bins = await this.getBins(tenantId);
    const stores = await this.getStores(tenantId);

    const sourceRecordIndex = records.findIndex(
      r => r.stockItemId === params.stockItemId && r.binId === params.sourceBinId
    );
    if (sourceRecordIndex === -1) {
      throw new Error('Stock not found in source bin.');
    }

    const sourceRecord = records[sourceRecordIndex];
    if (sourceRecord.availableQty < params.qty) {
      throw new Error(
        `Cannot transfer ${params.qty} ${sourceRecord.unit}. Only ${sourceRecord.availableQty} ${sourceRecord.unit} is available (${sourceRecord.reservedQty} ${sourceRecord.unit} is reserved).`
      );
    }

    const targetBin = bins.find(b => b.id === params.targetBinId);
    if (!targetBin) {
      throw new Error('Target storage bin does not exist.');
    }
    const targetStore = stores.find(s => s.id === targetBin.storeId);
    if (!targetStore) {
      throw new Error('Target store does not exist.');
    }

    // Prepare transfer record
    const transferNumber = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transferRecord: StockTransferRecord = {
      id: `trf-${Date.now()}`,
      tenantId,
      transferNumber,
      stockItemId: sourceRecord.stockItemId,
      stockItemCode: sourceRecord.stockItemCode,
      stockItemName: sourceRecord.stockItemName,
      category: sourceRecord.category,
      sourcePlantId: sourceRecord.plantId,
      sourcePlantName: sourceRecord.plantName,
      sourceStoreId: sourceRecord.storeId,
      sourceStoreName: sourceRecord.storeName,
      sourceBinId: sourceRecord.binId,
      sourceBinCode: sourceRecord.binCode,
      targetPlantId: targetBin.plantId,
      targetPlantName: targetStore.plantName || sourceRecord.plantName,
      targetStoreId: targetStore.id,
      targetStoreName: targetStore.name,
      targetBinId: targetBin.id,
      targetBinCode: targetBin.code,
      qty: params.qty,
      unit: sourceRecord.unit,
      unitCost: sourceRecord.unitCost,
      totalValue: params.qty * sourceRecord.unitCost,
      reason: params.reason,
      notes: params.notes || `Transferred from ${sourceRecord.binCode} to ${targetBin.code}`,
      transferredBy: params.userId,
      transferredByName: params.userName,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // Deduct source
    sourceRecord.onHandQty = Number((sourceRecord.onHandQty - params.qty).toFixed(3));
    sourceRecord.availableQty = Math.max(0, Number((sourceRecord.onHandQty - sourceRecord.reservedQty).toFixed(3)));
    sourceRecord.onHandValue = sourceRecord.onHandQty * sourceRecord.unitCost;
    sourceRecord.availableValue = sourceRecord.availableQty * sourceRecord.unitCost;
    sourceRecord.updatedAt = new Date().toISOString();
    sourceRecord.updatedByName = params.userName;

    // Add or increment target record
    const targetRecordIndex = records.findIndex(
      r => r.stockItemId === params.stockItemId && r.binId === params.targetBinId
    );

    if (targetRecordIndex >= 0) {
      const targetRecord = records[targetRecordIndex];
      targetRecord.onHandQty = Number((targetRecord.onHandQty + params.qty).toFixed(3));
      targetRecord.availableQty = Math.max(0, Number((targetRecord.onHandQty - targetRecord.reservedQty).toFixed(3)));
      targetRecord.onHandValue = targetRecord.onHandQty * targetRecord.unitCost;
      targetRecord.availableValue = targetRecord.availableQty * targetRecord.unitCost;
      targetRecord.updatedAt = new Date().toISOString();
      targetRecord.updatedByName = params.userName;
    } else {
      // Create new bin stock record
      const newRecord: BinStockRecord = {
        id: `binstock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        stockItemId: sourceRecord.stockItemId,
        stockItemCode: sourceRecord.stockItemCode,
        stockItemName: sourceRecord.stockItemName,
        category: sourceRecord.category,
        plantId: targetBin.plantId,
        plantName: targetStore.plantName || sourceRecord.plantName,
        storeId: targetStore.id,
        storeCode: targetStore.code,
        storeName: targetStore.name,
        binId: targetBin.id,
        binCode: targetBin.code,
        binName: targetBin.name,
        onHandQty: params.qty,
        reservedQty: 0,
        availableQty: params.qty,
        onOrderQty: 0,
        unit: sourceRecord.unit,
        unitCost: sourceRecord.unitCost,
        onHandValue: params.qty * sourceRecord.unitCost,
        reservedValue: 0,
        availableValue: params.qty * sourceRecord.unitCost,
        onOrderValue: 0,
        reorderLevel: sourceRecord.reorderLevel,
        minSafeQty: sourceRecord.minSafeQty,
        maxSafeQty: sourceRecord.maxSafeQty,
        lotNumber: sourceRecord.lotNumber,
        lastAuditedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByName: params.userName
      };
      records.push(newRecord);
    }

    // Persist to storage
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const binStockKey = this.getStorageKey(tenantId, 'bin_stock');
    const transfersKey = this.getStorageKey(tenantId, 'transfers');

    localStorage.setItem(binStockKey, JSON.stringify(records));

    const existingTransfers = await this.getTransfers(tenantId);
    existingTransfers.unshift(transferRecord);
    localStorage.setItem(transfersKey, JSON.stringify(existingTransfers));

    // Also persist to Firestore if not sandbox
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        // Source
        batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', sourceRecord.id), sourceRecord);
        // Target
        if (targetRecordIndex >= 0) {
          batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', records[targetRecordIndex].id), records[targetRecordIndex]);
        } else {
          const newRec = records[records.length - 1];
          batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', newRec.id), newRec);
        }
        // Transfer record
        batch.set(doc(db, 'tenants', tenantId, 'stockTransfers', transferRecord.id), transferRecord);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore transfer batch commit error', err);
      }
    }

    // Notify listeners
    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { transfer: transferRecord } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));

    return { success: true, transfer: transferRecord };
  }

  // ── Allocate / Reserve Stock for Work Order or Sales Order ────
  async allocateReservation(
    tenantId: string,
    params: {
      binStockId: string;
      orderType: StockReservation['orderType'];
      orderId: string;
      orderNumber: string;
      qty: number;
      userId: string;
      userName: string;
      notes?: string;
    }
  ): Promise<StockReservation> {
    const records = await this.getBinStockRecords(tenantId);
    const recIndex = records.findIndex(r => r.id === params.binStockId);
    if (recIndex === -1) {
      throw new Error('Stock record not found for reservation.');
    }

    const rec = records[recIndex];
    if (rec.availableQty < params.qty) {
      throw new Error(`Cannot reserve ${params.qty} ${rec.unit}. Only ${rec.availableQty} ${rec.unit} is available.`);
    }

    const reservation: StockReservation = {
      id: `res-${Date.now()}`,
      tenantId,
      binStockId: rec.id,
      stockItemId: rec.stockItemId,
      stockItemCode: rec.stockItemCode,
      stockItemName: rec.stockItemName,
      orderType: params.orderType,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      targetPlantName: rec.plantName,
      reservedQty: params.qty,
      unit: rec.unit,
      reservedBy: params.userId,
      reservedByName: params.userName,
      reservedAt: new Date().toISOString(),
      status: 'active',
      notes: params.notes
    };

    // Update bin stock
    rec.reservedQty = Number((rec.reservedQty + params.qty).toFixed(3));
    rec.availableQty = Math.max(0, Number((rec.onHandQty - rec.reservedQty).toFixed(3)));
    rec.reservedValue = rec.reservedQty * rec.unitCost;
    rec.availableValue = rec.availableQty * rec.unitCost;
    rec.updatedAt = new Date().toISOString();
    rec.updatedByName = params.userName;

    // Save
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const binStockKey = this.getStorageKey(tenantId, 'bin_stock');
    const resKey = this.getStorageKey(tenantId, 'reservations');

    localStorage.setItem(binStockKey, JSON.stringify(records));

    const existingRes = await this.getReservations(tenantId);
    existingRes.unshift(reservation);
    localStorage.setItem(resKey, JSON.stringify(existingRes));

    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', rec.id), rec);
        batch.set(doc(db, 'tenants', tenantId, 'stockReservations', reservation.id), reservation);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore reservation save error', err);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { reservation } }));
    return reservation;
  }

  // ── Release Reservation ─────────────────────────────────────
  async releaseReservation(
    tenantId: string,
    reservationId: string,
    userName: string
  ): Promise<boolean> {
    const reservations = await this.getReservations(tenantId);
    const resIndex = reservations.findIndex(r => r.id === reservationId);
    if (resIndex === -1) throw new Error('Reservation not found.');

    const res = reservations[resIndex];
    if (res.status !== 'active') return false;

    res.status = 'released';

    // Release from bin stock
    const records = await this.getBinStockRecords(tenantId);
    const rec = records.find(r => r.id === res.binStockId);
    if (rec) {
      rec.reservedQty = Math.max(0, Number((rec.reservedQty - res.reservedQty).toFixed(3)));
      rec.availableQty = Math.max(0, Number((rec.onHandQty - rec.reservedQty).toFixed(3)));
      rec.reservedValue = rec.reservedQty * rec.unitCost;
      rec.availableValue = rec.availableQty * rec.unitCost;
      rec.updatedAt = new Date().toISOString();
      rec.updatedByName = userName;
    }

    // Persist
    const binStockKey = this.getStorageKey(tenantId, 'bin_stock');
    const resKey = this.getStorageKey(tenantId, 'reservations');
    localStorage.setItem(binStockKey, JSON.stringify(records));
    localStorage.setItem(resKey, JSON.stringify(reservations));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        if (rec) batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', rec.id), rec);
        batch.set(doc(db, 'tenants', tenantId, 'stockReservations', res.id), res);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore release reservation error', err);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { released: reservationId } }));
    return true;
  }

  // ── Adjust Bin Stock (Physical Count Variance) ───────────────
  async adjustBinStock(
    tenantId: string,
    params: {
      binStockId: string;
      newOnHandQty: number;
      reason: string;
      userName: string;
    }
  ): Promise<BinStockRecord> {
    if (params.newOnHandQty < 0) {
      throw new Error('On-hand quantity cannot be negative.');
    }

    const records = await this.getBinStockRecords(tenantId);
    const recIndex = records.findIndex(r => r.id === params.binStockId);
    if (recIndex === -1) throw new Error('Bin stock record not found.');

    const rec = records[recIndex];
    rec.onHandQty = Number(params.newOnHandQty.toFixed(3));
    rec.availableQty = Math.max(0, Number((rec.onHandQty - rec.reservedQty).toFixed(3)));
    rec.onHandValue = rec.onHandQty * rec.unitCost;
    rec.availableValue = rec.availableQty * rec.unitCost;
    rec.lastAuditedAt = new Date().toISOString();
    rec.updatedAt = new Date().toISOString();
    rec.updatedByName = params.userName;

    const binStockKey = this.getStorageKey(tenantId, 'bin_stock');
    localStorage.setItem(binStockKey, JSON.stringify(records));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        await updateDoc(doc(db, 'tenants', tenantId, 'binStockRecords', rec.id), { ...rec });
      } catch (err) {
        console.warn('Firestore adjust update error', err);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { adjusted: rec.id } }));
    return rec;
  }

  // ── Create Store ────────────────────────────────────────────
  async createStore(tenantId: string, store: Omit<StorageStore, 'id' | 'createdAt'>): Promise<StorageStore> {
    const id = `store-${Date.now()}`;
    const newStore: StorageStore = {
      id,
      ...store,
      createdAt: new Date().toISOString()
    };

    const stores = await this.getStores(tenantId);
    stores.push(newStore);
    localStorage.setItem(this.getStorageKey(tenantId, 'stores'), JSON.stringify(stores));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'storageStores', id), newStore);
      } catch (err) {
        console.warn('Firestore createStore error', err);
      }
    }

    return newStore;
  }

  // ── Create Bin ──────────────────────────────────────────────
  async createBin(tenantId: string, bin: Omit<StorageBin, 'id' | 'createdAt'>): Promise<StorageBin> {
    const id = `bin-${Date.now()}`;
    const newBin: StorageBin = {
      id,
      ...bin,
      createdAt: new Date().toISOString()
    };

    const bins = await this.getBins(tenantId);
    bins.push(newBin);
    localStorage.setItem(this.getStorageKey(tenantId, 'bins'), JSON.stringify(bins));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'storageBins', id), newBin);
      } catch (err) {
        console.warn('Firestore createBin error', err);
      }
    }

    return newBin;
  }
}

export const multiLocationInventoryService = new MultiLocationInventoryService();
