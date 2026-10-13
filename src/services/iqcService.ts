// src/services/iqcService.ts

import {
  IqcOrder,
  InspectionPlan,
  IqcFilterOptions,
  IqcKpis,
  DefectPhoto,
  SampleMeasurement,
  IqcDispositionDetails,
  SamplingStandard
} from '../types/iqc';

const PLANS_STORAGE_KEY = 'mes_iqc_inspection_plans_v1';
const ORDERS_STORAGE_KEY = 'mes_iqc_orders_v1';

// Preset realistic defect SVG data URIs for photos
export const DEFECT_PRESET_IMAGES: { id: string; label: string; dataUrl: string; category: DefectPhoto['defectCategory'] }[] = [
  {
    id: 'preset-crack',
    label: 'Surface Micro-Crack',
    category: 'surface_crack',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><rect x="20" y="20" width="360" height="260" fill="%23334155" rx="6"/><path d="M 50 150 Q 120 120 180 160 T 260 130 T 340 170" stroke="%23ef4444" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M 180 160 L 200 200" stroke="%23ef4444" stroke-width="3" fill="none"/><circle cx="180" cy="160" r="12" stroke="%23f87171" stroke-width="2" fill="none" stroke-dasharray="3,3"/><text x="200" y="220" fill="%23fca5a5" font-family="sans-serif" font-size="12" font-weight="bold">FISSURE 0.8mm CRACK</text><text x="30" y="50" fill="%2394a3b8" font-family="monospace" font-size="11">INSPECTION CAM: MAG 20X</text></svg>`
  },
  {
    id: 'preset-thickness',
    label: 'Under-Tolerance Thickness',
    category: 'dimensional_variance',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="30" y="60" width="340" height="180" fill="%231e293b" stroke="%23475569" stroke-width="2"/><line x1="80" y1="60" x2="80" y2="240" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="4,4"/><line x1="320" y1="60" x2="320" y2="240" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="4,4"/><line x1="80" y1="150" x2="320" y2="150" stroke="%23ef4444" stroke-width="3"/><text x="140" y="140" fill="%23ef4444" font-family="monospace" font-size="14" font-weight="bold">ACTUAL: 2.36 mm</text><text x="140" y="170" fill="%2394a3b8" font-family="sans-serif" font-size="11">SPEC MIN: 2.45 mm (-0.09mm)</text><circle cx="200" cy="150" r="28" stroke="%23ef4444" stroke-width="2" fill="none"/></svg>`
  },
  {
    id: 'preset-rust',
    label: 'Surface Rust / Oxidation',
    category: 'rust_oxidation',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><rect x="40" y="40" width="320" height="220" fill="%23475569" rx="8"/><ellipse cx="140" cy="130" rx="45" ry="30" fill="%23b45309" opacity="0.85"/><ellipse cx="180" cy="160" rx="35" ry="25" fill="%23d97706" opacity="0.9"/><circle cx="230" cy="120" r="25" fill="%2392400e" opacity="0.8"/><text x="50" y="70" fill="%23fed7aa" font-family="sans-serif" font-size="12" font-weight="bold">ATMOSPHERIC OXIDATION</text><text x="50" y="90" fill="%23fde68a" font-family="monospace" font-size="10">BATCH EXPOSURE IN TRANSIT</text></svg>`
  },
  {
    id: 'preset-burr',
    label: 'Thread Burrs / Damaged Flank',
    category: 'thread_damage',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23182234"/><path d="M 60 100 L 100 130 L 140 100 L 180 130 L 220 100 L 260 130 L 300 100" stroke="%2364748b" stroke-width="6" fill="none"/><polygon points="175,125 185,110 195,135" fill="%23ef4444"/><circle cx="180" cy="125" r="18" stroke="%23f43f5e" stroke-width="2" fill="none" stroke-dasharray="4,2"/><text x="130" y="180" fill="%23fda4af" font-family="monospace" font-size="12">BURR DETECTED ON PITCH</text></svg>`
  },
  {
    id: 'preset-porosity',
    label: 'Casting Porosity / Blowhole',
    category: 'porosity_voids',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><rect x="30" y="30" width="340" height="240" fill="%23334155" rx="8"/><circle cx="180" cy="140" r="18" fill="%230f172a" stroke="%23ef4444" stroke-width="3"/><circle cx="215" cy="160" r="9" fill="%230f172a" stroke="%23ef4444" stroke-width="2"/><circle cx="150" cy="165" r="12" fill="%230f172a" stroke="%23f59e0b" stroke-width="2"/><text x="50" y="65" fill="%23fca5a5" font-family="sans-serif" font-size="12" font-weight="bold">INTERNAL POROSITY VOIDS</text><text x="50" y="85" fill="%2394a3b8" font-family="monospace" font-size="10">CROSS-SECTION X-RAY INSPECTION</text></svg>`
  }
];

// Pre-seeded standard industrial inspection plans
const INITIAL_INSPECTION_PLANS: InspectionPlan[] = [
  {
    id: 'plan-steel-en8',
    planCode: 'IP-STEEL-EN8',
    title: 'Hot Rolled EN8 Steel Bar Inspection Protocol',
    supplierId: 'sup-tata-01',
    supplierName: 'Tata Prime Steel Ltd.',
    partSku: 'RAW-STEEL-EN8-45',
    partName: 'EN8 Carbon Steel Round Bar Dia 45mm',
    category: 'Raw Materials - Alloy & Carbon Steels',
    version: 3,
    status: 'active',
    aqlLevel: '0.65',
    samplingStandard: 'ISO_2859_1_NORMAL',
    samplingMethodNotes: 'Level II General Sampling. 5 samples measured per lot. 100% check on Mill Test Certificate (MTR).',
    preparedBy: 'Rajesh Sharma (Lead Quality Metrologist)',
    approvedBy: 'Dr. Anand Verma (QA Vice President)',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-05-10T14:30:00Z',
    parameters: [
      {
        id: 'p-en8-dia',
        parameterName: 'Outer Diameter (OD)',
        description: 'External turned diameter along middle and both ends',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 45.0,
        lowerTolerance: 44.85,
        upperTolerance: 45.15,
        gaugeOrInstrument: 'Digital Vernier Caliper (0.01mm) Mitutoyo',
        calibrationCode: 'CAL-VC-014',
        criticality: 'critical',
        defaultSampleSize: 5,
        notes: 'Take 2 orthogonal measurements per sample bar'
      },
      {
        id: 'p-en8-hard',
        parameterName: 'Core Surface Hardness',
        description: 'Rockwell C Scale hardness across sample cross section',
        characteristicType: 'hardness',
        toleranceType: 'two_sided',
        unit: 'HRC',
        nominalValue: 28.0,
        lowerTolerance: 24.0,
        upperTolerance: 32.0,
        gaugeOrInstrument: 'Digital Rockwell Hardness Tester Wilson 574',
        calibrationCode: 'CAL-HT-003',
        criticality: 'major',
        defaultSampleSize: 5,
        notes: 'Indent at 120-degree intervals after face grinding'
      },
      {
        id: 'p-en8-carbon',
        parameterName: 'Carbon Content (C %)',
        description: 'Chemical composition verification against Mill Test Certificate (MTR)',
        characteristicType: 'chemical_mtr',
        toleranceType: 'two_sided',
        unit: '%',
        nominalValue: 0.40,
        lowerTolerance: 0.36,
        upperTolerance: 0.44,
        gaugeOrInstrument: 'Optical Emission Spectrometer / MTR Cross-Verification',
        calibrationCode: 'CAL-SPEC-001',
        criticality: 'critical',
        defaultSampleSize: 1,
        notes: 'IS 5517 standard composition match'
      },
      {
        id: 'p-en8-vis',
        parameterName: 'Visual Surface Integrity & Seams',
        description: 'Visual check for longitudinal seams, pipe, deep scale pits, and gouges',
        characteristicType: 'visual',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Visual under 1000 Lux illumination / 5x Magnifier',
        criticality: 'major',
        defaultSampleSize: 5,
        notes: 'Zero permissible deep seams > 0.3mm'
      }
    ]
  },
  {
    id: 'plan-sheet-crca',
    planCode: 'IP-SHEET-CRCA',
    title: 'Cold Rolled Close Annealed (CRCA) Sheet 2.5mm',
    supplierId: 'sup-jindal-02',
    supplierName: 'Jindal Steel & Power Ltd.',
    partSku: 'RAW-SHEET-CRCA-25',
    partName: 'CRCA Mild Steel Sheet 2.50mm x 1250mm x 2500mm',
    category: 'Raw Materials - Sheet Metal',
    version: 2,
    status: 'active',
    aqlLevel: '1.0',
    samplingStandard: 'ISO_2859_1_NORMAL',
    samplingMethodNotes: '5 samples across sheet corners and center per incoming bundle',
    preparedBy: 'Vikram Joshi (Senior QA Inspector)',
    approvedBy: 'Dr. Anand Verma (QA VP)',
    createdAt: '2026-02-01T10:30:00Z',
    updatedAt: '2026-06-12T11:00:00Z',
    parameters: [
      {
        id: 'p-crca-thk',
        parameterName: 'Sheet Thickness',
        description: 'Cross-sectional thickness measured 50mm inward from edge',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 2.50,
        lowerTolerance: 2.45,
        upperTolerance: 2.55,
        gaugeOrInstrument: 'Digital Outside Micrometer 0-25mm (0.001mm)',
        calibrationCode: 'CAL-MIC-022',
        criticality: 'critical',
        defaultSampleSize: 5,
        notes: 'Strict adherence to IS 513 Grade D'
      },
      {
        id: 'p-crca-width',
        parameterName: 'Sheet Width',
        description: 'Total width across edge profiles',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 1250.0,
        lowerTolerance: 1248.0,
        upperTolerance: 1252.0,
        gaugeOrInstrument: 'Heavy Duty Steel Rule / Tape Measure Calibrated',
        calibrationCode: 'CAL-TAPE-005',
        criticality: 'minor',
        defaultSampleSize: 3
      },
      {
        id: 'p-crca-rust',
        parameterName: 'Rust / Oil Film Preservation',
        description: 'Anti-rust protective oil coating consistency and surface discoloration',
        characteristicType: 'visual',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Visual Inspection / White Cloth Wipe Test',
        criticality: 'major',
        defaultSampleSize: 5,
        notes: 'Must be free from red rust spots or dried water stains'
      }
    ]
  },
  {
    id: 'plan-bolt-m12',
    planCode: 'IP-BOLT-M12',
    title: 'High Tensile Hex Head Bolt M12x50 Gr 8.8',
    supplierId: 'sup-sundram-03',
    supplierName: 'Sundram Fasteners Ltd.',
    partSku: 'FAST-BOLT-M12-50',
    partName: 'High Tensile Hex Bolt M12 x 50mm Grade 8.8 Black Oxide',
    category: 'Hardware & Fasteners',
    version: 1,
    status: 'active',
    aqlLevel: '0.40',
    samplingStandard: 'ISO_2859_1_NORMAL',
    samplingMethodNotes: 'AQL 0.40 for critical fasteners. 8 samples tested from randomized carton selection.',
    preparedBy: 'Anita Desai (Quality Control Engineer)',
    approvedBy: 'Dr. Anand Verma (QA VP)',
    createdAt: '2026-03-10T11:15:00Z',
    updatedAt: '2026-04-18T16:00:00Z',
    parameters: [
      {
        id: 'p-bolt-shank',
        parameterName: 'Shank Diameter',
        description: 'Unthreaded shank body diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 12.00,
        lowerTolerance: 11.85,
        upperTolerance: 12.00,
        gaugeOrInstrument: 'Digital Micrometer 0-25mm',
        calibrationCode: 'CAL-MIC-011',
        criticality: 'major',
        defaultSampleSize: 8
      },
      {
        id: 'p-bolt-thread',
        parameterName: 'Thread Pitch & Gauge Fit',
        description: 'M12x1.75 thread accuracy using 6g Go / No-Go Thread Ring Gauge',
        characteristicType: 'thread_pitch',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Thread Ring Gauge M12x1.75 6g Go / No-Go',
        calibrationCode: 'CAL-TRG-008',
        criticality: 'critical',
        defaultSampleSize: 8,
        notes: 'Go gauge must pass fully with finger torque; No-Go must not enter more than 2 turns'
      },
      {
        id: 'p-bolt-len',
        parameterName: 'Total Bolt Length (Under Head)',
        description: 'Length from bottom of hex head to threaded end tip',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 50.0,
        lowerTolerance: 49.2,
        upperTolerance: 50.8,
        gaugeOrInstrument: 'Vernier Caliper 150mm',
        calibrationCode: 'CAL-VC-002',
        criticality: 'minor',
        defaultSampleSize: 8
      },
      {
        id: 'p-bolt-hrc',
        parameterName: 'Core Hardness (Grade 8.8)',
        description: 'Hardness across body core to verify heat treatment quench & temper',
        characteristicType: 'hardness',
        toleranceType: 'two_sided',
        unit: 'HRC',
        nominalValue: 26.0,
        lowerTolerance: 22.0,
        upperTolerance: 32.0,
        gaugeOrInstrument: 'Rockwell Hardness Tester Wilson',
        calibrationCode: 'CAL-HT-003',
        criticality: 'critical',
        defaultSampleSize: 5
      }
    ]
  },
  {
    id: 'plan-bearing-6205',
    planCode: 'IP-BEARING-6205',
    title: 'Deep Groove Radial Ball Bearing 6205 2RS C3',
    supplierId: 'sup-skf-04',
    supplierName: 'SKF India Ltd.',
    partSku: 'CMP-BRG-6205-2RS',
    partName: 'Deep Groove Radial Ball Bearing 6205 2RS C3 (25x52x15mm)',
    category: 'Mechanical Sub-assemblies',
    version: 4,
    status: 'active',
    aqlLevel: '0.40',
    samplingStandard: 'ISO_2859_1_NORMAL',
    samplingMethodNotes: 'Precision metrology lab inspection. 5 units measured for runout and bore.',
    preparedBy: 'Rajesh Sharma (Lead Metrologist)',
    approvedBy: 'Dr. Anand Verma (QA VP)',
    createdAt: '2026-04-02T08:00:00Z',
    updatedAt: '2026-07-01T09:30:00Z',
    parameters: [
      {
        id: 'p-brg-bore',
        parameterName: 'Bore Inner Diameter (ID)',
        description: 'Internal shaft fit bore diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 25.000,
        lowerTolerance: 24.992,
        upperTolerance: 25.000,
        gaugeOrInstrument: 'Three-Point Internal Bore Micrometer (0.001mm)',
        calibrationCode: 'CAL-BM-007',
        criticality: 'critical',
        defaultSampleSize: 5
      },
      {
        id: 'p-brg-od',
        parameterName: 'Outer Diameter (OD)',
        description: 'Housing fit outside diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 52.000,
        lowerTolerance: 51.989,
        upperTolerance: 52.000,
        gaugeOrInstrument: 'Mitutoyo Linear Height Gauge & Master Rings',
        calibrationCode: 'CAL-HG-001',
        criticality: 'critical',
        defaultSampleSize: 5
      },
      {
        id: 'p-brg-spin',
        parameterName: 'Free Rotation & Seal Integrity',
        description: 'Free rotational spin feel, absence of cogging/grittiness, rubber seals seated properly',
        characteristicType: 'functional',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Manual Spin Test Rig & Stethoscope Probe',
        criticality: 'major',
        defaultSampleSize: 5
      }
    ]
  }
];

// Pre-seeded realistic IQC Orders with real measurements, photos, and disposition logs
const INITIAL_IQC_ORDERS: IqcOrder[] = [
  {
    id: 'iqc-order-0041',
    orderNumber: 'IQC-2026-0041',
    poNumber: 'PO-2026-001',
    poItemId: 'poi-1',
    grnNumber: 'GRN-2026-0182',
    supplierId: 'sup-tata-01',
    supplierName: 'Tata Prime Steel Ltd.',
    supplierCode: 'SUP-TATA-01',
    partSku: 'RAW-STEEL-EN8-45',
    partName: 'EN8 Carbon Steel Round Bar Dia 45mm',
    category: 'Raw Materials - Alloy & Carbon Steels',
    receivedQty: 500,
    unit: 'Kg',
    sampleSize: 5,
    heatLotNumber: 'HT-98421-B',
    mtrNumber: 'MTR-TATA-2026-7890',
    receiptDate: '2026-05-14T08:30:00Z',
    inspectorId: 'usr-insp-01',
    inspectorName: 'Anita Desai',
    status: 'completed',
    inspectionPlanId: 'plan-steel-en8',
    inspectionPlanCode: 'IP-STEEL-EN8',
    overallResult: 'pass',
    createdAt: '2026-05-14T09:00:00Z',
    completedAt: '2026-05-14T11:45:00Z',
    notes: 'All dimensional and hardness measurements compliant. MTR chemical values match IS 5517 specs.',
    defectPhotos: [],
    parameters: [
      {
        parameterId: 'p-en8-dia',
        parameterName: 'Outer Diameter (OD)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 45.0,
        minSpec: 44.85,
        maxSpec: 45.15,
        gaugeOrInstrument: 'Digital Vernier Caliper (0.01mm) Mitutoyo',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 45.02,
        rangeValue: 0.08,
        stdDev: 0.031,
        cpk: 1.40,
        samples: [
          { sampleNumber: 1, measuredValue: 45.01, isOutOfSpec: false, deviationFromNominal: 0.01 },
          { sampleNumber: 2, measuredValue: 45.04, isOutOfSpec: false, deviationFromNominal: 0.04 },
          { sampleNumber: 3, measuredValue: 44.98, isOutOfSpec: false, deviationFromNominal: -0.02 },
          { sampleNumber: 4, measuredValue: 45.06, isOutOfSpec: false, deviationFromNominal: 0.06 },
          { sampleNumber: 5, measuredValue: 45.01, isOutOfSpec: false, deviationFromNominal: 0.01 }
        ]
      },
      {
        parameterId: 'p-en8-hard',
        parameterName: 'Core Surface Hardness',
        characteristicType: 'hardness',
        toleranceType: 'two_sided',
        unit: 'HRC',
        nominalValue: 28.0,
        minSpec: 24.0,
        maxSpec: 32.0,
        gaugeOrInstrument: 'Digital Rockwell Hardness Tester Wilson 574',
        criticality: 'major',
        requiredSampleSize: 5,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 27.6,
        rangeValue: 3.0,
        stdDev: 1.14,
        cpk: 1.17,
        samples: [
          { sampleNumber: 1, measuredValue: 27.5, isOutOfSpec: false, deviationFromNominal: -0.5 },
          { sampleNumber: 2, measuredValue: 28.0, isOutOfSpec: false, deviationFromNominal: 0.0 },
          { sampleNumber: 3, measuredValue: 26.5, isOutOfSpec: false, deviationFromNominal: -1.5 },
          { sampleNumber: 4, measuredValue: 29.5, isOutOfSpec: false, deviationFromNominal: 1.5 },
          { sampleNumber: 5, measuredValue: 26.5, isOutOfSpec: false, deviationFromNominal: -1.5 }
        ]
      },
      {
        parameterId: 'p-en8-carbon',
        parameterName: 'Carbon Content (C %)',
        characteristicType: 'chemical_mtr',
        toleranceType: 'two_sided',
        unit: '%',
        nominalValue: 0.40,
        minSpec: 0.36,
        maxSpec: 0.44,
        gaugeOrInstrument: 'Optical Emission Spectrometer / MTR Cross-Verification',
        criticality: 'critical',
        requiredSampleSize: 1,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 0.395,
        samples: [
          { sampleNumber: 1, measuredValue: 0.395, isOutOfSpec: false, deviationFromNominal: -0.005, remarks: 'Certified on MTR Page 2' }
        ]
      },
      {
        parameterId: 'p-en8-vis',
        parameterName: 'Visual Surface Integrity & Seams',
        characteristicType: 'visual',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Visual under 1000 Lux illumination / 5x Magnifier',
        criticality: 'major',
        requiredSampleSize: 5,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isVisualPass: true, isOutOfSpec: false, remarks: 'Smooth skin' },
          { sampleNumber: 2, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isVisualPass: true, isOutOfSpec: false }
        ]
      }
    ],
    disposition: {
      disposition: 'accepted',
      decidedBy: 'usr-insp-01',
      decidedByName: 'Anita Desai',
      decidedAt: '2026-05-14T11:45:00Z',
      acceptedQty: 500,
      rejectedQty: 0,
      reworkQty: 0,
      targetBinId: 'bin-raw-01',
      targetBinCode: 'BIN-RAW-01 (Heavy Bar Storage)',
      digitalSignature: {
        signerName: 'Anita Desai (Badge #QC-408)',
        badgeId: 'QC-408',
        role: 'Quality Assurance Inspector',
        timestamp: '2026-05-14T11:45:00Z',
        statement: 'I hereby certify that this lot has been inspected in accordance with IP-STEEL-EN8 and meets all quality specifications for release to stock.'
      }
    }
  },
  {
    id: 'iqc-order-0042',
    orderNumber: 'IQC-2026-0042',
    poNumber: 'PO-2026-002',
    poItemId: 'poi-2',
    grnNumber: 'GRN-2026-0185',
    supplierId: 'sup-jindal-02',
    supplierName: 'Jindal Steel & Power Ltd.',
    supplierCode: 'SUP-JIN-02',
    partSku: 'RAW-SHEET-CRCA-25',
    partName: 'CRCA Mild Steel Sheet 2.50mm x 1250mm x 2500mm',
    category: 'Raw Materials - Sheet Metal',
    receivedQty: 120,
    unit: 'Sheets',
    sampleSize: 5,
    heatLotNumber: 'HT-JS-44109',
    mtrNumber: 'MTR-JS-9021',
    receiptDate: '2026-05-15T10:15:00Z',
    inspectorId: 'usr-insp-02',
    inspectorName: 'Vikram Joshi',
    status: 'quarantined',
    inspectionPlanId: 'plan-sheet-crca',
    inspectionPlanCode: 'IP-SHEET-CRCA',
    overallResult: 'fail',
    createdAt: '2026-05-15T11:00:00Z',
    completedAt: '2026-05-15T14:20:00Z',
    notes: 'Severe sheet gauge under-tolerance detected across 3 of 5 sheets. Thickness averaged 2.38mm vs lower limit 2.45mm. Risk of stamping fracture.',
    defectPhotos: [
      {
        id: 'photo-42-1',
        timestamp: '2026-05-15T11:35:00Z',
        caption: 'Micrometer reading 2.36mm on corner gauge point (lower limit 2.45mm)',
        defectCategory: 'dimensional_variance',
        severity: 'critical',
        sampleNumber: 2,
        url: DEFECT_PRESET_IMAGES[1].dataUrl
      },
      {
        id: 'photo-42-2',
        timestamp: '2026-05-15T11:40:00Z',
        caption: 'Edge waviness and surface rust spot on top bundle sheet',
        defectCategory: 'rust_oxidation',
        severity: 'major',
        sampleNumber: 1,
        url: DEFECT_PRESET_IMAGES[2].dataUrl
      }
    ],
    parameters: [
      {
        parameterId: 'p-crca-thk',
        parameterName: 'Sheet Thickness',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 2.50,
        minSpec: 2.45,
        maxSpec: 2.55,
        gaugeOrInstrument: 'Digital Outside Micrometer 0-25mm (0.001mm)',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'fail',
        outOfSpecCount: 3,
        meanValue: 2.41,
        rangeValue: 0.10,
        stdDev: 0.043,
        cpk: -0.31,
        samples: [
          { sampleNumber: 1, measuredValue: 2.46, isOutOfSpec: false, deviationFromNominal: -0.04 },
          { sampleNumber: 2, measuredValue: 2.36, isOutOfSpec: true, deviationFromNominal: -0.14, remarks: 'FAIL: Under minimum' },
          { sampleNumber: 3, measuredValue: 2.39, isOutOfSpec: true, deviationFromNominal: -0.11, remarks: 'FAIL: Under minimum' },
          { sampleNumber: 4, measuredValue: 2.47, isOutOfSpec: false, deviationFromNominal: -0.03 },
          { sampleNumber: 5, measuredValue: 2.37, isOutOfSpec: true, deviationFromNominal: -0.13, remarks: 'FAIL: Under minimum' }
        ]
      },
      {
        parameterId: 'p-crca-width',
        parameterName: 'Sheet Width',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 1250.0,
        minSpec: 1248.0,
        maxSpec: 1252.0,
        gaugeOrInstrument: 'Heavy Duty Steel Rule / Tape Measure Calibrated',
        criticality: 'minor',
        requiredSampleSize: 3,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 1249.5,
        samples: [
          { sampleNumber: 1, measuredValue: 1249.0, isOutOfSpec: false, deviationFromNominal: -1.0 },
          { sampleNumber: 2, measuredValue: 1250.0, isOutOfSpec: false, deviationFromNominal: 0.0 },
          { sampleNumber: 3, measuredValue: 1249.5, isOutOfSpec: false, deviationFromNominal: -0.5 }
        ]
      },
      {
        parameterId: 'p-crca-rust',
        parameterName: 'Rust / Oil Film Preservation',
        characteristicType: 'visual',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Visual Inspection / White Cloth Wipe Test',
        criticality: 'major',
        requiredSampleSize: 5,
        parameterStatus: 'fail',
        outOfSpecCount: 1,
        samples: [
          { sampleNumber: 1, measuredValue: null, isVisualPass: false, isOutOfSpec: true, remarks: 'Red oxidation rust spots on lead sheet' },
          { sampleNumber: 2, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isVisualPass: true, isOutOfSpec: false }
        ]
      }
    ],
    disposition: {
      disposition: 'rejected',
      decidedBy: 'usr-insp-02',
      decidedByName: 'Vikram Joshi',
      decidedAt: '2026-05-15T14:20:00Z',
      acceptedQty: 0,
      rejectedQty: 120,
      reworkQty: 0,
      quarantineReason: 'Dimensional non-conformance: Thickness under tolerance (IS 513 Grade D breach). Red rust patches.',
      rtvDocNumber: 'RTV-2026-0012',
      targetBinId: 'bin-quarantine-red',
      targetBinCode: 'BIN-RED-QUARANTINE (Dock Holding Bay)',
      digitalSignature: {
        signerName: 'Vikram Joshi (Badge #QC-312)',
        badgeId: 'QC-312',
        role: 'Senior Quality Inspector',
        timestamp: '2026-05-15T14:20:00Z',
        statement: 'LOT REJECTED: Tagged with RED HOLD label. Material moved to Quarantine Bin. Supplier Quality Incident & RTV Debit Note issued.'
      }
    }
  },
  {
    id: 'iqc-order-0043',
    orderNumber: 'IQC-2026-0043',
    poNumber: 'PO-2026-003',
    poItemId: 'poi-3',
    grnNumber: 'GRN-2026-0188',
    supplierId: 'sup-sundram-03',
    supplierName: 'Sundram Fasteners Ltd.',
    supplierCode: 'SUP-SUN-03',
    partSku: 'FAST-BOLT-M12-50',
    partName: 'High Tensile Hex Bolt M12 x 50mm Grade 8.8 Black Oxide',
    category: 'Hardware & Fasteners',
    receivedQty: 5000,
    unit: 'Pieces',
    sampleSize: 8,
    heatLotNumber: 'HT-SF-88019',
    receiptDate: '2026-05-16T08:00:00Z',
    inspectorId: 'usr-insp-01',
    inspectorName: 'Anita Desai',
    status: 'in_progress',
    inspectionPlanId: 'plan-bolt-m12',
    inspectionPlanCode: 'IP-BOLT-M12',
    overallResult: 'pending',
    createdAt: '2026-05-16T08:30:00Z',
    notes: 'Sample testing in progress. Thread ring gauges verified. Hardness testing pending.',
    defectPhotos: [],
    parameters: [
      {
        parameterId: 'p-bolt-shank',
        parameterName: 'Shank Diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 12.00,
        minSpec: 11.85,
        maxSpec: 12.00,
        gaugeOrInstrument: 'Digital Micrometer 0-25mm',
        criticality: 'major',
        requiredSampleSize: 8,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 11.94,
        rangeValue: 0.05,
        stdDev: 0.016,
        cpk: 1.25,
        samples: [
          { sampleNumber: 1, measuredValue: 11.93, isOutOfSpec: false, deviationFromNominal: -0.07 },
          { sampleNumber: 2, measuredValue: 11.95, isOutOfSpec: false, deviationFromNominal: -0.05 },
          { sampleNumber: 3, measuredValue: 11.92, isOutOfSpec: false, deviationFromNominal: -0.08 },
          { sampleNumber: 4, measuredValue: 11.96, isOutOfSpec: false, deviationFromNominal: -0.04 },
          { sampleNumber: 5, measuredValue: 11.94, isOutOfSpec: false, deviationFromNominal: -0.06 },
          { sampleNumber: 6, measuredValue: 11.93, isOutOfSpec: false, deviationFromNominal: -0.07 },
          { sampleNumber: 7, measuredValue: 11.95, isOutOfSpec: false, deviationFromNominal: -0.05 },
          { sampleNumber: 8, measuredValue: 11.94, isOutOfSpec: false, deviationFromNominal: -0.06 }
        ]
      },
      {
        parameterId: 'p-bolt-thread',
        parameterName: 'Thread Pitch & Gauge Fit',
        characteristicType: 'thread_pitch',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Thread Ring Gauge M12x1.75 6g Go / No-Go',
        criticality: 'critical',
        requiredSampleSize: 8,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 6, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 7, measuredValue: null, isVisualPass: true, isOutOfSpec: false },
          { sampleNumber: 8, measuredValue: null, isVisualPass: true, isOutOfSpec: false }
        ]
      },
      {
        parameterId: 'p-bolt-hrc',
        parameterName: 'Core Hardness (Grade 8.8)',
        characteristicType: 'hardness',
        toleranceType: 'two_sided',
        unit: 'HRC',
        nominalValue: 26.0,
        minSpec: 22.0,
        maxSpec: 32.0,
        gaugeOrInstrument: 'Rockwell Hardness Tester Wilson',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'pending',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isOutOfSpec: false }
        ]
      }
    ],
    disposition: {
      disposition: 'pending',
      decidedBy: '',
      decidedByName: '',
      decidedAt: '',
      acceptedQty: 0,
      rejectedQty: 0,
      reworkQty: 0
    }
  },
  {
    id: 'iqc-order-0044',
    orderNumber: 'IQC-2026-0044',
    poNumber: 'PO-2026-004',
    poItemId: 'poi-4',
    grnNumber: 'GRN-2026-0190',
    supplierId: 'sup-skf-04',
    supplierName: 'SKF India Ltd.',
    supplierCode: 'SUP-SKF-04',
    partSku: 'CMP-BRG-6205-2RS',
    partName: 'Deep Groove Radial Ball Bearing 6205 2RS C3 (25x52x15mm)',
    category: 'Mechanical Sub-assemblies',
    receivedQty: 400,
    unit: 'Units',
    sampleSize: 5,
    heatLotNumber: 'SKF-LOT-09228',
    receiptDate: '2026-05-16T11:00:00Z',
    status: 'pending_inspection',
    inspectionPlanId: 'plan-bearing-6205',
    inspectionPlanCode: 'IP-BEARING-6205',
    overallResult: 'pending',
    createdAt: '2026-05-16T11:15:00Z',
    notes: 'Dock arrival. Packaging intact with SKF hologram seal. Awaiting metrology room temperature stabilization.',
    defectPhotos: [],
    parameters: [
      {
        parameterId: 'p-brg-bore',
        parameterName: 'Bore Inner Diameter (ID)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 25.000,
        minSpec: 24.992,
        maxSpec: 25.000,
        gaugeOrInstrument: 'Three-Point Internal Bore Micrometer (0.001mm)',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'pending',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isOutOfSpec: false }
        ]
      },
      {
        parameterId: 'p-brg-od',
        parameterName: 'Outer Diameter (OD)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 52.000,
        minSpec: 51.989,
        maxSpec: 52.000,
        gaugeOrInstrument: 'Mitutoyo Linear Height Gauge & Master Rings',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'pending',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isOutOfSpec: false }
        ]
      },
      {
        parameterId: 'p-brg-spin',
        parameterName: 'Free Rotation & Seal Integrity',
        characteristicType: 'functional',
        toleranceType: 'pass_fail',
        unit: 'Pass/Fail',
        gaugeOrInstrument: 'Manual Spin Test Rig & Stethoscope Probe',
        criticality: 'major',
        requiredSampleSize: 5,
        parameterStatus: 'pending',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 3, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 4, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 5, measuredValue: null, isOutOfSpec: false }
        ]
      }
    ],
    disposition: {
      disposition: 'pending',
      decidedBy: '',
      decidedByName: '',
      decidedAt: '',
      acceptedQty: 0,
      rejectedQty: 0,
      reworkQty: 0
    }
  },
  {
    id: 'iqc-order-0045',
    orderNumber: 'IQC-2026-0045',
    poNumber: 'PO-2026-005',
    poItemId: 'poi-5',
    grnNumber: 'GRN-2026-0192',
    supplierId: 'sup-bharat-05',
    supplierName: 'Bharat Forge Ltd.',
    supplierCode: 'SUP-BHT-05',
    partSku: 'RAW-FORGE-CRANK-B1',
    partName: 'Forged Crankshaft Blank 4-Cylinder Alloy 42CrMo4',
    category: 'Forgings & Castings',
    receivedQty: 80,
    unit: 'Blanks',
    sampleSize: 5,
    heatLotNumber: 'HT-BF-77312',
    receiptDate: '2026-05-17T09:30:00Z',
    inspectorId: 'usr-insp-02',
    inspectorName: 'Vikram Joshi',
    status: 'completed',
    inspectionPlanId: 'plan-steel-en8',
    inspectionPlanCode: 'IP-STEEL-EN8',
    overallResult: 'pass',
    createdAt: '2026-05-17T10:00:00Z',
    completedAt: '2026-05-17T13:10:00Z',
    notes: 'Flashing burrs on split line require internal fettling before CNC machining. Conditional rework granted.',
    defectPhotos: [
      {
        id: 'photo-45-1',
        timestamp: '2026-05-17T10:45:00Z',
        caption: 'Excess forging flash burr along parting line',
        defectCategory: 'burrs_flashing',
        severity: 'minor',
        sampleNumber: 1,
        url: DEFECT_PRESET_IMAGES[3].dataUrl
      }
    ],
    parameters: [
      {
        parameterId: 'p-en8-dia',
        parameterName: 'Main Journal Diameter',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 56.0,
        minSpec: 55.5,
        maxSpec: 56.5,
        gaugeOrInstrument: 'Vernier Caliper 300mm',
        criticality: 'critical',
        requiredSampleSize: 5,
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 56.1,
        samples: [
          { sampleNumber: 1, measuredValue: 56.05, isOutOfSpec: false, deviationFromNominal: 0.05 },
          { sampleNumber: 2, measuredValue: 56.15, isOutOfSpec: false, deviationFromNominal: 0.15 },
          { sampleNumber: 3, measuredValue: 56.00, isOutOfSpec: false, deviationFromNominal: 0.00 },
          { sampleNumber: 4, measuredValue: 56.20, isOutOfSpec: false, deviationFromNominal: 0.20 },
          { sampleNumber: 5, measuredValue: 56.10, isOutOfSpec: false, deviationFromNominal: 0.10 }
        ]
      }
    ],
    disposition: {
      disposition: 'rework',
      decidedBy: 'usr-insp-02',
      decidedByName: 'Vikram Joshi',
      decidedAt: '2026-05-17T13:10:00Z',
      acceptedQty: 0,
      rejectedQty: 0,
      reworkQty: 80,
      reworkInstructions: 'Transfer to Deburring Station #2. Grind off parting line flash (max 0.2mm allowance). Re-verify magnetic particle inspection.',
      targetBinId: 'bin-rework-area',
      targetBinCode: 'BIN-REWORK-STAGE-02',
      digitalSignature: {
        signerName: 'Vikram Joshi (Badge #QC-312)',
        badgeId: 'QC-312',
        role: 'Senior Quality Inspector',
        timestamp: '2026-05-17T13:10:00Z',
        statement: 'CONDITIONAL DISPOSITION: Lot routed for Internal Secondary Rework deburring. Final release pending post-rework inspection.'
      }
    }
  }
];

class IqcService {
  private plans: InspectionPlan[] = [];
  private orders: IqcOrder[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage(): void {
    try {
      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      if (storedPlans) {
        this.plans = JSON.parse(storedPlans);
      } else {
        this.plans = [...INITIAL_INSPECTION_PLANS];
        this.savePlansToStorage();
      }

      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      } else {
        this.orders = [...INITIAL_IQC_ORDERS];
        this.saveOrdersToStorage();
      }
    } catch (e) {
      console.warn('IqcService: Failed to access localStorage, using in-memory fallbacks', e);
      this.plans = [...INITIAL_INSPECTION_PLANS];
      this.orders = [...INITIAL_IQC_ORDERS];
    }
  }

  private savePlansToStorage(): void {
    try {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(this.plans));
    } catch (e) {
      console.error('Failed to save IQC plans to localStorage', e);
    }
  }

  private saveOrdersToStorage(): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
    } catch (e) {
      console.error('Failed to save IQC orders to localStorage', e);
    }
  }

  // Calculate sample size using standard ISO 2859-1 General Inspection Level II normal
  public calculateSampleSize(lotSize: number, samplingStandard: SamplingStandard = 'ISO_2859_1_NORMAL'): number {
    if (samplingStandard === '100_PERCENT') return lotSize;
    if (samplingStandard === 'FIXED_SAMPLES') return 5;

    // ISO 2859-1 Code Letter Mapping for General Level II
    if (lotSize <= 8) return Math.min(lotSize, 2);
    if (lotSize <= 15) return Math.min(lotSize, 3);
    if (lotSize <= 25) return Math.min(lotSize, 5);
    if (lotSize <= 50) return Math.min(lotSize, 8);
    if (lotSize <= 90) return Math.min(lotSize, 13);
    if (lotSize <= 150) return Math.min(lotSize, 20);
    if (lotSize <= 280) return Math.min(lotSize, 32);
    if (lotSize <= 500) return Math.min(lotSize, 50);
    if (lotSize <= 1200) return 80;
    return 125;
  }

  public getPlans(): Promise<InspectionPlan[]> {
    return Promise.resolve([...this.plans]);
  }

  public getPlanById(id: string): Promise<InspectionPlan | undefined> {
    return Promise.resolve(this.plans.find(p => p.id === id));
  }

  public findPlanForPartOrSupplier(partSku: string, supplierId?: string): Promise<InspectionPlan | undefined> {
    // 1st Priority: Exact partSku and supplierId match
    let match = this.plans.find(p => p.status === 'active' && p.partSku === partSku && p.supplierId === supplierId);
    if (!match) {
      // 2nd Priority: Part SKU match
      match = this.plans.find(p => p.status === 'active' && p.partSku === partSku);
    }
    if (!match && supplierId) {
      // 3rd Priority: Supplier match
      match = this.plans.find(p => p.status === 'active' && p.supplierId === supplierId);
    }
    return Promise.resolve(match || this.plans[0]);
  }

  public createPlan(plan: Omit<InspectionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<InspectionPlan> {
    const newPlan: InspectionPlan = {
      ...plan,
      id: `plan-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.plans.unshift(newPlan);
    this.savePlansToStorage();
    return Promise.resolve(newPlan);
  }

  public updatePlan(id: string, updates: Partial<InspectionPlan>): Promise<InspectionPlan> {
    const index = this.plans.findIndex(p => p.id === id);
    if (index === -1) return Promise.reject(new Error('Inspection plan not found'));

    this.plans[index] = {
      ...this.plans[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.savePlansToStorage();
    return Promise.resolve(this.plans[index]);
  }

  public getOrders(filter?: IqcFilterOptions): Promise<IqcOrder[]> {
    let result = [...this.orders];

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        result = result.filter(o => o.status === filter.status);
      }
      if (filter.disposition && filter.disposition !== 'all') {
        result = result.filter(o => o.disposition?.disposition === filter.disposition);
      }
      if (filter.supplierId && filter.supplierId !== 'all') {
        result = result.filter(o => o.supplierId === filter.supplierId);
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        result = result.filter(o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.poNumber.toLowerCase().includes(q) ||
          o.grnNumber.toLowerCase().includes(q) ||
          o.partSku.toLowerCase().includes(q) ||
          o.partName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.heatLotNumber.toLowerCase().includes(q)
        );
      }
      if (filter.dateRange && filter.dateRange !== 'all') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (filter.dateRange === 'today') {
          result = result.filter(o => new Date(o.createdAt).getTime() >= startOfDay);
        } else if (filter.dateRange === 'this_week') {
          const sevenDaysAgo = Date.now() - 7 * 86400000;
          result = result.filter(o => new Date(o.createdAt).getTime() >= sevenDaysAgo);
        } else if (filter.dateRange === 'this_month') {
          const thirtyDaysAgo = Date.now() - 30 * 86400000;
          result = result.filter(o => new Date(o.createdAt).getTime() >= thirtyDaysAgo);
        }
      }
    }

    return Promise.resolve(result);
  }

  public getOrderById(id: string): Promise<IqcOrder | undefined> {
    return Promise.resolve(this.orders.find(o => o.id === id));
  }

  public createOrder(orderData: Omit<IqcOrder, 'id' | 'createdAt'>): Promise<IqcOrder> {
    const newOrder: IqcOrder = {
      ...orderData,
      id: `iqc-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    };
    this.orders.unshift(newOrder);
    this.saveOrdersToStorage();
    return Promise.resolve(newOrder);
  }

  // Auto-generate inspection order on dock receipt / GRN
  public async autoGenerateFromPoReceipt(params: {
    poNumber: string;
    grnNumber?: string;
    supplierId: string;
    supplierName: string;
    partSku: string;
    partName: string;
    category?: string;
    receivedQty: number;
    unit?: string;
    heatLotNumber: string;
    mtrNumber?: string;
    inspectorName?: string;
  }): Promise<IqcOrder> {
    const count = this.orders.length + 46;
    const orderNumber = `IQC-2026-00${count}`;
    const grnNumber = params.grnNumber || `GRN-2026-0${190 + count}`;

    // Find best matching inspection plan
    const plan = await this.findPlanForPartOrSupplier(params.partSku, params.supplierId);
    const planId = plan ? plan.id : 'plan-steel-en8';
    const planCode = plan ? plan.planCode : 'IP-GENERIC-01';

    // Calculate sample size: practical default 5 or ISO 2859
    const sampleSize = plan ? Math.min(plan.parameters[0]?.defaultSampleSize || 5, params.receivedQty) : 5;

    // Build parameter evaluation matrix
    const parameters = (plan?.parameters || []).map(p => {
      const paramSampleSize = Math.min(p.defaultSampleSize || sampleSize, params.receivedQty);
      const samples: SampleMeasurement[] = Array.from({ length: paramSampleSize }, (_, i) => ({
        sampleNumber: i + 1,
        measuredValue: null,
        isVisualPass: p.toleranceType === 'pass_fail' ? undefined : undefined,
        isOutOfSpec: false
      }));

      return {
        parameterId: p.id,
        parameterName: p.parameterName,
        characteristicType: p.characteristicType,
        toleranceType: p.toleranceType,
        unit: p.unit,
        nominalValue: p.nominalValue,
        minSpec: p.lowerTolerance,
        maxSpec: p.upperTolerance,
        gaugeOrInstrument: p.gaugeOrInstrument,
        criticality: p.criticality,
        requiredSampleSize: paramSampleSize,
        samples,
        parameterStatus: 'pending' as const,
        outOfSpecCount: 0
      };
    });

    const newOrder: IqcOrder = {
      id: `iqc-${Date.now().toString(36)}`,
      orderNumber,
      poNumber: params.poNumber,
      grnNumber,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      partSku: params.partSku,
      partName: params.partName,
      category: params.category || 'Raw Materials',
      receivedQty: params.receivedQty,
      unit: params.unit || 'Kg',
      sampleSize,
      heatLotNumber: params.heatLotNumber || `HT-${Math.floor(10000 + Math.random() * 90000)}`,
      mtrNumber: params.mtrNumber,
      receiptDate: new Date().toISOString(),
      inspectorName: params.inspectorName || 'Anita Desai',
      status: 'pending_inspection',
      inspectionPlanId: planId,
      inspectionPlanCode: planCode,
      parameters,
      overallResult: 'pending',
      defectPhotos: [],
      disposition: {
        disposition: 'pending',
        decidedBy: '',
        decidedByName: '',
        decidedAt: '',
        acceptedQty: 0,
        rejectedQty: 0,
        reworkQty: 0
      },
      createdAt: new Date().toISOString()
    };

    this.orders.unshift(newOrder);
    this.saveOrdersToStorage();
    return newOrder;
  }

  // Save measurement entries for a specific parameter with dynamic statistical calculations (Mean, Range, StdDev, Cpk)
  public saveMeasurements(
    orderId: string,
    parameterId: string,
    samples: SampleMeasurement[]
  ): Promise<IqcOrder> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return Promise.reject(new Error('IQC Order not found'));

    const order = { ...this.orders[orderIndex] };
    const paramIndex = order.parameters.findIndex(p => p.parameterId === parameterId);
    if (paramIndex === -1) return Promise.reject(new Error('Parameter not found in order'));

    const param = { ...order.parameters[paramIndex] };

    // Validate out of spec for each sample
    const evaluatedSamples = samples.map(s => {
      let isOutOfSpec = false;
      let deviation: number | undefined;

      if (param.toleranceType === 'pass_fail') {
        isOutOfSpec = s.isVisualPass === false;
      } else if (s.measuredValue !== null && s.measuredValue !== undefined) {
        if (param.minSpec !== undefined && s.measuredValue < param.minSpec) {
          isOutOfSpec = true;
        }
        if (param.maxSpec !== undefined && s.measuredValue > param.maxSpec) {
          isOutOfSpec = true;
        }
        if (param.nominalValue !== undefined) {
          deviation = Number((s.measuredValue - param.nominalValue).toFixed(4));
        }
      }

      return {
        ...s,
        isOutOfSpec,
        deviationFromNominal: deviation
      };
    });

    param.samples = evaluatedSamples;
    const numericValues = evaluatedSamples
      .map(s => s.measuredValue)
      .filter((v): v is number => v !== null && v !== undefined);

    param.outOfSpecCount = evaluatedSamples.filter(s => s.isOutOfSpec).length;

    if (param.toleranceType === 'pass_fail') {
      const answered = evaluatedSamples.filter(s => s.isVisualPass !== undefined);
      if (answered.length < evaluatedSamples.length) {
        param.parameterStatus = 'pending';
      } else {
        param.parameterStatus = param.outOfSpecCount === 0 ? 'pass' : 'fail';
      }
    } else {
      if (numericValues.length < evaluatedSamples.length) {
        param.parameterStatus = 'pending';
      } else {
        param.parameterStatus = param.outOfSpecCount === 0 ? 'pass' : 'fail';

        // Compute Mean, Range, StdDev, Cpk
        const sum = numericValues.reduce((acc, v) => acc + v, 0);
        const mean = sum / numericValues.length;
        const minVal = Math.min(...numericValues);
        const maxVal = Math.max(...numericValues);
        const range = maxVal - minVal;

        // Variance & StdDev
        const variance = numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, numericValues.length - 1);
        const stdDev = Math.sqrt(variance);

        param.meanValue = Number(mean.toFixed(3));
        param.rangeValue = Number(range.toFixed(3));
        param.stdDev = Number(stdDev.toFixed(4));

        if (stdDev > 0 && param.minSpec !== undefined && param.maxSpec !== undefined) {
          const cpu = (param.maxSpec - mean) / (3 * stdDev);
          const cpl = (mean - param.minSpec) / (3 * stdDev);
          param.cpk = Number(Math.min(cpu, cpl).toFixed(2));
        }
      }
    }

    order.parameters[paramIndex] = param;

    // Check if order should move to in_progress or update overallResult
    const anyIncomplete = order.parameters.some(p => p.parameterStatus === 'pending');
    const anyFail = order.parameters.some(p => p.parameterStatus === 'fail');

    if (order.status === 'pending_inspection') {
      order.status = 'in_progress';
    }

    if (anyIncomplete) {
      order.overallResult = anyFail ? 'fail' : 'pending';
    } else {
      order.overallResult = anyFail ? 'fail' : 'pass';
    }

    this.orders[orderIndex] = order;
    this.saveOrdersToStorage();
    return Promise.resolve(order);
  }

  // Add Defect Photo (with base64 / preset image / uploaded photo)
  public addDefectPhoto(
    orderId: string,
    photoData: Omit<DefectPhoto, 'id' | 'timestamp'>
  ): Promise<IqcOrder> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return Promise.reject(new Error('IQC Order not found'));

    const order = { ...this.orders[orderIndex] };
    const newPhoto: DefectPhoto = {
      ...photoData,
      id: `photo-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString()
    };

    order.defectPhotos = [...(order.defectPhotos || []), newPhoto];
    this.orders[orderIndex] = order;
    this.saveOrdersToStorage();
    return Promise.resolve(order);
  }

  // Remove Defect Photo
  public deleteDefectPhoto(orderId: string, photoId: string): Promise<IqcOrder> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return Promise.reject(new Error('IQC Order not found'));

    const order = { ...this.orders[orderIndex] };
    order.defectPhotos = order.defectPhotos.filter(p => p.id !== photoId);
    this.orders[orderIndex] = order;
    this.saveOrdersToStorage();
    return Promise.resolve(order);
  }

  // Complete formal disposition (Accept / Reject / Rework / MRB)
  public applyDisposition(
    orderId: string,
    dispositionData: IqcDispositionDetails
  ): Promise<IqcOrder> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return Promise.reject(new Error('IQC Order not found'));

    const order = { ...this.orders[orderIndex] };
    order.disposition = dispositionData;
    order.completedAt = new Date().toISOString();

    if (dispositionData.disposition === 'rejected') {
      order.status = 'quarantined';
    } else {
      order.status = 'completed';
    }

    this.orders[orderIndex] = order;
    this.saveOrdersToStorage();
    return Promise.resolve(order);
  }

  // Calculate live IQC KPIs for dashboard
  public calculateKpis(): IqcKpis {
    const totalOrders = this.orders.length;
    const pendingInspection = this.orders.filter(o => o.status === 'pending_inspection').length;
    const inProgress = this.orders.filter(o => o.status === 'in_progress').length;
    const dispositionedLots = this.orders.filter(o => o.disposition?.disposition !== 'pending').length;

    const acceptedLots = this.orders.filter(o => o.disposition?.disposition === 'accepted').length;
    const rejectedLots = this.orders.filter(o => o.disposition?.disposition === 'rejected').length;
    const reworkLots = this.orders.filter(o => o.disposition?.disposition === 'rework').length;

    const evaluatedLots = acceptedLots + rejectedLots + reworkLots;
    const acceptanceRatePct = evaluatedLots > 0 ? Number(((acceptedLots / evaluatedLots) * 100).toFixed(1)) : 100.0;

    return {
      totalOrders,
      pendingInspection,
      inProgress,
      dispositionedLots,
      acceptedLots,
      rejectedLots,
      reworkLots,
      acceptanceRatePct,
      avgInspectionMinutes: 34,
      activePlansCount: this.plans.filter(p => p.status === 'active').length,
      quarantinedRtvCount: rejectedLots
    };
  }

  // Export IQC Orders as CSV for compliance audit
  public exportCsv(filter?: IqcFilterOptions): string {
    const orders = this.orders;
    const headers = [
      'IQC Order #',
      'PO Number',
      'GRN Number',
      'Receipt Date',
      'Supplier',
      'Part SKU',
      'Part Description',
      'Received Qty',
      'Sample Size',
      'Heat/Lot #',
      'MTR #',
      'Status',
      'Overall Result',
      'Disposition',
      'Accepted Qty',
      'Rejected Qty',
      'Rework Qty',
      'Inspector',
      'Quarantine Reason / RTV Doc',
      'Completed Timestamp'
    ];

    const rows = orders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.poNumber}"`,
      `"${o.grnNumber}"`,
      `"${o.receiptDate ? o.receiptDate.split('T')[0] : ''}"`,
      `"${o.supplierName.replace(/"/g, '""')}"`,
      `"${o.partSku}"`,
      `"${o.partName.replace(/"/g, '""')}"`,
      o.receivedQty,
      o.sampleSize,
      `"${o.heatLotNumber}"`,
      `"${o.mtrNumber || ''}"`,
      `"${o.status}"`,
      `"${o.overallResult}"`,
      `"${o.disposition?.disposition || 'pending'}"`,
      o.disposition?.acceptedQty ?? 0,
      o.disposition?.rejectedQty ?? 0,
      o.disposition?.reworkQty ?? 0,
      `"${o.disposition?.decidedByName || o.inspectorName || ''}"`,
      `"${(o.disposition?.quarantineReason || o.disposition?.rtvDocNumber || '').replace(/"/g, '""')}"`,
      `"${o.completedAt || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const iqcService = new IqcService();
