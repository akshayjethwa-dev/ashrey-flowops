// src/hooks/useTimeCapture.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  OperationTimeLog,
  OperatorProfile,
  TimeCaptureStats,
  TimeCaptureFilterParams
} from '../types/timeCapture';
import { timeCaptureService } from '../services/timeCaptureService';

export function useTimeCapture(filters?: TimeCaptureFilterParams) {
  const [logs, setLogs] = useState<OperationTimeLog[]>(() => timeCaptureService.getAllLogs());
  const [operators, setOperators] = useState<OperatorProfile[]>(() => timeCaptureService.getOperators());
  const [currentOperator, setCurrentOperator] = useState<OperatorProfile>(() => timeCaptureService.getCurrentOperator());
  const [stats, setStats] = useState<TimeCaptureStats>(() => timeCaptureService.getStats());

  useEffect(() => {
    const unsub = timeCaptureService.subscribe(() => {
      setLogs(timeCaptureService.getAllLogs());
      setOperators(timeCaptureService.getOperators());
      setCurrentOperator(timeCaptureService.getCurrentOperator());
      setStats(timeCaptureService.getStats());
    });
    return unsub;
  }, []);

  const activeClockings = useMemo(() => {
    return logs.filter(l => l.status === 'running' || l.status === 'paused');
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filters?.status && filters.status !== 'all' && l.status !== filters.status) {
        return false;
      }
      if (filters?.operatorBadge && filters.operatorBadge !== 'all' && l.operatorBadgeNumber !== filters.operatorBadge) {
        return false;
      }
      if (filters?.workCenter && filters.workCenter !== 'all' && l.workCenterCode !== filters.workCenter) {
        return false;
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          l.workOrderNumber.toLowerCase().includes(q) ||
          l.operationName.toLowerCase().includes(q) ||
          l.partName.toLowerCase().includes(q) ||
          l.operatorName.toLowerCase().includes(q) ||
          l.operatorBadgeNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, filters]);

  const clockIn = useCallback(
    (params: Parameters<typeof timeCaptureService.clockIn>[0]) => {
      return timeCaptureService.clockIn(params);
    },
    []
  );

  const clockOut = useCallback(
    (logId: string, params?: Parameters<typeof timeCaptureService.clockOut>[1]) => {
      return timeCaptureService.clockOut(logId, params);
    },
    []
  );

  const pauseClock = useCallback((logId: string, reason: string) => {
    return timeCaptureService.pauseClock(logId, reason);
  }, []);

  const resumeClock = useCallback((logId: string) => {
    return timeCaptureService.resumeClock(logId);
  }, []);

  const switchOperatorByBadge = useCallback((badge: string) => {
    return timeCaptureService.setCurrentOperatorByBadge(badge);
  }, []);

  const switchOperator = useCallback((operator: OperatorProfile) => {
    timeCaptureService.setCurrentOperator(operator);
  }, []);

  const resolveScan = useCallback((raw: string) => {
    return timeCaptureService.resolveScanForTimeCapture(raw);
  }, []);

  return {
    logs: filteredLogs,
    allLogs: logs,
    activeClockings,
    operators,
    currentOperator,
    stats,
    clockIn,
    clockOut,
    pauseClock,
    resumeClock,
    switchOperatorByBadge,
    switchOperator,
    resolveScan
  };
}
