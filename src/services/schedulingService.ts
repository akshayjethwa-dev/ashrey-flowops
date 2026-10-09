// src/services/schedulingService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ShiftDefinition,
  OperatorStaffing,
  MachineDowntime,
  ScheduledOperation,
  DayWorkCenterCapacity,
  WorkCenterCapacitySummary,
  BottleneckAlert,
  SchedulingSimulationParams,
  SchedulingKPIs,
  GanttConflict,
  GanttRescheduleProposal
} from '../types/scheduling';
import { WorkCenter, SkillLevel } from '../types/routing';
import { WorkOrder, WorkOrderOperation } from '../types/workOrder';
import { SEED_WORK_CENTERS } from './routingService';
import { logActivityEvent } from '../utils/activityLogger';

// ── Default Shifts ─────────────────────────────────────────────
export const SEED_SHIFTS: ShiftDefinition[] = [
  {
    id: 'sh_morning',
    name: 'Shift A (Morning)',
    code: 'SH-A',
    shiftType: 'morning',
    startTime: '06:00',
    endTime: '14:00',
    grossHours: 8.0,
    breakMinutes: 30,
    netHours: 7.5,
    efficiencyFactor: 0.88, // 88% OEE
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    color: '#0284c7' // sky-600
  },
  {
    id: 'sh_evening',
    name: 'Shift B (Evening)',
    code: 'SH-B',
    shiftType: 'evening',
    startTime: '14:00',
    endTime: '22:00',
    grossHours: 8.0,
    breakMinutes: 30,
    netHours: 7.5,
    efficiencyFactor: 0.85, // 85% OEE
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    color: '#7c3aed' // violet-600
  },
  {
    id: 'sh_night',
    name: 'Shift C (Night)',
    code: 'SH-C',
    shiftType: 'night',
    startTime: '22:00',
    endTime: '06:00',
    grossHours: 8.0,
    breakMinutes: 30,
    netHours: 7.5,
    efficiencyFactor: 0.80, // 80% OEE
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    color: '#334155' // slate-700
  },
  {
    id: 'sh_general',
    name: 'General Day Shift (Admin & QA)',
    code: 'SH-GEN',
    shiftType: 'general',
    startTime: '08:30',
    endTime: '17:00',
    grossHours: 8.5,
    breakMinutes: 60,
    netHours: 7.5,
    efficiencyFactor: 0.90,
    workingDays: [1, 2, 3, 4, 5, 6],
    color: '#059669' // emerald-600
  }
];

// ── Work Center Shift Bindings ──────────────────────────────────
// Maps work center code to which shifts operate on it
export const DEFAULT_WORK_CENTER_SHIFTS: Record<string, string[]> = {
  'wc_saw_01': ['sh_morning', 'sh_evening'], // 2 shifts (15h)
  'wc_wld_02': ['sh_morning', 'sh_evening'], // 2 shifts (15h)
  'wc_cnc_04': ['sh_morning', 'sh_evening', 'sh_night'], // 3 shifts (22.5h 24/6)
  'wc_vmc_01': ['sh_morning', 'sh_evening', 'sh_night'], // 3 shifts (22.5h)
  'wc_ht_01': ['sh_morning', 'sh_evening'], // 2 shifts
  'wc_grn_01': ['sh_morning', 'sh_evening'], // 2 shifts
  'wc_cmm_01': ['sh_general'], // 1 shift (QA metrology)
  'wc_pack_01': ['sh_morning', 'sh_evening'] // 2 shifts
};

// ── Seed Operators Roster ──────────────────────────────────────
export const SEED_OPERATORS: OperatorStaffing[] = [
  {
    id: 'op_ramesh',
    name: 'Ramesh Patel',
    employeeCode: 'EMP-0104',
    shiftId: 'sh_morning',
    primarySkill: 'cnc_programmer',
    secondarySkills: ['skilled_operator'],
    assignedWorkCenterIds: ['wc_cnc_04', 'wc_vmc_01'],
    isAvailable: true,
    notes: 'Master CNC Turner & Programmer, Fanuc & Siemens controls'
  },
  {
    id: 'op_vikram',
    name: 'Vikram Singh',
    employeeCode: 'EMP-0109',
    shiftId: 'sh_evening',
    primarySkill: 'skilled_operator',
    secondarySkills: ['cnc_programmer'],
    assignedWorkCenterIds: ['wc_cnc_04', 'wc_vmc_01'],
    isAvailable: true,
    notes: 'Haas VMC operator 4-axis'
  },
  {
    id: 'op_anand',
    name: 'Anand Kulkarni',
    employeeCode: 'EMP-0112',
    shiftId: 'sh_morning',
    primarySkill: 'certified_welder',
    secondarySkills: ['skilled_operator'],
    assignedWorkCenterIds: ['wc_wld_02'],
    isAvailable: true,
    notes: 'AWS D1.1 structural TIG/MIG welder'
  },
  {
    id: 'op_sunil',
    name: 'Sunil Sharma',
    employeeCode: 'EMP-0118',
    shiftId: 'sh_morning',
    primarySkill: 'certified_inspector',
    secondarySkills: ['senior_technician'],
    assignedWorkCenterIds: ['wc_cmm_01'],
    isAvailable: true,
    notes: 'Mitutoyo CMM certified programmer'
  },
  {
    id: 'op_dinesh',
    name: 'Dinesh Yadav',
    employeeCode: 'EMP-0125',
    shiftId: 'sh_morning',
    primarySkill: 'skilled_operator',
    assignedWorkCenterIds: ['wc_saw_01'],
    isAvailable: true,
    notes: 'Kasto Cold Saw operator'
  },
  {
    id: 'op_mukesh',
    name: 'Mukesh Rao',
    employeeCode: 'EMP-0130',
    shiftId: 'sh_evening',
    primarySkill: 'senior_technician',
    secondarySkills: ['skilled_operator'],
    assignedWorkCenterIds: ['wc_grn_01', 'wc_ht_01'],
    isAvailable: true,
    notes: 'Studer precision grinding & induction heat treatment'
  },
  {
    id: 'op_arjun',
    name: 'Arjun Das',
    employeeCode: 'EMP-0135',
    shiftId: 'sh_evening',
    primarySkill: 'helper',
    assignedWorkCenterIds: ['wc_pack_01', 'wc_saw_01'],
    isAvailable: true,
    notes: 'Preservation packaging & shopfloor material handling'
  }
];

// Helper to get formatted date string offset from today
export function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// ── Seed Machine Downtime ──────────────────────────────────────
export const SEED_DOWNTIME_EVENTS: MachineDowntime[] = [
  {
    id: 'dt_vmc_01',
    workCenterId: 'wc_vmc_01',
    workCenterCode: 'WC-VMC-01',
    workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
    date: getRelativeDateString(2),
    startTime: '08:00',
    endTime: '12:00',
    downtimeHours: 4.0,
    reason: 'preventive_maintenance',
    description: 'Quarterly spindle bearing runout check & linear guideway lubrication',
    impactOnCapacity: 'full_shutdown',
    status: 'scheduled'
  },
  {
    id: 'dt_cnc_01',
    workCenterId: 'wc_cnc_04',
    workCenterCode: 'WC-CNC-04',
    workCenterName: 'Doosan Puma 2600Y CNC Lathe',
    date: getRelativeDateString(4),
    startTime: '13:00',
    endTime: '16:00',
    downtimeHours: 3.0,
    reason: 'tooling_change',
    description: 'Hydraulic chuck jaw re-boring & live tooling drive belt tensioning',
    impactOnCapacity: 'full_shutdown',
    status: 'scheduled'
  },
  {
    id: 'dt_ht_01',
    workCenterId: 'wc_ht_01',
    workCenterCode: 'WC-HT-01',
    workCenterName: 'Inductoheat High-Frequency Hardening Bay',
    date: getRelativeDateString(5),
    startTime: '09:00',
    endTime: '11:00',
    downtimeHours: 2.0,
    reason: 'calibration',
    description: 'Optical pyrometer & quench tank thermostat calibration',
    impactOnCapacity: 'full_shutdown',
    status: 'scheduled'
  }
];

// ── Seed Scheduled Operations ──────────────────────────────────
// Initial realistic schedule baseline
export function getSeedScheduledOperations(): ScheduledOperation[] {
  const d0 = getRelativeDateString(0);
  const d1 = getRelativeDateString(1);
  const d2 = getRelativeDateString(2);
  const d3 = getRelativeDateString(3);
  const d4 = getRelativeDateString(4);
  const d5 = getRelativeDateString(5);

  return [
    // WO-2026-0001 (Tata Motors - Gear Blank 42T)
    {
      id: 'sch_op_001_10',
      workOrderId: 'wo_tat_001',
      orderNumber: 'WO-2026-0001',
      customerName: 'Tata Motors Commercial Vehicles',
      partName: 'Gear Blank — 42T Output Drive',
      partCode: 'GB-42T',
      priority: 'urgent',
      operationId: 'op_tat_10',
      operationSequence: 10,
      operationName: 'Cold Band Saw Billet Sizing',
      operationType: 'cutting',
      workCenterId: 'wc_saw_01',
      workCenterCode: 'WC-SAW-01',
      workCenterName: 'Kasto Automatic Cold Saw',
      batchQuantity: 250,
      setupTimeMinutes: 20,
      cycleTimeMinutes: 1.8,
      totalRequiredHours: 7.8, // (20 + 250*1.8)/60 = 7.83 hrs
      scheduledDate: d0,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d0}T06:30:00`,
      scheduledEndTime: `${d0}T14:20:00`,
      durationHours: 7.8,
      requiredSkill: 'skilled_operator',
      assignedOperatorId: 'op_dinesh',
      assignedOperatorName: 'Dinesh Yadav',
      dueDate: d3,
      status: 'in_progress',
      isBottlenecked: false
    },
    {
      id: 'sch_op_001_20',
      workOrderId: 'wo_tat_001',
      orderNumber: 'WO-2026-0001',
      customerName: 'Tata Motors Commercial Vehicles',
      partName: 'Gear Blank — 42T Output Drive',
      partCode: 'GB-42T',
      priority: 'urgent',
      operationId: 'op_tat_20',
      operationSequence: 20,
      operationName: 'CNC Turning — 1st & 2nd Setup Rough/Finish',
      operationType: 'turning',
      workCenterId: 'wc_cnc_04',
      workCenterCode: 'WC-CNC-04',
      workCenterName: 'Doosan Puma 2600Y CNC Lathe',
      batchQuantity: 250,
      setupTimeMinutes: 45,
      cycleTimeMinutes: 3.2,
      totalRequiredHours: 14.1, // (45 + 250*3.2)/60 = 14.08 hrs
      scheduledDate: d1,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d1}T06:00:00`,
      scheduledEndTime: `${d1}T20:10:00`,
      durationHours: 14.1,
      requiredSkill: 'cnc_programmer',
      assignedOperatorId: 'op_ramesh',
      assignedOperatorName: 'Ramesh Patel',
      dueDate: d3,
      status: 'scheduled',
      isBottlenecked: false,
      predecessorOperationId: 'sch_op_001_10',
      predecessorFinishDate: d0
    },
    {
      id: 'sch_op_001_30',
      workOrderId: 'wo_tat_001',
      orderNumber: 'WO-2026-0001',
      customerName: 'Tata Motors Commercial Vehicles',
      partName: 'Gear Blank — 42T Output Drive',
      partCode: 'GB-42T',
      priority: 'urgent',
      operationId: 'op_tat_30',
      operationSequence: 30,
      operationName: 'High-Frequency Induction Hardening 58-62 HRC',
      operationType: 'heat_treatment',
      workCenterId: 'wc_ht_01',
      workCenterCode: 'WC-HT-01',
      workCenterName: 'Inductoheat Induction Hardening Bay',
      batchQuantity: 250,
      setupTimeMinutes: 30,
      cycleTimeMinutes: 1.2,
      totalRequiredHours: 5.5,
      scheduledDate: d2,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d2}T07:00:00`,
      scheduledEndTime: `${d2}T12:30:00`,
      durationHours: 5.5,
      requiredSkill: 'senior_technician',
      assignedOperatorId: 'op_mukesh',
      assignedOperatorName: 'Mukesh Rao',
      dueDate: d3,
      status: 'scheduled',
      isBottlenecked: false,
      predecessorOperationId: 'sch_op_001_20',
      predecessorFinishDate: d1
    },
    {
      id: 'sch_op_001_40',
      workOrderId: 'wo_tat_001',
      orderNumber: 'WO-2026-0001',
      customerName: 'Tata Motors Commercial Vehicles',
      partName: 'Gear Blank — 42T Output Drive',
      partCode: 'GB-42T',
      priority: 'urgent',
      operationId: 'op_tat_40',
      operationSequence: 40,
      operationName: 'Precision CNC Cylindrical OD Grinding',
      operationType: 'machining',
      workCenterId: 'wc_grn_01',
      workCenterCode: 'WC-GRN-01',
      workCenterName: 'Studer S33 CNC Cylindrical Grinder',
      batchQuantity: 250,
      setupTimeMinutes: 40,
      cycleTimeMinutes: 1.5,
      totalRequiredHours: 6.9,
      scheduledDate: d2,
      scheduledShiftId: 'sh_evening',
      scheduledStartTime: `${d2}T14:00:00`,
      scheduledEndTime: `${d2}T21:00:00`,
      durationHours: 6.9,
      requiredSkill: 'senior_technician',
      assignedOperatorId: 'op_mukesh',
      assignedOperatorName: 'Mukesh Rao',
      dueDate: d3,
      status: 'scheduled',
      isBottlenecked: false,
      predecessorOperationId: 'sch_op_001_30',
      predecessorFinishDate: d2
    },
    {
      id: 'sch_op_001_50',
      workOrderId: 'wo_tat_001',
      orderNumber: 'WO-2026-0001',
      customerName: 'Tata Motors Commercial Vehicles',
      partName: 'Gear Blank — 42T Output Drive',
      partCode: 'GB-42T',
      priority: 'urgent',
      operationId: 'op_tat_50',
      operationSequence: 50,
      operationName: 'Full CMM Dimensional & Runout Metrology',
      operationType: 'inspection',
      workCenterId: 'wc_cmm_01',
      workCenterCode: 'WC-CMM-01',
      workCenterName: 'Mitutoyo Crysta-Apex CNC CMM',
      batchQuantity: 250,
      setupTimeMinutes: 25,
      cycleTimeMinutes: 0.8,
      totalRequiredHours: 3.75,
      scheduledDate: d3,
      scheduledShiftId: 'sh_general',
      scheduledStartTime: `${d3}T09:00:00`,
      scheduledEndTime: `${d3}T12:45:00`,
      durationHours: 3.75,
      requiredSkill: 'certified_inspector',
      assignedOperatorId: 'op_sunil',
      assignedOperatorName: 'Sunil Sharma',
      dueDate: d3,
      status: 'scheduled',
      isBottlenecked: false,
      predecessorOperationId: 'sch_op_001_40',
      predecessorFinishDate: d2
    },

    // WO-2026-0002 (L&T Heavy Engineering - Planetary Gearbox Housing)
    // NOTE: This creates a heavy load on Haas VMC and Doosan CNC
    {
      id: 'sch_op_002_10',
      workOrderId: 'wo_lt_002',
      orderNumber: 'WO-2026-0002',
      customerName: 'Larsen & Toubro Heavy Engineering',
      partName: 'Cast Ductile Iron Planetary Gearbox Housing',
      partCode: 'HSG-PLN-500',
      priority: 'high',
      operationId: 'op_lt_10',
      operationSequence: 10,
      operationName: '4-Axis CNC Milling — Face, Bore & Bore Intersections',
      operationType: 'milling',
      workCenterId: 'wc_vmc_01',
      workCenterCode: 'WC-VMC-01',
      workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
      batchQuantity: 30,
      setupTimeMinutes: 60,
      cycleTimeMinutes: 32.0, // 32 min per large casting
      totalRequiredHours: 17.0, // (60 + 30*32)/60 = 17 hrs!
      scheduledDate: d1,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d1}T06:00:00`,
      scheduledEndTime: `${d1}T23:00:00`,
      durationHours: 17.0,
      requiredSkill: 'cnc_programmer',
      assignedOperatorId: 'op_vikram',
      assignedOperatorName: 'Vikram Singh',
      dueDate: d4,
      status: 'scheduled',
      isBottlenecked: false
    },
    // Another job on Haas VMC on d2 where maintenance occurs => BOTTLENECK ALERT!
    {
      id: 'sch_op_002_15',
      workOrderId: 'wo_lt_002',
      orderNumber: 'WO-2026-0002',
      customerName: 'Larsen & Toubro Heavy Engineering',
      partName: 'Gearbox Front Cover Flange Plate',
      partCode: 'FLG-PLN-500',
      priority: 'high',
      operationId: 'op_lt_15',
      operationSequence: 20,
      operationName: 'VMC Drilling Pitch Circle Bolt Holes & O-Ring Groove',
      operationType: 'milling',
      workCenterId: 'wc_vmc_01',
      workCenterCode: 'WC-VMC-01',
      workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
      batchQuantity: 30,
      setupTimeMinutes: 45,
      cycleTimeMinutes: 18.0,
      totalRequiredHours: 9.75, // (45 + 30*18)/60 = 9.75 hrs
      scheduledDate: d2, // Date has 4h maintenance, net capacity is reduced => OVERLOAD!
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d2}T12:00:00`,
      scheduledEndTime: `${d2}T22:00:00`,
      durationHours: 9.75,
      requiredSkill: 'cnc_programmer',
      assignedOperatorId: 'op_vikram',
      assignedOperatorName: 'Vikram Singh',
      dueDate: d4,
      status: 'scheduled',
      isBottlenecked: true
    },
    // Extra order on Haas VMC on d2 causing 17.0 + 9.75 > capacity!
    {
      id: 'sch_op_004_10',
      workOrderId: 'wo_bhel_004',
      orderNumber: 'WO-2026-0004',
      customerName: 'BHEL Power Equipment',
      partName: 'Turbine Bearing Support Pedestal',
      partCode: 'PED-TRB-120',
      priority: 'high',
      operationId: 'op_bhel_10',
      operationSequence: 10,
      operationName: 'Precision Face Milling & Dowel Hole Boring',
      operationType: 'milling',
      workCenterId: 'wc_vmc_01',
      workCenterCode: 'WC-VMC-01',
      workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
      batchQuantity: 15,
      setupTimeMinutes: 50,
      cycleTimeMinutes: 28.0,
      totalRequiredHours: 7.8,
      scheduledDate: d2, // Overloading VMC on d2 (total load = 9.75 + 7.8 = 17.55 hrs on 15h reduced capacity)
      scheduledShiftId: 'sh_evening',
      scheduledStartTime: `${d2}T15:00:00`,
      scheduledEndTime: `${d2}T23:00:00`,
      durationHours: 7.8,
      requiredSkill: 'cnc_programmer',
      assignedOperatorId: 'op_ramesh',
      assignedOperatorName: 'Ramesh Patel',
      dueDate: d4,
      status: 'scheduled',
      isBottlenecked: true
    },

    // WO-2026-0003 (Thermax Boilers - High-Pressure Skid Frame)
    {
      id: 'sch_op_003_10',
      workOrderId: 'wo_thx_003',
      orderNumber: 'WO-2026-0003',
      customerName: 'Thermax Process Systems',
      partName: 'Structural Skid Base Frame Skid (IS 2062 Grade E250)',
      partCode: 'SKD-THX-900',
      priority: 'medium',
      operationId: 'op_thx_10',
      operationSequence: 10,
      operationName: 'Heavy Beam Sawing & Miter Cuts',
      operationType: 'cutting',
      workCenterId: 'wc_saw_01',
      workCenterCode: 'WC-SAW-01',
      workCenterName: 'Kasto Automatic Cold Saw',
      batchQuantity: 10,
      setupTimeMinutes: 30,
      cycleTimeMinutes: 25.0,
      totalRequiredHours: 4.7,
      scheduledDate: d1,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d1}T08:00:00`,
      scheduledEndTime: `${d1}T13:00:00`,
      durationHours: 4.7,
      requiredSkill: 'skilled_operator',
      assignedOperatorId: 'op_dinesh',
      assignedOperatorName: 'Dinesh Yadav',
      dueDate: d5,
      status: 'scheduled',
      isBottlenecked: false
    },
    {
      id: 'sch_op_003_20',
      workOrderId: 'wo_thx_003',
      orderNumber: 'WO-2026-0003',
      customerName: 'Thermax Process Systems',
      partName: 'Structural Skid Base Frame Skid (IS 2062 Grade E250)',
      partCode: 'SKD-THX-900',
      priority: 'medium',
      operationId: 'op_thx_20',
      operationSequence: 20,
      operationName: 'Multi-Pass TIG/MIG Structural Fillet & Butt Welding',
      operationType: 'welding',
      workCenterId: 'wc_wld_02',
      workCenterCode: 'WC-WLD-02',
      workCenterName: 'ESAB Multi-Process Welding Bay #2',
      batchQuantity: 10,
      setupTimeMinutes: 60,
      cycleTimeMinutes: 80.0,
      totalRequiredHours: 14.3, // (60 + 10*80)/60 = 14.3 hrs
      scheduledDate: d2,
      scheduledShiftId: 'sh_morning',
      scheduledStartTime: `${d2}T06:00:00`,
      scheduledEndTime: `${d2}T20:30:00`,
      durationHours: 14.3,
      requiredSkill: 'certified_welder',
      assignedOperatorId: 'op_anand',
      assignedOperatorName: 'Anand Kulkarni',
      dueDate: d5,
      status: 'scheduled',
      isBottlenecked: false,
      predecessorOperationId: 'sch_op_003_10',
      predecessorFinishDate: d1
    },

    // Extra Doosan Turning load on d1 to demonstrate heavy capacity loading
    {
      id: 'sch_op_005_10',
      workOrderId: 'wo_dan_005',
      orderNumber: 'WO-2026-0005',
      customerName: 'Danfoss Power Solutions',
      partName: 'Hydraulic Piston Rod Splined Shaft',
      partCode: 'SFT-SPL-080',
      priority: 'high',
      operationId: 'op_dan_10',
      operationSequence: 10,
      operationName: 'CNC Bar Turn & Spline Hobbing (Live Tooling)',
      operationType: 'turning',
      workCenterId: 'wc_cnc_04',
      workCenterCode: 'WC-CNC-04',
      workCenterName: 'Doosan Puma 2600Y CNC Lathe',
      batchQuantity: 120,
      setupTimeMinutes: 40,
      cycleTimeMinutes: 3.5,
      totalRequiredHours: 7.7,
      scheduledDate: d1,
      scheduledShiftId: 'sh_evening',
      scheduledStartTime: `${d1}T16:00:00`,
      scheduledEndTime: `${d1}T23:45:00`,
      durationHours: 7.7,
      requiredSkill: 'cnc_programmer',
      assignedOperatorId: 'op_vikram',
      assignedOperatorName: 'Vikram Singh',
      dueDate: d4,
      status: 'scheduled',
      isBottlenecked: false
    }
  ];
}

// ── Service Class ──────────────────────────────────────────────
class FiniteSchedulingService {
  private getStorageKey(tenantId: string, itemKey: string): string {
    return `flowops_scheduling_${tenantId}_${itemKey}`;
  }

  // 1. Shifts & Patterns Management
  async getShifts(tenantId: string, isSandbox: boolean = false): Promise<ShiftDefinition[]> {
    if (isSandbox || !db) {
      const stored = localStorage.getItem(this.getStorageKey(tenantId, 'shifts'));
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Error parsing cached shifts', e);
        }
      }
      localStorage.setItem(this.getStorageKey(tenantId, 'shifts'), JSON.stringify(SEED_SHIFTS));
      return SEED_SHIFTS;
    }

    try {
      const snap = await getDocs(collection(db, 'tenants', tenantId, 'shifts'));
      if (snap.empty) {
        for (const s of SEED_SHIFTS) {
          await setDoc(doc(db, 'tenants', tenantId, 'shifts', s.id), s);
        }
        return SEED_SHIFTS;
      }
      return snap.docs.map(d => d.data() as ShiftDefinition);
    } catch (e) {
      console.warn('Firestore getShifts failed, using seed', e);
      return SEED_SHIFTS;
    }
  }

  async saveShift(tenantId: string, shift: ShiftDefinition, isSandbox: boolean = false): Promise<void> {
    const list = await this.getShifts(tenantId, isSandbox);
    const idx = list.findIndex(s => s.id === shift.id);
    if (idx >= 0) {
      list[idx] = shift;
    } else {
      list.push(shift);
    }
    localStorage.setItem(this.getStorageKey(tenantId, 'shifts'), JSON.stringify(list));

    if (!isSandbox && db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'shifts', shift.id), shift);
      } catch (e) {
        console.warn('Firestore saveShift failed', e);
      }
    }
  }

  // 2. Machine Downtime / Maintenance Calendar
  async getDowntimeEvents(tenantId: string, isSandbox: boolean = false): Promise<MachineDowntime[]> {
    const stored = localStorage.getItem(this.getStorageKey(tenantId, 'downtimes'));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Error parsing cached downtimes', e);
      }
    }
    const seed = SEED_DOWNTIME_EVENTS;
    localStorage.setItem(this.getStorageKey(tenantId, 'downtimes'), JSON.stringify(seed));
    return seed;
  }

  async saveDowntimeEvent(tenantId: string, event: MachineDowntime, isSandbox: boolean = false): Promise<void> {
    const list = await this.getDowntimeEvents(tenantId, isSandbox);
    const idx = list.findIndex(d => d.id === event.id);
    if (idx >= 0) {
      list[idx] = event;
    } else {
      list.push(event);
    }
    localStorage.setItem(this.getStorageKey(tenantId, 'downtimes'), JSON.stringify(list));
  }

  async deleteDowntimeEvent(tenantId: string, eventId: string, isSandbox: boolean = false): Promise<void> {
    const list = await this.getDowntimeEvents(tenantId, isSandbox);
    const filtered = list.filter(d => d.id !== eventId);
    localStorage.setItem(this.getStorageKey(tenantId, 'downtimes'), JSON.stringify(filtered));
  }

  // 3. Operators Roster
  async getOperators(tenantId: string, isSandbox: boolean = false): Promise<OperatorStaffing[]> {
    const stored = localStorage.getItem(this.getStorageKey(tenantId, 'operators'));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Error parsing cached operators', e);
      }
    }
    const seed = SEED_OPERATORS;
    localStorage.setItem(this.getStorageKey(tenantId, 'operators'), JSON.stringify(seed));
    return seed;
  }

  async saveOperator(tenantId: string, operator: OperatorStaffing, isSandbox: boolean = false): Promise<void> {
    const list = await this.getOperators(tenantId, isSandbox);
    const idx = list.findIndex(o => o.id === operator.id);
    if (idx >= 0) {
      list[idx] = operator;
    } else {
      list.push(operator);
    }
    localStorage.setItem(this.getStorageKey(tenantId, 'operators'), JSON.stringify(list));
  }

  // 4. Scheduled Operations
  async getScheduledOperations(tenantId: string, isSandbox: boolean = false): Promise<ScheduledOperation[]> {
    const stored = localStorage.getItem(this.getStorageKey(tenantId, 'scheduled_ops'));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Error parsing cached scheduled ops', e);
      }
    }
    const seed = getSeedScheduledOperations();
    localStorage.setItem(this.getStorageKey(tenantId, 'scheduled_ops'), JSON.stringify(seed));
    return seed;
  }

  async saveScheduledOperations(tenantId: string, ops: ScheduledOperation[], isSandbox: boolean = false): Promise<void> {
    localStorage.setItem(this.getStorageKey(tenantId, 'scheduled_ops'), JSON.stringify(ops));
  }

  async rescheduleOperation(
    tenantId: string,
    operationId: string,
    newDate: string,
    newWorkCenterId?: string,
    newShiftId?: string,
    isSandbox: boolean = false
  ): Promise<ScheduledOperation[]> {
    const list = await this.getScheduledOperations(tenantId, isSandbox);
    const op = list.find(o => o.id === operationId);
    if (!op) return list;

    op.scheduledDate = newDate;
    if (newShiftId) op.scheduledShiftId = newShiftId;
    if (newWorkCenterId && newWorkCenterId !== op.workCenterId) {
      const allWorkCenters = SEED_WORK_CENTERS;
      const targetWc = allWorkCenters.find(w => w.id === newWorkCenterId);
      if (targetWc) {
        op.workCenterId = targetWc.id;
        op.workCenterCode = targetWc.code;
        op.workCenterName = targetWc.name;
      }
    }

    // Check if newDate is beyond dueDate
    if (op.dueDate && newDate > op.dueDate) {
      op.isOverdue = true;
    } else {
      op.isOverdue = false;
    }

    await this.saveScheduledOperations(tenantId, list, isSandbox);
    return list;
  }

  // 5. Work Center Capacity Summary & Capacity vs. Load Computation
  calculateWorkCenterCapacities(
    workCenters: WorkCenter[],
    shifts: ShiftDefinition[],
    downtimes: MachineDowntime[],
    scheduledOps: ScheduledOperation[],
    startDateString: string,
    numberOfDays: number = 7,
    simulationParams?: SchedulingSimulationParams
  ): WorkCenterCapacitySummary[] {
    const shiftMap = new Map(shifts.map(s => [s.id, s]));
    const summaries: WorkCenterCapacitySummary[] = [];

    const dateList: string[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const dt = new Date(startDateString);
      dt.setDate(dt.getDate() + i);
      dateList.push(dt.toISOString().slice(0, 10));
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const wc of workCenters) {
      const assignedShiftIds = DEFAULT_WORK_CENTER_SHIFTS[wc.id] || ['sh_morning', 'sh_evening'];
      
      // Calculate daily days array
      const days: DayWorkCenterCapacity[] = [];
      let weeklyEffectiveCapacity = 0;
      let weeklyScheduledLoad = 0;

      for (const dateStr of dateList) {
        const dateObj = new Date(dateStr);
        const dayOfWeekIndex = dateObj.getDay();
        const dayOfWeekStr = dayNames[dayOfWeekIndex];

        // Is machine on downtime this day?
        const dayDowntimes = downtimes.filter(d => 
          d.workCenterId === wc.id && 
          d.date === dateStr &&
          d.status !== 'cancelled'
        );
        let downtimeHours = dayDowntimes.reduce((sum, d) => sum + d.downtimeHours, 0);

        // Simulated downtime if parameter matches
        if (simulationParams?.simulatedDowntimeMachineId === wc.id) {
          downtimeHours += 8.0; // simulated 8h daily breakdown
        }

        // Active shifts for this day
        let dailyGrossHours = 0;
        let dailyEffectiveHours = 0;
        let isWorkingDay = false;

        for (const sId of assignedShiftIds) {
          const shift = shiftMap.get(sId);
          if (shift && shift.workingDays.includes(dayOfWeekIndex)) {
            isWorkingDay = true;
            dailyGrossHours += shift.grossHours;

            // Efficiency factor (use simulation parameter if provided)
            const eff = simulationParams?.simulatedEfficiencyFactor ?? shift.efficiencyFactor;
            dailyEffectiveHours += shift.netHours * eff;
          }
        }

        // What-if simulation: Overtime Shift
        if (simulationParams?.includeOvertimeShift && isWorkingDay) {
          dailyGrossHours += 4.0;
          dailyEffectiveHours += 4.0 * 0.90; // +3.6h overtime effective
        }

        // Finite available machine capacity
        const finiteAvailableHours = Math.max(0, dailyEffectiveHours - downtimeHours);

        // Sum scheduled operations on this work center & date
        const opsOnThisDay = scheduledOps.filter(o => 
          o.workCenterId === wc.id && 
          o.scheduledDate === dateStr
        );
        const scheduledLoadHours = opsOnThisDay.reduce((sum, o) => sum + o.totalRequiredHours, 0);

        const utilizationPercent = finiteAvailableHours > 0
          ? Math.round((scheduledLoadHours / finiteAvailableHours) * 100)
          : (scheduledLoadHours > 0 ? 999 : 0);

        const isOverloaded = utilizationPercent > 100;

        weeklyEffectiveCapacity += finiteAvailableHours;
        weeklyScheduledLoad += scheduledLoadHours;

        days.push({
          date: dateStr,
          dayOfWeek: dayOfWeekStr,
          isWorkingDay,
          shiftIds: assignedShiftIds,
          grossCapacityHours: parseFloat(dailyGrossHours.toFixed(1)),
          effectiveCapacityHours: parseFloat(dailyEffectiveHours.toFixed(1)),
          downtimeHours: parseFloat(downtimeHours.toFixed(1)),
          finiteAvailableHours: parseFloat(finiteAvailableHours.toFixed(1)),
          scheduledLoadHours: parseFloat(scheduledLoadHours.toFixed(1)),
          utilizationPercent,
          isOverloaded,
          scheduledOperationsCount: opsOnThisDay.length
        });
      }

      const weeklyUtilizationPercent = weeklyEffectiveCapacity > 0
        ? Math.round((weeklyScheduledLoad / weeklyEffectiveCapacity) * 100)
        : (weeklyScheduledLoad > 0 ? 100 : 0);

      // Has any day with overload or weekly load > 95%
      const hasBottleneckDay = days.some(d => d.isOverloaded);
      const isBottleneck = hasBottleneckDay || weeklyUtilizationPercent > 95;

      const dailyEffectiveCap = days.length > 0
        ? days[0].finiteAvailableHours
        : 16.0;

      summaries.push({
        workCenterId: wc.id,
        code: wc.code,
        name: wc.name,
        department: wc.department,
        activeShiftsCount: assignedShiftIds.length,
        dailyEffectiveCapacityHours: parseFloat(dailyEffectiveCap.toFixed(1)),
        weeklyEffectiveCapacityHours: parseFloat(weeklyEffectiveCapacity.toFixed(1)),
        weeklyScheduledLoadHours: parseFloat(weeklyScheduledLoad.toFixed(1)),
        weeklyUtilizationPercent,
        isBottleneck,
        days,
        status: wc.status
      });
    }

    return summaries;
  }

  // 6. Bottleneck Detection Engine
  detectBottlenecks(
    summaries: WorkCenterCapacitySummary[],
    scheduledOps: ScheduledOperation[],
    operators: OperatorStaffing[],
    shifts: ShiftDefinition[]
  ): BottleneckAlert[] {
    const alerts: BottleneckAlert[] = [];
    const shiftMap = new Map(shifts.map(s => [s.id, s]));

    // Check 1: Machine Overload (Load > Capacity)
    for (const wc of summaries) {
      for (const day of wc.days) {
        if (day.isOverloaded && day.scheduledLoadHours > 0) {
          const excessHours = parseFloat((day.scheduledLoadHours - day.finiteAvailableHours).toFixed(1));
          alerts.push({
            id: `alert_ovl_${wc.workCenterId}_${day.date}`,
            type: 'capacity_overload',
            severity: day.utilizationPercent > 125 ? 'critical' : 'high',
            workCenterId: wc.workCenterId,
            workCenterCode: wc.code,
            workCenterName: wc.name,
            date: day.date,
            title: `Capacity Overload: ${wc.code} (${day.utilizationPercent}%) on ${day.date}`,
            message: `${wc.name} has ${day.scheduledLoadHours}h scheduled work against ${day.finiteAvailableHours}h finite capacity on ${day.dayOfWeek} (${day.date}). Overload backlog: +${excessHours} hrs.`,
            capacityHours: day.finiteAvailableHours,
            loadHours: day.scheduledLoadHours,
            overloadPercent: day.utilizationPercent,
            suggestedAction: `Add 4h overtime shift, split operation batches, or re-route jobs to alternative machine`,
            actionPayload: {
              actionType: 'add_overtime',
              workCenterId: wc.workCenterId,
              overtimeHours: 4
            }
          });
        }
      }
    }

    // Check 2: Due Date Violations (Scheduled finish > Work order due date)
    for (const op of scheduledOps) {
      if (op.dueDate && op.scheduledDate > op.dueDate) {
        const d1 = new Date(op.scheduledDate);
        const d2 = new Date(op.dueDate);
        const daysLate = Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

        alerts.push({
          id: `alert_due_${op.id}`,
          type: 'due_date_violation',
          severity: daysLate > 2 ? 'critical' : 'high',
          workOrderId: op.workOrderId,
          orderNumber: op.orderNumber,
          operationId: op.id,
          operationName: op.operationName,
          date: op.scheduledDate,
          daysLate,
          title: `Delivery Risk: ${op.orderNumber} is scheduled ${daysLate} day(s) after Due Date`,
          message: `Operation ${op.operationSequence} (${op.operationName}) for ${op.customerName} is scheduled on ${op.scheduledDate}, but customer PO due date is ${op.dueDate}.`,
          suggestedAction: `Expedite priority or re-assign to fastest available work center`,
          actionPayload: {
            actionType: 'expedite',
            workOrderId: op.workOrderId
          }
        });
      }
    }

    // Check 3: Sequence Precedence Delays (Operation N scheduled on or before predecessor completion)
    const opsByWorkOrder = new Map<string, ScheduledOperation[]>();
    for (const op of scheduledOps) {
      if (!opsByWorkOrder.has(op.workOrderId)) {
        opsByWorkOrder.set(op.workOrderId, []);
      }
      opsByWorkOrder.get(op.workOrderId)!.push(op);
    }

    for (const [woId, ops] of opsByWorkOrder.entries()) {
      ops.sort((a, b) => a.operationSequence - b.operationSequence);
      for (let i = 1; i < ops.length; i++) {
        const prev = ops[i - 1];
        const curr = ops[i];
        if (curr.scheduledDate < prev.scheduledDate) {
          alerts.push({
            id: `alert_prec_${curr.id}`,
            type: 'sequence_precedence_delay',
            severity: 'critical',
            workOrderId: woId,
            orderNumber: curr.orderNumber,
            operationId: curr.id,
            operationName: curr.operationName,
            date: curr.scheduledDate,
            title: `Sequence Violation in ${curr.orderNumber}: Op ${curr.operationSequence} before Op ${prev.operationSequence}`,
            message: `Op ${curr.operationSequence} (${curr.operationName}) is scheduled on ${curr.scheduledDate}, but prior Op ${prev.operationSequence} (${prev.operationName}) only finishes on ${prev.scheduledDate}.`,
            suggestedAction: `Reschedule Op ${curr.operationSequence} to date on or after ${prev.scheduledDate}`,
            actionPayload: {
              actionType: 'reassign_workcenter',
              workOrderId: woId
            }
          });
        }
      }
    }

    // Check 4: Operator Skill Shortage
    // Check if required skill is staffed among available operators on that work center
    for (const op of scheduledOps) {
      if (op.requiredSkill === 'certified_welder' || op.requiredSkill === 'cnc_programmer') {
        const availableQualified = operators.filter(o => 
          o.isAvailable && 
          (o.primarySkill === op.requiredSkill || o.secondarySkills?.includes(op.requiredSkill))
        );
        if (availableQualified.length === 0) {
          alerts.push({
            id: `alert_skill_${op.id}`,
            type: 'skill_shortage',
            severity: 'high',
            workOrderId: op.workOrderId,
            orderNumber: op.orderNumber,
            operationId: op.id,
            operationName: op.operationName,
            missingSkill: op.requiredSkill,
            title: `Skill Shortage: No ${op.requiredSkill.replace('_', ' ')} staffed for Op ${op.operationSequence}`,
            message: `${op.operationName} requires a ${op.requiredSkill.replace('_', ' ')}, but none are active in the operator roster.`,
            suggestedAction: `Assign qualified operator or approve cross-training authorization`,
            actionPayload: {
              actionType: 'adjust_shift'
            }
          });
        }
      }
    }

    return alerts;
  }

  // 7. Automated Finite-Capacity Dispatch Algorithm
  // Takes Work Orders and slots operations sequentially without exceeding finite machine limits
  autoScheduleFiniteCapacity(
    workOrders: WorkOrder[],
    workCenters: WorkCenter[],
    shifts: ShiftDefinition[],
    downtimes: MachineDowntime[],
    startDateString: string
  ): ScheduledOperation[] {
    const shiftMap = new Map(shifts.map(s => [s.id, s]));
    const wcMap = new Map(workCenters.map(w => [w.id, w]));

    // Track machine allocated hours per date
    // Key: `${workCenterId}_${dateString}` => allocatedHours
    const machineDailyAllocated = new Map<string, number>();

    // Precalculate finite capacity per machine per date
    const getFiniteCap = (wcId: string, dateStr: string): number => {
      const dt = new Date(dateStr);
      const dayOfWeekIndex = dt.getDay();
      const assignedShiftIds = DEFAULT_WORK_CENTER_SHIFTS[wcId] || ['sh_morning', 'sh_evening'];

      let effHours = 0;
      for (const sId of assignedShiftIds) {
        const s = shiftMap.get(sId);
        if (s && s.workingDays.includes(dayOfWeekIndex)) {
          effHours += s.netHours * s.efficiencyFactor;
        }
      }

      // Check downtime
      const dayDowntimes = downtimes.filter(d => 
        d.workCenterId === wcId && 
        d.date === dateStr &&
        d.status !== 'cancelled'
      );
      const dtHours = dayDowntimes.reduce((sum, d) => sum + d.downtimeHours, 0);

      return Math.max(0, effHours - dtHours);
    };

    // Sort work orders by Priority (urgent first) then by Due Date (Earliest Due Date)
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const sortedOrders = [...workOrders].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    const scheduledList: ScheduledOperation[] = [];

    for (const order of sortedOrders) {
      if (order.status === 'completed' || order.status === 'cancelled') continue;

      let predecessorFinishDate: string | null = null;
      let predecessorOpId: string | null = null;

      // Ensure operations are sorted by sequence
      const sortedOps = [...(order.operations || [])].sort((a, b) => a.sequence - b.sequence);

      for (const op of sortedOps) {
        // Find matching work center
        let wc = workCenters.find(w => w.id === op.workCenterId);
        if (!wc) {
          // Fallback matching by name or type
          wc = workCenters[0];
        }

        const setupMins = op.standardTimeMinutes ? Math.min(60, op.standardTimeMinutes * 0.2) : 30;
        const cycleMins = op.standardTimeMinutes ? op.standardTimeMinutes : 2.5;
        const totalHours = parseFloat(
          ((setupMins + cycleMins * (order.quantity || 10)) / 60).toFixed(1)
        );

        const currentPredecessorFinishDate: string | undefined = predecessorFinishDate ? predecessorFinishDate : undefined;
        const currentPredecessorOpId: string | undefined = predecessorOpId ? predecessorOpId : undefined;

        // Find earliest date >= predecessorFinishDate that has enough remaining finite capacity
        const candidateDate: string = predecessorFinishDate ? predecessorFinishDate : startDateString;
        const candidateDateObj: Date = new Date(candidateDate);
        const maxSearchDays = 21; // look up to 3 weeks ahead
        let scheduledDate: string = candidateDate;

        for (let dayStep = 0; dayStep < maxSearchDays; dayStep++) {
          const testDateStr = candidateDateObj.toISOString().slice(0, 10);
          const cap = getFiniteCap(wc.id, testDateStr);
          const currentLoad = machineDailyAllocated.get(`${wc.id}_${testDateStr}`) || 0;

          // Check if this date has positive capacity and space
          // Or if load is still under capacity
          if (cap > 0 && (currentLoad + totalHours <= cap || currentLoad < cap * 0.8)) {
            scheduledDate = testDateStr;
            machineDailyAllocated.set(`${wc.id}_${testDateStr}`, currentLoad + totalHours);
            break;
          }

          // Advance to next day
          candidateDateObj.setDate(candidateDateObj.getDate() + 1);
        }

        const schedOpId = `sch_auto_${order.id}_${op.sequence}`;

        const isOverdue = order.dueDate ? scheduledDate > order.dueDate : false;

        scheduledList.push({
          id: schedOpId,
          workOrderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          partName: order.partName,
          partCode: order.partCode,
          priority: order.priority,
          operationId: op.id,
          operationSequence: op.sequence,
          operationName: op.name,
          operationType: 'machining',
          workCenterId: wc.id,
          workCenterCode: wc.code,
          workCenterName: wc.name,
          batchQuantity: order.quantity,
          setupTimeMinutes: setupMins,
          cycleTimeMinutes: cycleMins,
          totalRequiredHours: totalHours,
          scheduledDate,
          scheduledShiftId: 'sh_morning',
          scheduledStartTime: `${scheduledDate}T07:00:00`,
          scheduledEndTime: `${scheduledDate}T16:00:00`,
          durationHours: totalHours,
          requiredSkill: 'skilled_operator',
          dueDate: order.dueDate,
          status: 'scheduled',
          isOverdue,
          predecessorOperationId: currentPredecessorOpId,
          predecessorFinishDate: currentPredecessorFinishDate
        });

        predecessorFinishDate = scheduledDate;
        predecessorOpId = schedOpId;
      }
    }

    return scheduledList;
  }

  // 8. Calculate Overall Scheduling KPIs
  calculateKPIs(
    summaries: WorkCenterCapacitySummary[],
    scheduledOps: ScheduledOperation[],
    alerts: BottleneckAlert[]
  ): SchedulingKPIs {
    const totalWorkCenters = summaries.length;
    const bottleneckWorkCentersCount = summaries.filter(s => s.isBottleneck).length;

    let totalWeeklyCapacityHours = 0;
    let totalWeeklyScheduledLoadHours = 0;

    for (const s of summaries) {
      totalWeeklyCapacityHours += s.weeklyEffectiveCapacityHours;
      totalWeeklyScheduledLoadHours += s.weeklyScheduledLoadHours;
    }

    const averageFactoryUtilization = totalWeeklyCapacityHours > 0
      ? Math.round((totalWeeklyScheduledLoadHours / totalWeeklyCapacityHours) * 100)
      : 0;

    const uniqueWorkOrders = new Set(scheduledOps.map(o => o.workOrderId)).size;
    const atRiskWorkOrdersCount = new Set(
      scheduledOps.filter(o => o.isOverdue || o.isBottlenecked).map(o => o.workOrderId)
    ).size;

    return {
      totalWorkCenters,
      bottleneckWorkCentersCount,
      totalWeeklyCapacityHours: parseFloat(totalWeeklyCapacityHours.toFixed(1)),
      totalWeeklyScheduledLoadHours: parseFloat(totalWeeklyScheduledLoadHours.toFixed(1)),
      averageFactoryUtilization,
      activeWorkOrdersScheduled: uniqueWorkOrders,
      atRiskWorkOrdersCount,
      activeBottleneckAlertsCount: alerts.length
    };
  }

  // 9. Real-Time Gantt Conflict Detection
  validateGanttReschedule(
    allOps: ScheduledOperation[],
    targetOpId: string,
    targetWorkCenterId: string,
    targetDate: string,
    workCenters: WorkCenter[],
    shifts: ShiftDefinition[],
    downtimes: MachineDowntime[],
    operators: OperatorStaffing[]
  ): {
    conflicts: GanttConflict[];
    hasErrors: boolean;
    hasWarnings: boolean;
    cascadedSuccessors: ScheduledOperation[];
  } {
    const conflicts: GanttConflict[] = [];
    const targetOp = allOps.find(o => o.id === targetOpId);
    if (!targetOp) {
      return { conflicts: [], hasErrors: false, hasWarnings: false, cascadedSuccessors: [] };
    }

    const targetWc = workCenters.find(w => w.id === targetWorkCenterId);
    if (!targetWc) {
      conflicts.push({
        id: `conf_wc_missing_${Date.now()}`,
        type: 'capacity_overload',
        severity: 'critical',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWorkCenterId,
        workCenterName: 'Unknown',
        date: targetDate,
        title: 'Target Work Center Not Found',
        description: `Target machine ${targetWorkCenterId} does not exist in the factory master.`
      });
      return { conflicts, hasErrors: true, hasWarnings: false, cascadedSuccessors: [] };
    }

    // A. Check Machine Finite Capacity & Overload
    const assignedShiftIds = DEFAULT_WORK_CENTER_SHIFTS[targetWc.id] || ['sh_morning', 'sh_evening'];
    const activeShifts = shifts.filter(s => assignedShiftIds.includes(s.id));
    
    const targetDateObj = new Date(targetDate);
    const dayOfWeek = targetDateObj.getDay();

    let grossCap = 0;
    for (const sh of activeShifts) {
      if (sh.workingDays.includes(dayOfWeek)) {
        grossCap += sh.netHours * sh.efficiencyFactor;
      }
    }

    const dayDowntimes = downtimes.filter(
      d => d.workCenterId === targetWc.id && d.date === targetDate && d.status !== 'cancelled'
    );
    const downtimeHours = dayDowntimes.reduce((s, d) => s + d.downtimeHours, 0);
    const finiteAvailable = Math.max(0, grossCap - downtimeHours);

    // Existing load on target machine and date (excluding targetOp if already there)
    const existingOps = allOps.filter(
      o => o.id !== targetOpId && o.workCenterId === targetWc.id && o.scheduledDate === targetDate
    );
    const existingLoadHours = existingOps.reduce((s, o) => s + o.totalRequiredHours, 0);
    const projectedLoadHours = parseFloat((existingLoadHours + targetOp.totalRequiredHours).toFixed(1));

    if (finiteAvailable === 0 && targetOp.totalRequiredHours > 0) {
      conflicts.push({
        id: `conf_closed_${Date.now()}`,
        type: 'capacity_overload',
        severity: 'critical',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWc.id,
        workCenterName: targetWc.name,
        date: targetDate,
        title: 'Machine Closed / Zero Available Capacity',
        description: `${targetWc.name} has 0.0h available on ${targetDate} (non-working day or 100% shutdown).`,
        suggestedAction: 'Select a working weekday with active shifts or authorize emergency overtime.',
        details: { availableHours: 0, projectedLoadHours }
      });
    } else if (projectedLoadHours > finiteAvailable) {
      const overloadPercent = finiteAvailable > 0 ? Math.round((projectedLoadHours / finiteAvailable) * 100) : 999;
      const isSevere = overloadPercent > 120 || (projectedLoadHours - finiteAvailable) > 4;

      conflicts.push({
        id: `conf_cap_${Date.now()}`,
        type: 'capacity_overload',
        severity: isSevere ? 'critical' : 'warning',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWc.id,
        workCenterName: targetWc.name,
        date: targetDate,
        title: `Machine Capacity Exceeded (${overloadPercent}% load)`,
        description: `Adding ${targetOp.orderNumber} requires ${targetOp.totalRequiredHours}h. Total load will reach ${projectedLoadHours}h against ${parseFloat(finiteAvailable.toFixed(1))}h available finite capacity.`,
        suggestedAction: 'Reschedule to an earlier date with open capacity, or shift to a parallel work center.',
        details: { availableHours: parseFloat(finiteAvailable.toFixed(1)), projectedLoadHours }
      });
    }

    // B. Check Maintenance Collision
    if (dayDowntimes.length > 0) {
      const dtReasons = dayDowntimes.map(d => `${d.description} (${d.downtimeHours}h)`).join(', ');
      conflicts.push({
        id: `conf_maint_${Date.now()}`,
        type: 'maintenance_collision',
        severity: dayDowntimes.some(d => d.impactOnCapacity === 'full_shutdown') ? 'critical' : 'warning',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWc.id,
        workCenterName: targetWc.name,
        date: targetDate,
        title: 'Maintenance Downtime Window Conflict',
        description: `${targetWc.name} has scheduled maintenance on ${targetDate}: ${dtReasons}.`,
        suggestedAction: 'Avoid scheduling heavy production batches during preventive maintenance windows.',
        details: { downtimeDescription: dtReasons }
      });
    }

    // C. Check Routing Sequence Predecessors (Op N-1 must finish before or on Op N)
    const sameOrderOps = allOps.filter(o => o.workOrderId === targetOp.workOrderId && o.id !== targetOp.id);
    const predecessors = sameOrderOps
      .filter(o => o.operationSequence < targetOp.operationSequence)
      .sort((a, b) => b.operationSequence - a.operationSequence); // highest sequence predecessor first

    if (predecessors.length > 0) {
      const immediatePred = predecessors[0];
      if (immediatePred.scheduledDate > targetDate) {
        conflicts.push({
          id: `conf_pred_${Date.now()}`,
          type: 'predecessor_violation',
          severity: 'critical',
          operationId: targetOpId,
          orderNumber: targetOp.orderNumber,
          operationName: targetOp.operationName,
          workCenterId: targetWc.id,
          workCenterName: targetWc.name,
          date: targetDate,
          title: 'Routing Sequence Precedence Violation',
          description: `Prior operation Op ${immediatePred.operationSequence} (${immediatePred.operationName}) is scheduled on ${immediatePred.scheduledDate}, which is AFTER this slot (${targetDate}). Parts cannot be processed before upstream operations finish.`,
          suggestedAction: `Move this operation to ${immediatePred.scheduledDate} or later, or reschedule Op ${immediatePred.operationSequence} earlier.`,
          details: {
            predecessorDate: immediatePred.scheduledDate,
            predecessorOpSequence: immediatePred.operationSequence,
            predecessorOpName: immediatePred.operationName
          }
        });
      }
    }

    // D. Check Routing Sequence Successors & Calculate Auto-Cascading
    const successors = sameOrderOps
      .filter(o => o.operationSequence > targetOp.operationSequence)
      .sort((a, b) => a.operationSequence - b.operationSequence);

    const cascadedSuccessors: ScheduledOperation[] = [];
    let currentAnchorDate = targetDate;

    for (const succ of successors) {
      if (succ.scheduledDate < currentAnchorDate) {
        // Successor is scheduled earlier than the new date!
        conflicts.push({
          id: `conf_succ_${succ.id}_${Date.now()}`,
          type: 'successor_violation',
          severity: 'warning',
          operationId: succ.id,
          orderNumber: succ.orderNumber,
          operationName: succ.operationName,
          workCenterId: succ.workCenterId,
          workCenterName: succ.workCenterName,
          date: succ.scheduledDate,
          title: `Successor Op ${succ.operationSequence} Delay Conflict`,
          description: `Downstream operation Op ${succ.operationSequence} (${succ.operationName}) is currently set for ${succ.scheduledDate}. Because upstream Op ${targetOp.operationSequence} now finishes on ${targetDate}, Op ${succ.operationSequence} must be pushed forward.`,
          suggestedAction: 'Enable "Cascade Successors" to automatically push all downstream operations in sequence.',
          details: {
            successorDate: succ.scheduledDate,
            successorOpSequence: succ.operationSequence,
            successorOpName: succ.operationName
          }
        });

        // Compute simulated forward cascaded date: next day or same day + 1 day
        const nextDateObj = new Date(currentAnchorDate);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        // Skip Sunday if not working
        if (nextDateObj.getDay() === 0) {
          nextDateObj.setDate(nextDateObj.getDate() + 1);
        }
        const cascadedDate = nextDateObj.toISOString().slice(0, 10);
        
        cascadedSuccessors.push({
          ...succ,
          scheduledDate: cascadedDate,
          scheduledStartTime: `${cascadedDate}T08:00:00`,
          scheduledEndTime: `${cascadedDate}T16:00:00`,
          predecessorFinishDate: currentAnchorDate
        });

        currentAnchorDate = cascadedDate;
      } else {
        currentAnchorDate = succ.scheduledDate;
      }
    }

    // E. Check Customer PO Due Date Violation
    if (targetOp.dueDate && targetDate > targetOp.dueDate) {
      const dTarget = new Date(targetDate);
      const dDue = new Date(targetOp.dueDate);
      const daysOverdue = Math.max(1, Math.round((dTarget.getTime() - dDue.getTime()) / (1000 * 3600 * 24)));

      conflicts.push({
        id: `conf_due_${Date.now()}`,
        type: 'due_date_violation',
        severity: 'warning',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWc.id,
        workCenterName: targetWc.name,
        date: targetDate,
        title: `Customer Delivery Date Breach (+${daysOverdue} days)`,
        description: `Scheduled date ${targetDate} is ${daysOverdue} days after the customer PO committed delivery date (${targetOp.dueDate}).`,
        suggestedAction: 'Expedite operation to earlier available window or notify customer of revised dispatch ETA.',
        details: { dueDate: targetOp.dueDate, daysOverdue }
      });
    }

    // F. Check Operator Skill Compatibility on Target Work Center
    const targetWcOperator = operators.find(
      op => op.isAvailable && op.assignedWorkCenterIds?.includes(targetWc.id)
    );
    if (!targetWcOperator && targetWc.department === 'Machining') {
      conflicts.push({
        id: `conf_skill_${Date.now()}`,
        type: 'skill_mismatch',
        severity: 'info',
        operationId: targetOpId,
        orderNumber: targetOp.orderNumber,
        operationName: targetOp.operationName,
        workCenterId: targetWc.id,
        workCenterName: targetWc.name,
        date: targetDate,
        title: 'Dedicated Operator Unassigned',
        description: `No dedicated skilled operator is currently assigned to ${targetWc.name} for this operation.`,
        suggestedAction: 'Assign a qualified operator in Shift Patterns & Staffing roster.'
      });
    }

    const hasErrors = conflicts.some(c => c.severity === 'critical');
    const hasWarnings = conflicts.some(c => c.severity === 'warning');

    return {
      conflicts,
      hasErrors,
      hasWarnings,
      cascadedSuccessors
    };
  }

  // 10. Execute Reschedule with Optional Cascade
  async executeGanttReschedule(
    tenantId: string,
    operationId: string,
    targetWorkCenterId: string,
    targetDate: string,
    cascadeSuccessors: boolean = false,
    targetShiftId?: string,
    isSandbox: boolean = false
  ): Promise<ScheduledOperation[]> {
    const list = await this.getScheduledOperations(tenantId, isSandbox);
    const op = list.find(o => o.id === operationId);
    if (!op) return list;

    const allWorkCenters = SEED_WORK_CENTERS;
    const targetWc = allWorkCenters.find(w => w.id === targetWorkCenterId);

    // Update the main operation
    op.scheduledDate = targetDate;
    if (targetShiftId) op.scheduledShiftId = targetShiftId;
    if (targetWc && targetWc.id !== op.workCenterId) {
      op.workCenterId = targetWc.id;
      op.workCenterCode = targetWc.code;
      op.workCenterName = targetWc.name;
    }

    op.isOverdue = op.dueDate ? targetDate > op.dueDate : false;

    // Optional: Cascade Downstream Successors
    if (cascadeSuccessors) {
      const sameOrderOps = list
        .filter(o => o.workOrderId === op.workOrderId && o.id !== op.id && o.operationSequence > op.operationSequence)
        .sort((a, b) => a.operationSequence - b.operationSequence);

      let anchorDate = targetDate;
      for (const succ of sameOrderOps) {
        if (succ.scheduledDate <= anchorDate) {
          const nextDateObj = new Date(anchorDate);
          nextDateObj.setDate(nextDateObj.getDate() + 1);
          if (nextDateObj.getDay() === 0) {
            nextDateObj.setDate(nextDateObj.getDate() + 1); // skip Sunday
          }
          const cascadedDate = nextDateObj.toISOString().slice(0, 10);
          succ.scheduledDate = cascadedDate;
          succ.scheduledStartTime = `${cascadedDate}T08:00:00`;
          succ.scheduledEndTime = `${cascadedDate}T16:00:00`;
          succ.predecessorFinishDate = anchorDate;
          succ.isOverdue = succ.dueDate ? cascadedDate > succ.dueDate : false;
          anchorDate = cascadedDate;
        } else {
          anchorDate = succ.scheduledDate;
        }
      }
    }

    await this.saveScheduledOperations(tenantId, list, isSandbox);
    return list;
  }
}

export const schedulingService = new FiniteSchedulingService();

