// src/services/edhrService.ts

import {
  EDHRRecord,
  CompiledMaterialItem,
  CompiledOperationStep,
  CompiledQualityInspection,
  EDHRDeviation,
  ElectronicSignature,
  EDHRAuditTrailEvent,
  EDHRFilterOptions,
  EDHRReleaseStatus,
  SignatureIntent
} from '../types/edhr';

const STORAGE_KEY = 'mes_electronic_batch_records_v1';

// Seed realistic regulated eDHR records (Aerospace & Medical Device Grade)
const INITIAL_EDHR_RECORDS: EDHRRecord[] = [
  {
    id: 'edhr-wo001-01',
    tenantId: 'demo-tenant',
    dhrNumber: 'DHR-2026-WO001-01',
    batchNumber: 'SN-2026-ENG-0891',
    trackingMode: 'serialized_unit',
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
    regulatoryStandard: 'AS9100D',
    releaseStatus: 'released',
    manufacturingStartDate: '2026-04-11T07:00:00Z',
    manufacturingCompletionDate: '2026-04-12T16:45:00Z',
    releaseDate: '2026-04-13T10:15:00Z',
    releasedBy: 'Anand Deshmukh (Quality Director)',
    compiledAt: '2026-04-12T17:00:00Z',
    compiledBy: 'Pooja Iyer (Lead MES Validation Specialist)',
    dhrChecksum: 'a7c92b84ef0182c19920b7218349281a99efbc204128490a019284bcda928190',
    qrVerificationUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=DHR-2026-WO001-01',
    notes: 'High-performance turbo crankshaft batch manufactured under strict AS9100 Rev D aerospace standards.',
    materials: [
      {
        id: 'mat-01',
        partNumber: 'WR-1002',
        description: 'Wire Rod / Round Bar — High Tensile Steel 80mm',
        lotNumber: 'LOT-2026-RM-0412',
        supplierName: 'Tata Prime Steel Ltd.',
        heatNumber: 'HT-TATA-9942',
        mtrNumber: 'MTR-TATA-2026-9942A',
        coaNumber: 'COA-9942-CHEM',
        requiredQty: 0.045,
        consumedQty: 0.045,
        unit: 'tonnes',
        expiryDate: '2028-04-10',
        inspectionStatus: 'passed',
        verifiedBy: 'Sanjay Patil (Store Keeper)',
        verifiedAt: '2026-04-11T06:45:00Z'
      },
      {
        id: 'mat-02',
        partNumber: 'OIL-SYN-68',
        description: 'Synthetic Quench Oil Polymer Medium',
        lotNumber: 'LOT-CHEM-2026-08',
        supplierName: 'Houghton Petrochemicals Ltd.',
        coaNumber: 'COA-QCH-9912',
        requiredQty: 2.5,
        consumedQty: 2.5,
        unit: 'liters',
        expiryDate: '2027-01-15',
        inspectionStatus: 'passed',
        verifiedBy: 'Sunil Sharma (Thermal Operator)',
        verifiedAt: '2026-04-11T12:50:00Z'
      },
      {
        id: 'mat-03',
        partNumber: 'VCI-BAG-40',
        description: 'Anti-Corrosion VCI Protective Barrier Film Bag',
        lotNumber: 'LOT-PKG-2026-441',
        supplierName: 'Safepack Industries Ltd.',
        requiredQty: 1,
        consumedQty: 1,
        unit: 'pcs',
        inspectionStatus: 'passed',
        verifiedBy: 'Pradeep Jadhav (Packaging Tech)',
        verifiedAt: '2026-04-12T15:20:00Z'
      }
    ],
    operations: [
      {
        stepId: 'op-01',
        sequence: 10,
        operationName: 'Raw Billet Sawing & Centering',
        workCenterName: 'Sawing & Cut-off Cell',
        machineId: 'MC-SAW-01',
        machineName: 'KastoBand Billet Saw 450A',
        operatorName: 'Ramesh Pawar',
        operatorBadge: 'EMP-102',
        startedAt: '2026-04-11T07:00:00Z',
        completedAt: '2026-04-11T07:42:00Z',
        actualDurationMinutes: 42,
        standardDurationMinutes: 45,
        varianceMinutes: -3,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-SAW-08 Rev 2.1',
        operatorSignOffHash: 'hash-op10-signed'
      },
      {
        stepId: 'op-02',
        sequence: 20,
        operationName: 'CNC Turning & Journal Roughing',
        workCenterName: 'Heavy Turning Bay',
        machineId: 'MC-CNC-01',
        machineName: 'Doosan Lynx 2100LSY CNC Lathe',
        operatorName: 'Vikram Rao',
        operatorBadge: 'EMP-104',
        startedAt: '2026-04-11T08:15:00Z',
        completedAt: '2026-04-11T10:35:00Z',
        actualDurationMinutes: 140,
        standardDurationMinutes: 135,
        varianceMinutes: 5,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-CNC-12 Rev 4.0',
        operatorSignOffHash: 'hash-op20-signed'
      },
      {
        stepId: 'op-03',
        sequence: 30,
        operationName: 'Induction Hardening & Quenching',
        workCenterName: 'Thermal Treatment Facility',
        machineId: 'MC-HT-02',
        machineName: 'Inductoheat 50kW Dual Spindle Hardener',
        operatorName: 'Sunil Sharma',
        operatorBadge: 'EMP-208',
        startedAt: '2026-04-11T13:00:00Z',
        completedAt: '2026-04-11T14:15:00Z',
        actualDurationMinutes: 75,
        standardDurationMinutes: 80,
        varianceMinutes: -5,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-HT-04 Rev 3.2',
        operatorSignOffHash: 'hash-op30-signed'
      },
      {
        stepId: 'op-04',
        sequence: 40,
        operationName: 'Precision Cylindrical Grinding',
        workCenterName: 'Finish Grinding Cell',
        machineId: 'MC-GRD-01',
        machineName: 'Studer S33 CNC Cylindrical Grinder',
        operatorName: 'Kishore Mahajan',
        operatorBadge: 'EMP-312',
        startedAt: '2026-04-12T08:30:00Z',
        completedAt: '2026-04-12T10:45:00Z',
        actualDurationMinutes: 135,
        standardDurationMinutes: 130,
        varianceMinutes: 5,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-GRD-09 Rev 5.1',
        operatorSignOffHash: 'hash-op40-signed'
      },
      {
        stepId: 'op-05',
        sequence: 50,
        operationName: 'Zeiss CMM Metrology & NDT Inspection',
        workCenterName: 'Precision Metrology Lab',
        machineId: 'MC-CMM-01',
        machineName: 'Zeiss Prismo Ultra CMM',
        operatorName: 'Anand Deshmukh',
        operatorBadge: 'EMP-QC-01',
        startedAt: '2026-04-12T13:00:00Z',
        completedAt: '2026-04-12T14:20:00Z',
        actualDurationMinutes: 80,
        standardDurationMinutes: 75,
        varianceMinutes: 5,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-QC-01 Rev 6.0',
        operatorSignOffHash: 'hash-op50-signed'
      },
      {
        stepId: 'op-06',
        sequence: 60,
        operationName: 'Laser Etching & Final Packaging',
        workCenterName: 'Traceability & Dispatch Cell',
        machineId: 'MC-LSR-01',
        machineName: 'Trumpf TruMark 5020 Laser Marker',
        operatorName: 'Pradeep Jadhav',
        operatorBadge: 'EMP-150',
        startedAt: '2026-04-12T15:30:00Z',
        completedAt: '2026-04-12T16:45:00Z',
        actualDurationMinutes: 75,
        standardDurationMinutes: 60,
        varianceMinutes: 15,
        stepStatus: 'completed',
        workInstructionsRev: 'WI-PKG-02 Rev 1.4',
        operatorSignOffHash: 'hash-op60-signed'
      }
    ],
    qualityInspections: [
      {
        id: 'qc-01',
        operationSequence: 10,
        inspectionType: 'dimensional',
        parameterName: 'Billet Cut Length',
        specification: '480 ± 1.0 mm',
        nominalValue: '480.0 mm',
        lowerLimit: '479.0 mm',
        upperLimit: '481.0 mm',
        measuredValue: '480.3 mm',
        unit: 'mm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-VER-2026-018',
        inspectorName: 'Ramesh Pawar',
        inspectorBadge: 'EMP-102',
        timestamp: '2026-04-11T07:40:00Z'
      },
      {
        id: 'qc-02',
        operationSequence: 20,
        inspectionType: 'dimensional',
        parameterName: 'Rough Main Journal Diameter',
        specification: '62.5 ± 0.1 mm',
        nominalValue: '62.50 mm',
        lowerLimit: '62.40 mm',
        upperLimit: '62.60 mm',
        measuredValue: '62.48 mm',
        unit: 'mm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-MIC-2026-044',
        inspectorName: 'Vikram Rao',
        inspectorBadge: 'EMP-104',
        timestamp: '2026-04-11T10:30:00Z'
      },
      {
        id: 'qc-03',
        operationSequence: 30,
        inspectionType: 'metallurgical',
        parameterName: 'Surface Hardness (Pin & Journals)',
        specification: '56 - 62 HRC',
        nominalValue: '59.0 HRC',
        lowerLimit: '56.0 HRC',
        upperLimit: '62.0 HRC',
        measuredValue: '59.2 HRC',
        unit: 'HRC',
        result: 'pass',
        gaugeCalibrationId: 'CAL-ROK-2026-009',
        inspectorName: 'Sunil Sharma',
        inspectorBadge: 'EMP-208',
        timestamp: '2026-04-11T14:10:00Z'
      },
      {
        id: 'qc-04',
        operationSequence: 40,
        inspectionType: 'dimensional',
        parameterName: 'Finished Journal Diameter',
        specification: '60.000 ± 0.005 mm',
        nominalValue: '60.000 mm',
        lowerLimit: '59.995 mm',
        upperLimit: '60.005 mm',
        measuredValue: '60.002 mm',
        unit: 'mm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-AIR-2026-012',
        inspectorName: 'Kishore Mahajan',
        inspectorBadge: 'EMP-312',
        timestamp: '2026-04-12T10:40:00Z'
      },
      {
        id: 'qc-05',
        operationSequence: 40,
        inspectionType: 'dimensional',
        parameterName: 'Surface Roughness Ra',
        specification: '≤ 0.20 µm',
        nominalValue: '0.15 µm',
        upperLimit: '0.20 µm',
        measuredValue: '0.14 µm',
        unit: 'µm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-PRF-2026-021',
        inspectorName: 'Kishore Mahajan',
        inspectorBadge: 'EMP-312',
        timestamp: '2026-04-12T10:42:00Z'
      },
      {
        id: 'qc-06',
        operationSequence: 50,
        inspectionType: 'dimensional',
        parameterName: 'Zeiss CMM 3D Total Runout',
        specification: '< 0.008 mm',
        nominalValue: '0.000 mm',
        upperLimit: '0.008 mm',
        measuredValue: '0.004 mm',
        unit: 'mm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-CMM-ZEISS-01',
        inspectorName: 'Anand Deshmukh',
        inspectorBadge: 'EMP-QC-01',
        timestamp: '2026-04-12T14:15:00Z',
        certificateRef: 'CMM-ZEISS-RUN-9921'
      },
      {
        id: 'qc-07',
        operationSequence: 50,
        inspectionType: 'ndt',
        parameterName: 'Magnetic Particle Inspection (MPI)',
        specification: 'Zero surface cracks / flaws',
        measuredValue: '100% Defect Free (Pass)',
        unit: 'NDT Grade A',
        result: 'pass',
        gaugeCalibrationId: 'CAL-MPI-2026-003',
        inspectorName: 'Anand Deshmukh',
        inspectorBadge: 'EMP-QC-01',
        timestamp: '2026-04-12T14:18:00Z'
      }
    ],
    deviations: [],
    signatures: [
      {
        id: 'sig-01',
        signerName: 'Vikram Rao',
        signerEmail: 'vikram.rao@flowops.internal',
        signerRole: 'Senior CNC Machinist',
        signerUserId: 'usr-op-02',
        intent: 'performed_by',
        intentLabel: 'Performed By (Manufacturing Operations)',
        signedAt: '2026-04-12T16:50:00Z',
        ipAddress: '192.168.1.104',
        cryptographicSignature: 'SHA256:d8921be02891ca018249bb128941094baec102948b81204889218492040182b8',
        reasonStatement: 'I certify that all manufacturing operations assigned to me were completed strictly per Work Instructions Rev D.'
      },
      {
        id: 'sig-02',
        signerName: 'Kishore Mahajan',
        signerEmail: 'kishore.m@flowops.internal',
        signerRole: 'Finish Line Production Supervisor',
        signerUserId: 'usr-sup-01',
        intent: 'verified_by',
        intentLabel: 'Verified By (Production Supervision)',
        signedAt: '2026-04-12T17:15:00Z',
        ipAddress: '192.168.1.112',
        cryptographicSignature: 'SHA256:99bc20148812048bb492048201948baec982184029148bc892102948b8120488',
        reasonStatement: 'I have verified that all materials and shop floor sequence operations match standard traveler specifications.'
      },
      {
        id: 'sig-03',
        signerName: 'Anand Deshmukh',
        signerEmail: 'anand.deshmukh@flowops.internal',
        signerRole: 'Lead Metrology & Quality Manager',
        signerUserId: 'usr-qc-01',
        intent: 'quality_approved',
        intentLabel: 'Quality Assurance Final Approval',
        signedAt: '2026-04-13T09:30:00Z',
        ipAddress: '192.168.1.201',
        cryptographicSignature: 'SHA256:b81204889218492040182b8d8921be02891ca018249bb128941094baec102948',
        reasonStatement: 'I have audited all CMM dimensional data, MTR metallurgical reports, and verify full conformance to AS9100.'
      },
      {
        id: 'sig-04',
        signerName: 'Dr. Rajeshwari Sen',
        signerEmail: 'rajeshwari.sen@flowops.internal',
        signerRole: 'VP of Quality & Regulatory Affairs',
        signerUserId: 'usr-qa-dir',
        intent: 'released_for_distribution',
        intentLabel: 'Final Regulatory Release for Distribution',
        signedAt: '2026-04-13T10:15:00Z',
        ipAddress: '192.168.1.250',
        cryptographicSignature: 'SHA256:1a84092b8d8921be02891ca018249bb128941094baec102948b8120488921849',
        reasonStatement: 'Final Electronic Device History Record approved and digitally sealed under FDA 21 CFR Part 11.'
      }
    ],
    auditTrail: [
      {
        id: 'aud-01',
        timestamp: '2026-04-12T17:00:00Z',
        userId: 'usr-mes-auto',
        userName: 'Pooja Iyer',
        userRole: 'MES Validation Engineer',
        eventType: 'auto_compiled',
        description: 'eDHR auto-compiled from Work Order WO-2026-001 with 3 materials, 6 operations, and 7 QC inspections.',
        newValue: 'Status: pending_qa_review',
        eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      {
        id: 'aud-02',
        timestamp: '2026-04-12T17:01:00Z',
        userId: 'usr-mes-auto',
        userName: 'MES System Core',
        userRole: 'System Daemon',
        eventType: 'material_verified',
        description: 'Auto-verified Heat # HT-TATA-9942 MTR against chemical spec EN8D. Zero discrepancies.',
        eventHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
      },
      {
        id: 'aud-03',
        timestamp: '2026-04-12T17:15:00Z',
        userId: 'usr-sup-01',
        userName: 'Kishore Mahajan',
        userRole: 'Line Supervisor',
        eventType: 'electronic_signature',
        description: 'Applied 21 CFR Part 11 Electronic Signature: Verified By.',
        eventHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
      },
      {
        id: 'aud-04',
        timestamp: '2026-04-13T09:30:00Z',
        userId: 'usr-qc-01',
        userName: 'Anand Deshmukh',
        userRole: 'Quality Manager',
        eventType: 'electronic_signature',
        description: 'Applied 21 CFR Part 11 Electronic Signature: Quality Approved.',
        eventHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
      },
      {
        id: 'aud-05',
        timestamp: '2026-04-13T10:15:00Z',
        userId: 'usr-qa-dir',
        userName: 'Dr. Rajeshwari Sen',
        userRole: 'VP Quality & Regulatory',
        eventType: 'status_changed',
        description: 'eDHR released for shipment. Batch status changed from pending_qa_review to released.',
        previousValue: 'pending_qa_review',
        newValue: 'released',
        justification: 'All operations complete, CMM passed, zero deviations, all 4 sign-offs logged.',
        eventHash: '8f434346648f6b96df89dda901c5176b10e6d05961fda555b7322252e37c50dd'
      }
    ]
  },
  {
    id: 'edhr-wo002-01',
    tenantId: 'demo-tenant',
    dhrNumber: 'DHR-2026-WO002-01',
    batchNumber: 'BATCH-2026-LOT-0042',
    trackingMode: 'production_batch',
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
    regulatoryStandard: 'IATF_16949',
    releaseStatus: 'pending_qa_review',
    manufacturingStartDate: '2026-04-08T08:00:00Z',
    manufacturingCompletionDate: '2026-04-10T17:00:00Z',
    compiledAt: '2026-04-10T17:30:00Z',
    compiledBy: 'Pooja Iyer (Lead MES Validation Specialist)',
    dhrChecksum: '3a018249bb128941094baec102948b81204889218492040182b8d8921be02891',
    qrVerificationUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=DHR-2026-WO002-01',
    notes: '500 pc transmission gear batch awaiting final QA release signature.',
    materials: [
      {
        id: 'mat-0042-01',
        partNumber: 'STL-20MNCR5',
        description: 'Alloy Steel Bar Stock 20MnCr5',
        lotNumber: 'LOT-2026-RM-0390',
        supplierName: 'Jindal Steel & Power Ltd.',
        heatNumber: 'HT-JINDAL-8834',
        mtrNumber: 'MTR-JSPL-2026-8834B',
        requiredQty: 1.65,
        consumedQty: 1.65,
        unit: 'tonnes',
        inspectionStatus: 'passed',
        verifiedBy: 'Sanjay Patil',
        verifiedAt: '2026-04-08T08:30:00Z'
      }
    ],
    operations: [
      {
        stepId: 'op-0042-10',
        sequence: 10,
        operationName: 'Billet Blank Forging & Piercing',
        workCenterName: 'Hot Forge Cell',
        machineId: 'MC-FRG-01',
        machineName: 'National Maxipres 1600T Forging Press',
        operatorName: 'Arun Kulkarni',
        operatorBadge: 'EMP-401',
        startedAt: '2026-04-08T09:00:00Z',
        completedAt: '2026-04-08T13:30:00Z',
        actualDurationMinutes: 270,
        standardDurationMinutes: 260,
        varianceMinutes: 10,
        stepStatus: 'completed'
      },
      {
        stepId: 'op-0042-20',
        sequence: 20,
        operationName: 'CNC Blank Turning & Face Grooving',
        workCenterName: 'Turning Cell 3',
        machineId: 'MC-CNC-02',
        machineName: 'Mazak Quick Turn 250MSY',
        operatorName: 'Sanjay Patil',
        operatorBadge: 'EMP-209',
        startedAt: '2026-04-08T14:30:00Z',
        completedAt: '2026-04-09T02:00:00Z',
        actualDurationMinutes: 690,
        standardDurationMinutes: 700,
        varianceMinutes: -10,
        stepStatus: 'completed'
      },
      {
        stepId: 'op-0042-30',
        sequence: 30,
        operationName: 'High Speed Gear Hobbing 42T',
        workCenterName: 'Gear Cutting Bay',
        machineId: 'MC-HOB-01',
        machineName: 'Gleason Genesis 210H Hobber',
        operatorName: 'Ganesh More',
        operatorBadge: 'EMP-244',
        startedAt: '2026-04-09T06:00:00Z',
        completedAt: '2026-04-09T18:30:00Z',
        actualDurationMinutes: 750,
        standardDurationMinutes: 720,
        varianceMinutes: 30,
        stepStatus: 'completed'
      },
      {
        stepId: 'op-0042-40',
        sequence: 40,
        operationName: 'Vacuum Carburizing & Press Quench',
        workCenterName: 'Vacuum Heat Treatment Bay',
        machineId: 'MC-VAC-01',
        machineName: 'ECM Duo Vacuum Furnaces',
        operatorName: 'Sunil Sharma',
        operatorBadge: 'EMP-208',
        startedAt: '2026-04-09T20:00:00Z',
        completedAt: '2026-04-10T08:00:00Z',
        actualDurationMinutes: 720,
        standardDurationMinutes: 720,
        varianceMinutes: 0,
        stepStatus: 'completed'
      },
      {
        stepId: 'op-0042-50',
        sequence: 50,
        operationName: 'Gear Metrology & Roll Testing',
        workCenterName: 'Precision Metrology Lab',
        machineId: 'MC-KLG-01',
        machineName: 'Klingelnberg P26 Gear Checker',
        operatorName: 'Meera Joshi',
        operatorBadge: 'EMP-QC-03',
        startedAt: '2026-04-10T14:00:00Z',
        completedAt: '2026-04-10T17:00:00Z',
        actualDurationMinutes: 180,
        standardDurationMinutes: 180,
        varianceMinutes: 0,
        stepStatus: 'completed'
      }
    ],
    qualityInspections: [
      {
        id: 'qc-0042-01',
        operationSequence: 50,
        inspectionType: 'dimensional',
        parameterName: 'Pitch Error Fp',
        specification: '≤ 18 µm',
        nominalValue: '0.0 µm',
        upperLimit: '18.0 µm',
        measuredValue: '12.4 µm',
        unit: 'µm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-KLG-2026-001',
        inspectorName: 'Meera Joshi',
        inspectorBadge: 'EMP-QC-03',
        timestamp: '2026-04-10T16:30:00Z'
      },
      {
        id: 'qc-0042-02',
        operationSequence: 40,
        inspectionType: 'metallurgical',
        parameterName: 'Case Depth at 550 HV',
        specification: '0.8 - 1.2 mm',
        nominalValue: '1.0 mm',
        lowerLimit: '0.8 mm',
        upperLimit: '1.2 mm',
        measuredValue: '1.05 mm',
        unit: 'mm',
        result: 'pass',
        gaugeCalibrationId: 'CAL-MIC-HT-01',
        inspectorName: 'Sunil Sharma',
        inspectorBadge: 'EMP-208',
        timestamp: '2026-04-10T08:15:00Z'
      }
    ],
    deviations: [],
    signatures: [
      {
        id: 'sig-0042-01',
        signerName: 'Arun Kulkarni',
        signerEmail: 'arun.kulkarni@flowops.internal',
        signerRole: 'Forging Cell Lead',
        signerUserId: 'usr-op-10',
        intent: 'performed_by',
        intentLabel: 'Performed By (Hot Forge Operations)',
        signedAt: '2026-04-10T17:10:00Z',
        ipAddress: '192.168.1.109',
        cryptographicSignature: 'SHA256:7721849aef2911b333912a78129e99214a199a00b218490a9821aef100a928bc',
        reasonStatement: 'Certified that all 500 forging blanks met specified forging temperature and grain flow parameters.'
      }
    ],
    auditTrail: [
      {
        id: 'aud-0042-01',
        timestamp: '2026-04-10T17:30:00Z',
        userId: 'usr-mes-auto',
        userName: 'Pooja Iyer',
        userRole: 'MES Validation Engineer',
        eventType: 'auto_compiled',
        description: 'Auto-compiled eDHR for batch BATCH-2026-LOT-0042 (500 units). Initial state: pending_qa_review.',
        newValue: 'pending_qa_review',
        eventHash: 'fa82110c79124e5287fbb05b38a42903bbca93992490d3d1fca97645eb456102'
      }
    ]
  },
  {
    id: 'edhr-wo003-01',
    tenantId: 'demo-tenant',
    dhrNumber: 'DHR-2026-WO003-01',
    batchNumber: 'SN-2026-ENG-0941',
    trackingMode: 'serialized_unit',
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
    regulatoryStandard: 'ISO_13485',
    releaseStatus: 'quarantined',
    quarantineReason: 'Dimensional Non-Conformance on Lobe #3 Base Circle Radius during Op 20 Rough Milling.',
    manufacturingStartDate: '2026-04-12T07:00:00Z',
    compiledAt: '2026-04-12T12:00:00Z',
    compiledBy: 'Pooja Iyer',
    dhrChecksum: '772b819aef2911b333912a78129e99214a199a00b218490a9821aef100a928bc',
    qrVerificationUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=DHR-2026-WO003-01',
    notes: 'Quarantined pending Material Review Board (MRB) root cause analysis for CNC spindle chatter.',
    materials: [
      {
        id: 'mat-003-01',
        partNumber: 'STL-EN19',
        description: 'Chrome Molybdenum Round Bar EN19 (AISI 4140)',
        lotNumber: 'LOT-2026-RM-0420',
        supplierName: 'JSW Steel Ltd. Vijayanagar',
        heatNumber: 'HT-JSW-7719',
        mtrNumber: 'MTR-JSW-2026-7719C',
        requiredQty: 0.038,
        consumedQty: 0.038,
        unit: 'tonnes',
        inspectionStatus: 'passed',
        verifiedBy: 'Sanjay Patil',
        verifiedAt: '2026-04-12T07:15:00Z'
      }
    ],
    operations: [
      {
        stepId: 'op-0941-10',
        sequence: 10,
        operationName: 'Bar Centering & Facing',
        workCenterName: 'Sawing & Cut-off Cell',
        machineId: 'MC-SAW-01',
        machineName: 'KastoBand Billet Saw 450A',
        operatorName: 'Ramesh Pawar',
        operatorBadge: 'EMP-102',
        startedAt: '2026-04-12T07:30:00Z',
        completedAt: '2026-04-12T08:15:00Z',
        actualDurationMinutes: 45,
        standardDurationMinutes: 45,
        varianceMinutes: 0,
        stepStatus: 'completed'
      },
      {
        stepId: 'op-0941-20',
        sequence: 20,
        operationName: 'Cam Lobe CNC Rough Milling',
        workCenterName: 'Camshaft Machining Cell',
        machineId: 'MC-CNC-04',
        machineName: 'Heller 5-Axis Horizontal Center',
        operatorName: 'Devendra Shinde',
        operatorBadge: 'EMP-188',
        startedAt: '2026-04-12T09:00:00Z',
        completedAt: '2026-04-12T11:45:00Z',
        actualDurationMinutes: 165,
        standardDurationMinutes: 120,
        varianceMinutes: 45,
        stepStatus: 'rework'
      }
    ],
    qualityInspections: [
      {
        id: 'qc-0941-01',
        operationSequence: 20,
        inspectionType: 'dimensional',
        parameterName: 'Lobe #3 Base Circle Radius',
        specification: '34.50 ± 0.05 mm',
        nominalValue: '34.50 mm',
        lowerLimit: '34.45 mm',
        upperLimit: '34.55 mm',
        measuredValue: '34.38 mm (Out of tolerance)',
        unit: 'mm',
        result: 'fail',
        gaugeCalibrationId: 'CAL-MIC-2026-092',
        inspectorName: 'Devendra Shinde',
        inspectorBadge: 'EMP-188',
        timestamp: '2026-04-12T11:40:00Z'
      }
    ],
    deviations: [
      {
        id: 'dev-0941-01',
        deviationNumber: 'NCR-2026-0042',
        operationSequence: 20,
        severity: 'major',
        description: 'Lobe #3 base circle radius undercut by 0.07 mm due to toolholder vibration.',
        immediateAction: 'Production stopped on MC-CNC-04. Unit quarantined with physical red hold tag.',
        rootCauseAnalysis: 'Toolholder hydraulic collet lost gripping torque due to seal leakage.',
        disposition: 'rework',
        isResolved: false,
        loggedBy: 'Devendra Shinde',
        loggedAt: '2026-04-12T11:48:00Z',
        capaReference: 'CAPA-2026-014'
      }
    ],
    signatures: [],
    auditTrail: [
      {
        id: 'aud-0941-01',
        timestamp: '2026-04-12T11:50:00Z',
        userId: 'usr-op-06',
        userName: 'Devendra Shinde',
        userRole: 'Machinist',
        eventType: 'deviation_logged',
        description: 'Logged Non-Conformance Report NCR-2026-0042. Machine stopped.',
        eventHash: '8a1204889218492040182b8d8921be02891ca018249bb128941094baec102948'
      },
      {
        id: 'aud-0941-02',
        timestamp: '2026-04-12T12:00:00Z',
        userId: 'usr-qc-01',
        userName: 'Anand Deshmukh',
        userRole: 'Quality Manager',
        eventType: 'status_changed',
        description: 'Batch moved to quarantined status pending MRB disposition.',
        previousValue: 'in_compilation',
        newValue: 'quarantined',
        justification: 'Unresolved major dimensional deviation NCR-2026-0042.',
        eventHash: '9920b7218349281a99efbc204128490a019284bcda928190a7c92b84ef0182c1'
      }
    ]
  }
];

class ElectronicBatchRecordService {
  private getStorage(): EDHRRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed reading eDHR from localStorage', e);
    }
    this.saveStorage(INITIAL_EDHR_RECORDS);
    return INITIAL_EDHR_RECORDS;
  }

  private saveStorage(records: EDHRRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed saving eDHR to localStorage', e);
    }
  }

  public async getRecords(filter?: EDHRFilterOptions): Promise<EDHRRecord[]> {
    let records = this.getStorage();

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        records = records.filter(r => r.releaseStatus === filter.status);
      }
      if (filter.trackingMode && filter.trackingMode !== 'all') {
        records = records.filter(r => r.trackingMode === filter.trackingMode);
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase().trim();
        records = records.filter(r =>
          r.dhrNumber.toLowerCase().includes(query) ||
          r.batchNumber.toLowerCase().includes(query) ||
          r.workOrderNumber.toLowerCase().includes(query) ||
          r.partName.toLowerCase().includes(query) ||
          r.customerName.toLowerCase().includes(query)
        );
      }
    }

    return records;
  }

  public async getRecordById(id: string): Promise<EDHRRecord | null> {
    const records = this.getStorage();
    return records.find(r => r.id === id || r.dhrNumber === id) || null;
  }

  public async autoCompileFromWorkOrder(params: {
    workOrderNumber: string;
    batchNumber?: string;
    compiledBy: string;
    regulatoryStandard?: 'FDA_21CFR_PART_820' | 'ISO_13485' | 'AS9100D' | 'IATF_16949';
  }): Promise<EDHRRecord> {
    const records = this.getStorage();
    const id = `edhr-${Date.now()}`;
    const dhrNumber = `DHR-2026-${params.workOrderNumber.replace(/[^a-zA-Z0-9]/g, '')}-01`;
    const batchNumber = params.batchNumber || `SN-2026-ENG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: EDHRRecord = {
      id,
      tenantId: 'demo-tenant',
      dhrNumber,
      batchNumber,
      trackingMode: 'serialized_unit',
      batchQuantity: 1,
      unitOfMeasure: 'pcs',
      workOrderId: `wo-${Date.now()}`,
      workOrderNumber: params.workOrderNumber,
      customerName: 'Bajaj Auto Ltd. — Chakan Plant',
      partNumber: 'CRK-8802',
      partName: 'Forged Crankshaft — 4-Cylinder Turbo',
      drawingNumber: 'DWG-CRK-8802-D',
      revision: 'Rev D.4',
      regulatoryStandard: params.regulatoryStandard || 'AS9100D',
      releaseStatus: 'pending_qa_review',
      manufacturingStartDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      manufacturingCompletionDate: new Date().toISOString(),
      compiledAt: new Date().toISOString(),
      compiledBy: params.compiledBy,
      dhrChecksum: `SHA256-${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      qrVerificationUrl: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${dhrNumber}`,
      notes: `Auto-compiled eDHR generated for ${params.workOrderNumber}. All BOM items, machine telemetry, and QC checks synthesized.`,
      materials: [
        {
          id: `mat-${Date.now()}-1`,
          partNumber: 'WR-1002',
          description: 'Wire Rod / Round Bar — High Tensile Steel 80mm',
          lotNumber: 'LOT-2026-RM-0412',
          supplierName: 'Tata Prime Steel Ltd.',
          heatNumber: 'HT-TATA-9942',
          mtrNumber: 'MTR-TATA-2026-9942A',
          requiredQty: 0.045,
          consumedQty: 0.045,
          unit: 'tonnes',
          inspectionStatus: 'passed',
          verifiedBy: params.compiledBy,
          verifiedAt: new Date().toISOString()
        }
      ],
      operations: [
        {
          stepId: `op-${Date.now()}-10`,
          sequence: 10,
          operationName: 'Raw Billet Sawing & Centering',
          workCenterName: 'Sawing & Cut-off Cell',
          machineId: 'MC-SAW-01',
          machineName: 'KastoBand Billet Saw 450A',
          operatorName: 'Ramesh Pawar',
          operatorBadge: 'EMP-102',
          startedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
          actualDurationMinutes: 45,
          standardDurationMinutes: 45,
          varianceMinutes: 0,
          stepStatus: 'completed'
        },
        {
          stepId: `op-${Date.now()}-20`,
          sequence: 20,
          operationName: 'CNC Turning & Journal Roughing',
          workCenterName: 'Heavy Turning Bay',
          machineId: 'MC-CNC-01',
          machineName: 'Doosan Lynx 2100LSY CNC Lathe',
          operatorName: 'Vikram Rao',
          operatorBadge: 'EMP-104',
          startedAt: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
          actualDurationMinutes: 135,
          standardDurationMinutes: 135,
          varianceMinutes: 0,
          stepStatus: 'completed'
        },
        {
          stepId: `op-${Date.now()}-30`,
          sequence: 30,
          operationName: 'Induction Hardening & Quenching',
          workCenterName: 'Thermal Treatment Facility',
          machineId: 'MC-HT-02',
          machineName: 'Inductoheat 50kW Dual Spindle Hardener',
          operatorName: 'Sunil Sharma',
          operatorBadge: 'EMP-208',
          startedAt: new Date(Date.now() - 43 * 3600 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
          actualDurationMinutes: 75,
          standardDurationMinutes: 80,
          varianceMinutes: -5,
          stepStatus: 'completed'
        },
        {
          stepId: `op-${Date.now()}-40`,
          sequence: 40,
          operationName: 'Precision Cylindrical Grinding',
          workCenterName: 'Finish Grinding Cell',
          machineId: 'MC-GRD-01',
          machineName: 'Studer S33 CNC Cylindrical Grinder',
          operatorName: 'Kishore Mahajan',
          operatorBadge: 'EMP-312',
          startedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
          actualDurationMinutes: 130,
          standardDurationMinutes: 130,
          varianceMinutes: 0,
          stepStatus: 'completed'
        },
        {
          stepId: `op-${Date.now()}-50`,
          sequence: 50,
          operationName: 'Zeiss CMM Metrology & NDT Inspection',
          workCenterName: 'Precision Metrology Lab',
          machineId: 'MC-CMM-01',
          machineName: 'Zeiss Prismo Ultra CMM',
          operatorName: 'Anand Deshmukh',
          operatorBadge: 'EMP-QC-01',
          startedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 19 * 3600 * 1000).toISOString(),
          actualDurationMinutes: 75,
          standardDurationMinutes: 75,
          varianceMinutes: 0,
          stepStatus: 'completed'
        }
      ],
      qualityInspections: [
        {
          id: `qc-${Date.now()}-1`,
          operationSequence: 40,
          inspectionType: 'dimensional',
          parameterName: 'Finished Journal Diameter',
          specification: '60.000 ± 0.005 mm',
          nominalValue: '60.000 mm',
          lowerLimit: '59.995 mm',
          upperLimit: '60.005 mm',
          measuredValue: '60.001 mm',
          unit: 'mm',
          result: 'pass',
          inspectorName: 'Kishore Mahajan',
          inspectorBadge: 'EMP-312',
          timestamp: new Date().toISOString()
        },
        {
          id: `qc-${Date.now()}-2`,
          operationSequence: 50,
          inspectionType: 'dimensional',
          parameterName: '3D Coordinate Runout',
          specification: '< 0.008 mm',
          nominalValue: '0.000 mm',
          upperLimit: '0.008 mm',
          measuredValue: '0.003 mm',
          unit: 'mm',
          result: 'pass',
          inspectorName: 'Anand Deshmukh',
          inspectorBadge: 'EMP-QC-01',
          timestamp: new Date().toISOString()
        }
      ],
      deviations: [],
      signatures: [],
      auditTrail: [
        {
          id: `aud-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          userId: 'usr-compiler',
          userName: params.compiledBy,
          userRole: 'Quality Systems Manager',
          eventType: 'auto_compiled',
          description: `Auto-compiled complete digital history from Work Order ${params.workOrderNumber}.`,
          newValue: 'Status: pending_qa_review',
          eventHash: `SHA256-${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        }
      ]
    };

    records.unshift(newRecord);
    this.saveStorage(records);
    return newRecord;
  }

  public async signRecord(
    dhrId: string,
    signatureData: {
      signerName: string;
      signerEmail: string;
      signerRole: string;
      signerUserId: string;
      intent: SignatureIntent;
      reasonStatement: string;
    }
  ): Promise<EDHRRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === dhrId);
    if (index === -1) throw new Error(`eDHR ${dhrId} not found`);

    const record = { ...records[index] };
    const sigId = `sig-${Date.now()}`;
    const hash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const intentLabels: Record<SignatureIntent, string> = {
      performed_by: 'Performed By (Operations Execution)',
      verified_by: 'Verified By (Production Supervision)',
      quality_approved: 'Quality Assurance Final Approval',
      released_for_distribution: 'Final Regulatory Release for Distribution'
    };

    const newSignature: ElectronicSignature = {
      id: sigId,
      signerName: signatureData.signerName,
      signerEmail: signatureData.signerEmail,
      signerRole: signatureData.signerRole,
      signerUserId: signatureData.signerUserId,
      intent: signatureData.intent,
      intentLabel: intentLabels[signatureData.intent] || signatureData.intent,
      signedAt: new Date().toISOString(),
      ipAddress: '192.168.1.100 (Verified Station)',
      cryptographicSignature: hash,
      reasonStatement: signatureData.reasonStatement
    };

    record.signatures = [...record.signatures, newSignature];

    // Audit Trail Entry
    const auditEvent: EDHRAuditTrailEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: signatureData.signerUserId,
      userName: signatureData.signerName,
      userRole: signatureData.signerRole,
      eventType: 'electronic_signature',
      description: `21 CFR Part 11 Electronic Signature added: ${newSignature.intentLabel}.`,
      justification: signatureData.reasonStatement,
      eventHash: hash
    };
    record.auditTrail = [...record.auditTrail, auditEvent];

    // If Quality Release signature is applied, check if we can release the batch!
    if (
      signatureData.intent === 'released_for_distribution' || 
      signatureData.intent === 'quality_approved'
    ) {
      const hasUnresolvedDeviations = record.deviations.some(d => !d.isResolved);
      if (!hasUnresolvedDeviations) {
        record.releaseStatus = 'released';
        record.releaseDate = new Date().toISOString();
        record.releasedBy = `${signatureData.signerName} (${signatureData.signerRole})`;

        record.auditTrail.push({
          id: `aud-${Date.now()}-rel`,
          timestamp: new Date().toISOString(),
          userId: signatureData.signerUserId,
          userName: signatureData.signerName,
          userRole: signatureData.signerRole,
          eventType: 'status_changed',
          description: 'eDHR released for shipment following authorized regulatory electronic signature.',
          previousValue: record.releaseStatus,
          newValue: 'released',
          eventHash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        });
      }
    }

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async logDeviation(
    dhrId: string,
    deviationData: Omit<EDHRDeviation, 'id' | 'loggedAt' | 'isResolved'>
  ): Promise<EDHRRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === dhrId);
    if (index === -1) throw new Error(`eDHR ${dhrId} not found`);

    const record = { ...records[index] };
    const devId = `dev-${Date.now()}`;
    const newDeviation: EDHRDeviation = {
      ...deviationData,
      id: devId,
      loggedAt: new Date().toISOString(),
      isResolved: false
    };

    record.deviations = [...record.deviations, newDeviation];
    record.releaseStatus = 'quarantined';
    record.quarantineReason = `Non-conformance logged: ${newDeviation.deviationNumber} — ${newDeviation.description}`;

    record.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-qc',
      userName: deviationData.loggedBy,
      userRole: 'Quality Inspector',
      eventType: 'deviation_logged',
      description: `Deviation ${newDeviation.deviationNumber} logged: ${newDeviation.description}. Batch quarantined.`,
      newValue: 'quarantined',
      eventHash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    });

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public async resolveDeviation(
    dhrId: string,
    deviationId: string,
    resolution: { approvedBy: string; disposition: EDHRDeviation['disposition']; notes?: string }
  ): Promise<EDHRRecord> {
    const records = this.getStorage();
    const index = records.findIndex(r => r.id === dhrId);
    if (index === -1) throw new Error(`eDHR ${dhrId} not found`);

    const record = { ...records[index] };
    const devIndex = record.deviations.findIndex(d => d.id === deviationId);
    if (devIndex === -1) throw new Error(`Deviation ${deviationId} not found`);

    const deviation = { ...record.deviations[devIndex] };
    deviation.isResolved = true;
    deviation.approvedBy = resolution.approvedBy;
    deviation.approvedAt = new Date().toISOString();
    deviation.disposition = resolution.disposition;
    record.deviations[devIndex] = deviation;

    // Check if other deviations exist
    const remainingUnresolved = record.deviations.some(d => !d.isResolved);
    if (!remainingUnresolved && record.releaseStatus === 'quarantined') {
      record.releaseStatus = 'pending_qa_review';
      record.quarantineReason = undefined;
    }

    record.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-mrb-lead',
      userName: resolution.approvedBy,
      userRole: 'MRB Quality Manager',
      eventType: 'deviation_resolved',
      description: `Deviation ${deviation.deviationNumber} resolved with disposition: ${resolution.disposition}.`,
      justification: resolution.notes || 'MRB engineering signoff confirmed.',
      eventHash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    });

    records[index] = record;
    this.saveStorage(records);
    return record;
  }

  public exportCsv(dhr: EDHRRecord): string {
    const headers = [
      'DHR Number',
      'Batch Number',
      'Work Order',
      'Part Number',
      'Part Name',
      'Revision',
      'Status',
      'Section',
      'Item/Operation Name',
      'Identifier/Machine',
      'Responsible Person',
      'Timestamp',
      'Specification/Result'
    ];

    const rows: string[] = [];

    // Materials
    dhr.materials.forEach(m => {
      rows.push([
        `"${dhr.dhrNumber}"`,
        `"${dhr.batchNumber}"`,
        `"${dhr.workOrderNumber}"`,
        `"${dhr.partNumber}"`,
        `"${dhr.partName}"`,
        `"${dhr.revision}"`,
        `"${dhr.releaseStatus}"`,
        '"Bill of Materials"',
        `"${m.description}"`,
        `"Lot: ${m.lotNumber} | Heat: ${m.heatNumber || 'N/A'}"`,
        `"${m.verifiedBy}"`,
        `"${m.verifiedAt}"`,
        `"${m.inspectionStatus.toUpperCase()}"`
      ].join(','));
    });

    // Operations
    dhr.operations.forEach(o => {
      rows.push([
        `"${dhr.dhrNumber}"`,
        `"${dhr.batchNumber}"`,
        `"${dhr.workOrderNumber}"`,
        `"${dhr.partNumber}"`,
        `"${dhr.partName}"`,
        `"${dhr.revision}"`,
        `"${dhr.releaseStatus}"`,
        '"Operations Routing"',
        `"Op ${o.sequence}: ${o.operationName}"`,
        `"${o.machineId} (${o.machineName})"`,
        `"${o.operatorName} (${o.operatorBadge})"`,
        `"${o.completedAt || o.startedAt}"`,
        `"Duration: ${o.actualDurationMinutes}m (Variance: ${o.varianceMinutes}m)"`
      ].join(','));
    });

    // Quality Inspections
    dhr.qualityInspections.forEach(q => {
      rows.push([
        `"${dhr.dhrNumber}"`,
        `"${dhr.batchNumber}"`,
        `"${dhr.workOrderNumber}"`,
        `"${dhr.partNumber}"`,
        `"${dhr.partName}"`,
        `"${dhr.revision}"`,
        `"${dhr.releaseStatus}"`,
        '"Quality Inspection"',
        `"${q.parameterName}"`,
        `"Gauge: ${q.gaugeCalibrationId || 'Direct'}"`,
        `"${q.inspectorName}"`,
        `"${q.timestamp}"`,
        `"Spec: ${q.specification} | Measured: ${q.measuredValue} | Result: ${q.result.toUpperCase()}"`
      ].join(','));
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public exportAuditTrailCsv(dhr: EDHRRecord): string {
    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'User ID',
      'User Name',
      'User Role',
      'Event Type',
      'Description',
      'Previous Value',
      'New Value',
      'Justification / Reason',
      'Event Cryptographic Hash (SHA-256)'
    ];

    const rows = dhr.auditTrail.map(a => [
      `"${a.id}"`,
      `"${a.timestamp}"`,
      `"${a.userId}"`,
      `"${a.userName}"`,
      `"${a.userRole}"`,
      `"${a.eventType}"`,
      `"${a.description}"`,
      `"${a.previousValue || ''}"`,
      `"${a.newValue || ''}"`,
      `"${a.justification || ''}"`,
      `"${a.eventHash}"`
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  public exportDigitalJson(dhr: EDHRRecord): string {
    const exportPacket = {
      standardConformance: {
        spec: 'FDA 21 CFR Part 11 & Part 820 Electronic Device History Record',
        annex11Compliant: true,
        generatedAt: new Date().toISOString(),
        masterChecksum: dhr.dhrChecksum
      },
      electronicBatchRecord: dhr
    };
    return JSON.stringify(exportPacket, null, 2);
  }
}

export const edhrService = new ElectronicBatchRecordService();
