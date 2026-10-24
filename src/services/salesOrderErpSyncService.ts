// src/services/salesOrderErpSyncService.ts

import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { Order, QuoteItem } from '../types';
import { 
  ErpSalesOrder, 
  ErpSalesOrderItem, 
  SalesOrderMappingResult, 
  SalesOrderSyncStats 
} from '../types/salesOrderErpSync';
import { 
  generateWorkOrdersFromSalesOrder, 
  explodeBomForSalesOrderItem, 
  getDefaultRoutingForPart 
} from './workOrderGenerationService';
import { WorkOrder } from '../types/workOrder';

const ERP_SO_STORAGE_KEY = 'flowops_erp_sales_orders_v1';

const INITIAL_ERP_SALES_ORDERS: ErpSalesOrder[] = [
  {
    id: 'erp-so-101',
    tenantId: 'demo',
    erpSoNumber: 'SO-TALLY-2026-8810',
    erpSystem: 'tally',
    customerPoNumber: 'PO-TATA-CVBU-8812',
    customerCode: 'CUST-TATA-01',
    customerName: 'Tata Motors Precision CVBU',
    customerPhone: '+91 98200 44102',
    customerEmail: 'procurement.cvbu@tatamotors.com',
    orderDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString().split('T')[0],
    requestedDeliveryDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    totalAmount: 217710,
    taxAmount: 33210,
    status: 'pending_import',
    priority: 'urgent',
    shippingAddress: 'Plant Gate 4, CVBU Inward Receiving Bay, Pimpri, Pune - 411018',
    billingAddress: 'Gaurav Path, Pimpri Works, Pune, Maharashtra - 411018',
    paymentTerms: 'Net 30 Days',
    plantId: 'plant-pune',
    pulledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'it-so-1',
        itemCode: 'FG-SPUR-GEAR-M4',
        itemName: 'Forged Steel Spur Gear (Mod 4, 32T)',
        orderedQuantity: 45,
        uom: 'Nos',
        unitPrice: 4100,
        gstRatePct: 18,
        lineTotal: 184500,
        hasBomInFlowOps: true
      }
    ]
  },
  {
    id: 'erp-so-102',
    tenantId: 'demo',
    erpSoNumber: 'ORA-SO-2026-9041',
    erpSystem: 'oracle',
    customerPoNumber: 'PO-KIRLOSKAR-7729',
    customerCode: 'CUST-KIRLOSKAR-02',
    customerName: 'Kirloskar Heavy Transmission Systems',
    customerPhone: '+91 94220 55180',
    customerEmail: 'supplychain@kirloskar.co.in',
    orderDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString().split('T')[0],
    requestedDeliveryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    totalAmount: 403560,
    taxAmount: 61560,
    status: 'pending_import',
    priority: 'high',
    shippingAddress: 'Assembly Bay 2, Heavy Machining Yard, Kirloskarwadi, Sangli - 416308',
    billingAddress: 'Kirloskarwadi, Sangli, Maharashtra - 416308',
    paymentTerms: 'Net 45 Days',
    plantId: 'plant-pune',
    pulledAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'it-so-2',
        itemCode: 'BOM-FLANGE-HSG-4140',
        itemName: 'Precision CNC Flange Housing (AISI 4140)',
        orderedQuantity: 24,
        uom: 'Nos',
        unitPrice: 14250,
        gstRatePct: 18,
        lineTotal: 342000,
        hasBomInFlowOps: true
      }
    ]
  },
  {
    id: 'erp-so-103',
    tenantId: 'demo',
    erpSoNumber: 'SO-TALLY-2026-8815',
    erpSystem: 'tally',
    customerPoNumber: 'PO-BHARAT-AUTO-6610',
    customerCode: 'CUST-BHARAT-03',
    customerName: 'Bharat Precision Automotives Ltd.',
    customerPhone: '+91 94440 12890',
    customerEmail: 'procure@bharatprecision.in',
    orderDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
    requestedDeliveryDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    totalAmount: 114224,
    taxAmount: 17424,
    status: 'pending_import',
    priority: 'normal',
    shippingAddress: 'Dock 3, Tier-1 Powertrain Supply Center, Oragadam, Chennai - 602105',
    billingAddress: 'Oragadam Industrial Corridor, Chennai, Tamil Nadu - 602105',
    paymentTerms: 'Net 30 Days',
    plantId: 'plant-vadodara',
    pulledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'it-so-3',
        itemCode: 'SHAFT-SPLINED-45',
        itemName: 'Splined Drive Shaft (Dia 45mm x 320mm)',
        orderedQuantity: 32,
        uom: 'Nos',
        unitPrice: 3025,
        gstRatePct: 18,
        lineTotal: 96800,
        hasBomInFlowOps: true
      }
    ]
  },
  {
    id: 'erp-so-104',
    tenantId: 'demo',
    erpSoNumber: 'SAP-SO-2026-4402',
    erpSystem: 'sap',
    customerPoNumber: 'PO-HAL-AERO-5501',
    customerCode: 'CUST-HAL-04',
    customerName: 'Hindustan Aeronautics Component Division',
    customerPhone: '+91 80 2522 9901',
    customerEmail: 'vendor.management@hal-india.co.in',
    orderDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString().split('T')[0],
    requestedDeliveryDate: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    totalAmount: 604160,
    taxAmount: 92160,
    status: 'pending_import',
    priority: 'high',
    shippingAddress: 'Aero Structures Receiving Hangar #2, HAL Bengaluru, Karnataka - 560017',
    billingAddress: 'Old Airport Road, Vimanapura, Bengaluru - 560017',
    paymentTerms: 'Net 60 Days',
    plantId: 'plant-pune',
    pulledAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'it-so-4',
        itemCode: 'BRKT-TITANIUM-AERO',
        itemName: 'Titanium Ti-6Al-4V Actuator Bracket',
        orderedQuantity: 16,
        uom: 'Nos',
        unitPrice: 32000,
        gstRatePct: 18,
        lineTotal: 512000,
        hasBomInFlowOps: true
      }
    ]
  }
];

export const salesOrderErpSyncService = {
  /**
   * Retrieves all ERP sales orders stored locally or initialized
   */
  getErpSalesOrders(tenantId: string): ErpSalesOrder[] {
    try {
      const cached = localStorage.getItem(`${ERP_SO_STORAGE_KEY}_${tenantId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed reading cached ERP sales orders:', e);
    }

    // Default initialization
    const list = INITIAL_ERP_SALES_ORDERS.map(o => ({ ...o, tenantId }));
    try {
      localStorage.setItem(`${ERP_SO_STORAGE_KEY}_${tenantId}`, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving initial ERP sales orders:', e);
    }
    return list;
  },

  /**
   * Pulls new sales orders from ERP (Simulated / live API poll)
   */
  async pullSalesOrdersFromErp(
    tenantId: string, 
    erpSystem: 'tally' | 'oracle' | 'sap' | 'all' = 'all'
  ): Promise<{ pulledCount: number; newOrders: ErpSalesOrder[] }> {
    // Simulate API latency
    await new Promise(r => setTimeout(r, 750));

    const existing = this.getErpSalesOrders(tenantId);
    
    // Check if any existing orders in FlowOps match to update statuses
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);
    let flowOpsOrders: Order[] = [];

    if (isSandbox) {
      try {
        const cached = localStorage.getItem(`orders_${tenantId}`);
        if (cached) flowOpsOrders = JSON.parse(cached);
      } catch (e) {
        console.warn('Error reading FlowOps orders:', e);
      }
    }

    // Update statuses of any that match by customerPoNumber
    const updatedList = existing.map(erpSo => {
      const matched = flowOpsOrders.find(fo => 
        (fo.customerPoNumber && fo.customerPoNumber === erpSo.customerPoNumber) ||
        (fo.orderNumber && fo.orderNumber.includes(erpSo.erpSoNumber))
      );
      if (matched) {
        return {
          ...erpSo,
          status: (matched.status === 'in-production' ? 'wo_generated' : 'imported') as any,
          flowOpsOrderId: matched.id,
          flowOpsOrderNumber: matched.orderNumber
        };
      }
      return erpSo;
    });

    try {
      localStorage.setItem(`${ERP_SO_STORAGE_KEY}_${tenantId}`, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed saving updated ERP SOs:', e);
    }

    const newOrders = updatedList.filter(o => o.status === 'pending_import');
    return {
      pulledCount: newOrders.length,
      newOrders
    };
  },

  /**
   * Maps an ERP Sales Order into FlowOps Sales Order and Auto-Generates Work Orders
   */
  async importSalesOrderAndGenerateWOs(
    tenantId: string,
    erpSoId: string,
    options: {
      autoGenerateWOs: boolean;
      actorName?: string;
      actorId?: string;
      targetPlantId?: string;
    } = { autoGenerateWOs: true }
  ): Promise<SalesOrderMappingResult> {
    const list = this.getErpSalesOrders(tenantId);
    const soIdx = list.findIndex(o => o.id === erpSoId);
    if (soIdx === -1) throw new Error(`ERP Sales Order ${erpSoId} not found`);

    const erpSo = list[soIdx];
    const isSandbox = typeof window !== 'undefined' && (localStorage.getItem('isSandboxMode') === 'true' || !db);

    // 1. Generate FlowOps Order Number
    const currentYear = new Date().getFullYear();
    const orderSeq = Math.floor(1000 + Math.random() * 9000);
    const flowOpsOrderNumber = `ORD-${currentYear}-${orderSeq}`;
    const flowOpsOrderId = `ord_erp_${Date.now().toString().slice(-6)}`;

    // 2. Map line items to FlowOps QuoteItem
    const quoteItems: QuoteItem[] = erpSo.items.map((it, idx) => ({
      id: `item_${flowOpsOrderId}_${idx + 1}`,
      name: it.itemName,
      quantity: it.orderedQuantity,
      unitPrice: it.unitPrice,
      gstPercent: it.gstRatePct,
      total: it.lineTotal
    }));

    // 3. Construct FlowOps Order object
    const createdOrder: Order = {
      id: flowOpsOrderId,
      tenantId,
      orderNumber: flowOpsOrderNumber,
      customerPoNumber: erpSo.customerPoNumber,
      customerName: erpSo.customerName,
      customerEmail: erpSo.customerEmail,
      phone: erpSo.customerPhone,
      billingAddress: erpSo.billingAddress,
      shippingAddress: erpSo.shippingAddress,
      deliveryDate: erpSo.requestedDeliveryDate,
      totalAmount: erpSo.totalAmount,
      taxAmount: erpSo.taxAmount,
      subtotal: erpSo.totalAmount - erpSo.taxAmount,
      status: options.autoGenerateWOs ? 'in-production' : 'pending',
      items: quoteItems,
      plantId: options.targetPlantId || erpSo.plantId || 'plant-pune',
      quoteId: `quote_${erpSo.erpSoNumber}`,
      createdBy: options.actorId || 'system_erp_sync',
      createdAt: new Date().toISOString()
    };

    // 4. Save Order into FlowOps database
    if (isSandbox) {
      try {
        const cachedOrders: Order[] = JSON.parse(localStorage.getItem(`orders_${tenantId}`) || '[]');
        localStorage.setItem(`orders_${tenantId}`, JSON.stringify([createdOrder, ...cachedOrders]));
      } catch (e) {
        console.warn('Sandbox order persistence error:', e);
      }
    } else if (db) {
      try {
        await setDoc(doc(db, 'orders', createdOrder.id), createdOrder);
      } catch (e) {
        console.warn('Firestore order persistence error:', e);
      }
    }

    // 5. Auto-Generate Work Orders if enabled
    let generatedWorkOrders: WorkOrder[] = [];

    if (options.autoGenerateWOs) {
      try {
        // Read stock items for BOM explosion lookup
        let stockItems: any[] = [];
        try {
          const cachedStock = localStorage.getItem(`stock_items_${tenantId}`);
          if (cachedStock) stockItems = JSON.parse(cachedStock);
        } catch {
          // fallback
        }

        const itemsToGenerate = erpSo.items.map((it, idx) => {
          const quoteItem = quoteItems[idx] || {
            id: it.id,
            name: it.itemName,
            quantity: it.orderedQuantity,
            unitPrice: it.unitPrice,
            gstPercent: it.gstRatePct,
            total: it.lineTotal
          };
          const explodedBom = explodeBomForSalesOrderItem(
            quoteItem,
            it.orderedQuantity,
            stockItems
          );
          const routing = getDefaultRoutingForPart(it.itemName);

          return {
            salesOrderItemId: it.id,
            partName: it.itemName,
            partCode: it.itemCode,
            quantity: it.orderedQuantity,
            unitPrice: it.unitPrice,
            priority: (erpSo.priority === 'urgent' ? 'urgent' : erpSo.priority === 'high' ? 'high' : 'medium') as any,
            dueDate: erpSo.requestedDeliveryDate,
            explodedBom,
            routing
          };
        });

        const woResult = await generateWorkOrdersFromSalesOrder({
          tenantId,
          order: createdOrder,
          plantId: createdOrder.plantId,
          itemsToGenerate,
          actor: {
            userId: options.actorId || 'planner_erp_daemon',
            displayName: options.actorName || 'Production Planner (ERP Sync)',
            email: 'planning@flowops.internal'
          },
          isSandboxMode: isSandbox
        });

        generatedWorkOrders = woResult.generatedWorkOrders;
      } catch (woErr) {
        console.warn('Auto work order generation warning:', woErr);
      }
    }

    // 6. Update ERP Sales Order record state
    const generatedWoNumbers = generatedWorkOrders.map(w => w.orderNumber);
    const updatedErpSo: ErpSalesOrder = {
      ...erpSo,
      status: generatedWorkOrders.length > 0 ? 'wo_generated' : 'imported',
      flowOpsOrderId,
      flowOpsOrderNumber,
      generatedWorkOrderNumbers: generatedWoNumbers,
      importedAt: new Date().toISOString(),
      items: erpSo.items.map((it, i) => ({
        ...it,
        workOrderId: generatedWorkOrders[i]?.id,
        workOrderNumber: generatedWorkOrders[i]?.orderNumber
      }))
    };

    list[soIdx] = updatedErpSo;
    try {
      localStorage.setItem(`${ERP_SO_STORAGE_KEY}_${tenantId}`, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving updated ERP SO list:', e);
    }

    return {
      erpSo: updatedErpSo,
      flowOpsOrder: createdOrder,
      matchedCustomer: true,
      matchedItemsCount: erpSo.items.length,
      bomExploded: generatedWorkOrders.length > 0,
      workOrdersGenerated: generatedWorkOrders
    };
  },

  /**
   * Bulk import and generation for multiple ERP sales orders
   */
  async bulkImportAndGenerateWOs(
    tenantId: string,
    erpSoIds: string[],
    options: {
      autoGenerateWOs: boolean;
      actorName?: string;
      actorId?: string;
    }
  ): Promise<SalesOrderMappingResult[]> {
    const results: SalesOrderMappingResult[] = [];
    for (const id of erpSoIds) {
      const res = await this.importSalesOrderAndGenerateWOs(tenantId, id, options);
      results.push(res);
    }
    return results;
  },

  /**
   * Computes quick KPI statistics
   */
  getStats(tenantId: string): SalesOrderSyncStats {
    const list = this.getErpSalesOrders(tenantId);
    const pendingImportCount = list.filter(o => o.status === 'pending_import').length;
    const importedToFlowOpsCount = list.filter(o => o.status === 'imported' || o.status === 'wo_generated').length;
    const workOrdersGeneratedCount = list.filter(o => o.status === 'wo_generated').length;
    const totalValueINR = list.reduce((acc, o) => acc + o.totalAmount, 0);

    return {
      totalErpOrdersPulled: list.length,
      pendingImportCount,
      importedToFlowOpsCount,
      workOrdersGeneratedCount,
      totalValueINR
    };
  }
};
