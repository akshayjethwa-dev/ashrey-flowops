// src/types/gageCalibration.ts

export type GageInstrumentType =
  | 'micrometer'
  | 'caliper'
  | 'height_gauge'
  | 'hardness_tester'
  | 'roughness_tester'
  | 'plug_thread_gauge'
  | 'bore_gauge'
  | 'dial_indicator'
  | 'cmm_probe'
  | 'torque_wrench'
  | 'optical_comparator'
  | 'pressure_gauge'
  | 'thermometer';

export type GageCalibrationStatus =
  | 'in_calibration'   // Valid & ready for shopfloor inspection
  | 'due_soon'         // Approaching due date within 15 days
  | 'expired'          // BLOCKS INSPECTION! Past calibration date
  | 'out_of_service'   // Damaged, sent to external lab, quarantined
  | 'scrapped';        // Decommissioned

export interface CalibrationRecord {
  id: string;
  gageId: string;
  calibrationDate: string;
  nextDueDate: string;
  certificateNumber: string;
  calibratedBy: string;             // Metrologist name or Accredited Lab (e.g. "Trescal Metrology ISO 17025")
  agencyOrLab: string;
  passFail: 'passed' | 'adjusted_passed' | 'failed_rejected';
  asFoundCondition: string;         // e.g. "Within spec (+0.001 mm)", "Out of tolerance (-0.004 mm)"
  asLeftCondition: string;          // e.g. "Calibrated to zero error ±0.0005 mm"
  calibrationStandardUsed: string;  // e.g. "Grade 0 Ceramic Gage Blocks NIST #821/2839"
  measurementUncertainty?: string;  // e.g. "U = 0.0008 mm (k=2)"
  temperatureC?: number;            // Standard 20°C ± 1°C
  humidityPct?: number;
  cost?: number;
  certificateUrl?: string;
  signedBy: string;
  notes?: string;
}

export interface GageInstrument {
  id: string;
  assetTag: string;                 // Control barcode e.g. "GAG-MIC-014"
  name: string;                     // e.g. "Mitutoyo 3-Point Bore Micrometer 50-75mm"
  instrumentType: GageInstrumentType;
  manufacturer: string;             // e.g. "Mitutoyo", "Starrett", "Fowler"
  modelNumber: string;              // e.g. "368-171"
  serialNumber: string;             // e.g. "SN-8849102"
  location: string;                 // e.g. "Metrology Lab - Cabinet A", "CNC HAAS-01 Cell"
  department: string;               // e.g. "Quality Assurance", "Machining Shopfloor", "Dock Receiving"
  measurementRange: string;         // e.g. "50 - 75 mm", "0 - 200 mm", "20 - 70 HRC"
  resolution: string;               // e.g. "0.001 mm", "0.01 mm", "0.1 HRC"
  accuracy: string;                 // e.g. "± 0.002 mm"
  calibrationFrequencyMonths: number; // e.g. 6, 12, 3
  lastCalibrationDate: string;      // YYYY-MM-DD
  nextCalibrationDueDate: string;   // YYYY-MM-DD
  calibrationStatus: GageCalibrationStatus;
  daysRemaining: number;            // Positive = days left, Negative = days overdue
  activeCertificateNumber?: string;
  calibratedBy?: string;
  masterStandardRef?: string;
  history: CalibrationRecord[];
  isBlockedForInspection: boolean;  // Automatically true if expired or out_of_service
  assignedTo?: string;              // Lead operator or inspector custodian
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GageKpiSummary {
  totalInstruments: number;
  inCalibrationCount: number;
  dueSoonCount: number;             // Due within 15 days
  expiredBlockedCount: number;      // Past due date
  outOfServiceCount: number;
  complianceRatePct: number;        // (inCalibration / (total - outOfService)) * 100
}

export interface GageFilterOptions {
  searchQuery?: string;
  status?: 'all' | GageCalibrationStatus;
  type?: 'all' | GageInstrumentType;
  location?: 'all' | string;
  dueWindow?: 'all' | 'expired' | 'due_15_days' | 'due_30_days' | 'valid';
}
