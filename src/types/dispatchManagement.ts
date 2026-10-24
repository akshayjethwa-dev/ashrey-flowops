// src/types/dispatchManagement.ts

export type BoxPackageType = 
  | 'corrugated_box' 
  | 'wooden_crate' 
  | 'pallet' 
  | 'hdpe_drum' 
  | 'polybag' 
  | 'metal_case'
  | 'shrink_wrapped_bundle';

export type CartonStatus = 
  | 'packed' 
  | 'inspected' 
  | 'staged' 
  | 'loaded' 
  | 'delivered';

export interface CartonPackedItem {
  itemId: string;
  itemName: string;
  partNumber?: string;
  batchNumber?: string;
  serialNumbers?: string[];
  quantity: number;
  uom: string; // 'Nos', 'Kg', 'Mtr', 'Pcs', 'Sets'
  unitWeightKg?: number;
  totalWeightKg?: number;
}

export interface PackageCarton {
  id: string;
  cartonNumber: string; // e.g. "CTN-01", "BOX-1/4"
  boxType: BoxPackageType;
  dimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  volumeCbm: number; // Volume in Cubic Meters: (L * W * H) / 1,000,000
  tareWeightKg: number;
  netWeightKg: number;
  grossWeightKg: number;
  sealNumber?: string;
  barcode: string; // Scannable or simulated barcode
  status: CartonStatus;
  loadedAt?: string;
  verifiedBy?: string;
  handlingInstructions?: string; // e.g. "FRAGILE - THIS SIDE UP", "KEEP DRY"
  items: CartonPackedItem[];
}

export type EWayBillStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';

export interface EWayBillVehicleHistory {
  vehicleNumber: string;
  fromPlace: string;
  fromState: string;
  tripsheetNo?: string;
  userEnteredDate: string;
  transDocNo?: string;
  transDocDate?: string;
  reasonForChange: 'transshipment' | 'breakdown' | 'others';
  remarks?: string;
}

export interface EWayBillDetails {
  ewayBillNumber: string; // 12-digit Indian GST e-way bill number
  generatedDate: string;
  validUntil: string;
  distanceKm: number;
  status: EWayBillStatus;
  supplyType: 'outward' | 'inward';
  subSupplyType: 'supply' | 'job_work' | 'for_own_use' | 'line_sales' | 'recipient_not_known' | 'others';
  docType: 'tax_invoice' | 'delivery_challan' | 'bill_of_supply' | 'bill_of_entry';
  docNumber: string;
  docDate: string;
  
  // Part-A: Consignor & Consignee
  fromGstin: string;
  fromTradeName: string;
  fromAddress: string;
  fromPincode: string;
  fromState: string;
  fromStateCode: string;
  
  toGstin: string;
  toTradeName: string;
  toAddress: string;
  toPincode: string;
  toState: string;
  toStateCode: string;
  
  // Values & Taxes
  hsnCode: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount?: number;
  totalInvoiceValue: number;

  // Part-B: Transport details
  transportMode: 'road' | 'rail' | 'air' | 'ship';
  vehicleType: 'regular' | 'over_dimensional';
  vehicleNumber: string;
  transporterId?: string; // Transporter GSTIN
  transporterName: string;
  transDocNo?: string; // LR / GR / RR / Air Waybill
  transDocDate?: string;
  
  // Vehicle update history for multi-leg / transshipment
  vehicleUpdates?: EWayBillVehicleHistory[];
  
  // Cancellation details if cancelled within 24 hours
  cancelReason?: string;
  cancelledAt?: string;
}

export interface DispatchNoteItem {
  itemNumber: number;
  itemName: string;
  description?: string;
  hsnCode: string;
  quantity: number;
  uom: string;
  unitRate: number;
  taxableValue: number;
  gstRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  cartonRef?: string;
}

export interface DispatchNote {
  challanNumber: string; // e.g. "DC-2026-0042"
  challanDate: string;
  challanType: 'supply' | 'job_work' | 'sample' | 'internal_transfer';
  poNumber?: string;
  poDate?: string;
  consignor: {
    tradeName: string;
    plantName: string;
    address: string;
    gstin: string;
    pan: string;
    state: string;
    stateCode: string;
    phone: string;
    email: string;
  };
  consignee: {
    tradeName: string;
    address: string;
    shippingAddress: string;
    gstin: string;
    pan?: string;
    state: string;
    stateCode: string;
    phone: string;
    contactPerson?: string;
  };
  dispatchPlant: string;
  dispatchBay: string;
  transporter: string;
  vehicleNumber: string;
  lrNumber: string;
  lrDate: string;
  driverName: string;
  driverPhone: string;
  driverDlNumber?: string;
  freightTerms: 'to_pay' | 'paid' | 'to_be_billed';
  insuranceDetails?: string;
  items: DispatchNoteItem[];
  totalQuantity: number;
  totalTaxableValue: number;
  totalTaxValue: number;
  grandTotal: number;
  termsAndConditions: string[];
  authorizedSignatory: string;
  receiverAcknowledgementSignature?: string;
  remarks?: string;
}

export interface ShipmentMilestone {
  id: string;
  timestamp: string;
  status: string;
  location: string;
  note: string;
  updatedBy: string;
}

export interface CarrierDetails {
  transporter: string;
  transporterGstin?: string;
  trackingUrl?: string;
  lrNumber: string;
  lrDate: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverDlNumber?: string;
  dispatchBay?: string;
  departureTime?: string;
  etaDate?: string;
  sealNumber?: string;
  odometerStartKm?: number;
  milestones: ShipmentMilestone[];
  carrierPortalUrl?: string;
}

export interface DeliveryConfirmationDetails {
  receiverName: string;
  receiverPhone?: string;
  deliveredAt: string;
  conditionStatus: 'intact' | 'damaged' | 'shortage';
  sealsVerified: boolean;
  remarks?: string;
  signatureData?: string;
  confirmedVia: 'customer_portal' | 'sales_manager' | 'driver_app';
  confirmedBy?: string;
}

// ═════════════════════════════════════════════════════════════
// Dispatch Dashboard & Plant Operations Interfaces
// ═════════════════════════════════════════════════════════════

export interface ReadyToShipOrder {
  orderId: string;
  orderNumber: string;
  customerPoNumber?: string;
  customerName: string;
  destination?: string;
  itemsSummary: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
  deliveryDueDate: string;
  urgency: 'urgent' | 'high' | 'normal';
  daysUntilDue: number;
  isOverdue: boolean;
  fqcStatus: 'cleared' | 'pending' | 'on_hold' | 'quarantined';
  cocNumber?: string;
  packagingStatus: 'ready' | 'in_progress' | 'staged';
  assignedDockBay?: string;
  orderObj: any;
}

export interface DispatchScheduleEvent {
  id: string;
  dispatchNumber: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  transporter: string;
  vehicleNumber?: string;
  dockBay: string;
  packagesCount: number;
  totalWeightKg?: number;
  status: 'Planned' | 'Loading' | 'Dispatched' | 'Delivered' | 'Cancelled';
  dispatchObj: any;
}

export interface OnTimeDeliveryKpiSummary {
  overallOtdPct: number; // e.g. 96.4
  targetOtdPct: number; // e.g. 95.0
  totalDispatchesAnalyzed: number;
  onTimeCount: number;
  delayedCount: number;
  otifPct: number; // On-Time In-Full e.g. 94.8
  avgTransitHours: number; // e.g. 26.5
  avgDockTurnaroundMinutes: number; // e.g. 45
  monthOverMonthTrendPct: number; // e.g. +2.3
  rootCauses: {
    cause: string;
    count: number;
    percentage: number;
  }[];
  carrierPerformance: {
    carrierName: string;
    totalShipments: number;
    onTimeShipments: number;
    otdPct: number;
    avgDelayHours: number;
  }[];
}
