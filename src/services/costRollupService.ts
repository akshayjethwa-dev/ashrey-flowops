// src/services/costRollupService.ts

import {
  WorkOrderCostRollup,
  MaterialConsumptionRecord,
  LaborCostRecord,
  MachineCostRecord,
  SubcontractCostRecord,
  OverheadAllocationConfig,
  OverheadAllocationMethod,
  MarginHealthStatus,
  CostRollupSummaryKPIs,
  CostRollupFilterParams,
  MaterialIssueInput
} from '../types/costRollup';
import { timeCaptureService } from './timeCaptureService';

const STORAGE_KEY_OVERHEAD_CONFIGS = 'flowops_cost_rollup_overhead_configs';
const STORAGE_KEY_ACTIVE_OVERHEAD_ID = 'flowops_cost_rollup_active_overhead_id';
const STORAGE_KEY_CUSTOM_MATERIAL_ISSUES = 'flowops_cost_rollup_material_issues';
const STORAGE_KEY_PRICING_OVERRIDES = 'flowops_cost_rollup_pricing_overrides';

// ── 1. Default Overhead Allocation Rules ──────────────────────────
export const DEFAULT_OVERHEAD_CONFIGS: OverheadAllocationConfig[] = [
  {
    id: 'ovh-hybrid-standard',
    name: 'Precision Engineering Standard (Hybrid DL + MHR)',
    isDefault: true,
    method: 'hybrid_industrial',
    laborOverheadPercent: 110,         // 110% of Direct Labor
    machineHourOverheadRate: 160,      // ₹160 per machine operating hour
    primeCostOverheadPercent: 0,
    factoryFixedRatePerUnit: 35,       // ₹35 tooling & coolant levy per unit
    generalAdminSgaPercent: 7.5,       // 7.5% Selling, General & Admin
    facilityPowerTariffPerKwh: 8.80,
    notes: 'Standard industrial absorption costing recommended for batch precision machining.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ovh-direct-labor-pct',
    name: 'Labor Intensive Absorption (160% of Direct Labor)',
    isDefault: false,
    method: 'percent_direct_labor',
    laborOverheadPercent: 160,
    machineHourOverheadRate: 0,
    primeCostOverheadPercent: 0,
    factoryFixedRatePerUnit: 0,
    generalAdminSgaPercent: 8.0,
    facilityPowerTariffPerKwh: 8.80,
    notes: 'Best for high-manual touch assembly, welding, and manual deburring operations.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ovh-machine-hour-rate',
    name: 'Capital Heavy / CNC Heavy (₹320 / Machine Hour)',
    isDefault: false,
    method: 'per_machine_hour',
    laborOverheadPercent: 0,
    machineHourOverheadRate: 320,
    primeCostOverheadPercent: 0,
    factoryFixedRatePerUnit: 0,
    generalAdminSgaPercent: 6.0,
    facilityPowerTariffPerKwh: 8.80,
    notes: 'Ideal for 5-axis and automated cell facilities where machine run-time drives capital absorption.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ovh-prime-cost-pct',
    name: 'Prime Cost Allocation (16% of Direct Mfg Cost)',
    isDefault: false,
    method: 'percent_prime_cost',
    laborOverheadPercent: 0,
    machineHourOverheadRate: 0,
    primeCostOverheadPercent: 16.0,
    factoryFixedRatePerUnit: 0,
    generalAdminSgaPercent: 7.0,
    facilityPowerTariffPerKwh: 8.80,
    notes: 'Balanced allocation across material, labor, and machine inputs.',
    updatedAt: new Date().toISOString()
  }
];

// ── 2. Standard Machine Hourly & Power Rates ─────────────────────
const MACHINE_RATE_REGISTRY: Record<string, {
  name: string;
  hourlyRate: number;
  setupHourlyRate: number;
  powerRatingKw: number;
  depreciationPerHr: number;
  toolingAllowancePerHr: number;
}> = {
  'WC-CNC-04': {
    name: 'Doosan Puma CNC Lathe #04',
    hourlyRate: 520,
    setupHourlyRate: 380,
    powerRatingKw: 11,
    depreciationPerHr: 120,
    toolingAllowancePerHr: 70
  },
  'WC-HOB-01': {
    name: 'Liebherr CNC Gear Hobber #01',
    hourlyRate: 750,
    setupHourlyRate: 550,
    powerRatingKw: 18,
    depreciationPerHr: 190,
    toolingAllowancePerHr: 110
  },
  'WC-SAW-02': {
    name: 'Kasto Horizontal Band Saw #02',
    hourlyRate: 260,
    setupHourlyRate: 180,
    powerRatingKw: 5.5,
    depreciationPerHr: 40,
    toolingAllowancePerHr: 25
  },
  'WC-VMC-01': {
    name: 'Mazak Variaxis 5-Axis VMC #01',
    hourlyRate: 1250,
    setupHourlyRate: 750,
    powerRatingKw: 28,
    depreciationPerHr: 350,
    toolingAllowancePerHr: 180
  },
  'WC-VMC-02': {
    name: 'Haas VF-2 3-Axis VMC #02',
    hourlyRate: 650,
    setupHourlyRate: 450,
    powerRatingKw: 15,
    depreciationPerHr: 160,
    toolingAllowancePerHr: 90
  },
  'WC-CMM-01': {
    name: 'Zeiss Contura CMM Metrology Lab',
    hourlyRate: 480,
    setupHourlyRate: 350,
    powerRatingKw: 3.5,
    depreciationPerHr: 150,
    toolingAllowancePerHr: 20
  },
  'WC-WLD-02': {
    name: 'ESAB Heavy MIG/TIG Welding Cell #02',
    hourlyRate: 380,
    setupHourlyRate: 250,
    powerRatingKw: 14,
    depreciationPerHr: 70,
    toolingAllowancePerHr: 60
  },
  'DEFAULT': {
    name: 'Standard CNC Work Center',
    hourlyRate: 500,
    setupHourlyRate: 350,
    powerRatingKw: 10,
    depreciationPerHr: 100,
    toolingAllowancePerHr: 50
  }
};

// ── 3. Seed Base Work Order Master Cost Profiles ─────────────────
interface WorkOrderSeedCostProfile {
  workOrderId: string;
  workOrderNumber: string;
  plantId: string;
  plantName: string;
  salesOrderNumber: string;
  quoteNumber: string;
  customerPoNumber: string;
  customerName: string;
  partCode: string;
  partName: string;
  quantity: number;
  quantityCompleted: number;
  quantityScrapped: number;
  orderStatus: string;
  priority: string;
  dueDate: string;
  contractPricePerUnit: number;
  materials: MaterialConsumptionRecord[];
  subcontracts: SubcontractCostRecord[];
  standardLaborHours: number;
  standardMachineHours: number;
}

const SEED_WORK_ORDER_COST_PROFILES: WorkOrderSeedCostProfile[] = [
  {
    workOrderId: 'wo_seed_1',
    workOrderNumber: 'WO-2026-0001',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge & Machine Facility',
    salesOrderNumber: 'SO-2026-0012',
    quoteNumber: 'Q-9021',
    customerPoNumber: 'PO-TAT-8921',
    customerName: 'Tata Motors Powertrain Div',
    partCode: 'GB-42T',
    partName: 'Gear Blank — 42T Differential Pinion',
    quantity: 250,
    quantityCompleted: 120,
    quantityScrapped: 3,
    orderStatus: 'in_progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    contractPricePerUnit: 2450, // Selling price ₹2,450/unit
    standardLaborHours: 14.5,
    standardMachineHours: 12.0,
    materials: [
      {
        id: 'mat-wo1-01',
        workOrderId: 'wo_seed_1',
        workOrderNumber: 'WO-2026-0001',
        bomItemId: 'bom-gb-1',
        materialCode: 'RM-EN353-RD140',
        materialName: 'EN353 / 20MnCr5 Forged Round Billet Ø140mm x 90mm',
        materialGrade: 'EN353 Case Hardening Alloy Steel',
        lotNumber: 'LOT-2026-EN353-882',
        heatNumber: 'HT-JINDAL-9941',
        storeLocation: 'Pune Heavy Forge — Main Raw Materials Store',
        binCode: 'ST-RM01 / Bin A-04-12',
        standardRequiredQty: 263,
        actualIssuedQty: 275,       // +12 extra issued for setup bar ends & cut face cleaning
        unit: 'pcs',
        standardUnitCost: 850,
        actualUnitCost: 865,        // Inbound invoice rate with freight
        standardTotalCost: 263 * 850, // ₹223,550
        actualTotalCost: 275 * 865,   // ₹237,875
        varianceCost: (275 * 865) - (263 * 850), // +₹14,325 (+6.4%)
        variancePercent: 6.41,
        scrapWasteQty: 12,
        issuedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        issuedByOperator: 'Anand V. (Stores)',
        grnNumber: 'GRN-2026-0419',
        isDirectIssue: true,
        notes: 'Initial issue 263 pcs + additional 12 pcs issued for facing setup and tool offset calibration.'
      },
      {
        id: 'mat-wo1-02',
        workOrderId: 'wo_seed_1',
        workOrderNumber: 'WO-2026-0001',
        bomItemId: 'bom-gb-3',
        materialCode: 'STD-FAST-M10X35',
        materialName: 'High-Tensile Hex Socket Head Screws M10 x 35mm (Gr 10.9)',
        materialGrade: 'Grade 10.9 Black Oxide',
        lotNumber: 'LOT-FAST-0922',
        storeLocation: 'Pune Heavy Forge — Spares & Tooling Crib',
        binCode: 'ST-SP01 / Drawer F-03',
        standardRequiredQty: 1000,
        actualIssuedQty: 1000,
        unit: 'pcs',
        standardUnitCost: 12,
        actualUnitCost: 11.80,
        standardTotalCost: 12000,
        actualTotalCost: 11800,
        varianceCost: -200,
        variancePercent: -1.67,
        scrapWasteQty: 0,
        issuedAt: new Date(Date.now() - 44 * 3600000).toISOString(),
        issuedByOperator: 'Vikram Joshi (Tool Crib)',
        grnNumber: 'GRN-2026-0388',
        isDirectIssue: false,
        notes: 'Direct bulk pack issue.'
      }
    ],
    subcontracts: [
      {
        id: 'sub-wo1-01',
        workOrderId: 'wo_seed_1',
        workOrderNumber: 'WO-2026-0001',
        operationSequence: 40,
        processName: 'Vacuum Carburizing & Case Hardening (58-62 HRC)',
        vendorName: 'Pragati Heat Treaters (Pvt) Ltd',
        poNumber: 'PO-SUB-2026-0112',
        quantityProcessed: 250,
        unit: 'pcs',
        contractUnitCost: 145,
        actualUnitCost: 145,
        handlingMarkupPercent: 8,
        standardCost: 250 * 145,
        totalActualCost: (250 * 145) * 1.08, // ₹39,150
        varianceCost: (250 * 145 * 1.08) - (250 * 145),
        status: 'pending'
      }
    ]
  },
  {
    workOrderId: 'wo_seed_2',
    workOrderNumber: 'WO-2026-0002',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge & Machine Facility',
    salesOrderNumber: 'SO-2026-0015',
    quoteNumber: 'Q-9034',
    customerPoNumber: 'PO-BAJ-4410',
    customerName: 'Bajaj Auto Commercial Vehicles',
    partCode: 'DS-30',
    partName: 'Shaft — Drive Intermediate 30mm x 450mm',
    quantity: 500,
    quantityCompleted: 0,
    quantityScrapped: 0,
    orderStatus: 'ready',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
    contractPricePerUnit: 1380, // Selling price ₹1,380/unit
    standardLaborHours: 22.0,
    standardMachineHours: 20.0,
    materials: [
      {
        id: 'mat-wo2-01',
        workOrderId: 'wo_seed_2',
        workOrderNumber: 'WO-2026-0002',
        bomItemId: 'bom-ds-1',
        materialCode: 'RM-EN19-RD65',
        materialName: 'EN19 Normalized / AISI 4140 Bright Round Bar Ø65mm',
        materialGrade: 'EN19 Normalized',
        lotNumber: 'LOT-EN19-2026-031',
        heatNumber: 'HT-TATA-6602',
        storeLocation: 'Main Raw Materials Store',
        binCode: 'ST-RM01 / Rack C-02',
        standardRequiredQty: 525,
        actualIssuedQty: 525,
        unit: 'pcs',
        standardUnitCost: 420,
        actualUnitCost: 418,
        standardTotalCost: 525 * 420,
        actualTotalCost: 525 * 418,
        varianceCost: -1050,
        variancePercent: -0.48,
        scrapWasteQty: 0,
        issuedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        issuedByOperator: 'Rajesh Sharma',
        grnNumber: 'GRN-2026-0422',
        isDirectIssue: true,
        notes: 'Pre-cut bar billets staged at band saw station.'
      },
      {
        id: 'mat-wo2-02',
        workOrderId: 'wo_seed_2',
        workOrderNumber: 'WO-2026-0002',
        bomItemId: 'bom-ds-3',
        materialCode: 'STD-SEAL-NBR70',
        materialName: 'Viton / Nitrile NBR 70 Shore Rotary Shaft Oil Seal',
        lotNumber: 'LOT-SEAL-889',
        storeLocation: 'Spares & Tooling Crib',
        binCode: 'ST-SP01 / Bin S-14',
        standardRequiredQty: 500,
        actualIssuedQty: 500,
        unit: 'pcs',
        standardUnitCost: 45,
        actualUnitCost: 45,
        standardTotalCost: 22500,
        actualTotalCost: 22500,
        varianceCost: 0,
        variancePercent: 0,
        scrapWasteQty: 0,
        issuedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
        issuedByOperator: 'Vikram Joshi',
        grnNumber: 'GRN-2026-0401',
        isDirectIssue: false
      }
    ],
    subcontracts: [
      {
        id: 'sub-wo2-01',
        workOrderId: 'wo_seed_2',
        workOrderNumber: 'WO-2026-0002',
        operationSequence: 30,
        processName: 'Hard Chrome Plating (25 micron thickness)',
        vendorName: 'Apex Electroplaters Pune',
        poNumber: 'PO-SUB-2026-0118',
        quantityProcessed: 500,
        unit: 'pcs',
        contractUnitCost: 140,
        actualUnitCost: 140,
        handlingMarkupPercent: 10,
        standardCost: 500 * 140,
        totalActualCost: (500 * 140) * 1.10,
        varianceCost: 7000,
        status: 'pending'
      }
    ]
  },
  {
    workOrderId: 'wo_seed_3',
    workOrderNumber: 'WO-2026-0003',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge & Machine Facility',
    salesOrderNumber: 'SO-2026-0019',
    quoteNumber: 'Q-9045',
    customerPoNumber: 'PO-LT-7712',
    customerName: 'Larsen & Toubro Heavy Engineering',
    partCode: 'FL-DN80',
    partName: 'Flange Adapter — DN80 PN40 High-Pressure Blind Flange',
    quantity: 150,
    quantityCompleted: 60,
    quantityScrapped: 5,
    orderStatus: 'in_progress',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    contractPricePerUnit: 3850, // Selling price ₹3,850/unit
    standardLaborHours: 18.0,
    standardMachineHours: 16.5,
    materials: [
      {
        id: 'mat-wo3-01',
        workOrderId: 'wo_seed_3',
        workOrderNumber: 'WO-2026-0003',
        bomItemId: 'bom-fl-1',
        materialCode: 'RM-SS316-PL25',
        materialName: 'SS 316L Austenitic Stainless Steel Plate 25mm Hot Rolled',
        materialGrade: 'ASTM A240 SS316L',
        lotNumber: 'LOT-SS316-2026-90',
        heatNumber: 'HT-SAIL-5521',
        storeLocation: 'Main Raw Materials Store',
        binCode: 'ST-RM01 / Bay S-08',
        standardRequiredQty: 158,
        actualIssuedQty: 175,       // High overrun (+17 pcs scrap/defect)
        unit: 'pcs',
        standardUnitCost: 1420,
        actualUnitCost: 1490,       // Price surge in nickel alloy
        standardTotalCost: 158 * 1420, // ₹224,360
        actualTotalCost: 175 * 1490,   // ₹260,750
        varianceCost: (175 * 1490) - (158 * 1420), // +₹36,390 (+16.2%)
        variancePercent: 16.22,
        scrapWasteQty: 17,
        issuedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        issuedByOperator: 'Rajesh Sharma',
        grnNumber: 'GRN-2026-0390',
        isDirectIssue: true,
        notes: 'Additional 17 plate blanks issued after tool chatter and blowhole porosity reject in initial batch.'
      }
    ],
    subcontracts: [
      {
        id: 'sub-wo3-01',
        workOrderId: 'wo_seed_3',
        workOrderNumber: 'WO-2026-0003',
        operationSequence: 40,
        processName: 'NDT Ultrasonic & Liquid Penetrant Inspection',
        vendorName: 'NABL Certified Metrology Lab',
        poNumber: 'PO-SUB-2026-0120',
        quantityProcessed: 150,
        unit: 'pcs',
        contractUnitCost: 120,
        actualUnitCost: 135,
        handlingMarkupPercent: 12,
        standardCost: 150 * 120,
        totalActualCost: 150 * 135 * 1.12,
        varianceCost: (150 * 135 * 1.12) - (150 * 120),
        status: 'received_approved'
      }
    ]
  },
  {
    workOrderId: 'wo_seed_4',
    workOrderNumber: 'WO-2026-0004',
    plantId: 'plant-vadodara',
    plantName: 'Vadodara Precision Works',
    salesOrderNumber: 'SO-2026-0022',
    quoteNumber: 'Q-9060',
    customerPoNumber: 'PO-BHEL-1109',
    customerName: 'Bharat Heavy Electricals Ltd (BHEL)',
    partCode: 'IMP-AERO-44',
    partName: 'Titanium Aero Turbine Impeller Hub 5-Axis',
    quantity: 80,
    quantityCompleted: 80,
    quantityScrapped: 1,
    orderStatus: 'completed',
    priority: 'high',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    contractPricePerUnit: 14200, // Selling price ₹14,200/unit
    standardLaborHours: 36.0,
    standardMachineHours: 32.0,
    materials: [
      {
        id: 'mat-wo4-01',
        workOrderId: 'wo_seed_4',
        workOrderNumber: 'WO-2026-0004',
        bomItemId: 'bom-imp-1',
        materialCode: 'RM-TI6AL4V-RD180',
        materialName: 'Titanium Grade 5 Ti-6Al-4V Aerospace Forged Round Bar Ø180mm',
        materialGrade: 'AMS 4928 Ti-6Al-4V',
        lotNumber: 'LOT-TI-2026-004',
        heatNumber: 'HT-TIMET-902',
        storeLocation: 'Vadodara — Raw Materials Store',
        binCode: 'ST-V-RM01 / Vault T-01',
        standardRequiredQty: 84,
        actualIssuedQty: 84,
        unit: 'pcs',
        standardUnitCost: 4800,
        actualUnitCost: 4720,
        standardTotalCost: 84 * 4800,
        actualTotalCost: 84 * 4720,
        varianceCost: (84 * 4720) - (84 * 4800), // -₹6,720
        variancePercent: -1.67,
        scrapWasteQty: 1,
        issuedAt: new Date(Date.now() - 120 * 3600000).toISOString(),
        issuedByOperator: 'Bhavin Patel',
        grnNumber: 'GRN-2026-0310',
        isDirectIssue: true,
        notes: 'Aerospace certified billet batch with ultrasonic 100% test cert.'
      }
    ],
    subcontracts: [
      {
        id: 'sub-wo4-01',
        workOrderId: 'wo_seed_4',
        workOrderNumber: 'WO-2026-0004',
        operationSequence: 50,
        processName: 'Vacuum Stress Relieving & Cryogenic Treatment',
        vendorName: 'Precision Heat Treaters MIDC',
        poNumber: 'PO-SUB-2026-0105',
        quantityProcessed: 80,
        unit: 'pcs',
        contractUnitCost: 650,
        actualUnitCost: 650,
        handlingMarkupPercent: 10,
        standardCost: 80 * 650,
        totalActualCost: 80 * 650 * 1.10,
        varianceCost: 5200,
        status: 'received_approved'
      }
    ]
  },
  {
    workOrderId: 'wo_seed_5',
    workOrderNumber: 'WO-2026-0005',
    plantId: 'plant-pune',
    plantName: 'Pune Heavy Forge & Machine Facility',
    salesOrderNumber: 'SO-2026-0028',
    quoteNumber: 'Q-9072',
    customerPoNumber: 'PO-SIE-3380',
    customerName: 'Siemens India Industrial Automation',
    partCode: 'BKT-SRV-90',
    partName: 'Servo Motor Heavy Mounting Bracket & Adapter',
    quantity: 300,
    quantityCompleted: 95,
    quantityScrapped: 4,
    orderStatus: 'in_progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    contractPricePerUnit: 1850, // Selling price ₹1,850/unit
    standardLaborHours: 12.0,
    standardMachineHours: 10.0,
    materials: [
      {
        id: 'mat-wo5-01',
        workOrderId: 'wo_seed_5',
        workOrderNumber: 'WO-2026-0005',
        bomItemId: 'bom-bkt-1',
        materialCode: 'RM-AL6061-EXT',
        materialName: 'Aluminium 6061-T6 Extruded Structural Profile 120x80mm',
        materialGrade: 'AA 6061-T6',
        lotNumber: 'LOT-AL-2026-77',
        heatNumber: 'HT-HINDALCO-411',
        storeLocation: 'Main Raw Materials Store',
        binCode: 'ST-RM01 / Rack A-10',
        standardRequiredQty: 315,
        actualIssuedQty: 335,
        unit: 'pcs',
        standardUnitCost: 310,
        actualUnitCost: 325,
        standardTotalCost: 315 * 310, // ₹97,650
        actualTotalCost: 335 * 325,   // ₹108,875
        varianceCost: (335 * 325) - (315 * 310), // +₹11,225 (+11.5%)
        variancePercent: 11.49,
        scrapWasteQty: 15,
        issuedAt: new Date(Date.now() - 28 * 3600000).toISOString(),
        issuedByOperator: 'Anand V.',
        grnNumber: 'GRN-2026-0415',
        isDirectIssue: true,
        notes: 'Extra cutoffs required due to corner radius extrusion tolerances.'
      }
    ],
    subcontracts: [
      {
        id: 'sub-wo5-01',
        workOrderId: 'wo_seed_5',
        workOrderNumber: 'WO-2026-0005',
        operationSequence: 30,
        processName: 'Black Anodizing & Laser Part Marking',
        vendorName: 'Apex Electroplaters Pune',
        poNumber: 'PO-SUB-2026-0129',
        quantityProcessed: 300,
        unit: 'pcs',
        contractUnitCost: 85,
        actualUnitCost: 85,
        handlingMarkupPercent: 8,
        standardCost: 300 * 85,
        totalActualCost: 300 * 85 * 1.08,
        varianceCost: 2040,
        status: 'pending'
      }
    ]
  }
];

// ── 4. Main Service Implementation ────────────────────────────────
export class CostRollupService {

  // Retrieve active overhead allocation configs
  getOverheadConfigs(): OverheadAllocationConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OVERHEAD_CONFIGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored overhead configs, falling back:', e);
    }
    return DEFAULT_OVERHEAD_CONFIGS;
  }

  saveOverheadConfigs(configs: OverheadAllocationConfig[]): void {
    localStorage.setItem(STORAGE_KEY_OVERHEAD_CONFIGS, JSON.stringify(configs));
  }

  getActiveOverheadConfig(): OverheadAllocationConfig {
    const configs = this.getOverheadConfigs();
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_OVERHEAD_ID);
    if (activeId) {
      const found = configs.find(c => c.id === activeId);
      if (found) return found;
    }
    const def = configs.find(c => c.isDefault);
    return def || configs[0] || DEFAULT_OVERHEAD_CONFIGS[0];
  }

  setActiveOverheadConfig(configId: string): OverheadAllocationConfig {
    localStorage.setItem(STORAGE_KEY_ACTIVE_OVERHEAD_ID, configId);
    return this.getActiveOverheadConfig();
  }

  updateOverheadConfig(updated: OverheadAllocationConfig): OverheadAllocationConfig {
    const configs = this.getOverheadConfigs();
    const index = configs.findIndex(c => c.id === updated.id);
    if (index >= 0) {
      configs[index] = { ...updated, updatedAt: new Date().toISOString() };
    } else {
      configs.push({ ...updated, updatedAt: new Date().toISOString() });
    }
    this.saveOverheadConfigs(configs);
    return updated;
  }

  // Retrieve user custom material issues (stored in local storage)
  private getCustomMaterialIssues(): MaterialConsumptionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_MATERIAL_ISSUES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse custom material issues:', e);
    }
    return [];
  }

  private saveCustomMaterialIssues(issues: MaterialConsumptionRecord[]): void {
    localStorage.setItem(STORAGE_KEY_CUSTOM_MATERIAL_ISSUES, JSON.stringify(issues));
  }

  // Issue additional material to a Work Order
  issueMaterialToWorkOrder(input: MaterialIssueInput): MaterialConsumptionRecord {
    const totalCost = input.qtyToIssue * input.unitCost;
    const newRecord: MaterialConsumptionRecord = {
      id: `mat-issue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workOrderId: input.workOrderId,
      workOrderNumber: input.workOrderId.startsWith('wo_seed_') ? `WO-2026-000${input.workOrderId.replace('wo_seed_', '')}` : input.workOrderId,
      bomItemId: input.bomItemId,
      materialCode: input.materialCode,
      materialName: input.materialName,
      lotNumber: input.lotNumber,
      storeLocation: input.storeLocation,
      binCode: input.binCode,
      standardRequiredQty: 0, // Direct incremental issue
      actualIssuedQty: input.qtyToIssue,
      unit: input.unit,
      standardUnitCost: input.unitCost,
      actualUnitCost: input.unitCost,
      standardTotalCost: 0,
      actualTotalCost: totalCost,
      varianceCost: totalCost,
      variancePercent: 100,
      scrapWasteQty: 0,
      issuedAt: new Date().toISOString(),
      issuedByOperator: input.operatorName,
      grnNumber: input.grnNumber,
      isDirectIssue: true,
      notes: input.notes || 'Supplemental shopfloor material issue.'
    };

    const current = this.getCustomMaterialIssues();
    current.unshift(newRecord);
    this.saveCustomMaterialIssues(current);
    return newRecord;
  }

  // Real-time Cost Roll-Up for a single Work Order
  calculateWorkOrderCostRollup(
    workOrderId: string,
    overrideConfig?: OverheadAllocationConfig
  ): WorkOrderCostRollup | null {
    // 1. Locate profile
    const profile = SEED_WORK_ORDER_COST_PROFILES.find(p => p.workOrderId === workOrderId || p.workOrderNumber === workOrderId);
    if (!profile) return null;

    const activeOverhead = overrideConfig || this.getActiveOverheadConfig();

    // 2. Material Cost Roll-Up (Seed items + any custom issued records)
    const customIssues = this.getCustomMaterialIssues().filter(m => m.workOrderId === profile.workOrderId || m.workOrderNumber === profile.workOrderNumber);
    const allMaterials = [...profile.materials, ...customIssues];

    const standardMaterialCost = allMaterials.reduce((sum, m) => sum + m.standardTotalCost, 0);
    const actualMaterialCost = allMaterials.reduce((sum, m) => sum + m.actualTotalCost, 0);
    const materialVarianceCost = actualMaterialCost - standardMaterialCost;
    const materialVariancePercent = standardMaterialCost > 0 
      ? (materialVarianceCost / standardMaterialCost) * 100 
      : 0;

    // 3. Labor & Machine Costs from Shop Floor Time Capture (timeCaptureService)
    const timeLogs = timeCaptureService.getAllLogs().filter(l => 
      l.workOrderId === profile.workOrderId || 
      l.workOrderNumber === profile.workOrderNumber
    );

    const now = Date.now();
    let actualLaborCost = 0;
    let standardLaborCost = 0;
    let actualMachineCost = 0;
    let standardMachineCost = 0;
    let isAnyLiveRunning = false;
    let activeOperatorCount = 0;
    let activeMachineCount = 0;

    const laborLogs: LaborCostRecord[] = [];
    const machineLogs: MachineCostRecord[] = [];

    // Helper mapping for operators & machine hourly rates
    const operatorRates: Record<string, { hourly: number; ot: number; role: string; skill: 'skilled' | 'semi_skilled' | 'specialist' | 'unskilled' }> = {
      'op-ramesh': { hourly: 280, ot: 420, role: 'CNC Turning Operator', skill: 'semi_skilled' },
      'op-suresh': { hourly: 360, ot: 540, role: 'Gear Hobbing Specialist', skill: 'specialist' },
      'op-anand': { hourly: 220, ot: 330, role: 'Band Saw Technician', skill: 'semi_skilled' },
      'op-priya': { hourly: 350, ot: 525, role: 'CMM Inspector', skill: 'skilled' },
      'op-mahendra': { hourly: 380, ot: 570, role: 'Senior Welder', skill: 'skilled' }
    };

    if (timeLogs.length > 0) {
      timeLogs.forEach(log => {
        // Compute live elapsed minutes if running
        let elapsedMinutes = log.actualTimeMinutes || (log as any).totalMinutes || 0;
        let isLive = log.status === 'running';
        if (isLive) {
          isAnyLiveRunning = true;
          activeOperatorCount += 1;
          activeMachineCount += 1;
          const startMs = new Date(log.startedAt).getTime();
          elapsedMinutes = Math.max(1, Math.round((now - startMs) / 60000));
        }

        const setupMins = (log as any).setupMinutes || 15;
        const runMins = Math.max(0, elapsedMinutes - setupMins);
        const stdMins = log.standardTimeMinutes || 60;

        // Labor calculation
        const opRateInfo = operatorRates[log.operatorId] || { hourly: 300, ot: 450, role: 'Machinist', skill: 'skilled' };
        const regularLaborCost = (elapsedMinutes / 60) * opRateInfo.hourly;
        const overtimeLaborCost = 0; // standard shift regular
        const totalLogLaborCost = regularLaborCost + overtimeLaborCost;
        const stdLaborCost = (stdMins / 60) * opRateInfo.hourly;

        actualLaborCost += totalLogLaborCost;
        standardLaborCost += stdLaborCost;

        laborLogs.push({
          id: `labor-${log.id}`,
          workOrderId: profile.workOrderId,
          workOrderNumber: profile.workOrderNumber,
          operationId: log.operationId,
          operationName: log.operationName,
          operationSequence: log.operationSequence,
          operatorId: log.operatorId,
          operatorName: log.operatorName,
          operatorBadgeNumber: log.operatorBadgeNumber,
          role: opRateInfo.role,
          skillLevel: opRateInfo.skill,
          hourlyRate: opRateInfo.hourly,
          overtimeHourlyRate: opRateInfo.ot,
          standardMinutes: stdMins,
          actualSetupMinutes: setupMins,
          actualRunMinutes: runMins,
          totalActualMinutes: elapsedMinutes,
          isLiveRunning: isLive,
          regularLaborCost: Math.round(regularLaborCost),
          overtimeLaborCost: 0,
          totalLaborCost: Math.round(totalLogLaborCost),
          standardLaborCost: Math.round(stdLaborCost),
          varianceCost: Math.round(totalLogLaborCost - stdLaborCost),
          variancePercent: stdLaborCost > 0 ? ((totalLogLaborCost - stdLaborCost) / stdLaborCost) * 100 : 0,
          timeLogId: log.id,
          startedAt: log.startedAt,
          endedAt: log.stoppedAt || (log as any).endedAt
        });

        // Machine calculation
        const machRate = MACHINE_RATE_REGISTRY[log.workCenterCode] || MACHINE_RATE_REGISTRY['DEFAULT'];
        const machineHours = elapsedMinutes / 60;
        const setupCost = (setupMins / 60) * machRate.setupHourlyRate;
        const machiningCost = (runMins / 60) * machRate.hourlyRate;
        const toolingCost = machineHours * machRate.toolingAllowancePerHr;
        const totalLogMachineCost = setupCost + machiningCost + toolingCost;
        const stdMachineHours = stdMins / 60;
        const stdMachCost = stdMachineHours * machRate.hourlyRate + (stdMachineHours * machRate.toolingAllowancePerHr);

        actualMachineCost += totalLogMachineCost;
        standardMachineCost += stdMachCost;

        machineLogs.push({
          id: `mach-${log.id}`,
          workOrderId: profile.workOrderId,
          workOrderNumber: profile.workOrderNumber,
          operationId: log.operationId,
          operationName: log.operationName,
          operationSequence: log.operationSequence,
          machineCode: log.workCenterCode,
          machineName: machRate.name,
          hourlyRate: machRate.hourlyRate,
          setupHourlyRate: machRate.setupHourlyRate,
          powerRatingKw: machRate.powerRatingKw,
          depreciationPerHr: machRate.depreciationPerHr,
          toolingAllowancePerHr: machRate.toolingAllowancePerHr,
          standardMachineMinutes: stdMins,
          actualSetupMinutes: setupMins,
          actualRunMinutes: runMins,
          totalMachineMinutes: elapsedMinutes,
          totalMachineHours: Number(machineHours.toFixed(2)),
          isLiveRunning: isLive,
          setupCost: Math.round(setupCost),
          machiningCost: Math.round(machiningCost),
          toolingCost: Math.round(toolingCost),
          totalMachineCost: Math.round(totalLogMachineCost),
          standardMachineCost: Math.round(stdMachCost),
          varianceCost: Math.round(totalLogMachineCost - stdMachCost),
          variancePercent: stdMachCost > 0 ? ((totalLogMachineCost - stdMachCost) / stdMachCost) * 100 : 0
        });
      });
    } else {
      // Baseline synthetic labor & machine records for work orders where time logging has standard allocations
      const baseHourly = 320;
      const baseMachHourly = 580;
      standardLaborCost = profile.standardLaborHours * baseHourly;
      actualLaborCost = profile.orderStatus === 'completed' 
        ? profile.standardLaborHours * 1.05 * baseHourly 
        : (profile.standardLaborHours * 0.45 * baseHourly);

      standardMachineCost = profile.standardMachineHours * baseMachHourly;
      actualMachineCost = profile.orderStatus === 'completed'
        ? profile.standardMachineHours * 1.08 * baseMachHourly
        : (profile.standardMachineHours * 0.40 * baseMachHourly);

      laborLogs.push({
        id: `labor-base-${profile.workOrderId}`,
        workOrderId: profile.workOrderId,
        workOrderNumber: profile.workOrderNumber,
        operationId: 'op-base-1',
        operationName: 'Machining & Turning Cell Allocation',
        operationSequence: 10,
        operatorId: 'op-ramesh',
        operatorName: 'Ramesh K.',
        operatorBadgeNumber: 'EMP-7041',
        role: 'CNC Turning Operator',
        skillLevel: 'semi_skilled',
        hourlyRate: baseHourly,
        overtimeHourlyRate: baseHourly * 1.5,
        standardMinutes: profile.standardLaborHours * 60,
        actualSetupMinutes: 30,
        actualRunMinutes: Math.round((actualLaborCost / baseHourly) * 60 - 30),
        totalActualMinutes: Math.round((actualLaborCost / baseHourly) * 60),
        isLiveRunning: false,
        regularLaborCost: Math.round(actualLaborCost),
        overtimeLaborCost: 0,
        totalLaborCost: Math.round(actualLaborCost),
        standardLaborCost: Math.round(standardLaborCost),
        varianceCost: Math.round(actualLaborCost - standardLaborCost),
        variancePercent: standardLaborCost > 0 ? ((actualLaborCost - standardLaborCost) / standardLaborCost) * 100 : 0,
        startedAt: new Date(Date.now() - 24 * 3600000).toISOString()
      });

      machineLogs.push({
        id: `mach-base-${profile.workOrderId}`,
        workOrderId: profile.workOrderId,
        workOrderNumber: profile.workOrderNumber,
        operationId: 'op-base-1',
        operationName: 'CNC Cell Operation',
        operationSequence: 10,
        machineCode: 'WC-CNC-04',
        machineName: 'Doosan Puma CNC Lathe #04',
        hourlyRate: baseMachHourly,
        setupHourlyRate: 400,
        powerRatingKw: 14,
        depreciationPerHr: 140,
        toolingAllowancePerHr: 80,
        standardMachineMinutes: profile.standardMachineHours * 60,
        actualSetupMinutes: 30,
        actualRunMinutes: Math.round((actualMachineCost / baseMachHourly) * 60 - 30),
        totalMachineMinutes: Math.round((actualMachineCost / baseMachHourly) * 60),
        totalMachineHours: Number((actualMachineCost / baseMachHourly).toFixed(2)),
        isLiveRunning: false,
        setupCost: 200,
        machiningCost: Math.round(actualMachineCost - 200),
        toolingCost: Math.round(actualMachineCost * 0.1),
        totalMachineCost: Math.round(actualMachineCost),
        standardMachineCost: Math.round(standardMachineCost),
        varianceCost: Math.round(actualMachineCost - standardMachineCost),
        variancePercent: standardMachineCost > 0 ? ((actualMachineCost - standardMachineCost) / standardMachineCost) * 100 : 0
      });
    }

    const laborVarianceCost = actualLaborCost - standardLaborCost;
    const laborVariancePercent = standardLaborCost > 0 ? (laborVarianceCost / standardLaborCost) * 100 : 0;

    const machineVarianceCost = actualMachineCost - standardMachineCost;
    const machineVariancePercent = standardMachineCost > 0 ? (machineVarianceCost / standardMachineCost) * 100 : 0;

    // 4. Subcontracting Cost
    const standardSubcontractCost = profile.subcontracts.reduce((sum, s) => sum + s.standardCost, 0);
    const actualSubcontractCost = profile.subcontracts.reduce((sum, s) => sum + s.totalActualCost, 0);
    const subcontractVarianceCost = actualSubcontractCost - standardSubcontractCost;

    // 5. Prime Cost
    const standardPrimeCost = standardMaterialCost + standardLaborCost + standardMachineCost + standardSubcontractCost;
    const actualPrimeCost = actualMaterialCost + actualLaborCost + actualMachineCost + actualSubcontractCost;

    // 6. Overhead Allocation Rules Evaluation
    let allocatedFactoryOverheadCost = 0;
    let standardFactoryOverheadCost = 0;
    const totalActualMachineHours = machineLogs.reduce((sum, m) => sum + m.totalMachineHours, 0);
    const totalStdMachineHours = profile.standardMachineHours;

    switch (activeOverhead.method) {
      case 'percent_direct_labor':
        allocatedFactoryOverheadCost = actualLaborCost * (activeOverhead.laborOverheadPercent / 100);
        standardFactoryOverheadCost = standardLaborCost * (activeOverhead.laborOverheadPercent / 100);
        break;

      case 'per_machine_hour':
        allocatedFactoryOverheadCost = totalActualMachineHours * activeOverhead.machineHourOverheadRate;
        standardFactoryOverheadCost = totalStdMachineHours * activeOverhead.machineHourOverheadRate;
        break;

      case 'percent_prime_cost':
        allocatedFactoryOverheadCost = actualPrimeCost * (activeOverhead.primeCostOverheadPercent / 100);
        standardFactoryOverheadCost = standardPrimeCost * (activeOverhead.primeCostOverheadPercent / 100);
        break;

      case 'fixed_per_unit':
        allocatedFactoryOverheadCost = profile.quantity * activeOverhead.factoryFixedRatePerUnit;
        standardFactoryOverheadCost = profile.quantity * activeOverhead.factoryFixedRatePerUnit;
        break;

      case 'hybrid_industrial':
      default:
        // Labor absorption + machine charge + per-unit tooling allowance
        const laborComponent = actualLaborCost * (activeOverhead.laborOverheadPercent / 100);
        const machineComponent = totalActualMachineHours * activeOverhead.machineHourOverheadRate;
        const unitComponent = profile.quantity * (activeOverhead.factoryFixedRatePerUnit || 0);
        allocatedFactoryOverheadCost = laborComponent + machineComponent + unitComponent;

        const stdLaborComp = standardLaborCost * (activeOverhead.laborOverheadPercent / 100);
        const stdMachComp = totalStdMachineHours * activeOverhead.machineHourOverheadRate;
        standardFactoryOverheadCost = stdLaborComp + stdMachComp + unitComponent;
        break;
    }

    // SG&A Allocation (% of Prime Cost + Factory Overhead)
    const sgaBaseActual = actualPrimeCost + allocatedFactoryOverheadCost;
    const allocatedSgaOverheadCost = sgaBaseActual * (activeOverhead.generalAdminSgaPercent / 100);

    const sgaBaseStd = standardPrimeCost + standardFactoryOverheadCost;
    const standardSgaOverheadCost = sgaBaseStd * (activeOverhead.generalAdminSgaPercent / 100);

    const totalOverheadCost = allocatedFactoryOverheadCost + allocatedSgaOverheadCost;
    const standardOverheadCost = standardFactoryOverheadCost + standardSgaOverheadCost;
    const overheadVarianceCost = totalOverheadCost - standardOverheadCost;

    // 7. Total Cost & Unit Economics
    const standardTotalCost = Math.round(standardPrimeCost + standardOverheadCost);
    const actualTotalCost = Math.round(actualPrimeCost + totalOverheadCost);
    const totalCostVariance = actualTotalCost - standardTotalCost;
    const totalCostVariancePercent = standardTotalCost > 0 ? (totalCostVariance / standardTotalCost) * 100 : 0;

    const standardUnitCost = Number((standardTotalCost / profile.quantity).toFixed(2));
    const actualUnitCost = Number((actualTotalCost / profile.quantity).toFixed(2));

    // 8. Commercial Revenue & Gross Margins
    const totalRevenue = profile.quantity * profile.contractPricePerUnit;
    const standardGrossProfit = totalRevenue - standardTotalCost;
    const actualGrossProfit = totalRevenue - actualTotalCost;

    const standardGrossMarginPercent = Number(((standardGrossProfit / totalRevenue) * 100).toFixed(1));
    const actualGrossMarginPercent = Number(((actualGrossProfit / totalRevenue) * 100).toFixed(1));
    const marginVariancePercent = Number((actualGrossMarginPercent - standardGrossMarginPercent).toFixed(1));

    // 9. Margin Health Grading
    let marginHealth: MarginHealthStatus = 'healthy';
    if (actualGrossMarginPercent >= 25.0) {
      marginHealth = 'high_margin';
    } else if (actualGrossMarginPercent >= 15.0) {
      marginHealth = 'healthy';
    } else if (actualGrossMarginPercent >= 0.0) {
      marginHealth = 'at_risk';
    } else {
      marginHealth = 'loss_making';
    }

    return {
      workOrderId: profile.workOrderId,
      workOrderNumber: profile.workOrderNumber,
      plantId: profile.plantId,
      plantName: profile.plantName,
      salesOrderNumber: profile.salesOrderNumber,
      quoteNumber: profile.quoteNumber,
      customerPoNumber: profile.customerPoNumber,
      customerName: profile.customerName,
      partCode: profile.partCode,
      partName: profile.partName,
      quantity: profile.quantity,
      quantityCompleted: profile.quantityCompleted,
      quantityScrapped: profile.quantityScrapped,
      orderStatus: profile.orderStatus,
      priority: profile.priority,
      dueDate: profile.dueDate,

      contractPricePerUnit: profile.contractPricePerUnit,
      totalRevenue,

      standardMaterialCost: Math.round(standardMaterialCost),
      actualMaterialCost: Math.round(actualMaterialCost),
      materialVarianceCost: Math.round(materialVarianceCost),
      materialVariancePercent: Number(materialVariancePercent.toFixed(1)),
      materialItems: allMaterials,

      standardLaborCost: Math.round(standardLaborCost),
      actualLaborCost: Math.round(actualLaborCost),
      laborVarianceCost: Math.round(laborVarianceCost),
      laborVariancePercent: Number(laborVariancePercent.toFixed(1)),
      laborLogs,
      activeOperatorCount,

      standardMachineCost: Math.round(standardMachineCost),
      actualMachineCost: Math.round(actualMachineCost),
      machineVarianceCost: Math.round(machineVarianceCost),
      machineVariancePercent: Number(machineVariancePercent.toFixed(1)),
      machineLogs,
      activeMachineCount,

      standardSubcontractCost: Math.round(standardSubcontractCost),
      actualSubcontractCost: Math.round(actualSubcontractCost),
      subcontractVarianceCost: Math.round(subcontractVarianceCost),
      subcontractItems: profile.subcontracts,

      standardPrimeCost: Math.round(standardPrimeCost),
      actualPrimeCost: Math.round(actualPrimeCost),

      overheadConfigApplied: activeOverhead,
      appliedAllocationMethod: activeOverhead.method,
      allocatedFactoryOverheadCost: Math.round(allocatedFactoryOverheadCost),
      allocatedSgaOverheadCost: Math.round(allocatedSgaOverheadCost),
      totalOverheadCost: Math.round(totalOverheadCost),
      standardOverheadCost: Math.round(standardOverheadCost),
      overheadVarianceCost: Math.round(overheadVarianceCost),

      standardTotalCost,
      actualTotalCost,
      totalCostVariance,
      totalCostVariancePercent: Number(totalCostVariancePercent.toFixed(1)),

      standardUnitCost,
      actualUnitCost,

      standardGrossProfit,
      actualGrossProfit,
      standardGrossMarginPercent,
      actualGrossMarginPercent,
      marginVariancePercent,

      marginHealth,
      isLiveRunning: isAnyLiveRunning,
      hasMaterialOverrun: materialVarianceCost > 0,
      hasLaborOverrun: laborVarianceCost > 0,
      lastCalculatedAt: new Date().toISOString()
    };
  }

  // Get all Work Order Cost Roll-Ups with filters
  getAllWorkOrderCostRollups(filter?: Partial<CostRollupFilterParams>): WorkOrderCostRollup[] {
    const list: WorkOrderCostRollup[] = [];

    SEED_WORK_ORDER_COST_PROFILES.forEach(profile => {
      const rolled = this.calculateWorkOrderCostRollup(profile.workOrderId);
      if (rolled) {
        list.push(rolled);
      }
    });

    if (!filter) return list;

    return list.filter(item => {
      // Search query
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const matches = 
          item.workOrderNumber.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.partName.toLowerCase().includes(q) ||
          item.partCode.toLowerCase().includes(q) ||
          item.salesOrderNumber.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (filter.status && filter.status !== 'all') {
        if (item.orderStatus !== filter.status) return false;
      }

      // Margin health
      if (filter.marginHealth && filter.marginHealth !== 'all') {
        if (item.marginHealth !== filter.marginHealth) return false;
      }

      // Plant
      if (filter.plantId && filter.plantId !== 'all') {
        if (item.plantId !== filter.plantId) return false;
      }

      // Live only
      if (filter.liveOnly && !item.isLiveRunning) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const sortBy = filter.sortBy || 'actualMarginPercent';
      const order = filter.sortOrder === 'asc' ? 1 : -1;

      switch (sortBy) {
        case 'revenue':
          return (a.totalRevenue - b.totalRevenue) * order;
        case 'actualCost':
          return (a.actualTotalCost - b.actualTotalCost) * order;
        case 'actualMarginPercent':
          return (a.actualGrossMarginPercent - b.actualGrossMarginPercent) * order;
        case 'varianceCost':
          return (a.totalCostVariance - b.totalCostVariance) * order;
        case 'orderNumber':
          return a.workOrderNumber.localeCompare(b.workOrderNumber) * order;
        case 'dueDate':
          return a.dueDate.localeCompare(b.dueDate) * order;
        default:
          return (a.actualGrossMarginPercent - b.actualGrossMarginPercent) * order;
      }
    });
  }

  // Calculate executive summary KPIs
  getSummaryKPIs(rollups: WorkOrderCostRollup[]): CostRollupSummaryKPIs {
    let totalRevenue = 0;
    let totalActualCost = 0;
    let totalStandardCost = 0;
    let highMarginCount = 0;
    let healthyCount = 0;
    let atRiskCount = 0;
    let lossMakingCount = 0;
    let liveShopFloorJobsCount = 0;
    let completedJobsCount = 0;
    let activeJobsCount = 0;

    let worstOverrunItem: WorkOrderCostRollup | null = null;
    let maxOverrunVariance = 0;

    rollups.forEach(item => {
      totalRevenue += item.totalRevenue;
      totalActualCost += item.actualTotalCost;
      totalStandardCost += item.standardTotalCost;

      if (item.orderStatus === 'completed') completedJobsCount++;
      else activeJobsCount++;

      if (item.isLiveRunning) liveShopFloorJobsCount++;

      if (item.marginHealth === 'high_margin') highMarginCount++;
      else if (item.marginHealth === 'healthy') healthyCount++;
      else if (item.marginHealth === 'at_risk') atRiskCount++;
      else if (item.marginHealth === 'loss_making') lossMakingCount++;

      if (item.totalCostVariance > maxOverrunVariance) {
        maxOverrunVariance = item.totalCostVariance;
        worstOverrunItem = item;
      }
    });

    const totalGrossProfit = totalRevenue - totalActualCost;
    const blendedGrossMarginPercent = totalRevenue > 0 
      ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    let topOverrun: CostRollupSummaryKPIs['topOverrunWorkOrder'] = undefined;
    if (worstOverrunItem) {
      // Find primary driver
      const matV = (worstOverrunItem as WorkOrderCostRollup).materialVarianceCost;
      const labV = (worstOverrunItem as WorkOrderCostRollup).laborVarianceCost;
      const macV = (worstOverrunItem as WorkOrderCostRollup).machineVarianceCost;
      let driver: 'Material' | 'Labor' | 'Machine' | 'Overhead' = 'Material';
      if (labV > matV && labV > macV) driver = 'Labor';
      else if (macV > matV && macV > labV) driver = 'Machine';

      topOverrun = {
        orderNumber: (worstOverrunItem as WorkOrderCostRollup).workOrderNumber,
        partName: (worstOverrunItem as WorkOrderCostRollup).partName,
        varianceCost: (worstOverrunItem as WorkOrderCostRollup).totalCostVariance,
        variancePercent: (worstOverrunItem as WorkOrderCostRollup).totalCostVariancePercent,
        primaryDriver: driver
      };
    }

    return {
      totalJobsCount: rollups.length,
      activeJobsCount,
      completedJobsCount,
      totalRevenue,
      totalActualCost,
      totalStandardCost,
      totalCostVariance: totalActualCost - totalStandardCost,
      totalGrossProfit,
      blendedGrossMarginPercent,
      highMarginCount,
      healthyCount,
      atRiskCount,
      lossMakingCount,
      liveShopFloorJobsCount,
      topOverrunWorkOrder: topOverrun
    };
  }

  // Margin Sensitivity / Simulation
  simulateMargin(
    workOrderId: string,
    params: {
      sellingPricePerUnit?: number;
      materialCostAdjustmentPercent?: number;
      laborHoursAdjustmentPercent?: number;
      efficiencyMultiplier?: number;
      overheadConfig?: OverheadAllocationConfig;
    }
  ): {
    originalGrossMarginPercent: number;
    simulatedGrossMarginPercent: number;
    marginDeltaPercent: number;
    simulatedGrossProfit: number;
    simulatedTotalCost: number;
  } {
    const original = this.calculateWorkOrderCostRollup(workOrderId);
    if (!original) {
      return {
        originalGrossMarginPercent: 0,
        simulatedGrossMarginPercent: 0,
        marginDeltaPercent: 0,
        simulatedGrossProfit: 0,
        simulatedTotalCost: 0
      };
    }

    const price = params.sellingPricePerUnit !== undefined ? params.sellingPricePerUnit : original.contractPricePerUnit;
    const revenue = original.quantity * price;

    const matMultiplier = 1 + ((params.materialCostAdjustmentPercent || 0) / 100);
    const labMultiplier = 1 + ((params.laborHoursAdjustmentPercent || 0) / 100);

    const simMatCost = original.actualMaterialCost * matMultiplier;
    const simLabCost = original.actualLaborCost * labMultiplier;
    const simMachCost = original.actualMachineCost;
    const simSubCost = original.actualSubcontractCost;
    const simPrimeCost = simMatCost + simLabCost + simMachCost + simSubCost;

    // Apply overhead rule
    const ovh = params.overheadConfig || original.overheadConfigApplied;
    let simFactoryOvh = 0;
    if (ovh.method === 'percent_direct_labor') {
      simFactoryOvh = simLabCost * (ovh.laborOverheadPercent / 100);
    } else if (ovh.method === 'percent_prime_cost') {
      simFactoryOvh = simPrimeCost * (ovh.primeCostOverheadPercent / 100);
    } else {
      simFactoryOvh = original.allocatedFactoryOverheadCost;
    }
    const simSgaOvh = (simPrimeCost + simFactoryOvh) * (ovh.generalAdminSgaPercent / 100);
    const simTotalCost = Math.round(simPrimeCost + simFactoryOvh + simSgaOvh);

    const simGrossProfit = revenue - simTotalCost;
    const simMarginPercent = revenue > 0 ? Number(((simGrossProfit / revenue) * 100).toFixed(1)) : 0;
    const delta = Number((simMarginPercent - original.actualGrossMarginPercent).toFixed(1));

    return {
      originalGrossMarginPercent: original.actualGrossMarginPercent,
      simulatedGrossMarginPercent: simMarginPercent,
      marginDeltaPercent: delta,
      simulatedGrossProfit: simGrossProfit,
      simulatedTotalCost: simTotalCost
    };
  }

  // Export CSV
  exportCostRollupCsv(rollups: WorkOrderCostRollup[]): string {
    const headers = [
      'Work Order #',
      'Sales Order #',
      'Customer',
      'Part Code',
      'Part Name',
      'Status',
      'Qty Ordered',
      'Selling Price/Unit (₹)',
      'Total Revenue (₹)',
      'Std Material Cost (₹)',
      'Actual Material Cost (₹)',
      'Material Variance (₹)',
      'Std Labor Cost (₹)',
      'Actual Labor Cost (₹)',
      'Labor Variance (₹)',
      'Std Machine Cost (₹)',
      'Actual Machine Cost (₹)',
      'Machine Variance (₹)',
      'Subcontract Cost (₹)',
      'Factory Overhead (₹)',
      'SG&A Overhead (₹)',
      'Total Actual Cost (₹)',
      'Actual Unit Cost (₹)',
      'Target Margin %',
      'Actual Margin %',
      'Margin Variance %',
      'Margin Health Status',
      'Live Shop Floor Active'
    ];

    const rows = rollups.map(r => [
      r.workOrderNumber,
      r.salesOrderNumber,
      `"${r.customerName.replace(/"/g, '""')}"`,
      r.partCode,
      `"${r.partName.replace(/"/g, '""')}"`,
      r.orderStatus,
      r.quantity,
      r.contractPricePerUnit,
      r.totalRevenue,
      r.standardMaterialCost,
      r.actualMaterialCost,
      r.materialVarianceCost,
      r.standardLaborCost,
      r.actualLaborCost,
      r.laborVarianceCost,
      r.standardMachineCost,
      r.actualMachineCost,
      r.machineVarianceCost,
      r.actualSubcontractCost,
      r.allocatedFactoryOverheadCost,
      r.allocatedSgaOverheadCost,
      r.actualTotalCost,
      r.actualUnitCost,
      `${r.standardGrossMarginPercent}%`,
      `${r.actualGrossMarginPercent}%`,
      `${r.marginVariancePercent}%`,
      r.marginHealth,
      r.isLiveRunning ? 'YES' : 'NO'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

export const costRollupService = new CostRollupService();
