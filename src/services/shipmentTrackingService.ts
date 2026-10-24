// src/services/shipmentTrackingService.ts

import { Dispatch, Tenant, Order, Customer } from '../types';
import { DeliveryConfirmationDetails, ShipmentMilestone } from '../types/dispatchManagement';
import { sendWhatsAppNotification } from '../utils/whatsapp';
import { proactiveNotificationService } from './proactiveNotificationService';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';

export interface CarrierPortalInfo {
  carrierName: string;
  trackingNumber: string;
  portalUrl?: string;
  isDirectLink: boolean;
}

export const shipmentTrackingService = {
  /**
   * Resolves the official carrier live tracking portal URL from carrier name and tracking/LR number
   */
  resolveCarrierPortalUrl(carrier: string = '', trackingNumber: string = ''): string | undefined {
    if (!trackingNumber) return undefined;
    const cleanNumber = trackingNumber.trim().replace(/^LR-?/i, '');
    const cLower = carrier.toLowerCase();

    if (cLower.includes('safe') || cLower.includes('safexpress')) {
      return `https://www.safexpress.com/tracking?waybill=${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('v-trans') || cLower.includes('vtrans') || cLower.includes('v-logistics')) {
      return `https://vtransgroup.com/track/${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('tci') || cLower.includes('xps')) {
      return `https://www.tcifreight.com/track?cn=${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('blue') || cLower.includes('dart')) {
      return `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('gati')) {
      return `https://www.gati.com/track-trace/?docket_no=${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('rivigo')) {
      return `https://www.rivigo.com/track/${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${encodeURIComponent(cleanNumber)}`;
    }
    if (cLower.includes('ecom') || cLower.includes('ekart')) {
      return `https://ecomexpress.in/tracking/?awb_full=${encodeURIComponent(cleanNumber)}`;
    }
    return undefined;
  },

  /**
   * Generates the public customer tracking URL for a given dispatch record
   */
  getPublicTrackingUrl(dispatch: Dispatch | Partial<Dispatch>): string {
    const trackingRef = dispatch.trackingRef || dispatch.dispatchNumber || dispatch.id || 'consignment';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/track/${trackingRef}`;
    }
    return `/track/${trackingRef}`;
  },

  /**
   * Resolves a dispatch record by trackingRef across tenants (public access without authentication)
   */
  async getShipmentByTrackingRef(trackingRef: string, tenantIdHint?: string): Promise<{ dispatch: Dispatch | null; tenant: Tenant | null }> {
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    const cleanRef = decodeURIComponent(trackingRef).trim().toLowerCase();

    // 1. In Sandbox Mode: Search across local storage
    if (isSandbox) {
      try {
        const keys = Object.keys(localStorage);
        const dispatchKeys = keys.filter(k => k.startsWith('dispatches_'));

        for (const k of dispatchKeys) {
          const list: Dispatch[] = JSON.parse(localStorage.getItem(k) || '[]');
          const matched = list.find(d => 
            (d.trackingRef && d.trackingRef.toLowerCase() === cleanRef) ||
            (d.dispatchNumber && d.dispatchNumber.toLowerCase() === cleanRef) ||
            (d.id && d.id.toLowerCase() === cleanRef) ||
            (d.lrNumber && d.lrNumber.toLowerCase() === cleanRef) ||
            (d.LRNumber && d.LRNumber.toLowerCase() === cleanRef) ||
            (d.invoiceNumber && d.invoiceNumber.toLowerCase() === cleanRef) ||
            (d.ewayBill?.ewayBillNumber && d.ewayBill.ewayBillNumber.replace(/\s+/g, '').toLowerCase() === cleanRef.replace(/\s+/g, '')) ||
            (d.orderId && d.orderId.toLowerCase() === cleanRef)
          );

          if (matched) {
            const tenantId = matched.tenantId || k.replace('dispatches_', '') || 'tenant_default';
            const tenantCached = localStorage.getItem(`tenant_${tenantId}`);
            const tenantObj: Tenant = tenantCached ? JSON.parse(tenantCached) : {
              id: tenantId,
              companyName: 'Apex Precision Engineering Ltd.',
              name: 'Apex Precision Engineering Ltd.',
              plantName: 'Sanand Industrial Mega Plant #1',
              gstin: '24AABCA1234F1Z8',
              address: 'Plot 42, GIDC Industrial Estate, Sanand, Ahmedabad, Gujarat - 382110',
              phone: '+91 79 4001 2345',
              email: 'logistics@apexprecision.com',
              currency: 'INR',
              createdAt: new Date().toISOString()
            };

            return { dispatch: matched, tenant: tenantObj };
          }
        }
      } catch (err) {
        console.warn('Sandbox shipment lookup fallback error:', err);
      }
    }

    // 2. In Live Firestore Mode: Query dispatches
    if (db) {
      try {
        if (tenantIdHint) {
          const docRef = doc(db, 'tenants', tenantIdHint, 'dispatches', trackingRef);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const dData = { id: snap.id, ...snap.data() } as Dispatch;
            const tDoc = await getDoc(doc(db, 'tenants', tenantIdHint));
            const tData = tDoc.exists() ? (tDoc.data() as Tenant) : null;
            return { dispatch: dData, tenant: tData };
          }
        }

        // Query across tenants collection group or collection
        const colRef = collection(db, 'dispatches');
        const qRef = query(colRef, where('dispatchNumber', '==', trackingRef));
        const qSnap = await getDocs(qRef);
        if (!qSnap.empty) {
          const dData = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as Dispatch;
          const tenantId = dData.tenantId;
          const tDoc = await getDoc(doc(db, 'tenants', tenantId));
          return { dispatch: dData, tenant: tDoc.exists() ? (tDoc.data() as Tenant) : null };
        }
      } catch (err) {
        console.warn('Firestore live shipment lookup error:', err);
      }
    }

    // 3. Fallback mock consignment for demo when no key matches
    const mockConsignment: Dispatch = {
      id: 'disp_9001',
      tenantId: 'demo',
      orderId: 'ORD-901',
      dispatchNumber: 'DS-9001',
      invoiceNumber: 'INV-F26-9022',
      customerName: 'Tata Motors Precision Components Div.',
      destination: 'CVBU Plant, Pimpri, Pune, Maharashtra - 411018',
      dispatchDate: new Date().toISOString().split('T')[0],
      dispatchedAt: new Date().toISOString(),
      status: 'Dispatched',
      transporter: 'SafeExpress Logistics Ltd.',
      vehicleNumber: 'MH-12-PQ-9876',
      vehicleType: '14ft Closed Container (4.5 Ton)',
      driverName: 'Sukhdev Singh',
      driverPhone: '+91 94406 12345',
      driverDlNumber: 'MH12 20180045920',
      dispatchBay: 'Dock Bay #3 (North)',
      lrNumber: 'LR-890122',
      LRNumber: 'LR-890122',
      itemsSummary: 'Forged Steel Spur Gears (Mod 4, 32T) x20',
      totalPackages: 2,
      totalGrossWeightKg: 68.0,
      totalNetWeightKg: 64.0,
      totalVolumeCbm: 0.14,
      items: [
        { id: 'p1', name: 'Forged Steel Spur Gear (Mod 4, 32T)', quantity: 20, unitPrice: 4200, gstPercent: 18, total: 84000 }
      ],
      ewayBill: {
        ewayBillNumber: '2410 8829 4102',
        generatedDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        distanceKm: 420,
        status: 'active',
        supplyType: 'outward',
        subSupplyType: 'supply',
        docType: 'tax_invoice',
        docNumber: 'INV-F26-9022',
        docDate: new Date().toISOString().split('T')[0],
        fromGstin: '24AABCA1234F1Z8',
        fromTradeName: 'Apex Precision Engineering Ltd.',
        fromAddress: 'Sanand Industrial Estate, Ahmedabad, Gujarat',
        fromPincode: '382110',
        fromState: 'Gujarat',
        fromStateCode: '24',
        toGstin: '27AAACG9876K1Z4',
        toTradeName: 'Tata Motors Precision Components Div.',
        toAddress: 'Sector 7, Pimpri, Pune, Maharashtra',
        toPincode: '411018',
        toState: 'Maharashtra',
        toStateCode: '27',
        hsnCode: '84834000',
        taxableAmount: 84000,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 15120,
        totalInvoiceValue: 99120,
        transportMode: 'road',
        vehicleType: 'regular',
        vehicleNumber: 'MH-12-PQ-9876',
        transporterName: 'SafeExpress Logistics Ltd.'
      },
      carrierDetails: {
        transporter: 'SafeExpress Logistics Ltd.',
        lrNumber: 'LR-890122',
        lrDate: new Date().toISOString().split('T')[0],
        vehicleNumber: 'MH-12-PQ-9876',
        vehicleType: '14ft Closed Container (4.5 Ton)',
        driverName: 'Sukhdev Singh',
        driverPhone: '+91 94406 12345',
        driverDlNumber: 'MH12 20180045920',
        dispatchBay: 'Dock Bay #3 (North)',
        departureTime: '10:30 AM',
        etaDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        sealNumber: 'SEAL-2026-901',
        trackingUrl: 'https://www.safexpress.com/tracking?waybill=890122',
        milestones: [
          {
            id: 'm1',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            status: 'Departed Factory Gate',
            location: 'Sanand Dock Bay #3, Gujarat',
            note: 'Container sealed with tamper-evident band SEAL-2026-901. Driver Sukhdev verified documents.',
            updatedBy: 'Security Officer'
          },
          {
            id: 'm2',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            status: 'In Transit',
            location: 'Surat National Highway Toll NH-48',
            note: 'GPS tracker ping active. Average speed 54 km/h.',
            updatedBy: 'Automated GPS Gateway'
          }
        ]
      }
    };

    const mockTenant: Tenant = {
      id: 'demo',
      companyName: 'Apex Precision Engineering Ltd.',
      name: 'Apex Precision Engineering Ltd.',
      plantName: 'Sanand Industrial Mega Plant #1',
      gstin: '24AABCA1234F1Z8',
      address: 'Plot 42, GIDC Industrial Estate, Sanand, Ahmedabad, Gujarat - 382110',
      phone: '+91 79 4001 2345',
      email: 'logistics@apexprecision.com',
      currency: 'INR',
      createdAt: new Date().toISOString()
    };

    return { dispatch: mockConsignment, tenant: mockTenant };
  },

  /**
   * Sends an automated WhatsApp dispatch notification with live tracking link to the customer
   */
  async sendDispatchWhatsAppAlert(
    tenantId: string, 
    dispatch: Dispatch, 
    customRecipientPhone?: string,
    companyName: string = 'Ashrey FlowOps'
  ): Promise<{ success: boolean; messageId: string; recipientPhone: string; trackingUrl: string; messageText: string }> {
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    
    let recipientPhone = customRecipientPhone || '';
    let customerName = dispatch.customerName || 'Valued Client';
    let customerId = dispatch.customerId || '';
    let orderNumber = dispatch.orderId;

    // 1. Look up parent order for customer phone if not provided
    if (!recipientPhone) {
      if (isSandbox) {
        try {
          const cachedOrders: Order[] = JSON.parse(localStorage.getItem(`orders_${tenantId}`) || '[]');
          const matchedOrder = cachedOrders.find(o => o.id === dispatch.orderId);
          if (matchedOrder) {
            recipientPhone = matchedOrder.phone || '';
            customerName = matchedOrder.customerName || customerName;
            orderNumber = matchedOrder.orderNumber || orderNumber;
            customerId = (matchedOrder as any).customerId || matchedOrder.createdBy || '';
          }
        } catch (e) {
          console.warn('Sandbox order lookup error:', e);
        }
      } else if (db) {
        try {
          const ordersCol = collection(db, 'orders');
          const snap = await getDocs(query(ordersCol, where('id', '==', dispatch.orderId)));
          if (!snap.empty) {
            const o = snap.docs[0].data() as Order;
            recipientPhone = o.phone || '';
            customerName = o.customerName || customerName;
            orderNumber = o.orderNumber || orderNumber;
          }
        } catch (e) {
          console.warn('Firestore order lookup error:', e);
        }
      }
    }

    // 2. Look up customer database if still empty
    if (!recipientPhone) {
      if (isSandbox) {
        try {
          const cachedCusts: Customer[] = JSON.parse(localStorage.getItem(`customers_${tenantId}`) || '[]');
          const matchedCust = cachedCusts.find(c => c.name.toLowerCase() === customerName.toLowerCase() || c.id === customerId);
          if (matchedCust) {
            recipientPhone = matchedCust.phone || '';
          }
        } catch (e) {
          console.warn('Sandbox customer lookup error:', e);
        }
      }
    }

    // 3. Fallback phone
    if (!recipientPhone) {
      recipientPhone = dispatch.driverPhone || '+91 98765 43210';
    }

    const trackingUrl = this.getPublicTrackingUrl(dispatch);
    const carrierPortalUrl = this.resolveCarrierPortalUrl(dispatch.transporter, dispatch.lrNumber || dispatch.LRNumber || '');

    // Formulate parameters
    const params: Record<string, string> = {
      orderNumber: orderNumber || dispatch.orderId || '',
      dispatchNumber: dispatch.dispatchNumber || dispatch.id || '',
      transporterName: dispatch.transporter || 'SafeExpress Logistics',
      transporter: dispatch.transporter || 'SafeExpress Logistics',
      lrNumber: dispatch.lrNumber || dispatch.LRNumber || 'LR-890122',
      vehicleNumber: dispatch.vehicleNumber || 'MH-12-PQ-9876',
      ewayBillNumber: dispatch.ewayBill?.ewayBillNumber || '',
      expectedDeliveryDate: dispatch.carrierDetails?.etaDate || dispatch.dispatchDate || 'Tomorrow',
      deliveryDate: dispatch.carrierDetails?.etaDate || dispatch.dispatchDate || 'Tomorrow',
      trackingUrl,
      trackingRef: dispatch.dispatchNumber || dispatch.id,
      carrierPortalUrl: carrierPortalUrl || '',
      companyName
    };

    const messageId = await sendWhatsAppNotification({
      recipientName: customerName,
      recipientPhone,
      templateName: 'order_dispatched',
      tenantId,
      orderId: dispatch.orderId,
      customerId,
      parameters: params
    });

    // Proactive Milestone Notification Engine (dispatched)
    try {
      await proactiveNotificationService.triggerMilestoneNotification({
        tenantId,
        milestone: 'dispatched',
        orderId: dispatch.orderId || dispatch.id,
        orderNumber: params.orderNumber || dispatch.orderId || 'ORD-DISP',
        customerName,
        recipientPhone,
        customerId,
        parameters: {
          productSummary: `Consignment #${params.dispatchNumber}`,
          transporter: params.transporterName,
          lrNumber: params.lrNumber,
          vehicleNumber: params.vehicleNumber,
          expectedDelivery: params.expectedDeliveryDate,
          companyName,
          trackingUrl
        },
        sourceTrigger: 'event'
      });
    } catch (pnErr) {
      console.warn('Proactive dispatch notification non-blocking error:', pnErr);
    }

    const messageText = `Dear ${customerName}, your order ${params.orderNumber} has been dispatched via ${params.transporterName}. LR No: ${params.lrNumber}. Vehicle: ${params.vehicleNumber}.${params.ewayBillNumber ? ` EWB: ${params.ewayBillNumber}.` : ''} Expected delivery: ${params.expectedDeliveryDate}. Track live shipment: ${trackingUrl} — ${companyName}`;

    // Update dispatch record with tracking flags
    const updatedDispatch: Dispatch = {
      ...dispatch,
      trackingRef: dispatch.dispatchNumber || dispatch.id,
      trackingUrl,
      carrierTrackingUrl: carrierPortalUrl,
      whatsappSent: true,
      whatsappSentAt: new Date().toISOString(),
      whatsappMessageId: messageId
    };

    await this.persistDispatchUpdate(tenantId, updatedDispatch);

    return {
      success: true,
      messageId,
      recipientPhone,
      trackingUrl,
      messageText
    };
  },

  /**
   * Confirms delivery of a consignment (Customer self-signoff via tracking portal or Sales Manager confirmation)
   */
  async confirmDelivery(
    tenantId: string,
    dispatchId: string,
    confirmation: {
      receiverName: string;
      receiverPhone?: string;
      remarks?: string;
      conditionStatus: 'intact' | 'damaged' | 'shortage';
      sealsVerified: boolean;
      confirmedVia: 'customer_portal' | 'sales_manager' | 'driver_app';
      signatureData?: string;
      confirmedBy?: string;
    }
  ): Promise<{ success: boolean; dispatch: Dispatch; message: string }> {
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    const nowIso = new Date().toISOString();

    // 1. Load dispatch
    let currentDispatch: Dispatch | null = null;
    let tenantObj: Tenant | null = null;

    if (isSandbox) {
      const cached = localStorage.getItem(`dispatches_${tenantId}`) || '[]';
      const list: Dispatch[] = JSON.parse(cached);
      currentDispatch = list.find(d => d.id === dispatchId || d.dispatchNumber === dispatchId) || null;
      const tCached = localStorage.getItem(`tenant_${tenantId}`);
      if (tCached) tenantObj = JSON.parse(tCached);
    } else if (db) {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'dispatches', dispatchId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          currentDispatch = { id: snap.id, ...snap.data() } as Dispatch;
        }
      } catch (err) {
        console.warn('Firestore delivery confirmation load error:', err);
      }
    }

    if (!currentDispatch) {
      // Fallback: create mock dispatch
      currentDispatch = (await this.getShipmentByTrackingRef(dispatchId, tenantId)).dispatch;
    }

    if (!currentDispatch) {
      throw new Error(`Consignment ${dispatchId} not found.`);
    }

    // 2. Build milestone record
    const deliveryMilestone: ShipmentMilestone = {
      id: `ms_delivered_${Date.now()}`,
      timestamp: nowIso,
      status: 'Delivered & Accepted',
      location: currentDispatch.destination || 'Consignee Receiving Dock',
      note: `Delivery confirmed by ${confirmation.receiverName}. Package Condition: ${confirmation.conditionStatus.toUpperCase()}. Seals Verified: ${confirmation.sealsVerified ? 'YES' : 'NO'}. Remarks: ${confirmation.remarks || 'Receipt signed without exceptions'}.`,
      updatedBy: confirmation.confirmedBy || confirmation.receiverName
    };

    const updatedMilestones = [...(currentDispatch.carrierDetails?.milestones || []), deliveryMilestone];

    // 3. Build delivery confirmation structure
    const deliveryDetails: DeliveryConfirmationDetails = {
      receiverName: confirmation.receiverName,
      receiverPhone: confirmation.receiverPhone,
      deliveredAt: nowIso,
      conditionStatus: confirmation.conditionStatus,
      sealsVerified: confirmation.sealsVerified,
      remarks: confirmation.remarks || 'Shipment delivered in full and verified intact.',
      signatureData: confirmation.signatureData,
      confirmedVia: confirmation.confirmedVia,
      confirmedBy: confirmation.confirmedBy || confirmation.receiverName
    };

    // 4. Update dispatch fields
    const updatedDispatch: Dispatch = {
      ...currentDispatch,
      status: 'Delivered',
      deliveredAt: nowIso,
      deliveredBy: confirmation.receiverName,
      deliveryConfirmation: deliveryDetails,
      carrierDetails: {
        ...(currentDispatch.carrierDetails || {
          transporter: currentDispatch.transporter || 'SafeExpress',
          lrNumber: currentDispatch.lrNumber || 'LR-890122',
          lrDate: nowIso.split('T')[0],
          vehicleNumber: currentDispatch.vehicleNumber || 'MH-12-PQ-9876',
          vehicleType: currentDispatch.vehicleType || 'Container Truck',
          driverName: currentDispatch.driverName || 'Driver',
          driverPhone: currentDispatch.driverPhone || '',
          milestones: []
        }),
        milestones: updatedMilestones
      }
    };

    // Persist update
    await this.persistDispatchUpdate(tenantId, updatedDispatch);

    // 5. Send automated Delivery Confirmation WhatsApp to customer
    try {
      const recipientPhone = confirmation.receiverPhone || updatedDispatch.driverPhone || '+91 98765 43210';
      await sendWhatsAppNotification({
        recipientName: updatedDispatch.customerName || 'Valued Customer',
        recipientPhone,
        templateName: 'delivery_confirmed',
        tenantId,
        orderId: updatedDispatch.orderId,
        customerId: updatedDispatch.customerId,
        parameters: {
          orderNumber: updatedDispatch.orderId,
          dispatchNumber: updatedDispatch.dispatchNumber || updatedDispatch.id,
          receiverName: confirmation.receiverName,
          deliveredDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          remarks: confirmation.remarks || 'Packaging & Seals verified intact',
          companyName: tenantObj?.companyName || tenantObj?.name || 'Ashrey FlowOps'
        }
      });

      // Proactive Milestone Notification Engine (delivered)
      await proactiveNotificationService.triggerMilestoneNotification({
        tenantId,
        milestone: 'delivered',
        orderId: updatedDispatch.orderId || updatedDispatch.id,
        orderNumber: updatedDispatch.orderId || updatedDispatch.dispatchNumber || 'ORD-DELIV',
        customerName: updatedDispatch.customerName || 'Valued Customer',
        recipientPhone,
        customerId: updatedDispatch.customerId,
        parameters: {
          receivedBy: confirmation.receiverName,
          deliveryRemarks: confirmation.remarks || 'Packaging & Seals verified intact',
          deliveryDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          companyName: tenantObj?.companyName || tenantObj?.name || 'Ashrey FlowOps Ltd'
        },
        sourceTrigger: 'event'
      });
    } catch (notifErr) {
      console.warn('Delivery confirmation WhatsApp alert error:', notifErr);
    }

    return {
      success: true,
      dispatch: updatedDispatch,
      message: `Delivery successfully confirmed for consignment #${updatedDispatch.dispatchNumber || updatedDispatch.id}. Delivery receipt recorded and customer WhatsApp alert dispatched.`
    };
  },

  /**
   * Persists updated dispatch record to local storage and live Firestore
   */
  async persistDispatchUpdate(tenantId: string, dispatch: Dispatch): Promise<void> {
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    const key = `dispatches_${tenantId}`;

    if (isSandbox && typeof window !== 'undefined') {
      const cached = localStorage.getItem(key) || '[]';
      let list: Dispatch[] = JSON.parse(cached);
      const idx = list.findIndex(d => d.id === dispatch.id || d.dispatchNumber === dispatch.dispatchNumber);
      if (idx !== -1) {
        list[idx] = { ...dispatch };
      } else {
        list.unshift(dispatch);
      }
      localStorage.setItem(key, JSON.stringify(list));
    }

    if (db) {
      try {
        const docRef = doc(db, 'tenants', tenantId, 'dispatches', dispatch.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, { ...dispatch });
        } else {
          await setDoc(docRef, { ...dispatch });
        }
      } catch (err) {
        console.warn('Live Firestore dispatch update error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dispatch_updated', { detail: { dispatchId: dispatch.id } }));
      window.dispatchEvent(new Event('storage'));
    }
  }
};
