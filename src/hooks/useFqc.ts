// src/hooks/useFqc.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fqcService } from '../services/fqcService';
import {
  FqcInspectionOrder,
  FqcChecklistTemplate,
  FqcChecklistItem,
  FqcFilterOptions,
  FqcKpiSummary,
  DispatchReleaseCheck
} from '../types/fqc';

export function useFqc() {
  const [filter, setFilter] = useState<FqcFilterOptions>({
    status: 'all',
    holdStatus: 'all',
    searchQuery: '',
    partSku: 'all',
    customer: 'all'
  });

  const [orders, setOrders] = useState<FqcInspectionOrder[]>([]);
  const [templates, setTemplates] = useState<FqcChecklistTemplate[]>([]);
  const [kpis, setKpis] = useState<FqcKpiSummary>({
    totalOrders: 0,
    releasedCount: 0,
    onHoldCount: 0,
    rejectedCount: 0,
    firstPassYieldPct: 100,
    avgInspectionMinutes: 15
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Refresh all state from service
  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const allOrders = fqcService.getOrders(filter);
      const allTemplates = fqcService.getTemplates();
      const currentKpis = fqcService.getKpiSummary();

      setOrders(allOrders);
      setTemplates(allTemplates);
      setKpis(currentKpis);
    } catch (e) {
      console.error('Error refreshing FQC data:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Create new order
  const createOrder = useCallback(
    (data: Partial<FqcInspectionOrder>): FqcInspectionOrder => {
      const created = fqcService.createOrder(data);
      refresh();
      return created;
    },
    [refresh]
  );

  // Update checklist item
  const updateChecklistItem = useCallback(
    (orderId: string, itemId: string, update: Partial<FqcChecklistItem>): FqcInspectionOrder => {
      const updated = fqcService.updateChecklistItem(orderId, itemId, update);
      refresh();
      return updated;
    },
    [refresh]
  );

  // Sign off by quality authority
  const signOffOrder = useCallback(
    (
      orderId: string,
      signOffData: {
        signedBy: string;
        role: string;
        badgeId?: string;
        remarks: string;
        disposition: 'passed' | 'rejected' | 'conditional_release';
        signaturePinOrHash?: string;
      }
    ): FqcInspectionOrder => {
      const signed = fqcService.signOffOrder(orderId, signOffData);
      refresh();
      return signed;
    },
    [refresh]
  );

  // Save order directly
  const saveOrder = useCallback(
    (order: FqcInspectionOrder): FqcInspectionOrder => {
      const saved = fqcService.saveOrder(order);
      refresh();
      return saved;
    },
    [refresh]
  );

  // Save template
  const saveTemplate = useCallback(
    (template: FqcChecklistTemplate): FqcChecklistTemplate => {
      const saved = fqcService.saveTemplate(template);
      refresh();
      return saved;
    },
    [refresh]
  );

  // Dispatch Release Check
  const checkDispatchReleaseEligibility = useCallback(
    (orderId: string): DispatchReleaseCheck => {
      return fqcService.checkDispatchReleaseEligibility(orderId);
    },
    []
  );

  // Export CSV
  const exportCsv = useCallback(() => {
    const csvData = fqcService.exportCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FQC_Inspection_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    orders,
    templates,
    kpis,
    filter,
    setFilter,
    loading,
    refresh,
    createOrder,
    updateChecklistItem,
    signOffOrder,
    saveOrder,
    saveTemplate,
    checkDispatchReleaseEligibility,
    exportCsv
  };
}
