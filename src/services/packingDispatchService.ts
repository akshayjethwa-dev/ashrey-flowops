// src/services/packingDispatchService.ts

import { 
  PackageCarton, 
  CartonPackedItem, 
  EWayBillDetails, 
  EWayBillVehicleHistory,
  DispatchNote, 
  DispatchNoteItem, 
  CarrierDetails, 
  ShipmentMilestone,
  BoxPackageType 
} from '../types/dispatchManagement';
import { Dispatch, QuoteItem, Order, Tenant } from '../types';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface CartonAggregateStats {
  totalPackages: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalVolumeCbm: number;
  packedCount: number;
  loadedCount: number;
  isFullyLoaded: boolean;
}

export const packingDispatchService = {
  /**
   * Generates default carton packaging allocations from order items
   */
  generateDefaultCartons(
    items: QuoteItem[] = [], 
    orderReference: string = 'ORD',
    baseBoxType: BoxPackageType = 'corrugated_box'
  ): PackageCarton[] {
    if (!items || items.length === 0) {
      return [
        {
          id: `ctn_${Date.now()}_1`,
          cartonNumber: 'CTN-01',
          boxType: baseBoxType,
          dimensions: { lengthCm: 45, widthCm: 35, heightCm: 30 },
          volumeCbm: (45 * 35 * 30) / 1000000,
          tareWeightKg: 1.5,
          netWeightKg: 12.0,
          grossWeightKg: 13.5,
          sealNumber: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
          barcode: `PKG-${Date.now().toString().slice(-6)}-01`,
          status: 'packed',
          handlingInstructions: 'FRAGILE - HANDLE WITH CARE - THIS SIDE UP',
          items: []
        }
      ];
    }

    const cartons: PackageCarton[] = [];
    let cartonIndex = 1;

    items.forEach((item, itemIdx) => {
      const qty = item.quantity || 1;
      const unitWtKg = item.specs?.includes('kg') 
        ? parseFloat(item.specs.replace(/[^0-9.]/g, '')) || 2.5
        : 3.2; // default 3.2 kg per item
      
      // Split into cartons if large quantity (e.g. max 50 units or 40 kg per box)
      const maxUnitsPerBox = Math.max(1, Math.min(50, Math.floor(40 / unitWtKg) || 10));
      const neededBoxes = Math.ceil(qty / maxUnitsPerBox);

      let remainingQty = qty;
      for (let b = 0; b < neededBoxes; b++) {
        const boxQty = Math.min(remainingQty, maxUnitsPerBox);
        remainingQty -= boxQty;

        const netWeight = parseFloat((boxQty * unitWtKg).toFixed(2));
        const tareWeight = 1.8;
        const grossWeight = parseFloat((netWeight + tareWeight).toFixed(2));
        
        // Dimensions based on box size
        const l = 50;
        const w = 40;
        const h = 35;
        const volumeCbm = parseFloat(((l * w * h) / 1000000).toFixed(4));

        cartons.push({
          id: `ctn_${Date.now()}_${cartonIndex}`,
          cartonNumber: `CTN-${cartonIndex.toString().padStart(2, '0')}`,
          boxType: baseBoxType,
          dimensions: { lengthCm: l, widthCm: w, heightCm: h },
          volumeCbm,
          tareWeightKg: tareWeight,
          netWeightKg: netWeight,
          grossWeightKg: grossWeight,
          sealNumber: `SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
          barcode: `EAN-${Date.now().toString().slice(-5)}${cartonIndex.toString().padStart(2, '0')}`,
          status: 'packed',
          handlingInstructions: 'DO NOT DROP · KEEP DRY · INDUSTRIAL PRECISION PARTS',
          items: [
            {
              itemId: item.id || `item_${itemIdx}`,
              itemName: item.name,
              partNumber: `PN-${item.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`,
              batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
              quantity: boxQty,
              uom: 'Nos',
              unitWeightKg: unitWtKg,
              totalWeightKg: netWeight
            }
          ]
        });
        cartonIndex++;
      }
    });

    return cartons;
  },

  /**
   * Computes totals across all cartons
   */
  calculateCartonAggregates(cartons: PackageCarton[] = []): CartonAggregateStats {
    if (!cartons || cartons.length === 0) {
      return {
        totalPackages: 0,
        totalGrossWeightKg: 0,
        totalNetWeightKg: 0,
        totalVolumeCbm: 0,
        packedCount: 0,
        loadedCount: 0,
        isFullyLoaded: false
      };
    }

    const totalPackages = cartons.length;
    const totalGrossWeightKg = parseFloat(cartons.reduce((acc, c) => acc + (c.grossWeightKg || 0), 0).toFixed(2));
    const totalNetWeightKg = parseFloat(cartons.reduce((acc, c) => acc + (c.netWeightKg || 0), 0).toFixed(2));
    const totalVolumeCbm = parseFloat(cartons.reduce((acc, c) => acc + (c.volumeCbm || 0), 0).toFixed(4));
    const packedCount = cartons.filter(c => c.status === 'packed' || c.status === 'inspected' || c.status === 'staged').length;
    const loadedCount = cartons.filter(c => c.status === 'loaded' || c.status === 'delivered').length;
    const isFullyLoaded = totalPackages > 0 && loadedCount === totalPackages;

    return {
      totalPackages,
      totalGrossWeightKg,
      totalNetWeightKg,
      totalVolumeCbm,
      packedCount,
      loadedCount,
      isFullyLoaded
    };
  },

  /**
   * Calculate Indian GST E-Way Bill validity based on distance (Rule 138(10))
   */
  calculateEWayBillValidity(distanceKm: number, isOverDimensional: boolean = false, fromDate: Date = new Date()) {
    const kmPerDay = isOverDimensional ? 20 : 200;
    const validityDays = Math.max(1, Math.ceil(distanceKm / kmPerDay));
    
    const validUntilDate = new Date(fromDate);
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);
    validUntilDate.setHours(23, 59, 59, 999);

    return {
      validityDays,
      validUntilIso: validUntilDate.toISOString()
    };
  },

  /**
   * Generates a 12-digit mock E-Way bill number formatted in standard groups
   */
  generateMockEWayBillNumber(): string {
    const p1 = '24' + Math.floor(10 + Math.random() * 90); // e.g. 2410
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    return `${p1} ${p2} ${p3}`;
  },

  /**
   * Checks current validity status of an E-Way Bill
   */
  getEWayBillStatus(validUntilIso: string, isCancelled: boolean = false) {
    if (isCancelled) return 'cancelled';
    const now = Date.now();
    const expiry = new Date(validUntilIso).getTime();
    if (now > expiry) return 'expired';
    if (expiry - now < 8 * 60 * 60 * 1000) return 'expiring_soon'; // less than 8 hours
    return 'active';
  },

  /**
   * Generates default initial E-Way Bill details from dispatch & tenant data
   */
  generateInitialEWayBill(
    dispatch: Partial<Dispatch>, 
    tenant?: Tenant | null,
    order?: Order | null
  ): EWayBillDetails {
    const totalTaxable = (dispatch.items || []).reduce((acc, itm) => acc + (itm.total || (itm.quantity * itm.unitPrice) || 0), 0);
    const gstRate = 0.18;
    const cgst = parseFloat((totalTaxable * 0.09).toFixed(2));
    const sgst = parseFloat((totalTaxable * 0.09).toFixed(2));
    const igst = 0;
    const totalInvoice = parseFloat((totalTaxable + cgst + sgst + igst).toFixed(2));

    const distanceKm = 160;
    const { validUntilIso } = this.calculateEWayBillValidity(distanceKm, false);

    return {
      ewayBillNumber: this.generateMockEWayBillNumber(),
      generatedDate: new Date().toISOString(),
      validUntil: validUntilIso,
      distanceKm,
      status: 'active',
      supplyType: 'outward',
      subSupplyType: 'supply',
      docType: 'tax_invoice',
      docNumber: dispatch.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      docDate: dispatch.dispatchDate || new Date().toISOString().split('T')[0],
      
      // Consignor (Supplier)
      fromGstin: tenant?.gstin || '24AABCA1234F1Z8',
      fromTradeName: tenant?.companyName || 'Apex Precision Manufacturing Ltd.',
      fromAddress: tenant?.address || 'Plot 48, GIDC Industrial Estate, Manjusar',
      fromPincode: '391775',
      fromState: 'Gujarat',
      fromStateCode: '24',

      // Consignee (Buyer)
      toGstin: (order as any)?.customerGstin || (order as any)?.gstin || '27AAACG9876K1Z4',
      toTradeName: dispatch.customerName || order?.customerName || 'Tata Motors Precision Components Div.',
      toAddress: dispatch.destination || (order as any)?.shippingAddress || (order as any)?.deliveryAddress || 'Plant Gates 4, MIDC Bhosari, Pune',
      toPincode: '411026',
      toState: 'Maharashtra',
      toStateCode: '27',

      hsnCode: '84834000', // Gears and gearing
      taxableAmount: totalTaxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalInvoiceValue: totalInvoice,

      transportMode: 'road',
      vehicleType: 'regular',
      vehicleNumber: dispatch.vehicleNumber || 'MH-12-PQ-9876',
      transporterId: '27AABCS8891P1ZX',
      transporterName: dispatch.transporter || 'SafeExpress Logistics India',
      transDocNo: dispatch.lrNumber || dispatch.LRNumber || `LR-${Date.now().toString().slice(-6)}`,
      transDocDate: dispatch.dispatchDate || new Date().toISOString().split('T')[0],
      vehicleUpdates: []
    };
  },

  /**
   * Generates official JSON payload according to Indian Government NIC E-Way Bill Schema v1.04
   */
  generateNicEwbJson(dispatch: Dispatch, ewb: EWayBillDetails) {
    return {
      version: '1.0.0421',
      billLists: [
        {
          userGstin: ewb.fromGstin,
          supplyType: ewb.supplyType === 'outward' ? 'O' : 'I',
          subSupplyType: '1', // Supply
          docType: 'INV',
          docNo: ewb.docNumber,
          docDate: ewb.docDate.replace(/-/g, '/'),
          fromGstin: ewb.fromGstin,
          fromTrdName: ewb.fromTradeName,
          fromAddr1: ewb.fromAddress,
          fromPlace: 'Vadodara',
          fromPincode: parseInt(ewb.fromPincode, 10) || 391775,
          actFromStateCode: parseInt(ewb.fromStateCode, 10) || 24,
          fromStateCode: parseInt(ewb.fromStateCode, 10) || 24,
          toGstin: ewb.toGstin,
          toTrdName: ewb.toTradeName,
          toAddr1: ewb.toAddress,
          toPlace: 'Pune',
          toPincode: parseInt(ewb.toPincode, 10) || 411026,
          actToStateCode: parseInt(ewb.toStateCode, 10) || 27,
          toStateCode: parseInt(ewb.toStateCode, 10) || 27,
          totalValue: ewb.taxableAmount,
          cgstValue: ewb.cgstAmount,
          sgstValue: ewb.sgstAmount,
          igstValue: ewb.igstAmount,
          cessValue: 0,
          totInvValue: ewb.totalInvoiceValue,
          transMode: '1', // Road
          transDistance: ewb.distanceKm.toString(),
          transporterName: ewb.transporterName,
          transporterId: ewb.transporterId || '',
          transDocNo: ewb.transDocNo || '',
          transDocDate: (ewb.transDocDate || ewb.docDate).replace(/-/g, '/'),
          vehicleNo: ewb.vehicleNumber.replace(/\s+/g, ''),
          vehicleType: ewb.vehicleType === 'regular' ? 'R' : 'O',
          itemList: (dispatch.items || []).map((itm, idx) => ({
            itemNo: idx + 1,
            productName: itm.name,
            productDesc: itm.specs || itm.name,
            hsnCode: parseInt(ewb.hsnCode, 10) || 84834000,
            quantity: itm.quantity,
            qtyUnit: 'NOS',
            taxableAmount: itm.total || (itm.quantity * itm.unitPrice),
            cgstRate: 9,
            sgstRate: 9,
            igstRate: 0,
            cessRate: 0
          }))
        }
      ]
    };
  },

  /**
   * Generates official Delivery Challan / Dispatch Note compliant with Rule 55 of CGST Act
   */
  generateDispatchNote(
    dispatch: Partial<Dispatch>,
    order?: Order | null,
    tenant?: Tenant | null
  ): DispatchNote {
    const challanDate = dispatch.dispatchDate || new Date().toISOString().split('T')[0];
    const challanNumber = `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: DispatchNoteItem[] = (dispatch.items || []).map((itm, idx) => {
      const taxable = itm.total || (itm.quantity * itm.unitPrice) || 0;
      const cgst = parseFloat((taxable * 0.09).toFixed(2));
      const sgst = parseFloat((taxable * 0.09).toFixed(2));
      return {
        itemNumber: idx + 1,
        itemName: itm.name,
        description: itm.specs || 'Precision Machined Mechanical Sub-Assembly',
        hsnCode: '84834000',
        quantity: itm.quantity,
        uom: 'Nos',
        unitRate: itm.unitPrice,
        taxableValue: taxable,
        gstRatePercent: 18,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        totalAmount: taxable + cgst + sgst,
        cartonRef: `CTN-${Math.min(idx + 1, (dispatch.cartons?.length || 1)).toString().padStart(2, '0')}`
      };
    });

    const totalQty = items.reduce((acc, itm) => acc + itm.quantity, 0);
    const totalTaxable = items.reduce((acc, itm) => acc + itm.taxableValue, 0);
    const totalTax = items.reduce((acc, itm) => acc + itm.cgstAmount + itm.sgstAmount + itm.igstAmount, 0);
    const grandTotal = parseFloat((totalTaxable + totalTax).toFixed(2));

    return {
      challanNumber,
      challanDate,
      challanType: 'supply',
      poNumber: order?.orderNumber || (order as any)?.customerPoNumber || `PO-IND-${Math.floor(10000 + Math.random() * 90000)}`,
      poDate: (order as any)?.orderDate || (order as any)?.createdAt || challanDate,
      consignor: {
        tradeName: tenant?.companyName || 'Apex Precision Manufacturing Ltd.',
        plantName: 'Unit 1 Heavy Machining Plant',
        address: tenant?.address || 'Plot 48, GIDC Industrial Estate, Manjusar, Vadodara, Gujarat 391775',
        gstin: tenant?.gstin || '24AABCA1234F1Z8',
        pan: 'AABCA1234F',
        state: 'Gujarat',
        stateCode: '24',
        phone: '+91 265 298 4400',
        email: 'dispatch@apexprecision.in'
      },
      consignee: {
        tradeName: dispatch.customerName || order?.customerName || 'Tata Motors Precision Components Div.',
        address: (order as any)?.customerAddress || 'Tata Motors Plant Gates, Pimpri Works, Pune, Maharashtra 411018',
        shippingAddress: dispatch.destination || (order as any)?.shippingAddress || 'Receiving Dock 4, Tata Motors CVBU, Pune, Maharashtra 411018',
        gstin: (order as any)?.customerGstin || (order as any)?.gstin || '27AAACG9876K1Z4',
        pan: 'AAACG9876K',
        state: 'Maharashtra',
        stateCode: '27',
        phone: dispatch.driverPhone || '+91 20 6613 0000',
        contactPerson: 'Mr. Arvind Shinde (Stores In-Charge)'
      },
      dispatchPlant: 'Unit 1 Main Bay',
      dispatchBay: dispatch.dispatchBay || 'Dock Bay 3',
      transporter: dispatch.transporter || 'SafeExpress Logistics India',
      vehicleNumber: dispatch.vehicleNumber || 'MH-12-PQ-9876',
      lrNumber: dispatch.lrNumber || dispatch.LRNumber || `LR-${Date.now().toString().slice(-6)}`,
      lrDate: challanDate,
      driverName: dispatch.driverName || 'Shivraj Singh',
      driverPhone: dispatch.driverPhone || '+91 94406 12345',
      driverDlNumber: dispatch.driverDlNumber || 'MH12 20180045920',
      freightTerms: 'to_pay',
      insuranceDetails: 'Covered under Transit Open Marine Policy #NIC-MAR-98441-2026',
      items,
      totalQuantity: totalQty,
      totalTaxableValue: totalTaxable,
      totalTaxValue: totalTax,
      grandTotal,
      termsAndConditions: [
        'Goods dispatched under Rule 55 of Central Goods & Services Tax (CGST) Rules, 2017.',
        'Recipient must verify carton tamper-evident security seals before endorsing the consignment receipt.',
        'Any discrepancy, shortage or transit damage must be notified within 48 hours with photographic evidence.',
        'Subject to local jurisdiction courts at consignor plant location.'
      ],
      authorizedSignatory: 'Rajesh K. Varma (Logistics & Dispatch Supervisor)',
      remarks: dispatch.notes || 'All cartons packed with desiccant pouches and VCI anti-corrosion film.'
    };
  },

  /**
   * Generates initial carrier details with milestones
   */
  generateInitialCarrierDetails(dispatch: Partial<Dispatch>): CarrierDetails {
    const now = new Date();
    const lrDate = dispatch.dispatchDate || now.toISOString().split('T')[0];
    
    return {
      transporter: dispatch.transporter || 'SafeExpress Logistics India',
      transporterGstin: dispatch.carrierGstin || '27AABCS8891P1ZX',
      trackingUrl: `https://track.carrier.in/status?lr=${dispatch.lrNumber || 'LR-890122'}`,
      lrNumber: dispatch.lrNumber || dispatch.LRNumber || 'LR-890122',
      lrDate,
      vehicleNumber: dispatch.vehicleNumber || 'MH-12-PQ-9876',
      vehicleType: dispatch.vehicleType || '14ft Closed Container (4.5 Ton)',
      driverName: dispatch.driverName || 'Sukhdev Singh',
      driverPhone: dispatch.driverPhone || '9440612345',
      driverDlNumber: dispatch.driverDlNumber || 'MH12 20180045920',
      dispatchBay: dispatch.dispatchBay || 'Bay #3 (North Loading Dock)',
      departureTime: '10:30 AM',
      etaDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      sealNumber: 'SEAL-IND-884920',
      odometerStartKm: 42150,
      milestones: [
        {
          id: 'ms_1',
          timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          status: 'Cartons Staged & Inspected',
          location: 'Plant Warehouse - Bay #3',
          note: 'All cartons weighed, barcoded, and tamper-proof seals applied.',
          updatedBy: 'R. Varma (Dispatch Supervisor)'
        },
        {
          id: 'ms_2',
          timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
          status: 'Loaded on Vehicle & Gate Pass Issued',
          location: 'Factory Security Gate #2',
          note: `Vehicle ${dispatch.vehicleNumber || 'MH-12-PQ-9876'} cleared with Gate Pass #GP-9014. Driver verified.`,
          updatedBy: 'S. Patil (Gate Officer)'
        },
        {
          id: 'ms_3',
          timestamp: new Date().toISOString(),
          status: 'In Transit on Highway',
          location: 'Pune - Mumbai Express Corridor (Toll Km 48)',
          note: 'Consignment moving smoothly. Expected arrival tomorrow 11:00 AM.',
          updatedBy: 'Transporter Telematics Sync'
        }
      ]
    };
  },

  /**
   * Save and sync updated dispatch details (cartons, e-way bill, dispatch note, carrier)
   */
  async saveDispatch(tenantId: string, dispatch: Dispatch): Promise<void> {
    const isSandbox = localStorage.getItem('isSandboxMode') === 'true' || !db;

    if (isSandbox) {
      const cached = localStorage.getItem(`dispatches_${tenantId}`);
      let list: Dispatch[] = [];
      if (cached) {
        list = JSON.parse(cached);
      }
      const existingIdx = list.findIndex(d => d.id === dispatch.id);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...dispatch };
      } else {
        list.unshift(dispatch);
      }
      localStorage.setItem(`dispatches_${tenantId}`, JSON.stringify(list));
    } else {
      // Live Firestore update
      try {
        const docRef = doc(db, 'tenants', tenantId, 'dispatches', dispatch.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, { ...dispatch });
        }
      } catch (err) {
        console.warn('Firestore update fallback to local cache:', err);
        const cached = localStorage.getItem(`dispatches_${tenantId}`) || '[]';
        const list = JSON.parse(cached);
        const idx = list.findIndex((d: any) => d.id === dispatch.id);
        if (idx >= 0) list[idx] = dispatch; else list.unshift(dispatch);
        localStorage.setItem(`dispatches_${tenantId}`, JSON.stringify(list));
      }
    }

    // Trigger reactive event so all components update immediately
    window.dispatchEvent(new CustomEvent('dispatch_updated', { detail: { dispatchId: dispatch.id } }));
  }
};
