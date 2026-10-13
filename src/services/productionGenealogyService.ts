// src/services/productionGenealogyService.ts

import {
  ProductionGenealogyRecord,
  OperationGenealogyStep,
  GenealogyFilterOptions,
  ProductionItemStatus
} from '../types/genealogy';

const STORAGE_KEY = 'mes_production_genealogy_records_v1';

// Initial realistic production records representing aerospace and automotive precision manufacturing
const INITIAL_GENEALOGY_RECORDS: ProductionGenealogyRecord[] = [
  {
    id: 'gen-sn-0891',
    tenantId: 'demo-tenant',
    trackingLevel: 'unit',
    identifier: 'SN-2026-ENG-0891',
    barcode: 'SN2026ENG0891',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SN-2026-ENG-0891',
    batchQuantity: 1,
    unitOfMeasure: 'pcs',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-001',
    salesOrderId: 'so-001',
    salesOrderNumber: 'SO-2026-0012',
    customerName: 'Bajaj Auto Ltd. — Chakan Plant',
    customerPoNumber: 'PO-BAJAJ-8812',
    partNumber: 'CRK-8802',
    partName: 'Forged Crankshaft — 4-Cylinder Turbo',
    drawingNumber: 'DWG-CRK-8802-D',
    revision: 'Rev D.4',
    rawMaterialSummary: {
      primaryLotNumber: 'LOT-2026-RM-0412',
      materialGrade: 'EN8D (AISI 1045 Mod)',
      heatNumber: 'HT-TATA-9942',
      supplierName: 'Tata Prime Steel Ltd.',
      mtrNumber: 'MTR-TATA-2026-9942A',
      poNumber: 'PO-2026-902',
      grnNumber: 'GRN-2026-0182'
    },
    currentSequence: 60,
    currentOperationName: 'Laser Etching & Final Packaging',
    status: 'completed',
    qualityDisposition: 'passed',
    finalQcInspector: 'Anand Deshmukh (Lead Met. Inspector)',
    finalQcDate: '2026-04-12T16:45:00Z',
    certificateOfConformanceNumber: 'COC-2026-CRK-0891',
    dispatchRecord: {
      invoiceNumber: 'INV-2026-118',
      dispatchDate: '2026-04-14T09:00:00Z',
      lorryReceiptNumber: 'LR-VRL-99214',
      destinationCity: 'Pune, Maharashtra',
      recipientPlant: 'Bajaj Engine Assembly Line 2'
    },
    createdAt: '2026-04-11T06:30:00Z',
    completedAt: '2026-04-12T16:45:00Z',
    updatedAt: '2026-04-14T09:00:00Z',
    complianceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    operations: [
      {
        stepId: 'op-0891-10',
        sequence: 10,
        operationName: 'Raw Billet Sawing & Centering',
        workCenterId: 'wc-saw-01',
        workCenterName: 'Sawing & Cut-off Cell',
        machineId: 'mc-saw-01',
        machineName: 'KastoBand Billet Saw 450A',
        machineCode: 'MC-SAW-01',
        operatorId: 'usr-op-01',
        operatorName: 'Ramesh Pawar',
        operatorBadge: 'EMP-102',
        startedAt: '2026-04-11T07:00:00Z',
        completedAt: '2026-04-11T07:42:00Z',
        durationMinutes: 42,
        plannedDurationMinutes: 45,
        status: 'completed',
        qcParameters: [
          { paramName: 'Billet Cut Length', specification: '480 ± 1.0 mm', measuredValue: '480.3 mm', status: 'pass' },
          { paramName: 'Squareness of Cut', specification: '< 0.5 mm', measuredValue: '0.2 mm', status: 'pass' }
        ],
        machineParameters: {
          feedRateMmpm: 35,
          coolantConcentration: '8% Semi-Synthetic'
        },
        consumedRawLots: [
          {
            lotNumber: 'LOT-2026-RM-0412',
            materialGrade: 'EN8D (AISI 1045 Mod)',
            heatNumber: 'HT-TATA-9942',
            qtyConsumed: 0.045,
            unit: 'tonnes'
          }
        ],
        notes: 'Clean face cut. Heat stamp HT-TATA-9942 verified against bar bundle.'
      },
      {
        stepId: 'op-0891-20',
        sequence: 20,
        operationName: 'CNC Turning & Journal Roughing',
        workCenterId: 'wc-turn-02',
        workCenterName: 'Heavy Turning Bay',
        machineId: 'mc-cnc-01',
        machineName: 'Doosan Lynx 2100LSY CNC Lathe',
        machineCode: 'MC-CNC-01',
        operatorId: 'usr-op-02',
        operatorName: 'Vikram Rao',
        operatorBadge: 'EMP-104',
        startedAt: '2026-04-11T08:15:00Z',
        completedAt: '2026-04-11T10:35:00Z',
        durationMinutes: 140,
        plannedDurationMinutes: 135,
        status: 'completed',
        qcParameters: [
          { paramName: 'Main Journal Diameter (Rough)', specification: '62.5 ± 0.1 mm', measuredValue: '62.48 mm', status: 'pass' },
          { paramName: 'Total Runout', specification: '≤ 0.05 mm', measuredValue: '0.03 mm', status: 'pass' }
        ],
        machineParameters: {
          spindleSpeedRpm: 1850,
          feedRateMmpm: 220,
          coolantConcentration: '9%'
        },
        consumedRawLots: [],
        notes: 'Rough turning cycle clean. Sandvik carbide inserts indexing fresh at part #1.'
      },
      {
        stepId: 'op-0891-30',
        sequence: 30,
        operationName: 'Induction Hardening & Quenching',
        workCenterId: 'wc-ht-01',
        workCenterName: 'Thermal Treatment Facility',
        machineId: 'mc-ht-02',
        machineName: 'Inductoheat 50kW Dual Spindle Hardener',
        machineCode: 'MC-HT-02',
        operatorId: 'usr-op-05',
        operatorName: 'Sunil Sharma',
        operatorBadge: 'EMP-208',
        startedAt: '2026-04-11T13:00:00Z',
        completedAt: '2026-04-11T14:15:00Z',
        durationMinutes: 75,
        plannedDurationMinutes: 80,
        status: 'completed',
        qcParameters: [
          { paramName: 'Surface Hardness (Pin & Journals)', specification: '56 - 62 HRC', measuredValue: '59.2 HRC', status: 'pass' },
          { paramName: 'Case Depth', specification: '2.5 - 3.5 mm', measuredValue: '3.1 mm', status: 'pass' }
        ],
        machineParameters: {
          temperatureCelsius: 885,
          pressureBar: 4.2
        },
        consumedRawLots: [],
        notes: 'Polymer quench tank monitored at 32°C. Eddy-current surface scan clear.'
      },
      {
        stepId: 'op-0891-40',
        sequence: 40,
        operationName: 'Precision Cylindrical Grinding',
        workCenterId: 'wc-grind-01',
        workCenterName: 'Finish Grinding Cell',
        machineId: 'mc-grd-01',
        machineName: 'Studer S33 CNC Cylindrical Grinder',
        machineCode: 'MC-GRD-01',
        operatorId: 'usr-op-08',
        operatorName: 'Kishore Mahajan',
        operatorBadge: 'EMP-312',
        startedAt: '2026-04-12T08:30:00Z',
        completedAt: '2026-04-12T10:45:00Z',
        durationMinutes: 135,
        plannedDurationMinutes: 130,
        status: 'completed',
        qcParameters: [
          { paramName: 'Finished Journal Diameter', specification: '60.000 ± 0.005 mm', measuredValue: '60.002 mm', status: 'pass' },
          { paramName: 'Surface Roughness Ra', specification: '≤ 0.20 µm', measuredValue: '0.14 µm', status: 'pass' },
          { paramName: 'Crankpin Circularity', specification: '≤ 0.003 mm', measuredValue: '0.002 mm', status: 'pass' }
        ],
        machineParameters: {
          spindleSpeedRpm: 3200,
          coolantConcentration: '10% Synthetic'
        },
        consumedRawLots: [],
        notes: 'Marposs in-process sizing gauge active. Diameters holding within 2 microns.'
      },
      {
        stepId: 'op-0891-50',
        sequence: 50,
        operationName: 'Zeiss CMM Metrology & NDT Test',
        workCenterId: 'wc-qc-01',
        workCenterName: 'Precision Metrology Lab',
        machineId: 'mc-cmm-01',
        machineName: 'Zeiss Prismo Ultra CMM',
        machineCode: 'MC-CMM-01',
        operatorId: 'usr-qc-01',
        operatorName: 'Anand Deshmukh',
        operatorBadge: 'EMP-QC-01',
        startedAt: '2026-04-12T13:00:00Z',
        completedAt: '2026-04-12T14:20:00Z',
        durationMinutes: 80,
        plannedDurationMinutes: 75,
        status: 'completed',
        qcParameters: [
          { paramName: 'Stroke Displacement', specification: '92.00 ± 0.02 mm', measuredValue: '92.008 mm', status: 'pass' },
          { paramName: 'Main Bearing Runout', specification: '< 0.008 mm', measuredValue: '0.004 mm', status: 'pass' },
          { paramName: 'Magnetic Particle Crack Check (MPI)', specification: 'Zero Discontinuities', measuredValue: 'Passed 100%', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Full 3D profile coordinates logged into Zeiss Calypso. 100% compliant.'
      },
      {
        stepId: 'op-0891-60',
        sequence: 60,
        operationName: 'Laser Etching & Final Packaging',
        workCenterId: 'wc-pkg-01',
        workCenterName: 'Traceability & Dispatch Cell',
        machineId: 'mc-lsr-01',
        machineName: 'Trumpf TruMark 5020 Laser Marker',
        machineCode: 'MC-LSR-01',
        operatorId: 'usr-op-12',
        operatorName: 'Pradeep Jadhav',
        operatorBadge: 'EMP-150',
        startedAt: '2026-04-12T15:30:00Z',
        completedAt: '2026-04-12T16:45:00Z',
        durationMinutes: 75,
        plannedDurationMinutes: 60,
        status: 'completed',
        qcParameters: [
          { paramName: '2D DataMatrix Mark Legibility', specification: 'ISO/IEC 15415 Grade A', measuredValue: 'Grade A', status: 'pass' },
          { paramName: 'VCI Rust Inhibitor Film', specification: '100% Coverage', measuredValue: 'Applied', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Serial # SN-2026-ENG-0891 and Heat # HT-TATA-9942 laser-marked on flywheel flange. Sealed in VCI bag.'
      }
    ]
  },
  {
    id: 'gen-sn-0892',
    tenantId: 'demo-tenant',
    trackingLevel: 'unit',
    identifier: 'SN-2026-ENG-0892',
    barcode: 'SN2026ENG0892',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SN-2026-ENG-0892',
    batchQuantity: 1,
    unitOfMeasure: 'pcs',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-001',
    salesOrderId: 'so-001',
    salesOrderNumber: 'SO-2026-0012',
    customerName: 'Bajaj Auto Ltd. — Chakan Plant',
    customerPoNumber: 'PO-BAJAJ-8812',
    partNumber: 'CRK-8802',
    partName: 'Forged Crankshaft — 4-Cylinder Turbo',
    drawingNumber: 'DWG-CRK-8802-D',
    revision: 'Rev D.4',
    rawMaterialSummary: {
      primaryLotNumber: 'LOT-2026-RM-0412',
      materialGrade: 'EN8D (AISI 1045 Mod)',
      heatNumber: 'HT-TATA-9942',
      supplierName: 'Tata Prime Steel Ltd.',
      mtrNumber: 'MTR-TATA-2026-9942A',
      poNumber: 'PO-2026-902',
      grnNumber: 'GRN-2026-0182'
    },
    currentSequence: 40,
    currentOperationName: 'Precision Cylindrical Grinding',
    status: 'in_production',
    qualityDisposition: 'pending',
    createdAt: '2026-04-11T06:30:00Z',
    updatedAt: '2026-04-12T14:10:00Z',
    complianceHash: 'fa82110c79124e5287fbb05b38a42903bbca93992490d3d1fca97645eb456102',
    operations: [
      {
        stepId: 'op-0892-10',
        sequence: 10,
        operationName: 'Raw Billet Sawing & Centering',
        workCenterId: 'wc-saw-01',
        workCenterName: 'Sawing & Cut-off Cell',
        machineId: 'mc-saw-01',
        machineName: 'KastoBand Billet Saw 450A',
        machineCode: 'MC-SAW-01',
        operatorId: 'usr-op-01',
        operatorName: 'Ramesh Pawar',
        operatorBadge: 'EMP-102',
        startedAt: '2026-04-11T07:45:00Z',
        completedAt: '2026-04-11T08:30:00Z',
        durationMinutes: 45,
        plannedDurationMinutes: 45,
        status: 'completed',
        qcParameters: [
          { paramName: 'Billet Cut Length', specification: '480 ± 1.0 mm', measuredValue: '480.1 mm', status: 'pass' }
        ],
        consumedRawLots: [
          {
            lotNumber: 'LOT-2026-RM-0412',
            materialGrade: 'EN8D (AISI 1045 Mod)',
            heatNumber: 'HT-TATA-9942',
            qtyConsumed: 0.045,
            unit: 'tonnes'
          }
        ],
        notes: 'Cut confirmed.'
      },
      {
        stepId: 'op-0892-20',
        sequence: 20,
        operationName: 'CNC Turning & Journal Roughing',
        workCenterId: 'wc-turn-02',
        workCenterName: 'Heavy Turning Bay',
        machineId: 'mc-cnc-01',
        machineName: 'Doosan Lynx 2100LSY CNC Lathe',
        machineCode: 'MC-CNC-01',
        operatorId: 'usr-op-02',
        operatorName: 'Vikram Rao',
        operatorBadge: 'EMP-104',
        startedAt: '2026-04-11T10:45:00Z',
        completedAt: '2026-04-11T13:00:00Z',
        durationMinutes: 135,
        plannedDurationMinutes: 135,
        status: 'completed',
        qcParameters: [
          { paramName: 'Main Journal Diameter (Rough)', specification: '62.5 ± 0.1 mm', measuredValue: '62.51 mm', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Concentricity within 0.02 mm.'
      },
      {
        stepId: 'op-0892-30',
        sequence: 30,
        operationName: 'Induction Hardening & Quenching',
        workCenterId: 'wc-ht-01',
        workCenterName: 'Thermal Treatment Facility',
        machineId: 'mc-ht-02',
        machineName: 'Inductoheat 50kW Dual Spindle Hardener',
        machineCode: 'MC-HT-02',
        operatorId: 'usr-op-05',
        operatorName: 'Sunil Sharma',
        operatorBadge: 'EMP-208',
        startedAt: '2026-04-11T14:30:00Z',
        completedAt: '2026-04-11T15:45:00Z',
        durationMinutes: 75,
        plannedDurationMinutes: 80,
        status: 'completed',
        qcParameters: [
          { paramName: 'Surface Hardness (Pin & Journals)', specification: '56 - 62 HRC', measuredValue: '58.8 HRC', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Hardness cycle passed.'
      },
      {
        stepId: 'op-0892-40',
        sequence: 40,
        operationName: 'Precision Cylindrical Grinding',
        workCenterId: 'wc-grind-01',
        workCenterName: 'Finish Grinding Cell',
        machineId: 'mc-grd-01',
        machineName: 'Studer S33 CNC Cylindrical Grinder',
        machineCode: 'MC-GRD-01',
        operatorId: 'usr-op-08',
        operatorName: 'Kishore Mahajan',
        operatorBadge: 'EMP-312',
        startedAt: '2026-04-12T13:30:00Z',
        durationMinutes: 40,
        plannedDurationMinutes: 130,
        status: 'in_progress',
        qcParameters: [
          { paramName: 'In-Process Journal Dia (WIP)', specification: '60.000 ± 0.005 mm', measuredValue: '60.012 mm (Roughing cut)', status: 'marginal' }
        ],
        consumedRawLots: [],
        notes: 'Currently grinding main journals 1 & 2. Final sizing pass underway.'
      },
      {
        stepId: 'op-0892-50',
        sequence: 50,
        operationName: 'Zeiss CMM Metrology & NDT Test',
        workCenterId: 'wc-qc-01',
        workCenterName: 'Precision Metrology Lab',
        machineId: 'mc-cmm-01',
        machineName: 'Zeiss Prismo Ultra CMM',
        machineCode: 'MC-CMM-01',
        operatorId: 'usr-qc-01',
        operatorName: 'Anand Deshmukh',
        operatorBadge: 'EMP-QC-01',
        startedAt: '',
        durationMinutes: 0,
        plannedDurationMinutes: 75,
        status: 'pending',
        qcParameters: [],
        consumedRawLots: []
      },
      {
        stepId: 'op-0892-60',
        sequence: 60,
        operationName: 'Laser Etching & Final Packaging',
        workCenterId: 'wc-pkg-01',
        workCenterName: 'Traceability & Dispatch Cell',
        machineId: 'mc-lsr-01',
        machineName: 'Trumpf TruMark 5020 Laser Marker',
        machineCode: 'MC-LSR-01',
        operatorId: 'usr-op-12',
        operatorName: 'Pradeep Jadhav',
        operatorBadge: 'EMP-150',
        startedAt: '',
        durationMinutes: 0,
        plannedDurationMinutes: 60,
        status: 'pending',
        qcParameters: [],
        consumedRawLots: []
      }
    ]
  },
  {
    id: 'gen-batch-0042',
    tenantId: 'demo-tenant',
    trackingLevel: 'batch',
    identifier: 'BATCH-2026-LOT-0042',
    barcode: 'BATCH2026LOT0042',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=BATCH-2026-LOT-0042',
    batchQuantity: 500,
    unitOfMeasure: 'pcs',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2026-002',
    salesOrderId: 'so-002',
    salesOrderNumber: 'SO-2026-0018',
    customerName: 'Mahindra & Mahindra — Kandivali Plant',
    customerPoNumber: 'PO-MM-44910',
    partNumber: 'GR-HST-42',
    partName: 'Transmission Helical Gear 42T',
    drawingNumber: 'DWG-GR-HST-42-B',
    revision: 'Rev B.1',
    rawMaterialSummary: {
      primaryLotNumber: 'LOT-2026-RM-0390',
      materialGrade: '20MnCr5 (Case Carburizing Steel)',
      heatNumber: 'HT-JINDAL-8834',
      supplierName: 'Jindal Steel & Power Ltd.',
      mtrNumber: 'MTR-JSPL-2026-8834B',
      poNumber: 'PO-2026-870',
      grnNumber: 'GRN-2026-0155'
    },
    currentSequence: 50,
    currentOperationName: 'Gear Metrology & Roll Testing',
    status: 'completed',
    qualityDisposition: 'passed',
    finalQcInspector: 'Meera Joshi (Lead Metrology QC)',
    finalQcDate: '2026-04-10T17:00:00Z',
    certificateOfConformanceNumber: 'COC-2026-MHM-0042',
    dispatchRecord: {
      invoiceNumber: 'INV-2026-119',
      dispatchDate: '2026-04-12T11:00:00Z',
      lorryReceiptNumber: 'LR-GATI-44021',
      destinationCity: 'Mumbai, Maharashtra',
      recipientPlant: 'Mahindra Transmission Division'
    },
    createdAt: '2026-04-08T08:00:00Z',
    completedAt: '2026-04-10T17:00:00Z',
    updatedAt: '2026-04-12T11:00:00Z',
    complianceHash: 'bc41320ef4118a8b13915bc8e9188e99491a11884210a48a90192ea01844bdfa',
    operations: [
      {
        stepId: 'op-0042-10',
        sequence: 10,
        operationName: 'Billet Blank Forging & Piercing',
        workCenterId: 'wc-frg-01',
        workCenterName: 'Hot Forge Cell',
        machineId: 'mc-frg-01',
        machineName: 'National Maxipres 1600T Forging Press',
        machineCode: 'MC-FRG-01',
        operatorId: 'usr-op-10',
        operatorName: 'Arun Kulkarni',
        operatorBadge: 'EMP-401',
        startedAt: '2026-04-08T09:00:00Z',
        completedAt: '2026-04-08T13:30:00Z',
        durationMinutes: 270,
        plannedDurationMinutes: 260,
        status: 'completed',
        qcParameters: [
          { paramName: 'Forged Blank Outer Dia', specification: '148 ± 1.5 mm', measuredValue: '148.4 mm', status: 'pass' },
          { paramName: 'Grain Flow Direction', specification: 'Uniform Radial', measuredValue: 'Confirmed compliant', status: 'pass' }
        ],
        consumedRawLots: [
          {
            lotNumber: 'LOT-2026-RM-0390',
            materialGrade: '20MnCr5',
            heatNumber: 'HT-JINDAL-8834',
            qtyConsumed: 1.65,
            unit: 'tonnes'
          }
        ],
        notes: '500 blanks struck. Die temperature maintained at 220°C.'
      },
      {
        stepId: 'op-0042-20',
        sequence: 20,
        operationName: 'CNC Blank Turning & Face Grooving',
        workCenterId: 'wc-cnc-02',
        workCenterName: 'Turning Cell 3',
        machineId: 'mc-cnc-02',
        machineName: 'Mazak Quick Turn 250MSY',
        machineCode: 'MC-CNC-02',
        operatorId: 'usr-op-03',
        operatorName: 'Sanjay Patil',
        operatorBadge: 'EMP-209',
        startedAt: '2026-04-08T14:30:00Z',
        completedAt: '2026-04-09T02:00:00Z',
        durationMinutes: 690,
        plannedDurationMinutes: 700,
        status: 'completed',
        qcParameters: [
          { paramName: 'Bore Diameter', specification: '45.000 +0.015/-0.000 mm', measuredValue: '45.008 mm', status: 'pass' },
          { paramName: 'Face Runout', specification: '≤ 0.015 mm', measuredValue: '0.009 mm', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Twin spindle simultaneous turning. Bore surface finish Ra 0.8 achieved.'
      },
      {
        stepId: 'op-0042-30',
        sequence: 30,
        operationName: 'High Speed Gear Hobbing 42T',
        workCenterId: 'wc-hob-01',
        workCenterName: 'Gear Cutting Bay',
        machineId: 'mc-hob-01',
        machineName: 'Gleason Genesis 210H Hobber',
        machineCode: 'MC-HOB-01',
        operatorId: 'usr-op-07',
        operatorName: 'Ganesh More',
        operatorBadge: 'EMP-244',
        startedAt: '2026-04-09T06:00:00Z',
        completedAt: '2026-04-09T18:30:00Z',
        durationMinutes: 750,
        plannedDurationMinutes: 720,
        status: 'completed',
        qcParameters: [
          { paramName: 'Tooth Profile Error (F_alpha)', specification: 'DIN 3962 Grade 7', measuredValue: 'Grade 6 (Better than spec)', status: 'pass' },
          { paramName: 'Base Tangent Length W5', specification: '42.31 ± 0.03 mm', measuredValue: '42.315 mm', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Dry carbide hobbing at 250 m/min. Tool wear within limit.'
      },
      {
        stepId: 'op-0042-40',
        sequence: 40,
        operationName: 'Vacuum Carburizing & Press Quench',
        workCenterId: 'wc-ht-02',
        workCenterName: 'Vacuum Heat Treatment Bay',
        machineId: 'mc-vac-01',
        machineName: 'ECM Duo Vacuum Furnaces',
        machineCode: 'MC-VAC-01',
        operatorId: 'usr-op-05',
        operatorName: 'Sunil Sharma',
        operatorBadge: 'EMP-208',
        startedAt: '2026-04-09T20:00:00Z',
        completedAt: '2026-04-10T08:00:00Z',
        durationMinutes: 720,
        plannedDurationMinutes: 720,
        status: 'completed',
        qcParameters: [
          { paramName: 'Surface Hardness', specification: '58 - 62 HRC', measuredValue: '60.5 HRC', status: 'pass' },
          { paramName: 'Effective Case Depth (at 550 HV)', specification: '0.8 - 1.2 mm', measuredValue: '1.05 mm', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Acetylene low pressure carburizing with 15 bar N2 gas quenching. Zero distortion.'
      },
      {
        stepId: 'op-0042-50',
        sequence: 50,
        operationName: 'Gear Metrology & Roll Testing',
        workCenterId: 'wc-qc-01',
        workCenterName: 'Precision Metrology Lab',
        machineId: 'mc-gear-qc',
        machineName: 'Klingelnberg P26 Gear Checker',
        machineCode: 'MC-KLG-01',
        operatorId: 'usr-qc-03',
        operatorName: 'Meera Joshi',
        operatorBadge: 'EMP-QC-03',
        startedAt: '2026-04-10T14:00:00Z',
        completedAt: '2026-04-10T17:00:00Z',
        durationMinutes: 180,
        plannedDurationMinutes: 180,
        status: 'completed',
        qcParameters: [
          { paramName: 'Total Pitch Error Fp', specification: '≤ 18 µm', measuredValue: '12.4 µm', status: 'pass' },
          { paramName: 'Radial Runout Fr', specification: '≤ 15 µm', measuredValue: '9.2 µm', status: 'pass' },
          { paramName: 'Double Flank Roll Test', specification: 'No tight teeth / noise < 72 dB', measuredValue: 'Passed 68 dB', status: 'pass' }
        ],
        consumedRawLots: [],
        notes: 'Full statistical sample (AQL 0.65 Level II) evaluated. Batch approved for dispatch.'
      }
    ]
  },
  {
    id: 'gen-sn-0941',
    tenantId: 'demo-tenant',
    trackingLevel: 'unit',
    identifier: 'SN-2026-ENG-0941',
    barcode: 'SN2026ENG0941',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SN-2026-ENG-0941',
    batchQuantity: 1,
    unitOfMeasure: 'pcs',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2026-003',
    salesOrderId: 'so-003',
    salesOrderNumber: 'SO-2026-0025',
    customerName: 'Tata Motors CVBU — Pune Plant',
    customerPoNumber: 'PO-TM-90118',
    partNumber: 'CAM-4401',
    partName: 'Overhead Camshaft — Heavy Commercial Vehicle',
    drawingNumber: 'DWG-CAM-4401-C',
    revision: 'Rev C.2',
    rawMaterialSummary: {
      primaryLotNumber: 'LOT-2026-RM-0420',
      materialGrade: 'EN19 (AISI 4140 Chrome Moly)',
      heatNumber: 'HT-JSW-7719',
      supplierName: 'JSW Steel Ltd. Vijayanagar',
      mtrNumber: 'MTR-JSW-2026-7719C',
      poNumber: 'PO-2026-915',
      grnNumber: 'GRN-2026-0201'
    },
    currentSequence: 20,
    currentOperationName: 'Cam Lobe CNC Rough Milling',
    status: 'quarantined',
    qualityDisposition: 'quarantined',
    createdAt: '2026-04-12T07:00:00Z',
    updatedAt: '2026-04-12T11:45:00Z',
    complianceHash: '772b819aef2911b333912a78129e99214a199a00b218490a9821aef100a928bc',
    operations: [
      {
        stepId: 'op-0941-10',
        sequence: 10,
        operationName: 'Bar Centering & Facing',
        workCenterId: 'wc-saw-01',
        workCenterName: 'Sawing & Cut-off Cell',
        machineId: 'mc-saw-01',
        machineName: 'KastoBand Billet Saw 450A',
        machineCode: 'MC-SAW-01',
        operatorId: 'usr-op-01',
        operatorName: 'Ramesh Pawar',
        operatorBadge: 'EMP-102',
        startedAt: '2026-04-12T07:30:00Z',
        completedAt: '2026-04-12T08:15:00Z',
        durationMinutes: 45,
        plannedDurationMinutes: 45,
        status: 'completed',
        qcParameters: [
          { paramName: 'Center Depth', specification: '6.0 ± 0.5 mm', measuredValue: '6.1 mm', status: 'pass' }
        ],
        consumedRawLots: [
          {
            lotNumber: 'LOT-2026-RM-0420',
            materialGrade: 'EN19 (AISI 4140)',
            heatNumber: 'HT-JSW-7719',
            qtyConsumed: 0.038,
            unit: 'tonnes'
          }
        ],
        notes: 'Initial centering normal.'
      },
      {
        stepId: 'op-0941-20',
        sequence: 20,
        operationName: 'Cam Lobe CNC Rough Milling',
        workCenterId: 'wc-cnc-04',
        workCenterName: 'Camshaft Machining Cell',
        machineId: 'mc-cnc-04',
        machineName: 'Heller 5-Axis Horizontal Center',
        machineCode: 'MC-CNC-04',
        operatorId: 'usr-op-06',
        operatorName: 'Devendra Shinde',
        operatorBadge: 'EMP-188',
        startedAt: '2026-04-12T09:00:00Z',
        completedAt: '2026-04-12T11:45:00Z',
        durationMinutes: 165,
        plannedDurationMinutes: 120,
        status: 'hold',
        qcParameters: [
          { paramName: 'Lobe #3 Base Circle Radius', specification: '34.50 ± 0.05 mm', measuredValue: '34.38 mm (Out of tolerance)', status: 'fail' }
        ],
        consumedRawLots: [],
        notes: 'QUARANTINE ALERT: Machine tool chatter detected on Lobe #3. Tool holder looseness suspected. Unit tagged with Red Quarantine Card for MRB review.'
      }
    ]
  }
];

class ProductionGenealogyService {
  private getStorage(): ProductionGenealogyRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed reading genealogy from localStorage', e);
    }
    // Save defaults
    this.saveStorage(INITIAL_GENEALOGY_RECORDS);
    return INITIAL_GENEALOGY_RECORDS;
  }

  private saveStorage(records: ProductionGenealogyRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed saving genealogy to localStorage', e);
    }
  }

  public async getRecords(filter?: GenealogyFilterOptions): Promise<ProductionGenealogyRecord[]> {
    let records = this.getStorage();

    if (filter) {
      if (filter.trackingLevel && filter.trackingLevel !== 'all') {
        records = records.filter(r => r.trackingLevel === filter.trackingLevel);
      }
      if (filter.status && filter.status !== 'all') {
        records = records.filter(r => r.status === filter.status);
      }
      if (filter.workOrderNumber) {
        records = records.filter(r => 
          r.workOrderNumber.toLowerCase().includes(filter.workOrderNumber!.toLowerCase())
        );
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase().trim();
        records = records.filter(r => 
          r.identifier.toLowerCase().includes(query) ||
          r.workOrderNumber.toLowerCase().includes(query) ||
          r.customerName.toLowerCase().includes(query) ||
          r.partName.toLowerCase().includes(query) ||
          r.rawMaterialSummary.heatNumber.toLowerCase().includes(query) ||
          r.rawMaterialSummary.primaryLotNumber.toLowerCase().includes(query)
        );
      }
    }

    return records;
  }

  public async getRecordById(id: string): Promise<ProductionGenealogyRecord | null> {
    const records = this.getStorage();
    return records.find(r => r.id === id) || null;
  }

  public async getRecordByIdentifier(identifier: string): Promise<ProductionGenealogyRecord | null> {
    const records = this.getStorage();
    const clean = identifier.trim().toLowerCase();
    return records.find(r => 
      r.identifier.toLowerCase() === clean || 
      r.barcode.toLowerCase() === clean
    ) || null;
  }

  public async createRecord(payload: Partial<ProductionGenealogyRecord>): Promise<ProductionGenealogyRecord> {
    const records = this.getStorage();
    const newId = `gen-${Date.now()}`;
    const trackingLevel = payload.trackingLevel || 'unit';
    const identifier = payload.identifier || (trackingLevel === 'unit' 
      ? `SN-2026-PRD-${Math.floor(1000 + Math.random() * 9000)}`
      : `BATCH-2026-LOT-${Math.floor(1000 + Math.random() * 9000)}`);

    const newRecord: ProductionGenealogyRecord = {
      id: newId,
      tenantId: payload.tenantId || 'demo-tenant',
      trackingLevel,
      identifier,
      barcode: identifier.replace(/[^a-zA-Z0-9]/g, ''),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${identifier}`,
      batchQuantity: payload.batchQuantity || (trackingLevel === 'unit' ? 1 : 100),
      unitOfMeasure: payload.unitOfMeasure || 'pcs',
      workOrderId: payload.workOrderId || 'wo-001',
      workOrderNumber: payload.workOrderNumber || 'WO-2026-001',
      salesOrderId: payload.salesOrderId || 'so-001',
      salesOrderNumber: payload.salesOrderNumber || 'SO-2026-0012',
      customerName: payload.customerName || 'Standard OEM Customer',
      customerPoNumber: payload.customerPoNumber || 'PO-2026-DEF',
      partNumber: payload.partNumber || 'PRT-1001',
      partName: payload.partName || 'Precision Machined Component',
      drawingNumber: payload.drawingNumber || 'DWG-STD-01',
      revision: payload.revision || 'Rev A',
      rawMaterialSummary: payload.rawMaterialSummary || {
        primaryLotNumber: 'LOT-2026-RM-0412',
        materialGrade: 'EN8D (AISI 1045)',
        heatNumber: 'HT-TATA-9942',
        supplierName: 'Tata Prime Steel Ltd.',
        mtrNumber: 'MTR-TATA-2026-9942A',
        poNumber: 'PO-2026-902',
        grnNumber: 'GRN-2026-0182'
      },
      currentSequence: 10,
      currentOperationName: payload.currentOperationName || 'Initial Setup & Cutting',
      status: payload.status || 'in_production',
      qualityDisposition: payload.qualityDisposition || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      complianceHash: `sha256-${Math.random().toString(36).substring(2)}${Date.now()}`,
      operations: payload.operations || [
        {
          stepId: `op-${Date.now()}-10`,
          sequence: 10,
          operationName: 'Billet Prep & Cutting',
          workCenterId: 'wc-saw-01',
          workCenterName: 'Sawing Cell',
          machineId: 'mc-saw-01',
          machineName: 'KastoBand Billet Saw 450A',
          machineCode: 'MC-SAW-01',
          operatorId: 'usr-op-01',
          operatorName: 'Ramesh Pawar',
          operatorBadge: 'EMP-102',
          startedAt: new Date().toISOString(),
          durationMinutes: 0,
          plannedDurationMinutes: 45,
          status: 'in_progress',
          qcParameters: [
            { paramName: 'Initial Length', specification: '480 ± 1.0 mm', measuredValue: '480.2 mm', status: 'pass' }
          ],
          consumedRawLots: [
            {
              lotNumber: 'LOT-2026-RM-0412',
              materialGrade: 'EN8D (AISI 1045)',
              heatNumber: 'HT-TATA-9942',
              qtyConsumed: 0.045,
              unit: 'tonnes'
            }
          ]
        }
      ]
    };

    records.unshift(newRecord);
    this.saveStorage(records);
    return newRecord;
  }

  public async logOperationStep(
    recordId: string, 
    stepData: Omit<OperationGenealogyStep, 'stepId'>
  ): Promise<ProductionGenealogyRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) throw new Error(`Record ${recordId} not found`);

    const record = { ...records[index] };
    const stepId = `step-${Date.now()}`;
    const newStep: OperationGenealogyStep = {
      ...stepData,
      stepId
    };

    record.operations = [...record.operations, newStep];
    record.currentSequence = newStep.sequence;
    record.currentOperationName = newStep.operationName;
    record.updatedAt = new Date().toISOString();

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async updateOperationStep(
    recordId: string,
    stepId: string,
    updates: Partial<OperationGenealogyStep>
  ): Promise<ProductionGenealogyRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) throw new Error(`Record ${recordId} not found`);

    const record = { ...records[index] };
    const opIndex = record.operations.findIndex(o => o.stepId === stepId);
    if (opIndex === -1) throw new Error(`Operation step ${stepId} not found`);

    const existingStep = record.operations[opIndex];
    const updatedStep = { ...existingStep, ...updates };

    if (updates.completedAt && updatedStep.startedAt) {
      const start = new Date(updatedStep.startedAt).getTime();
      const end = new Date(updates.completedAt).getTime();
      updatedStep.durationMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
    }

    record.operations[opIndex] = updatedStep;
    record.updatedAt = new Date().toISOString();

    // If last step completed, check if entire unit completed
    const allCompleted = record.operations.every(o => o.status === 'completed' || o.status === 'passed');
    if (allCompleted && record.operations.length >= 4) {
      record.status = 'completed';
      record.qualityDisposition = 'passed';
      record.completedAt = new Date().toISOString();
    }

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async updateItemStatus(
    recordId: string,
    status: ProductionItemStatus,
    disposition?: 'passed' | 'pending' | 'conditional' | 'quarantined',
    notes?: string
  ): Promise<ProductionGenealogyRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) throw new Error(`Record ${recordId} not found`);

    const record = { ...records[index] };
    record.status = status;
    if (disposition) record.qualityDisposition = disposition;
    if (notes && record.operations.length > 0) {
      const lastOp = record.operations[record.operations.length - 1];
      lastOp.notes = `${lastOp.notes ? lastOp.notes + ' | ' : ''}Status update: ${status}. ${notes}`;
    }
    record.updatedAt = new Date().toISOString();

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async signOffCompliance(
    recordId: string,
    inspectorName: string
  ): Promise<ProductionGenealogyRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) throw new Error(`Record ${recordId} not found`);

    const record = { ...records[index] };
    record.finalQcInspector = inspectorName;
    record.finalQcDate = new Date().toISOString();
    record.qualityDisposition = 'passed';
    record.certificateOfConformanceNumber = `COC-2026-${record.identifier.replace(/[^a-zA-Z0-9]/g, '')}`;
    record.complianceHash = `SHA256-${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    record.updatedAt = new Date().toISOString();

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public exportCsv(records: ProductionGenealogyRecord[]): string {
    const headers = [
      'Identifier',
      'Tracking Level',
      'Status',
      'Work Order',
      'Customer',
      'Part Number',
      'Part Name',
      'Heat Number',
      'MTR Number',
      'Raw Material Lot',
      'Current Operation',
      'Operation Sequence',
      'Operation Name',
      'Machine Code',
      'Machine Name',
      'Operator Name',
      'Operator Badge',
      'Started At',
      'Completed At',
      'Duration (Mins)',
      'QC Disposition',
      'Compliance CoC #'
    ];

    const rows: string[] = [];

    records.forEach(rec => {
      rec.operations.forEach(op => {
        rows.push([
          `"${rec.identifier}"`,
          `"${rec.trackingLevel}"`,
          `"${rec.status}"`,
          `"${rec.workOrderNumber}"`,
          `"${rec.customerName}"`,
          `"${rec.partNumber}"`,
          `"${rec.partName}"`,
          `"${rec.rawMaterialSummary.heatNumber}"`,
          `"${rec.rawMaterialSummary.mtrNumber}"`,
          `"${rec.rawMaterialSummary.primaryLotNumber}"`,
          `"${rec.currentOperationName}"`,
          `"${op.sequence}"`,
          `"${op.operationName}"`,
          `"${op.machineCode}"`,
          `"${op.machineName}"`,
          `"${op.operatorName}"`,
          `"${op.operatorBadge}"`,
          `"${op.startedAt}"`,
          `"${op.completedAt || 'In-Progress'}"`,
          `"${op.durationMinutes}"`,
          `"${rec.qualityDisposition}"`,
          `"${rec.certificateOfConformanceNumber || 'N/A'}"`
        ].join(','));
      });
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public exportDigitalThreadJson(record: ProductionGenealogyRecord): string {
    const exportPacket = {
      standardCompliance: {
        spec: 'AS9100D / IATF 16949 / ISO 9001:2015 Digital Thread Architecture',
        fda21CFRPart11Compliant: true,
        generatedAt: new Date().toISOString(),
        cryptographicSignature: record.complianceHash
      },
      productGenealogy: record
    };
    return JSON.stringify(exportPacket, null, 2);
  }
}

export const productionGenealogyService = new ProductionGenealogyService();
