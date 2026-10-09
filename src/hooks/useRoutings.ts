// src/hooks/useRoutings.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  ProductRouting,
  WorkCenter,
  OperationMasterItem,
  RoutingOperation
} from '../types/routing';
import {
  fetchProductRoutings,
  saveProductRouting,
  deleteProductRouting as deleteRoutingApi,
  fetchWorkCenters,
  saveWorkCenter as saveWcApi,
  fetchOperationMaster,
  saveOperationMasterItem as saveMasterOpApi,
  calculateRoutingTotals,
  calculateBatchEstimate
} from '../services/routingService';

export function useRoutings() {
  const { tenant, profile, isSandboxMode } = useAuth();
  const tenantId = tenant?.id || 'tenant_default';

  const [routings, setRoutings] = useState<ProductRouting[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [operationMaster, setOperationMaster] = useState<OperationMasterItem[]>([]);
  const [selectedRoutingId, setSelectedRoutingId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedRoutings, fetchedWcs, fetchedMaster] = await Promise.all([
        fetchProductRoutings(tenantId, isSandboxMode),
        fetchWorkCenters(tenantId, isSandboxMode),
        fetchOperationMaster(tenantId, isSandboxMode)
      ]);
      setRoutings(fetchedRoutings);
      setWorkCenters(fetchedWcs);
      setOperationMaster(fetchedMaster);

      if (fetchedRoutings.length > 0) {
        setSelectedRoutingId(prev => {
          const exists = fetchedRoutings.some(r => r.id === prev);
          return exists ? prev : fetchedRoutings[0].id;
        });
      }
    } catch (err: any) {
      console.error('Failed to load routing data:', err);
      setError(err?.message || 'Failed to load routings');
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSandboxMode]);

  useEffect(() => {
    loadData();

    const handleRoutingsUpdated = () => loadData();
    const handleWcsUpdated = () => loadData();
    const handleMasterUpdated = () => loadData();

    window.addEventListener('flowops:routings_updated', handleRoutingsUpdated);
    window.addEventListener('flowops:workcenters_updated', handleWcsUpdated);
    window.addEventListener('flowops:operation_master_updated', handleMasterUpdated);

    return () => {
      window.removeEventListener('flowops:routings_updated', handleRoutingsUpdated);
      window.removeEventListener('flowops:workcenters_updated', handleWcsUpdated);
      window.removeEventListener('flowops:operation_master_updated', handleMasterUpdated);
    };
  }, [loadData]);

  const selectedRouting = useMemo(() => {
    return routings.find(r => r.id === selectedRoutingId) || routings[0] || null;
  }, [routings, selectedRoutingId]);

  // Save/Update full routing
  const handleSaveRouting = async (routing: ProductRouting) => {
    const totals = calculateRoutingTotals(routing, workCenters);
    const updated: ProductRouting = {
      ...routing,
      ...totals,
      updatedAt: new Date().toISOString()
    };
    await saveProductRouting(tenantId, updated, isSandboxMode);
    await loadData();
  };

  // Add Operation Step to Routing
  const handleAddOperation = async (
    routingId: string,
    operationData: Omit<RoutingOperation, 'id'>
  ) => {
    const target = routings.find(r => r.id === routingId);
    if (!target) return;

    const newOp: RoutingOperation = {
      ...operationData,
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    const newOps = [...target.operations, newOp].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const updatedRouting = {
      ...target,
      operations: newOps
    };

    await handleSaveRouting(updatedRouting);
  };

  // Update specific operation step
  const handleUpdateOperation = async (
    routingId: string,
    operationId: string,
    updatedData: Partial<RoutingOperation>
  ) => {
    const target = routings.find(r => r.id === routingId);
    if (!target) return;

    const newOps = target.operations.map(op => {
      if (op.id === operationId) {
        return { ...op, ...updatedData };
      }
      return op;
    }).sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    const updatedRouting = {
      ...target,
      operations: newOps
    };

    await handleSaveRouting(updatedRouting);
  };

  // Remove operation step
  const handleDeleteOperation = async (routingId: string, operationId: string) => {
    const target = routings.find(r => r.id === routingId);
    if (!target) return;

    const newOps = target.operations.filter(op => op.id !== operationId);
    const updatedRouting = {
      ...target,
      operations: newOps
    };

    await handleSaveRouting(updatedRouting);
  };

  // Re-sequence operation sequence numbers by increments of 10 (10, 20, 30, 40...)
  const handleRenumberSequences = async (routingId: string, step = 10) => {
    const target = routings.find(r => r.id === routingId);
    if (!target) return;

    const renumbered = target.operations.map((op, idx) => ({
      ...op,
      sequenceNumber: (idx + 1) * step
    }));

    const updatedRouting = {
      ...target,
      operations: renumbered
    };

    await handleSaveRouting(updatedRouting);
  };

  // Move operation up or down in sequence
  const handleMoveOperation = async (routingId: string, operationId: string, direction: 'up' | 'down') => {
    const target = routings.find(r => r.id === routingId);
    if (!target) return;

    const idx = target.operations.findIndex(o => o.id === operationId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === target.operations.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...target.operations];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Renumber after reorder
    const updatedOps = reordered.map((op, i) => ({
      ...op,
      sequenceNumber: (i + 1) * 10
    }));

    await handleSaveRouting({
      ...target,
      operations: updatedOps
    });
  };

  // Duplicate an existing routing (e.g. for revision 2 or variant part)
  const handleDuplicateRouting = async (
    routingId: string,
    newRoutingNumber: string,
    newPartNumber: string,
    newRevision: string = 'Rev 1.0'
  ) => {
    const base = routings.find(r => r.id === routingId);
    if (!base) return;

    const clonedOps: RoutingOperation[] = base.operations.map((op, i) => ({
      ...op,
      id: `op_${Date.now()}_${i}`
    }));

    const newId = `rt_${Date.now()}`;
    const newRouting: ProductRouting = {
      ...base,
      id: newId,
      routingNumber: newRoutingNumber.trim(),
      partNumber: newPartNumber.trim(),
      revision: newRevision.trim(),
      status: 'draft',
      operations: clonedOps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: undefined,
      approvedAt: undefined
    };

    await handleSaveRouting(newRouting);
    setSelectedRoutingId(newId);
    return newRouting;
  };

  // Delete routing
  const handleDeleteRouting = async (routingId: string) => {
    await deleteRoutingApi(tenantId, routingId, isSandboxMode);
    await loadData();
  };

  // Save Work Center
  const handleSaveWorkCenter = async (wc: WorkCenter) => {
    await saveWcApi(tenantId, wc, isSandboxMode);
    await loadData();
  };

  // Save Operation Master Item
  const handleSaveMasterOp = async (op: OperationMasterItem) => {
    await saveMasterOpApi(tenantId, op, isSandboxMode);
    await loadData();
  };

  // Batch Calculation helper for the active routing
  const getBatchEstimate = (batchSize: number) => {
    if (!selectedRouting) return null;
    return calculateBatchEstimate(selectedRouting, batchSize, workCenters);
  };

  return {
    routings,
    workCenters,
    operationMaster,
    selectedRouting,
    selectedRoutingId,
    loading,
    error,
    refresh: loadData,
    selectRouting: setSelectedRoutingId,
    saveRouting: handleSaveRouting,
    deleteRouting: handleDeleteRouting,
    duplicateRouting: handleDuplicateRouting,
    addOperation: handleAddOperation,
    updateOperation: handleUpdateOperation,
    deleteOperation: handleDeleteOperation,
    renumberSequences: handleRenumberSequences,
    moveOperation: handleMoveOperation,
    saveWorkCenter: handleSaveWorkCenter,
    saveMasterOp: handleSaveMasterOp,
    getBatchEstimate
  };
}
