// src/services/barcodeMovementService.ts

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
  ScanMovementLog,
  ScanToReceiveParams,
  ScanToIssueParams,
  ScanToReturnParams
} from '../types/barcodeMovement';
import {
  BinStockRecord,
  StockInboundOrder,
  StorageStore,
  StorageBin,
  StockReservation
} from '../types/inventoryLocation';
import { StockItem, StockLedgerEntry } from '../types';
import { multiLocationInventoryService } from './multiLocationInventoryService';

export const SEED_SCAN_MOVEMENTS = (tenantId: string): ScanMovementLog[] => [
  {
    id: 'bcm-seed-01',
    tenantId,
    movementNumber: 'BCM-2026-0038',
    type: 'receive',
    referenceType: 'purchase_order',
    referenceNumber: 'PO-2026-902',
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    qty: 15.0,
    unit: 'tonnes',
    unitCost: 68500,
    totalValue: 15.0 * 68500,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-01',
    binCode: 'BIN-RM-A01',
    scannedBarcode: 'PO-2026-902',
    lotNumber: 'LOT-2026-TATA-88',
    notes: 'Received coil bundle from Tata Prime Steel challan #8819',
    operatorId: 'usr-store',
    operatorName: 'Store Keeper',
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
    status: 'completed'
  },
  {
    id: 'bcm-seed-02',
    tenantId,
    movementNumber: 'BCM-2026-0039',
    type: 'issue',
    referenceType: 'work_order',
    referenceNumber: 'WO-2026-001',
    stockItemId: 'stock-1',
    stockItemCode: 'WR-1002',
    stockItemName: 'Wire Rod — High Tensile Steel 8mm',
    category: 'raw_material',
    qty: 6.0,
    unit: 'tonnes',
    unitCost: 68500,
    totalValue: 6.0 * 68500,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-01',
    binCode: 'BIN-RM-A01',
    scannedBarcode: 'WO-2026-001',
    issuedTo: 'WC-FORGE-2000T (Press #1)',
    notes: 'Issued to forging cell for Connecting Rod run',
    operatorId: 'usr-store',
    operatorName: 'Store Keeper',
    timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
    status: 'completed'
  },
  {
    id: 'bcm-seed-03',
    tenantId,
    movementNumber: 'BCM-2026-0040',
    type: 'return',
    referenceType: 'work_order',
    referenceNumber: 'WO-2026-002',
    stockItemId: 'stock-6',
    stockItemCode: 'RB-40CS',
    stockItemName: 'Round Bars - Carbon Steel CS45 40mm',
    category: 'raw_material',
    qty: 0.8,
    unit: 'tonnes',
    unitCost: 62000,
    totalValue: 0.8 * 62000,
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge Facility',
    storeId: 'store-pune-rm',
    storeName: 'Main Raw Materials Store',
    binId: 'bin-pune-rm-02',
    binCode: 'BIN-RM-A02',
    scannedBarcode: 'MAT-RB-40CS',
    returnReason: 'unused_excess',
    notes: 'Uncut bar ends returned from Sawing machine #3',
    operatorId: 'usr-store',
    operatorName: 'Store Keeper',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    status: 'completed'
  }
];

class BarcodeMovementService {
  private getStorageKey(tenantId: string, entity: string): string {
    return `flowops_bcm_${entity}_${tenantId}`;
  }

  // ── Fetch Movement Logs ──────────────────────────────────────
  async getMovementLogs(tenantId: string): Promise<ScanMovementLog[]> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    const key = this.getStorageKey(tenantId, 'logs');

    if (isSandbox) {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
      const seeds = SEED_SCAN_MOVEMENTS(tenantId);
      localStorage.setItem(key, JSON.stringify(seeds));
      return seeds;
    }

    try {
      const colRef = collection(db, 'tenants', tenantId, 'barcodeMovementLogs');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const seeds = SEED_SCAN_MOVEMENTS(tenantId);
        const batch = writeBatch(db);
        for (const l of seeds) {
          batch.set(doc(db, 'tenants', tenantId, 'barcodeMovementLogs', l.id), l);
        }
        await batch.commit();
        return seeds;
      }
      const list: ScanMovementLog[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ScanMovementLog));
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : SEED_SCAN_MOVEMENTS(tenantId);
    }
  }

  // ── 1. Scan-to-Receive (Against PO) ──────────────────────────
  async executeScanToReceive(
    tenantId: string,
    params: ScanToReceiveParams
  ): Promise<{ success: boolean; log: ScanMovementLog }> {
    if (params.qty <= 0) {
      throw new Error('Received quantity must be greater than zero.');
    }

    const records = await multiLocationInventoryService.getBinStockRecords(tenantId);
    const bins = await multiLocationInventoryService.getBins(tenantId);
    const stores = await multiLocationInventoryService.getStores(tenantId);
    const inbounds = await multiLocationInventoryService.getInboundOrders(tenantId);

    const targetBin = bins.find(b => b.id === params.targetBinId);
    if (!targetBin) throw new Error('Target destination bin was not found.');
    const targetStore = stores.find(s => s.id === targetBin.storeId);
    if (!targetStore) throw new Error('Target warehouse store was not found.');

    // Look for matching PO
    const matchedPo = inbounds.find(
      p => p.poNumber.toUpperCase() === params.poNumber.toUpperCase() &&
      p.stockItemId === params.stockItemId
    );

    const unitCost = matchedPo?.unitCost || 68500;
    const category = matchedPo ? ('raw_material' as const) : 'raw_material';

    // Update target bin stock record
    let targetRec = records.find(
      r => r.stockItemId === params.stockItemId && r.binId === params.targetBinId
    );

    if (targetRec) {
      targetRec.onHandQty = Number((targetRec.onHandQty + params.qty).toFixed(3));
      targetRec.availableQty = Math.max(0, Number((targetRec.onHandQty - targetRec.reservedQty).toFixed(3)));
      targetRec.onHandValue = targetRec.onHandQty * targetRec.unitCost;
      targetRec.availableValue = targetRec.availableQty * targetRec.unitCost;
      targetRec.lastAuditedAt = new Date().toISOString();
      targetRec.updatedAt = new Date().toISOString();
      targetRec.updatedByName = params.operatorName;
      if (params.lotNumber) targetRec.lotNumber = params.lotNumber;
    } else {
      targetRec = {
        id: `binstock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        stockItemId: params.stockItemId,
        stockItemCode: params.stockItemCode,
        stockItemName: params.stockItemName,
        category: category,
        plantId: targetBin.plantId,
        plantName: targetStore.plantName || 'Plant Facility',
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
        unit: matchedPo?.unit || 'tonnes',
        unitCost: unitCost,
        onHandValue: params.qty * unitCost,
        reservedValue: 0,
        availableValue: params.qty * unitCost,
        onOrderValue: 0,
        reorderLevel: 10,
        lotNumber: params.lotNumber,
        lastAuditedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByName: params.operatorName
      };
      records.push(targetRec);
    }

    // Decrement on-order on inbound PO if matched
    if (matchedPo) {
      matchedPo.orderedQty = Math.max(0, Number((matchedPo.orderedQty - params.qty).toFixed(3)));
      if (matchedPo.orderedQty <= 0) {
        matchedPo.status = 'arrived_dock';
      }
      localStorage.setItem(
        `flowops_ml_inbound_orders_${tenantId}`,
        JSON.stringify(inbounds)
      );
    }

    // Also update all matching bin records' onOrderQty for this stock item
    for (const r of records) {
      if (r.stockItemId === params.stockItemId) {
        r.onOrderQty = Math.max(0, Number((r.onOrderQty - params.qty).toFixed(3)));
        r.onOrderValue = r.onOrderQty * r.unitCost;
      }
    }

    // Prepare Movement Log
    const movementNumber = `BCM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const log: ScanMovementLog = {
      id: `bcm-${Date.now()}`,
      tenantId,
      movementNumber,
      type: 'receive',
      referenceType: 'purchase_order',
      referenceNumber: params.poNumber.toUpperCase(),
      stockItemId: params.stockItemId,
      stockItemCode: params.stockItemCode,
      stockItemName: params.stockItemName,
      category: targetRec.category,
      qty: params.qty,
      unit: targetRec.unit,
      unitCost: targetRec.unitCost,
      totalValue: params.qty * targetRec.unitCost,
      plantId: targetBin.plantId,
      plantName: targetStore.plantName || targetRec.plantName,
      storeId: targetStore.id,
      storeName: targetStore.name,
      binId: targetBin.id,
      binCode: targetBin.code,
      scannedBarcode: params.scannedBarcode || params.poNumber,
      lotNumber: params.lotNumber,
      notes: params.notes || `Received against PO #${params.poNumber.toUpperCase()}${params.vendorChallanNo ? ` (Challan: ${params.vendorChallanNo})` : ''}`,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // Save records
    localStorage.setItem(
      `flowops_ml_bin_stock_${tenantId}`,
      JSON.stringify(records)
    );

    const logs = await this.getMovementLogs(tenantId);
    logs.unshift(log);
    localStorage.setItem(this.getStorageKey(tenantId, 'logs'), JSON.stringify(logs));

    // Also update classic stockItems list if exists
    try {
      const stockKey = `stock_items_${tenantId}`;
      const rawStock = localStorage.getItem(stockKey);
      if (rawStock) {
        const stockItems: StockItem[] = JSON.parse(rawStock);
        const match = stockItems.find(i => i.id === params.stockItemId || i.code === params.stockItemCode);
        if (match) {
          match.currentQty = Number((match.currentQty + params.qty).toFixed(3));
          match.lastUpdated = new Date().toISOString();
          match.updatedByName = params.operatorName;
          localStorage.setItem(stockKey, JSON.stringify(stockItems));
        }
      }
    } catch {}

    // Firestore persistence
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', targetRec.id), targetRec);
        batch.set(doc(db, 'tenants', tenantId, 'barcodeMovementLogs', log.id), log);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore receive batch commit error', err);
      }
    }

    // Trigger cross-component reactive updates
    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { received: log } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));

    return { success: true, log };
  }

  // ── 2. Scan-to-Issue (Against WO) ────────────────────────────
  async executeScanToIssue(
    tenantId: string,
    params: ScanToIssueParams
  ): Promise<{ success: boolean; log: ScanMovementLog }> {
    if (params.qty <= 0) {
      throw new Error('Issued quantity must be greater than zero.');
    }

    const records = await multiLocationInventoryService.getBinStockRecords(tenantId);
    const reservations = await multiLocationInventoryService.getReservations(tenantId);

    const sourceRec = records.find(
      r => r.stockItemId === params.stockItemId && r.binId === params.sourceBinId
    );
    if (!sourceRec) {
      throw new Error('Material not found in the specified source bin.');
    }

    if (sourceRec.onHandQty < params.qty) {
      throw new Error(
        `Insufficient stock in ${sourceRec.binCode}. On-hand is ${sourceRec.onHandQty} ${sourceRec.unit}, but tried to issue ${params.qty} ${sourceRec.unit}.`
      );
    }

    // Deduct physical on-hand from source bin
    sourceRec.onHandQty = Number((sourceRec.onHandQty - params.qty).toFixed(3));

    // Also deduct reservation if this Work Order has an active reservation
    const matchingRes = reservations.find(
      res => res.status === 'active' &&
      res.orderNumber.toUpperCase() === params.woNumber.toUpperCase() &&
      res.stockItemId === params.stockItemId
    );

    if (matchingRes) {
      const deduction = Math.min(matchingRes.reservedQty, params.qty);
      matchingRes.reservedQty = Number((matchingRes.reservedQty - deduction).toFixed(3));
      if (matchingRes.reservedQty <= 0) {
        matchingRes.status = 'fulfilled';
      }
      sourceRec.reservedQty = Math.max(0, Number((sourceRec.reservedQty - deduction).toFixed(3)));
      localStorage.setItem(
        `flowops_ml_reservations_${tenantId}`,
        JSON.stringify(reservations)
      );
    }

    sourceRec.availableQty = Math.max(0, Number((sourceRec.onHandQty - sourceRec.reservedQty).toFixed(3)));
    sourceRec.onHandValue = sourceRec.onHandQty * sourceRec.unitCost;
    sourceRec.availableValue = sourceRec.availableQty * sourceRec.unitCost;
    sourceRec.reservedValue = sourceRec.reservedQty * sourceRec.unitCost;
    sourceRec.updatedAt = new Date().toISOString();
    sourceRec.updatedByName = params.operatorName;

    // Prepare Movement Log
    const movementNumber = `BCM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const log: ScanMovementLog = {
      id: `bcm-${Date.now()}`,
      tenantId,
      movementNumber,
      type: 'issue',
      referenceType: 'work_order',
      referenceNumber: params.woNumber.toUpperCase(),
      stockItemId: sourceRec.stockItemId,
      stockItemCode: sourceRec.stockItemCode,
      stockItemName: sourceRec.stockItemName,
      category: sourceRec.category,
      qty: params.qty,
      unit: sourceRec.unit,
      unitCost: sourceRec.unitCost,
      totalValue: params.qty * sourceRec.unitCost,
      plantId: sourceRec.plantId,
      plantName: sourceRec.plantName,
      storeId: sourceRec.storeId,
      storeName: sourceRec.storeName,
      binId: sourceRec.binId,
      binCode: sourceRec.binCode,
      scannedBarcode: params.scannedBarcode || params.woNumber,
      issuedTo: params.issuedToMachineOrOperator || 'Shopfloor Machine',
      notes: params.notes || `Issued to Work Order #${params.woNumber.toUpperCase()}`,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // Save
    localStorage.setItem(
      `flowops_ml_bin_stock_${tenantId}`,
      JSON.stringify(records)
    );

    const logs = await this.getMovementLogs(tenantId);
    logs.unshift(log);
    localStorage.setItem(this.getStorageKey(tenantId, 'logs'), JSON.stringify(logs));

    // Deduct classic stockItems master
    try {
      const stockKey = `stock_items_${tenantId}`;
      const rawStock = localStorage.getItem(stockKey);
      if (rawStock) {
        const stockItems: StockItem[] = JSON.parse(rawStock);
        const match = stockItems.find(i => i.id === params.stockItemId || i.code === params.stockItemCode);
        if (match) {
          match.currentQty = Math.max(0, Number((match.currentQty - params.qty).toFixed(3)));
          match.lastUpdated = new Date().toISOString();
          match.updatedByName = params.operatorName;
          localStorage.setItem(stockKey, JSON.stringify(stockItems));
        }
      }
    } catch {}

    // Firestore
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', sourceRec.id), sourceRec);
        batch.set(doc(db, 'tenants', tenantId, 'barcodeMovementLogs', log.id), log);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore issue batch commit error', err);
      }
    }

    // Events
    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { issued: log } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));
    window.dispatchEvent(new Event('flowops:workorders_updated'));

    return { success: true, log };
  }

  // ── 3. Scan-to-Return (Return to Stock) ───────────────────────
  async executeScanToReturn(
    tenantId: string,
    params: ScanToReturnParams
  ): Promise<{ success: boolean; log: ScanMovementLog }> {
    if (params.qty <= 0) {
      throw new Error('Return quantity must be greater than zero.');
    }

    const records = await multiLocationInventoryService.getBinStockRecords(tenantId);
    const bins = await multiLocationInventoryService.getBins(tenantId);
    const stores = await multiLocationInventoryService.getStores(tenantId);

    const targetBin = bins.find(b => b.id === params.targetBinId);
    if (!targetBin) throw new Error('Target return storage bin not found.');
    const targetStore = stores.find(s => s.id === targetBin.storeId);
    if (!targetStore) throw new Error('Target warehouse store not found.');

    let targetRec = records.find(
      r => r.stockItemId === params.stockItemId && r.binId === params.targetBinId
    );

    if (targetRec) {
      targetRec.onHandQty = Number((targetRec.onHandQty + params.qty).toFixed(3));
      targetRec.availableQty = Math.max(0, Number((targetRec.onHandQty - targetRec.reservedQty).toFixed(3)));
      targetRec.onHandValue = targetRec.onHandQty * targetRec.unitCost;
      targetRec.availableValue = targetRec.availableQty * targetRec.unitCost;
      targetRec.lastAuditedAt = new Date().toISOString();
      targetRec.updatedAt = new Date().toISOString();
      targetRec.updatedByName = params.operatorName;
    } else {
      const unitCost = 68500;
      targetRec = {
        id: `binstock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        stockItemId: params.stockItemId,
        stockItemCode: params.stockItemCode,
        stockItemName: params.stockItemName,
        category: 'raw_material',
        plantId: targetBin.plantId,
        plantName: targetStore.plantName || 'Plant Facility',
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
        unit: 'tonnes',
        unitCost: unitCost,
        onHandValue: params.qty * unitCost,
        reservedValue: 0,
        availableValue: params.qty * unitCost,
        onOrderValue: 0,
        reorderLevel: 10,
        lastAuditedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByName: params.operatorName
      };
      records.push(targetRec);
    }

    // Movement Log
    const movementNumber = `BCM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const log: ScanMovementLog = {
      id: `bcm-${Date.now()}`,
      tenantId,
      movementNumber,
      type: 'return',
      referenceType: params.woNumber ? 'work_order' : 'manual',
      referenceNumber: params.woNumber ? params.woNumber.toUpperCase() : 'RETURN-STOCK',
      stockItemId: targetRec.stockItemId,
      stockItemCode: targetRec.stockItemCode,
      stockItemName: targetRec.stockItemName,
      category: targetRec.category,
      qty: params.qty,
      unit: targetRec.unit,
      unitCost: targetRec.unitCost,
      totalValue: params.qty * targetRec.unitCost,
      plantId: targetBin.plantId,
      plantName: targetStore.plantName || targetRec.plantName,
      storeId: targetStore.id,
      storeName: targetStore.name,
      binId: targetBin.id,
      binCode: targetBin.code,
      scannedBarcode: params.scannedBarcode || targetRec.stockItemCode,
      returnReason: params.returnReason,
      notes: params.notes || `Returned to stock (${params.returnReason.replace(/_/g, ' ')})`,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // Save
    localStorage.setItem(
      `flowops_ml_bin_stock_${tenantId}`,
      JSON.stringify(records)
    );

    const logs = await this.getMovementLogs(tenantId);
    logs.unshift(log);
    localStorage.setItem(this.getStorageKey(tenantId, 'logs'), JSON.stringify(logs));

    // Increment classic stockItems master
    try {
      const stockKey = `stock_items_${tenantId}`;
      const rawStock = localStorage.getItem(stockKey);
      if (rawStock) {
        const stockItems: StockItem[] = JSON.parse(rawStock);
        const match = stockItems.find(i => i.id === params.stockItemId || i.code === params.stockItemCode);
        if (match) {
          match.currentQty = Number((match.currentQty + params.qty).toFixed(3));
          match.lastUpdated = new Date().toISOString();
          match.updatedByName = params.operatorName;
          localStorage.setItem(stockKey, JSON.stringify(stockItems));
        }
      }
    } catch {}

    // Firestore
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'tenants', tenantId, 'binStockRecords', targetRec.id), targetRec);
        batch.set(doc(db, 'tenants', tenantId, 'barcodeMovementLogs', log.id), log);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore return batch commit error', err);
      }
    }

    // Events
    window.dispatchEvent(new CustomEvent('flowops:multilocation_updated', { detail: { returned: log } }));
    window.dispatchEvent(new Event('flowops:inventory_updated'));

    return { success: true, log };
  }
}

export const barcodeMovementService = new BarcodeMovementService();
