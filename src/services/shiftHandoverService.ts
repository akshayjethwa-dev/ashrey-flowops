// src/services/shiftHandoverService.ts

import {
  ShiftHandoverRecord,
  ShiftHandoverFilterOptions,
  ShiftType,
  ShiftHandoverStatus,
  ReceivingSupervisorChecklist,
  ShiftMachineSummary,
  ShiftWorkOrderSummary,
  ShiftPendingTask
} from '../types/shiftHandover';

const STORAGE_KEY = 'mes_shift_handovers_v1';

const INITIAL_HANDOVERS: ShiftHandoverRecord[] = [
  {
    id: 'sho-today-shift-b',
    tenantId: 'demo-tenant',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Precision Manufacturing Facility',
    handoverDate: new Date().toISOString().slice(0, 10),
    outgoingShift: 'shift_b',
    outgoingShiftLabel: 'Shift B (Afternoon · 14:00 - 22:00)',
    incomingShift: 'shift_c',
    incomingShiftLabel: 'Shift C (Night · 22:00 - 06:00)',
    outgoingSupervisorId: 'usr-sup-02',
    outgoingSupervisorName: 'Sanjay Patil',
    outgoingSupervisorBadge: 'SUP-204',
    outgoingSubmittedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    outgoingDigitalSignatureHash: 'SHA256:88bc20148812048bb492048201948baec982184029148bc892102948b8120488',
    status: 'submitted_pending_ack',
    generalSummaryNotes: 'Shift B produced 142 units with stable throughput. Main focus for Shift C is finishing the rough turning batch on WO-2026-001 so heat treat can commence early tomorrow morning.',
    shiftMetrics: {
      totalUnitsProduced: 142,
      totalScrapUnits: 2,
      averageOeePercent: 84.6,
      unplannedDowntimeMinutes: 35
    },
    safetyAndQuality: {
      safetyIncidentsCount: 0,
      safetyObservations: 'Zero safety incidents. Floor degreasing completed around CNC Bay 2 after small coolant misting.',
      activeNcrCount: 1,
      qualityAlerts: 'NCR-2026-0042 logged on Lobe #3 Camshaft. Do not run MC-CNC-04 until toolholder collet torque is verified by tooling tech.',
      toolingAlerts: 'Sandvik roughing inserts (WNMG 080408) running low in Crib 1. 2 boxes remaining.',
      rawMaterialShortages: 'EN8D 80mm round bar bundle staging completed at Sawing Cell.'
    },
    machinesSummary: [
      {
        machineId: 'MC-CNC-01',
        machineCode: 'MC-CNC-01',
        machineName: 'Doosan Lynx 2100LSY CNC Lathe',
        workCenterName: 'Heavy Turning Bay',
        state: 'running',
        currentJob: 'WO-2026-001 (CRK-8802 Crankshaft)',
        operatorOnStation: 'Vikram Rao (EMP-104)',
        maintenanceNote: 'Spindle vibration baseline normal. Coolant top-up done at 18:00.'
      },
      {
        machineId: 'MC-HT-02',
        machineCode: 'MC-HT-02',
        machineName: 'Inductoheat 50kW Dual Spindle Hardener',
        workCenterName: 'Thermal Treatment Facility',
        state: 'running',
        currentJob: 'WO-2026-001 (Induction Hardening)',
        operatorOnStation: 'Sunil Sharma (EMP-208)',
        maintenanceNote: 'Polymer quench tank chiller temperature holding at 31.5°C.'
      },
      {
        machineId: 'MC-GRD-01',
        machineCode: 'MC-GRD-01',
        machineName: 'Studer S33 CNC Cylindrical Grinder',
        workCenterName: 'Finish Grinding Cell',
        state: 'setup',
        currentJob: 'WO-2026-002 (Helical Gear Journal)',
        operatorOnStation: 'Kishore Mahajan (EMP-312)',
        maintenanceNote: 'Dressing diamond wheel. Setup 80% complete; first off part due by 23:00.'
      },
      {
        machineId: 'MC-CNC-04',
        machineCode: 'MC-CNC-04',
        machineName: 'Heller 5-Axis Horizontal Center',
        workCenterName: 'Camshaft Machining Cell',
        state: 'faulted',
        criticalIssue: true,
        currentJob: 'WO-2026-003 (CAM-4401 Camshaft)',
        operatorOnStation: 'Devendra Shinde (EMP-188)',
        maintenanceNote: 'LOCKOUT: Collet chuck hydraulic pressure fluctuating. Maintenance ticket #MT-8812 opened.'
      },
      {
        machineId: 'MC-CMM-01',
        machineCode: 'MC-CMM-01',
        machineName: 'Zeiss Prismo Ultra CMM',
        workCenterName: 'Precision Metrology Lab',
        state: 'idle',
        maintenanceNote: 'Calibration verified against ceramic reference sphere.'
      }
    ],
    openWorkOrders: [
      {
        workOrderId: 'wo-001',
        orderNumber: 'WO-2026-001',
        partName: 'Forged Crankshaft — 4-Cylinder Turbo',
        partNumber: 'CRK-8802',
        targetQuantity: 200,
        completedQuantity: 140,
        currentOperationSequence: 30,
        currentOperationName: 'Induction Hardening & Quenching',
        priority: 'urgent',
        progressPercent: 70,
        handoverNote: 'Critical order for Bajaj engine plant dispatch Friday. Keep MC-HT-02 running continuously.',
        isBottleneck: true
      },
      {
        workOrderId: 'wo-002',
        orderNumber: 'WO-2026-002',
        partName: 'Transmission Helical Gear 42T',
        partNumber: 'GR-HST-42',
        targetQuantity: 500,
        completedQuantity: 410,
        currentOperationSequence: 40,
        currentOperationName: 'Precision Cylindrical Grinding',
        priority: 'high',
        progressPercent: 82,
        handoverNote: 'Studer Grinder wheel dressed. Night shift target is 60 finished gears.'
      },
      {
        workOrderId: 'wo-003',
        orderNumber: 'WO-2026-003',
        partName: 'Overhead Camshaft — HCV',
        partNumber: 'CAM-4401',
        targetQuantity: 150,
        completedQuantity: 45,
        currentOperationSequence: 20,
        currentOperationName: 'Cam Lobe CNC Rough Milling',
        priority: 'medium',
        progressPercent: 30,
        handoverNote: 'ON HOLD: Awaiting maintenance fix on MC-CNC-04. Do not feed new billets.'
      }
    ],
    pendingTasks: [
      {
        id: 'task-01',
        taskDescription: 'Inspect first off part on Studer S33 Grinder with Mitutoyo bore gauge (Spec: 60.000 ± 0.005mm)',
        stationOrCell: 'Finish Grinding Cell',
        priority: 'urgent',
        assignedRoleOrPerson: 'Night Shift Lead Machinist',
        isCompleted: false
      },
      {
        id: 'task-02',
        taskDescription: 'Check polymer quench tank filtration screens on Induction Furnace #2 at 02:00',
        stationOrCell: 'Thermal Treatment Facility',
        priority: 'high',
        assignedRoleOrPerson: 'Night Thermal Operator',
        isCompleted: false
      },
      {
        id: 'task-03',
        taskDescription: 'Move 40 completed crankshaft pieces from induction quench cart to CMM staging bay',
        stationOrCell: 'Traceability & QC Staging',
        priority: 'normal',
        assignedRoleOrPerson: 'Material Handler',
        isCompleted: false
      }
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'sho-today-shift-a',
    tenantId: 'demo-tenant',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Precision Manufacturing Facility',
    handoverDate: new Date().toISOString().slice(0, 10),
    outgoingShift: 'shift_a',
    outgoingShiftLabel: 'Shift A (Morning · 06:00 - 14:00)',
    incomingShift: 'shift_b',
    incomingShiftLabel: 'Shift B (Afternoon · 14:00 - 22:00)',
    outgoingSupervisorId: 'usr-sup-01',
    outgoingSupervisorName: 'Ramesh Pawar',
    outgoingSupervisorBadge: 'SUP-101',
    outgoingSubmittedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    outgoingDigitalSignatureHash: 'SHA256:d8921be02891ca018249bb128941094baec102948b81204889218492040182b8',
    incomingSupervisorId: 'usr-sup-02',
    incomingSupervisorName: 'Sanjay Patil',
    incomingSupervisorBadge: 'SUP-204',
    incomingAcknowledgedAt: new Date(Date.now() - 7.5 * 3600 * 1000).toISOString(),
    incomingDigitalSignatureHash: 'SHA256:1a84092b8d8921be02891ca018249bb128941094baec102948b8120488921849',
    status: 'acknowledged',
    receivingChecklist: {
      safetyBriefingCompleted: true,
      machineWalkthroughCompleted: true,
      wipCountVerified: true,
      urgentTasksUnderstood: true,
      receivingComments: 'Shift B received in full. Physical count of 80 rough turned crankshafts verified in staging rack.'
    },
    generalSummaryNotes: 'Shift A performed cleanly. 165 pieces produced. All morning scheduled preventative maintenance on air compressors completed.',
    shiftMetrics: {
      totalUnitsProduced: 165,
      totalScrapUnits: 1,
      averageOeePercent: 88.2,
      unplannedDowntimeMinutes: 15
    },
    safetyAndQuality: {
      safetyIncidentsCount: 0,
      safetyObservations: 'Zero incidents. Morning tool-box talk conducted on crane rigging safety.',
      activeNcrCount: 0,
      qualityAlerts: 'All CMM dimensions on Morning run cleared with zero deviations.',
      toolingAlerts: 'Saw blade replaced on KastoBand at 06:30.',
      rawMaterialShortages: 'None.'
    },
    machinesSummary: [
      {
        machineId: 'MC-CNC-01',
        machineCode: 'MC-CNC-01',
        machineName: 'Doosan Lynx 2100LSY CNC Lathe',
        workCenterName: 'Heavy Turning Bay',
        state: 'running',
        currentJob: 'WO-2026-001 (CRK-8802)',
        operatorOnStation: 'Vikram Rao'
      },
      {
        machineId: 'MC-HT-02',
        machineCode: 'MC-HT-02',
        machineName: 'Inductoheat 50kW Dual Spindle Hardener',
        workCenterName: 'Thermal Treatment Facility',
        state: 'running',
        currentJob: 'WO-2026-001',
        operatorOnStation: 'Sunil Sharma'
      }
    ],
    openWorkOrders: [
      {
        workOrderId: 'wo-001',
        orderNumber: 'WO-2026-001',
        partName: 'Forged Crankshaft — 4-Cylinder Turbo',
        partNumber: 'CRK-8802',
        targetQuantity: 200,
        completedQuantity: 80,
        currentOperationSequence: 20,
        currentOperationName: 'CNC Turning & Journal Roughing',
        priority: 'urgent',
        progressPercent: 40,
        handoverNote: 'Keep rough turning rate above 18 pcs/hr.'
      }
    ],
    pendingTasks: [
      {
        id: 'task-a-01',
        taskDescription: 'Replenish synthetic coolant in turning tank #1',
        stationOrCell: 'CNC Bay',
        priority: 'normal',
        isCompleted: true,
        completedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        completedByName: 'Sanjay Patil'
      }
    ],
    createdAt: new Date(Date.now() - 8.5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7.5 * 3600 * 1000).toISOString()
  }
];

class ShiftHandoverService {
  private getStorage(): ShiftHandoverRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed reading shift handovers from localStorage', e);
    }
    this.saveStorage(INITIAL_HANDOVERS);
    return INITIAL_HANDOVERS;
  }

  private saveStorage(records: ShiftHandoverRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed saving shift handovers to localStorage', e);
    }
  }

  public async getRecords(filter?: ShiftHandoverFilterOptions): Promise<ShiftHandoverRecord[]> {
    let records = this.getStorage();

    if (filter) {
      if (filter.shiftType && filter.shiftType !== 'all') {
        records = records.filter(r => r.outgoingShift === filter.shiftType || r.incomingShift === filter.shiftType);
      }
      if (filter.status && filter.status !== 'all') {
        records = records.filter(r => r.status === filter.status);
      }
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase().trim();
        records = records.filter(r =>
          r.outgoingSupervisorName.toLowerCase().includes(q) ||
          (r.incomingSupervisorName && r.incomingSupervisorName.toLowerCase().includes(q)) ||
          r.outgoingShiftLabel.toLowerCase().includes(q) ||
          r.generalSummaryNotes.toLowerCase().includes(q) ||
          r.openWorkOrders.some(w => w.orderNumber.toLowerCase().includes(q) || w.partName.toLowerCase().includes(q)) ||
          r.machinesSummary.some(m => m.machineCode.toLowerCase().includes(q))
        );
      }
    }

    return records;
  }

  public async getRecordById(id: string): Promise<ShiftHandoverRecord | null> {
    const records = this.getStorage();
    return records.find(r => r.id === id) || null;
  }

  public getAutoCompiledDraft(outgoingShift: ShiftType = 'shift_b'): Partial<ShiftHandoverRecord> {
    const shiftMapping: Record<ShiftType, { outLabel: string; inShift: ShiftType; inLabel: string }> = {
      shift_a: {
        outLabel: 'Shift A (Morning · 06:00 - 14:00)',
        inShift: 'shift_b',
        inLabel: 'Shift B (Afternoon · 14:00 - 22:00)'
      },
      shift_b: {
        outLabel: 'Shift B (Afternoon · 14:00 - 22:00)',
        inShift: 'shift_c',
        inLabel: 'Shift C (Night · 22:00 - 06:00)'
      },
      shift_c: {
        outLabel: 'Shift C (Night · 22:00 - 06:00)',
        inShift: 'shift_a',
        inLabel: 'Shift A (Morning · 06:00 - 14:00)'
      },
      general: {
        outLabel: 'General Day Shift (09:00 - 18:00)',
        inShift: 'shift_a',
        inLabel: 'Shift A (Morning)'
      }
    };

    const target = shiftMapping[outgoingShift];

    return {
      plantId: 'plant-pune',
      plantName: 'Pune Heavy Precision Manufacturing Facility',
      handoverDate: new Date().toISOString().slice(0, 10),
      outgoingShift,
      outgoingShiftLabel: target.outLabel,
      incomingShift: target.inShift,
      incomingShiftLabel: target.inLabel,
      outgoingSupervisorName: 'Sanjay Patil',
      outgoingSupervisorBadge: 'SUP-204',
      status: 'draft',
      generalSummaryNotes: 'Shift operations completed. Fleet status and open work orders auto-synchronized from live MES.',
      safetyAndQuality: {
        safetyIncidentsCount: 0,
        safetyObservations: 'Zero safety incidents or near misses recorded during shift.',
        activeNcrCount: 0,
        qualityAlerts: 'All live CMM dimensions running within drawing specifications.',
        toolingAlerts: 'All live spindle cutters within normal tool-wear limits.',
        rawMaterialShortages: 'Raw materials staged for upcoming shift.'
      },
      machinesSummary: [
        {
          machineId: 'MC-CNC-01',
          machineCode: 'MC-CNC-01',
          machineName: 'Doosan Lynx 2100LSY CNC Lathe',
          workCenterName: 'Heavy Turning Bay',
          state: 'running',
          currentJob: 'WO-2026-001 (CRK-8802)',
          operatorOnStation: 'Vikram Rao (EMP-104)',
          maintenanceNote: 'Running cleanly at 1850 RPM.'
        },
        {
          machineId: 'MC-HT-02',
          machineCode: 'MC-HT-02',
          machineName: 'Inductoheat 50kW Dual Spindle Hardener',
          workCenterName: 'Thermal Treatment Facility',
          state: 'running',
          currentJob: 'WO-2026-001 (Induction Hardening)',
          operatorOnStation: 'Sunil Sharma (EMP-208)',
          maintenanceNote: 'Quench tank temperature at 32°C.'
        },
        {
          machineId: 'MC-GRD-01',
          machineCode: 'MC-GRD-01',
          machineName: 'Studer S33 CNC Cylindrical Grinder',
          workCenterName: 'Finish Grinding Cell',
          state: 'running',
          currentJob: 'WO-2026-002 (Helical Gear Journal)',
          operatorOnStation: 'Kishore Mahajan (EMP-312)',
          maintenanceNote: 'Finish grinding tolerance held within 2 microns.'
        },
        {
          machineId: 'MC-CNC-04',
          machineCode: 'MC-CNC-04',
          machineName: 'Heller 5-Axis Horizontal Center',
          workCenterName: 'Camshaft Machining Cell',
          state: 'faulted',
          criticalIssue: true,
          currentJob: 'WO-2026-003',
          maintenanceNote: 'Hydraulic chuck collet pressure drop. Maintenance work order active.'
        }
      ],
      openWorkOrders: [
        {
          workOrderId: 'wo-001',
          orderNumber: 'WO-2026-001',
          partName: 'Forged Crankshaft — 4-Cylinder Turbo',
          partNumber: 'CRK-8802',
          targetQuantity: 200,
          completedQuantity: 140,
          currentOperationSequence: 30,
          currentOperationName: 'Induction Hardening & Quenching',
          priority: 'urgent',
          progressPercent: 70,
          handoverNote: 'Rush order for Bajaj Engine Assembly. Priority 1.'
        },
        {
          workOrderId: 'wo-002',
          orderNumber: 'WO-2026-002',
          partName: 'Transmission Helical Gear 42T',
          partNumber: 'GR-HST-42',
          targetQuantity: 500,
          completedQuantity: 410,
          currentOperationSequence: 40,
          currentOperationName: 'Precision Cylindrical Grinding',
          priority: 'high',
          progressPercent: 82,
          handoverNote: 'Night shift target: complete batch of 500 pcs.'
        }
      ],
      pendingTasks: [
        {
          id: `task-${Date.now()}-1`,
          taskDescription: 'Verify first 5 parts on MC-GRD-01 with digital air gauge',
          stationOrCell: 'Grinding Cell',
          priority: 'urgent',
          assignedRoleOrPerson: 'Incoming Supervisor / Lead Machinist',
          isCompleted: false
        },
        {
          id: `task-${Date.now()}-2`,
          taskDescription: 'Follow up with maintenance tech on MC-CNC-04 hydraulic pressure test',
          stationOrCell: 'Camshaft Cell',
          priority: 'high',
          assignedRoleOrPerson: 'Maintenance Liaison',
          isCompleted: false
        }
      ]
    };
  }

  public async createHandover(payload: Partial<ShiftHandoverRecord>): Promise<ShiftHandoverRecord> {
    const records = this.getStorage();
    const id = `sho-${Date.now()}`;
    const hash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newRecord: ShiftHandoverRecord = {
      id,
      tenantId: payload.tenantId || 'demo-tenant',
      plantId: payload.plantId || 'plant-pune',
      plantName: payload.plantName || 'Pune Heavy Precision Manufacturing Facility',
      handoverDate: payload.handoverDate || new Date().toISOString().slice(0, 10),
      outgoingShift: payload.outgoingShift || 'shift_b',
      outgoingShiftLabel: payload.outgoingShiftLabel || 'Shift B (Afternoon · 14:00 - 22:00)',
      incomingShift: payload.incomingShift || 'shift_c',
      incomingShiftLabel: payload.incomingShiftLabel || 'Shift C (Night · 22:00 - 06:00)',
      outgoingSupervisorId: payload.outgoingSupervisorId || 'usr-sup-out',
      outgoingSupervisorName: payload.outgoingSupervisorName || 'Sanjay Patil',
      outgoingSupervisorBadge: payload.outgoingSupervisorBadge || 'SUP-204',
      outgoingSubmittedAt: new Date().toISOString(),
      outgoingDigitalSignatureHash: hash,
      status: 'submitted_pending_ack',
      generalSummaryNotes: payload.generalSummaryNotes || 'Shift handover compiled and submitted.',
      safetyAndQuality: payload.safetyAndQuality || {
        safetyIncidentsCount: 0,
        safetyObservations: 'Zero safety incidents.',
        activeNcrCount: 0,
        qualityAlerts: 'All running jobs within tolerance.'
      },
      machinesSummary: payload.machinesSummary || [],
      openWorkOrders: payload.openWorkOrders || [],
      pendingTasks: payload.pendingTasks || [],
      shiftMetrics: payload.shiftMetrics || {
        totalUnitsProduced: 120,
        totalScrapUnits: 1,
        averageOeePercent: 86.5,
        unplannedDowntimeMinutes: 20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.unshift(newRecord);
    this.saveStorage(records);
    return newRecord;
  }

  public async acknowledgeHandover(
    handoverId: string,
    receivingData: {
      incomingSupervisorName: string;
      incomingSupervisorBadge: string;
      incomingSupervisorId?: string;
      checklist: ReceivingSupervisorChecklist;
    }
  ): Promise<ShiftHandoverRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === handoverId);
    if (index === -1) throw new Error(`Handover ${handoverId} not found`);

    const record = { ...records[index] };
    const hash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    record.incomingSupervisorName = receivingData.incomingSupervisorName;
    record.incomingSupervisorBadge = receivingData.incomingSupervisorBadge;
    record.incomingSupervisorId = receivingData.incomingSupervisorId || 'usr-sup-in';
    record.incomingAcknowledgedAt = new Date().toISOString();
    record.incomingDigitalSignatureHash = hash;
    record.receivingChecklist = receivingData.checklist;
    record.status = 'acknowledged';
    record.updatedAt = new Date().toISOString();

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async toggleTaskCompletion(
    handoverId: string,
    taskId: string,
    completedByName: string
  ): Promise<ShiftHandoverRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === handoverId);
    if (index === -1) throw new Error(`Handover ${handoverId} not found`);

    const record = { ...records[index] };
    const taskIndex = record.pendingTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

    const task = { ...record.pendingTasks[taskIndex] };
    task.isCompleted = !task.isCompleted;
    if (task.isCompleted) {
      task.completedAt = new Date().toISOString();
      task.completedByName = completedByName;
    } else {
      task.completedAt = undefined;
      task.completedByName = undefined;
    }

    record.pendingTasks[taskIndex] = task;
    record.updatedAt = new Date().toISOString();

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public exportCsv(record: ShiftHandoverRecord): string {
    const lines: string[] = [];
    lines.push(`"Plant","${record.plantName}"`);
    lines.push(`"Date","${record.handoverDate}"`);
    lines.push(`"Outgoing Shift","${record.outgoingShiftLabel}"`);
    lines.push(`"Outgoing Supervisor","${record.outgoingSupervisorName} (${record.outgoingSupervisorBadge})"`);
    lines.push(`"Submitted At","${record.outgoingSubmittedAt}"`);
    lines.push(`"Incoming Shift","${record.incomingShiftLabel}"`);
    lines.push(`"Incoming Supervisor","${record.incomingSupervisorName || 'Pending'} (${record.incomingSupervisorBadge || '—'})"`);
    lines.push(`"Acknowledged At","${record.incomingAcknowledgedAt || 'Pending Acknowledgment'}"`);
    lines.push(`"Status","${record.status.toUpperCase()}"`);
    lines.push(`"General Summary","${record.generalSummaryNotes.replace(/"/g, '""')}"`);
    lines.push('');

    // Machines
    lines.push('"MACHINES FLEET STATUS"');
    lines.push('"Machine Code","Machine Name","Work Center","State","Current Job","Operator","Maintenance Note"');
    record.machinesSummary.forEach(m => {
      lines.push([
        `"${m.machineCode}"`,
        `"${m.machineName}"`,
        `"${m.workCenterName}"`,
        `"${m.state.toUpperCase()}"`,
        `"${m.currentJob || '—'}"`,
        `"${m.operatorOnStation || '—'}"`,
        `"${m.maintenanceNote || '—'}"`
      ].join(','));
    });
    lines.push('');

    // Open Work Orders
    lines.push('"OPEN WORK ORDERS AT HANDOVER"');
    lines.push('"WO Number","Part Number","Part Name","Target Qty","Completed Qty","Current Operation","Priority","Handover Note"');
    record.openWorkOrders.forEach(w => {
      lines.push([
        `"${w.orderNumber}"`,
        `"${w.partNumber}"`,
        `"${w.partName}"`,
        `"${w.targetQuantity}"`,
        `"${w.completedQuantity}"`,
        `"Op ${w.currentOperationSequence}: ${w.currentOperationName}"`,
        `"${w.priority.toUpperCase()}"`,
        `"${w.handoverNote || '—'}"`
      ].join(','));
    });
    lines.push('');

    // Pending Tasks
    lines.push('"PENDING ACTION ITEMS FOR NEXT SHIFT"');
    lines.push('"Task Description","Station","Priority","Assigned To","Completed","Completed At"');
    record.pendingTasks.forEach(t => {
      lines.push([
        `"${t.taskDescription}"`,
        `"${t.stationOrCell}"`,
        `"${t.priority.toUpperCase()}"`,
        `"${t.assignedRoleOrPerson || '—'}"`,
        `"${t.isCompleted ? 'YES' : 'NO'}"`,
        `"${t.completedAt || '—'}"`
      ].join(','));
    });

    return lines.join('\n');
  }
}

export const shiftHandoverService = new ShiftHandoverService();
