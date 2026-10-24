// src/services/scrapReworkService.ts

import {
  ScrapRecord,
  ReworkRecord,
  ScrapReasonCodeDefinition,
  ReworkReasonCodeDefinition,
  CopqSummaryMetrics,
  ParetoDimension,
  ParetoAnalysisResult,
  ParetoBarItem,
  ScrapReworkFilters,
  ReworkStatus,
  ShiftType
} from '../types/scrapRework';

export const SCRAP_REASON_CODES: ScrapReasonCodeDefinition[] = [
  {
    code: 'DIM_OUT_OF_SPEC',
    name: 'Bore / Diameter Out of Spec',
    category: 'Machining & CNC Programming',
    description: 'Internal bore over-reamed or outer turned diameter under minimal tolerance specification.',
    typicalCorrectiveAction: 'Check tool wear offset table; recalibrate touch-probe before finishing pass.'
  },
  {
    code: 'TOOL_BREAK_CHIP',
    name: 'Tool Breakage & Insert Chipping',
    category: 'Tooling & Cutters',
    description: 'Carbide insert fractured mid-cut causing deep gouge marks on critical sealing faces.',
    typicalCorrectiveAction: 'Reduce feed rate by 15%; enforce tool life management cutoff at 120 minutes.'
  },
  {
    code: 'PROGRAM_OFFSET_ERR',
    name: 'G-Code Offset / WCS Error',
    category: 'Machining & CNC Programming',
    description: 'Work coordinate system (G54/G55) improperly set by operator during job setup.',
    typicalCorrectiveAction: 'Implement automated Renishaw macro probing for datum setup verification.'
  },
  {
    code: 'MATERIAL_DEFECT_INCLUSION',
    name: 'Subsurface Inclusions & Porosity',
    category: 'Raw Material Defect',
    description: 'Foundry casting void or slag inclusion uncovered after taking roughing pass.',
    typicalCorrectiveAction: 'Issue supplier NCR to steel casting foundry; request ultrasonic inspection certification.'
  },
  {
    code: 'WARPAGE_HEAT_TREAT',
    name: 'Heat Treat Distortion & Warpage',
    category: 'Thermal & Heat Treatment',
    description: 'Severe radial distortion and bow exceeding 0.40mm following oil quenching cycle.',
    typicalCorrectiveAction: 'Alter fixture stacking orientation during vacuum furnace pre-heat soaking.'
  },
  {
    code: 'SETUP_TEST_PIECE',
    name: 'First Article Setup Scrap',
    category: 'Operator Technique & Setup',
    description: 'Planned setup part consumed during high-tolerance coordinate dialing.',
    typicalCorrectiveAction: 'Optimize offline CAM simulation to reduce physical setup trial pieces.'
  },
  {
    code: 'SURFACE_CHATTER_BURR',
    name: 'Severe Chatter & Harmonic Resonance',
    category: 'Tooling & Cutters',
    description: 'High-frequency chatter marks exceeding Ra 3.2μm roughness specification.',
    typicalCorrectiveAction: 'Dampen overhang with tuned anti-vibration arbor; adjust spindle RPM sweet spot.'
  },
  {
    code: 'OPERATOR_MISHANDLE',
    name: 'Drop Damage & Clamp Crush',
    category: 'Handling & Contamination',
    description: 'Component dropped on shop floor concrete or deformed by excessive chuck pressure.',
    typicalCorrectiveAction: 'Provide soft-jaw collets and urethane-lined transfer dunnage baskets.'
  },
  {
    code: 'CRACK_WELD_FAIL',
    name: 'Micro-cracks in Heat Affected Zone',
    category: 'Fixture & Clamping',
    description: 'TIG root weld pass developed transverse cooling crack under radiographic NDT test.',
    typicalCorrectiveAction: 'Increase pre-heat temperature from 150°C to 220°C with controlled interpass monitoring.'
  },
  {
    code: 'OVER_TOLERANCE_BORE',
    name: 'Over-size Precision Bearing Pocket',
    category: 'Machining & CNC Programming',
    description: 'Boring head drifted +0.028mm over upper tolerance limit due to thermal spindle growth.',
    typicalCorrectiveAction: 'Enable CNC thermal compensation chiller unit and scheduled warm-up macro.'
  }
];

export const REWORK_REASON_CODES: ReworkReasonCodeDefinition[] = [
  {
    code: 'UNDERCUT_RE_MACHINE',
    name: 'Re-machine Undersize Face / Skim',
    description: 'Secondary skim cut required to bring oversized shoulder or step to drawing size.',
    defaultSecondaryStation: 'OP-CNC-LATHE',
    estimatedHoursTypical: 1.2
  },
  {
    code: 'DEBURR_FLASH_REMOVE',
    name: 'Manual Deburring & Flash Removal',
    description: 'Precision hand-deburring of intersection holes, cross-drillings, and micro-flashes.',
    defaultSecondaryStation: 'OP-FINISH-DEBURR',
    estimatedHoursTypical: 0.8
  },
  {
    code: 'RE_TAP_THREAD_CHASE',
    name: 'Thread Chasing & Pitch Repair',
    description: 'Tapped hole tight on Go-plug gauge; requires hand thread chase and ultrasonic cleaning.',
    defaultSecondaryStation: 'OP-THREAD-BENCH',
    estimatedHoursTypical: 0.5
  },
  {
    code: 'POLISH_SURFACE_RA',
    name: 'Micro-lap / Super-finish Skim',
    description: 'Lapping journal pin and bearing collar to achieve Ra 0.2μm mirror finish.',
    defaultSecondaryStation: 'OP-SUPERFINISH-BAY',
    estimatedHoursTypical: 1.5
  },
  {
    code: 'RE_HEAT_TREAT_TEMPER',
    name: 'Stress Relief Re-temper Cycle',
    description: 'Parts under 58 HRC target hardness; requires re-austenitizing and tempering cycle.',
    defaultSecondaryStation: 'OP-VACUUM-FURNACE',
    estimatedHoursTypical: 4.0
  },
  {
    code: 'DIMENSIONAL_SKIM_GRIND',
    name: 'Precision Cylindrical Skim Grind',
    description: 'Sub-micron grinding pass on Studer CNC grinder to bring runout within 0.005mm.',
    defaultSecondaryStation: 'OP-CYL-GRIND',
    estimatedHoursTypical: 1.8
  },
  {
    code: 'RE_ALIGN_STRAIGHTEN',
    name: 'Hydraulic Press Arbor Straightening',
    description: 'Precision indicator straightening of shaft bow under hydraulic arbor press.',
    defaultSecondaryStation: 'OP-PRESS-ALIGN',
    estimatedHoursTypical: 0.75
  }
];

const INITIAL_SCRAP_RECORDS: ScrapRecord[] = [
  {
    id: 'scr-001',
    scrapNumber: 'SCR-2026-0041',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-0001',
    salesOrderNumber: 'SO-2026-8810',
    customerName: 'Apex Transmission Systems',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    operationCode: 'OP-020',
    operationName: 'Hobbing & Spline Broach',
    operationSequence: 20,
    machineId: 'MCH-CNC-LATHE-02',
    machineName: 'Okuma LB3000 EX II CNC Lathe',
    shift: 'shift_c',
    shiftLabel: 'Shift C (Night 22:00-06:00)',
    operatorId: 'OP-003',
    operatorName: 'Vikram Patel',
    quantityScrapped: 4,
    unit: 'PCS',
    reasonCode: 'TOOL_BREAK_CHIP',
    reasonName: 'Tool Breakage & Insert Chipping',
    rootCauseCategory: 'Tooling & Cutters',
    description: 'Roughing insert chipped in 20MnCr5 alloy bar; deep gouge across spline shoulder. Non-reworkable.',
    materialUnitCost: 28.50,
    cumulativeOpCostPerUnit: 24.20,
    grossScrapCost: 210.80, // 4 * (28.50 + 24.20)
    salvageRecoveryUnitValue: 3.80,
    totalSalvageCredit: 15.20,
    netScrapCost: 195.60,
    lotNumber: 'LOT-2026-0312-A',
    heatNumber: 'HEAT-HT44892',
    recordedBy: 'Vikram Patel',
    recordedAt: '2026-10-12T03:45:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Tool life management alarm was overridden. Tool was at 145 min of run time.'
  },
  {
    id: 'scr-002',
    scrapNumber: 'SCR-2026-0042',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2026-0003',
    salesOrderNumber: 'SO-2026-8814',
    customerName: 'AeroDynamics Propulsion Group',
    partCode: 'IMP-5X-220',
    partName: 'Titanium Closed Impeller 5-Axis',
    operationCode: 'OP-030',
    operationName: '5-Axis Multi-Blade Milling',
    operationSequence: 30,
    machineId: 'MCH-CNC-5AX-01',
    machineName: 'Hermle C400 5-Axis Machining Center',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-002',
    operatorName: 'David Miller',
    quantityScrapped: 1,
    unit: 'PCS',
    reasonCode: 'PROGRAM_OFFSET_ERR',
    reasonName: 'G-Code Offset / WCS Error',
    rootCauseCategory: 'Machining & CNC Programming',
    description: 'Z-axis zero datum shifted 0.85mm into blade shroud during CAM post-processor trial.',
    materialUnitCost: 310.00,
    cumulativeOpCostPerUnit: 345.00,
    grossScrapCost: 655.00,
    salvageRecoveryUnitValue: 42.00,
    totalSalvageCredit: 42.00,
    netScrapCost: 613.00,
    lotNumber: 'LOT-2026-0308-C',
    heatNumber: 'HEAT-TI64-991',
    recordedBy: 'David Miller',
    recordedAt: '2026-10-11T19:20:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Titanium Ti-6Al-4V solid billet scrapped. Post-processor revised and locked in vault.'
  },
  {
    id: 'scr-003',
    scrapNumber: 'SCR-2026-0043',
    workOrderId: 'wo-004',
    workOrderNumber: 'WO-2026-0004',
    salesOrderNumber: 'SO-2026-8818',
    customerName: 'FlowServe Energy Systems',
    partCode: 'PCH-180',
    partName: 'High Pressure Pump Chamber Housing',
    operationCode: 'OP-020',
    operationName: 'Internal Deep Boring & Chambering',
    operationSequence: 20,
    machineId: 'MCH-CNC-LATHE-02',
    machineName: 'Okuma LB3000 EX II CNC Lathe',
    shift: 'shift_c',
    shiftLabel: 'Shift C (Night 22:00-06:00)',
    operatorId: 'OP-003',
    operatorName: 'Vikram Patel',
    quantityScrapped: 2,
    unit: 'PCS',
    reasonCode: 'DIM_OUT_OF_SPEC',
    reasonName: 'Bore / Diameter Out of Spec',
    rootCauseCategory: 'Machining & CNC Programming',
    description: 'Chamber bore over-sized by +0.065mm beyond maximum allowable sealing ring tolerance.',
    materialUnitCost: 88.00,
    cumulativeOpCostPerUnit: 52.00,
    grossScrapCost: 280.00,
    salvageRecoveryUnitValue: 8.50,
    totalSalvageCredit: 17.00,
    netScrapCost: 263.00,
    lotNumber: 'LOT-2026-0310-B',
    heatNumber: 'HEAT-SS316-204',
    recordedBy: 'Vikram Patel',
    recordedAt: '2026-10-10T04:12:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Operator dialed wear offset in wrong direction (+ instead of -).'
  },
  {
    id: 'scr-004',
    scrapNumber: 'SCR-2026-0044',
    workOrderId: 'wo-005',
    workOrderNumber: 'WO-2026-0005',
    salesOrderNumber: 'SO-2026-8822',
    customerName: 'HydraTech Actuators',
    partCode: 'HMB-AL6061',
    partName: 'Hydraulic Manifold Block AL6061',
    operationCode: 'OP-040',
    operationName: 'Deep Hole Gun Drilling',
    operationSequence: 40,
    machineId: 'MCH-MILL-VMC-03',
    machineName: 'Haas VF-4 High Performance VMC',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-006',
    operatorName: 'Amit Kulkarni',
    quantityScrapped: 3,
    unit: 'PCS',
    reasonCode: 'MATERIAL_DEFECT_INCLUSION',
    reasonName: 'Subsurface Inclusions & Porosity',
    rootCauseCategory: 'Raw Material Defect',
    description: 'Subsurface casting voids broken through into cross-drilled gallery during 12mm drill cycle.',
    materialUnitCost: 45.00,
    cumulativeOpCostPerUnit: 36.00,
    grossScrapCost: 243.00,
    salvageRecoveryUnitValue: 6.20,
    totalSalvageCredit: 18.60,
    netScrapCost: 224.40,
    lotNumber: 'LOT-2026-0305-AL',
    heatNumber: 'HEAT-AL6-778',
    recordedBy: 'Amit Kulkarni',
    recordedAt: '2026-10-09T20:30:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Cast billet vendor batch NCR-2026-018 opened against raw material supplier.'
  },
  {
    id: 'scr-005',
    scrapNumber: 'SCR-2026-0045',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2026-0002',
    salesOrderNumber: 'SO-2026-8812',
    customerName: 'Kalyani Heavy Axles',
    partCode: 'DS-45S',
    partName: 'Driveshaft Flanged Spindle 4340',
    operationCode: 'OP-050',
    operationName: 'Spline Induction Hardening & Temper',
    operationSequence: 50,
    machineId: 'MCH-PRESS-BRAKE-01',
    machineName: 'Amada HG 1303 CNC Press Brake',
    shift: 'shift_a',
    shiftLabel: 'Shift A (Morning 06:00-14:00)',
    operatorId: 'OP-005',
    operatorName: 'Marcus Vance',
    quantityScrapped: 2,
    unit: 'PCS',
    reasonCode: 'WARPAGE_HEAT_TREAT',
    reasonName: 'Heat Treat Distortion & Warpage',
    rootCauseCategory: 'Thermal & Heat Treatment',
    description: 'Runout bow 0.65mm on spline shaft following induction quench; cracked upon attempted arbor press restrike.',
    materialUnitCost: 62.00,
    cumulativeOpCostPerUnit: 48.00,
    grossScrapCost: 220.00,
    salvageRecoveryUnitValue: 7.00,
    totalSalvageCredit: 14.00,
    netScrapCost: 206.00,
    lotNumber: 'LOT-2026-0311-D',
    heatNumber: 'HEAT-4340-912',
    recordedBy: 'Marcus Vance',
    recordedAt: '2026-10-13T10:15:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Shaft fractured under press. Requires slower quench progression.'
  },
  {
    id: 'scr-006',
    scrapNumber: 'SCR-2026-0046',
    workOrderId: 'wo-006',
    workOrderNumber: 'WO-2026-0006',
    salesOrderNumber: 'SO-2026-8824',
    customerName: 'Rolls Marine Propellers',
    partCode: 'TSR-INC718',
    partName: 'Turbine Seal Ring Inconel 718',
    operationCode: 'OP-030',
    operationName: 'Precision Finish Face Grooving',
    operationSequence: 30,
    machineId: 'MCH-MILL-INTEGREX',
    machineName: 'Mazak Integrex e-500H Mill-Turn',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-001',
    operatorName: 'Rajesh Sharma',
    quantityScrapped: 1,
    unit: 'PCS',
    reasonCode: 'SURFACE_CHATTER_BURR',
    reasonName: 'Severe Chatter & Harmonic Resonance',
    rootCauseCategory: 'Tooling & Cutters',
    description: 'Violent regenerative chatter on Inconel face groove wall; roughness measured Ra 4.8μm vs Ra 0.8μm limit.',
    materialUnitCost: 215.00,
    cumulativeOpCostPerUnit: 175.00,
    grossScrapCost: 390.00,
    salvageRecoveryUnitValue: 32.00,
    totalSalvageCredit: 32.00,
    netScrapCost: 358.00,
    lotNumber: 'LOT-2026-0298-IN',
    heatNumber: 'HEAT-IN718-450',
    recordedBy: 'Rajesh Sharma',
    recordedAt: '2026-10-08T17:45:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Tool holder dampened sleeve worn out. Ordered vibration-damped Sandvik Silent Tools holder.'
  },
  {
    id: 'scr-007',
    scrapNumber: 'SCR-2026-0047',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-0001',
    salesOrderNumber: 'SO-2026-8810',
    customerName: 'Apex Transmission Systems',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    operationCode: 'OP-010',
    operationName: 'Rough CNC Facing & OD Turning',
    operationSequence: 10,
    machineId: 'MCH-CNC-LATHE-02',
    machineName: 'Okuma LB3000 EX II CNC Lathe',
    shift: 'shift_c',
    shiftLabel: 'Shift C (Night 22:00-06:00)',
    operatorId: 'OP-003',
    operatorName: 'Vikram Patel',
    quantityScrapped: 3,
    unit: 'PCS',
    reasonCode: 'SETUP_TEST_PIECE',
    reasonName: 'First Article Setup Scrap',
    rootCauseCategory: 'Operator Technique & Setup',
    description: 'Setup test pieces dialed in during chuck jaw replacement on Okuma lathe.',
    materialUnitCost: 28.50,
    cumulativeOpCostPerUnit: 10.00,
    grossScrapCost: 115.50,
    salvageRecoveryUnitValue: 3.80,
    totalSalvageCredit: 11.40,
    netScrapCost: 104.10,
    lotNumber: 'LOT-2026-0312-A',
    heatNumber: 'HEAT-HT44892',
    recordedBy: 'Vikram Patel',
    recordedAt: '2026-10-12T00:30:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Setup scrap expected on lot changeover, but 3 pieces exceeded budget of 1 piece.'
  },
  {
    id: 'scr-008',
    scrapNumber: 'SCR-2026-0048',
    workOrderId: 'wo-007',
    workOrderNumber: 'WO-2026-0007',
    salesOrderNumber: 'SO-2026-8830',
    customerName: 'Mahindra Defense Systems',
    partCode: 'SKA-FORG-45',
    partName: 'Forged Steering Knuckle Arm',
    operationCode: 'OP-020',
    operationName: 'Straddle Milling Pivot Lug',
    operationSequence: 20,
    machineId: 'MCH-MILL-VMC-03',
    machineName: 'Haas VF-4 High Performance VMC',
    shift: 'shift_a',
    shiftLabel: 'Shift A (Morning 06:00-14:00)',
    operatorId: 'OP-006',
    operatorName: 'Amit Kulkarni',
    quantityScrapped: 2,
    unit: 'PCS',
    reasonCode: 'OPERATOR_MISHANDLE',
    reasonName: 'Drop Damage & Clamp Crush',
    rootCauseCategory: 'Handling & Contamination',
    description: 'Parts slipped out of pneumatic hoist gripping clamp during load cycle, denting precision ground pivot face.',
    materialUnitCost: 74.00,
    cumulativeOpCostPerUnit: 32.00,
    grossScrapCost: 212.00,
    salvageRecoveryUnitValue: 6.50,
    totalSalvageCredit: 13.00,
    netScrapCost: 199.00,
    lotNumber: 'LOT-2026-0301-SK',
    heatNumber: 'HEAT-SK-661',
    recordedBy: 'Amit Kulkarni',
    recordedAt: '2026-10-13T09:40:00Z',
    plantId: 'plant-main',
    plantName: 'Apex Manufacturing Facility - Pune',
    status: 'confirmed',
    notes: 'Air line pressure drop on crane gripper. Maintenance replaced regulator valve.'
  }
];

const INITIAL_REWORK_RECORDS: ReworkRecord[] = [
  {
    id: 'rwk-001',
    reworkNumber: 'RWK-2026-0017',
    workOrderId: 'wo-001',
    workOrderNumber: 'WO-2026-0001',
    salesOrderNumber: 'SO-2026-8810',
    customerName: 'Apex Transmission Systems',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    originalOperationCode: 'OP-020',
    originalOperationName: 'Hobbing & Spline Broach',
    reworkStationCode: 'OP-FINISH-DEBURR',
    reworkStationName: 'Deburring & Ultrasonic Clean Bench',
    machineId: 'MCH-CNC-LATHE-02',
    machineName: 'Okuma LB3000 EX II CNC Lathe',
    shift: 'shift_c',
    shiftLabel: 'Shift C (Night 22:00-06:00)',
    operatorId: 'OP-003',
    operatorName: 'Vikram Patel',
    reworkQuantity: 12,
    unit: 'PCS',
    reasonCode: 'DEBURR_FLASH_REMOVE',
    reasonName: 'Manual Deburring & Flash Removal',
    reworkInstructions: 'Broach exit burrs exceeding 0.15mm height. Perform rotary carbide burr removal and scotch-brite brush.',
    reworkLaborHours: 3.5,
    reworkLaborHourlyRate: 24.00,
    reworkMachineHours: 0,
    reworkMachineHourlyRate: 0,
    consumablesCost: 12.00,
    secondaryVendorCost: 0,
    totalReworkCost: 96.00, // (3.5 * 24) + 12
    potentialScrapCostAvoided: 632.40, // 12 * (28.50 + 24.20)
    netCostBenefit: 536.40,
    status: 'rework_passed',
    recordedAt: '2026-10-12T05:30:00Z',
    completedAt: '2026-10-12T11:00:00Z',
    turnaroundHours: 5.5,
    verifiedByQualityInspector: 'Priya Sundaram (Lead QC Inspector)',
    technicianNotes: 'All 12 parts 100% inspected with optical comparator. Zero burr profile verified.'
  },
  {
    id: 'rwk-002',
    reworkNumber: 'RWK-2026-0018',
    workOrderId: 'wo-004',
    workOrderNumber: 'WO-2026-0004',
    salesOrderNumber: 'SO-2026-8818',
    customerName: 'FlowServe Energy Systems',
    partCode: 'PCH-180',
    partName: 'High Pressure Pump Chamber Housing',
    originalOperationCode: 'OP-020',
    originalOperationName: 'Internal Deep Boring & Chambering',
    reworkStationCode: 'OP-CYL-GRIND',
    reworkStationName: 'Studer S33 Cylindrical Grinding Bay',
    machineId: 'MCH-GRIND-STUDER',
    machineName: 'Studer S33 Universal Cylindrical Grinder',
    shift: 'shift_a',
    shiftLabel: 'Shift A (Morning 06:00-14:00)',
    operatorId: 'OP-004',
    operatorName: 'Sunita Rao',
    reworkQuantity: 6,
    unit: 'PCS',
    reasonCode: 'DIMENSIONAL_SKIM_GRIND',
    reasonName: 'Precision Cylindrical Skim Grind',
    reworkInstructions: 'Seal gland face left with +0.025mm excess material. Mount on Studer S33 and grind down to 180.000 ±0.005mm.',
    reworkLaborHours: 4.0,
    reworkLaborHourlyRate: 28.00,
    reworkMachineHours: 3.5,
    reworkMachineHourlyRate: 45.00,
    consumablesCost: 25.00,
    secondaryVendorCost: 0,
    totalReworkCost: 294.50, // (4 * 28) + (3.5 * 45) + 25 = 112 + 157.5 + 25
    potentialScrapCostAvoided: 840.00,
    netCostBenefit: 545.50,
    status: 'rework_passed',
    recordedAt: '2026-10-11T09:15:00Z',
    completedAt: '2026-10-11T16:30:00Z',
    turnaroundHours: 7.25,
    verifiedByQualityInspector: 'Priya Sundaram (Lead QC Inspector)',
    technicianNotes: 'All 6 housings skim ground. CMM report signed off and attached to eDHR batch traveler.'
  },
  {
    id: 'rwk-003',
    reworkNumber: 'RWK-2026-0019',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2026-0003',
    salesOrderNumber: 'SO-2026-8814',
    customerName: 'AeroDynamics Propulsion Group',
    partCode: 'IMP-5X-220',
    partName: 'Titanium Closed Impeller 5-Axis',
    originalOperationCode: 'OP-030',
    originalOperationName: '5-Axis Multi-Blade Milling',
    reworkStationCode: 'OP-SUPERFINISH-BAY',
    reworkStationName: 'Aero Blade Manual Finishing Cell',
    machineId: 'MCH-CNC-5AX-01',
    machineName: 'Hermle C400 5-Axis Machining Center',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-002',
    operatorName: 'David Miller',
    reworkQuantity: 2,
    unit: 'PCS',
    reasonCode: 'POLISH_SURFACE_RA',
    reasonName: 'Micro-lap / Super-finish Skim',
    reworkInstructions: 'Aero blade suction surface Ra measured 1.4μm (max drawing allowance 0.6μm). Perform pneumatic micro-abrasive polishing.',
    reworkLaborHours: 6.0,
    reworkLaborHourlyRate: 35.00,
    reworkMachineHours: 0,
    reworkMachineHourlyRate: 0,
    consumablesCost: 45.00,
    secondaryVendorCost: 0,
    totalReworkCost: 255.00, // (6 * 35) + 45 = 210 + 45
    potentialScrapCostAvoided: 1310.00, // 2 * 655
    netCostBenefit: 1055.00,
    status: 'in_progress',
    recordedAt: '2026-10-13T14:30:00Z',
    turnaroundHours: undefined,
    technicianNotes: 'Blades 1-8 completed on first piece. Second piece in ultrasonic pre-wash.'
  },
  {
    id: 'rwk-004',
    reworkNumber: 'RWK-2026-0020',
    workOrderId: 'wo-005',
    workOrderNumber: 'WO-2026-0005',
    salesOrderNumber: 'SO-2026-8822',
    customerName: 'HydraTech Actuators',
    partCode: 'HMB-AL6061',
    partName: 'Hydraulic Manifold Block AL6061',
    originalOperationCode: 'OP-030',
    originalOperationName: 'Thread Milling SAE-08 Ports',
    reworkStationCode: 'OP-THREAD-BENCH',
    reworkStationName: 'Precision Threading & Heli-Coil Cell',
    machineId: 'MCH-MILL-VMC-03',
    machineName: 'Haas VF-4 High Performance VMC',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-006',
    operatorName: 'Amit Kulkarni',
    reworkQuantity: 5,
    unit: 'PCS',
    reasonCode: 'RE_TAP_THREAD_CHASE',
    reasonName: 'Thread Chasing & Pitch Repair',
    reworkInstructions: 'Thread mill insert wear caused tight fit on 3/4-16 UNF threads. Hand chase with spiral fluted tap and blow dry.',
    reworkLaborHours: 2.0,
    reworkLaborHourlyRate: 22.00,
    reworkMachineHours: 0,
    reworkMachineHourlyRate: 0,
    consumablesCost: 15.00,
    secondaryVendorCost: 0,
    totalReworkCost: 59.00, // (2 * 22) + 15 = 44 + 15
    potentialScrapCostAvoided: 405.00, // 5 * 81
    netCostBenefit: 346.00,
    status: 'rework_passed',
    recordedAt: '2026-10-10T18:00:00Z',
    completedAt: '2026-10-10T21:15:00Z',
    turnaroundHours: 3.25,
    verifiedByQualityInspector: 'Priya Sundaram (Lead QC Inspector)',
    technicianNotes: 'Verified 100% with Class 2B Go/No-Go thread gauge plugs. All passed smoothly.'
  },
  {
    id: 'rwk-005',
    reworkNumber: 'RWK-2026-0021',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2026-0002',
    salesOrderNumber: 'SO-2026-8812',
    customerName: 'Kalyani Heavy Axles',
    partCode: 'DS-45S',
    partName: 'Driveshaft Flanged Spindle 4340',
    originalOperationCode: 'OP-040',
    originalOperationName: 'Spline Milling & Hobbing',
    reworkStationCode: 'OP-PRESS-ALIGN',
    reworkStationName: 'Hydraulic Arbor Straightening Station',
    machineId: 'MCH-CNC-LATHE-02',
    machineName: 'Okuma LB3000 EX II CNC Lathe',
    shift: 'shift_a',
    shiftLabel: 'Shift A (Morning 06:00-14:00)',
    operatorId: 'OP-001',
    operatorName: 'Rajesh Sharma',
    reworkQuantity: 4,
    unit: 'PCS',
    reasonCode: 'RE_ALIGN_STRAIGHTEN',
    reasonName: 'Hydraulic Press Arbor Straightening',
    reworkInstructions: 'Thermal shaft deflection 0.18mm TIR. Mount between dead centers and bump under arbor press to TIR < 0.03mm.',
    reworkLaborHours: 3.0,
    reworkLaborHourlyRate: 26.00,
    reworkMachineHours: 1.0,
    reworkMachineHourlyRate: 20.00,
    consumablesCost: 0,
    secondaryVendorCost: 0,
    totalReworkCost: 98.00, // (3 * 26) + (1 * 20) = 78 + 20
    potentialScrapCostAvoided: 440.00, // 4 * 110
    netCostBenefit: 342.00,
    status: 'rework_passed',
    recordedAt: '2026-10-12T10:00:00Z',
    completedAt: '2026-10-12T14:30:00Z',
    turnaroundHours: 4.5,
    verifiedByQualityInspector: 'Priya Sundaram (Lead QC Inspector)',
    technicianNotes: 'TIR brought down to 0.018mm average on Mitutoyo dial test indicator.'
  },
  {
    id: 'rwk-006',
    reworkNumber: 'RWK-2026-0022',
    workOrderId: 'wo-006',
    workOrderNumber: 'WO-2026-0006',
    salesOrderNumber: 'SO-2026-8824',
    customerName: 'Rolls Marine Propellers',
    partCode: 'TSR-INC718',
    partName: 'Turbine Seal Ring Inconel 718',
    originalOperationCode: 'OP-020',
    originalOperationName: 'Rough Boring & O-Ring Chamfer',
    reworkStationCode: 'OP-CNC-LATHE',
    reworkStationName: 'Okuma Lathe Secondary Cell',
    machineId: 'MCH-MILL-INTEGREX',
    machineName: 'Mazak Integrex e-500H Mill-Turn',
    shift: 'shift_b',
    shiftLabel: 'Shift B (Evening 14:00-22:00)',
    operatorId: 'OP-001',
    operatorName: 'Rajesh Sharma',
    reworkQuantity: 3,
    unit: 'PCS',
    reasonCode: 'UNDERCUT_RE_MACHINE',
    reasonName: 'Re-machine Undersize Face / Skim',
    reworkInstructions: 'Chamfer depth was 0.2mm shallow due to touch-off difference. Recut chamfer with specialized 45 deg ceramic cutter.',
    reworkLaborHours: 2.5,
    reworkLaborHourlyRate: 30.00,
    reworkMachineHours: 2.0,
    reworkMachineHourlyRate: 50.00,
    consumablesCost: 35.00,
    secondaryVendorCost: 0,
    totalReworkCost: 210.00, // (2.5 * 30) + (2 * 50) + 35 = 75 + 100 + 35
    potentialScrapCostAvoided: 1170.00, // 3 * 390
    netCostBenefit: 960.00,
    status: 'rework_passed',
    recordedAt: '2026-10-09T15:20:00Z',
    completedAt: '2026-10-09T19:40:00Z',
    turnaroundHours: 4.33,
    verifiedByQualityInspector: 'Priya Sundaram (Lead QC Inspector)',
    technicianNotes: 'Chamfer depth verified with depth micrometer. Perfectly on nominal.'
  },
  {
    id: 'rwk-007',
    reworkNumber: 'RWK-2026-0023',
    workOrderId: 'wo-007',
    workOrderNumber: 'WO-2026-0007',
    salesOrderNumber: 'SO-2026-8830',
    customerName: 'Mahindra Defense Systems',
    partCode: 'SKA-FORG-45',
    partName: 'Forged Steering Knuckle Arm',
    originalOperationCode: 'OP-030',
    originalOperationName: 'Reaming Kingpin Bore H7',
    reworkStationCode: 'OP-CYL-GRIND',
    reworkStationName: 'Honing & Precision Sizing Bay',
    machineId: 'MCH-MILL-VMC-03',
    machineName: 'Haas VF-4 High Performance VMC',
    shift: 'shift_c',
    shiftLabel: 'Shift C (Night 22:00-06:00)',
    operatorId: 'OP-003',
    operatorName: 'Vikram Patel',
    reworkQuantity: 4,
    unit: 'PCS',
    reasonCode: 'DIMENSIONAL_SKIM_GRIND',
    reasonName: 'Precision Cylindrical Skim Grind',
    reworkInstructions: 'Kingpin bore came out 0.012mm tight on H7 limit. Perform Sunnen diamond honing pass to open bore to 45.015mm.',
    reworkLaborHours: 3.0,
    reworkLaborHourlyRate: 25.00,
    reworkMachineHours: 2.0,
    reworkMachineHourlyRate: 35.00,
    consumablesCost: 20.00,
    secondaryVendorCost: 0,
    totalReworkCost: 165.00, // (3 * 25) + (2 * 35) + 20 = 75 + 70 + 20
    potentialScrapCostAvoided: 424.00, // 4 * 106
    netCostBenefit: 259.00,
    status: 'pending_rework',
    recordedAt: '2026-10-14T02:15:00Z',
    turnaroundHours: undefined,
    technicianNotes: 'Batched in honing queue. Tooling verified.'
  }
];

const LOCAL_STORAGE_SCRAP_KEY = 'factory_scrap_records_v1';
const LOCAL_STORAGE_REWORK_KEY = 'factory_rework_records_v1';

class ScrapReworkService {
  private scrapRecords: ScrapRecord[] = [];
  private reworkRecords: ReworkRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedScrap = localStorage.getItem(LOCAL_STORAGE_SCRAP_KEY);
      if (storedScrap) {
        this.scrapRecords = JSON.parse(storedScrap);
      } else {
        this.scrapRecords = [...INITIAL_SCRAP_RECORDS];
        this.saveScrapToStorage();
      }

      const storedRework = localStorage.getItem(LOCAL_STORAGE_REWORK_KEY);
      if (storedRework) {
        this.reworkRecords = JSON.parse(storedRework);
      } else {
        this.reworkRecords = [...INITIAL_REWORK_RECORDS];
        this.saveReworkToStorage();
      }
    } catch {
      this.scrapRecords = [...INITIAL_SCRAP_RECORDS];
      this.reworkRecords = [...INITIAL_REWORK_RECORDS];
    }
  }

  private saveScrapToStorage(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_SCRAP_KEY, JSON.stringify(this.scrapRecords));
    } catch (e) {
      console.warn('Failed to save scrap records to storage', e);
    }
  }

  private saveReworkToStorage(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_REWORK_KEY, JSON.stringify(this.reworkRecords));
    } catch (e) {
      console.warn('Failed to save rework records to storage', e);
    }
  }

  public getScrapRecords(filters?: ScrapReworkFilters): ScrapRecord[] {
    let records = [...this.scrapRecords];

    if (!filters) return records;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      records = records.filter(r => 
        r.scrapNumber.toLowerCase().includes(q) ||
        r.workOrderNumber.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.machineName.toLowerCase().includes(q) ||
        r.operatorName.toLowerCase().includes(q) ||
        r.reasonName.toLowerCase().includes(q) ||
        r.lotNumber.toLowerCase().includes(q)
      );
    }

    if (filters.machineId) {
      records = records.filter(r => r.machineId === filters.machineId);
    }

    if (filters.operatorId) {
      records = records.filter(r => r.operatorId === filters.operatorId);
    }

    if (filters.shift && filters.shift !== 'all') {
      records = records.filter(r => r.shift === filters.shift);
    }

    if (filters.rootCauseCategory && filters.rootCauseCategory !== 'all') {
      records = records.filter(r => r.rootCauseCategory === filters.rootCauseCategory);
    }

    if (filters.workOrderId) {
      records = records.filter(r => r.workOrderId === filters.workOrderId);
    }

    return records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  public getReworkRecords(filters?: ScrapReworkFilters): ReworkRecord[] {
    let records = [...this.reworkRecords];

    if (!filters) return records;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      records = records.filter(r => 
        r.reworkNumber.toLowerCase().includes(q) ||
        r.workOrderNumber.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        r.machineName.toLowerCase().includes(q) ||
        r.operatorName.toLowerCase().includes(q) ||
        r.reasonName.toLowerCase().includes(q) ||
        r.reworkInstructions.toLowerCase().includes(q)
      );
    }

    if (filters.machineId) {
      records = records.filter(r => r.machineId === filters.machineId);
    }

    if (filters.operatorId) {
      records = records.filter(r => r.operatorId === filters.operatorId);
    }

    if (filters.shift && filters.shift !== 'all') {
      records = records.filter(r => r.shift === filters.shift);
    }

    if (filters.status && filters.status !== 'all') {
      records = records.filter(r => r.status === filters.status);
    }

    if (filters.workOrderId) {
      records = records.filter(r => r.workOrderId === filters.workOrderId);
    }

    return records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  public addScrapRecord(record: Omit<ScrapRecord, 'id' | 'scrapNumber' | 'recordedAt' | 'grossScrapCost' | 'totalSalvageCredit' | 'netScrapCost'>): ScrapRecord {
    const grossCost = record.quantityScrapped * (record.materialUnitCost + record.cumulativeOpCostPerUnit);
    const totalSalvage = record.quantityScrapped * (record.salvageRecoveryUnitValue || 0);
    const netCost = Math.max(0, grossCost - totalSalvage);

    const newNumber = `SCR-2026-${String(this.scrapRecords.length + 41).padStart(4, '0')}`;

    const newRecord: ScrapRecord = {
      ...record,
      id: `scr-${Date.now()}`,
      scrapNumber: newNumber,
      recordedAt: new Date().toISOString(),
      grossScrapCost: Number(grossCost.toFixed(2)),
      totalSalvageCredit: Number(totalSalvage.toFixed(2)),
      netScrapCost: Number(netCost.toFixed(2))
    };

    this.scrapRecords.unshift(newRecord);
    this.saveScrapToStorage();
    return newRecord;
  }

  public addReworkRecord(record: Omit<ReworkRecord, 'id' | 'reworkNumber' | 'recordedAt' | 'totalReworkCost' | 'netCostBenefit'>): ReworkRecord {
    const laborCost = record.reworkLaborHours * record.reworkLaborHourlyRate;
    const machineCost = record.reworkMachineHours * record.reworkMachineHourlyRate;
    const totalCost = laborCost + machineCost + (record.consumablesCost || 0) + (record.secondaryVendorCost || 0);
    const netBenefit = Math.max(0, (record.potentialScrapCostAvoided || 0) - totalCost);

    const newNumber = `RWK-2026-${String(this.reworkRecords.length + 17).padStart(4, '0')}`;

    const newRecord: ReworkRecord = {
      ...record,
      id: `rwk-${Date.now()}`,
      reworkNumber: newNumber,
      recordedAt: new Date().toISOString(),
      totalReworkCost: Number(totalCost.toFixed(2)),
      netCostBenefit: Number(netBenefit.toFixed(2))
    };

    this.reworkRecords.unshift(newRecord);
    this.saveReworkToStorage();
    return newRecord;
  }

  public updateReworkStatus(
    reworkId: string, 
    newStatus: ReworkStatus, 
    notes?: string, 
    inspectorName?: string
  ): ReworkRecord | null {
    const index = this.reworkRecords.findIndex(r => r.id === reworkId);
    if (index === -1) return null;

    const existing = this.reworkRecords[index];
    const updated: ReworkRecord = {
      ...existing,
      status: newStatus,
      technicianNotes: notes ? `${existing.technicianNotes || ''}\n[Update]: ${notes}`.trim() : existing.technicianNotes,
      completedAt: (newStatus === 'rework_passed' || newStatus === 'rework_failed_scrapped') ? new Date().toISOString() : existing.completedAt,
      verifiedByQualityInspector: inspectorName || existing.verifiedByQualityInspector
    };

    this.reworkRecords[index] = updated;
    this.saveReworkToStorage();
    return updated;
  }

  public getCopqSummary(filters?: ScrapReworkFilters): CopqSummaryMetrics {
    const scrap = this.getScrapRecords(filters);
    const rework = this.getReworkRecords(filters);

    const grossScrap = scrap.reduce((sum, s) => sum + s.grossScrapCost, 0);
    const totalSalvage = scrap.reduce((sum, s) => sum + s.totalSalvageCredit, 0);
    const netScrap = scrap.reduce((sum, s) => sum + s.netScrapCost, 0);
    const totalScrappedUnits = scrap.reduce((sum, s) => sum + s.quantityScrapped, 0);

    const totalReworkCost = rework.reduce((sum, r) => sum + r.totalReworkCost, 0);
    const totalReworkUnits = rework.reduce((sum, r) => sum + r.reworkQuantity, 0);
    const totalReworkLaborHours = rework.reduce((sum, r) => sum + r.reworkLaborHours, 0);
    const totalReworkMachineHours = rework.reduce((sum, r) => sum + r.reworkMachineHours, 0);
    const totalCostSavedViaRework = rework.reduce((sum, r) => sum + r.netCostBenefit, 0);

    const completedRework = rework.filter(r => r.status === 'rework_passed' || r.status === 'rework_failed_scrapped');
    const passedRework = rework.filter(r => r.status === 'rework_passed');
    const reworkSuccessRatePct = completedRework.length > 0 
      ? Number(((passedRework.length / completedRework.length) * 100).toFixed(1)) 
      : 100;

    const totalCopq = netScrap + totalReworkCost;
    // Estimated baseline manufacturing batch value across the active work orders (~$88,500)
    const baselineProductionValue = 88500;
    const copqPercentageOfProduction = Number(((totalCopq / baselineProductionValue) * 100).toFixed(2));

    // Calculate vital few offenders for machines
    const paretoMachine = this.getParetoAnalysis('machine', filters);
    const vitalFewOffendersCount = paretoMachine.vitalFewCount;

    return {
      totalScrapEvents: scrap.length,
      totalScrappedUnits,
      grossScrapCost: Number(grossScrap.toFixed(2)),
      totalSalvageRecovery: Number(totalSalvage.toFixed(2)),
      netScrapCost: Number(netScrap.toFixed(2)),

      totalReworkEvents: rework.length,
      totalReworkedUnits: totalReworkUnits,
      totalReworkLaborHours: Number(totalReworkLaborHours.toFixed(1)),
      totalReworkMachineHours: Number(totalReworkMachineHours.toFixed(1)),
      totalReworkCost: Number(totalReworkCost.toFixed(2)),

      totalCopq: Number(totalCopq.toFixed(2)),
      baselineProductionValue,
      copqPercentageOfProduction,

      totalCostSavedViaRework: Number(totalCostSavedViaRework.toFixed(2)),
      reworkSuccessRatePct,
      vitalFewOffendersCount
    };
  }

  public getParetoAnalysis(dimension: ParetoDimension, filters?: ScrapReworkFilters): ParetoAnalysisResult {
    const scrap = this.getScrapRecords(filters);
    const rework = this.getReworkRecords(filters);

    // Map to accumulate costs and counts by dimension key
    const aggMap = new Map<string, {
      key: string;
      label: string;
      subLabel?: string;
      scrapCost: number;
      reworkCost: number;
      scrapUnits: number;
      reworkUnits: number;
      scrapCount: number;
      reworkCount: number;
      reasons: Map<string, number>;
      machines: Map<string, number>;
    }>();

    const getOrCreate = (key: string, label: string, subLabel?: string) => {
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          key,
          label,
          subLabel,
          scrapCost: 0,
          reworkCost: 0,
          scrapUnits: 0,
          reworkUnits: 0,
          scrapCount: 0,
          reworkCount: 0,
          reasons: new Map<string, number>(),
          machines: new Map<string, number>()
        });
      }
      return aggMap.get(key)!;
    };

    // Aggregate Scrap
    for (const s of scrap) {
      let key = '';
      let label = '';
      let subLabel = '';

      switch (dimension) {
        case 'machine':
          key = s.machineId;
          label = s.machineName;
          subLabel = s.machineId;
          break;
        case 'shift':
          key = s.shift;
          label = s.shiftLabel;
          subLabel = s.shift === 'shift_a' ? '06:00 - 14:00' : s.shift === 'shift_b' ? '14:00 - 22:00' : '22:00 - 06:00';
          break;
        case 'operator':
          key = s.operatorId;
          label = s.operatorName;
          subLabel = s.shiftLabel.split(' ')[0] + ' ' + s.shiftLabel.split(' ')[1];
          break;
        case 'reason':
          key = s.reasonCode;
          label = s.reasonName;
          subLabel = s.rootCauseCategory;
          break;
      }

      const item = getOrCreate(key, label, subLabel);
      item.scrapCost += s.netScrapCost;
      item.scrapUnits += s.quantityScrapped;
      item.scrapCount += 1;
      item.reasons.set(s.reasonName, (item.reasons.get(s.reasonName) || 0) + s.netScrapCost);
      item.machines.set(s.machineName, (item.machines.get(s.machineName) || 0) + s.netScrapCost);
    }

    // Aggregate Rework
    for (const r of rework) {
      let key = '';
      let label = '';
      let subLabel = '';

      switch (dimension) {
        case 'machine':
          key = r.machineId;
          label = r.machineName;
          subLabel = r.machineId;
          break;
        case 'shift':
          key = r.shift;
          label = r.shiftLabel;
          subLabel = r.shift === 'shift_a' ? '06:00 - 14:00' : r.shift === 'shift_b' ? '14:00 - 22:00' : '22:00 - 06:00';
          break;
        case 'operator':
          key = r.operatorId;
          label = r.operatorName;
          subLabel = r.shiftLabel.split(' ')[0] + ' ' + r.shiftLabel.split(' ')[1];
          break;
        case 'reason':
          key = r.reasonCode;
          label = r.reasonName;
          subLabel = 'Rework Defect Category';
          break;
      }

      const item = getOrCreate(key, label, subLabel);
      item.reworkCost += r.totalReworkCost;
      item.reworkUnits += r.reworkQuantity;
      item.reworkCount += 1;
      item.reasons.set(r.reasonName, (item.reasons.get(r.reasonName) || 0) + r.totalReworkCost);
      item.machines.set(r.machineName, (item.machines.get(r.machineName) || 0) + r.totalReworkCost);
    }

    // Convert to array and calculate total COPQ
    const rawItems = Array.from(aggMap.values()).map(entry => {
      const totalCost = entry.scrapCost + entry.reworkCost;
      
      // Find top reason or machine
      let topReasonOrMachine = 'N/A';
      let maxCost = -1;
      entry.reasons.forEach((c, name) => {
        if (c > maxCost) {
          maxCost = c;
          topReasonOrMachine = name;
        }
      });

      // Tailored recommendation
      let primaryActionRecommendation = '';
      if (entry.scrapCost > entry.reworkCost * 1.5) {
        primaryActionRecommendation = 'High unrecoverable scrap rate — audit tool wear compensation and CAM simulation.';
      } else if (entry.reworkCost > entry.scrapCost) {
        primaryActionRecommendation = 'Significant secondary rework hours — verify upstream deburring and finish allowances.';
      } else {
        primaryActionRecommendation = 'Continuous preventative maintenance and operator refresher suggested.';
      }

      return {
        id: entry.key,
        key: entry.key,
        label: entry.label,
        subLabel: entry.subLabel,
        scrapCost: Number(entry.scrapCost.toFixed(2)),
        reworkCost: Number(entry.reworkCost.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        scrapUnits: entry.scrapUnits,
        reworkUnits: entry.reworkUnits,
        totalEvents: entry.scrapCount + entry.reworkCount,
        percentage: 0,
        cumulativePercentage: 0,
        isVitalFew: false,
        topReasonOrMachine,
        primaryActionRecommendation
      };
    });

    // Sort descending by total cost (Pareto rule)
    rawItems.sort((a, b) => b.totalCost - a.totalCost);

    const totalCopq = rawItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalEvents = rawItems.reduce((acc, curr) => acc + curr.totalEvents, 0);

    let cumulative = 0;
    let vitalFewCount = 0;

    const items: ParetoBarItem[] = rawItems.map(item => {
      const percentage = totalCopq > 0 ? (item.totalCost / totalCopq) * 100 : 0;
      cumulative += percentage;
      const isVitalFew = cumulative <= 80 || (cumulative - percentage < 80);
      if (isVitalFew) vitalFewCount++;

      return {
        ...item,
        percentage: Number(percentage.toFixed(1)),
        cumulativePercentage: Number(Math.min(100, cumulative).toFixed(1)),
        isVitalFew
      };
    });

    const vitalFewPercentage = totalCopq > 0 && items.length > 0
      ? Number(((items.filter(i => i.isVitalFew).reduce((s, i) => s + i.totalCost, 0) / totalCopq) * 100).toFixed(1))
      : 0;

    return {
      dimension,
      items,
      totalCopq: Number(totalCopq.toFixed(2)),
      totalEvents,
      vitalFewCount,
      vitalFewPercentage
    };
  }

  public getWorkOrdersList() {
    return [
      { id: 'wo-001', number: 'WO-2026-0001', part: 'GB-42T (Gear Blank 42T)', customer: 'Apex Transmission', baseCost: 52.70, revenue: 85.00 },
      { id: 'wo-002', number: 'WO-2026-0002', part: 'DS-45S (Driveshaft Spindle)', customer: 'Kalyani Heavy Axles', baseCost: 110.00, revenue: 165.00 },
      { id: 'wo-003', number: 'WO-2026-0003', part: 'IMP-5X-220 (Titanium Impeller)', customer: 'AeroDynamics Propulsion', baseCost: 655.00, revenue: 1250.00 },
      { id: 'wo-004', number: 'WO-2026-0004', part: 'PCH-180 (Pump Housing)', customer: 'FlowServe Energy', baseCost: 140.00, revenue: 220.00 },
      { id: 'wo-005', number: 'WO-2026-0005', part: 'HMB-AL6061 (Hydraulic Manifold)', customer: 'HydraTech Actuators', baseCost: 81.00, revenue: 135.00 },
      { id: 'wo-006', number: 'WO-2026-0006', part: 'TSR-INC718 (Turbine Seal Ring)', customer: 'Rolls Marine', baseCost: 390.00, revenue: 780.00 },
      { id: 'wo-007', number: 'WO-2026-0007', part: 'SKA-FORG-45 (Steering Knuckle)', customer: 'Mahindra Defense', baseCost: 106.00, revenue: 175.00 }
    ];
  }

  public getMachinesList() {
    return [
      { id: 'MCH-CNC-5AX-01', name: 'Hermle C400 5-Axis Machining Center', type: '5-Axis Milling', rate: 75 },
      { id: 'MCH-CNC-LATHE-02', name: 'Okuma LB3000 EX II CNC Lathe', type: 'CNC Turning', rate: 45 },
      { id: 'MCH-MILL-VMC-03', name: 'Haas VF-4 High Performance VMC', type: '3-Axis Milling', rate: 40 },
      { id: 'MCH-GRIND-STUDER', name: 'Studer S33 Universal Cylindrical Grinder', type: 'Precision Grinding', rate: 55 },
      { id: 'MCH-MILL-INTEGREX', name: 'Mazak Integrex e-500H Mill-Turn', type: 'Mill-Turn Multitasking', rate: 80 },
      { id: 'MCH-PRESS-BRAKE-01', name: 'Amada HG 1303 CNC Press Brake', type: 'Press Brake / Forming', rate: 35 }
    ];
  }

  public getOperatorsList() {
    return [
      { id: 'OP-001', name: 'Rajesh Sharma', role: 'Senior CNC Machinist', shift: 'shift_a' as ShiftType, rate: 30 },
      { id: 'OP-002', name: 'David Miller', role: '5-Axis Specialist', shift: 'shift_b' as ShiftType, rate: 35 },
      { id: 'OP-003', name: 'Vikram Patel', role: 'Lathe Operator', shift: 'shift_c' as ShiftType, rate: 24 },
      { id: 'OP-004', name: 'Sunita Rao', role: 'Metrology & Grinding Tech', shift: 'shift_a' as ShiftType, rate: 28 },
      { id: 'OP-005', name: 'Marcus Vance', role: 'Apprentice Machinist', shift: 'shift_a' as ShiftType, rate: 20 },
      { id: 'OP-006', name: 'Amit Kulkarni', role: 'VMC Setup Tech', shift: 'shift_b' as ShiftType, rate: 26 }
    ];
  }

  public exportCopqAuditCsv(): string {
    const headers = [
      'Record Type',
      'Record ID',
      'Work Order',
      'Customer',
      'Part Code',
      'Part Name',
      'Quantity',
      'Reason Code',
      'Reason Name',
      'Machine',
      'Shift',
      'Operator',
      'Cost Impact ($)',
      'Salvage / Benefit ($)',
      'Status',
      'Timestamp'
    ];

    const scrapRows = this.scrapRecords.map(s => [
      'SCRAP',
      s.scrapNumber,
      s.workOrderNumber,
      `"${s.customerName}"`,
      s.partCode,
      `"${s.partName}"`,
      s.quantityScrapped,
      s.reasonCode,
      `"${s.reasonName}"`,
      `"${s.machineName}"`,
      s.shiftLabel,
      `"${s.operatorName}"`,
      s.netScrapCost.toFixed(2),
      s.totalSalvageCredit.toFixed(2),
      s.status,
      s.recordedAt
    ]);

    const reworkRows = this.reworkRecords.map(r => [
      'REWORK',
      r.reworkNumber,
      r.workOrderNumber,
      `"${r.customerName}"`,
      r.partCode,
      `"${r.partName}"`,
      r.reworkQuantity,
      r.reasonCode,
      `"${r.reasonName}"`,
      `"${r.machineName}"`,
      r.shiftLabel,
      `"${r.operatorName}"`,
      r.totalReworkCost.toFixed(2),
      r.netCostBenefit.toFixed(2),
      r.status,
      r.recordedAt
    ]);

    const csvContent = [headers.join(','), ...scrapRows.map(row => row.join(',')), ...reworkRows.map(row => row.join(','))].join('\n');
    return csvContent;
  }

  public resetToFactoryDefaults(): void {
    this.scrapRecords = [...INITIAL_SCRAP_RECORDS];
    this.reworkRecords = [...INITIAL_REWORK_RECORDS];
    this.saveScrapToStorage();
    this.saveReworkToStorage();
  }
}

export const scrapReworkService = new ScrapReworkService();
