// src/hooks/useMrpEngine.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  MrpPurchaseRecommendation,
  MrpRunRecord,
  MrpScheduleConfig,
  SafetyStockRule,
  MrpHorizon,
  MrpRunMode,
  MrpRecommendationUrgency,
  MrpRecommendationStatus
} from '../types/mrp';
import { mrpService } from '../services/mrpService';

export interface MrpFilterState {
  plantId: string;
  urgency: 'all' | MrpRecommendationUrgency;
  status: 'all' | MrpRecommendationStatus;
  searchQuery: string;
  horizonDays: MrpHorizon;
}

export function useMrpEngine(initialPlantId: string = 'all') {
  const { tenant, profile } = useAuth();
  const tenantId = tenant?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allRecommendations, setAllRecommendations] = useState<MrpPurchaseRecommendation[]>([]);
  const [runs, setRuns] = useState<MrpRunRecord[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<MrpScheduleConfig | null>(null);
  const [rules, setRules] = useState<SafetyStockRule[]>([]);

  const [filters, setFilters] = useState<MrpFilterState>({
    plantId: initialPlantId,
    urgency: 'all',
    status: 'pending',
    searchQuery: '',
    horizonDays: 30
  });

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [recs, runList, sched, ruleList] = await Promise.all([
        mrpService.getRecommendations(tenantId),
        mrpService.getRunHistory(tenantId),
        mrpService.getScheduleConfig(tenantId),
        mrpService.getSafetyStockRules(tenantId)
      ]);
      setAllRecommendations(recs);
      setRuns(runList);
      setScheduleConfig(sched);
      setRules(ruleList);
    } catch (err: any) {
      console.error('Failed to load MRP engine data', err);
      setError(err.message || 'Failed to load MRP data.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('flowops:mrp_updated', handleUpdate);
    window.addEventListener('flowops:multilocation_updated', handleUpdate);
    window.addEventListener('flowops:inventory_updated', handleUpdate);

    return () => {
      window.removeEventListener('flowops:mrp_updated', handleUpdate);
      window.removeEventListener('flowops:multilocation_updated', handleUpdate);
      window.removeEventListener('flowops:inventory_updated', handleUpdate);
    };
  }, [loadData]);

  // Execute manual MRP run
  const executeMrpRun = async (params: {
    plantId?: string;
    horizonDays?: MrpHorizon;
    safetyMultiplier?: number;
  }) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await mrpService.executeMrpRun(tenantId, {
        plantId: params.plantId || filters.plantId,
        horizonDays: params.horizonDays || filters.horizonDays,
        runMode: 'manual',
        safetyMultiplier: params.safetyMultiplier || 1.0,
        operatorId: profile?.uid || 'usr-procurement',
        operatorName: profile?.name || 'Procurement Manager'
      });
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'MRP calculation failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Convert recommendation to purchase order
  const convertToPo = async (
    recommendationId: string,
    params: {
      poNumber?: string;
      notes?: string;
    }
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await mrpService.convertRecommendationToPo(tenantId, recommendationId, {
        ...params,
        operatorName: profile?.name || 'Procurement Manager'
      });
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'PO conversion failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Dismiss recommendation
  const dismissRecommendation = async (recommendationId: string, reason: string) => {
    if (!tenantId) return;
    try {
      setSubmitting(true);
      await mrpService.dismissRecommendation(tenantId, recommendationId, reason);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  // Update schedule configuration
  const updateScheduleConfig = async (newConfig: MrpScheduleConfig) => {
    if (!tenantId) return;
    try {
      setSubmitting(true);
      await mrpService.saveScheduleConfig(tenantId, newConfig);
      setScheduleConfig(newConfig);
    } finally {
      setSubmitting(false);
    }
  };

  // Update safety stock rules
  const updateSafetyRules = async (newRules: SafetyStockRule[]) => {
    if (!tenantId) return;
    try {
      setSubmitting(true);
      await mrpService.saveSafetyStockRules(tenantId, newRules);
      setRules(newRules);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered recommendations
  const filteredRecommendations = useMemo(() => {
    return allRecommendations.filter((r) => {
      if (filters.plantId !== 'all' && r.plantId !== filters.plantId) return false;
      if (filters.urgency !== 'all' && r.urgency !== filters.urgency) return false;
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchCode = r.stockItemCode.toLowerCase().includes(q);
        const matchName = r.stockItemName.toLowerCase().includes(q);
        const matchSupplier = r.preferredSupplierName.toLowerCase().includes(q);
        const matchPo = r.poNumber?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchSupplier && !matchPo) return false;
      }
      return true;
    });
  }, [allRecommendations, filters]);

  // Latest run
  const latestRun = useMemo(() => {
    return runs.length > 0 ? runs[0] : null;
  }, [runs]);

  // KPIs
  const kpis = useMemo(() => {
    const active = allRecommendations.filter(r => r.status === 'pending');
    const totalSpend = active.reduce((sum, r) => sum + r.totalEstimatedCost, 0);
    const criticalCount = active.filter(r => r.urgency === 'critical').length;
    const highCount = active.filter(r => r.urgency === 'high').length;
    const convertedCount = allRecommendations.filter(r => r.status === 'po_created').length;

    return {
      totalRecommendedSpend: totalSpend,
      pendingRecommendationsCount: active.length,
      criticalShortagesCount: criticalCount,
      highUrgencyCount: highCount,
      convertedToPoCount: convertedCount,
      totalRunsExecuted: runs.length,
      horizonDays: filters.horizonDays
    };
  }, [allRecommendations, runs, filters.horizonDays]);

  return {
    recommendations: filteredRecommendations,
    allRecommendations,
    runs,
    latestRun,
    scheduleConfig,
    rules,
    filters,
    setFilters,
    loading,
    submitting,
    error,
    kpis,
    refresh: loadData,
    executeMrpRun,
    convertToPo,
    dismissRecommendation,
    updateScheduleConfig,
    updateSafetyRules
  };
}
