// src/types/genealogy.ts

export type TrackingLevel = 'unit' | 'batch';

export type ProductionItemStatus = 
  | 'queued'
  | 'in_production'
  | 'completed'
  | 'quarantined'
  | 'rework'
  | 'scrapped'
  | 'dispatched';

export type OperationStepStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'hold'
  | 'rework'
  | 'passed';

export interface OperationQcParam {
  paramName: string;
  specification: string;
  measuredValue: string;
  status: 'pass' | 'fail' | 'marginal';
  inspectorName?: string;
}

export interface OperationGenealogyStep {
  stepId: string;
  sequence: number;           // 10, 20, 30, 40...
  operationName: string;      // e.g. "Billet Cutting", "CNC Milling", "Heat Treatment"
  workCenterId: string;
  workCenterName: string;     // e.g. "Sawing Cell 1", "CNC Milling Center"
  machineId: string;
  machineName: string;        // e.g. "Doosan DNM 5700", "Induction Furnace #2"
  machineCode: string;        // e.g. "MC-CNC-04"
  operatorId: string;
  operatorName: string;       // e.g. "Vikram Rao"
  operatorBadge: string;      // e.g. "EMP-104"
  startedAt: string;          // ISO string
  completedAt?: string;       // ISO string or undefined if active
  durationMinutes: number;    // Computed duration in minutes
  plannedDurationMinutes: number;
  status: OperationStepStatus;
  qcParameters: OperationQcParam[];
  machineParameters?: {
    spindleSpeedRpm?: number;
    feedRateMmpm?: number;
    temperatureCelsius?: number;
    pressureBar?: number;
    coolantConcentration?: string;
  };
  consumedRawLots: Array<{
    lotNumber: string;
    materialGrade: string;
    heatNumber: string;
    qtyConsumed: number;
    unit: string;
  }>;
  notes?: string;
  signOffHash?: string;
}

export interface ProductionGenealogyRecord {
  id: string;
  tenantId: string;
  trackingLevel: TrackingLevel;      // 'unit' (serialized) or 'batch' (lot-based)
  identifier: string;                // e.g. "SN-2026-ENG-0891" or "BATCH-2026-LOT-0042"
  barcode: string;                   // Scannable barcode string
  qrCodeUrl?: string;                // QR preview string / data
  batchQuantity: number;             // 1 for unit, >1 for batch
  unitOfMeasure: string;             // "pcs", "units", "sets"

  // Order & Product Linkage
  workOrderId: string;
  workOrderNumber: string;           // e.g. "WO-2026-001"
  salesOrderId?: string;
  salesOrderNumber?: string;         // e.g. "SO-2026-0012"
  customerName: string;              // e.g. "Bajaj Auto Ltd. — Chakan Plant"
  customerPoNumber?: string;         // e.g. "PO-BAJAJ-8812"
  partNumber: string;                // e.g. "CRK-8802"
  partName: string;                  // e.g. "Forged Crankshaft — 4-Cylinder Turbo"
  drawingNumber?: string;            // e.g. "DWG-REV-D-09"
  revision?: string;                 // e.g. "Rev D"

  // Upstream Raw Material Roots
  rawMaterialSummary: {
    primaryLotNumber: string;        // e.g. "LOT-2026-RM-0412"
    materialGrade: string;           // e.g. "EN8D (AISI 1045)"
    heatNumber: string;              // e.g. "HT-TATA-9942"
    supplierName: string;            // e.g. "Tata Prime Steel Ltd."
    mtrNumber: string;               // e.g. "MTR-TATA-2026-9942A"
    poNumber: string;                // e.g. "PO-2026-902"
    grnNumber: string;               // e.g. "GRN-2026-0182"
  };

  // Operational Traveler Progression
  currentSequence: number;
  currentOperationName: string;
  operations: OperationGenealogyStep[];

  // Life Cycle & Quality
  status: ProductionItemStatus;
  qualityDisposition: 'passed' | 'pending' | 'conditional' | 'quarantined';
  finalQcInspector?: string;
  finalQcDate?: string;
  certificateOfConformanceNumber?: string;

  // Downstream Shipping Linkage (if dispatched)
  dispatchRecord?: {
    invoiceNumber: string;
    dispatchDate: string;
    lorryReceiptNumber: string;
    destinationCity: string;
    recipientPlant: string;
  };

  // Timestamps & Audit
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
  complianceHash: string; // SHA-256 style signature for 21 CFR Part 11 integrity
}

export interface GenealogyFilterOptions {
  trackingLevel: TrackingLevel | 'all';
  status: ProductionItemStatus | 'all';
  workOrderNumber?: string;
  searchQuery?: string;
}

export interface ComplianceExportOptions {
  standard: 'AS9100' | 'IATF16949' | 'ISO9001' | 'FDA_21CFR';
  includeMtr: boolean;
  includeMachineTelemetry: boolean;
  includeOperatorSignatures: boolean;
  format: 'print' | 'csv' | 'json';
}
