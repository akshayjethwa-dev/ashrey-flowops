// src/hooks/useProductionGenealogy.ts

import { useState, useEffect, useCallback } from 'react';
import {
  ProductionGenealogyRecord,
  GenealogyFilterOptions,
  OperationGenealogyStep,
  ProductionItemStatus
} from '../types/genealogy';
import { productionGenealogyService } from '../services/productionGenealogyService';

export const useProductionGenealogy = (initialFilter?: GenealogyFilterOptions) => {
  const [records, setRecords] = useState<ProductionGenealogyRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ProductionGenealogyRecord | null>(null);
  const [filter, setFilter] = useState<GenealogyFilterOptions>(initialFilter || {
    trackingLevel: 'all',
    status: 'all',
    searchQuery: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productionGenealogyService.getRecords(filter);
      setRecords(data);
      if (selectedRecord) {
        const refreshed = data.find(r => r.id === selectedRecord.id);
        setSelectedRecord(refreshed || (data.length > 0 ? data[0] : null));
      } else if (data.length > 0) {
        setSelectedRecord(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load production genealogy records');
    } finally {
      setLoading(false);
    }
  }, [filter, selectedRecord?.id]);

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const selectRecordById = async (id: string) => {
    const found = records.find(r => r.id === id);
    if (found) {
      setSelectedRecord(found);
    } else {
      const remote = await productionGenealogyService.getRecordById(id);
      setSelectedRecord(remote);
    }
  };

  const selectRecordByIdentifier = async (identifier: string) => {
    const found = await productionGenealogyService.getRecordByIdentifier(identifier);
    if (found) {
      setSelectedRecord(found);
      return true;
    }
    return false;
  };

  const createRecord = async (payload: Partial<ProductionGenealogyRecord>) => {
    const newRec = await productionGenealogyService.createRecord(payload);
    await fetchRecords();
    setSelectedRecord(newRec);
    return newRec;
  };

  const logOperation = async (recordId: string, stepData: Omit<OperationGenealogyStep, 'stepId'>) => {
    const updated = await productionGenealogyService.logOperationStep(recordId, stepData);
    await fetchRecords();
    setSelectedRecord(updated);
    return updated;
  };

  const updateOperation = async (recordId: string, stepId: string, updates: Partial<OperationGenealogyStep>) => {
    const updated = await productionGenealogyService.updateOperationStep(recordId, stepId, updates);
    await fetchRecords();
    setSelectedRecord(updated);
    return updated;
  };

  const updateStatus = async (
    recordId: string,
    status: ProductionItemStatus,
    disposition?: 'passed' | 'pending' | 'conditional' | 'quarantined',
    notes?: string
  ) => {
    const updated = await productionGenealogyService.updateItemStatus(recordId, status, disposition, notes);
    await fetchRecords();
    setSelectedRecord(updated);
    return updated;
  };

  const signOffCompliance = async (recordId: string, inspectorName: string) => {
    const updated = await productionGenealogyService.signOffCompliance(recordId, inspectorName);
    await fetchRecords();
    setSelectedRecord(updated);
    return updated;
  };

  const exportCsv = () => {
    return productionGenealogyService.exportCsv(records);
  };

  const exportDigitalThread = (rec: ProductionGenealogyRecord) => {
    return productionGenealogyService.exportDigitalThreadJson(rec);
  };

  return {
    records,
    selectedRecord,
    setSelectedRecord,
    filter,
    setFilter,
    loading,
    error,
    refresh: fetchRecords,
    selectRecordById,
    selectRecordByIdentifier,
    createRecord,
    logOperation,
    updateOperation,
    updateStatus,
    signOffCompliance,
    exportCsv,
    exportDigitalThread
  };
};
