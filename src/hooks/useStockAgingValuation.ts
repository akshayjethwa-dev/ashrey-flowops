// src/hooks/useStockAgingValuation.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ItemStockValuationRecord,
  StockAgingSummary,
  StockAgingFilterParams,
  ValuationMethod,
  AgingBucketKey,
  LiquidationAction,
  WorkingCapitalTargetSimulation
} from '../types/stockAgingValuation';
import { stockAgingValuationService } from '../services/stockAgingValuationService';

export function useStockAgingValuation() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'tenant-default';

  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>(() => {
    return (localStorage.getItem(`flowops_val_method_${tenantId}`) as ValuationMethod) || 'fifo';
  });

  const [filters, setFilters] = useState<StockAgingFilterParams>({
    plantId: 'all',
    category: 'all',
    agingBucket: 'all',
    valuationMethod: 'fifo',
    slowMovingOnly: false,
    expiryAlertsOnly: false,
    searchQuery: ''
  });

  const [loading, setLoading] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // Sync valuation method into filters
  useEffect(() => {
    setFilters((prev) => ({ ...prev, valuationMethod }));
    localStorage.setItem(`flowops_val_method_${tenantId}`, valuationMethod);
  }, [valuationMethod, tenantId]);

  const { items, summary } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    dataVersion; // trigger recomputation on data update
    return stockAgingValuationService.getValuationData(tenantId, filters);
  }, [tenantId, filters, dataVersion]);

  const updateLiquidationAction = useCallback(
    (itemId: string, action: LiquidationAction, provisionRate?: number, notes?: string) => {
      stockAgingValuationService.updateItemAction(tenantId, itemId, action, provisionRate, notes);
      setDataVersion((v) => v + 1);
    },
    [tenantId]
  );

  const simulateWorkingCapital = useCallback(
    (pct90: number, pct60: number): WorkingCapitalTargetSimulation => {
      return stockAgingValuationService.simulateWorkingCapital(summary, pct90, pct60);
    },
    [summary]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      plantId: 'all',
      category: 'all',
      agingBucket: 'all',
      valuationMethod,
      slowMovingOnly: false,
      expiryAlertsOnly: false,
      searchQuery: ''
    });
  }, [valuationMethod]);

  const setAgingBucket = useCallback((bucket: string) => {
    setFilters((prev) => ({
      ...prev,
      agingBucket: prev.agingBucket === bucket ? 'all' : bucket
    }));
  }, []);

  const toggleSlowMovingOnly = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      slowMovingOnly: !prev.slowMovingOnly,
      expiryAlertsOnly: false
    }));
  }, []);

  const toggleExpiryAlertsOnly = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      expiryAlertsOnly: !prev.expiryAlertsOnly,
      slowMovingOnly: false
    }));
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setDataVersion((v) => v + 1);
      setLoading(false);
    }, 250);
  }, []);

  return {
    items,
    summary,
    valuationMethod,
    setValuationMethod,
    filters,
    setFilters,
    resetFilters,
    setAgingBucket,
    toggleSlowMovingOnly,
    toggleExpiryAlertsOnly,
    updateLiquidationAction,
    simulateWorkingCapital,
    loading,
    refresh
  };
}
