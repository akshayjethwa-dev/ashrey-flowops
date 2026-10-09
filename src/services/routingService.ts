// src/services/routingService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  WorkCenter,
  OperationMasterItem,
  ProductRouting,
  RoutingOperation,
  OperationType,
  SkillLevel
} from '../types/routing';
import { logActivityEvent } from '../utils/activityLogger';

// ── Default Seed Work Centers ──────────────────────────────────
export const SEED_WORK_CENTERS: WorkCenter[] = [
  {
    id: 'wc_saw_01',
    code: 'WC-SAW-01',
    name: 'Kasto Automatic Heavy-Duty Cold Saw',
    department: 'Cutting & Blanking',
    hourlyMachineRate: 450,
    hourlyLaborRate: 220,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Handles solid alloy bars up to 450mm diameter with automated bar feeder'
  },
  {
    id: 'wc_wld_02',
    code: 'WC-WLD-02',
    name: 'ESAB Multi-Process TIG/MIG Welding Bay #2',
    department: 'Fabrication & Welding',
    hourlyMachineRate: 550,
    hourlyLaborRate: 350,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Equipped with 500A pulse MIG, water-cooled TIG, and rotary welding positioner (2 Ton)'
  },
  {
    id: 'wc_cnc_04',
    code: 'WC-CNC-04',
    name: 'Doosan Puma 2600Y CNC Lathe (Live Tooling)',
    department: 'Machine Shop',
    hourlyMachineRate: 1100,
    hourlyLaborRate: 320,
    capacityHoursPerDay: 20,
    status: 'active',
    notes: '12-station BMT65 turret, Y-axis off-center milling capability, Fanuc 0i-TF control'
  },
  {
    id: 'wc_vmc_01',
    code: 'WC-VMC-01',
    name: 'Haas VF-4 4-Axis CNC Machining Center',
    department: 'Machine Shop',
    hourlyMachineRate: 1350,
    hourlyLaborRate: 350,
    capacityHoursPerDay: 20,
    status: 'active',
    notes: '1270 x 508 x 635 mm travels, 10,000 RPM 40-taper spindle, Renishaw wireless probing'
  },
  {
    id: 'wc_ht_01',
    code: 'WC-HT-01',
    name: 'Inductoheat High-Frequency Induction Hardening Bay',
    department: 'Heat Treatment',
    hourlyMachineRate: 850,
    hourlyLaborRate: 280,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Case hardening for gear teeth and bearing journals up to 58-62 HRC'
  },
  {
    id: 'wc_grn_01',
    code: 'WC-GRN-01',
    name: 'Studer S33 Precision CNC Cylindrical Grinder',
    department: 'Finish Grinding',
    hourlyMachineRate: 1200,
    hourlyLaborRate: 340,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Sub-micron OD finish grinding, automated in-process sizing probe'
  },
  {
    id: 'wc_cmm_01',
    code: 'WC-CMM-01',
    name: 'Mitutoyo Crysta-Apex CNC CMM Metrology Lab',
    department: 'Quality Assurance',
    hourlyMachineRate: 950,
    hourlyLaborRate: 400,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Temperature-controlled (20°C ± 0.5°C), scanning probe with 1.7 µm volumetric accuracy'
  },
  {
    id: 'wc_pack_01',
    code: 'WC-PACK-01',
    name: 'VCI Preservation, Slushing & Export Packing Cell',
    department: 'Assembly & Dispatch',
    hourlyMachineRate: 300,
    hourlyLaborRate: 200,
    capacityHoursPerDay: 16,
    status: 'active',
    notes: 'Hot wax dipping, VCI bubble wrap wrapping, phytosanitary ISPM-15 wooden crating'
  }
];

// ── Default Operation Master Items ─────────────────────────────
export const SEED_OPERATION_MASTER: OperationMasterItem[] = [
  {
    id: 'op_cut_01',
    operationCode: 'OP-CUT-01',
    name: 'Cold Band Saw Billet Blanking & Facing',
    operationType: 'cutting',
    defaultWorkCenterId: 'wc_saw_01',
    defaultWorkCenterName: 'Kasto Automatic Heavy-Duty Cold Saw',
    defaultSetupTimeMinutes: 20,
    defaultCycleTimeMinutes: 6.5,
    skillRequirement: {
      level: 'semi_skilled',
      certifications: ['Machine Saw Safety & Material Handling'],
      minCrewSize: 1,
      requiredPpe: ['Safety Glasses', 'Steel-Toe Boots', 'Cut-Resistant Gloves']
    },
    standardInstructions: 'Inspect raw material test certificate. Verify heat number stamped on billet end. Clamp billet securely and cut with +2.5mm face allowance for subsequent turning/milling.',
    qualityCheckpoints: ['Blank overall length ± 0.5mm', 'Squareness of cut within 0.2mm', 'Verify material grade and heat code stamp'],
    safetyNotes: 'Ensure chip conveyor is clear and flood coolant is flowing continuously.'
  },
  {
    id: 'op_wld_01',
    operationCode: 'OP-WLD-01',
    name: 'Multi-Pass TIG/MIG Structural Welding',
    operationType: 'welding',
    defaultWorkCenterId: 'wc_wld_02',
    defaultWorkCenterName: 'ESAB Multi-Process TIG/MIG Welding Bay #2',
    defaultSetupTimeMinutes: 35,
    defaultCycleTimeMinutes: 24,
    skillRequirement: {
      level: 'certified_welder',
      certifications: ['AWS D1.1 Structural Welding Certification 3G/4G'],
      minCrewSize: 1,
      requiredPpe: ['Auto-Darkening Welding Helmet', 'Leather Welding Jacket', 'Gauntlet Gloves', 'Respirator']
    },
    standardInstructions: 'Pre-heat joint to 120°C using digital induction heating. Tack weld symmetrically to prevent angular distortion. Execute root pass with ER70S-6 wire, followed by dual capping passes. De-slag and wire-brush thoroughly.',
    qualityCheckpoints: ['100% visual inspection for undercut, porosity, or cold overlap', 'Fillet weld throat thickness ≥ 8mm', 'Dye Penetrant Testing (DPT) on critical structural joints'],
    safetyNotes: 'Deploy localized fume extraction hood over welding puddle at all times.'
  },
  {
    id: 'op_cnc_01',
    operationCode: 'OP-CNC-01',
    name: 'CNC 2-Axis / 3-Axis Precision Turning & Facing',
    operationType: 'turning',
    defaultWorkCenterId: 'wc_cnc_04',
    defaultWorkCenterName: 'Doosan Puma 2600Y CNC Lathe (Live Tooling)',
    defaultSetupTimeMinutes: 45,
    defaultCycleTimeMinutes: 14.5,
    skillRequirement: {
      level: 'skilled_operator',
      certifications: ['Fanuc CNC Lathe Level II Operator', 'Precision GD&T Measurement'],
      minCrewSize: 1,
      requiredPpe: ['Safety Glasses with Side Shields', 'Ear Protection', 'Safety Footwear']
    },
    standardInstructions: 'Load NC program O2401. Mount soft jaws turned to Ø180mm. Clock component face within 0.015mm TIR. Rough turn OD with CNMG insert, then execute finish pass using VNMG diamond tip with flood emulsion coolant.',
    qualityCheckpoints: ['OD tolerance 120.000 +0.015/-0.000 mm', 'Surface finish Ra ≤ 1.6 µm', 'Concentricity between bearing journal and seal shoulder ≤ 0.02 mm TIR'],
    safetyNotes: 'Close machine door before spindle cycle start. Never clear chips by hand; use brass scraper.'
  },
  {
    id: 'op_vmc_01',
    operationCode: 'OP-VMC-01',
    name: '4-Axis VMC Milling, Pocketing & Keyway Broaching',
    operationType: 'milling',
    defaultWorkCenterId: 'wc_vmc_01',
    defaultWorkCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
    defaultSetupTimeMinutes: 50,
    defaultCycleTimeMinutes: 18,
    skillRequirement: {
      level: 'cnc_programmer',
      certifications: ['CNC Milling 4-Axis Programming', 'Renishaw Part Probing Certified'],
      minCrewSize: 1,
      requiredPpe: ['Safety Glasses', 'Safety Footwear', 'Ear Defenders']
    },
    standardInstructions: 'Clamp blank in 4-axis hydraulic vise. Touch off work zero using Renishaw OMP40 probe. Mill pocketing features with 20mm carbide solid end mill. Chamfer all sharp edges 0.5 x 45° with spot drill.',
    qualityCheckpoints: ['Pocket depth 35.00 ± 0.05 mm', 'Bolt hole PCD pitch circular accuracy within 0.025 mm', 'Deburr all holes and slot transitions'],
    safetyNotes: 'Verify spindle tool clearance before cycle start.'
  },
  {
    id: 'op_ht_01',
    operationCode: 'OP-HT-01',
    name: 'Induction Case Hardening & Stress Relief',
    operationType: 'heat_treatment',
    defaultWorkCenterId: 'wc_ht_01',
    defaultWorkCenterName: 'Inductoheat High-Frequency Induction Hardening Bay',
    defaultSetupTimeMinutes: 30,
    defaultCycleTimeMinutes: 8,
    skillRequirement: {
      level: 'senior_technician',
      certifications: ['Metallurgical Heat Treat Operator Level II'],
      minCrewSize: 1,
      requiredPpe: ['Heat-Resistant Kevlar Gloves', 'Face Shield', 'Leather Apron']
    },
    standardInstructions: 'Align induction coil over teeth profile with 1.2mm air gap. Program scan rate 4.5 mm/sec at 850°C. Immediate polymer quench at 4 bar pressure. Temper in convection furnace at 180°C for 2 hours.',
    qualityCheckpoints: ['Surface hardness 58 to 62 HRC', 'Effective case depth 1.8 to 2.2 mm at pitch line', 'Check for quench micro-cracking with MPI'],
    safetyNotes: 'Beware of high voltage RF power and hot polymer vapor.'
  },
  {
    id: 'op_insp_01',
    operationCode: 'OP-INSP-01',
    name: 'CMM Dimensional Inspection & Quality Verification',
    operationType: 'inspection',
    defaultWorkCenterId: 'wc_cmm_01',
    defaultWorkCenterName: 'Mitutoyo Crysta-Apex CNC CMM Metrology Lab',
    defaultSetupTimeMinutes: 25,
    defaultCycleTimeMinutes: 10,
    skillRequirement: {
      level: 'certified_inspector',
      certifications: ['ISO 9001 / AS9100 Certified Quality Inspector', 'CMM MCOSMOS Software Proficiency'],
      minCrewSize: 1,
      requiredPpe: ['Clean Lab Coat', 'Cotton Handling Gloves']
    },
    standardInstructions: 'Allow part to soak in 20°C metrology room for minimum 30 minutes. Mount on kinematic fixture. Run automated CMM inspection routine CMM_ASM_GBX. Print dimensional certificate and upload into quality register.',
    qualityCheckpoints: ['100% check critical bearing seat dimensions', 'True position of all bolt holes', 'Form tolerances (perpendicularity, cylindricity, runout)'],
    safetyNotes: 'Keep probe stylus clean with alcohol wipe before running calibration sphere.'
  },
  {
    id: 'op_pck_01',
    operationCode: 'OP-PCK-01',
    name: 'VCI Preservation, Slushing & Export Packing',
    operationType: 'packing',
    defaultWorkCenterId: 'wc_pack_01',
    defaultWorkCenterName: 'VCI Preservation, Slushing & Export Packing Cell',
    defaultSetupTimeMinutes: 15,
    defaultCycleTimeMinutes: 7,
    skillRequirement: {
      level: 'semi_skilled',
      certifications: ['Export Packaging & Hazardous Material Handling'],
      minCrewSize: 1,
      requiredPpe: ['Chemical Resistant Gloves', 'Safety Glasses', 'Safety Footwear']
    },
    standardInstructions: 'Degrease part with solvent wipe. Dip in rust preventive VCI oil (MIL-PRF-16173 Grade 3). Wrap tightly in VCI reinforced poly-kraft paper. Pack in wooden crate with desiccants. Band with steel strapping.',
    qualityCheckpoints: ['100% rust-free surface before preservation', 'Verify desiccants sealed inside bag', 'Apply shipping barcode label, part tag, and lifting points'],
    safetyNotes: 'Ensure ventilation during solvent wiping and rust-preventive oil handling.'
  }
];

// ── Default Seed Product Routings ──────────────────────────────
export const getSeedRoutings = (tenantId: string): ProductRouting[] => [
  {
    id: `rt_gbx_500_${tenantId}`,
    tenantId,
    routingNumber: 'RT-GBX-500-01',
    partNumber: 'ASM-GBX-500',
    partName: 'Industrial Planetary Speed Reducer 500Nm (1:16)',
    description: 'Master routing sequence defining Cutting → Welding → Machining → Inspection → Packing for heavy duty planetary speed reducers',
    category: 'Gearboxes & Transmissions',
    revision: 'Rev 1.0',
    status: 'active',
    targetBatchSize: 50,
    totalSetupTimeMinutes: 190,
    totalCycleTimeMinutes: 74,
    totalStandardCostPerUnit: 2850,
    drawingNumber: 'DWG-GBX-500-ASSY',
    drawingRevision: 'B.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedBy: 'Engineering Manager',
    approvedAt: new Date().toISOString(),
    notes: 'Approved production baseline routing with verified cycle times.',
    operations: [
      {
        id: 'rt_op_10',
        sequenceNumber: 10,
        operationCode: 'OP-CUT-01',
        name: 'Band Saw Raw Material Blanking',
        operationType: 'cutting',
        workCenterId: 'wc_saw_01',
        workCenterName: 'Kasto Automatic Heavy-Duty Cold Saw',
        workCenterCode: 'WC-SAW-01',
        setupTimeMinutes: 20,
        cycleTimeMinutes: 6.5,
        queueTimeHours: 1,
        scrapRatePercent: 1.5,
        skillLevel: 'semi_skilled',
        certificationsRequired: ['Cold Saw Safety'],
        crewSize: 1,
        instructions: 'Cut forging billet blanks to length with +3.0mm face allowance. Stamp heat lot number on blank end.',
        toolingFixtures: 'Bimetal band saw blade 4-6 TPI, flood coolant',
        qualityInspectionCriteria: 'Length ±0.5mm, squareness within 0.2mm',
        safetyPpe: ['Safety Glasses', 'Steel-Toe Boots', 'Cut-Resistant Gloves']
      },
      {
        id: 'rt_op_20',
        sequenceNumber: 20,
        operationCode: 'OP-WLD-01',
        name: 'Planetary Carrier Flange Welding & Dressing',
        operationType: 'welding',
        workCenterId: 'wc_wld_02',
        workCenterName: 'ESAB Multi-Process TIG/MIG Welding Bay #2',
        workCenterCode: 'WC-WLD-02',
        setupTimeMinutes: 35,
        cycleTimeMinutes: 22,
        queueTimeHours: 2,
        scrapRatePercent: 1.0,
        skillLevel: 'certified_welder',
        certificationsRequired: ['AWS D1.1 Certified Welder'],
        crewSize: 1,
        instructions: 'Preheat flange assembly to 120°C. Execute structural fillet welds in 2 continuous passes. Grind spatter flush.',
        toolingFixtures: 'Rotary clamping jig #WLD-500, ESAB 500A Torch',
        qualityInspectionCriteria: '100% visual check, fillet throat ≥ 8mm, zero porosity',
        safetyPpe: ['Welding Shield', 'Leather Apron', 'Welding Gloves']
      },
      {
        id: 'rt_op_30',
        sequenceNumber: 30,
        operationCode: 'OP-CNC-01',
        name: 'CNC 4-Axis Turning & Precision Boring',
        operationType: 'turning',
        workCenterId: 'wc_cnc_04',
        workCenterName: 'Doosan Puma 2600Y CNC Lathe (Live Tooling)',
        workCenterCode: 'WC-CNC-04',
        setupTimeMinutes: 45,
        cycleTimeMinutes: 18.5,
        queueTimeHours: 1.5,
        scrapRatePercent: 0.8,
        skillLevel: 'skilled_operator',
        certificationsRequired: ['Fanuc CNC Level II'],
        crewSize: 1,
        instructions: 'Rough and finish turn bearing housing OD and internal seal seats. Thread casing tie-rod holes with live tool tap.',
        toolingFixtures: 'Soft jaws Ø220mm, Kennametal CNMG 120408, Walter Bore Bar',
        qualityInspectionCriteria: 'Bore Ø65.000 +0.012/-0.000 mm, TIR ≤ 0.015mm, Ra 1.6',
        safetyPpe: ['Safety Glasses', 'Safety Footwear', 'Ear Defenders']
      },
      {
        id: 'rt_op_40',
        sequenceNumber: 40,
        operationCode: 'OP-VMC-01',
        name: 'VMC 4-Axis Planetary Cavity Milling',
        operationType: 'milling',
        workCenterId: 'wc_vmc_01',
        workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
        workCenterCode: 'WC-VMC-01',
        setupTimeMinutes: 40,
        cycleTimeMinutes: 15,
        queueTimeHours: 1,
        scrapRatePercent: 0.5,
        skillLevel: 'cnc_programmer',
        certificationsRequired: ['VMC 4-Axis Programming'],
        crewSize: 1,
        instructions: 'Mill planet pin pockets, lubrication cross-holes, and casing dowel holes. Deburr all transitions.',
        toolingFixtures: 'Custom modular fixture #VMC-GBX-40, Renishaw OMP40 probe',
        qualityInspectionCriteria: 'Planet pin centers true position within 0.02mm',
        safetyPpe: ['Safety Glasses', 'Ear Defenders']
      },
      {
        id: 'rt_op_50',
        sequenceNumber: 50,
        operationCode: 'OP-INSP-01',
        name: 'CMM Dimensional Metrology & Quality Audit',
        operationType: 'inspection',
        workCenterId: 'wc_cmm_01',
        workCenterName: 'Mitutoyo Crysta-Apex CNC CMM Metrology Lab',
        workCenterCode: 'WC-CMM-01',
        setupTimeMinutes: 25,
        cycleTimeMinutes: 8,
        queueTimeHours: 0.5,
        scrapRatePercent: 0,
        skillLevel: 'certified_inspector',
        certificationsRequired: ['Certified Quality Inspector (CQI)'],
        crewSize: 1,
        instructions: 'Run automated CMM inspection program CMM_GBX_500. Generate dimensional certificate and stamp serial number.',
        toolingFixtures: 'Kinematic 3-point locating fixture, 3mm ruby stylus',
        qualityInspectionCriteria: '100% verification of all key tolerances; generate report',
        safetyPpe: ['Clean Metrology Coat', 'Cotton Gloves']
      },
      {
        id: 'rt_op_60',
        sequenceNumber: 60,
        operationCode: 'OP-PCK-01',
        name: 'VCI Preservation, Slushing & Wooden Crate Packing',
        operationType: 'packing',
        workCenterId: 'wc_pack_01',
        workCenterName: 'VCI Preservation, Slushing & Export Packing Cell',
        workCenterCode: 'WC-PACK-01',
        setupTimeMinutes: 15,
        cycleTimeMinutes: 4,
        queueTimeHours: 0,
        scrapRatePercent: 0,
        skillLevel: 'semi_skilled',
        certificationsRequired: ['Export Packaging Standard ISPM-15'],
        crewSize: 1,
        instructions: 'Degrease and apply VCI rust-inhibiting fluid. Wrap in VCI bubble barrier and crate in export-grade pine box.',
        toolingFixtures: 'VCI dip tank, pneumatic nailer, strapping dispenser',
        qualityInspectionCriteria: 'Zero rust/contaminants; verify test certificate packet included',
        safetyPpe: ['Chemical Resistant Gloves', 'Safety Glasses']
      }
    ]
  },
  {
    id: `rt_car_flg_${tenantId}`,
    tenantId,
    routingNumber: 'RT-CAR-FLG-01',
    partNumber: 'PRT-CAR-FLG-01',
    partName: 'Planetary Carrier Flange',
    description: 'Precision turned and milled ductile iron carrier component with weight-reduction scalloped pockets',
    category: 'Machined Components',
    revision: 'Rev 2.0',
    status: 'active',
    targetBatchSize: 100,
    totalSetupTimeMinutes: 135,
    totalCycleTimeMinutes: 44,
    totalStandardCostPerUnit: 1420,
    drawingNumber: 'DWG-CAR-01',
    drawingRevision: 'B.1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedBy: 'Engineering Manager',
    approvedAt: new Date().toISOString(),
    notes: 'Updated per ECO-2026-0031 with scalloped pocket CNC milling.',
    operations: [
      {
        id: 'rt_flg_10',
        sequenceNumber: 10,
        operationCode: 'OP-CUT-01',
        name: 'Ductile Iron Billet Cold Sawing',
        operationType: 'cutting',
        workCenterId: 'wc_saw_01',
        workCenterName: 'Kasto Automatic Heavy-Duty Cold Saw',
        workCenterCode: 'WC-SAW-01',
        setupTimeMinutes: 15,
        cycleTimeMinutes: 5,
        queueTimeHours: 1,
        scrapRatePercent: 1.0,
        skillLevel: 'semi_skilled',
        crewSize: 1,
        instructions: 'Saw continuous cast ductile iron EN-GJS-500-7 bar into discs of 165mm thickness.',
        toolingFixtures: 'TCT Carbide tipped saw blade',
        qualityInspectionCriteria: 'Thickness ±0.3mm',
        safetyPpe: ['Safety Glasses', 'Safety Footwear']
      },
      {
        id: 'rt_flg_20',
        sequenceNumber: 20,
        operationCode: 'OP-CNC-01',
        name: 'CNC 2-Sided Turning & Register Boring',
        operationType: 'turning',
        workCenterId: 'wc_cnc_04',
        workCenterName: 'Doosan Puma 2600Y CNC Lathe (Live Tooling)',
        workCenterCode: 'WC-CNC-04',
        setupTimeMinutes: 40,
        cycleTimeMinutes: 16,
        queueTimeHours: 1,
        scrapRatePercent: 0.8,
        skillLevel: 'skilled_operator',
        crewSize: 1,
        instructions: 'Turn Op 1 (face, OD, bore), flip in soft jaws and turn Op 2 (reverse face, spigot register).',
        toolingFixtures: 'Custom pie jaws Ø190mm, CNMG 120412 rougher',
        qualityInspectionCriteria: 'Spigot Ø140.000 +0.018/-0.000 mm, Runout 0.015mm',
        safetyPpe: ['Safety Glasses', 'Ear Defenders']
      },
      {
        id: 'rt_flg_30',
        sequenceNumber: 30,
        operationCode: 'OP-VMC-01',
        name: 'VMC 4-Axis Pocketing & Pin Bore Broaching',
        operationType: 'milling',
        workCenterId: 'wc_vmc_01',
        workCenterName: 'Haas VF-4 4-Axis CNC Machining Center',
        workCenterCode: 'WC-VMC-01',
        setupTimeMinutes: 45,
        cycleTimeMinutes: 14,
        queueTimeHours: 1,
        scrapRatePercent: 0.5,
        skillLevel: 'cnc_programmer',
        crewSize: 1,
        instructions: 'Mill 3 scalloped mass-reduction pockets and precision ream 3 planet pin holes at 120° spacing.',
        toolingFixtures: 'Hydraulic expansion arbor fixture, Mapal carbide reamer',
        qualityInspectionCriteria: 'Pin hole Ø28.000 +0.008/-0.000 mm, angular spacing ±10 arc-sec',
        safetyPpe: ['Safety Glasses', 'Ear Protection']
      },
      {
        id: 'rt_flg_40',
        sequenceNumber: 40,
        operationCode: 'OP-INSP-01',
        name: 'Metrology Coordinate Inspection',
        operationType: 'inspection',
        workCenterId: 'wc_cmm_01',
        workCenterName: 'Mitutoyo Crysta-Apex CNC CMM Metrology Lab',
        workCenterCode: 'WC-CMM-01',
        setupTimeMinutes: 20,
        cycleTimeMinutes: 6,
        queueTimeHours: 0.5,
        scrapRatePercent: 0,
        skillLevel: 'certified_inspector',
        crewSize: 1,
        instructions: 'Inspect all 3 pin hole locations, parallelism to mounting flange, and pocket depth.',
        toolingFixtures: 'Mitutoyo star probe setup',
        qualityInspectionCriteria: 'Full CMM data report generation and archive',
        safetyPpe: ['Clean Metrology Coat']
      },
      {
        id: 'rt_flg_50',
        sequenceNumber: 50,
        operationCode: 'OP-PCK-01',
        name: 'Dipping Preservation & Pallet Kitting',
        operationType: 'packing',
        workCenterId: 'wc_pack_01',
        workCenterName: 'VCI Preservation, Slushing & Export Packing Cell',
        workCenterCode: 'WC-PACK-01',
        setupTimeMinutes: 15,
        cycleTimeMinutes: 3,
        queueTimeHours: 0,
        scrapRatePercent: 0,
        skillLevel: 'semi_skilled',
        crewSize: 1,
        instructions: 'Dip in rust preventive oil, wrap in VCI film, and place into internal production kitting bin.',
        toolingFixtures: 'Dip tank, foam separator trays',
        qualityInspectionCriteria: 'No bare metal exposed; part identification tag affixed',
        safetyPpe: ['Chemical Resistant Gloves']
      }
    ]
  }
];

// ── Calculations ───────────────────────────────────────────────

/**
 * Calculates total setup time, total cycle time, and standard unit cost for a routing
 */
export function calculateRoutingTotals(
  routing: ProductRouting,
  workCenters: WorkCenter[]
): {
  totalSetupTimeMinutes: number;
  totalCycleTimeMinutes: number;
  totalStandardCostPerUnit: number;
} {
  let totalSetup = 0;
  let totalCycle = 0;
  let totalCost = 0;

  const batchSize = Math.max(1, routing.targetBatchSize || 50);

  for (const op of routing.operations) {
    totalSetup += op.setupTimeMinutes || 0;
    totalCycle += op.cycleTimeMinutes || 0;

    const wc = workCenters.find(w => w.id === op.workCenterId || w.code === op.workCenterCode);
    const machineHourly = wc ? wc.hourlyMachineRate : 800;
    const laborHourly = wc ? wc.hourlyLaborRate : 300;
    const totalHourlyRate = machineHourly + laborHourly;

    // Unit machine+labor cost = (setupTime / batchSize + cycleTime) in hours * totalHourlyRate
    const opHoursPerUnit = ((op.setupTimeMinutes || 0) / batchSize + (op.cycleTimeMinutes || 0)) / 60;
    const opCost = Math.round(opHoursPerUnit * totalHourlyRate * 100) / 100;
    op.estimatedCostPerUnit = opCost;
    totalCost += opCost;
  }

  return {
    totalSetupTimeMinutes: totalSetup,
    totalCycleTimeMinutes: totalCycle,
    totalStandardCostPerUnit: Math.round(totalCost * 100) / 100
  };
}

/**
 * Estimates batch execution times and costs based on custom batch size
 */
export function calculateBatchEstimate(
  routing: ProductRouting,
  batchQuantity: number,
  workCenters: WorkCenter[]
): {
  batchQuantity: number;
  totalSetupMinutes: number;
  totalRunMinutes: number;
  totalBatchMinutes: number;
  totalBatchHours: number;
  shiftsRequired: number; // 8 hrs per shift
  estimatedTotalBatchCostINR: number;
  unitCostINR: number;
} {
  const qty = Math.max(1, batchQuantity);
  let totalSetup = 0;
  let totalRun = 0;
  let totalCost = 0;

  for (const op of routing.operations) {
    const opSetup = op.setupTimeMinutes || 0;
    const opRun = (op.cycleTimeMinutes || 0) * qty;

    totalSetup += opSetup;
    totalRun += opRun;

    const wc = workCenters.find(w => w.id === op.workCenterId || w.code === op.workCenterCode);
    const totalHourlyRate = (wc?.hourlyMachineRate || 800) + (wc?.hourlyLaborRate || 300);

    const opTotalHours = (opSetup + opRun) / 60;
    totalCost += opTotalHours * totalHourlyRate;
  }

  const totalBatchMinutes = totalSetup + totalRun;
  const totalBatchHours = Math.round((totalBatchMinutes / 60) * 10) / 10;
  const shiftsRequired = Math.round((totalBatchHours / 8) * 10) / 10;
  const roundedCost = Math.round(totalCost);
  const unitCostINR = Math.round((roundedCost / qty) * 100) / 100;

  return {
    batchQuantity: qty,
    totalSetupMinutes: totalSetup,
    totalRunMinutes: totalRun,
    totalBatchMinutes,
    totalBatchHours,
    shiftsRequired,
    estimatedTotalBatchCostINR: roundedCost,
    unitCostINR
  };
}

// ── Persistence & CRUD APIs ────────────────────────────────────

export async function fetchWorkCenters(
  tenantId: string,
  isSandboxMode: boolean = false
): Promise<WorkCenter[]> {
  const cacheKey = `flowops_work_centers_${tenantId}`;

  if (isSandboxMode) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached work centers:', e);
      }
    }
    localStorage.setItem(cacheKey, JSON.stringify(SEED_WORK_CENTERS));
    return SEED_WORK_CENTERS;
  }

  try {
    const colRef = collection(db, 'tenants', tenantId, 'workCenters');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkCenter));
    }
    // Seed if empty
    for (const wc of SEED_WORK_CENTERS) {
      await setDoc(doc(db, 'tenants', tenantId, 'workCenters', wc.id), wc);
    }
    return SEED_WORK_CENTERS;
  } catch (e) {
    console.warn('Firestore fetch failed for work centers, fallback to local:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : SEED_WORK_CENTERS;
  }
}

export async function saveWorkCenter(
  tenantId: string,
  workCenter: WorkCenter,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_work_centers_${tenantId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    const list: WorkCenter[] = cached ? JSON.parse(cached) : [...SEED_WORK_CENTERS];
    const idx = list.findIndex(w => w.id === workCenter.id);
    if (idx >= 0) list[idx] = workCenter;
    else list.push(workCenter);
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Cache save failed for work center:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'workCenters', workCenter.id), workCenter);
    } catch (e) {
      console.error('Firestore save failed for work center:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:workcenters_updated'));
  }
}

export async function fetchOperationMaster(
  tenantId: string,
  isSandboxMode: boolean = false
): Promise<OperationMasterItem[]> {
  const cacheKey = `flowops_operation_master_${tenantId}`;

  if (isSandboxMode) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached operation master:', e);
      }
    }
    localStorage.setItem(cacheKey, JSON.stringify(SEED_OPERATION_MASTER));
    return SEED_OPERATION_MASTER;
  }

  try {
    const colRef = collection(db, 'tenants', tenantId, 'operationMaster');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as OperationMasterItem));
    }
    for (const op of SEED_OPERATION_MASTER) {
      await setDoc(doc(db, 'tenants', tenantId, 'operationMaster', op.id), op);
    }
    return SEED_OPERATION_MASTER;
  } catch (e) {
    console.warn('Firestore fetch failed for operation master, fallback to local:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : SEED_OPERATION_MASTER;
  }
}

export async function saveOperationMasterItem(
  tenantId: string,
  op: OperationMasterItem,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_operation_master_${tenantId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    const list: OperationMasterItem[] = cached ? JSON.parse(cached) : [...SEED_OPERATION_MASTER];
    const idx = list.findIndex(o => o.id === op.id);
    if (idx >= 0) list[idx] = op;
    else list.push(op);
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Cache save failed for operation master item:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'operationMaster', op.id), op);
    } catch (e) {
      console.error('Firestore save failed for operation master:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:operation_master_updated'));
  }
}

export async function fetchProductRoutings(
  tenantId: string,
  isSandboxMode: boolean = false
): Promise<ProductRouting[]> {
  const cacheKey = `flowops_product_routings_${tenantId}`;

  if (isSandboxMode) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached routings:', e);
      }
    }
    const seeds = getSeedRoutings(tenantId);
    localStorage.setItem(cacheKey, JSON.stringify(seeds));
    return seeds;
  }

  try {
    const colRef = collection(db, 'tenants', tenantId, 'productRoutings');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductRouting));
    }
    const seeds = getSeedRoutings(tenantId);
    for (const rt of seeds) {
      await setDoc(doc(db, 'tenants', tenantId, 'productRoutings', rt.id), rt);
    }
    return seeds;
  } catch (e) {
    console.warn('Firestore fetch failed for product routings, fallback to local:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : getSeedRoutings(tenantId);
  }
}

export async function saveProductRouting(
  tenantId: string,
  routing: ProductRouting,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_product_routings_${tenantId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    const list: ProductRouting[] = cached ? JSON.parse(cached) : getSeedRoutings(tenantId);
    const idx = list.findIndex(r => r.id === routing.id);
    if (idx >= 0) list[idx] = routing;
    else list.unshift(routing);
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn('Cache save failed for routing:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'productRoutings', routing.id), routing);
    } catch (e) {
      console.error('Firestore save failed for routing:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:routings_updated'));
  }
}

export async function deleteProductRouting(
  tenantId: string,
  routingId: string,
  isSandboxMode: boolean = false
): Promise<void> {
  const cacheKey = `flowops_product_routings_${tenantId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const list: ProductRouting[] = JSON.parse(cached);
      const filtered = list.filter(r => r.id !== routingId);
      localStorage.setItem(cacheKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Cache delete failed for routing:', e);
  }

  if (!isSandboxMode && db) {
    try {
      await deleteDoc(doc(db, 'tenants', tenantId, 'productRoutings', routingId));
    } catch (e) {
      console.error('Firestore delete failed for routing:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowops:routings_updated'));
  }
}
