// src/types/supplierScorecard.ts

export type SupplierTier =
  | 'tier_1'  // Platinum / Preferred Partner (Score ≥ 90%)
  | 'tier_2'  // Gold / Approved Vendor (Score 80–89%)
  | 'tier_3'  // Silver / Conditional / Caution (Score 70–79%)
  | 'tier_4'; // Bronze / At-Risk / Probation (Score < 70%)

export type SupplierCategory =
  | 'raw_materials'          // Steels, Alloys, Ingots, Wire Rods, Billets
  | 'tooling_dies'           // Die Steel Blocks H13, Carbide Inserts, Forging Dies
  | 'consumables'            // Hydraulic Oils, Industrial Lubricants, Coolants
  | 'fasteners_hardware'     // High-Tensile Bolts, Studs, Flanges, Nuts
  | 'subcontract_processing' // Heat Treatment, Induction Hardening, Electroplating
  | 'packaging_logistics';   // Wooden Crates, Pallets, Industrial Strapping

export type SupplierStatus =
  | 'active'        // Standard active approved vendor list
  | 'preferred'     // Primary contracted supplier
  | 'under_review'  // Scheduled periodic audit
  | 'probation'     // Performance alert / restricted PO generation
  | 'inactive';     // Deactivated / blacklisted

export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

export interface SupplierProfile {
  id: string;
  tenantId: string;
  code: string;                  // e.g. "SUP-TATA-01"
  name: string;                  // e.g. "Tata Prime Steel Ltd."
  legalName: string;             // e.g. "Tata Steel Limited"
  category: SupplierCategory;
  status: SupplierStatus;
  tier: SupplierTier;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  gstin: string;
  pan?: string;
  msmeRegNo?: string;            // Udyam Registration #
  paymentTerms: string;          // e.g. "Net 30 Days", "Advance 20% / Net 30"
  deliveryTerms: string;         // e.g. "FOR Destination (Plant Gate)", "Ex-Works"
  leadTimeDays: number;          // Nominal agreed lead time
  certifications: string[];      // e.g. ["ISO 9001:2015", "IATF 16949", "ISO 14001"]
  primaryPlants: string[];       // e.g. ["plant-pune", "plant-vadodara"]
  address: SupplierAddress;
  bankDetails?: {
    bankName: string;
    ifsc: string;
    accountNo: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierMonthlyMetric {
  month: string;                 // e.g. "2026-05"
  monthLabel: string;            // e.g. "May 2026"
  ordersCount: number;
  deliveredOnTimeCount: number;
  delayedCount: number;
  otdRatePct: number;            // On-Time Delivery %
  lotsReceived: number;
  lotsAccepted: number;
  lotsRejected: number;
  qualityAcceptancePct: number;  // Quality Acceptance Rate %
  ppmDefectRate: number;         // Parts Per Million
  avgResponseHours: number;      // Average RFQ/Ack response turnaround
  spendAmount: number;           // in INR
}

export interface SupplierIncident {
  id: string;
  supplierId: string;
  type: 'delivery_delay' | 'quality_defect' | 'unresponsive_sla' | 'price_dispute' | 'packaging_damage';
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
  poNumber?: string;
  workOrderNumber?: string;
  description: string;
  rootCause?: string;
  capaStatus: 'open' | 'under_investigation' | 'capa_submitted' | 'resolved';
  capaDocumentRef?: string;      // e.g. "8D-CAPA-2026-081"
  loggedBy: string;
  resolutionDate?: string;
}

export interface SupplierPerformanceMetrics {
  supplierId: string;
  totalOrdersFulfilled: number;
  activeOrdersCount: number;
  totalSpend: number;            // Total spend in INR
  onTimeDeliveryRatePct: number; // Acceptance criteria: on-time delivery
  qualityAcceptanceRatePct: number; // Acceptance criteria: quality acceptance rate
  responsivenessScorePct: number;   // Acceptance criteria: responsiveness
  priceVariancePct: number;      // Price stability index (0 = perfect alignment)
  avgDelayDays: number;
  avgLeadTimeActual: number;
  avgLeadTimeQuoted: number;
  ppmDefectRate: number;         // Defect rate in PPM
  compositeScore: number;        // Overall 0-100 score
  rank: number;                  // Acceptance criteria: supplier ranking (1 = best)
  totalSuppliersInRank: number;
  tier: SupplierTier;
  monthlyTrends: SupplierMonthlyMetric[];
  recentIncidents: SupplierIncident[];
  lastEvaluatedAt: string;
}

export interface SupplierWithMetrics extends SupplierProfile {
  metrics: SupplierPerformanceMetrics;
}

export interface SupplierFilterState {
  category: 'all' | SupplierCategory;
  tier: 'all' | SupplierTier;
  status: 'all' | SupplierStatus;
  plantId: string;
  searchQuery: string;
  sortBy: 'compositeScore' | 'otd' | 'quality' | 'responsiveness' | 'spend' | 'name';
  sortOrder: 'asc' | 'desc';
}
