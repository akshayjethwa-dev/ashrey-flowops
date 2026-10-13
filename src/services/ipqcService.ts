// src/services/ipqcService.ts

import {
  QualityControlPointConfig,
  IpqcTask,
  IpqcFilterOptions,
  IpqcKpis,
  Part3DMarker,
  IpqcPartPhoto,
  IpqcTaskSampleReading,
  QcpTriggerType
} from '../types/ipqc';

const QCP_STORAGE_KEY = 'mes_ipqc_qcp_configs_v1';
const TASKS_STORAGE_KEY = 'mes_ipqc_tasks_v1';

// Preset realistic SVG 3D part photos and micro-defect captures
export const IPQC_DEFECT_PHOTOS = [
  {
    id: 'photo-chatter',
    caption: 'Tool chatter vibration ripple on internal bore wall',
    defectType: 'tool_chatter' as const,
    severity: 'major' as const,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><path d="M 50 150 C 70 140, 90 160, 110 150 S 150 140, 170 150 S 210 140, 230 150 S 270 140, 290 150 S 330 140, 350 150" stroke="%23f43f5e" stroke-width="5" fill="none"/><line x1="50" y1="130" x2="350" y2="130" stroke="%2338bdf8" stroke-dasharray="4,4"/><text x="40" y="50" fill="%23fda4af" font-family="monospace" font-size="12" font-weight="bold">TOOL VIBRATION CHATTER (Ra 3.2 µm)</text><text x="40" y="70" fill="%2394a3b8" font-family="sans-serif" font-size="10">SPINDLE RESONANCE AT 1800 RPM</text></svg>`
  },
  {
    id: 'photo-overcut',
    caption: 'Keyway slot depth micrometer reading 0.08mm over maximum allowance',
    defectType: 'dimensional_overcut' as const,
    severity: 'critical' as const,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e293b"/><rect x="80" y="80" width="240" height="140" fill="%23334155" stroke="%23ef4444" stroke-width="3"/><path d="M 160 80 L 160 160 L 240 160 L 240 80" fill="%230f172a" stroke="%23ef4444" stroke-width="2"/><text x="110" y="250" fill="%23fca5a5" font-family="monospace" font-size="12" font-weight="bold">KEYWAY OVERCUT: 12.08 mm</text><text x="110" y="270" fill="%2394a3b8" font-family="sans-serif" font-size="10">MAX SPEC LIMIT: 12.03 mm</text></svg>`
  },
  {
    id: 'photo-burr',
    caption: 'Interlocking parting burr along shoulder chamfer',
    defectType: 'surface_burr' as const,
    severity: 'minor' as const,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23182234"/><circle cx="200" cy="150" r="80" fill="%23334155" stroke="%2364748b" stroke-width="4"/><polygon points="275,145 295,148 280,155" fill="%23f59e0b"/><circle cx="285" cy="150" r="16" stroke="%23f59e0b" stroke-width="2" fill="none" stroke-dasharray="3,3"/><text x="40" y="50" fill="%23fde68a" font-family="monospace" font-size="12">CHAMFER BURR (0.15mm)</text></svg>`
  },
  {
    id: 'photo-good',
    caption: 'Mirror ground finish complying with Ra 0.4 µm specification',
    defectType: 'acceptable_finish' as const,
    severity: 'minor' as const,
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="40" y="40" width="320" height="220" fill="%231e293b" stroke="%2310b981" stroke-width="3" rx="8"/><line x1="60" y1="150" x2="340" y2="150" stroke="%2310b981" stroke-width="2"/><text x="80" y="140" fill="%236ee7b7" font-family="monospace" font-size="14" font-weight="bold">SURFACE Ra: 0.38 µm (PASS)</text><text x="80" y="180" fill="%2394a3b8" font-family="sans-serif" font-size="10">PROFILOMETER TRACE: TOLERANCE VERIFIED</text></svg>`
  }
];

const INITIAL_QCP_CONFIGS: QualityControlPointConfig[] = [
  {
    id: 'qcp-flg-turning',
    operationCode: 'OP-CNC-02',
    operationName: 'CNC Turning & Finish Facing',
    sequenceNumber: 20,
    routingNumber: 'RT-FLG-750-01',
    partNumber: 'PART-FLG-750',
    partName: 'Precision Stainless Valve Flange Dia 180mm',
    triggerType: 'first_piece',
    gateType: 'mandatory_hold',
    mandatoryHoldPoint: true,
    partModelType: 'flange_valve',
    instructions: 'Perform 100% First Piece Inspection (FAI). Verify bore ID, flange thickness, and O-ring seal Ra before releasing machine for batch cycle.',
    mandatorySignOffRole: 'quality_inspector',
    isActive: true,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-05-10T12:00:00Z',
    markers: [
      {
        id: 'm-flg-1',
        label: 'Pt 1: Outer Flange Dia',
        x: 82,
        y: 48,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'External flange diameter turned on Chuck 1',
        nominalValue: 180.00,
        toleranceMin: 179.95,
        toleranceMax: 180.05,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 180.01
      },
      {
        id: 'm-flg-2',
        label: 'Pt 2: Internal Bore ID',
        x: 50,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Precision H7 internal guide bore',
        nominalValue: 75.000,
        toleranceMin: 75.000,
        toleranceMax: 75.025,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 75.012
      },
      {
        id: 'm-flg-3',
        label: 'Pt 3: O-Ring Face Ra',
        x: 62,
        y: 35,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Gasket seal face roughness finish',
        nominalValue: 0.6,
        toleranceMin: 0.1,
        toleranceMax: 0.8,
        unit: 'µm',
        status: 'in_spec',
        measuredValue: 0.45
      },
      {
        id: 'm-flg-4',
        label: 'Pt 4: Flange Thickness',
        x: 22,
        y: 65,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Overall flange web thickness',
        nominalValue: 22.50,
        toleranceMin: 22.40,
        toleranceMax: 22.60,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 22.48
      }
    ],
    parameters: [
      {
        id: 'qp-flg-bore',
        parameterName: 'Internal Guide Bore Diameter (H7)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 75.000,
        lowerTolerance: 75.000,
        upperTolerance: 75.025,
        gaugeOrInstrument: 'Mitutoyo 3-Point Bore Micrometer 70-85mm #CAL-BM-04',
        criticality: 'critical',
        sampleFrequency: '1st Pc + 1 every 10 pcs',
        requiredSamples: 3,
        markerId: 'm-flg-2'
      },
      {
        id: 'qp-flg-od',
        parameterName: 'Flange Outer Diameter (OD)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 180.00,
        lowerTolerance: 179.95,
        upperTolerance: 180.05,
        gaugeOrInstrument: 'Mitutoyo Digital Outside Micrometer 175-200mm #CAL-MIC-019',
        criticality: 'major',
        sampleFrequency: '1st Pc + 1 every 20 pcs',
        requiredSamples: 3,
        markerId: 'm-flg-1'
      },
      {
        id: 'qp-flg-ra',
        parameterName: 'O-Ring Seal Face Roughness (Ra)',
        characteristicType: 'surface_roughness',
        toleranceType: 'two_sided',
        unit: 'µm',
        nominalValue: 0.6,
        lowerTolerance: 0.1,
        upperTolerance: 0.8,
        gaugeOrInstrument: 'Mitutoyo Surftest SJ-210 Surface Profilometer #CAL-RA-02',
        criticality: 'critical',
        sampleFrequency: '1st Pc FAI Mandatory',
        requiredSamples: 3,
        markerId: 'm-flg-3'
      },
      {
        id: 'qp-flg-thk',
        parameterName: 'Flange Flange Web Thickness',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 22.50,
        lowerTolerance: 22.40,
        upperTolerance: 22.60,
        gaugeOrInstrument: 'Vernier Caliper 150mm #CAL-VC-008',
        criticality: 'minor',
        sampleFrequency: '1st Pc + 1 every 25 pcs',
        requiredSamples: 3,
        markerId: 'm-flg-4'
      }
    ]
  },
  {
    id: 'qcp-sft-milling',
    operationCode: 'OP-MIL-03',
    operationName: 'Keyway Milling & Journal Grinding',
    sequenceNumber: 30,
    routingNumber: 'RT-SFT-420-01',
    partNumber: 'PART-SFT-420',
    partName: 'Precision Gearbox Main Drive Shaft 420mm',
    triggerType: 'first_piece',
    gateType: 'mandatory_hold',
    mandatoryHoldPoint: true,
    partModelType: 'gear_shaft',
    instructions: 'Inspect keyway parallel width, depth to center axis, and total radial runout before deburring.',
    mandatorySignOffRole: 'quality_inspector',
    isActive: true,
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-04-18T10:30:00Z',
    markers: [
      {
        id: 'm-sft-1',
        label: 'Pt 1: Keyway Slot Width',
        x: 45,
        y: 42,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'DIN 6885 drive keyway slot width',
        nominalValue: 12.00,
        toleranceMin: 12.00,
        toleranceMax: 12.03,
        unit: 'mm',
        status: 'out_of_spec',
        measuredValue: 11.96
      },
      {
        id: 'm-sft-2',
        label: 'Pt 2: Journal Runout',
        x: 75,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Total radial circular runout on V-blocks',
        nominalValue: 0.005,
        toleranceMin: 0.000,
        toleranceMax: 0.012,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 0.008
      },
      {
        id: 'm-sft-3',
        label: 'Pt 3: Overall Shaft Length',
        x: 15,
        y: 52,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Overall turned length between centers',
        nominalValue: 420.0,
        toleranceMin: 419.8,
        toleranceMax: 420.2,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 420.05
      }
    ],
    parameters: [
      {
        id: 'qp-sft-key',
        parameterName: 'Drive Keyway Slot Width',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 12.00,
        lowerTolerance: 12.00,
        upperTolerance: 12.03,
        gaugeOrInstrument: 'Keyway Gauge Block Set 12mm #CAL-GB-01',
        criticality: 'critical',
        sampleFrequency: '100% First Piece',
        requiredSamples: 3,
        markerId: 'm-sft-1'
      },
      {
        id: 'qp-sft-runout',
        parameterName: 'Radial Runout on Bearing Seat',
        characteristicType: 'runout',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 0.005,
        lowerTolerance: 0.000,
        upperTolerance: 0.012,
        gaugeOrInstrument: 'Mitutoyo Dial Test Indicator (0.001mm) on Bench Centers',
        criticality: 'critical',
        sampleFrequency: '1st Pc + 1 every 15 pcs',
        requiredSamples: 3,
        markerId: 'm-sft-2'
      }
    ]
  }
];

const INITIAL_IPQC_TASKS: IpqcTask[] = [
  {
    id: 'task-0081',
    taskNumber: 'IPQC-2026-0081',
    workOrderId: 'wo-2026-001',
    workOrderNumber: 'WO-2026-001',
    partNumber: 'PART-FLG-750',
    partName: 'Precision Stainless Valve Flange Dia 180mm',
    operationSequence: 20,
    operationCode: 'OP-CNC-02',
    operationName: 'CNC Turning & Finish Facing',
    workCenterId: 'wc-cnc-01',
    workCenterName: 'Mazak Quick Turn 250MSY Turning Center',
    machineCode: 'CNC-04',
    qcpId: 'qcp-flg-turning',
    triggerType: 'first_piece',
    gateType: 'mandatory_hold',
    status: 'passed',
    overallResult: 'pass',
    partModelType: 'flange_valve',
    inspectorId: 'usr-insp-01',
    inspectorName: 'Anita Desai',
    badgeId: 'QC-408',
    notes: 'All 4 inspection points within tight ISO tolerance. FAI approved for full production run.',
    signOffStatement: 'FIRST PIECE APPROVED: Machine setup verified. Tolerance capability confirmed. Release to operator for continuous batch production.',
    createdAt: '2026-05-18T07:30:00Z',
    completedAt: '2026-05-18T08:15:00Z',
    photos: [
      {
        id: 'p-81-1',
        timestamp: '2026-05-18T08:05:00Z',
        url: IPQC_DEFECT_PHOTOS[3].url,
        caption: 'Surface profilometer reading Ra 0.38 µm on O-Ring gasket seal face',
        markerId: 'm-flg-3',
        markerLabel: 'Pt 3: O-Ring Face Ra',
        defectType: 'acceptable_finish',
        severity: 'minor'
      }
    ],
    markers: [
      {
        id: 'm-flg-1',
        label: 'Pt 1: Outer Flange Dia',
        x: 82,
        y: 48,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'External flange diameter turned on Chuck 1',
        nominalValue: 180.00,
        toleranceMin: 179.95,
        toleranceMax: 180.05,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 180.01
      },
      {
        id: 'm-flg-2',
        label: 'Pt 2: Internal Bore ID',
        x: 50,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Precision H7 internal guide bore',
        nominalValue: 75.000,
        toleranceMin: 75.000,
        toleranceMax: 75.025,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 75.012
      },
      {
        id: 'm-flg-3',
        label: 'Pt 3: O-Ring Face Ra',
        x: 62,
        y: 35,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Gasket seal face roughness finish',
        nominalValue: 0.6,
        toleranceMin: 0.1,
        toleranceMax: 0.8,
        unit: 'µm',
        status: 'in_spec',
        measuredValue: 0.45
      },
      {
        id: 'm-flg-4',
        label: 'Pt 4: Flange Thickness',
        x: 22,
        y: 65,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'Overall flange web thickness',
        nominalValue: 22.50,
        toleranceMin: 22.40,
        toleranceMax: 22.60,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 22.48
      }
    ],
    parameters: [
      {
        parameterId: 'qp-flg-bore',
        parameterName: 'Internal Guide Bore Diameter (H7)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 75.000,
        minSpec: 75.000,
        maxSpec: 75.025,
        gaugeOrInstrument: 'Mitutoyo 3-Point Bore Micrometer 70-85mm',
        criticality: 'critical',
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 75.012,
        rangeValue: 0.006,
        cpk: 1.48,
        samples: [
          { sampleNumber: 1, measuredValue: 75.010, isOutOfSpec: false, deviation: 0.010 },
          { sampleNumber: 2, measuredValue: 75.014, isOutOfSpec: false, deviation: 0.014 },
          { sampleNumber: 3, measuredValue: 75.012, isOutOfSpec: false, deviation: 0.012 }
        ]
      },
      {
        parameterId: 'qp-flg-od',
        parameterName: 'Flange Outer Diameter (OD)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 180.00,
        minSpec: 179.95,
        maxSpec: 180.05,
        gaugeOrInstrument: 'Digital Outside Micrometer 175-200mm',
        criticality: 'major',
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 180.01,
        samples: [
          { sampleNumber: 1, measuredValue: 180.01, isOutOfSpec: false, deviation: 0.01 },
          { sampleNumber: 2, measuredValue: 180.02, isOutOfSpec: false, deviation: 0.02 },
          { sampleNumber: 3, measuredValue: 180.00, isOutOfSpec: false, deviation: 0.00 }
        ]
      },
      {
        parameterId: 'qp-flg-ra',
        parameterName: 'O-Ring Seal Face Roughness (Ra)',
        characteristicType: 'surface_roughness',
        toleranceType: 'two_sided',
        unit: 'µm',
        nominalValue: 0.6,
        minSpec: 0.1,
        maxSpec: 0.8,
        gaugeOrInstrument: 'Mitutoyo Surftest SJ-210 Surface Profilometer',
        criticality: 'critical',
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 0.45,
        samples: [
          { sampleNumber: 1, measuredValue: 0.42, isOutOfSpec: false, deviation: -0.18 },
          { sampleNumber: 2, measuredValue: 0.48, isOutOfSpec: false, deviation: -0.12 },
          { sampleNumber: 3, measuredValue: 0.45, isOutOfSpec: false, deviation: -0.15 }
        ]
      }
    ]
  },
  {
    id: 'task-0082',
    taskNumber: 'IPQC-2026-0082',
    workOrderId: 'wo-2026-002',
    workOrderNumber: 'WO-2026-002',
    partNumber: 'PART-SFT-420',
    partName: 'Precision Gearbox Main Drive Shaft 420mm',
    operationSequence: 30,
    operationCode: 'OP-MIL-03',
    operationName: 'Keyway Milling & Journal Grinding',
    workCenterId: 'wc-cnc-02',
    workCenterName: 'Haas VF-4 4-Axis Vertical Machining Center',
    machineCode: 'VMC-02',
    qcpId: 'qcp-sft-milling',
    triggerType: 'first_piece',
    gateType: 'mandatory_hold',
    status: 'hold',
    overallResult: 'hold',
    partModelType: 'gear_shaft',
    inspectorId: 'usr-insp-02',
    inspectorName: 'Vikram Joshi',
    badgeId: 'QC-312',
    notes: 'FIRST PIECE NON-CONFORMANCE: Endmill cutter undersize detected. Keyway width measured 11.96mm vs minimum 12.00mm. Machine locked.',
    holdReason: 'OPERATION HOLD: Endmill worn or tool offset incorrect (-0.04mm). Key will not fit. Adjust tool radius compensation D04 and re-cut first article piece.',
    signOffStatement: 'PRODUCTION STOP ISSUED: Machine held. Corrective tool offset required prior to unlocking sequence.',
    createdAt: '2026-05-18T09:15:00Z',
    photos: [
      {
        id: 'p-82-1',
        timestamp: '2026-05-18T09:30:00Z',
        url: IPQC_DEFECT_PHOTOS[1].url,
        caption: 'Keyway slot gauge test showing tight interference (-0.04mm below 12.00mm nominal)',
        markerId: 'm-sft-1',
        markerLabel: 'Pt 1: Keyway Slot Width',
        defectType: 'dimensional_undercut',
        severity: 'critical'
      }
    ],
    markers: [
      {
        id: 'm-sft-1',
        label: 'Pt 1: Keyway Slot Width',
        x: 45,
        y: 42,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'DIN 6885 drive keyway slot width',
        nominalValue: 12.00,
        toleranceMin: 12.00,
        toleranceMax: 12.03,
        unit: 'mm',
        status: 'out_of_spec',
        measuredValue: 11.96
      },
      {
        id: 'm-sft-2',
        label: 'Pt 2: Journal Runout',
        x: 75,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Total radial circular runout on V-blocks',
        nominalValue: 0.005,
        toleranceMin: 0.000,
        toleranceMax: 0.012,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 0.008
      }
    ],
    parameters: [
      {
        parameterId: 'qp-sft-key',
        parameterName: 'Drive Keyway Slot Width',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 12.00,
        minSpec: 12.00,
        maxSpec: 12.03,
        gaugeOrInstrument: 'Keyway Gauge Block Set 12mm',
        criticality: 'critical',
        parameterStatus: 'fail',
        outOfSpecCount: 3,
        meanValue: 11.96,
        samples: [
          { sampleNumber: 1, measuredValue: 11.96, isOutOfSpec: true, deviation: -0.04, remarks: 'FAIL: Under minimum' },
          { sampleNumber: 2, measuredValue: 11.95, isOutOfSpec: true, deviation: -0.05, remarks: 'FAIL: Under minimum' },
          { sampleNumber: 3, measuredValue: 11.97, isOutOfSpec: true, deviation: -0.03, remarks: 'FAIL: Under minimum' }
        ]
      },
      {
        parameterId: 'qp-sft-runout',
        parameterName: 'Radial Runout on Bearing Seat',
        characteristicType: 'runout',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 0.005,
        minSpec: 0.000,
        maxSpec: 0.012,
        gaugeOrInstrument: 'Mitutoyo Dial Test Indicator on Bench Centers',
        criticality: 'critical',
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 0.008,
        samples: [
          { sampleNumber: 1, measuredValue: 0.008, isOutOfSpec: false, deviation: 0.003 },
          { sampleNumber: 2, measuredValue: 0.007, isOutOfSpec: false, deviation: 0.002 },
          { sampleNumber: 3, measuredValue: 0.009, isOutOfSpec: false, deviation: 0.004 }
        ]
      }
    ]
  },
  {
    id: 'task-0083',
    taskNumber: 'IPQC-2026-0083',
    workOrderId: 'wo-2026-003',
    workOrderNumber: 'WO-2026-003',
    partNumber: 'PART-FLG-750',
    partName: 'Precision Stainless Valve Flange Dia 180mm',
    operationSequence: 20,
    operationCode: 'OP-CNC-02',
    operationName: 'CNC Turning & Finish Facing',
    workCenterId: 'wc-cnc-01',
    workCenterName: 'Mazak Quick Turn 250MSY Turning Center',
    machineCode: 'CNC-04',
    qcpId: 'qcp-flg-turning',
    triggerType: 'periodic_interval',
    gateType: 'sampling_audit',
    status: 'in_progress',
    overallResult: 'pending',
    partModelType: 'flange_valve',
    inspectorId: 'usr-insp-01',
    inspectorName: 'Anita Desai',
    notes: 'Hourly 15-piece interval quality patrol.',
    createdAt: '2026-05-18T10:00:00Z',
    photos: [],
    markers: [
      {
        id: 'm-flg-1',
        label: 'Pt 1: Outer Flange Dia',
        x: 82,
        y: 48,
        z: 1,
        viewPerspective: 'isometric',
        featureDescription: 'External flange diameter turned on Chuck 1',
        nominalValue: 180.00,
        toleranceMin: 179.95,
        toleranceMax: 180.05,
        unit: 'mm',
        status: 'in_spec',
        measuredValue: 180.02
      },
      {
        id: 'm-flg-2',
        label: 'Pt 2: Internal Bore ID',
        x: 50,
        y: 50,
        z: 2,
        viewPerspective: 'isometric',
        featureDescription: 'Precision H7 internal guide bore',
        nominalValue: 75.000,
        toleranceMin: 75.000,
        toleranceMax: 75.025,
        unit: 'mm',
        status: 'pending',
        measuredValue: null
      }
    ],
    parameters: [
      {
        parameterId: 'qp-flg-od',
        parameterName: 'Flange Outer Diameter (OD)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 180.00,
        minSpec: 179.95,
        maxSpec: 180.05,
        gaugeOrInstrument: 'Digital Outside Micrometer 175-200mm',
        criticality: 'major',
        parameterStatus: 'pass',
        outOfSpecCount: 0,
        meanValue: 180.02,
        samples: [
          { sampleNumber: 1, measuredValue: 180.02, isOutOfSpec: false, deviation: 0.02 },
          { sampleNumber: 2, measuredValue: 180.03, isOutOfSpec: false, deviation: 0.03 }
        ]
      },
      {
        parameterId: 'qp-flg-bore',
        parameterName: 'Internal Guide Bore Diameter (H7)',
        characteristicType: 'dimensional',
        toleranceType: 'two_sided',
        unit: 'mm',
        nominalValue: 75.000,
        minSpec: 75.000,
        maxSpec: 75.025,
        gaugeOrInstrument: 'Mitutoyo 3-Point Bore Micrometer',
        criticality: 'critical',
        parameterStatus: 'pending',
        outOfSpecCount: 0,
        samples: [
          { sampleNumber: 1, measuredValue: null, isOutOfSpec: false },
          { sampleNumber: 2, measuredValue: null, isOutOfSpec: false }
        ]
      }
    ]
  }
];

class IpqcService {
  private configs: QualityControlPointConfig[] = [];
  private tasks: IpqcTask[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage(): void {
    try {
      const storedConfigs = localStorage.getItem(QCP_STORAGE_KEY);
      if (storedConfigs) {
        this.configs = JSON.parse(storedConfigs);
      } else {
        this.configs = [...INITIAL_QCP_CONFIGS];
        this.saveConfigs();
      }

      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks);
      } else {
        this.tasks = [...INITIAL_IPQC_TASKS];
        this.saveTasks();
      }
    } catch (e) {
      console.warn('IpqcService: LocalStorage fallback', e);
      this.configs = [...INITIAL_QCP_CONFIGS];
      this.tasks = [...INITIAL_IPQC_TASKS];
    }
  }

  private saveConfigs(): void {
    try {
      localStorage.setItem(QCP_STORAGE_KEY, JSON.stringify(this.configs));
    } catch (e) {
      console.error(e);
    }
  }

  private saveTasks(): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error(e);
    }
  }

  public getConfigs(): Promise<QualityControlPointConfig[]> {
    return Promise.resolve([...this.configs]);
  }

  public getConfigById(id: string): Promise<QualityControlPointConfig | undefined> {
    return Promise.resolve(this.configs.find(c => c.id === id));
  }

  public saveConfig(configData: Omit<QualityControlPointConfig, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<QualityControlPointConfig> {
    const isEdit = Boolean(configData.id && this.configs.some(c => c.id === configData.id));

    if (isEdit && configData.id) {
      const idx = this.configs.findIndex(c => c.id === configData.id);
      const updated: QualityControlPointConfig = {
        ...this.configs[idx],
        ...configData,
        id: configData.id,
        updatedAt: new Date().toISOString()
      };
      this.configs[idx] = updated;
      this.saveConfigs();
      return Promise.resolve(updated);
    } else {
      const created: QualityControlPointConfig = {
        ...configData,
        id: `qcp-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.configs.unshift(created);
      this.saveConfigs();
      return Promise.resolve(created);
    }
  }

  public getTasks(filter?: IpqcFilterOptions): Promise<IpqcTask[]> {
    let result = [...this.tasks];

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        result = result.filter(t => t.status === filter.status);
      }
      if (filter.triggerType && filter.triggerType !== 'all') {
        result = result.filter(t => t.triggerType === filter.triggerType);
      }
      if (filter.workOrderNumber && filter.workOrderNumber.trim()) {
        const wo = filter.workOrderNumber.toLowerCase();
        result = result.filter(t => t.workOrderNumber.toLowerCase().includes(wo));
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        result = result.filter(t =>
          t.taskNumber.toLowerCase().includes(q) ||
          t.workOrderNumber.toLowerCase().includes(q) ||
          t.partName.toLowerCase().includes(q) ||
          t.partNumber.toLowerCase().includes(q) ||
          t.operationName.toLowerCase().includes(q) ||
          t.machineCode.toLowerCase().includes(q) ||
          t.workCenterName.toLowerCase().includes(q)
        );
      }
    }

    return Promise.resolve(result);
  }

  public getTaskById(id: string): Promise<IpqcTask | undefined> {
    return Promise.resolve(this.tasks.find(t => t.id === id));
  }

  // Auto-generate IPQC inspection task triggered by routing operation
  public autoGenerateTask(params: {
    workOrderId: string;
    workOrderNumber: string;
    partNumber: string;
    partName: string;
    operationSequence: number;
    operationCode: string;
    operationName: string;
    workCenterId: string;
    workCenterName: string;
    machineCode?: string;
    triggerType: QcpTriggerType;
    qcpId?: string;
  }): Promise<IpqcTask> {
    const matchingQcp =
      (params.qcpId && this.configs.find(c => c.id === params.qcpId)) ||
      this.configs.find(c => c.partNumber === params.partNumber && c.sequenceNumber === params.operationSequence) ||
      this.configs[0];

    const taskCount = this.tasks.length + 85;
    const taskNumber = `IPQC-2026-00${taskCount}`;

    const parameters = matchingQcp.parameters.map(p => ({
      parameterId: p.id,
      parameterName: p.parameterName,
      characteristicType: p.characteristicType,
      toleranceType: p.toleranceType,
      nominalValue: p.nominalValue,
      minSpec: p.lowerTolerance,
      maxSpec: p.upperTolerance,
      unit: p.unit,
      gaugeOrInstrument: p.gaugeOrInstrument,
      criticality: p.criticality,
      markerId: p.markerId,
      parameterStatus: 'pending' as const,
      outOfSpecCount: 0,
      samples: Array.from({ length: p.requiredSamples || 3 }, (_, i) => ({
        sampleNumber: i + 1,
        measuredValue: null,
        isOutOfSpec: false
      }))
    }));

    const newTask: IpqcTask = {
      id: `task-${Date.now().toString(36)}`,
      taskNumber,
      workOrderId: params.workOrderId,
      workOrderNumber: params.workOrderNumber,
      partNumber: params.partNumber,
      partName: params.partName,
      operationSequence: params.operationSequence,
      operationCode: params.operationCode,
      operationName: params.operationName,
      workCenterId: params.workCenterId,
      workCenterName: params.workCenterName,
      machineCode: params.machineCode || 'CNC-01',
      qcpId: matchingQcp.id,
      triggerType: params.triggerType,
      gateType: matchingQcp.gateType,
      status: 'pending',
      overallResult: 'pending',
      partModelType: matchingQcp.partModelType,
      markers: matchingQcp.markers.map(m => ({ ...m, status: 'pending', measuredValue: null })),
      parameters,
      photos: [],
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    this.saveTasks();
    return Promise.resolve(newTask);
  }

  // Save measurement entries with live tolerance verification
  public saveMeasurement(
    taskId: string,
    parameterId: string,
    samples: IpqcTaskSampleReading[]
  ): Promise<IpqcTask> {
    const taskIdx = this.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return Promise.reject(new Error('IPQC task not found'));

    const task = { ...this.tasks[taskIdx] };
    const paramIdx = task.parameters.findIndex(p => p.parameterId === parameterId);
    if (paramIdx === -1) return Promise.reject(new Error('Parameter not found'));

    const param = { ...task.parameters[paramIdx] };

    // Evaluate in/out of spec
    const evaluatedSamples = samples.map(s => {
      let isOutOfSpec = false;
      let deviation: number | undefined;

      if (param.toleranceType === 'pass_fail') {
        isOutOfSpec = s.isPass === false;
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
        deviation
      };
    });

    param.samples = evaluatedSamples;
    const numericVals = evaluatedSamples
      .map(s => s.measuredValue)
      .filter((v): v is number => v !== null && v !== undefined);

    param.outOfSpecCount = evaluatedSamples.filter(s => s.isOutOfSpec).length;

    if (numericVals.length < evaluatedSamples.length) {
      param.parameterStatus = 'pending';
    } else {
      param.parameterStatus = param.outOfSpecCount === 0 ? 'pass' : 'fail';
      const sum = numericVals.reduce((a, b) => a + b, 0);
      const mean = sum / numericVals.length;
      param.meanValue = Number(mean.toFixed(3));
      param.rangeValue = Number((Math.max(...numericVals) - Math.min(...numericVals)).toFixed(3));
    }

    task.parameters[paramIdx] = param;

    // Update matching 3D marker status if linked
    if (param.markerId) {
      const mIdx = task.markers.findIndex(m => m.id === param.markerId);
      if (mIdx !== -1) {
        task.markers[mIdx] = {
          ...task.markers[mIdx],
          status: param.parameterStatus === 'fail' ? 'out_of_spec' : param.parameterStatus === 'pass' ? 'in_spec' : 'pending',
          measuredValue: param.meanValue ?? (numericVals[0] || null)
        };
      }
    }

    if (task.status === 'pending') {
      task.status = 'in_progress';
    }

    this.tasks[taskIdx] = task;
    this.saveTasks();
    return Promise.resolve(task);
  }

  // Attach inspection photo linked to 3D marker
  public attachPartPhoto(
    taskId: string,
    photoData: Omit<IpqcPartPhoto, 'id' | 'timestamp'>
  ): Promise<IpqcTask> {
    const taskIdx = this.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return Promise.reject(new Error('IPQC task not found'));

    const task = { ...this.tasks[taskIdx] };
    const newPhoto: IpqcPartPhoto = {
      ...photoData,
      id: `photo-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString()
    };

    task.photos = [...(task.photos || []), newPhoto];

    // If photo belongs to a marker, tag marker
    if (photoData.markerId) {
      const mIdx = task.markers.findIndex(m => m.id === photoData.markerId);
      if (mIdx !== -1 && photoData.defectType && photoData.defectType !== 'acceptable_finish') {
        task.markers[mIdx] = {
          ...task.markers[mIdx],
          status: 'defect_flagged',
          photoUrl: photoData.url
        };
      }
    }

    this.tasks[taskIdx] = task;
    this.saveTasks();
    return Promise.resolve(task);
  }

  // Delete inspection photo
  public deletePartPhoto(taskId: string, photoId: string): Promise<IpqcTask> {
    const taskIdx = this.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return Promise.reject(new Error('IPQC task not found'));

    const task = { ...this.tasks[taskIdx] };
    task.photos = task.photos.filter(p => p.id !== photoId);
    this.tasks[taskIdx] = task;
    this.saveTasks();
    return Promise.resolve(task);
  }

  // Inspector signs off task (Pass / Hold / Fail)
  public signOffTask(
    taskId: string,
    data: {
      result: 'pass' | 'hold' | 'fail';
      inspectorName: string;
      badgeId: string;
      notes?: string;
      holdReason?: string;
    }
  ): Promise<IpqcTask> {
    const taskIdx = this.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return Promise.reject(new Error('IPQC task not found'));

    const task = { ...this.tasks[taskIdx] };
    task.overallResult = data.result;
    task.status = data.result === 'pass' ? 'passed' : data.result === 'hold' ? 'hold' : 'failed';
    task.inspectorName = data.inspectorName;
    task.badgeId = data.badgeId;
    task.notes = data.notes;
    task.holdReason = data.holdReason;
    task.completedAt = new Date().toISOString();
    task.signOffStatement =
      data.result === 'pass'
        ? `IN-PROCESS APPROVED: Machine & part quality verified against QCP specifications. Released to production.`
        : `MANDATORY OPERATION HOLD: Non-conformance detected at station. Machine paused until correction.`

    this.tasks[taskIdx] = task;
    this.saveTasks();
    return Promise.resolve(task);
  }

  public calculateKpis(): IpqcKpis {
    const totalTasks = this.tasks.length;
    const pendingInspection = this.tasks.filter(t => t.status === 'pending').length;
    const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
    const passedTasks = this.tasks.filter(t => t.status === 'passed').length;
    const failedHoldTasks = this.tasks.filter(t => t.status === 'hold' || t.status === 'failed').length;

    const evaluated = passedTasks + failedHoldTasks;
    const passRatePct = evaluated > 0 ? Number(((passedTasks / evaluated) * 100).toFixed(1)) : 100.0;

    return {
      totalTasks,
      pendingInspection,
      inProgress,
      passedTasks,
      failedHoldTasks,
      passRatePct,
      activeQcpPoints: this.configs.filter(c => c.isActive).length,
      avgResolutionMinutes: 18
    };
  }

  public exportCsv(): string {
    const headers = [
      'Task Number',
      'Work Order',
      'Part SKU',
      'Part Name',
      'Operation #',
      'Operation Name',
      'Work Center',
      'Machine',
      'Trigger Type',
      'Status',
      'Result',
      'Inspector',
      'Badge',
      'Hold Reason',
      'Created At',
      'Completed At'
    ];

    const rows = this.tasks.map(t => [
      `"${t.taskNumber}"`,
      `"${t.workOrderNumber}"`,
      `"${t.partNumber}"`,
      `"${t.partName.replace(/"/g, '""')}"`,
      t.operationSequence,
      `"${t.operationName.replace(/"/g, '""')}"`,
      `"${t.workCenterName.replace(/"/g, '""')}"`,
      `"${t.machineCode}"`,
      `"${t.triggerType}"`,
      `"${t.status}"`,
      `"${t.overallResult}"`,
      `"${t.inspectorName || ''}"`,
      `"${t.badgeId || ''}"`,
      `"${(t.holdReason || '').replace(/"/g, '""')}"`,
      `"${t.createdAt}"`,
      `"${t.completedAt || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const ipqcService = new IpqcService();
