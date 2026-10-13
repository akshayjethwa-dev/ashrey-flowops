// src/hooks/useSupplierScorecards.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  SupplierWithMetrics,
  SupplierProfile,
  SupplierIncident,
  SupplierFilterState,
  SupplierTier,
  SupplierCategory
} from '../types/supplierScorecard';
import { supplierScorecardService } from '../services/supplierScorecardService';

export function useSupplierScorecards(initialPlantId: string = 'all') {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;

  const [suppliers, setSuppliers] = useState<SupplierWithMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SupplierFilterState>({
    category: 'all',
    tier: 'all',
    status: 'all',
    plantId: initialPlantId,
    searchQuery: '',
    sortBy: 'compositeScore',
    sortOrder: 'desc'
  });

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await supplierScorecardService.getAllSuppliersWithMetrics(tenantId);
      setSuppliers(data);
    } catch (err: any) {
      console.error('Failed to load supplier scorecards', err);
      setError(err.message || 'Failed to load supplier scorecards.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('flowops:suppliers_updated', handleUpdate);
    window.addEventListener('flowops:po_updated', handleUpdate);

    return () => {
      window.removeEventListener('flowops:suppliers_updated', handleUpdate);
      window.removeEventListener('flowops:po_updated', handleUpdate);
    };
  }, [loadData]);

  // Save supplier profile
  const saveSupplier = async (profileData: Partial<SupplierProfile>) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await supplierScorecardService.saveSupplier(tenantId, profileData);
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier profile');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Log incident
  const logIncident = async (incident: Omit<SupplierIncident, 'id'>) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      const res = await supplierScorecardService.logIncident(tenantId, incident);
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to log incident');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Update CAPA status
  const updateCapa = async (
    incidentId: string,
    capaStatus: SupplierIncident['capaStatus'],
    capaDoc?: string
  ) => {
    if (!tenantId) throw new Error('Tenant context missing');
    try {
      setSubmitting(true);
      setError(null);
      await supplierScorecardService.updateIncidentCapa(tenantId, incidentId, capaStatus, capaDoc);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update CAPA');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered and sorted suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers.filter((s) => {
      if (filters.category !== 'all' && s.category !== filters.category) return false;
      if (filters.tier !== 'all' && s.tier !== filters.tier) return false;
      if (filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.plantId !== 'all' && !s.primaryPlants.includes(filters.plantId)) return false;

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchGst = s.gstin.toLowerCase().includes(q);
        const matchContact = s.contactPerson.toLowerCase().includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchGst && !matchContact && !matchEmail) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (filters.sortBy) {
        case 'compositeScore':
          valA = a.metrics.compositeScore;
          valB = b.metrics.compositeScore;
          break;
        case 'otd':
          valA = a.metrics.onTimeDeliveryRatePct;
          valB = b.metrics.onTimeDeliveryRatePct;
          break;
        case 'quality':
          valA = a.metrics.qualityAcceptanceRatePct;
          valB = b.metrics.qualityAcceptanceRatePct;
          break;
        case 'responsiveness':
          valA = a.metrics.responsivenessScorePct;
          valB = b.metrics.responsivenessScorePct;
          break;
        case 'spend':
          valA = a.metrics.totalSpend;
          valB = b.metrics.totalSpend;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        default:
          valA = a.metrics.compositeScore;
          valB = b.metrics.compositeScore;
      }

      if (typeof valA === 'string') {
        return filters.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return filters.sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [suppliers, filters]);

  // Executive Sourcing KPIs
  const kpis = useMemo(() => {
    if (suppliers.length === 0) {
      return {
        totalSuppliersCount: 0,
        tier1Count: 0,
        fleetAvgOtd: 0,
        fleetAvgQuality: 0,
        fleetAvgResponsiveness: 0,
        atRiskSuppliersCount: 0,
        openCapasCount: 0,
        totalSpendManaged: 0
      };
    }

    const totalCount = suppliers.length;
    const tier1Count = suppliers.filter(s => s.tier === 'tier_1').length;
    const atRiskCount = suppliers.filter(s => s.metrics.compositeScore < 75).length;

    const sumOtd = suppliers.reduce((sum, s) => sum + s.metrics.onTimeDeliveryRatePct, 0);
    const sumQuality = suppliers.reduce((sum, s) => sum + s.metrics.qualityAcceptanceRatePct, 0);
    const sumResp = suppliers.reduce((sum, s) => sum + s.metrics.responsivenessScorePct, 0);
    const totalSpend = suppliers.reduce((sum, s) => sum + s.metrics.totalSpend, 0);

    const openCapas = suppliers.reduce((count, s) => {
      const pending = s.metrics.recentIncidents.filter(i => i.capaStatus !== 'resolved').length;
      return count + pending;
    }, 0);

    return {
      totalSuppliersCount: totalCount,
      tier1Count,
      fleetAvgOtd: Number((sumOtd / totalCount).toFixed(1)),
      fleetAvgQuality: Number((sumQuality / totalCount).toFixed(1)),
      fleetAvgResponsiveness: Number((sumResp / totalCount).toFixed(1)),
      atRiskSuppliersCount: atRiskCount,
      openCapasCount: openCapas,
      totalSpendManaged: totalSpend
    };
  }, [suppliers]);

  return {
    suppliers: filteredSuppliers,
    allSuppliers: suppliers,
    loading,
    submitting,
    error,
    filters,
    setFilters,
    kpis,
    refresh: loadData,
    saveSupplier,
    logIncident,
    updateCapa
  };
}
