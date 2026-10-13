// src/hooks/useGageCalibration.ts

import { useState, useEffect, useCallback } from 'react';
import {
  GageInstrument,
  CalibrationRecord,
  GageKpiSummary,
  GageFilterOptions
} from '../types/gageCalibration';
import { gageService } from '../services/gageService';

export function useGageCalibration(initialFilter?: GageFilterOptions) {
  const [filter, setFilter] = useState<GageFilterOptions>(initialFilter || {
    status: 'all',
    type: 'all',
    dueWindow: 'all'
  });
  const [gages, setGages] = useState<GageInstrument[]>([]);
  const [allGages, setAllGages] = useState<GageInstrument[]>([]);
  const [kpis, setKpis] = useState<GageKpiSummary | null>(null);
  const [alerts, setAlerts] = useState<{ expired: GageInstrument[]; dueSoon: GageInstrument[] }>({
    expired: [],
    dueSoon: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(() => {
    try {
      const fullList = gageService.getGages();
      setAllGages(fullList);
      const filteredList = gageService.getGages(filter);
      setGages(filteredList);
      setKpis(gageService.getKpiSummary());
      setAlerts(gageService.getDueAlerts());
    } catch (e) {
      console.error('Error refreshing gages:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordCalibration = useCallback((gageId: string, recordData: Omit<CalibrationRecord, 'id'>) => {
    const updated = gageService.recordCalibration(gageId, recordData);
    refresh();
    return updated;
  }, [refresh]);

  const saveGage = useCallback((gageData: Partial<GageInstrument>) => {
    const saved = gageService.saveGage(gageData);
    refresh();
    return saved;
  }, [refresh]);

  const quarantineGage = useCallback((gageId: string, reason: string) => {
    const updated = gageService.quarantineGage(gageId, reason);
    refresh();
    return updated;
  }, [refresh]);

  const checkGage = useCallback((nameOrTag: string) => {
    return gageService.checkGageValidity(nameOrTag);
  }, []);

  const exportCsv = useCallback(() => {
    const csv = gageService.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gage_Calibration_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    gages,
    allGages,
    filter,
    setFilter,
    kpis,
    alerts,
    loading,
    refresh,
    recordCalibration,
    saveGage,
    quarantineGage,
    checkGage,
    exportCsv
  };
}
