// src/hooks/useTraceability.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LotRecord,
  RecallReport,
  TraceabilityGraph,
  CreateMaterialReceiptLotInput,
  RecallDefectType,
  RecallSeverity
} from '../types/traceability';
import { traceabilityService } from '../services/traceabilityService';

export interface TraceabilityKPIs {
  totalLotsCount: number;
  activeReleasedCount: number;
  quarantinedCount: number;
  recalledCount: number;
  activeRecallsCount: number;
  totalInventoryValue: number;
  rawMaterialLotsCount: number;
  finishedGoodsLotsCount: number;
  inspectionPassRatePct: number;
}

export const useTraceability = () => {
  const { tenant } = useAuth();
  const tenantId = tenant?.id || 'demo-tenant';

  const [lots, setLots] = useState<LotRecord[]>([]);
  const [recalls, setRecalls] = useState<RecallReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await traceabilityService.getLots(tenantId);
      setLots(data);
    } catch (err: any) {
      console.error('Failed fetching traceability lots', err);
      setError(err?.message || 'Error loading lots');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchRecalls = useCallback(async () => {
    try {
      const data = await traceabilityService.getRecalls(tenantId);
      setRecalls(data);
    } catch (err: any) {
      console.error('Failed fetching recalls', err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLots();
    fetchRecalls();

    const handleTraceUpdated = () => {
      fetchLots();
      fetchRecalls();
    };

    const handleRecallUpdated = () => {
      fetchLots();
      fetchRecalls();
    };

    window.addEventListener('flowops:traceability_updated', handleTraceUpdated);
    window.addEventListener('flowops:recall_created', handleRecallUpdated);
    window.addEventListener('flowops:recall_updated', handleRecallUpdated);

    return () => {
      window.removeEventListener('flowops:traceability_updated', handleTraceUpdated);
      window.removeEventListener('flowops:recall_created', handleRecallUpdated);
      window.removeEventListener('flowops:recall_updated', handleRecallUpdated);
    };
  }, [fetchLots, fetchRecalls]);

  const createMaterialReceiptLot = useCallback(
    async (input: CreateMaterialReceiptLotInput): Promise<LotRecord> => {
      const created = await traceabilityService.createMaterialReceiptLot(tenantId, input);
      await fetchLots();
      return created;
    },
    [tenantId, fetchLots]
  );

  const linkLotToWorkOrder = useCallback(
    async (
      lotNumber: string,
      params: {
        workOrderId: string;
        workOrderNumber: string;
        partName: string;
        consumedQty: number;
        unit: string;
        operatorName: string;
        operationSequence?: number;
        operationName?: string;
        workCenterName?: string;
        scrapQty?: number;
        notes?: string;
      }
    ): Promise<LotRecord> => {
      const updated = await traceabilityService.linkLotToWorkOrder(tenantId, lotNumber, params);
      await fetchLots();
      return updated;
    },
    [tenantId, fetchLots]
  );

  const generateFinishedGoodsLot = useCallback(
    async (params: {
      workOrderId: string;
      workOrderNumber: string;
      stockItemId: string;
      stockItemCode: string;
      stockItemName: string;
      producedQty: number;
      unit: string;
      unitCost: number;
      plantId: string;
      plantName: string;
      storeId: string;
      storeName: string;
      binId: string;
      binCode: string;
      parentLotNumbers: string[];
      operatorName: string;
      materialGrade?: string;
      notes?: string;
    }): Promise<LotRecord> => {
      const fgLot = await traceabilityService.generateFinishedGoodsLotFromWorkOrder(tenantId, params);
      await fetchLots();
      return fgLot;
    },
    [tenantId, fetchLots]
  );

  const initiateRecall = useCallback(
    async (params: {
      suspectLotNumber: string;
      title: string;
      defectCategory: RecallDefectType;
      severity: RecallSeverity;
      rootCauseFindings: string;
      correctiveActionPlan: string;
      initiatedBy: string;
      initiatedByName: string;
      qualityManagerSignOff: string;
      notes?: string;
    }): Promise<RecallReport> => {
      const report = await traceabilityService.initiateRecall(tenantId, params);
      await fetchLots();
      await fetchRecalls();
      return report;
    },
    [tenantId, fetchLots, fetchRecalls]
  );

  const updateRecallStatus = useCallback(
    async (recallId: string, status: RecallReport['status'], notes?: string): Promise<RecallReport> => {
      const updated = await traceabilityService.updateRecallStatus(tenantId, recallId, status, notes);
      await fetchRecalls();
      return updated;
    },
    [tenantId, fetchRecalls]
  );

  const getForwardTrace = useCallback(
    async (lotOrHeat: string): Promise<TraceabilityGraph> => {
      return await traceabilityService.getForwardTrace(tenantId, lotOrHeat);
    },
    [tenantId]
  );

  const getBackwardTrace = useCallback(
    async (lotOrWo: string): Promise<TraceabilityGraph> => {
      return await traceabilityService.getBackwardTrace(tenantId, lotOrWo);
    },
    [tenantId]
  );

  const kpis: TraceabilityKPIs = useMemo(() => {
    const totalLotsCount = lots.length;
    const activeReleasedCount = lots.filter(l => l.status === 'released').length;
    const quarantinedCount = lots.filter(l => l.status === 'quarantine').length;
    const recalledCount = lots.filter(l => l.status === 'recalled' || l.isRecalled).length;
    const activeRecallsCount = recalls.filter(r => r.status !== 'contained_and_closed').length;
    const totalInventoryValue = lots.reduce((sum, l) => sum + l.totalValue, 0);
    const rawMaterialLotsCount = lots.filter(l => l.lotType === 'raw_material').length;
    const finishedGoodsLotsCount = lots.filter(l => l.lotType === 'finished_goods').length;

    const inspectedLots = lots.filter(l => l.inspectionRecord);
    const passedInspected = lots.filter(l => l.inspectionStatus === 'passed');
    const inspectionPassRatePct = inspectedLots.length > 0
      ? Math.round((passedInspected.length / inspectedLots.length) * 100)
      : 100;

    return {
      totalLotsCount,
      activeReleasedCount,
      quarantinedCount,
      recalledCount,
      activeRecallsCount,
      totalInventoryValue,
      rawMaterialLotsCount,
      finishedGoodsLotsCount,
      inspectionPassRatePct
    };
  }, [lots, recalls]);

  return {
    lots,
    recalls,
    loading,
    error,
    kpis,
    fetchLots,
    fetchRecalls,
    createMaterialReceiptLot,
    linkLotToWorkOrder,
    generateFinishedGoodsLot,
    initiateRecall,
    updateRecallStatus,
    getForwardTrace,
    getBackwardTrace
  };
};
