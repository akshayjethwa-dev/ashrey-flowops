// src/services/fqcService.ts

import {
  FqcInspectionOrder,
  FqcChecklistTemplate,
  FqcChecklistItem,
  FqcFilterOptions,
  FqcKpiSummary,
  DispatchReleaseCheck,
  QualityAuthoritySignOff
} from '../types/fqc';
import { ncrService } from './ncrService';

const FQC_ORDERS_STORAGE_KEY = 'mes_fqc_orders_v1';
const FQC_TEMPLATES_STORAGE_KEY = 'mes_fqc_templates_v1';

// Seed product-specific FQC checklist templates
const INITIAL_TEMPLATES: FqcChecklistTemplate[] = [
  {
    id: 'tmpl-spur-gear',
    partSku: 'GEAR-SPUR-M4',
    partName: 'Forged Steel Spur Gear (Mod 4, 32T)',
    productFamily: 'Precision Power Transmission',
    version: 'v3.2',
    sampleSizeRule: 'ansi_asq_z1.4_level_ii',
    aqlLevel: '0.65 Critical / 1.5 Major',
    standardReference: 'ISO 9001:2015, DIN 3962 Class 6 Gear Standards',
    createdBy: 'Robert Sterling (Sr. Quality Architect)',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-08-10T14:00:00Z',
    items: [
      {
        id: 'item-g1',
        title: 'Bore Diameter (H7 Tolerance)',
        criteria: 'Finished internal bore must measure within 50.000 +0.025 / -0.000 mm',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: '3-Point Bore Micrometer',
        isMeasurement: true,
        targetNominal: 50.000,
        upperTolerance: 0.025,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pending',
        gageAssetTag: 'GAG-MIC-014'
      },
      {
        id: 'item-g2',
        title: 'Outer Tip Diameter (Da)',
        criteria: 'Overall outer diameter must measure 136.000 ± 0.050 mm',
        category: 'dimension',
        criticalLevel: 'major',
        inspectionMethod: 'Digital Vernier Caliper',
        isMeasurement: true,
        targetNominal: 136.000,
        upperTolerance: 0.050,
        lowerTolerance: -0.050,
        unit: 'mm',
        result: 'pending',
        gageAssetTag: 'GAG-CAL-002'
      },
      {
        id: 'item-g3',
        title: 'Tooth Flank Surface Finish (Ra)',
        criteria: 'Tooth profile roughness Ra <= 0.8 µm, zero pitting, scuffing or chatter marks',
        category: 'cleanliness',
        criticalLevel: 'major',
        inspectionMethod: 'Surface Roughness Tester',
        isMeasurement: true,
        targetNominal: 0.65,
        upperTolerance: 0.80,
        lowerTolerance: 0.10,
        unit: 'µm',
        result: 'pending',
        gageAssetTag: 'GAG-SRT-008'
      },
      {
        id: 'item-g4',
        title: 'Tooth Hardness (Case Depth)',
        criteria: 'Induction hardened tooth profile surface 58 - 62 HRC',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Rockwell C Hardness Tester',
        isMeasurement: true,
        targetNominal: 60.0,
        upperTolerance: 2.0,
        lowerTolerance: -2.0,
        unit: 'HRC',
        result: 'pending',
        gageAssetTag: 'GAG-HRC-005'
      },
      {
        id: 'item-g5',
        title: 'Visual Surface & Chamfers',
        criteria: '100% burr-free, uniform 1.0mm 45° chamfers, black oxide coating uniform without bare spots',
        category: 'visual',
        criticalLevel: 'minor',
        inspectionMethod: 'Visual Inspection & 10x Loupe',
        isMeasurement: false,
        result: 'pending'
      },
      {
        id: 'item-g6',
        title: 'Laser Part Marking & 2D DataMatrix',
        criteria: 'Legible laser etched Part No, Heat Lot #, and readable DataMatrix ECC200 barcode',
        category: 'documentation',
        criticalLevel: 'critical',
        inspectionMethod: 'Fixed Optical Barcode Scanner',
        isMeasurement: false,
        result: 'pending'
      },
      {
        id: 'item-g7',
        title: 'VCI Anti-Corrosion Wrap & Packaging',
        criteria: 'Sealed inside sealed VCI vapor corrosion inhibitor bag with desiccant pouch in heavy corrugated box',
        category: 'packaging',
        criticalLevel: 'major',
        inspectionMethod: 'Visual Packaging Check',
        isMeasurement: false,
        result: 'pending'
      }
    ]
  },
  {
    id: 'tmpl-planetary-box',
    partSku: 'PBOX-PLN-70',
    partName: 'Planetary Gearbox Housing 70mm',
    productFamily: 'Precision Motion Assemblies',
    version: 'v2.1',
    sampleSizeRule: '100%_inspection',
    aqlLevel: '0.40 Critical / 1.0 Major',
    standardReference: 'ISO 9001:2015, AGMA Class 10',
    createdBy: 'Elena Vance (Lead Quality Engineer)',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
    items: [
      {
        id: 'item-pb1',
        title: 'Mounting Pilot Flange Runout',
        criteria: 'Radial runout of pilot diameter <= 0.015 mm TIR',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Dial Test Indicator & Precision Mandrel',
        isMeasurement: true,
        targetNominal: 0.008,
        upperTolerance: 0.015,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pending',
        gageAssetTag: 'GAG-IND-019'
      },
      {
        id: 'item-pb2',
        title: 'Pressure Decay Leak Test',
        criteria: 'IP65 housing sealed, decay <= 0.05 bar over 60 seconds at 1.5 bar test pressure',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Pneumatic Pressure Leak Decay Bench',
        isMeasurement: true,
        targetNominal: 0.02,
        upperTolerance: 0.05,
        lowerTolerance: 0.00,
        unit: 'bar',
        result: 'pending'
      },
      {
        id: 'item-pb3',
        title: 'Anodized Coating Thickness & Appearance',
        criteria: 'Type II clear anodize 15-20 µm, no discoloration, water spots, or contact marks',
        category: 'visual',
        criticalLevel: 'major',
        inspectionMethod: 'Eddy Current Coating Gauge',
        isMeasurement: true,
        targetNominal: 18.0,
        upperTolerance: 20.0,
        lowerTolerance: 15.0,
        unit: 'µm',
        result: 'pending'
      },
      {
        id: 'item-pb4',
        title: 'Final Torque Fastener Check',
        criteria: 'All M5 grade 12.9 casing screws torqued to 8.5 ± 0.3 N·m with torque seal tamper indicator',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Calibrated Digital Torque Wrench',
        isMeasurement: true,
        targetNominal: 8.5,
        upperTolerance: 8.8,
        lowerTolerance: 8.2,
        unit: 'N·m',
        result: 'pending',
        gageAssetTag: 'GAG-TRQ-012'
      },
      {
        id: 'item-pb5',
        title: 'Certificate of Conformance & Manual Included',
        criteria: 'Product user manual, signed inspection report, and CE/UKCA conformity leaflet packed',
        category: 'documentation',
        criticalLevel: 'major',
        inspectionMethod: 'Verification Checklist',
        isMeasurement: false,
        result: 'pending'
      }
    ]
  },
  {
    id: 'tmpl-titan-flange',
    partSku: 'FLG-TITAN-AERO-01',
    partName: 'Aerospace Grade 5 Titanium Flange',
    productFamily: 'Aerospace Structural',
    version: 'v4.0',
    sampleSizeRule: '100%_inspection',
    aqlLevel: 'Zero Defect (C=0)',
    standardReference: 'AS9100 Rev D, EN 9100, AMS 4928',
    createdBy: 'David Vance (Aerospace Quality Director)',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-09-02T16:00:00Z',
    items: [
      {
        id: 'item-tf1',
        title: 'Bolt Hole Circle PCD Diameter',
        criteria: '8x Ø6.5mm holes on PCD 85.000 ± 0.020 mm with true position 0.05mm MMC',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Coordinate Measuring Machine (CMM)',
        isMeasurement: true,
        targetNominal: 85.000,
        upperTolerance: 0.020,
        lowerTolerance: -0.020,
        unit: 'mm',
        result: 'pending',
        gageAssetTag: 'GAG-CMM-001'
      },
      {
        id: 'item-tf2',
        title: 'Flange Sealing Face Flatness',
        criteria: 'Precision ground sealing face flatness <= 0.008 mm across entire diameter',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Granite Table & Dial Indicator',
        isMeasurement: true,
        targetNominal: 0.004,
        upperTolerance: 0.008,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pending',
        gageAssetTag: 'GAG-IND-019'
      },
      {
        id: 'item-tf3',
        title: 'Fluorescent Penetrant Inspection (FPI)',
        criteria: 'ASTM E1417 Level 3 FPI - Zero linear indications, zero cracks or surface porosity',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'FPI Inspection Line under UV Light',
        isMeasurement: false,
        result: 'pending'
      },
      {
        id: 'item-tf4',
        title: 'Material Heat Traceability Verification',
        criteria: 'EN 10204 3.1 Mill Test Certificate cross-verified with heat stamp on part OD',
        category: 'documentation',
        criticalLevel: 'critical',
        inspectionMethod: 'Document Audit vs Part Stamping',
        isMeasurement: false,
        result: 'pending'
      }
    ]
  }
];

// Seed initial FQC inspection orders
const INITIAL_ORDERS: FqcInspectionOrder[] = [
  {
    id: 'fqc-001',
    fqcNumber: 'FQC-2026-0042',
    orderId: 'order_test_01',
    orderNumber: 'ORD-2026-901',
    workOrderId: 'WO-2026-4410',
    workOrderNumber: 'WO-4410',
    customerName: 'Kirloskar Heavy Transmission Systems',
    customerId: 'cust-kh-01',
    partSku: 'GEAR-SPUR-M4',
    partName: 'Forged Steel Spur Gear (Mod 4, 32T)',
    lotNumber: 'LOT-2026-G882',
    batchQuantity: 20,
    sampleSize: 5,
    inspectionDate: '2026-10-10',
    inspectorName: 'Marcus Chen',
    inspectorId: 'tech-042',
    status: 'passed',
    holdStatus: 'released', // RELEASED WITH CoC!
    overallResult: 'pass',
    defectSummary: { critical: 0, major: 0, minor: 0 },
    packagingSealed: true,
    barcodeVerified: true,
    cocGenerated: true,
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ],
    qualityAuthoritySignOff: {
      signedBy: 'Sarah Lin, CQE',
      role: 'Quality Assurance Authority',
      badgeId: 'QA-AUTH-09',
      signedAt: '2026-10-10T16:30:00Z',
      remarks: 'All 5 samples measured 100% conforming to DIN 3962 Class 6. Hardness case depth verified at 60.2 HRC. Packaging anti-rust VCI sealed. Cleared for dispatch gate.',
      disposition: 'passed',
      signaturePinOrHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cocNumber: 'COC-2026-0081'
    },
    items: [
      {
        id: 'item-g1',
        title: 'Bore Diameter (H7 Tolerance)',
        criteria: 'Finished internal bore must measure within 50.000 +0.025 / -0.000 mm',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: '3-Point Bore Micrometer',
        isMeasurement: true,
        targetNominal: 50.000,
        upperTolerance: 0.025,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pass',
        measuredValue: 50.012,
        gageAssetTag: 'GAG-MIC-014',
        notes: 'Average across 5 samples: 50.012 mm (min 50.009, max 50.014)'
      },
      {
        id: 'item-g2',
        title: 'Outer Tip Diameter (Da)',
        criteria: 'Overall outer diameter must measure 136.000 ± 0.050 mm',
        category: 'dimension',
        criticalLevel: 'major',
        inspectionMethod: 'Digital Vernier Caliper',
        isMeasurement: true,
        targetNominal: 136.000,
        upperTolerance: 0.050,
        lowerTolerance: -0.050,
        unit: 'mm',
        result: 'pass',
        measuredValue: 136.015,
        gageAssetTag: 'GAG-CAL-002'
      },
      {
        id: 'item-g3',
        title: 'Tooth Flank Surface Finish (Ra)',
        criteria: 'Tooth profile roughness Ra <= 0.8 µm, zero pitting, scuffing or chatter marks',
        category: 'cleanliness',
        criticalLevel: 'major',
        inspectionMethod: 'Surface Roughness Tester',
        isMeasurement: true,
        targetNominal: 0.65,
        upperTolerance: 0.80,
        lowerTolerance: 0.10,
        unit: 'µm',
        result: 'pass',
        measuredValue: 0.42,
        gageAssetTag: 'GAG-SRT-008'
      },
      {
        id: 'item-g4',
        title: 'Tooth Hardness (Case Depth)',
        criteria: 'Induction hardened tooth profile surface 58 - 62 HRC',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Rockwell C Hardness Tester',
        isMeasurement: true,
        targetNominal: 60.0,
        upperTolerance: 2.0,
        lowerTolerance: -2.0,
        unit: 'HRC',
        result: 'pass',
        measuredValue: 60.2,
        gageAssetTag: 'GAG-HRC-005'
      },
      {
        id: 'item-g5',
        title: 'Visual Surface & Chamfers',
        criteria: '100% burr-free, uniform 1.0mm 45° chamfers, black oxide coating uniform without bare spots',
        category: 'visual',
        criticalLevel: 'minor',
        inspectionMethod: 'Visual Inspection & 10x Loupe',
        isMeasurement: false,
        result: 'pass'
      },
      {
        id: 'item-g6',
        title: 'Laser Part Marking & 2D DataMatrix',
        criteria: 'Legible laser etched Part No, Heat Lot #, and readable DataMatrix ECC200 barcode',
        category: 'documentation',
        criticalLevel: 'critical',
        inspectionMethod: 'Fixed Optical Barcode Scanner',
        isMeasurement: false,
        result: 'pass'
      },
      {
        id: 'item-g7',
        title: 'VCI Anti-Corrosion Wrap & Packaging',
        criteria: 'Sealed inside sealed VCI vapor corrosion inhibitor bag with desiccant pouch in heavy corrugated box',
        category: 'packaging',
        criticalLevel: 'major',
        inspectionMethod: 'Visual Packaging Check',
        isMeasurement: false,
        result: 'pass'
      }
    ],
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-10-10T16:30:00Z'
  },
  {
    id: 'fqc-002',
    fqcNumber: 'FQC-2026-0043',
    orderId: 'order_test_02',
    orderNumber: 'ORD-2026-902',
    workOrderId: 'WO-2026-4418',
    workOrderNumber: 'WO-4418',
    customerName: 'Bharat Precision Automotives Ltd.',
    customerId: 'cust-bp-02',
    partSku: 'PBOX-PLN-70',
    partName: 'Planetary Gearbox Housing 70mm',
    lotNumber: 'LOT-2026-P910',
    batchQuantity: 15,
    sampleSize: 15, // 100% inspection
    inspectionDate: '2026-10-12',
    inspectorName: 'Dev Patel',
    inspectorId: 'tech-018',
    status: 'in_progress',
    holdStatus: 'on_hold', // AUTO-HOLD ACTIVE!
    overallResult: 'pending',
    defectSummary: { critical: 0, major: 0, minor: 0 },
    packagingSealed: false,
    barcodeVerified: true,
    cocGenerated: false,
    photos: [],
    items: [
      {
        id: 'item-pb1',
        title: 'Mounting Pilot Flange Runout',
        criteria: 'Radial runout of pilot diameter <= 0.015 mm TIR',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Dial Test Indicator & Precision Mandrel',
        isMeasurement: true,
        targetNominal: 0.008,
        upperTolerance: 0.015,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pass',
        measuredValue: 0.011,
        gageAssetTag: 'GAG-IND-019'
      },
      {
        id: 'item-pb2',
        title: 'Pressure Decay Leak Test',
        criteria: 'IP65 housing sealed, decay <= 0.05 bar over 60 seconds at 1.5 bar test pressure',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Pneumatic Pressure Leak Decay Bench',
        isMeasurement: true,
        targetNominal: 0.02,
        upperTolerance: 0.05,
        lowerTolerance: 0.00,
        unit: 'bar',
        result: 'pending'
      },
      {
        id: 'item-pb3',
        title: 'Anodized Coating Thickness & Appearance',
        criteria: 'Type II clear anodize 15-20 µm, no discoloration, water spots, or contact marks',
        category: 'visual',
        criticalLevel: 'major',
        inspectionMethod: 'Eddy Current Coating Gauge',
        isMeasurement: true,
        targetNominal: 18.0,
        upperTolerance: 20.0,
        lowerTolerance: 15.0,
        unit: 'µm',
        result: 'pending'
      },
      {
        id: 'item-pb4',
        title: 'Final Torque Fastener Check',
        criteria: 'All M5 grade 12.9 casing screws torqued to 8.5 ± 0.3 N·m with torque seal tamper indicator',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'Calibrated Digital Torque Wrench',
        isMeasurement: true,
        targetNominal: 8.5,
        upperTolerance: 8.8,
        lowerTolerance: 8.2,
        unit: 'N·m',
        result: 'pending',
        gageAssetTag: 'GAG-TRQ-012'
      },
      {
        id: 'item-pb5',
        title: 'Certificate of Conformance & Manual Included',
        criteria: 'Product user manual, signed inspection report, and CE/UKCA conformity leaflet packed',
        category: 'documentation',
        criticalLevel: 'major',
        inspectionMethod: 'Verification Checklist',
        isMeasurement: false,
        result: 'pending'
      }
    ],
    createdAt: '2026-10-12T07:30:00Z',
    updatedAt: '2026-10-12T08:15:00Z'
  },
  {
    id: 'fqc-003',
    fqcNumber: 'FQC-2026-0044',
    orderId: 'order_test_03',
    orderNumber: 'ORD-2026-905',
    workOrderId: 'WO-2026-4422',
    workOrderNumber: 'WO-4422',
    customerName: 'Hindustan Aeronautics Component Division',
    customerId: 'cust-hac-03',
    partSku: 'FLG-TITAN-AERO-01',
    partName: 'Aerospace Grade 5 Titanium Flange',
    lotNumber: 'LOT-2026-T702',
    batchQuantity: 8,
    sampleSize: 8,
    inspectionDate: '2026-10-11',
    inspectorName: 'Ananya Roy',
    inspectorId: 'tech-022',
    status: 'quarantined',
    holdStatus: 'quarantined', // QUARANTINED! DISPATCH HARD-BLOCKED
    overallResult: 'fail',
    defectSummary: { critical: 1, major: 0, minor: 1 },
    failureReason: 'Critical Hole Circle True Position breach on Hole #4 (+0.078mm vs 0.050mm limit). Material quarantined to MRB area.',
    packagingSealed: false,
    barcodeVerified: true,
    cocGenerated: false,
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    ],
    qualityAuthoritySignOff: {
      signedBy: 'Sarah Lin, CQE',
      role: 'Quality Assurance Authority',
      badgeId: 'QA-AUTH-09',
      signedAt: '2026-10-11T17:15:00Z',
      remarks: 'REJECTED: Non-conformance report NCR-2026-109 opened. Part does not meet drawing rev D requirement. Dispatch strictly quarantined.',
      disposition: 'rejected',
      signaturePinOrHash: 'SHA256:d82e1...rejection-hash',
      cocNumber: 'REJECTED-NCR-109'
    },
    items: [
      {
        id: 'item-tf1',
        title: 'Bolt Hole Circle PCD Diameter',
        criteria: '8x Ø6.5mm holes on PCD 85.000 ± 0.020 mm with true position 0.05mm MMC',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Coordinate Measuring Machine (CMM)',
        isMeasurement: true,
        targetNominal: 85.000,
        upperTolerance: 0.020,
        lowerTolerance: -0.020,
        unit: 'mm',
        result: 'fail',
        measuredValue: 85.068,
        gageAssetTag: 'GAG-CMM-001',
        notes: 'Out of tolerance on hole #4 by +0.068mm'
      },
      {
        id: 'item-tf2',
        title: 'Flange Sealing Face Flatness',
        criteria: 'Precision ground sealing face flatness <= 0.008 mm across entire diameter',
        category: 'dimension',
        criticalLevel: 'critical',
        inspectionMethod: 'Granite Table & Dial Indicator',
        isMeasurement: true,
        targetNominal: 0.004,
        upperTolerance: 0.008,
        lowerTolerance: 0.000,
        unit: 'mm',
        result: 'pass',
        measuredValue: 0.005,
        gageAssetTag: 'GAG-IND-019'
      },
      {
        id: 'item-tf3',
        title: 'Fluorescent Penetrant Inspection (FPI)',
        criteria: 'ASTM E1417 Level 3 FPI - Zero linear indications, zero cracks or surface porosity',
        category: 'functional',
        criticalLevel: 'critical',
        inspectionMethod: 'FPI Inspection Line under UV Light',
        isMeasurement: false,
        result: 'pass'
      },
      {
        id: 'item-tf4',
        title: 'Material Heat Traceability Verification',
        criteria: 'EN 10204 3.1 Mill Test Certificate cross-verified with heat stamp on part OD',
        category: 'documentation',
        criticalLevel: 'critical',
        inspectionMethod: 'Document Audit vs Part Stamping',
        isMeasurement: false,
        result: 'pass'
      }
    ],
    createdAt: '2026-10-11T11:00:00Z',
    updatedAt: '2026-10-11T17:15:00Z'
  }
];

// Helper to load templates
function loadTemplates(): FqcChecklistTemplate[] {
  try {
    const raw = localStorage.getItem(FQC_TEMPLATES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading FQC templates from storage:', e);
  }
  return INITIAL_TEMPLATES;
}

// Helper to save templates
function persistTemplates(templates: FqcChecklistTemplate[]) {
  try {
    localStorage.setItem(FQC_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed persisting FQC templates:', e);
  }
}

// Helper to load orders
function loadOrders(): FqcInspectionOrder[] {
  try {
    const raw = localStorage.getItem(FQC_ORDERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading FQC orders from storage:', e);
  }
  return INITIAL_ORDERS;
}

// Helper to persist orders
function persistOrders(orders: FqcInspectionOrder[]) {
  try {
    localStorage.setItem(FQC_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed persisting FQC orders:', e);
  }
}

export const fqcService = {
  // Get all templates
  getTemplates(): FqcChecklistTemplate[] {
    return loadTemplates();
  },

  // Get template by part SKU
  getTemplateByPartSku(sku: string): FqcChecklistTemplate | null {
    const templates = loadTemplates();
    return templates.find(t => t.partSku.toLowerCase() === sku.toLowerCase()) || null;
  },

  // Save / Update template
  saveTemplate(templateData: FqcChecklistTemplate): FqcChecklistTemplate {
    const templates = loadTemplates();
    const idx = templates.findIndex(t => t.id === templateData.id);
    const now = new Date().toISOString();
    let saved: FqcChecklistTemplate;

    if (idx >= 0) {
      saved = { ...templateData, updatedAt: now };
      templates[idx] = saved;
    } else {
      saved = {
        ...templateData,
        id: templateData.id || `tmpl-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      templates.unshift(saved);
    }

    persistTemplates(templates);
    return saved;
  },

  // Get all FQC inspection orders with optional filtering
  getOrders(filters?: FqcFilterOptions): FqcInspectionOrder[] {
    let orders = loadOrders();
    if (!filters) return orders;

    return orders.filter(ord => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matches =
          ord.fqcNumber.toLowerCase().includes(q) ||
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.customerName.toLowerCase().includes(q) ||
          ord.partSku.toLowerCase().includes(q) ||
          ord.partName.toLowerCase().includes(q) ||
          ord.lotNumber.toLowerCase().includes(q) ||
          (ord.workOrderNumber && ord.workOrderNumber.toLowerCase().includes(q)) ||
          (ord.qualityAuthoritySignOff?.cocNumber && ord.qualityAuthoritySignOff.cocNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filters.status && filters.status !== 'all') {
        if (ord.status !== filters.status) return false;
      }

      if (filters.holdStatus && filters.holdStatus !== 'all') {
        if (ord.holdStatus !== filters.holdStatus) return false;
      }

      if (filters.partSku && filters.partSku !== 'all') {
        if (ord.partSku !== filters.partSku) return false;
      }

      if (filters.customer && filters.customer !== 'all') {
        if (ord.customerName !== filters.customer) return false;
      }

      return true;
    });
  },

  // Get order by ID
  getOrderById(id: string): FqcInspectionOrder | null {
    const orders = loadOrders();
    return orders.find(o => o.id === id) || null;
  },

  // Get order by sales order ID or Order Number
  getOrderByOrderId(orderIdOrNumber: string): FqcInspectionOrder | null {
    if (!orderIdOrNumber) return null;
    const clean = orderIdOrNumber.toLowerCase();
    const orders = loadOrders();
    return (
      orders.find(
        o =>
          o.orderId.toLowerCase() === clean ||
          o.orderNumber.toLowerCase() === clean
      ) || null
    );
  },

  // Get order by work order ID
  getOrderByWorkOrderId(woId: string): FqcInspectionOrder | null {
    if (!woId) return null;
    const clean = woId.toLowerCase();
    const orders = loadOrders();
    return (
      orders.find(
        o =>
          (o.workOrderId && o.workOrderId.toLowerCase() === clean) ||
          (o.workOrderNumber && o.workOrderNumber.toLowerCase() === clean)
      ) || null
    );
  },

  // CRITICAL ACCEPTANCE CRITERIA:
  // "dispatch release gate; auto-hold if FQC pending"
  // Checks if an order is permitted to be shipped or dispatched
  checkDispatchReleaseEligibility(orderIdOrNumber: string): DispatchReleaseCheck {
    if (!orderIdOrNumber) {
      return {
        isEligible: false,
        status: 'not_initiated',
        message: 'No active production or sales order specified for dispatch.',
        holdReason: 'A valid production order must be linked to check Quality Release.'
      };
    }

    const order = this.getOrderByOrderId(orderIdOrNumber);

    // If no FQC order exists yet for this finished goods batch:
    if (!order) {
      return {
        isEligible: false,
        status: 'not_initiated',
        message: 'AUTO-HOLD: Final Quality Control (FQC) inspection has not been initiated for this order.',
        holdReason: 'Dispatch Gate Enforced: Finished products require a 100% completed FQC checklist and Quality Authority sign-off before dispatch per ISO 9001:2015 & IATF 16949 Section 8.6.'
      };
    }

    // If FQC is on hold or in progress
    if (order.holdStatus === 'on_hold') {
      return {
        isEligible: false,
        fqcOrder: order,
        status: 'on_hold',
        message: `AUTO-HOLD ACTIVE: Final Quality Inspection (${order.fqcNumber}) is ${order.status.toUpperCase()} and NOT released.`,
        holdReason: `Pending completion of inspection checklist items and authorized QA Manager sign-off. Defect summary: ${order.defectSummary.critical} critical, ${order.defectSummary.major} major.`
      };
    }

    // If FQC is quarantined or rejected
    if (order.holdStatus === 'quarantined' || order.status === 'rejected') {
      return {
        isEligible: false,
        fqcOrder: order,
        status: 'quarantined',
        message: `DISPATCH BLOCKED: Order is QUARANTINED under Non-Conformance Report (${order.fqcNumber}).`,
        holdReason: order.failureReason || 'Quality Authority has formally rejected this batch due to non-conformance. Product cannot be dispatched.'
      };
    }

    // If released!
    if (order.holdStatus === 'released' && order.qualityAuthoritySignOff) {
      return {
        isEligible: true,
        fqcOrder: order,
        status: 'released',
        cocNumber: order.qualityAuthoritySignOff.cocNumber,
        signedBy: order.qualityAuthoritySignOff.signedBy,
        signedAt: order.qualityAuthoritySignOff.signedAt,
        message: `CLEARED FOR DISPATCH: Verified Certificate of Conformance ${order.qualityAuthoritySignOff.cocNumber} signed by ${order.qualityAuthoritySignOff.signedBy}.`
      };
    }

    // Fallback hold
    return {
      isEligible: false,
      fqcOrder: order,
      status: 'on_hold',
      message: 'Quality Hold: Awaiting formal Quality Authority e-signature and Certificate of Conformance release.',
      holdReason: 'All inspection items must be signed off by a certified quality inspector or manager.'
    };
  },

  // Create new FQC inspection order
  createOrder(data: Partial<FqcInspectionOrder>): FqcInspectionOrder {
    const orders = loadOrders();
    const now = new Date().toISOString();
    const count = orders.length + 45;
    const fqcNumber = data.fqcNumber || `FQC-2026-${count.toString().padStart(4, '0')}`;

    // Load template items if matching SKU exists and no items provided
    let items = data.items || [];
    if (items.length === 0 && data.partSku) {
      const template = this.getTemplateByPartSku(data.partSku);
      if (template) {
        items = template.items.map(it => ({
          ...it,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          result: 'pending',
          measuredValue: undefined,
          notes: ''
        }));
      }
    }

    const newOrder: FqcInspectionOrder = {
      id: data.id || `fqc-ord-${Date.now()}`,
      fqcNumber,
      orderId: data.orderId || `order-${Date.now()}`,
      orderNumber: data.orderNumber || `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      workOrderId: data.workOrderId || '',
      workOrderNumber: data.workOrderNumber || '',
      customerName: data.customerName || 'General Industrial Client',
      customerId: data.customerId || '',
      partSku: data.partSku || 'PART-GEN-001',
      partName: data.partName || 'Precision Finished Part',
      lotNumber: data.lotNumber || `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      batchQuantity: data.batchQuantity || 10,
      sampleSize: data.sampleSize || 5,
      inspectionDate: data.inspectionDate || now.split('T')[0],
      inspectorName: data.inspectorName || 'Lead Quality Inspector',
      inspectorId: data.inspectorId || 'tech-001',
      status: 'pending',
      holdStatus: 'on_hold', // Automatically On-Hold until passed and signed!
      overallResult: 'pending',
      defectSummary: { critical: 0, major: 0, minor: 0 },
      packagingSealed: false,
      barcodeVerified: false,
      cocGenerated: false,
      photos: [],
      notes: data.notes || '',
      items,
      createdAt: now,
      updatedAt: now
    };

    orders.unshift(newOrder);
    persistOrders(orders);
    return newOrder;
  },

  // Update item result in an FQC order
  updateChecklistItem(
    orderId: string,
    itemId: string,
    update: Partial<FqcChecklistItem>
  ): FqcInspectionOrder {
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('FQC Order not found');

    const order = orders[idx];
    const updatedItems = order.items.map(it => {
      if (it.id !== itemId) return it;
      const merged = { ...it, ...update };

      // If item is a measurement and measuredValue is provided, auto-evaluate pass/fail
      if (merged.isMeasurement && merged.measuredValue !== undefined && merged.targetNominal !== undefined) {
        const val = merged.measuredValue;
        const upper = merged.targetNominal + (merged.upperTolerance ?? 0);
        const lower = merged.targetNominal + (merged.lowerTolerance ?? 0);
        if (val >= lower && val <= upper) {
          merged.result = 'pass';
        } else {
          merged.result = 'fail';
        }
      }

      return merged;
    });

    // Recompute defect summary
    let criticalDefects = 0;
    let majorDefects = 0;
    let minorDefects = 0;
    let anyPending = false;
    let anyFail = false;

    for (const it of updatedItems) {
      if (it.result === 'pending') anyPending = true;
      if (it.result === 'fail') {
        anyFail = true;
        if (it.criticalLevel === 'critical') criticalDefects++;
        else if (it.criticalLevel === 'major') majorDefects++;
        else minorDefects++;
      }
    }

    const defectSummary = {
      critical: criticalDefects,
      major: majorDefects,
      minor: minorDefects
    };

    let newStatus = order.status;
    let overallResult: 'pass' | 'fail' | 'pending' = 'pending';

    if (anyFail) {
      overallResult = 'fail';
      newStatus = 'in_progress';
    } else if (!anyPending && updatedItems.length > 0) {
      overallResult = 'pass';
      newStatus = 'passed';
    } else {
      newStatus = 'in_progress';
      overallResult = 'pending';
    }

    const updatedOrder: FqcInspectionOrder = {
      ...order,
      items: updatedItems,
      defectSummary,
      overallResult,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    orders[idx] = updatedOrder;
    persistOrders(orders);
    return updatedOrder;
  },

  // Save full order state (e.g., photos, seal, barcodes)
  saveOrder(updatedOrder: FqcInspectionOrder): FqcInspectionOrder {
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === updatedOrder.id);
    if (idx === -1) throw new Error('FQC Order not found');

    const saved = { ...updatedOrder, updatedAt: new Date().toISOString() };
    orders[idx] = saved;
    persistOrders(orders);
    return saved;
  },

  // CRITICAL ACCEPTANCE CRITERIA:
  // "sign-off by quality authority; dispatch release gate"
  signOffOrder(
    orderId: string,
    signOffData: {
      signedBy: string;
      role: string;
      badgeId?: string;
      remarks: string;
      disposition: 'passed' | 'rejected' | 'conditional_release';
      signaturePinOrHash?: string;
    }
  ): FqcInspectionOrder {
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('FQC Order not found');

    const order = orders[idx];
    const now = new Date().toISOString();
    const cocNumber = `COC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const signOff: QualityAuthoritySignOff = {
      signedBy: signOffData.signedBy,
      role: signOffData.role || 'Quality Assurance Manager',
      badgeId: signOffData.badgeId || 'QA-CERT-2026',
      signedAt: now,
      remarks: signOffData.remarks,
      disposition: signOffData.disposition,
      signaturePinOrHash: signOffData.signaturePinOrHash || `SHA256:${Date.now().toString(16)}...authorized-stamp`,
      cocNumber
    };

    let newHoldStatus: 'released' | 'quarantined' | 'on_hold' = 'on_hold';
    let newStatus = order.status;

    if (signOffData.disposition === 'passed') {
      newHoldStatus = 'released';
      newStatus = 'passed';
    } else if (signOffData.disposition === 'conditional_release') {
      newHoldStatus = 'released';
      newStatus = 'conditional_release';
    } else {
      newHoldStatus = 'quarantined';
      newStatus = 'rejected';

      // Auto-create NCR on rejection
      try {
        ncrService.autoCreateNcrFromFailure('fqc', {
          sourceReferenceId: order.fqcNumber,
          title: `FQC Rejection on ${order.partSku} (${order.lotNumber})`,
          partSku: order.partSku,
          partName: order.partName,
          lotNumber: order.lotNumber,
          workOrderNumber: order.workOrderNumber,
          customerName: order.customerName,
          reportedBy: signOffData.signedBy,
          defectCategory: 'dimension',
          severity: 'critical',
          affectedQuantity: order.batchQuantity,
          defectiveQuantity: order.sampleSize,
          defectDescription: signOffData.remarks || 'FQC Inspection failed critical characteristics.',
          immediateContainment: 'Quarantined at FQC release gate; shipment withheld.',
          quarantineLocation: 'MRB Vault Cage',
          financialImpactCopq: order.batchQuantity * 120
        });
      } catch (err) {
        console.warn('Auto-create NCR on FQC rejection failed:', err);
      }
    }

    const updatedOrder: FqcInspectionOrder = {
      ...order,
      qualityAuthoritySignOff: signOff,
      holdStatus: newHoldStatus,
      status: newStatus,
      cocGenerated: signOffData.disposition !== 'rejected',
      updatedAt: now
    };

    orders[idx] = updatedOrder;
    persistOrders(orders);
    return updatedOrder;
  },

  // Get KPI Summary
  getKpiSummary(): FqcKpiSummary {
    const orders = loadOrders();
    const total = orders.length;
    const released = orders.filter(o => o.holdStatus === 'released').length;
    const onHold = orders.filter(o => o.holdStatus === 'on_hold').length;
    const rejected = orders.filter(o => o.holdStatus === 'quarantined' || o.status === 'rejected').length;
    const passedFirstPass = orders.filter(o => o.status === 'passed' && o.defectSummary.critical === 0).length;

    const fpy = total > 0 ? Math.round((passedFirstPass / total) * 100) : 100;

    return {
      totalOrders: total,
      releasedCount: released,
      onHoldCount: onHold,
      rejectedCount: rejected,
      firstPassYieldPct: fpy,
      avgInspectionMinutes: 18
    };
  },

  // Export CSV
  exportCsv(): string {
    const orders = loadOrders();
    const headers = [
      'FQC Number',
      'Order Number',
      'Work Order',
      'Customer',
      'Part SKU',
      'Part Name',
      'Lot Number',
      'Batch Qty',
      'Sample Size',
      'Inspection Date',
      'Inspector',
      'Status',
      'Hold Status',
      'Critical Defects',
      'Major Defects',
      'Sign-off Authority',
      'CoC Number',
      'Release Date'
    ];

    const rows = orders.map(o => [
      `"${o.fqcNumber}"`,
      `"${o.orderNumber}"`,
      `"${o.workOrderNumber || ''}"`,
      `"${o.customerName}"`,
      `"${o.partSku}"`,
      `"${o.partName}"`,
      `"${o.lotNumber}"`,
      o.batchQuantity,
      o.sampleSize,
      `"${o.inspectionDate}"`,
      `"${o.inspectorName}"`,
      `"${o.status}"`,
      `"${o.holdStatus}"`,
      o.defectSummary.critical,
      o.defectSummary.major,
      `"${o.qualityAuthoritySignOff?.signedBy || 'Pending'}"`,
      `"${o.qualityAuthoritySignOff?.cocNumber || 'N/A'}"`,
      `"${o.qualityAuthoritySignOff?.signedAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }
};
