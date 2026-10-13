// src/hooks/useShiftHandover.ts

import { useState, useEffect, useCallback } from 'react';
import {
  ShiftHandoverRecord,
  ShiftHandoverFilterOptions,
  ReceivingSupervisorChecklist,
  ShiftType
} from '../types/shiftHandover';
import { shiftHandoverService } from '../services/shiftHandoverService';

export const useShiftHandover = (initialFilter?: ShiftHandoverFilterOptions) => {
  const [records, setRecords] = useState<ShiftHandoverRecord[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<ShiftHandoverRecord | null>(null);
  const [filter, setFilter] = useState<ShiftHandoverFilterOptions>(initialFilter || {
    shiftType: 'all',
    status: 'all',
    searchQuery: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftHandoverService.getRecords(filter);
      setRecords(data);
      if (selectedHandover) {
        const refreshed = data.find(r => r.id === selectedHandover.id);
        setSelectedHandover(refreshed || (data.length > 0 ? data[0] : null));
      } else if (data.length > 0) {
        setSelectedHandover(data[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch shift handovers');
    } finally {
      setLoading(false);
    }
  }, [filter, selectedHandover?.id]);

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const selectById = async (id: string) => {
    const found = records.find(r => r.id === id);
    if (found) {
      setSelectedHandover(found);
    } else {
      const item = await shiftHandoverService.getRecordById(id);
      setSelectedHandover(item);
    }
  };

  const getAutoDraft = (outgoingShift: ShiftType = 'shift_b') => {
    return shiftHandoverService.getAutoCompiledDraft(outgoingShift);
  };

  const createHandover = async (payload: Partial<ShiftHandoverRecord>) => {
    const created = await shiftHandoverService.createHandover(payload);
    await fetchRecords();
    setSelectedHandover(created);
    return created;
  };

  const acknowledgeHandover = async (params: {
    handoverId: string;
    incomingSupervisorName: string;
    incomingSupervisorBadge: string;
    incomingSupervisorId?: string;
    checklist: ReceivingSupervisorChecklist;
  }) => {
    const acknowledged = await shiftHandoverService.acknowledgeHandover(params.handoverId, {
      incomingSupervisorName: params.incomingSupervisorName,
      incomingSupervisorBadge: params.incomingSupervisorBadge,
      incomingSupervisorId: params.incomingSupervisorId,
      checklist: params.checklist
    });
    await fetchRecords();
    setSelectedHandover(acknowledged);
    return acknowledged;
  };

  const toggleTask = async (handoverId: string, taskId: string, completedByName: string) => {
    const updated = await shiftHandoverService.toggleTaskCompletion(handoverId, taskId, completedByName);
    await fetchRecords();
    setSelectedHandover(updated);
    return updated;
  };

  const exportCsv = (record: ShiftHandoverRecord) => {
    return shiftHandoverService.exportCsv(record);
  };

  return {
    records,
    selectedHandover,
    setSelectedHandover,
    filter,
    setFilter,
    loading,
    error,
    refresh: fetchRecords,
    selectById,
    getAutoDraft,
    createHandover,
    acknowledgeHandover,
    toggleTask,
    exportCsv
  };
};
