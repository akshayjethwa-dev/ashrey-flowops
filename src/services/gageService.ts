// src/services/gageService.ts

import {
  GageInstrument,
  CalibrationRecord,
  GageCalibrationStatus,
  GageKpiSummary,
  GageFilterOptions
} from '../types/gageCalibration';

const GAGE_STORAGE_KEY = 'mes_gage_master_v1';

// Calculate days remaining and calibration status
export function computeGageStatus(
  dueDateStr: string,
  currentStatus: GageCalibrationStatus
): { status: GageCalibrationStatus; daysRemaining: number; isBlocked: boolean } {
  if (currentStatus === 'out_of_service' || currentStatus === 'scrapped') {
    return { status: currentStatus, daysRemaining: 0, isBlocked: true };
  }

  const now = new Date();
  // Normalize to start of day
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const due = new Date(dueDateStr).getTime();
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', daysRemaining: diffDays, isBlocked: true };
  } else if (diffDays <= 15) {
    return { status: 'due_soon', daysRemaining: diffDays, isBlocked: false };
  } else {
    return { status: 'in_calibration', daysRemaining: diffDays, isBlocked: false };
  }
}

// Initial Gage Inventory Seed
const INITIAL_GAGES: GageInstrument[] = [
  {
    id: 'gage-001',
    assetTag: 'GAG-MIC-014',
    name: 'Mitutoyo 3-Point Bore Micrometer 50-75mm',
    instrumentType: 'bore_gauge',
    manufacturer: 'Mitutoyo',
    modelNumber: '368-171',
    serialNumber: 'SN-BM-8849102',
    location: 'CNC HAAS-01 Machining Cell',
    department: 'Machining Shopfloor',
    measurementRange: '50.000 - 75.000 mm',
    resolution: '0.001 mm',
    accuracy: '± 0.002 mm',
    calibrationFrequencyMonths: 6,
    lastCalibrationDate: '2026-06-15',
    nextCalibrationDueDate: '2026-12-15',
    calibrationStatus: 'in_calibration',
    daysRemaining: 64,
    activeCertificateNumber: 'CERT-NIST-2026-0881',
    calibratedBy: 'Trescal Accredited Lab #A2LA-189',
    masterStandardRef: 'Mitutoyo Setting Ring Ø50.000mm #SR-50',
    isBlockedForInspection: false,
    assignedTo: 'Alex Rivera (Sr. CNC Machinist)',
    notes: 'Used for H7 internal guide bore verification on OP-CNC-02.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    history: [
      {
        id: 'rec-101',
        gageId: 'gage-001',
        calibrationDate: '2026-06-15',
        nextDueDate: '2026-12-15',
        certificateNumber: 'CERT-NIST-2026-0881',
        calibratedBy: 'David Miller (Lead Metrologist)',
        agencyOrLab: 'Trescal Precision Calibration ISO/IEC 17025',
        passFail: 'passed',
        asFoundCondition: 'Within tolerance (+0.0008 mm)',
        asLeftCondition: 'Adjusted to zero error ±0.0004 mm',
        calibrationStandardUsed: 'NIST Traceable Setting Rings Class XXX (NIST #821/2839)',
        measurementUncertainty: 'U = 0.0007 mm (k=2)',
        temperatureC: 20.1,
        humidityPct: 44,
        cost: 165,
        signedBy: 'David Miller, Certified Metrology Tech'
      }
    ]
  },
  {
    id: 'gage-002',
    assetTag: 'GAG-CAL-002',
    name: 'Mitutoyo Absolute Digimatic Caliper 0-200mm',
    instrumentType: 'caliper',
    manufacturer: 'Mitutoyo',
    modelNumber: '500-197-30',
    serialNumber: 'SN-CAL-4491029',
    location: 'Dock Receiving IQC Bench',
    department: 'Quality Assurance - Inward Goods',
    measurementRange: '0.00 - 200.00 mm',
    resolution: '0.01 mm',
    accuracy: '± 0.02 mm',
    calibrationFrequencyMonths: 12,
    lastCalibrationDate: '2026-01-20',
    nextCalibrationDueDate: '2027-01-20',
    calibrationStatus: 'in_calibration',
    daysRemaining: 100,
    activeCertificateNumber: 'CERT-CAL-2026-0129',
    calibratedBy: 'In-House Metrology Lab',
    masterStandardRef: 'Grade 0 Ceramic Gage Block Set #GB-004',
    isBlockedForInspection: false,
    assignedTo: 'Marcus Vance (Receiving QA Inspector)',
    notes: 'Primary caliper for dock receiving and IQC raw material inspection.',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-20T09:00:00Z',
    history: [
      {
        id: 'rec-102',
        gageId: 'gage-002',
        calibrationDate: '2026-01-20',
        nextDueDate: '2027-01-20',
        certificateNumber: 'CERT-CAL-2026-0129',
        calibratedBy: 'Sarah Jenkins',
        agencyOrLab: 'In-House Metrology Lab',
        passFail: 'passed',
        asFoundCondition: 'Zero deviation across all 5 test block steps',
        asLeftCondition: 'Passed as found',
        calibrationStandardUsed: 'Mitutoyo Grade 0 Gage Blocks (NIST #821/2839)',
        temperatureC: 20.0,
        humidityPct: 45,
        signedBy: 'Sarah Jenkins, QA Metrologist'
      }
    ]
  },
  {
    id: 'gage-003',
    assetTag: 'GAG-CAL-004',
    name: 'Starrett Electronic Vernier Caliper 0-150mm',
    instrumentType: 'caliper',
    manufacturer: 'Starrett',
    modelNumber: '798B-6/150',
    serialNumber: 'SN-ST-9921041',
    location: 'Assembly & Deburring Bay 2',
    department: 'Production Assembly',
    measurementRange: '0.00 - 150.00 mm',
    resolution: '0.01 mm',
    accuracy: '± 0.02 mm',
    calibrationFrequencyMonths: 6,
    lastCalibrationDate: '2026-04-01',
    nextCalibrationDueDate: '2026-10-01', // OVERDUE / EXPIRED!
    calibrationStatus: 'expired',
    daysRemaining: -11,
    activeCertificateNumber: 'CERT-ST-2026-0401',
    calibratedBy: 'In-House Metrology Lab',
    masterStandardRef: 'Grade 0 Gage Blocks #GB-002',
    isBlockedForInspection: true,
    assignedTo: 'Vikram Patel',
    notes: 'EXPIRED! Calibration expired 11 days ago. Blocked from taking compliance measurements per ISO 9001 / IATF 16949.',
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2026-10-02T08:00:00Z',
    history: [
      {
        id: 'rec-103',
        gageId: 'gage-003',
        calibrationDate: '2026-04-01',
        nextDueDate: '2026-10-01',
        certificateNumber: 'CERT-ST-2026-0401',
        calibratedBy: 'Sarah Jenkins',
        agencyOrLab: 'In-House Metrology Lab',
        passFail: 'passed',
        asFoundCondition: 'Clean, jaws aligned',
        asLeftCondition: 'Zero error',
        calibrationStandardUsed: 'NIST Grade 0 Blocks',
        signedBy: 'Sarah Jenkins'
      }
    ]
  },
  {
    id: 'gage-004',
    assetTag: 'GAG-HRC-001',
    name: 'Wilson Rockwell Hardness Tester Model 574',
    instrumentType: 'hardness_tester',
    manufacturer: 'Buehler / Wilson',
    modelNumber: '574T',
    serialNumber: 'SN-WLS-574091',
    location: 'Central Metallurgy & Metrology Lab',
    department: 'Quality Assurance Lab',
    measurementRange: '20.0 - 70.0 HRC',
    resolution: '0.1 HRC',
    accuracy: '± 0.5 HRC',
    calibrationFrequencyMonths: 12,
    lastCalibrationDate: '2025-10-17',
    nextCalibrationDueDate: '2026-10-17', // DUE SOON in 5 days!
    calibrationStatus: 'due_soon',
    daysRemaining: 5,
    activeCertificateNumber: 'CERT-HRC-2025-1017',
    calibratedBy: 'Buehler Certified Field Calibration',
    masterStandardRef: 'ASTM E18 Standard Hardness Test Blocks HRC 25, 45, 63',
    isBlockedForInspection: false,
    assignedTo: 'Frank Dubois (Metallurgical Tech)',
    notes: 'Calibration due in 5 days. Annual direct load cell and indenter inspection scheduled.',
    createdAt: '2024-10-17T08:00:00Z',
    updatedAt: '2025-10-17T08:00:00Z',
    history: [
      {
        id: 'rec-104',
        gageId: 'gage-004',
        calibrationDate: '2025-10-17',
        nextDueDate: '2026-10-17',
        certificateNumber: 'CERT-HRC-2025-1017',
        calibratedBy: 'Buehler Service Engineer Robert Lang',
        agencyOrLab: 'Buehler Field Metrology Service ISO 17025',
        passFail: 'passed',
        asFoundCondition: 'Within ±0.3 HRC across all 3 test blocks',
        asLeftCondition: 'Direct verified load cells, diamond brale indenter inspected under 40x optics',
        calibrationStandardUsed: 'ASTM E18 Traceable Standard Blocks #BLK-63HRC',
        temperatureC: 21.0,
        humidityPct: 40,
        cost: 620,
        signedBy: 'Robert Lang, Buehler Service'
      }
    ]
  },
  {
    id: 'gage-005',
    assetTag: 'GAG-SJR-003',
    name: 'Mitutoyo SJ-210 Surface Roughness Tester',
    instrumentType: 'roughness_tester',
    manufacturer: 'Mitutoyo',
    modelNumber: 'SJ-210',
    serialNumber: 'SN-SJ-3109401',
    location: 'Central Metallurgy & Metrology Lab',
    department: 'Quality Assurance Lab',
    measurementRange: '0.01 - 350.00 µm Ra',
    resolution: '0.001 µm',
    accuracy: '± 0.05 µm',
    calibrationFrequencyMonths: 12,
    lastCalibrationDate: '2026-05-10',
    nextCalibrationDueDate: '2027-05-10',
    calibrationStatus: 'in_calibration',
    daysRemaining: 210,
    activeCertificateNumber: 'CERT-RGH-2026-0510',
    calibratedBy: 'Trescal Accredited Metrology',
    masterStandardRef: 'Mitutoyo Precision Roughness Specimen Ra 2.97µm #178-601',
    isBlockedForInspection: false,
    assignedTo: 'Sarah Jenkins',
    notes: 'Used for surface finish Ra certification on IPQC and IQC ground parts.',
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-05-10T08:00:00Z',
    history: [
      {
        id: 'rec-105',
        gageId: 'gage-005',
        calibrationDate: '2026-05-10',
        nextDueDate: '2027-05-10',
        certificateNumber: 'CERT-RGH-2026-0510',
        calibratedBy: 'David Miller',
        agencyOrLab: 'Trescal Metrology ISO 17025',
        passFail: 'passed',
        asFoundCondition: 'Stylus tip radius verified 2µm, Ra calibrated on precision glass standard',
        asLeftCondition: 'Passed in tolerance',
        calibrationStandardUsed: 'Mitutoyo Calibration Standard Ra 2.97µm',
        temperatureC: 20.0,
        humidityPct: 45,
        signedBy: 'David Miller'
      }
    ]
  },
  {
    id: 'gage-006',
    assetTag: 'GAG-THP-022',
    name: 'Vermont Gage Class X M12x1.75 6H Go/No-Go Thread Plug',
    instrumentType: 'plug_thread_gauge',
    manufacturer: 'Vermont Gage',
    modelNumber: 'M12x1.75-6H',
    serialNumber: 'SN-VG-91820',
    location: 'Machining Tool Crib - Drawer 4',
    department: 'Machining Shopfloor',
    measurementRange: 'M12 x 1.75 mm Pitch',
    resolution: 'Go / No-Go Class X',
    accuracy: 'Class X (+0.002/-0.000 mm)',
    calibrationFrequencyMonths: 6,
    lastCalibrationDate: '2026-07-01',
    nextCalibrationDueDate: '2027-01-01',
    calibrationStatus: 'in_calibration',
    daysRemaining: 81,
    activeCertificateNumber: 'CERT-THD-2026-0701',
    calibratedBy: 'In-House Metrology Lab',
    masterStandardRef: 'Universal Measuring Machine 3-Wire Thread Pitch System',
    isBlockedForInspection: false,
    assignedTo: 'Alex Rivera',
    notes: 'Standard thread verification gauge for M12 tapped holes.',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-01T08:00:00Z',
    history: []
  },
  {
    id: 'gage-007',
    assetTag: 'GAG-DEP-008',
    name: 'Fowler Digimatic Depth Micrometer 0-100mm',
    instrumentType: 'micrometer',
    manufacturer: 'Fowler',
    modelNumber: '54-225-456',
    serialNumber: 'SN-FW-330192',
    location: 'Metrology Lab - Quarantine Shelf',
    department: 'Quality Assurance',
    measurementRange: '0 - 100 mm',
    resolution: '0.001 mm',
    accuracy: '± 0.003 mm',
    calibrationFrequencyMonths: 6,
    lastCalibrationDate: '2026-02-10',
    nextCalibrationDueDate: '2026-08-10',
    calibrationStatus: 'out_of_service',
    daysRemaining: 0,
    activeCertificateNumber: 'CERT-FW-2026-0210',
    isBlockedForInspection: true,
    notes: 'QUARANTINED! Thimble ratchet slip mechanism worn. Sent to Fowler Factory Service for rebuild.',
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-08-11T08:00:00Z',
    history: []
  }
];

// Load from storage and re-compute dynamic daysRemaining and expired states
function loadHydratedGages(): GageInstrument[] {
  let stored: GageInstrument[] = [];
  try {
    const raw = localStorage.getItem(GAGE_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading gage master from storage:', e);
  }

  if (!stored || stored.length === 0) {
    stored = INITIAL_GAGES;
  }

  return stored.map(g => {
    const computed = computeGageStatus(g.nextCalibrationDueDate, g.calibrationStatus);
    return {
      ...g,
      calibrationStatus: computed.status,
      daysRemaining: computed.daysRemaining,
      isBlockedForInspection: computed.isBlocked
    };
  });
}

function persistGages(gages: GageInstrument[]) {
  try {
    localStorage.setItem(GAGE_STORAGE_KEY, JSON.stringify(gages));
  } catch (e) {
    console.error('Failed saving gages to storage:', e);
  }
}

export const gageService = {
  // Get all gages with filtering
  getGages(filter?: GageFilterOptions): GageInstrument[] {
    const all = loadHydratedGages();
    if (!filter) return all;

    return all.filter(g => {
      // Search
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const matches =
          g.name.toLowerCase().includes(q) ||
          g.assetTag.toLowerCase().includes(q) ||
          g.serialNumber.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          g.manufacturer.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (filter.status && filter.status !== 'all') {
        if (g.calibrationStatus !== filter.status) return false;
      }

      // Type
      if (filter.type && filter.type !== 'all') {
        if (g.instrumentType !== filter.type) return false;
      }

      // Due Window
      if (filter.dueWindow && filter.dueWindow !== 'all') {
        if (filter.dueWindow === 'expired' && g.calibrationStatus !== 'expired') return false;
        if (filter.dueWindow === 'due_15_days' && (g.daysRemaining < 0 || g.daysRemaining > 15)) return false;
        if (filter.dueWindow === 'due_30_days' && (g.daysRemaining < 0 || g.daysRemaining > 30)) return false;
        if (filter.dueWindow === 'valid' && g.calibrationStatus !== 'in_calibration') return false;
      }

      return true;
    });
  },

  // Get gage by ID
  getGageById(id: string): GageInstrument | null {
    const all = loadHydratedGages();
    return all.find(g => g.id === id) || null;
  },

  // Get gage by Asset Tag
  getGageByAssetTag(tag: string): GageInstrument | null {
    const all = loadHydratedGages();
    return all.find(g => g.assetTag.toLowerCase() === tag.toLowerCase()) || null;
  },

  // CRITICAL ACCEPTANCE CRITERIA:
  // "block inspections with out-of-calibration gages, so that measurement integrity is maintained"
  checkGageValidity(instrumentNameOrTag: string): {
    isValid: boolean;
    gage?: GageInstrument;
    status: GageCalibrationStatus;
    message: string;
    blockedReason?: string;
  } {
    if (!instrumentNameOrTag) {
      return {
        isValid: true,
        status: 'in_calibration',
        message: 'No specific instrument asset tag registered.'
      };
    }

    const all = loadHydratedGages();
    const cleanSearch = instrumentNameOrTag.toLowerCase();

    // Match by exact tag or substring
    const matched = all.find(
      g =>
        g.assetTag.toLowerCase() === cleanSearch ||
        cleanSearch.includes(g.assetTag.toLowerCase()) ||
        g.name.toLowerCase().includes(cleanSearch) ||
        cleanSearch.includes(g.name.toLowerCase())
    );

    if (!matched) {
      // If instrument name doesn't match an exact master asset tag, treat as unverified warning
      return {
        isValid: true,
        status: 'in_calibration',
        message: `Generic instrument "${instrumentNameOrTag}" without asset tag tracking.`
      };
    }

    if (matched.calibrationStatus === 'expired') {
      return {
        isValid: false,
        gage: matched,
        status: 'expired',
        message: `BLOCKED: Gage ${matched.assetTag} (${matched.name}) is EXPIRED since ${matched.nextCalibrationDueDate} (${Math.abs(matched.daysRemaining)} days overdue)!`,
        blockedReason: `Calibration overdue by ${Math.abs(matched.daysRemaining)} days. Quality inspections with expired gages are prohibited under ISO 9001, IATF 16949 & 21 CFR Part 820.`
      };
    }

    if (matched.calibrationStatus === 'out_of_service' || matched.calibrationStatus === 'scrapped') {
      return {
        isValid: false,
        gage: matched,
        status: matched.calibrationStatus,
        message: `BLOCKED: Gage ${matched.assetTag} is marked ${matched.calibrationStatus.toUpperCase()}!`,
        blockedReason: `Instrument is quarantined or out of service. Please choose a certified gage from the Metrology Lab.`
      };
    }

    if (matched.calibrationStatus === 'due_soon') {
      return {
        isValid: true,
        gage: matched,
        status: 'due_soon',
        message: `NOTICE: Gage ${matched.assetTag} is due for calibration in ${matched.daysRemaining} days (${matched.nextCalibrationDueDate}).`
      };
    }

    return {
      isValid: true,
      gage: matched,
      status: 'in_calibration',
      message: `Verified: Gage ${matched.assetTag} is active and calibrated until ${matched.nextCalibrationDueDate}.`
    };
  },

  // Record Calibration Certificate & Reset Expiration Date
  recordCalibration(gageId: string, recordData: Omit<CalibrationRecord, 'id'>): GageInstrument {
    const all = loadHydratedGages();
    const idx = all.findIndex(g => g.id === gageId);
    if (idx === -1) throw new Error('Gage not found');

    const gage = all[idx];

    // Compute next due date from frequency if not manually given
    let nextDueDate = recordData.nextDueDate;
    if (!nextDueDate) {
      const calDate = new Date(recordData.calibrationDate);
      calDate.setMonth(calDate.getMonth() + (gage.calibrationFrequencyMonths || 12));
      nextDueDate = calDate.toISOString().slice(0, 10);
    }

    const newRecord: CalibrationRecord = {
      ...recordData,
      id: `cal-rec-${Date.now()}`,
      nextDueDate
    };

    const isPassed = recordData.passFail === 'passed' || recordData.passFail === 'adjusted_passed';
    const newStatus: GageCalibrationStatus = isPassed ? 'in_calibration' : 'out_of_service';

    const updatedGage: GageInstrument = {
      ...gage,
      lastCalibrationDate: recordData.calibrationDate,
      nextCalibrationDueDate: nextDueDate,
      calibrationStatus: newStatus,
      activeCertificateNumber: recordData.certificateNumber,
      calibratedBy: recordData.calibratedBy || recordData.agencyOrLab,
      isBlockedForInspection: !isPassed,
      history: [newRecord, ...(gage.history || [])],
      updatedAt: new Date().toISOString()
    };

    // Recompute days
    const computed = computeGageStatus(nextDueDate, newStatus);
    updatedGage.daysRemaining = computed.daysRemaining;

    all[idx] = updatedGage;
    persistGages(all);
    return updatedGage;
  },

  // Save / Update Gage Master
  saveGage(gageData: Partial<GageInstrument>): GageInstrument {
    const all = loadHydratedGages();
    const nowStr = new Date().toISOString();

    if (gageData.id) {
      const idx = all.findIndex(g => g.id === gageData.id);
      if (idx >= 0) {
        const computed = computeGageStatus(
          gageData.nextCalibrationDueDate || all[idx].nextCalibrationDueDate,
          gageData.calibrationStatus || all[idx].calibrationStatus
        );

        all[idx] = {
          ...all[idx],
          ...gageData,
          calibrationStatus: computed.status,
          daysRemaining: computed.daysRemaining,
          isBlockedForInspection: computed.isBlocked,
          updatedAt: nowStr
        } as GageInstrument;

        persistGages(all);
        return all[idx];
      }
    }

    // New Gage
    const newGage: GageInstrument = {
      id: `gage-${Date.now()}`,
      assetTag: gageData.assetTag || `GAG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: gageData.name || 'New Measuring Instrument',
      instrumentType: gageData.instrumentType || 'caliper',
      manufacturer: gageData.manufacturer || 'Mitutoyo',
      modelNumber: gageData.modelNumber || 'MOD-100',
      serialNumber: gageData.serialNumber || `SN-${Date.now()}`,
      location: gageData.location || 'Metrology Lab',
      department: gageData.department || 'Quality Assurance',
      measurementRange: gageData.measurementRange || '0 - 150 mm',
      resolution: gageData.resolution || '0.01 mm',
      accuracy: gageData.accuracy || '± 0.02 mm',
      calibrationFrequencyMonths: gageData.calibrationFrequencyMonths || 12,
      lastCalibrationDate: gageData.lastCalibrationDate || nowStr.slice(0, 10),
      nextCalibrationDueDate: gageData.nextCalibrationDueDate || nowStr.slice(0, 10),
      calibrationStatus: 'in_calibration',
      daysRemaining: 365,
      isBlockedForInspection: false,
      history: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      ...gageData
    } as GageInstrument;

    const computed = computeGageStatus(newGage.nextCalibrationDueDate, newGage.calibrationStatus);
    newGage.calibrationStatus = computed.status;
    newGage.daysRemaining = computed.daysRemaining;
    newGage.isBlockedForInspection = computed.isBlocked;

    all.unshift(newGage);
    persistGages(all);
    return newGage;
  },

  // Quarantine or retire gage
  quarantineGage(gageId: string, reason: string): GageInstrument {
    const all = loadHydratedGages();
    const idx = all.findIndex(g => g.id === gageId);
    if (idx === -1) throw new Error('Gage not found');

    all[idx] = {
      ...all[idx],
      calibrationStatus: 'out_of_service',
      isBlockedForInspection: true,
      notes: `QUARANTINED: ${reason}`,
      updatedAt: new Date().toISOString()
    };

    persistGages(all);
    return all[idx];
  },

  // KPI Summary
  getKpiSummary(): GageKpiSummary {
    const all = loadHydratedGages();
    const inCal = all.filter(g => g.calibrationStatus === 'in_calibration').length;
    const dueSoon = all.filter(g => g.calibrationStatus === 'due_soon').length;
    const expired = all.filter(g => g.calibrationStatus === 'expired').length;
    const outOfService = all.filter(g => g.calibrationStatus === 'out_of_service' || g.calibrationStatus === 'scrapped').length;

    const activeTotal = all.length - outOfService;
    const complianceRate = activeTotal > 0 ? Math.round(((inCal + dueSoon) / activeTotal) * 100) : 100;

    return {
      totalInstruments: all.length,
      inCalibrationCount: inCal,
      dueSoonCount: dueSoon,
      expiredBlockedCount: expired,
      outOfServiceCount: outOfService,
      complianceRatePct: complianceRate
    };
  },

  // Alerts for due-date banners
  getDueAlerts(): { expired: GageInstrument[]; dueSoon: GageInstrument[] } {
    const all = loadHydratedGages();
    return {
      expired: all.filter(g => g.calibrationStatus === 'expired'),
      dueSoon: all.filter(g => g.calibrationStatus === 'due_soon')
    };
  },

  // Export CSV
  exportCsv(): string {
    const all = loadHydratedGages();
    const headers = [
      'Asset Tag',
      'Instrument Name',
      'Type',
      'Manufacturer',
      'Model',
      'Serial Number',
      'Location',
      'Department',
      'Range',
      'Resolution',
      'Accuracy',
      'Frequency (Mo)',
      'Last Cal Date',
      'Next Due Date',
      'Status',
      'Days Overdue/Remaining',
      'Blocked For Inspection',
      'Certificate #',
      'Calibrated By'
    ];

    const rows = all.map(g => [
      g.assetTag,
      g.name,
      g.instrumentType,
      g.manufacturer,
      g.modelNumber,
      g.serialNumber,
      g.location,
      g.department,
      g.measurementRange,
      g.resolution,
      g.accuracy,
      g.calibrationFrequencyMonths.toString(),
      g.lastCalibrationDate,
      g.nextCalibrationDueDate,
      g.calibrationStatus,
      g.daysRemaining.toString(),
      g.isBlockedForInspection ? 'YES - BLOCKED' : 'NO',
      g.activeCertificateNumber || 'N/A',
      g.calibratedBy || 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${c}"`).join(','))
      .join('\n');

    return csvContent;
  }
};
