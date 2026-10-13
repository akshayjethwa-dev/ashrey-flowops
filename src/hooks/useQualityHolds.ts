// src/hooks/useQualityHolds.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { qualityHoldService } from '../services/qualityHoldService';
import {
  QualityHoldRecord,
  QualityHoldFilterOptions,
  QualityHoldKpis,
  DispatchHoldCheck,
  QualityHoldReleaseWorkflow
} from '../types/qualityHold';

export function useQualityHolds(initialFilters?: QualityHoldFilterOptions) {
  const [filters, setFilters] = useState<QualityHoldFilterOptions>(initialFilters || { status: 'all' });
  const [holds, setHolds] = useState<QualityHoldRecord[]>([]);
  const [kpis, setKpis] = useState<QualityHoldKpis>({
    totalHolds: 0,
    activeHolds: 0,
    releasedHolds: 0,
    quarantinedHolds: 0,
    avgAgingHours: 0,
    criticalActiveCount: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(() => {
    try {
      const data = qualityHoldService.getAllHolds(filters);
      const metrics = qualityHoldService.getKpis();
      setHolds(data);
      setKpis(metrics);
    } catch (e) {
      console.error('[useQualityHolds] Failed to fetch holds:', e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const placeHold = useCallback((params: Parameters<typeof qualityHoldService.placeHold>[0]) => {
    const record = qualityHoldService.placeHold(params);
    refresh();
    return record;
  }, [refresh]);

  const releaseHold = useCallback((holdId: string, releaseData: QualityHoldReleaseWorkflow) => {
    const record = qualityHoldService.releaseHold(holdId, releaseData);
    refresh();
    return record;
  }, [refresh]);

  const addHistoryNote = useCallback((holdId: string, actorName: string, actorRole: string, notes: string) => {
    const record = qualityHoldService.addHistoryNote(holdId, actorName, actorRole, notes);
    refresh();
    return record;
  }, [refresh]);

  const quarantineHold = useCallback((holdId: string, actorName: string, actorRole: string, newLocation: string, reason: string) => {
    const record = qualityHoldService.quarantineHold(holdId, actorName, actorRole, newLocation, reason);
    refresh();
    return record;
  }, [refresh]);

  const checkDispatchBlock = useCallback((orderIdOrNumber: string, woNumber?: string, batchNumber?: string): DispatchHoldCheck => {
    return qualityHoldService.checkDispatchBlock(orderIdOrNumber, woNumber, batchNumber);
  }, []);

  const exportCsv = useCallback(() => {
    qualityHoldService.exportCsv(filters);
  }, [filters]);

  return {
    holds,
    kpis,
    filters,
    setFilters,
    loading,
    refresh,
    placeHold,
    releaseHold,
    addHistoryNote,
    quarantineHold,
    checkDispatchBlock,
    exportCsv
  };
}
