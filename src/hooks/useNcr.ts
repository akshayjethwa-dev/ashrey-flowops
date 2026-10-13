// src/hooks/useNcr.ts

import { useState, useEffect, useCallback } from 'react';
import { ncrService } from '../services/ncrService';
import {
  NcrRecord,
  CapaRecord,
  NcrFilterOptions,
  NcrAgingSummary,
  NcrKpiSummary,
  NcrDispositionDetails,
  CapaVerificationDetails,
  NcrSource,
  DefectCategory,
  NcrSeverity
} from '../types/ncr';

export function useNcr() {
  const [filter, setFilter] = useState<NcrFilterOptions>({
    status: 'all',
    severity: 'all',
    source: 'all',
    dispositionType: 'all',
    agingBracket: 'all',
    searchQuery: ''
  });

  const [ncrs, setNcrs] = useState<NcrRecord[]>([]);
  const [capas, setCapas] = useState<CapaRecord[]>([]);
  const [aging, setAging] = useState<NcrAgingSummary>({
    totalOpen: 0,
    bracketUnder7: 0,
    bracket8to14: 0,
    bracket15to30: 0,
    bracketOver30: 0,
    avgDispositionDays: 0,
    avgCapaClosureDays: 0,
    totalEstimatedCopq: 0
  });
  const [kpis, setKpis] = useState<NcrKpiSummary>({
    totalNcrs: 0,
    openNcrs: 0,
    dispositionPendingCount: 0,
    activeCapas: 0,
    overdueCount: 0,
    firstTimeResolutionRatePct: 100,
    totalScrapCost: 0,
    totalReworkCost: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const allNcrs = ncrService.getNcrs(filter);
      const allCapas = ncrService.getCapas();
      const currentAging = ncrService.getAgingSummary();
      const currentKpis = ncrService.getKpis();

      setNcrs(allNcrs);
      setCapas(allCapas);
      setAging(currentAging);
      setKpis(currentKpis);
    } catch (e) {
      console.error('Error refreshing NCR/CAPA data:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Create NCR manually
  const createNcr = useCallback(
    (data: Partial<NcrRecord>): NcrRecord => {
      const created = ncrService.createNcr(data);
      refresh();
      return created;
    },
    [refresh]
  );

  // Auto create NCR from quality failure
  const autoCreateNcrFromFailure = useCallback(
    (source: NcrSource, details: any): NcrRecord => {
      const created = ncrService.autoCreateNcrFromFailure(source, details);
      refresh();
      return created;
    },
    [refresh]
  );

  // Record MRB Disposition
  const recordDisposition = useCallback(
    (ncrId: string, dispositionData: NcrDispositionDetails): NcrRecord => {
      const updated = ncrService.recordDisposition(ncrId, dispositionData);
      refresh();
      return updated;
    },
    [refresh]
  );

  // Create CAPA
  const createCapa = useCallback(
    (data: Partial<CapaRecord>): CapaRecord => {
      const created = ncrService.createCapa(data);
      refresh();
      return created;
    },
    [refresh]
  );

  // Update CAPA
  const updateCapa = useCallback(
    (id: string, updates: Partial<CapaRecord>): CapaRecord => {
      const updated = ncrService.updateCapa(id, updates);
      refresh();
      return updated;
    },
    [refresh]
  );

  // Verify and Close CAPA
  const verifyAndCloseCapa = useCallback(
    (id: string, verificationData: CapaVerificationDetails): CapaRecord => {
      const closed = ncrService.verifyAndCloseCapa(id, verificationData);
      refresh();
      return closed;
    },
    [refresh]
  );

  // Export CSV
  const exportCsv = useCallback(() => {
    const csvData = ncrService.exportCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NCR_CAPA_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    ncrs,
    capas,
    aging,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    createNcr,
    autoCreateNcrFromFailure,
    recordDisposition,
    createCapa,
    updateCapa,
    verifyAndCloseCapa,
    exportCsv
  };
}
