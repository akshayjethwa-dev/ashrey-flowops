// src/hooks/useMultiLocationInventory.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
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
import { multiLocationInventoryService } from '../services/multiLocationInventoryService';
import { StockCategory } from '../types';

export const useMultiLocationInventory = (initialPlantId?: string) => {
  const { tenant, profile } = useAuth();
  const tenantId = tenant?.id;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stores, setStores] = useState<StorageStore[]>([]);
  const [bins, setBins] = useState<StorageBin[]>([]);
  const [binStockRecords, setBinStockRecords] = useState<BinStockRecord[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [inboundOrders, setInboundOrders] = useState<StockInboundOrder[]>([]);
  const [transfers, setTransfers] = useState<StockTransferRecord[]>([]);

  // Filter state
  const [filterParams, setFilterParams] = useState<MultiLocationFilterParams>({
    plantId: initialPlantId || 'all',
    storeId: 'all',
    binId: 'all',
    category: 'all',
    searchQuery: '',
    availabilityStatus: 'all',
    sortBy: 'value_desc'
  });

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [sList, bList, rList, resList, inList, trfList] = await Promise.all([
        multiLocationInventoryService.getStores(tenantId),
        multiLocationInventoryService.getBins(tenantId),
        multiLocationInventoryService.getBinStockRecords(tenantId),
        multiLocationInventoryService.getReservations(tenantId),
        multiLocationInventoryService.getInboundOrders(tenantId),
        multiLocationInventoryService.getTransfers(tenantId)
      ]);

      setStores(sList);
      setBins(bList);
      setBinStockRecords(rList);
      setReservations(resList);
      setInboundOrders(inList);
      setTransfers(trfList);
    } catch (err: any) {
      console.error('Failed to load multi-location inventory data', err);
      setError(err.message || 'Error syncing multi-location inventory records.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('flowops:multilocation_updated', handleUpdate);
    window.addEventListener('flowops:inventory_updated', handleUpdate);

    return () => {
      window.removeEventListener('flowops:multilocation_updated', handleUpdate);
      window.removeEventListener('flowops:inventory_updated', handleUpdate);
    };
  }, [loadData]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = multiLocationInventoryService.filterRecords(binStockRecords, filterParams);

    // Sorting
    if (filterParams.sortBy === 'value_desc') {
      result.sort((a, b) => b.onHandValue - a.onHandValue);
    } else if (filterParams.sortBy === 'available_asc') {
      result.sort((a, b) => a.availableQty - b.availableQty);
    } else if (filterParams.sortBy === 'on_hand_desc') {
      result.sort((a, b) => b.onHandQty - a.onHandQty);
    } else if (filterParams.sortBy === 'code') {
      result.sort((a, b) => a.stockItemCode.localeCompare(b.stockItemCode));
    } else if (filterParams.sortBy === 'name') {
      result.sort((a, b) => a.stockItemName.localeCompare(b.stockItemName));
    }

    return result;
  }, [binStockRecords, filterParams]);

  // Aggregated SKU summaries across all locations
  const skuSummaries = useMemo(() => {
    // If a plant filter is active, aggregate matching that plant
    const scopedRecords = filterParams.plantId && filterParams.plantId !== 'all'
      ? binStockRecords.filter(r => r.plantId === filterParams.plantId)
      : binStockRecords;
    
    let summaries = multiLocationInventoryService.aggregateSkuSummaries(scopedRecords);

    // Apply category & search filter to summaries
    if (filterParams.category && filterParams.category !== 'all') {
      summaries = summaries.filter(s => s.category === filterParams.category);
    }
    if (filterParams.searchQuery && filterParams.searchQuery.trim()) {
      const q = filterParams.searchQuery.toLowerCase().trim();
      summaries = summaries.filter(s =>
        s.stockItemCode.toLowerCase().includes(q) ||
        s.stockItemName.toLowerCase().includes(q)
      );
    }

    if (filterParams.availabilityStatus && filterParams.availabilityStatus !== 'all') {
      if (filterParams.availabilityStatus === 'in_stock') {
        summaries = summaries.filter(s => s.totalAvailableQty > 0);
      } else if (filterParams.availabilityStatus === 'low_available') {
        summaries = summaries.filter(s => s.totalAvailableQty <= s.reorderLevel && s.totalAvailableQty > 0);
      } else if (filterParams.availabilityStatus === 'out_of_stock') {
        summaries = summaries.filter(s => s.totalAvailableQty <= 0);
      } else if (filterParams.availabilityStatus === 'has_reserved') {
        summaries = summaries.filter(s => s.totalReservedQty > 0);
      } else if (filterParams.availabilityStatus === 'has_on_order') {
        summaries = summaries.filter(s => s.totalOnOrderQty > 0);
      }
    }

    if (filterParams.sortBy === 'value_desc') {
      summaries.sort((a, b) => b.totalOnHandValue - a.totalOnHandValue);
    } else if (filterParams.sortBy === 'available_asc') {
      summaries.sort((a, b) => a.totalAvailableQty - b.totalAvailableQty);
    } else if (filterParams.sortBy === 'on_hand_desc') {
      summaries.sort((a, b) => b.totalOnHandQty - a.totalOnHandQty);
    }

    return summaries;
  }, [binStockRecords, filterParams]);

  // KPIs
  const kpis: LocationInventoryKPIs = useMemo(() => {
    const scopedRecords = filterParams.plantId && filterParams.plantId !== 'all'
      ? binStockRecords.filter(r => r.plantId === filterParams.plantId)
      : binStockRecords;
    return multiLocationInventoryService.calculateKPIs(scopedRecords, reservations, inboundOrders);
  }, [binStockRecords, reservations, inboundOrders, filterParams.plantId]);

  // Filter setters
  const setPlantFilter = useCallback((plantId: string) => {
    setFilterParams(prev => ({
      ...prev,
      plantId,
      storeId: 'all', // reset child store/bin when plant changes
      binId: 'all'
    }));
  }, []);

  const setStoreFilter = useCallback((storeId: string) => {
    setFilterParams(prev => ({
      ...prev,
      storeId,
      binId: 'all' // reset child bin when store changes
    }));
  }, []);

  const setBinFilter = useCallback((binId: string) => {
    setFilterParams(prev => ({ ...prev, binId }));
  }, []);

  const setCategoryFilter = useCallback((category: StockCategory | 'all') => {
    setFilterParams(prev => ({ ...prev, category }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilterParams(prev => ({ ...prev, searchQuery }));
  }, []);

  // Actions
  const executeTransfer = useCallback(
    async (params: {
      stockItemId: string;
      sourceBinId: string;
      targetBinId: string;
      qty: number;
      reason: StockTransferRecord['reason'];
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const userId = profile?.uid || 'usr-current';
      const userName = profile?.name || 'Store Keeper';
      const res = await multiLocationInventoryService.executeTransfer(tenantId, {
        ...params,
        userId,
        userName
      });
      await loadData();
      return res;
    },
    [tenantId, profile, loadData]
  );

  const allocateReservation = useCallback(
    async (params: {
      binStockId: string;
      orderType: StockReservation['orderType'];
      orderId: string;
      orderNumber: string;
      qty: number;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const userId = profile?.uid || 'usr-current';
      const userName = profile?.name || 'Store Keeper';
      const res = await multiLocationInventoryService.allocateReservation(tenantId, {
        ...params,
        userId,
        userName
      });
      await loadData();
      return res;
    },
    [tenantId, profile, loadData]
  );

  const releaseReservation = useCallback(
    async (reservationId: string) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const userName = profile?.name || 'Store Keeper';
      const res = await multiLocationInventoryService.releaseReservation(tenantId, reservationId, userName);
      await loadData();
      return res;
    },
    [tenantId, profile, loadData]
  );

  const adjustBinStock = useCallback(
    async (params: { binStockId: string; newOnHandQty: number; reason: string }) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const userName = profile?.name || 'Store Keeper';
      const res = await multiLocationInventoryService.adjustBinStock(tenantId, {
        ...params,
        userName
      });
      await loadData();
      return res;
    },
    [tenantId, profile, loadData]
  );

  const createStore = useCallback(
    async (store: Omit<StorageStore, 'id' | 'createdAt'>) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const res = await multiLocationInventoryService.createStore(tenantId, store);
      await loadData();
      return res;
    },
    [tenantId, loadData]
  );

  const createBin = useCallback(
    async (bin: Omit<StorageBin, 'id' | 'createdAt'>) => {
      if (!tenantId) throw new Error('Tenant ID required');
      const res = await multiLocationInventoryService.createBin(tenantId, bin);
      await loadData();
      return res;
    },
    [tenantId, loadData]
  );

  return {
    stores,
    bins,
    binStockRecords,
    filteredRecords,
    skuSummaries,
    reservations,
    inboundOrders,
    transfers,
    kpis,
    loading,
    error,
    filterParams,
    setFilterParams,
    setPlantFilter,
    setStoreFilter,
    setBinFilter,
    setCategoryFilter,
    setSearchQuery,
    executeTransfer,
    allocateReservation,
    releaseReservation,
    adjustBinStock,
    createStore,
    createBin,
    refreshData: loadData
  };
};
