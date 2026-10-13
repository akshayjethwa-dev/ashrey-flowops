// src/hooks/useEDHR.ts

import { useState, useEffect, useCallback } from 'react';
import {
  EDHRRecord,
  EDHRFilterOptions,
  EDHRDeviation,
  SignatureIntent
} from '../types/edhr';
import { edhrService } from '../services/edhrService';

export const useEDHR = (initialFilter?: EDHRFilterOptions) => {
  const [records, setRecords] = useState<EDHRRecord[]>([]);
  const [selectedDhr, setSelectedDhr] = useState<EDHRRecord | null>(null);
  const [filter, setFilter] = useState<EDHRFilterOptions>(initialFilter || {
    status: 'all',
    searchQuery: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await edhrService.getRecords(filter);
      setRecords(data);
      if (selectedDhr) {
        const refreshed = data.find(r => r.id === selectedDhr.id);
        setSelectedDhr(refreshed || (data.length > 0 ? data[0] : null));
      } else if (data.length > 0) {
        setSelectedDhr(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch electronic batch records');
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDhr?.id]);

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const selectById = async (id: string) => {
    const found = records.find(r => r.id === id);
    if (found) {
      setSelectedDhr(found);
    } else {
      const item = await edhrService.getRecordById(id);
      setSelectedDhr(item);
    }
  };

  const autoCompile = async (params: {
    workOrderNumber: string;
    batchNumber?: string;
    compiledBy: string;
    regulatoryStandard?: any;
  }) => {
    const newRecord = await edhrService.autoCompileFromWorkOrder(params);
    await fetchRecords();
    setSelectedDhr(newRecord);
    return newRecord;
  };

  const signRecord = async (params: {
    dhrId: string;
    signerName: string;
    signerEmail: string;
    signerRole: string;
    signerUserId: string;
    intent: SignatureIntent;
    reasonStatement: string;
  }) => {
    const updated = await edhrService.signRecord(params.dhrId, params);
    await fetchRecords();
    setSelectedDhr(updated);
    return updated;
  };

  const logDeviation = async (
    dhrId: string,
    deviationData: Omit<EDHRDeviation, 'id' | 'loggedAt' | 'isResolved'>
  ) => {
    const updated = await edhrService.logDeviation(dhrId, deviationData);
    await fetchRecords();
    setSelectedDhr(updated);
    return updated;
  };

  const resolveDeviation = async (
    dhrId: string,
    deviationId: string,
    resolution: { approvedBy: string; disposition: EDHRDeviation['disposition']; notes?: string }
  ) => {
    const updated = await edhrService.resolveDeviation(dhrId, deviationId, resolution);
    await fetchRecords();
    setSelectedDhr(updated);
    return updated;
  };

  const exportCsv = (dhr: EDHRRecord) => {
    return edhrService.exportCsv(dhr);
  };

  const exportAuditTrailCsv = (dhr: EDHRRecord) => {
    return edhrService.exportAuditTrailCsv(dhr);
  };

  const exportJson = (dhr: EDHRRecord) => {
    return edhrService.exportDigitalJson(dhr);
  };

  return {
    records,
    selectedDhr,
    setSelectedDhr,
    filter,
    setFilter,
    loading,
    error,
    refresh: fetchRecords,
    selectById,
    autoCompile,
    signRecord,
    logDeviation,
    resolveDeviation,
    exportCsv,
    exportAuditTrailCsv,
    exportJson
  };
};
