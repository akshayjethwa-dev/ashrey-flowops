// src/hooks/useFiniteScheduling.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useWorkOrders } from './useWorkOrders';
import {
  ShiftDefinition,
  OperatorStaffing,
  MachineDowntime,
  ScheduledOperation,
  WorkCenterCapacitySummary,
  BottleneckAlert,
  SchedulingSimulationParams,
  SchedulingKPIs
} from '../types/scheduling';
import { WorkCenter } from '../types/routing';
import { SEED_WORK_CENTERS } from '../services/routingService';
import { schedulingService, getRelativeDateString } from '../services/schedulingService';

export function useFiniteScheduling() {
  const { tenant, isSandboxMode, profile } = useAuth();
  const tenantId = tenant?.id || 'demo_tenant';

  const { workOrders } = useWorkOrders(tenantId);

  // Core state
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(SEED_WORK_CENTERS);
  const [downtimes, setDowntimes] = useState<MachineDowntime[]>([]);
  const [operators, setOperators] = useState<OperatorStaffing[]>([]);
  const [scheduledOperations, setScheduledOperations] = useState<ScheduledOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Time window selection
  const [startDate, setStartDate] = useState<string>(() => getRelativeDateString(0));
  const [timeWindowDays, setTimeWindowDays] = useState<number>(7); // 7, 14, 30

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<string>('all');
  const [bottleneckOnly, setBottleneckOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // What-If Simulation State
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationParams, setSimulationParams] = useState<SchedulingSimulationParams>({
    includeOvertimeShift: false,
    simulatedEfficiencyFactor: undefined,
    simulatedDowntimeMachineId: undefined,
    rushWorkOrderId: undefined
  });

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedShifts, loadedDowntimes, loadedOperators, loadedOps] = await Promise.all([
        schedulingService.getShifts(tenantId, isSandboxMode),
        schedulingService.getDowntimeEvents(tenantId, isSandboxMode),
        schedulingService.getOperators(tenantId, isSandboxMode),
        schedulingService.getScheduledOperations(tenantId, isSandboxMode)
      ]);

      setShifts(loadedShifts);
      setDowntimes(loadedDowntimes);
      setOperators(loadedOperators);
      setScheduledOperations(loadedOps);
    } catch (e) {
      console.error('Error loading scheduling data:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSandboxMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Capacity vs Load Summaries
  const capacitySummaries = useMemo<WorkCenterCapacitySummary[]>(() => {
    return schedulingService.calculateWorkCenterCapacities(
      workCenters,
      shifts,
      downtimes,
      scheduledOperations,
      startDate,
      timeWindowDays,
      simulationActive ? simulationParams : undefined
    );
  }, [workCenters, shifts, downtimes, scheduledOperations, startDate, timeWindowDays, simulationActive, simulationParams]);

  // Bottlenecks & Alerts
  const bottleneckAlerts = useMemo<BottleneckAlert[]>(() => {
    return schedulingService.detectBottlenecks(
      capacitySummaries,
      scheduledOperations,
      operators,
      shifts
    );
  }, [capacitySummaries, scheduledOperations, operators, shifts]);

  // Overall KPIs
  const kpis = useMemo<SchedulingKPIs>(() => {
    return schedulingService.calculateKPIs(
      capacitySummaries,
      scheduledOperations,
      bottleneckAlerts
    );
  }, [capacitySummaries, scheduledOperations, bottleneckAlerts]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return capacitySummaries.filter(summary => {
      if (departmentFilter !== 'all' && summary.department !== departmentFilter) {
        return false;
      }
      if (selectedWorkCenterId !== 'all' && summary.workCenterId !== selectedWorkCenterId) {
        return false;
      }
      if (bottleneckOnly && !summary.isBottleneck) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = summary.name.toLowerCase().includes(query);
        const matchesCode = summary.code.toLowerCase().includes(query);
        const matchesDept = summary.department.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesDept;
      }
      return true;
    });
  }, [capacitySummaries, departmentFilter, selectedWorkCenterId, bottleneckOnly, searchQuery]);

  // Reschedule an operation
  const handleRescheduleOperation = async (
    operationId: string,
    newDate: string,
    newWorkCenterId?: string,
    newShiftId?: string
  ) => {
    const updated = await schedulingService.rescheduleOperation(
      tenantId,
      operationId,
      newDate,
      newWorkCenterId,
      newShiftId,
      isSandboxMode
    );
    setScheduledOperations([...updated]);
  };

  // Real-time Gantt Conflict Validation
  const validateGanttMove = useCallback((
    operationId: string,
    targetWorkCenterId: string,
    targetDate: string
  ) => {
    return schedulingService.validateGanttReschedule(
      scheduledOperations,
      operationId,
      targetWorkCenterId,
      targetDate,
      workCenters,
      shifts,
      downtimes,
      operators
    );
  }, [scheduledOperations, workCenters, shifts, downtimes, operators]);

  // Execute Gantt Drag-and-Drop Reschedule with optional cascade
  const handleExecuteGanttReschedule = async (
    operationId: string,
    targetWorkCenterId: string,
    targetDate: string,
    cascadeSuccessors: boolean = false,
    targetShiftId?: string
  ) => {
    const updated = await schedulingService.executeGanttReschedule(
      tenantId,
      operationId,
      targetWorkCenterId,
      targetDate,
      cascadeSuccessors,
      targetShiftId,
      isSandboxMode
    );
    setScheduledOperations([...updated]);
  };

  // Add / edit downtime
  const handleSaveDowntime = async (event: MachineDowntime) => {
    await schedulingService.saveDowntimeEvent(tenantId, event, isSandboxMode);
    const updated = await schedulingService.getDowntimeEvents(tenantId, isSandboxMode);
    setDowntimes(updated);
  };

  // Delete downtime
  const handleDeleteDowntime = async (eventId: string) => {
    await schedulingService.deleteDowntimeEvent(tenantId, eventId, isSandboxMode);
    const updated = await schedulingService.getDowntimeEvents(tenantId, isSandboxMode);
    setDowntimes(updated);
  };

  // Save shift
  const handleSaveShift = async (shift: ShiftDefinition) => {
    await schedulingService.saveShift(tenantId, shift, isSandboxMode);
    const updated = await schedulingService.getShifts(tenantId, isSandboxMode);
    setShifts(updated);
  };

  // Save operator
  const handleSaveOperator = async (operator: OperatorStaffing) => {
    await schedulingService.saveOperator(tenantId, operator, isSandboxMode);
    const updated = await schedulingService.getOperators(tenantId, isSandboxMode);
    setOperators(updated);
  };

  // Auto-schedule finite algorithm
  const handleAutoScheduleAll = async () => {
    if (!workOrders || workOrders.length === 0) return;
    const generated = schedulingService.autoScheduleFiniteCapacity(
      workOrders,
      workCenters,
      shifts,
      downtimes,
      startDate
    );
    await schedulingService.saveScheduledOperations(tenantId, generated, isSandboxMode);
    setScheduledOperations(generated);
  };

  // Reset to default baseline schedule
  const handleResetSchedule = async () => {
    localStorage.removeItem(`flowops_scheduling_${tenantId}_scheduled_ops`);
    localStorage.removeItem(`flowops_scheduling_${tenantId}_downtimes`);
    await loadData();
  };

  // Quick mitigation: Add Overtime to overloaded work center
  const handleAddOvertimeMitigation = (workCenterId?: string) => {
    setSimulationActive(true);
    setSimulationParams(prev => ({
      ...prev,
      includeOvertimeShift: true,
      targetWorkCenterId: workCenterId
    }));
  };

  // Toggle What-If Simulation
  const handleToggleSimulation = (active: boolean) => {
    setSimulationActive(active);
    if (!active) {
      setSimulationParams({
        includeOvertimeShift: false,
        simulatedEfficiencyFactor: undefined,
        simulatedDowntimeMachineId: undefined,
        rushWorkOrderId: undefined
      });
    }
  };

  // Get unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set(workCenters.map(w => w.department));
    return Array.from(set).sort();
  }, [workCenters]);

  return {
    shifts,
    workCenters,
    downtimes,
    operators,
    scheduledOperations,
    capacitySummaries,
    filteredSummaries,
    bottleneckAlerts,
    kpis,
    loading,
    departments,
    startDate,
    setStartDate,
    timeWindowDays,
    setTimeWindowDays,
    departmentFilter,
    setDepartmentFilter,
    selectedWorkCenterId,
    setSelectedWorkCenterId,
    bottleneckOnly,
    setBottleneckOnly,
    searchQuery,
    setSearchQuery,
    simulationActive,
    simulationParams,
    setSimulationParams,
    handleToggleSimulation,
    handleRescheduleOperation,
    validateGanttMove,
    handleExecuteGanttReschedule,
    handleSaveDowntime,
    handleDeleteDowntime,
    handleSaveShift,
    handleSaveOperator,
    handleAutoScheduleAll,
    handleResetSchedule,
    handleAddOvertimeMitigation,
    reload: loadData
  };
}
