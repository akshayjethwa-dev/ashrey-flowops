// src/services/supplierScorecardService.ts

import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  SupplierProfile,
  SupplierPerformanceMetrics,
  SupplierWithMetrics,
  SupplierIncident,
  SupplierMonthlyMetric,
  SupplierTier,
  SupplierCategory
} from '../types/supplierScorecard';
import { purchaseOrderService } from './purchaseOrderService';

export const SEED_SUPPLIERS = (tenantId: string): SupplierProfile[] => [
  {
    id: 'sup-tata',
    tenantId,
    code: 'SUP-TATA-01',
    name: 'Tata Prime Steel Ltd.',
    legalName: 'Tata Steel Industrial Products Division',
    category: 'raw_materials',
    status: 'preferred',
    tier: 'tier_1',
    contactPerson: 'Rajesh Kulkarni',
    role: 'Zonal Institutional Sales Head',
    email: 'orders@tataprimesteel.com',
    phone: '+91 98230 11982',
    whatsapp: '+91 98230 11982',
    website: 'https://tatasteel.com',
    gstin: '27AAACT2948K1ZP',
    pan: 'AAACT2948K',
    msmeRegNo: 'UDYAM-MH-12-0048192',
    paymentTerms: 'Net 30 Days • Freight Paid',
    deliveryTerms: 'FOR Destination (Plant Gate)',
    leadTimeDays: 7,
    certifications: ['ISO 9001:2015', 'IATF 16949:2016', 'ISO 14001:2015', 'GreenPro Level 4'],
    primaryPlants: ['plant-pune', 'plant-vadodara'],
    address: {
      street: 'Tata Steel Distribution Yard, Chakan Phase II',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '410501',
      country: 'India'
    },
    bankDetails: {
      bankName: 'State Bank of India Corporate',
      ifsc: 'SBIN0001822',
      accountNo: '30992817291'
    },
    notes: 'Primary steel wire rod & alloy billets partner. Dedicated account team and consignment buffer at Chakan yard.',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-castrol',
    tenantId,
    code: 'SUP-CAS-02',
    name: 'Castrol Industrial Lubricants',
    legalName: 'Castrol India Limited — Industrial Division',
    category: 'consumables',
    status: 'preferred',
    tier: 'tier_1',
    contactPerson: 'Vikram Joshi',
    role: 'Senior Industrial Account Lead',
    email: 'orders@castrol-industrial.in',
    phone: '+91 97654 33210',
    whatsapp: '+91 97654 33210',
    website: 'https://castrol.com/en_in',
    gstin: '27AAACC4918L1Z3',
    pan: 'AAACC4918L',
    paymentTerms: 'Net 15 Days • Drum Delivery',
    deliveryTerms: 'FOR Destination (Plant Gate)',
    leadTimeDays: 2,
    certifications: ['ISO 9001:2015', 'ISO 45001:2018', 'RoHS / REACH Compliant'],
    primaryPlants: ['plant-pune'],
    address: {
      street: 'Castrol Depot #4, MIDC Bhosari',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411026',
      country: 'India'
    },
    notes: 'Supplies hydraulic fluids VG 68 & synthetic machining coolants. Same-day emergency drum replenishment.',
    createdAt: '2025-02-10T10:30:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-unbrako',
    tenantId,
    code: 'SUP-UNB-03',
    name: 'Unbrako Fasteners India',
    legalName: 'Deepak Fasteners Limited (Unbrako Brand)',
    category: 'fasteners_hardware',
    status: 'active',
    tier: 'tier_1',
    contactPerson: 'Rohan Mehra',
    role: 'OEM Sourcing Manager',
    email: 'sales@unbrakofasteners.in',
    phone: '+91 98112 40091',
    gstin: '03AAACD9910B1ZT',
    pan: 'AAACD9910B',
    msmeRegNo: 'UDYAM-PB-02-0019284',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'FOR Destination (Plant Gate)',
    leadTimeDays: 4,
    certifications: ['ISO 9001:2015', 'CE Marking EN 14399', 'ISO 898-1 Standard'],
    primaryPlants: ['plant-pune', 'plant-vadodara'],
    address: {
      street: 'Fastener Tech Center, Focal Point',
      city: 'Ludhiana',
      state: 'Punjab',
      pinCode: '141010',
      country: 'India'
    },
    notes: 'Grade 8.8, 10.9, and 12.9 precision high-tensile fasteners. Zero dimensional defect track record.',
    createdAt: '2025-03-01T11:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-jindal',
    tenantId,
    code: 'SUP-JSP-04',
    name: 'Jindal Steel & Power Corp',
    legalName: 'Jindal Steel and Power Limited',
    category: 'raw_materials',
    status: 'active',
    tier: 'tier_2',
    contactPerson: 'Prakash Rao',
    role: 'Regional GM — Institutional Accounts',
    email: 'sales@jindalsteel.com',
    phone: '+91 98901 44556',
    gstin: '27AAACJ8812M1Z8',
    pan: 'AAACJ8812M',
    paymentTerms: 'Net 45 Days • Ex-Works',
    deliveryTerms: 'FOR Destination (Plant Gate)',
    leadTimeDays: 8,
    certifications: ['ISO 9001:2015', 'BEE 5-Star Energy Rated', 'NABL Accredited Lab'],
    primaryPlants: ['plant-pune'],
    address: {
      street: 'JSPL Stockyard, Kalamboli Warehousing Complex',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pinCode: '410218',
      country: 'India'
    },
    notes: 'Major carbon steel round bar & billet supplier. Occasional dispatch lorry transit delays during monsoon.',
    createdAt: '2025-02-18T14:15:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-bharat',
    tenantId,
    code: 'SUP-BFT-05',
    name: 'Bharat Forge Specialty Tooling',
    legalName: 'Bharat Forge Limited — Tooling & Specialty Alloys',
    category: 'tooling_dies',
    status: 'active',
    tier: 'tier_2',
    contactPerson: 'Mahesh Hegde',
    role: 'Specialty Steel Sales Director',
    email: 'tooling@bharatforge.com',
    phone: '+91 99220 88711',
    gstin: '27AAACB1102K1ZQ',
    pan: 'AAACB1102K',
    paymentTerms: 'Advance 20% / Balance Net 30',
    deliveryTerms: 'Ex-Works Pune Works Gate',
    leadTimeDays: 14,
    certifications: ['ISO 9001:2015', 'AS9100D Aerospace Certified', 'NADCAP Heat Treat'],
    primaryPlants: ['plant-pune'],
    address: {
      street: 'Mundhwa Industrial Corridor',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411036',
      country: 'India'
    },
    notes: 'Specialist for H13 hot work die blocks and ESR vacuum degassed alloy forgings.',
    createdAt: '2025-01-20T16:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-apex',
    tenantId,
    code: 'SUP-APX-06',
    name: 'Apex Surface Technologies',
    legalName: 'Apex Electroplaters & Heat Treaters Pvt. Ltd.',
    category: 'subcontract_processing',
    status: 'under_review',
    tier: 'tier_3',
    contactPerson: 'Nitin Sawant',
    role: 'Managing Partner',
    email: 'quality@apexsurfacetech.in',
    phone: '+91 98221 55320',
    gstin: '27AAACA5512N1Z4',
    pan: 'AAACA5512N',
    msmeRegNo: 'UDYAM-MH-12-0081729',
    paymentTerms: 'Net 30 Days',
    deliveryTerms: 'Ex-Works Facility',
    leadTimeDays: 5,
    certifications: ['ISO 9001:2015'],
    primaryPlants: ['plant-pune'],
    address: {
      street: 'Plot W-48, MIDC Waluj',
      city: 'Chhatrapati Sambhajinagar',
      state: 'Maharashtra',
      pinCode: '431136',
      country: 'India'
    },
    notes: 'Hard chrome plating and induction hardening subcontract processor. Placed under review after coating thickness variance.',
    createdAt: '2025-04-12T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-kalyani',
    tenantId,
    code: 'SUP-KAL-07',
    name: 'Kalyani Precision Castings',
    legalName: 'Kalyani Castings & Patterns LLP',
    category: 'subcontract_processing',
    status: 'probation',
    tier: 'tier_4',
    contactPerson: 'Sachin Shinde',
    role: 'Works Director',
    email: 'info@kalyaniprecisioncast.com',
    phone: '+91 98229 77810',
    gstin: '27AAACK8821Q1Z9',
    pan: 'AAACK8821Q',
    paymentTerms: 'Advance 50% / Balance on Delivery',
    deliveryTerms: 'Ex-Works Foundry',
    leadTimeDays: 18,
    certifications: ['ISO 9001:2015'],
    primaryPlants: ['plant-vadodara', 'plant-pune'],
    address: {
      street: 'Gat No. 340, Shindewadi Industrial Area',
      city: 'Satara',
      state: 'Maharashtra',
      pinCode: '415514',
      country: 'India'
    },
    notes: 'Cast iron housings and brackets. High porosity defect rate observed in Q2. Active CAPA ongoing.',
    createdAt: '2025-03-25T13:40:00Z',
    updatedAt: new Date().toISOString()
  }
];

export const SEED_INCIDENTS = (tenantId: string): SupplierIncident[] => [
  {
    id: 'inc-1',
    supplierId: 'sup-apex',
    type: 'quality_defect',
    severity: 'high',
    date: '2026-05-18T14:30:00Z',
    poNumber: 'PO-2026-840',
    workOrderNumber: 'WO-2026-003',
    description: 'Hard chrome plating thickness measured 18µm against required drawing specification 25µm ± 2µm on 12 hydraulic cylinder rods.',
    rootCause: 'Plating bath temperature dropped during night shift power changeover; inadequate titration verification.',
    capaStatus: 'capa_submitted',
    capaDocumentRef: '8D-CAPA-APEX-2026-03',
    loggedBy: 'Amit Joshi (QA Inspector)',
    resolutionDate: '2026-05-24T18:00:00Z'
  },
  {
    id: 'inc-2',
    supplierId: 'sup-kalyani',
    type: 'delivery_delay',
    severity: 'critical',
    date: '2026-05-02T10:00:00Z',
    poNumber: 'PO-2026-790',
    workOrderNumber: 'WO-2026-001',
    description: 'Shipment delayed by 6 days past confirmed expected delivery date due to foundry core breakdown. Caused line rescheduling on Machining Cell 2.',
    rootCause: 'Primary core shooter pneumatic failure; spare parts sourcing delay from Coimbatore.',
    capaStatus: 'under_investigation',
    loggedBy: 'Sanjay Sharma (Procurement Manager)'
  },
  {
    id: 'inc-3',
    supplierId: 'sup-jindal',
    type: 'delivery_delay',
    severity: 'medium',
    date: '2026-04-14T09:15:00Z',
    poNumber: 'PO-2026-722',
    description: 'Lorry trailer detained at state border octroi checkpoint for 36 hours. Delivered 2 days past confirmed ETA.',
    rootCause: 'Driver carried duplicate e-way bill with expired QR verification barcode.',
    capaStatus: 'resolved',
    capaDocumentRef: '8D-CAPA-JSP-014',
    loggedBy: 'Prakash Kunte (Logistics Desk)',
    resolutionDate: '2026-04-18T12:00:00Z'
  }
];

class SupplierScorecardService {
  private getStorageKey(tenantId: string, resource: string): string {
    return `flowops_supplier_${resource}_${tenantId}`;
  }

  // ── 1. Fetch Suppliers ────────────────────────────────────────
  async getSuppliers(tenantId: string): Promise<SupplierProfile[]> {
    const key = this.getStorageKey(tenantId, 'profiles');
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached suppliers', e);
      }
    }

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        const colRef = collection(db, 'tenants', tenantId, 'suppliers');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const list: SupplierProfile[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as SupplierProfile));
          list.sort((a, b) => a.name.localeCompare(b.name));
          localStorage.setItem(key, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getSuppliers fallback to seeds', err);
      }
    }

    const seeds = SEED_SUPPLIERS(tenantId);
    localStorage.setItem(key, JSON.stringify(seeds));
    return seeds;
  }

  // ── 2. Save Supplier ──────────────────────────────────────────
  async saveSupplier(tenantId: string, supplier: Partial<SupplierProfile>): Promise<SupplierProfile> {
    const existing = await this.getSuppliers(tenantId);
    const now = new Date().toISOString();
    let savedProfile: SupplierProfile;

    if (supplier.id) {
      const idx = existing.findIndex(s => s.id === supplier.id);
      if (idx >= 0) {
        savedProfile = {
          ...existing[idx],
          ...supplier,
          updatedAt: now
        } as SupplierProfile;
        existing[idx] = savedProfile;
      } else {
        savedProfile = {
          ...supplier,
          tenantId,
          updatedAt: now,
          createdAt: supplier.createdAt || now
        } as SupplierProfile;
        existing.unshift(savedProfile);
      }
    } else {
      const newId = `sup-${Date.now()}`;
      savedProfile = {
        id: newId,
        tenantId,
        code: supplier.code || `SUP-${Math.floor(100 + Math.random() * 900)}`,
        name: supplier.name || 'New Supplier',
        legalName: supplier.legalName || supplier.name || 'New Supplier Corp',
        category: supplier.category || 'raw_materials',
        status: supplier.status || 'active',
        tier: supplier.tier || 'tier_2',
        contactPerson: supplier.contactPerson || 'Vendor Rep',
        role: supplier.role || 'Sales Lead',
        email: supplier.email || 'contact@supplier.com',
        phone: supplier.phone || '+91 98000 00000',
        gstin: supplier.gstin || '27AAACS0000A1Z1',
        paymentTerms: supplier.paymentTerms || 'Net 30 Days',
        deliveryTerms: supplier.deliveryTerms || 'FOR Destination',
        leadTimeDays: supplier.leadTimeDays || 7,
        certifications: supplier.certifications || ['ISO 9001:2015'],
        primaryPlants: supplier.primaryPlants || ['plant-pune'],
        address: supplier.address || {
          street: 'Industrial Zone',
          city: 'Pune',
          state: 'Maharashtra',
          pinCode: '411001',
          country: 'India'
        },
        createdAt: now,
        updatedAt: now
      };
      existing.unshift(savedProfile);
    }

    localStorage.setItem(this.getStorageKey(tenantId, 'profiles'), JSON.stringify(existing));

    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;
    if (!isSandbox && db) {
      try {
        await setDoc(doc(db, 'tenants', tenantId, 'suppliers', savedProfile.id), savedProfile, { merge: true });
      } catch (e) {
        console.warn('Firestore saveSupplier error', e);
      }
    }

    window.dispatchEvent(new CustomEvent('flowops:suppliers_updated', { detail: { supplier: savedProfile } }));
    return savedProfile;
  }

  // ── 3. Incidents Log ──────────────────────────────────────────
  async getIncidents(tenantId: string): Promise<SupplierIncident[]> {
    const key = this.getStorageKey(tenantId, 'incidents');
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    const seeds = SEED_INCIDENTS(tenantId);
    localStorage.setItem(key, JSON.stringify(seeds));
    return seeds;
  }

  async logIncident(tenantId: string, incident: Omit<SupplierIncident, 'id'>): Promise<SupplierIncident> {
    const incidents = await this.getIncidents(tenantId);
    const newIncident: SupplierIncident = {
      ...incident,
      id: `inc-${Date.now()}`
    };
    incidents.unshift(newIncident);
    localStorage.setItem(this.getStorageKey(tenantId, 'incidents'), JSON.stringify(incidents));
    window.dispatchEvent(new CustomEvent('flowops:suppliers_updated', { detail: { newIncident } }));
    return newIncident;
  }

  async updateIncidentCapa(
    tenantId: string,
    incidentId: string,
    capaStatus: SupplierIncident['capaStatus'],
    capaDocumentRef?: string
  ): Promise<void> {
    const incidents = await this.getIncidents(tenantId);
    const inc = incidents.find(i => i.id === incidentId);
    if (inc) {
      inc.capaStatus = capaStatus;
      if (capaDocumentRef) inc.capaDocumentRef = capaDocumentRef;
      if (capaStatus === 'resolved') inc.resolutionDate = new Date().toISOString();
      localStorage.setItem(this.getStorageKey(tenantId, 'incidents'), JSON.stringify(incidents));
      window.dispatchEvent(new CustomEvent('flowops:suppliers_updated'));
    }
  }

  // ── 4. Calculate Detailed Performance Metrics ─────────────────
  async calculateMetrics(tenantId: string, supplier: SupplierProfile): Promise<SupplierPerformanceMetrics> {
    const [allPos, allIncidents] = await Promise.all([
      purchaseOrderService.getPurchaseOrders(tenantId),
      this.getIncidents(tenantId)
    ]);

    // Matching POs for this supplier
    const supplierPos = allPos.filter(
      p => p.supplierId === supplier.id || p.supplierName.toLowerCase() === supplier.name.toLowerCase()
    );

    const supplierIncidents = allIncidents.filter(i => i.supplierId === supplier.id);

    // Profile-specific base performance weights
    let baseOtd = 95.0;
    let baseQar = 98.5;
    let baseResp = 94.0;
    let priceVar = 1.2;
    let baseSpend = 350000;
    let fulfilledOrders = 12;
    let ppm = 250;
    let avgDelay = 0.4;

    if (supplier.id === 'sup-tata') {
      baseOtd = 97.4;
      baseQar = 99.6;
      baseResp = 96.0;
      priceVar = 0.5;
      baseSpend = 4280000;
      fulfilledOrders = 28;
      ppm = 85;
      avgDelay = 0.2;
    } else if (supplier.id === 'sup-castrol') {
      baseOtd = 98.8;
      baseQar = 99.8;
      baseResp = 98.0;
      priceVar = 0.8;
      baseSpend = 890000;
      fulfilledOrders = 18;
      ppm = 40;
      avgDelay = 0.1;
    } else if (supplier.id === 'sup-unbrako') {
      baseOtd = 95.2;
      baseQar = 99.4;
      baseResp = 93.0;
      priceVar = 1.0;
      baseSpend = 640000;
      fulfilledOrders = 22;
      ppm = 120;
      avgDelay = 0.5;
    } else if (supplier.id === 'sup-jindal') {
      baseOtd = 91.5;
      baseQar = 98.2;
      baseResp = 89.0;
      priceVar = 1.8;
      baseSpend = 3150000;
      fulfilledOrders = 19;
      ppm = 340;
      avgDelay = 1.2;
    } else if (supplier.id === 'sup-bharat') {
      baseOtd = 87.5;
      baseQar = 99.1;
      baseResp = 86.0;
      priceVar = 2.4;
      baseSpend = 1850000;
      fulfilledOrders = 9;
      ppm = 180;
      avgDelay = 1.8;
    } else if (supplier.id === 'sup-apex') {
      baseOtd = 82.0;
      baseQar = 93.5;
      baseResp = 79.0;
      priceVar = 3.2;
      baseSpend = 460000;
      fulfilledOrders = 14;
      ppm = 1420;
      avgDelay = 2.5;
    } else if (supplier.id === 'sup-kalyani') {
      baseOtd = 68.0;
      baseQar = 88.0;
      baseResp = 65.0;
      priceVar = 4.8;
      baseSpend = 720000;
      fulfilledOrders = 8;
      ppm = 2850;
      avgDelay = 4.8;
    }

    // Blend live PO data if available
    const liveSpend = supplierPos.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalSpend = Math.max(baseSpend, liveSpend);
    const activeOrdersCount = supplierPos.filter(
      p => !['received', 'cancelled', 'rejected'].includes(p.status)
    ).length;

    // Composite Score Formula:
    // OTD (40%) + Quality (40%) + Responsiveness (15%) + Price Stability (5%)
    const priceStabilityScore = Math.max(0, 100 - (priceVar * 10));
    const compositeScore = Math.round(
      (baseOtd * 0.40) +
      (baseQar * 0.40) +
      (baseResp * 0.15) +
      (priceStabilityScore * 0.05)
    );

    // Dynamic Tier determination
    let tier: SupplierTier = 'tier_2';
    if (compositeScore >= 90) tier = 'tier_1';
    else if (compositeScore >= 80) tier = 'tier_2';
    else if (compositeScore >= 70) tier = 'tier_3';
    else tier = 'tier_4';

    // 6-Month Trend Data Generation
    const monthNames = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
    const monthlyTrends: SupplierMonthlyMetric[] = monthNames.map((label, idx) => {
      // Natural month-to-month variation
      const deltaOtd = Number(((idx - 2) * 0.6).toFixed(1));
      const deltaQar = Number(((idx % 2 === 0 ? 0.3 : -0.2)).toFixed(1));
      const mOtd = Math.min(100, Math.max(50, Number((baseOtd + deltaOtd).toFixed(1))));
      const mQar = Math.min(100, Math.max(60, Number((baseQar + deltaQar).toFixed(1))));
      const orders = Math.max(1, Math.round(fulfilledOrders / 6) + (idx % 2));

      return {
        month: `2026-0${idx + 1}`,
        monthLabel: label,
        ordersCount: orders,
        deliveredOnTimeCount: Math.round(orders * (mOtd / 100)),
        delayedCount: Math.max(0, orders - Math.round(orders * (mOtd / 100))),
        otdRatePct: mOtd,
        lotsReceived: orders * 2,
        lotsAccepted: Math.round(orders * 2 * (mQar / 100)),
        lotsRejected: Math.max(0, (orders * 2) - Math.round(orders * 2 * (mQar / 100))),
        qualityAcceptancePct: mQar,
        ppmDefectRate: Math.round(ppm * (1 + (deltaQar * -0.1))),
        avgResponseHours: Number((Math.max(2, 24 * (1 - baseResp / 100))).toFixed(1)),
        spendAmount: Math.round(totalSpend / 6 * (0.85 + (idx * 0.06)))
      };
    });

    return {
      supplierId: supplier.id,
      totalOrdersFulfilled: fulfilledOrders + supplierPos.length,
      activeOrdersCount,
      totalSpend,
      onTimeDeliveryRatePct: baseOtd,
      qualityAcceptanceRatePct: baseQar,
      responsivenessScorePct: baseResp,
      priceVariancePct: priceVar,
      avgDelayDays: avgDelay,
      avgLeadTimeActual: Number((supplier.leadTimeDays + avgDelay).toFixed(1)),
      avgLeadTimeQuoted: supplier.leadTimeDays,
      ppmDefectRate: ppm,
      compositeScore,
      rank: 1, // Will be resolved in getAllSuppliersWithMetrics
      totalSuppliersInRank: 1,
      tier,
      monthlyTrends,
      recentIncidents: supplierIncidents,
      lastEvaluatedAt: new Date().toISOString()
    };
  }

  // ── 5. Get All Suppliers With Ranked Metrics ──────────────────
  async getAllSuppliersWithMetrics(tenantId: string): Promise<SupplierWithMetrics[]> {
    const suppliers = await this.getSuppliers(tenantId);
    const withMetrics = await Promise.all(
      suppliers.map(async s => {
        const metrics = await this.calculateMetrics(tenantId, s);
        return {
          ...s,
          tier: metrics.tier, // Sync tier to metric
          metrics
        };
      })
    );

    // Sort by composite score descending to assign definitive ranks
    withMetrics.sort((a, b) => b.metrics.compositeScore - a.metrics.compositeScore);

    withMetrics.forEach((item, index) => {
      item.metrics.rank = index + 1;
      item.metrics.totalSuppliersInRank = withMetrics.length;
    });

    return withMetrics;
  }
}

export const supplierScorecardService = new SupplierScorecardService();
