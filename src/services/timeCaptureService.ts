// src/services/timeCaptureService.ts

import {
  OperationTimeLog,
  OperatorProfile,
  TimeLogStatus,
  TimeCaptureStats
} from '../types/timeCapture';
import { parseScan, ScanResult } from './scannerService';

const STORAGE_KEY_TIME_LOGS = 'flowops_operation_time_logs';
const STORAGE_KEY_OPERATORS = 'flowops_roster_operators';
const STORAGE_KEY_ACTIVE_OPERATOR = 'flowops_current_active_operator';

// ── Default Operator Roster ─────────────────────────────────────────
export const SEED_OPERATORS: OperatorProfile[] = [
  {
    id: 'op-ramesh',
    badgeNumber: 'EMP-7041',
    name: 'Ramesh K.',
    role: 'CNC Turning Operator',
    department: 'Machine Shop',
    primaryStation: 'WC-CNC-04 (Doosan Puma)',
    status: 'clocked_in',
    activeTimeLogId: 'log-active-01',
    shift: 'Shift A (06:00 - 14:00)'
  },
  {
    id: 'op-suresh',
    badgeNumber: 'EMP-3021',
    name: 'Suresh P.',
    role: 'Gear Hobbing Specialist',
    department: 'Gear Cutting',
    primaryStation: 'WC-HOB-01 (Liebherr)',
    status: 'available',
    shift: 'Shift A (06:00 - 14:00)'
  },
  {
    id: 'op-anand',
    badgeNumber: 'EMP-9024',
    name: 'Anand V.',
    role: 'Band Saw & Facing Technician',
    department: 'Cutting Bay',
    primaryStation: 'WC-SAW-02 (Kasto Band Saw)',
    status: 'available',
    shift: 'Shift A (06:00 - 14:00)'
  },
  {
    id: 'op-priya',
    badgeNumber: 'EMP-1088',
    name: 'Priya N.',
    role: 'Quality & CMM Inspector',
    department: 'Quality Control Lab',
    primaryStation: 'WC-CMM-01 (Zeiss CMM)',
    status: 'available',
    shift: 'General Shift (09:00 - 17:30)'
  },
  {
    id: 'op-mahendra',
    badgeNumber: 'EMP-5510',
    name: 'Mahendra S.',
    role: 'Senior MIG/TIG Welder',
    department: 'Fabrication',
    primaryStation: 'WC-WLD-02 (ESAB Bay)',
    status: 'available',
    shift: 'Shift B (14:00 - 22:00)'
  }
];

// ── Seed Time Logs ──────────────────────────────────────────────────
const now = Date.now();
const oneHourAgo = new Date(now - 62 * 60 * 1000).toISOString();
const threeHoursAgo = new Date(now - 185 * 60 * 1000).toISOString();
const twoHoursAgo = new Date(now - 143 * 60 * 1000).toISOString();
const yesterday = new Date(now - 24 * 3600 * 1000).toISOString();
const yesterdayEnd = new Date(now - 23 * 3600 * 1000).toISOString();

export const SEED_TIME_LOGS: OperationTimeLog[] = [
  // 1. Active running operation (Running right now for live stopwatch demo!)
  {
    id: 'log-active-01',
    tenantId: 'tenant-default',
    workOrderId: 'wo_seed_1',
    workOrderNumber: 'WO-2026-0001',
    operationId: 'op-2',
    operationSequence: 20,
    operationName: 'CNC Turning & OD/ID Roughing',
    partNumber: 'GB-42T',
    partName: 'Gear Blank — 42T',
    workCenterName: 'Doosan Puma CNC Lathe #04',
    workCenterCode: 'WC-CNC-04',
    operatorId: 'op-ramesh',
    operatorName: 'Ramesh K.',
    operatorBadgeNumber: 'EMP-7041',
    operatorDepartment: 'Machine Shop',
    startedAt: oneHourAgo,
    status: 'running',
    standardTimeMinutes: 180,
    shiftName: 'Shift A (06:00 - 14:00)',
    clockInMethod: 'barcode_scan',
    notes: 'Roughing pass commenced with Sandvik CNMG insert.',
    createdAt: oneHourAgo,
    updatedAt: oneHourAgo
  },
  // 2. Completed OP 10 for WO-2026-0001 (Ahead of standard time)
  {
    id: 'log-comp-01',
    tenantId: 'tenant-default',
    workOrderId: 'wo_seed_1',
    workOrderNumber: 'WO-2026-0001',
    operationId: 'op-1',
    operationSequence: 10,
    operationName: 'Material Cutting & Facing',
    partNumber: 'GB-42T',
    partName: 'Gear Blank — 42T',
    workCenterName: 'Horizontal Band Saw #02',
    workCenterCode: 'WC-SAW-02',
    operatorId: 'op-anand',
    operatorName: 'Anand V.',
    operatorBadgeNumber: 'EMP-9024',
    operatorDepartment: 'Cutting Bay',
    startedAt: threeHoursAgo,
    stoppedAt: twoHoursAgo,
    status: 'completed',
    standardTimeMinutes: 45,
    actualTimeMinutes: 42,
    varianceMinutes: -3, // 3 minutes faster!
    efficiencyPercent: 107.1,
    unitsProduced: 250,
    unitsScrapped: 0,
    shiftName: 'Shift A (06:00 - 14:00)',
    clockInMethod: 'barcode_scan',
    clockOutMethod: 'barcode_scan',
    notes: '250 billets cut cleanly, face tolerance verified at +0.2mm.',
    createdAt: threeHoursAgo,
    updatedAt: twoHoursAgo
  },
  // 3. Completed Op for WO-2026-0002
  {
    id: 'log-comp-02',
    tenantId: 'tenant-default',
    workOrderId: 'wo_seed_2',
    workOrderNumber: 'WO-2026-0002',
    operationId: 'op-ds-1',
    operationSequence: 10,
    operationName: 'Cold Bar Cut-off & Facing',
    partNumber: 'DS-30',
    partName: 'Shaft — Drive 30mm',
    workCenterName: 'Horizontal Band Saw #02',
    workCenterCode: 'WC-SAW-02',
    operatorId: 'op-anand',
    operatorName: 'Anand V.',
    operatorBadgeNumber: 'EMP-9024',
    operatorDepartment: 'Cutting Bay',
    startedAt: yesterday,
    stoppedAt: yesterdayEnd,
    status: 'completed',
    standardTimeMinutes: 50,
    actualTimeMinutes: 52,
    varianceMinutes: 2,
    efficiencyPercent: 96.2,
    unitsProduced: 500,
    unitsScrapped: 2,
    scrapReason: 'Swarf deflection on first bar',
    shiftName: 'Shift B (14:00 - 22:00)',
    clockInMethod: 'touchscreen',
    clockOutMethod: 'touchscreen',
    createdAt: yesterday,
    updatedAt: yesterdayEnd
  }
];

class TimeCaptureService {
  private logs: OperationTimeLog[] = [];
  private operators: OperatorProfile[] = [];
  private currentOperator: OperatorProfile | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Load logs
      const savedLogs = localStorage.getItem(STORAGE_KEY_TIME_LOGS);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      } else {
        this.logs = [...SEED_TIME_LOGS];
        this.persistLogs();
      }

      // 2. Load operators
      const savedOps = localStorage.getItem(STORAGE_KEY_OPERATORS);
      if (savedOps) {
        this.operators = JSON.parse(savedOps);
      } else {
        this.operators = [...SEED_OPERATORS];
        this.persistOperators();
      }

      // 3. Load active operator
      const savedActiveOp = localStorage.getItem(STORAGE_KEY_ACTIVE_OPERATOR);
      if (savedActiveOp) {
        this.currentOperator = JSON.parse(savedActiveOp);
      } else {
        this.currentOperator = this.operators[0];
        this.persistActiveOperator();
      }
    } catch (e) {
      console.error('Failed to initialize TimeCaptureService:', e);
      this.logs = [...SEED_TIME_LOGS];
      this.operators = [...SEED_OPERATORS];
      this.currentOperator = this.operators[0];
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  private persistLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_TIME_LOGS, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Storage error saving time logs', e);
    }
  }

  private persistOperators() {
    try {
      localStorage.setItem(STORAGE_KEY_OPERATORS, JSON.stringify(this.operators));
    } catch (e) {
      console.warn('Storage error saving operators', e);
    }
  }

  private persistActiveOperator() {
    try {
      if (this.currentOperator) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_OPERATOR, JSON.stringify(this.currentOperator));
      }
    } catch (e) {
      console.warn('Storage error saving active operator', e);
    }
  }

  // ── Operator Management ───────────────────────────────────────────
  public getOperators(): OperatorProfile[] {
    return [...this.operators];
  }

  public getCurrentOperator(): OperatorProfile {
    return this.currentOperator || this.operators[0];
  }

  public setCurrentOperatorByBadge(badgeNumber: string): OperatorProfile | undefined {
    const match = this.operators.find(
      o => o.badgeNumber.toUpperCase() === badgeNumber.toUpperCase() ||
           o.name.toLowerCase().includes(badgeNumber.toLowerCase())
    );
    if (match) {
      this.currentOperator = match;
      this.persistActiveOperator();
      this.notify();
      return match;
    }
    return undefined;
  }

  public setCurrentOperator(operator: OperatorProfile) {
    this.currentOperator = operator;
    this.persistActiveOperator();
    this.notify();
  }

  // ── Time Log Queries ──────────────────────────────────────────────
  public getAllLogs(): OperationTimeLog[] {
    return [...this.logs].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public getActiveClockings(): OperationTimeLog[] {
    return this.logs.filter(l => l.status === 'running' || l.status === 'paused');
  }

  public getLogById(id: string): OperationTimeLog | undefined {
    return this.logs.find(l => l.id === id);
  }

  public getRunningLogForOperation(
    workOrderId: string,
    operationId: string
  ): OperationTimeLog | undefined {
    return this.logs.find(
      l => (l.workOrderId === workOrderId || l.workOrderNumber === workOrderId) &&
           (l.operationId === operationId || l.operationName.toLowerCase() === operationId.toLowerCase()) &&
           (l.status === 'running' || l.status === 'paused')
    );
  }

  // ── Clock-In / Start Operation ────────────────────────────────────
  public clockIn(params: {
    workOrderId: string;
    workOrderNumber: string;
    operationId: string;
    operationSequence: number;
    operationName: string;
    partNumber: string;
    partName: string;
    workCenterName: string;
    workCenterCode: string;
    standardTimeMinutes: number;
    operatorBadgeNumber?: string;
    operatorName?: string;
    clockInMethod?: 'barcode_scan' | 'touchscreen' | 'rfid_badge';
    notes?: string;
    shiftName?: string;
  }): { success: boolean; log: OperationTimeLog; message: string } {
    const activeOp = this.currentOperator || this.operators[0];
    const opBadge = params.operatorBadgeNumber || activeOp.badgeNumber;
    const opName = params.operatorName || activeOp.name;

    // Check if this specific operation is already running
    const existing = this.getRunningLogForOperation(params.workOrderId, params.operationId);
    if (existing) {
      return {
        success: false,
        log: existing,
        message: `Operation ${params.operationName} is already clocked in and running!`
      };
    }

    const nowIso = new Date().toISOString();
    const newLog: OperationTimeLog = {
      id: `timelog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: 'tenant-default',
      workOrderId: params.workOrderId,
      workOrderNumber: params.workOrderNumber,
      operationId: params.operationId,
      operationSequence: params.operationSequence,
      operationName: params.operationName,
      partNumber: params.partNumber,
      partName: params.partName,
      workCenterName: params.workCenterName,
      workCenterCode: params.workCenterCode,
      operatorId: activeOp.id,
      operatorName: opName,
      operatorBadgeNumber: opBadge,
      operatorDepartment: activeOp.department,
      startedAt: nowIso,
      status: 'running',
      standardTimeMinutes: params.standardTimeMinutes || 60,
      shiftName: params.shiftName || activeOp.shift,
      clockInMethod: params.clockInMethod || 'barcode_scan',
      notes: params.notes,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.logs.unshift(newLog);

    // Update operator status
    this.operators = this.operators.map(o =>
      o.badgeNumber === opBadge
        ? { ...o, status: 'clocked_in', activeTimeLogId: newLog.id }
        : o
    );

    this.persistLogs();
    this.persistOperators();
    this.syncWorkOrderStatus(params.workOrderId, params.operationId, 'in_progress', opName, activeOp.id);
    this.notify();

    return {
      success: true,
      log: newLog,
      message: `Clocked in: ${params.workOrderNumber} · ${params.operationName} (${params.standardTimeMinutes}m std). Timer active!`
    };
  }

  // ── Clock-Out / Stop Operation ───────────────────────────────────
  public clockOut(
    logId: string,
    params?: {
      unitsProduced?: number;
      unitsScrapped?: number;
      scrapReason?: string;
      clockOutMethod?: 'barcode_scan' | 'touchscreen' | 'rfid_badge';
      notes?: string;
    }
  ): { success: boolean; log: OperationTimeLog | null; message: string } {
    const idx = this.logs.findIndex(l => l.id === logId);
    if (idx < 0) {
      return { success: false, log: null, message: 'Time log not found.' };
    }

    const target = this.logs[idx];
    const nowMs = Date.now();
    const startMs = new Date(target.startedAt).getTime();
    const elapsedMinutes = Math.max(1, Math.round(((nowMs - startMs) / 60000) * 10) / 10);

    const standard = target.standardTimeMinutes || 60;
    const variance = Math.round((elapsedMinutes - standard) * 10) / 10;
    const efficiency = Math.max(1, Math.round((standard / elapsedMinutes) * 1000) / 10);

    const updated: OperationTimeLog = {
      ...target,
      stoppedAt: new Date(nowMs).toISOString(),
      status: 'completed',
      actualTimeMinutes: elapsedMinutes,
      varianceMinutes: variance,
      efficiencyPercent: efficiency,
      unitsProduced: params?.unitsProduced,
      unitsScrapped: params?.unitsScrapped,
      scrapReason: params?.scrapReason,
      clockOutMethod: params?.clockOutMethod || 'barcode_scan',
      notes: params?.notes ? `${target.notes || ''} · ${params.notes}` : target.notes,
      updatedAt: new Date(nowMs).toISOString()
    };

    this.logs[idx] = updated;

    // Reset operator status
    this.operators = this.operators.map(o =>
      o.badgeNumber === target.operatorBadgeNumber
        ? { ...o, status: 'available', activeTimeLogId: undefined }
        : o
    );

    this.persistLogs();
    this.persistOperators();
    this.syncWorkOrderStatus(target.workOrderId, target.operationId, 'completed', target.operatorName, target.operatorId, elapsedMinutes);
    this.notify();

    const varianceText = variance <= 0
      ? `${Math.abs(variance)}m under standard (ahead)`
      : `${variance}m over standard`;

    return {
      success: true,
      log: updated,
      message: `Clocked out! Actual: ${elapsedMinutes}m vs Std: ${standard}m (${varianceText}, ${efficiency}% efficiency).`
    };
  }

  // ── Pause / Resume Timer ─────────────────────────────────────────
  public pauseClock(logId: string, pauseReason: string): boolean {
    const idx = this.logs.findIndex(l => l.id === logId);
    if (idx < 0) return false;

    this.logs[idx] = {
      ...this.logs[idx],
      status: 'paused',
      pausedAt: new Date().toISOString(),
      pauseReason,
      updatedAt: new Date().toISOString()
    };

    this.persistLogs();
    this.notify();
    return true;
  }

  public resumeClock(logId: string): boolean {
    const idx = this.logs.findIndex(l => l.id === logId);
    if (idx < 0) return false;

    this.logs[idx] = {
      ...this.logs[idx],
      status: 'running',
      pausedAt: undefined,
      updatedAt: new Date().toISOString()
    };

    this.persistLogs();
    this.notify();
    return true;
  }

  // ── Barcode Scanner Auto-Resolution ──────────────────────────────
  public resolveScanForTimeCapture(rawScan: string): {
    actionType: 'start' | 'stop' | 'switch_operator' | 'unresolved';
    matchedLog?: OperationTimeLog;
    operator?: OperatorProfile;
    workOrderNumber?: string;
    operationCode?: string;
    description: string;
  } {
    const scan = parseScan(rawScan);

    // 1. Operator badge scan
    if (scan.target === 'operator') {
      const op = this.setCurrentOperatorByBadge(scan.entityId || scan.raw);
      if (op) {
        return {
          actionType: 'switch_operator',
          operator: op,
          description: `Identified Operator: ${op.name} (${op.badgeNumber}) · ${op.role}`
        };
      }
    }

    // 2. Composite scan WO + Operation (e.g. WO-2026-0001/OP-20)
    if (scan.target === 'workOrderOperation' && scan.workOrderNumber && scan.operationCode) {
      // Check if already running -> propose stop
      const running = this.logs.find(
        l => (l.status === 'running' || l.status === 'paused') &&
             l.workOrderNumber === scan.workOrderNumber &&
             (l.operationName.toLowerCase().includes(scan.operationCode!.toLowerCase()) ||
              l.operationId.toLowerCase().includes(scan.operationCode!.toLowerCase()))
      );

      if (running) {
        return {
          actionType: 'stop',
          matchedLog: running,
          workOrderNumber: scan.workOrderNumber,
          operationCode: scan.operationCode,
          description: `Active clocking found for ${running.workOrderNumber} · ${running.operationName}. Ready to stop/clock-out.`
        };
      }

      return {
        actionType: 'start',
        workOrderNumber: scan.workOrderNumber,
        operationCode: scan.operationCode,
        description: `Ready to start clocking for ${scan.workOrderNumber} · Operation ${scan.operationCode}.`
      };
    }

    // 3. Scan of a running WO directly
    if (scan.target === 'workOrder') {
      const runningForWo = this.logs.find(
        l => (l.status === 'running' || l.status === 'paused') && l.workOrderNumber === scan.entityId
      );
      if (runningForWo) {
        return {
          actionType: 'stop',
          matchedLog: runningForWo,
          workOrderNumber: scan.entityId,
          description: `Clock-out running stage: ${runningForWo.workOrderNumber} · ${runningForWo.operationName}`
        };
      }

      return {
        actionType: 'start',
        workOrderNumber: scan.entityId,
        description: `Scanned Work Order ${scan.entityId}. Select operation to clock in.`
      };
    }

    return {
      actionType: 'unresolved',
      description: `Unrecognized scan format: "${rawScan}". Please scan a WO, Operation, or Operator badge.`
    };
  }

  // ── Sync with WorkOrder state in localStorage ─────────────────────
  private syncWorkOrderStatus(
    woId: string,
    operationId: string,
    status: 'in_progress' | 'completed',
    operatorName?: string,
    operatorId?: string,
    actualTimeMinutes?: number
  ) {
    try {
      const cacheKey = 'flowops_work_orders_tenant-default';
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return;
      const list: any[] = JSON.parse(cached);

      const idx = list.findIndex(w => w.id === woId || w.orderNumber === woId);
      if (idx >= 0) {
        const wo = list[idx];
        const ops = wo.operations.map((op: any) => {
          if (op.id === operationId || op.name.toLowerCase() === operationId.toLowerCase()) {
            return {
              ...op,
              status,
              ...(status === 'in_progress' ? { startedAt: new Date().toISOString(), startedByName: operatorName } : {}),
              ...(status === 'completed' ? { completedAt: new Date().toISOString(), actualTimeMinutes: actualTimeMinutes || op.standardTimeMinutes } : {})
            };
          }
          return op;
        });

        const allDone = ops.every((o: any) => o.status === 'completed');
        list[idx] = {
          ...wo,
          operations: ops,
          status: allDone ? 'completed' : 'in_progress',
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(cacheKey, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('flowops:workorders_updated'));
      }
    } catch (e) {
      console.warn('Could not sync WO status', e);
    }
  }

  // ── KPI Statistics ────────────────────────────────────────────────
  public getStats(): TimeCaptureStats {
    const active = this.getActiveClockings();
    const completed = this.logs.filter(l => l.status === 'completed');

    let totalStd = 0;
    let totalAct = 0;

    completed.forEach(l => {
      totalStd += l.standardTimeMinutes || 0;
      totalAct += l.actualTimeMinutes || l.standardTimeMinutes || 0;
    });

    const netVariance = Math.round((totalAct - totalStd) * 10) / 10;
    const efficiency = totalAct > 0 ? Math.round((totalStd / totalAct) * 1000) / 10 : 100;

    return {
      activeClockedInCount: active.length,
      completedCount: completed.length,
      totalStandardMinutes: Math.round(totalStd),
      totalActualMinutes: Math.round(totalAct),
      overallEfficiencyPercent: efficiency,
      netVarianceMinutes: netVariance
    };
  }
}

export const timeCaptureService = new TimeCaptureService();
