// src/types/traceability.ts

import { StockCategory } from '../types';

export type LotType =
  | 'raw_material'     // Coil, bar, ingot, sheet metal, resin
  | 'sub_assembly'     // Machined sub-components, pre-welded frames
  | 'finished_goods'   // Final inspected products ready for dispatch
  | 'bought_out'       // Hardware, fasteners, seals, standard bearings
  | 'consumable';      // Tooling, oils, cutting fluids

export type LotStatus =
  | 'released'         // Inspection passed; active and available for use
  | 'quarantine'       // On hold pending metallurgical / dimensional test
  | 'rejected'         // Failed inspection; tagged for vendor return or scrap
  | 'recalled'         // Flagged under active recall containment
  | 'consumed'         // Fully issued into production work orders
  | 'expired'          // Past shelf-life or calibration window
  | 'depleted';        // Quantity exhausted

export type InspectionStatus =
  | 'passed'
  | 'pending'
  | 'conditional'
  | 'rejected';

export interface QualityTestParameter {
  name: string;               // e.g. "Tensile Strength", "Rockwell Hardness", "Carbon (C%)", "Runout"
  specification: string;      // e.g. "650 - 750 MPa", "58 - 62 HRC", "0.38 - 0.43%", "≤ 0.02 mm"
  measuredValue: string;      // e.g. "710 MPa", "60 HRC", "0.41%", "0.012 mm"
  status: 'pass' | 'fail' | 'marginal';
}

export interface QualityInspectionRecord {
  id: string;
  inspectionNumber: string;   // e.g. "QC-2026-0819"
  inspectorId: string;
  inspectorName: string;
  inspectionDate: string;
  parameters: QualityTestParameter[];
  visualCheckPassed: boolean;
  mtrNumber?: string;         // Mill Test Report / Certificate of Analysis (COA) #
  mtrAttachmentName?: string;
  disposition: 'accept' | 'scrap' | 'rework' | 'regrade' | 'return_to_vendor';
  notes?: string;
  certifiedBy?: string;
}

export interface CustomerDispatchRecord {
  id: string;
  salesOrderNumber: string;   // e.g. "SO-2026-0042"
  customerName: string;       // e.g. "Bajaj Auto Ltd. — Chakan Plant"
  invoiceNumber: string;      // e.g. "INV-2026-118"
  dispatchDate: string;
  dispatchedQty: number;
  unit: string;
  trackingNumber?: string;    // Lorry / Courier LR #
  destinationCity?: string;
}

export interface WorkOrderConsumptionLink {
  id: string;
  workOrderId: string;        // Linking WO
  workOrderNumber: string;    // e.g. "WO-2026-001"
  partName: string;
  operationSequence?: number; // e.g. 10 (Forging), 20 (CNC Machining)
  operationName?: string;
  workCenterName?: string;
  consumedQty: number;
  unit: string;
  consumedAt: string;
  consumedByOperator: string;
  resultingFgLotNumber?: string;
  scrapQty?: number;
  notes?: string;
}

export interface LotRecord {
  id: string;
  tenantId: string;
  lotNumber: string;          // e.g. "LOT-2026-RM-0412", "LOT-2026-FG-0089"
  barcode: string;            // e.g. "LOT2026RM0412"
  lotType: LotType;
  stockItemId: string;
  stockItemCode: string;      // e.g. "WR-1002"
  stockItemName: string;      // e.g. "Wire Rod — High Tensile Steel 8mm"
  category: StockCategory;
  materialGrade?: string;     // e.g. "EN8D", "AISI 4140", "SAE 1018"
  heatNumber?: string;        // Mill Heat / Cast # e.g. "HT-TATA-9942"
  supplierId?: string;
  supplierName?: string;      // e.g. "Tata Prime Steel Ltd."
  poNumber?: string;          // e.g. "PO-2026-902"
  grnNumber?: string;         // Goods Receipt Note # e.g. "GRN-2026-0182"
  vendorChallanNo?: string;   // e.g. "CH-88219"
  vendorLotNumber?: string;   // e.g. "TAT-COIL-993-B"

  // Quantities & Valuation
  initialQty: number;
  currentQty: number;
  reservedQty: number;
  consumedQty: number;
  quarantinedQty: number;
  unit: string;               // "tonnes", "kg", "units", "meters"
  unitCost: number;           // Standard / landed cost in ₹
  totalValue: number;         // currentQty * unitCost

  // Physical Location
  plantId: string;
  plantName: string;
  storeId: string;
  storeName: string;
  binId: string;
  binCode: string;

  // Quality & Life Cycle
  status: LotStatus;
  inspectionStatus: InspectionStatus;
  inspectionRecord?: QualityInspectionRecord;
  manufactureDate: string;
  expiryDate?: string;
  receivedAt: string;
  receivedBy: string;
  receivedByName: string;

  // Production Linkage
  producedFromWorkOrderId?: string; // e.g. "wo-001"
  producedFromOrderNumber?: string; // e.g. "WO-2026-001"
  parentLotNumbers?: string[];      // Raw material parent lots consumed
  childLotNumbers?: string[];       // Finished goods / sub-assembly child lots produced

  // Work Order Consumption & Dispatches
  workOrderLinks?: WorkOrderConsumptionLink[];
  dispatchedToCustomers?: CustomerDispatchRecord[];

  // Recall / Containment Tracking
  isRecalled?: boolean;
  recalledAt?: string;
  recalledReason?: string;
  recallId?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TraceDirection = 'backward' | 'forward';

export interface TraceabilityNode {
  id: string;
  type: 'supplier' | 'purchase_order' | 'raw_lot' | 'work_order' | 'fg_lot' | 'customer_dispatch' | 'inventory_bin';
  code: string;               // e.g. "SUP-TATA-01", "PO-2026-902", "LOT-2026-RM-0412", "WO-2026-001", "INV-2026-118"
  label: string;              // e.g. "Tata Prime Steel Ltd."
  subLabel?: string;          // e.g. "Qty: 15.0 tonnes | EN8D | Heat # HT-TATA-9942"
  date?: string;
  status: string;
  severity?: 'normal' | 'warning' | 'critical' | 'success';
  location?: string;          // e.g. "BIN-RM-A01"
  metrics?: Record<string, string | number>;
  meta?: Record<string, any>;
  children?: TraceabilityNode[];
}

export interface TraceabilityGraph {
  rootLotNumber: string;
  direction: TraceDirection;
  generatedAt: string;
  nodes: TraceabilityNode[];
  summary: {
    totalRawLotsCount: number;
    totalWorkOrdersCount: number;
    totalFinishedLotsCount: number;
    totalCustomersAffected: number;
    totalUnitsExposed: number;
    totalValueExposed: number;
  };
}

export type RecallSeverity = 'critical' | 'major' | 'minor';

export type RecallDefectType =
  | 'chemical_out_of_spec'
  | 'dimensional_variation'
  | 'surface_crack_inclusion'
  | 'hardness_failure'
  | 'contamination'
  | 'supplier_safety_alert'
  | 'customer_assembly_failure';

export interface AffectedLocationInventory {
  plantName: string;
  storeName: string;
  binCode: string;
  lotNumber: string;
  onHandQty: number;
  unit: string;
  status: 'quarantined' | 'hold' | 'cleared';
  unitCost: number;
}

export interface AffectedWorkOrderSummary {
  orderNumber: string;
  partName: string;
  customerName: string;
  status: string;
  consumedQty: number;
  unit: string;
  productionHoldApplied: boolean;
}

export interface AffectedCustomerShipment {
  customerName: string;
  salesOrderNumber: string;
  invoiceNumber: string;
  dispatchedQty: number;
  unit: string;
  dispatchDate: string;
  contactPerson?: string;
  contactPhone?: string;
  notificationStatus: 'pending' | 'notified' | 'quarantined_at_client' | 'returned';
}

export interface RecallReport {
  id: string;
  tenantId: string;
  recallNumber: string;       // e.g. "RCL-2026-001"
  title: string;              // e.g. "Containment: Out-of-Spec Tensile Strength on EN8D Wire Rod"
  suspectLotNumber: string;
  suspectItemName: string;
  suspectItemCode: string;
  heatNumber?: string;
  supplierName?: string;
  poNumber?: string;
  grnNumber?: string;
  defectCategory: RecallDefectType;
  severity: RecallSeverity;
  rootCauseFindings: string;
  correctiveActionPlan: string; // 8D CAPA Action Plan
  initiatedBy: string;
  initiatedByName: string;
  initiatedAt: string;
  quarantineHoldApplied: boolean;

  // Exposure Totals
  exposure: {
    warehouseOnHandQty: number;
    warehouseValue: number;
    wipConsumedQty: number;
    wipWorkOrderCount: number;
    finishedGoodsProducedQty: number;
    dispatchedToCustomerQty: number;
    affectedCustomersCount: number;
    totalFinancialExposure: number;
  };

  affectedLocations: AffectedLocationInventory[];
  affectedWorkOrders: AffectedWorkOrderSummary[];
  affectedFinishedLots: Array<{
    lotNumber: string;
    partName: string;
    producedQty: number;
    unit: string;
    status: LotStatus;
  }>;
  affectedDispatches: AffectedCustomerShipment[];

  status: 'active_quarantine' | 'under_investigation' | 'customer_alerted' | 'contained_and_closed';
  closedAt?: string;
  closedBy?: string;
  qualityManagerSignOff: string;
  regulatoryNotified: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialReceiptLotInput {
  lotType: LotType;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  category: StockCategory;
  materialGrade?: string;
  heatNumber?: string;
  supplierId?: string;
  supplierName?: string;
  poNumber?: string;
  vendorChallanNo?: string;
  vendorLotNumber?: string;
  receivedQty: number;
  unit: string;
  unitCost: number;
  plantId: string;
  plantName: string;
  storeId: string;
  storeName: string;
  binId: string;
  binCode: string;
  manufactureDate: string;
  expiryDate?: string;
  inspectionPassed: boolean;
  mtrNumber?: string;
  testParameters?: QualityTestParameter[];
  receivedBy: string;
  receivedByName: string;
  notes?: string;
}
